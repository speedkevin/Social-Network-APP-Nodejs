var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
// forgot password
var nodemailer = require('nodemailer');
var async = require('async');
var crypto = require('crypto');
var xoauth2 = require('xoauth2');
// Upload files
var formidable = require('formidable');
var fs = require('fs');
// Config
var config = require('../config');
var temp = '';
// Init opay
var opay_payment = require('opay_payment');
// Include LINE bot
var myBot = require('../myLineBot');
var DATA_NOT_FINISHED_MSG = "必填欄位*，沒有填寫完成。";
var DATA_NOT_VALID = "暱稱只能含英數字";
var AGE_NOT_VALID = "年齡的最大值 < 最小值，不合法。";
var HEIGHT_NOT_VALID = "身高的最大值 < 最小值，不合法。";
var WEIGHT_NOT_VALID = "體重的最大值 < 最小值，不合法。";
var ACCT_NOT_EXIST_MSG = "此帳號不存在。";
var DATA_SAVED_MAG = "資料已儲存。";
var NO_IMPEACH_INFO = "沒有填寫任何內容。";
var IMPEACH_OUT_OF_LIMIT = "檢舉內容超過250字限制。";
var ACCOUNT_STATUS_NOT_SET = "您沒有設定帳號狀態";

/***** OPay *****/
function isPaid(myDoc, otherSideDoc){
  myDoc.recomToMe_list.forEach(function(value, index, array) {
    if(value.theone_user_id === otherSideDoc.line_userid) {
      if(myDoc.recomToMe_list[index].paid_id === undefined){
        // myDoc.recomToMe_list[index].paid_id = '';
        return false;
      } else {
        // already paid
        return true;
      }
    }
  });
}

function initPaid(myDoc, otherSideDoc, already_paid_id){
  myDoc.recomToMe_list.forEach(function(value, index, array) {
    if(value.theone_user_id === otherSideDoc.line_userid) {
      if(myDoc.recomToMe_list[index].paid_id === undefined){
        myDoc.recomToMe_list[index].paid_id = already_paid_id;
        //return false;
      } else {
        // already paid
        //return true;
      }
    }
  });
}

function paying(token){
  //參數值為[PLEASE MODIFY]者，請在每次測試時給予獨特值
  //若要測試非必帶參數請將base_param內註解的參數依需求取消註解 //
  let base_param = {
      MerchantTradeNo: 'jwoc93k561hd063vhqpq', //請帶20碼uid, ex: f0a0d7e9fae1bb72bc93
      MerchantTradeDate: '2017/12/10 15:45:30', //ex: 2017/02/13 15:45:30
      TotalAmount: '100',
      TradeDesc: '測試交易描述',
      ItemName: '測試商品等',
      ReturnURL: 'http://169.254.185.16:8080',
      // ChooseSubPayment: '',
      OrderResultURL: 'http://169.254.185.16:8080/users/pay/' + token,
      NeedExtraPaidInfo: 'Y',
      // ClientBackURL: 'https://www.google.com',
      // ItemURL: 'http://item.test.tw',
      // Remark: '交易備註',
      // HoldTradeAMT: '1',
      // StoreID: '',
      // UseRedeem: ''
  };

  // 若要測試開立電子發票，請將inv_params內的"所有"參數取消註解 //
  let inv_params = {
      // RelateNumber: 'PLEASE MODIFY',  //請帶30碼uid ex: SJDFJGH24FJIL97G73653XM0VOMS4K
      // CustomerID: 'MEM_0000001',  //會員編號
      // CustomerIdentifier: '',   //統一編號
      // CustomerName: '測試買家',
      // CustomerAddr: '測試用地址',
      // CustomerPhone: '0123456789',
      // CustomerEmail: 'johndoe@test.com',
      // ClearanceMark: '2',
      // TaxType: '1',
      // CarruerType: '',
      // CarruerNum: '',
      // Donation: '2',
      // LoveCode: '',
      // Print: '1',
      // InvoiceItemName: '測試商品1|測試商品2',
      // InvoiceItemCount: '2|3',
      // InvoiceItemWord: '個|包',
      // InvoiceItemPrice: '35|10',
      // InvoiceItemTaxType: '1|1',
      // InvoiceRemark: '測試商品1的說明|測試商品2的說明',
      // DelayDay: '0',
      // InvType: '07'
  };

  let create = new opay_payment();
  let htm = create.payment_client.aio_check_out_credit_onetime(parameters = base_param, invoice = inv_params);
  console.log(htm);
  return htm;
}

router.get('/paid', function(req, res) {
  res.render('paid');
});

router.get('/pay/:token', function(req, res) {
  console.log("pay");
  var token = req.params.token.split('&');
  var userId = token[0]; // e.g. U5979300808a6bbe3ddbdf72adfd9f96d
  var theOneId = token[1]; // e.g. dog.1030.jpg
  console.log(userId);
  console.log(theOneId);

  User.findOne({ line_userid: userId }, function(err, userDoc) {
  User.findOne({ line_userid: theOneId }, function(err, theOneDoc) {

    if(isPaid(userDoc, theOneDoc) || isPaid(theOneDoc, userDoc)){
      // Get userId's / theOneId's contact
      // Push contacts
      myBot.pushContact(userId, "對方已經付款。對方資訊：userId Contact", theOneId);
      // Message.pushContact(theOneId, "對方已經付款。對方資訊：theOneId Contact", userId);
      // Save paid into DB
    } else {
      // Paying processing...
      var already_paid_id = '1234';
      console.log(already_paid_id);
      var html = paying(req.params.token);

      res.render('paying', {
        helpers: {
          html: html
        }
      });
    }
  }); // end find
  }); // end find
});

router.post('/pay/:token', function(req, res) {
  console.log("pay post token");
  console.log(req.params.token);
  console.log(req.body);
  console.log(req.body.RtnMsg);

  var url = req.url.split('/');
  console.log(url[2]);
  var doc = url[2].split('&');
  var userId = doc[0];
  var theOneId = doc[1];

  // Get userId's / theOneId's contact
  // Push contacts
  myBot.pushContact(userId, "userId Contact", theOneId);
  myBot.pushContact(theOneId, "theOneId Contact", userId);
  // Save paid into DB
  //initPaid(userDoc, theOneDoc, already_paid_id);

  req.flash('success_msg', '付款成功。');
  res.redirect('/users/paid');
});

/***** LINE *****/
/*
router.get('/contact/:token', function(req, res) {
  User.findOne({ line_userid: req.params.token }, function(err, user) {
    res.render('line-settings', {
      helpers: {
        line: user.contact.line,
        facebook: user.contact.facebook,
        mail: user.contact.mail
      }
    });
  });
});
*/

router.get('/line-impeach/:token', function(req, res) {
  res.render('line-impeach', {
    helpers: {
      token: req.params.token
    }
  });
});

router.post('/line-impeach/:token', function(req, res) {
  var token = req.params.token;
  console.log("===token===")
  console.log(token);
  var ids = token.split("&&");
  var userID = ids[0];
  var theOneID = ids[1];
  var impeach = req.body.impeach;
  // Validation
  req.checkBody('impeach', DATA_NOT_FINISHED_MSG).notEmpty();
  if(impeach === undefined || impeach === "") {
    req.flash('success_msg', NO_IMPEACH_INFO);
    return res.redirect('/users/line-impeach/' + token);
  }
  if(impeach.length > 250) {
    req.flash('success_msg', IMPEACH_OUT_OF_LIMIT);
    return res.redirect('/users/line-impeach/' + token);
  }

  // Update to database
  var errors = req.validationErrors();
  if(errors){
    res.render('line-impeach',{
      errors: errors
    });
  } else {
    User.findOne({ line_userid: userID }, function(err, user) {
      if (!user) {
        req.flash('error', ACCT_NOT_EXIST_MSG);
        return res.redirect('/users/line-impeach');
      }
      var recomList = user.recomToMe_list;
      user.markModified('self');
      recomList.forEach(function(value, index, array) {
        if(value.theone_user_id === theOneID){
          recomList[index].impeach = impeach;
        }
      });

      user.recomToMe_list = recomList;
      user.save(function (err) {
        if (err) console.log('Save unsuccessful.');
      });
    });
    req.flash('success_msg', DATA_SAVED_MAG);
    res.redirect('/users/line-impeach/' + token);
  }

});

router.get('/line-settings/:token', function(req, res) {
  /** 有userId曝露到介面的危險 **/
  User.findOne({ line_userid: req.params.token }, function(err, user) {
    var ori = "";
    if(user.self.ori_male === true){
      ori = ori + "男性 ";
    }
    if(user.self.ori_female === true){
      ori = ori + "女性 ";
    }
    if(user.self.ori_across === true){
      ori = ori + "跨性別 ";
    }
    if(user.self.ori_trans_male === true){
      ori = ori + "轉性(現為男性) ";
    }
    if(user.self.ori_trans_female === true){
      ori = ori + "轉性(現為女性) ";
    }

    res.render('line-settings', {
      helpers: {
        id: user.id,
        uid: req.params.token,
        self_location: user.self.location,
        self_sex: user.self.sex,
        self_orientation: ori,
        self_age: user.self.age,
        self_height: user.self.height,
        self_weight: user.self.weight,
        self_salary: user.self.salary,
        theone_location: user.theone.location,
        theone_location_2: user.theone.location_2,
        theone_location_3: user.theone.location_3,
        theone_location_4: user.theone.location_4,
        theone_location_5: user.theone.location_5,
        theone_min_age: user.theone.min_age,
        theone_max_age: user.theone.max_age,
        theone_min_height: user.theone.min_height,
        theone_max_height: user.theone.max_height,
        theone_min_weight: user.theone.min_weight,
        theone_max_weight: user.theone.max_weight,
        theone_min_salary: user.theone.min_salary
      }
    });
  });
});

router.get('/check-profile/:token', function(req, res) {
  /** 有userId曝露到介面的危險 **/
  User.findOne({ line_userid: req.params.token }, function(err, user) {
    res.render('check-profile', {
      helpers: {
        id: user.id,
        uid: req.params.token,
        self_location: user.self.location,
        self_sex: user.self.sex,
        self_age: user.self.age,
        self_height: user.self.height,
        self_weight: user.self.weight
      }
    });
  });
});

router.get('/personal-settings/:token', function(req, res) {
  /** 有userId曝露到介面的危險 **/
  User.findOne({ line_userid: req.params.token }, function(err, user) {
    var acct_stat = "";
    if(user.account_status === "open"){
       acct_stat = "開啟";
    }
    else if(user.account_status === "close"){
       acct_stat = "關閉";
    }
    res.render('personal-settings', {
      helpers: {
        token: req.params.token,
        account_status: acct_stat
      }
    });
  });
});


router.post('/personal-settings/:token', function(req, res) {
  var account_status = req.body.account_status;

  // Validation
  req.checkBody('account_status', DATA_NOT_FINISHED_MSG).notEmpty();

  if(account_status === undefined || account_status === "") {
    req.flash('success_msg', ACCOUNT_STATUS_NOT_SET);
    return res.redirect('/users/personal-settings/' + req.params.token);
  }

  // Update to database
  var errors = req.validationErrors();
  if(errors){
    res.render('personal-settings',{
      errors: errors
    });
  } else {
    User.findOne({ line_userid: req.params.token }, function(err, user) {
      if (!user) {
        req.flash('error', ACCT_NOT_EXIST_MSG);
        return res.redirect('/users/personal-settings');
      }
      user.markModified('self');
      user.account_status = account_status;

      user.save(function (err) {
        if (err) console.log('Save unsuccessful.');
      });
    });

    req.flash('success_msg', DATA_SAVED_MAG);
    res.redirect('/users/personal-settings/' + req.params.token);
  }
});

router.get('/criteria-self-line/:token', function(req, res) {
  /** 有userId曝露到介面的危險 **/
  res.render('criteria-self-line', {
    helpers: {
      uid: req.params.token,
    }
  });
});

router.post('/criteria-self-line/:token', function(req, res) {
  var line = req.body.line;
  var location = req.body.location;
  var sex = req.body.sex;
  // var orientation = req.body.orientation;
  var ori_male = req.body.ori_male;
  var ori_female = req.body.ori_female;
  var ori_across = req.body.ori_across;
  var ori_trans_male = req.body.ori_trans_male;
  var ori_trans_female = req.body.ori_trans_female;
  var age = req.body.age;
  var height = req.body.height;
  var weight = req.body.weight;
  var salary = req.body.salary;

  // Validation
  req.checkBody('location', DATA_NOT_FINISHED_MSG).notEmpty();
  req.checkBody('sex', DATA_NOT_FINISHED_MSG).notEmpty();
  // req.checkBody('orientation', DATA_NOT_FINISHED_MSG).notEmpty();
  req.checkBody('age', DATA_NOT_FINISHED_MSG).notEmpty();
  req.checkBody('height', DATA_NOT_FINISHED_MSG).notEmpty();
  req.checkBody('weight', DATA_NOT_FINISHED_MSG).notEmpty();
  req.checkBody('salary', DATA_NOT_FINISHED_MSG).notEmpty();

  if(location === undefined || location === "") {
    req.flash('success_msg', DATA_NOT_FINISHED_MSG);
    return res.redirect('/users/criteria-self-line/' + req.params.token);
  }
  else if(line === ""){
    req.flash('success_msg', DATA_NOT_FINISHED_MSG);
    return res.redirect('/users/criteria-self-line/' + req.params.token);
  }
  else if(sex === undefined || sex === "") {
    req.flash('success_msg', DATA_NOT_FINISHED_MSG);
    return res.redirect('/users/criteria-self-line/' + req.params.token);
  }
  /*
  else if(orientation === undefined || orientation === "") {
    req.flash('success_msg', DATA_NOT_FINISHED_MSG);
    return res.redirect('/users/criteria-self-line/' + req.params.token);
  }
  */
  else if(age === undefined || age === "") {
    req.flash('success_msg', DATA_NOT_FINISHED_MSG);
    return res.redirect('/users/criteria-self-line/' + req.params.token);
  }
  else if(height === undefined || height === "") {
    req.flash('success_msg', DATA_NOT_FINISHED_MSG);
    return res.redirect('/users/criteria-self-line/' + req.params.token);
  }
  else if(weight === undefined || weight === "") {
    req.flash('success_msg', DATA_NOT_FINISHED_MSG);
    return res.redirect('/users/criteria-self-line/' + req.params.token);
  }
  else if(salary === undefined) {
    salary = "";
  }

  // Update to database
  var errors = req.validationErrors();
  if(errors){
    res.render('criteria-self-line',{
      errors: errors
    });
  } else {
    User.findOne({ line_userid: req.params.token }, function(err, user) {
      if (!user) {
        req.flash('error', ACCT_NOT_EXIST_MSG);
        return res.redirect('/users/criteria-self-line');
      }
      user.markModified('self');
      user.contact.line = line;
      user.self.location = location;
      user.self.sex = sex;
      // user.self.orientation = orientation;
      if(ori_male === "男性") {
        user.self.ori_male = true;
      } else {
        user.self.ori_male = false;
      }
      if(ori_female === "女性") {
        user.self.ori_female = true;
      } else {
        user.self.ori_female = false;
      }
      if(ori_across === "跨性別") {
        user.self.ori_across = true;
      } else {
        user.self.ori_across = false;
      }
      if(ori_trans_male === "轉性現為男性") {
        user.self.ori_trans_male = true;
      } else {
        user.self.ori_trans_male = false;
      }
      if(ori_trans_female === "轉性現為女性") {
        user.self.ori_trans_female = true;
      } else {
        user.self.ori_trans_female = false;
      }
      user.self.age = age;
      user.self.height = height;
      user.self.weight = weight;
      user.self.salary = salary;

      user.save(function (err) {
        if (err) console.log('Save unsuccessful.');
      });
    });

    req.flash('success_msg', DATA_SAVED_MAG);
    res.redirect('/users/criteria-self-line/' + req.params.token);
  }

});

router.get('/criteria-friend-line/:token', function(req, res) {
  /** 有userId曝露到介面的危險 **/
  res.render('criteria-friend-line', {
    helpers: {
      uid: req.params.token
    }
  });
});

router.post('/criteria-friend-line/:token', function(req, res) {
  var location = req.body.location;
  var location_2 = req.body.location_2;
  var location_3 = req.body.location_3;
  var location_4 = req.body.location_4;
  var location_5 = req.body.location_5;
  var min_age = req.body.min_age;
  var max_age = req.body.max_age;
  var min_height = req.body.min_height;
  var max_height = req.body.max_height;
  var min_weight = req.body.min_weight;
  var max_weight = req.body.max_weight;
  var min_salary = req.body.min_salary;

  // Validation
  req.checkBody('location', DATA_NOT_FINISHED_MSG).notEmpty();
  req.checkBody('min_age', DATA_NOT_FINISHED_MSG).notEmpty();
  req.checkBody('max_age', DATA_NOT_FINISHED_MSG).notEmpty();
  req.checkBody('min_height', DATA_NOT_FINISHED_MSG).notEmpty();
  req.checkBody('max_height', DATA_NOT_FINISHED_MSG).notEmpty();
  req.checkBody('min_weight', DATA_NOT_FINISHED_MSG).notEmpty();
  req.checkBody('max_weight', DATA_NOT_FINISHED_MSG).notEmpty();
  req.checkBody('min_salary', DATA_NOT_FINISHED_MSG).notEmpty();

  if(location === undefined || location === "") {
    req.flash('success_msg', DATA_NOT_FINISHED_MSG);
    return res.redirect('/users/criteria-friend-line/' + req.params.token);
  }
  else if(min_age === undefined || min_age === "") {
    req.flash('success_msg', DATA_NOT_FINISHED_MSG);
    return res.redirect('/users/criteria-friend-line/' + req.params.token);
  }
  else if(max_age === undefined || max_age === "") {
    req.flash('success_msg', DATA_NOT_FINISHED_MSG);
    return res.redirect('/users/criteria-friend-line/' + req.params.token);
  }
  else if(max_age < min_age) {
    req.flash('success_msg', AGE_NOT_VALID);
    return res.redirect('/users/criteria-friend-line/' + req.params.token);
  }
  else if(min_height === undefined || min_height === "") {
    req.flash('success_msg', DATA_NOT_FINISHED_MSG);
    return res.redirect('/users/criteria-friend-line/' + req.params.token);
  }
  else if(max_height === undefined || max_height === "") {
    req.flash('success_msg', DATA_NOT_FINISHED_MSG);
    return res.redirect('/users/criteria-friend-line/' + req.params.token);
  }
  else if(max_height < min_height) {
    req.flash('success_msg', HEIGHT_NOT_VALID);
    return res.redirect('/users/criteria-friend-line/' + req.params.token);
  }
  else if(min_weight === undefined || min_weight === "") {
    req.flash('success_msg', DATA_NOT_FINISHED_MSG);
    return res.redirect('/users/criteria-friend-line/' + req.params.token);
  }
  else if(max_weight === undefined || max_weight === "") {
    req.flash('success_msg', DATA_NOT_FINISHED_MSG);
    return res.redirect('/users/criteria-friend-line/' + req.params.token);
  }
  else if(max_weight < min_weight) {
    req.flash('success_msg', WEIGHT_NOT_VALID);
    return res.redirect('/users/criteria-friend-line/' + req.params.token);
  }
  else if(min_salary === undefined || min_salary === "") {
    req.flash('success_msg', DATA_NOT_FINISHED_MSG);
    return res.redirect('/users/criteria-friend-line/' + req.params.token);
  }

  // Update to database
  var errors = req.validationErrors();
  if(errors){
    res.render('criteria-friend-line',{
      errors: errors
    });
  } else {
    User.findOne({ line_userid: req.params.token }, function(err, user) {
      if (!user) {
        req.flash('error', ACCT_NOT_EXIST_MSG);
        return res.redirect('/users/criteria-friend-line');
      }
      user.markModified('self');
      user.theone.location = location;
      user.theone.location_2 = location_2;
      user.theone.location_3 = location_3;
      user.theone.location_4 = location_4;
      user.theone.location_5 = location_5;
      user.theone.min_age = min_age;
      user.theone.max_age = max_age;
      user.theone.min_height = min_height;
      user.theone.max_height = max_height;
      user.theone.min_weight = min_weight;
      user.theone.max_weight = max_weight;
      user.theone.min_salary = min_salary;

      user.save(function (err) {
        if (err) console.log('Save unsuccessful.');
      });
    });

    req.flash('success_msg', DATA_SAVED_MAG);
    res.redirect('/users/criteria-friend-line/' + req.params.token);
  }

});

/******** Website version ********/
// Get list
router.get('/list', function(req, res) {
  // 检查 session 中的 isVisit 字段
  // 如果存在则增加一次，否则为 session 设置 isVisit 字段，并初始化为 1。
  /*
  if(req.session.isVisit) {
    req.session.isVisit++;
    res.send('<p>第 ' + req.session.isVisit + '次来此页面</p>');
  } else {
    req.session.isVisit = 1;
    res.send("欢迎第一次来这里");
    console.log(req.session);
  }
  */
  User.findOne({ _id: req.session.passport.user }, function(err, user) {
    if (!user) {
      req.flash('error', '你還未登入，請先登入。');
      return res.redirect('/users/login');
    }
    res.render('list');
  });
});

// Get criteria-self
router.get('/criteria-self', function(req, res) {
/*
  User.findOne({ _id: req.session.passport.user }, function(err, user) {
    if (!user) {
      req.flash('error', '你還未登入，請先登入。');
      return res.redirect('/users/login');
    }
*/
    res.render('criteria-self');
  //});
});

// Get criteria-self
router.post('/criteria-self', function(req, res) {
  var picture = req.body.picture;
  var location = req.body.location;
  var sex = req.body.sex;
  var orientation = req.body.orientation;
  var intro = req.body.intro;

  // Validation
  req.checkBody('picture', 'Picture is required').notEmpty();
  req.checkBody('location', 'Location is required').notEmpty();
  req.checkBody('sex', 'Sex is required').notEmpty();
  req.checkBody('orientation', 'Orientation is required').notEmpty();
  req.checkBody('intro', 'Introduction is required').notEmpty();

  // Upload file
  var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      var oldpath = files.picture.path;
      var newpath = config.getPathDataset() + files.picture.name;
      fs.rename(oldpath, newpath, function (err) {
        if (err) throw err;
      });
  });

  // Update to database
  var errors = req.validationErrors();
	if(errors){
		res.render('criteria-self',{
			errors:errors
		});
	} else {
    User.findOne({ _id: req.session.passport.user }, function(err, user) {
      if (!user) {
        req.flash('error', ACCT_NOT_EXIST_MSG);
        return res.redirect('/users/criteria-self');
      }
      user.markModified('self');
      user.self.picture = picture;
      user.self.location = location;
      user.self.sex = sex;
      if(!orientation.indexOf("male")) {
        user.self.orientationMale = true;
      }
      if(!orientation.indexOf("female")) {
        user.self.orientationFemale = true;
      }
      if(!orientation.indexOf("third")) {
        user.self.orientationThird = true;
      }
      user.self.intro = intro;

      user.save(function (err) {
        if (err) console.log('Save unsuccessful.');
      });
    });

    req.flash('success_msg', DATA_SAVED_MAG);
    res.redirect('/users/criteria-self');
	}
});

// Get settings
router.get('/criteria-friend', function(req, res) {
  User.findOne({ _id: req.session.passport.user }, function(err, user) {
    if (!user) {
      req.flash('error', '你還未登入，請先登入。');
      return res.redirect('/users/login');
    }
    res.render('criteria-friend');
  });
});

// Get criteria-friend
router.post('/criteria-friend', function(req, res) {

    console.log(req.body);
    var picture = req.body.picture;
    var location = req.body.location;

    // Validation
    req.checkBody('picture', 'Picture is required').notEmpty();
    req.checkBody('location', 'Location is required').notEmpty();

    // Upload file
    var form = new formidable.IncomingForm();
      form.parse(req, function (err, fields, files) {
        var oldpath = files.picture.path;
        //var newpath = '/Users/speedkevin/Node_dejavu/public/img/' + files.picture.name;
        var newpath = config.getPathDataset() + files.picture.name;
        fs.rename(oldpath, newpath, function (err) {
          if (err) throw err;
        });
    });

    // Update to database
    var errors = req.validationErrors();
  	if(errors){
  		res.render('criteria-friend',{
  			errors:errors
  		});
  	} else {
      User.findOne({ _id: req.session.passport.user }, function(err, user) {
        if (!user) {
          req.flash('error', ACCT_NOT_EXIST_MSG);
          return res.redirect('/users/criteria-friend');
        }
        user.markModified('theone');
        user.theone.picture = picture;
        user.theone.location = location;
        user.save(function (err) {
          if (err) console.log('Save unsuccessful.');
        });
      });
      req.flash('success_msg', location);
      res.redirect('/users/criteria-friend');
  	}
});

// Get settings
router.get('/settings',
  function(req, res) {
    User.findOne({ _id: req.session.passport.user }, function(err, user) {
      if (!user) {
        req.flash('error', '你還未登入，請先登入。');
        return res.redirect('/users/login');
      }
      res.render('settings');
    });
});

// Get settings
router.post('/settings',
  function(req, res) {
      var account_status = req.body.account_status;

      // Validation
      req.checkBody('account_status', 'Account status is required').notEmpty();

      // Update to database
      var errors = req.validationErrors();
      if(errors){
        res.render('settings',{
          errors:errors
        });
      } else {
        User.findOne({ _id: req.session.passport.user }, function(err, user) {
          if (!user) {
            req.flash('error', ACCT_NOT_EXIST_MSG);
            return res.redirect('/users/settings');
          }
          user.markModified('settings');
          if(!account_status.indexOf("on")) {
            user.settings.account_status = "on";
          }
          else if(!account_status.indexOf("off")) {
            user.settings.account_status = "off";
          }
          user.save(function (err) {
            if (err) console.log('Save unsuccessful.');
          });
        });
        req.flash('success_msg', account_status);
        res.redirect('/users/settings');
      }
});

// Register
router.get('/register', function(req, res){
	res.render('register');
});

// Login
router.get('/login', function(req, res){
	res.render('login');
});

// Register User
router.post('/register', function(req, res){
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	// Validation
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();

	if(errors){
		res.render('register',{
			errors:errors
		});
	} else {
		var newUser = new User({
			name: name,
			email:email,
			username: username,
			password: password
		});

		User.createUser(newUser, function(err, user){
			if(err) throw err;
			console.log(user);
		});

		req.flash('success_msg', '已經註冊成功，現在可以進行登入。');

		res.redirect('/users/login');
	}
});

passport.use(new LocalStrategy(
   function(username, password, done) {
		   User.getUserByUsername(username, function(err, user){
			   	if(err) throw err;
			   	if(!user){
			   		return done(null, false, {message: '此帳號不存在'});
			   	}

			   	User.comparePassword(password, user.password, function(err, isMatch){
			   		if(err) throw err;
			   		if(isMatch){
			   			return done(null, user);
							//return done(null, false, {message: 'Invalid password '+password+' '+user.password+' '+user.username});
			   		} else {
			   			return done(null, false, {message: '密碼錯誤 '+password+' '+user.password});
			   		}
			   	});
		    });
}));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

// Authenticate: login
router.post('/login',
    passport.authenticate('local',
    {
      successRedirect:'/users/list',
      failureRedirect:'/users/login',
      failureFlash: true
    }),
    function(req, res) {
      res.redirect('/users/list');
    }
);

// Authenticate: logout
router.get('/logout', function(req, res){
	// Passport function
	req.logout();

	req.flash('success_msg', '目前已經登出。');

	res.redirect('/users/login');
});


// forgot password
router.get('/forgot', function(req, res) {
  res.render('forgot', {
    user: req.user
  });
});

router.post('/forgot', function(req, res, next) {
	async.waterfall([
	    function(callback) {
	        // callback(null, 'one', 'two');
					crypto.randomBytes(20, function(err, buf) {
						var token = buf.toString('hex');
						callback(err, token);
					});
	    },
	    function(token, callback) {
	        // arg1 now equals 'one' and arg2 now equals 'two'
	        //callback(null, 'three');
					User.findOne({ email: req.body.email }, function(err, user) {
						if (!user) {
							req.flash('error', '此帳號的信箱不存在。');
							return res.redirect('/users/forgot');
						}
						user.resetPasswordToken = token;
						user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
						user.save(function(err) {
							callback(err, token, user);
						});

					});
	    },
	    function(token, user, callback) {
	        // arg1 now equals 'three'
	        //callback(null, 'done');
					var smtpTransport = nodemailer.createTransport({
						//service: 'Hotmail',
						host: 'smtp.live.com',
						auth: {
							//xoauth2: xoauth2.createXOAuth2Generator({
								user: 'speedkevin2@hotmail.com',
								pass: '855Speed172'
							//})
						}
					});
					var mailOptions = {
						to: user.email,
						from: 'speedkevin2@hotmail.com',
						subject: 'Node.js Password Reset',
						text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
							'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
							'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
							'If you did not request this, please ignore this email and your password will remain unchanged.\n'
					};
					smtpTransport.sendMail(mailOptions, function(err) {
						req.flash('success_msg', '密碼已經寄到 ' + user.email + ' ，信中會有更多指示。');
						callback(err, 'done');
					});
	    }
	], function (err, result) {
	    // result now equals 'done'
      //req.flash('success_msg', '請到信箱收信後更改密碼。');
			res.redirect('/users/forgot');
	});

});

// reset password: when click the link in the email
router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', '密碼重設字串不合法或已經過期。');
      return res.redirect('/users/forgot');
    }
    res.render('reset', {
      user: req.user
    });
  });
});

// when click confirm Update button
router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(callback) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', '密碼重設字串不合法或已經過期。');
          return res.redirect('back');
        }

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

				user.password = req.body.password;
				/*
        user.save(function(err) {
          req.logIn(user, function(err) {
            callback(err, user);
          });
        });
				*/

				User.createUser(user, function(err, user){
				     if(err) throw err;
				     console.log(user);
				});
				callback(err, user);


      });
    },
    function(user, callback) {
      var smtpTransport = nodemailer.createTransport({
        host: 'smtp.live.com',
        auth: {
					user: 'speedkevin2@hotmail.com',
					pass: '855Speed172'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'speedkevin2@hotmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n' +
					'New password is: ' + user.password + '\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success_msg', '成功! 你的密碼已經成功更改。');
        callback(err);
      });
    }
  ], function(err) {
    res.redirect('/users/login');
  });
});

module.exports = router;

// 1234
// $2a$10$gNDBHic9EcBVBEnUryzlH.LVbbm10bSad8QxjEbleF8V6DDWSuloK
