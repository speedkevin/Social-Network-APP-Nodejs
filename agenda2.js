const Agenda = require('agenda');
var async = require('async');
// Link to DB
const { MongoClient } = require('mongodb');
var User = require('./models/user');
//var $ = require('jquery'); //include in agenda
const axios = require('axios');
// Config
var config = require('./config');
// Include filtering
var filter = require('./filtering2');
// Include evaluation
var eva = require('./evaluation');
// Include LINE bot
var myBot = require('./myLineBot');

function reqTheOneFeatures(img_path, filename) {
  /*
  // if theone's features is not in DB
  if(user.theone.features === undefined){
    // get features

    var features = axios.get('http://' + config.getPythonDomain() + ':' + config.getPythonPort() + '/getTheOneFeatures/' + user.theone.picture);
    // Save features into db
    User.findOne({"line_userid": user.line_userid }, function(err, my_user) {
      console.log("my user: " + my_user)
      my_user.theone.features = features;
      my_user.save(function (err) {
        if (err) console.log('Save unsuccessful.');
      });
    });
    return features;
  }
  // if theone's features is in DB
  else {
    // return features directly
    return user.theone.features;
  }
  */
  // return features directly
  // if no theone's features in DB
  // get features
  // Save features into db
  //return axios.get('http://' + config.getPythonDomain() + ':' + config.getPythonPort() + '/getTheOneFeatures/' + filename);
  return axios.get('https://' + config.getPyDomain() + '/getTheOneFeatures/' + img_path + filename);
}

async function getTheOneFeatures(img_path, filename) {
  try {
      let features = await reqTheOneFeatures(img_path, filename);
      return features;
  } catch (jqXHR) {
      console.error("Get feature error: " + jqXHR.statusText);
      return;
  }
}

function reqProb(filename, feature) {
  //return axios.get('http://' + config.getPythonDomain() + ':' + config.getPythonPort() + '/getProb/'+filename+'/'+feature);
  return axios.get('https://' + config.getPyDomain() + '/getProb/' + filename + '/' + feature);
}

async function getProb(filename, feature) {
  try {
      let prob = await reqProb(filename, feature);
      return prob;
  } catch (jqXHR) {
      console.error("Get feature error: "+jqXHR.statusText);
      return;
  }
}

async function run() {
  var u = 0;
  const db = await MongoClient.connect(config.getDbUrl());
  // Agenda will use the given mongodb connection to persist data, so jobs
  // will go in the "dejavu" database's "jobs" collection.
  const agenda = new Agenda().mongo(db, 'jobs');
  console.log("okokokok");
  // Define a "job", an arbitrary function that agenda can execute
  // agenda.define('find the best mate', function(job, done) {
  agenda.define('find the best mate', function(job) {
    console.log("======== Start looking for users ========");
    // ===== 1. 從資料庫，找出所有使用者，有開放的才會執行 =====
    // User.find({"line_userid":"U5979300808a6bbe3ddbdf72adfd9f96d"}, function(err, allUserDoc) {
    User.find({"account_status" : "open"}, function(err, allUserDoc) {
    // for(u=0; u<user.length; u++){

    // ===== 2. 根據每個使用者，做媒合流程 =====
    allUserDoc.forEach(function(userDoc, userIndex, userArray) {

    // ===== 3. 先確保用戶沒有關閉帳號，開著才會媒合 =====
    if(userDoc.account_status === "open"){
    // User.find({ $or: [ {"line_userid":"U5979300808a6bbe3ddbdf72adfd9f96d"}, {"line_userid":"U36f3f481ed38216ea10cecd1fd9fe195"} ] }, function(err, user) {
        console.log("========== " + userDoc.line_userid + " is getting started ==========");
        console.log(userDoc.line_userid);
        console.log(userDoc.line_userid + " is processing. Numbers of user in the recomToMe_list...");
        console.log(userDoc.recomToMe_list.length);

        // ===== 4. 把用戶的推薦清單先放到暫存 preTheOneListLength =====
        var preTheOneListLength = userDoc.recomToMe_list.length;
        var preTheOneList = [];
        userDoc.recomToMe_list.forEach(function(x, y, z) {
          preTheOneList.push(x);
        });
      //console.log("Push users in recomToMe_list into temp");
      //console.log(preTheOneList);
      // for each user
      // Check user need to finish mandatory settings

      if (userDoc.self.location === undefined) {myBot.pushSettingMessage(userDoc.line_userid, '您沒有填寫自己居住地。請輸入『編輯檔案』就可以開始設定囉。');
      } else if (userDoc.self.height === undefined) {myBot.pushSettingMessage(userDoc.line_userid, '您沒有填寫自己身高。請輸入『編輯檔案』就可以開始設定囉。');
      } else if (userDoc.self.weight === undefined) {myBot.pushSettingMessage(userDoc.line_userid, '您沒有填寫自己體重。請輸入『編輯檔案』就可以開始設定囉。');
      } else if (userDoc.self.sex === undefined) {myBot.pushSettingMessage(userDoc.line_userid, '您沒有填寫自己性別。請輸入『編輯檔案』就可以開始設定囉。');
      } else if (userDoc.self.picture === undefined) {
        myBot.pushSettingMessage(userDoc.line_userid, '您沒有上傳自己照片。只有在媒合過程會提供照片給對方參考，不是所有人都搜尋得到。請輸入『編輯檔案』就可以開始設定囉。');
      } else if (userDoc.self.ori_male === undefined &&
        userDoc.self.ori_female === undefined &&
        userDoc.self.ori_across === undefined &&
        userDoc.self.ori_trans_male === undefined &&
        userDoc.self.ori_trans_female === undefined
      ) {
        myBot.pushSettingMessage(userDoc.line_userid, '您至少要填寫一個自己喜歡的性別。請輸入『編輯檔案』就可以開始設定囉。');
      } else if (userDoc.theone.location === undefined) {myBot.pushSettingMessage(userDoc.line_userid, '您沒有填寫對方居住地。請輸入『編輯檔案』就可以開始設定囉。');
      } else if (userDoc.theone.picture === undefined) {myBot.pushSettingMessage(userDoc.line_userid, '您沒有上傳理想對象照片。請輸入『編輯檔案』就可以開始設定囉。');
      } else if (userDoc.theone.min_height === undefined) {myBot.pushSettingMessage(userDoc.line_userid, '您沒有填寫對方身高。請輸入『編輯檔案』就可以開始設定囉。');
      } else if (userDoc.theone.max_height === undefined) {myBot.pushSettingMessage(userDoc.line_userid, '您沒有填寫對方身高。請輸入『編輯檔案』就可以開始設定囉。');
      } else if (userDoc.theone.min_weight === undefined) {myBot.pushSettingMessage(userDoc.line_userid, '您沒有填寫對方體重。請輸入『編輯檔案』就可以開始設定囉。');
      } else if (userDoc.theone.max_weight === undefined) {myBot.pushSettingMessage(userDoc.line_userid, '您沒有填寫對方體重。請輸入『編輯檔案』就可以開始設定囉。');
      }
      else {
          // ******************************************************************************************************
          // 5-1. 根據ori-xxx，選出為true的那些
          var selected_sex = [];
          if(userDoc.self.ori_male === true){
            selected_sex.push({"self.sex": "男性"});
          }
          if(userDoc.self.ori_female === true){
            selected_sex.push({"self.sex": "女性"});
          }
          if(userDoc.self.ori_across === true){
            selected_sex.push({"self.sex": "跨性別"});
          }
          if(userDoc.self.ori_trans_male === true){
            selected_sex.push({"self.sex": "轉性現為男性"});
          }
          if(userDoc.self.ori_trans_female === true){
            selected_sex.push({"self.sex": "轉性現為女性"});
          }

          // 5-2. 根據sex，組合成ALL_ORI = {ori-xxx=true}
          var selected_ori = "";
          if(userDoc.self.sex === "男性"){
            selected_ori = "self.ori_male"
          }
          else if(userDoc.self.sex === "女性"){
            selected_ori = "self.ori_female"
          }
          else if(userDoc.self.sex === "跨性別"){
            selected_ori = "self.ori_across"
          }
          else if(userDoc.self.sex === "轉性現為男性"){
            selected_ori = "self.ori_trans_male"
          }
          else if(userDoc.self.sex === "轉性現為女性"){
            selected_ori = "self.ori_trans_female"
          }

          // console.log("selected_sex");
          // console.log(selected_sex);
          // console.log("selected_ori");
          // console.log(selected_ori);

          // ===== 5-3. 找出符合用戶的對象，有設定開放的對象才會被找出來 =====
          // 男女，女男，男男，女女
          var query = { "account_status": "open",
                    $or: [ { "self.location": userDoc.theone.location },
                            { "self.location": userDoc.theone.location_2 },
                            { "self.location": userDoc.theone.location_3 },
                            { "self.location": userDoc.theone.location_4 },
                            { "self.location": userDoc.theone.location_5 } ],
                    "self.age": { $gte: userDoc.theone.min_age, $lte: userDoc.theone.max_age },
                    "self.weight": { $gte: userDoc.theone.min_weight, $lte: userDoc.theone.max_weight },
                    "self.height": { $gte: userDoc.theone.min_height, $lte: userDoc.theone.max_height },
                    "self.salary": { $gte: userDoc.theone.min_salary },
                    $or: selected_sex
                  };
          query[selected_ori] = true; // 若key是動態的，ori要另外放，不要直接寫在query裡面
          //console.log("query");
          //console.log(query);
          User.find(query, function(err, matchTheOneDoc) {

            console.log(userDoc.line_userid + " is processing. Find users that fit certeria...");
            console.log(matchTheOneDoc);
            if(matchTheOneDoc === undefined){
                console.log(userDoc.line_userid + " is processing. Now no any match theone list");
                myBot.pushSettingMessage(userDoc.line_userid, '不好意思，目前沒有推薦人選，我們會再接再厲，提供您更好的服務！謝謝！');
                return;
            } else {
              matchTheOneDoc.forEach(function(x, y, z) {
                console.log(userDoc.line_userid + " is processing. Now match list: " + matchTheOneDoc[y].line_userid);
              });
            }

            // ===== 6. 先取出用戶的理想對象照片，照片路徑
            // Get filename from DB
            // var filename = 'boy01.jpg';
            var filename = userDoc.theone.picture;
            var img_path = userDoc.theone.img_path;
            console.log(userDoc.line_userid + " is processing. Find theone's picture/filename...");
            console.log(filename);
            console.log(userDoc.line_userid + " is processing. Find theone's picture path...");
            console.log(img_path);
            // if theone's features is in DB

            // else
            // ===== 7. 要到理想對象照片的features =====
            // Asynchronous request
            // request Python server: image filename (Ajax javascript)
            // ******* file size 不能太小 *******
            // if theone's features dont exist in DB, get & Save features into DB
            getTheOneFeatures(img_path, filename).then(function(features) {
              //console.log("Feature result: "+features.data);
              //console.log("filename: "+filename);

              // Save theone's features in DB
              if(features === undefined){
                console.log(userDoc.line_userid + " is processing. ========== No any features data ==========");
                return;
              } else {
                userDoc.theone.features = features.data;
              }

              // ===== 8. 要到 Ranking =====
              //request Python server: image filename, features (Ajax javascript)
              getProb(filename, features.data).then(function(prob) {

                // ===== 9. if 沒有 Ranking, 推播沒有人選
                var ranking_array = [];
                if(prob.data === undefined){
                  // Nothing has to recommend, ignore this agenda
                  console.log(userDoc.line_userid + " is processing. ========== No any ranking data ==========");
                  myBot.pushSettingMessage(userDoc.line_userid, '不好意思，目前沒有推薦人選，我們會再接再厲，提供您更好的服務！謝謝！');
                  return;
                // ===== 10. if 有 Ranking, 執行推薦程序
                } else {
                  // ===== 11. 把 Ranking 轉換格式 [a, b, c] =====
                  // console.log("===== prob =====");
                  // console.log(prob);
                  console.log(userDoc.line_userid + " is processing. ========== Now get ranking is ==========");
                  if(!prob.data.includes(",")) {
                    ranking_array = [prob.data];
                  } else {
                    ranking_array = prob.data.split(',');
                  }

                  console.log(ranking_array);
                  // console.log(ranking_array.length);

                  // ===== 11. 初始化 user[i].recomToMe_list 和 user[i].me_block_list =====
                  if(userDoc.recomToMe_list.length === 0) {
                    console.log(userDoc.line_userid + "'s recommendation list is 0");
                    userDoc.recomToMe_list = [];
                  }
                  if(userDoc.me_block_list.length === 0) {
                    console.log(userDoc.line_userid + "'s block list is 0");
                    userDoc.me_block_list = [];
                  }

                  // ===== 12. Filtering(userDoc, ranking_array), recommendation list size will be reduced to N
                  // 12-1. Select Top N theone: config.getTopTheOne()
                  // return [{id_1}, {id_2}, ....]
                  // 12-2. Exclude theone in user's block list
                  // 12-3. Exclude theone in user's recom list
                  // 12-4. Ranking後的theone，必須也是user條件下篩選過的theone
                  var filteringList = [];
                  filteringList = filter.filtering(userDoc, userDoc.recomToMe_list, userDoc.me_block_list, ranking_array, matchTheOneDoc);

                  console.log("==========filteringList============");
                  filteringList.forEach(function(x, y, z) {
                    console.log(userDoc.line_userid + " is processing. Filtered list is: " + filteringList[y].line_userid);
                  });
                  var theOneSortingDoc = filteringList;

                  // ===== 13. evaluation(userDoc, theOneSortingDoc)
                  // [1,1] means A will add to B's list, and vice versa
                  // [0,1] means A will add to B's list
                  var evaluationResultList = [];
                  evaluationResultList = eva.evaluation(userDoc, theOneSortingDoc);
                  console.log(userDoc.line_userid + " is processing. ==========evaluationResultList============");
                  console.log(evaluationResultList);

                  // ===== 13-1. =====
  		            if(evaluationResultList.length !== 0) {

                    // 使用者的推薦清單
                    var wholeList = [];
                    wholeList = preTheOneList;

                    // ===== 13-2. 推播訊息和儲存資料庫 =====
                    evaluationResultList.forEach(function(evaDoc, evaIndex, evaArray) {

                      // ===== 13-3. Push message to user
                      if(evaDoc.pushUser === 1) {
                        console.log(userDoc.line_userid + " is processing. Push LINE to user...");
                        console.log(evaDoc.userId);
                        myBot.pushLineMessage(evaDoc.userId, evaDoc.userMsg, evaDoc.theOneId); // and time
                      }

                      // ===== 13-4. Push message to theone
    		              if (evaDoc.pushTheOne === 1) {
                        console.log(userDoc.line_userid + " is processing. Push LINE to theone...");
                        console.log(evaDoc.theOneId);
                        myBot.pushLineMessage(evaDoc.theOneId, evaDoc.theOneMsg, evaDoc.userId); // and time
                      }

                      // ===== 13-5. 把評估後的新的theone人選，加入使用者推薦清單，含使用者對theone的回應
                      console.log(userDoc.line_userid + " is processing. Add theone: " + evaDoc.theOneId + " to user's recomToMe_list...");
                      wholeList.push({theone_user_id: evaDoc.theOneId, response: evaDoc.userResp});

                      for(var i=0;i<matchTheOneDoc.length;i++){
                        if(evaDoc.theOneId === matchTheOneDoc[i].line_userid){

                          // ===== 13-6. 相反的，也把新的user的ID，加入theone的推薦清單，含theone對使用者的回應
                          console.log(userDoc.line_userid + " is processing. Add own: " + evaDoc.userId + " to theone's recomToMe_list...");
                          matchTheOneDoc[i].recomToMe_list.push({theone_user_id: evaDoc.userId, response: evaDoc.theOneResp});

                          // ===== 14. Save theone update info to DB
                          console.log(userDoc.line_userid + " is processing. Save theone's recomToMe_list");
                          matchTheOneDoc[i].save(function (err) {
                            if (err) console.log('Theone save unsuccessful.');
                          });
                        }
                      }
                    }); // end evaluationResultList.forEach

                    userDoc.recomToMe_list = wholeList;

                    // ===== 15. Save user update info to DB
                    console.log(userDoc.line_userid + " is processing. Save user's recomToMe_list");
                    userDoc.save(function (err) {
                      if (err) console.log('User save unsuccessful.');
                    });
  		            } // end evaluationResultList.length != 0
                } // end else in prob
              }).catch(error => {
                console.log(error);
              }); // end getProb
            }).catch(error => {
              console.log(error);
            }); // end getFeatures
          });// end find theone
          // ******************************************************************************************************
        } // end else
      } // end if account_status
      //}// end else in outer find
    }); // end for each userDoc
    });//end outer find
    //done();
  }); // end define

  // Wait for agenda to connect. Should never fail since connection failures
  // should happen in the `await MongoClient.connect()` call.
  //await new Promise(resolve => agenda.once('ready', resolve()));

  // Schedule a job for 1 second from now and persist it to mongodb.
  // Jobs are uniquely defined by their name, in this case "hello"
  //agenda.every('1 seconds', 'hello');
  //agenda.every('30 seconds', 'find the best mate');
  //agenda.start();

  //agenda.schedule(new Date(Date.now() + 1000), 'find the best mate');
  //agenda.start();


  agenda.on('ready', function() {
    // Every 5 seconds
    agenda.every('*/60 * * * * *', 'find the best mate');
    // agenda.every('*/604800 * * * * *', 'find the best mate');
    agenda.start();
  });


}

run().catch(error => {
  console.error(error);
  process.exit(-1);
});
