var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// We don't need connect here because connect has already existed in app.js
// mongoose.connect('mongodb://localhost/loginapp');
// var db = mongoose.connection;

// User Schema
var UserSchema = mongoose.Schema({
  // Linebot
  line_userid: String,
  contact: {
    line: String,
    facebook: String,
    mail: String
  },
  init_already: Boolean,
  recomToMe_list: [
    // yes/no/yet, yes=clicked, no=clicked, changes=0, paid_id, paid_expired, rating, comment
    {
        theone_user_id: String,
        response: String,
        isYes: Boolean,
        isNo: Boolean,
        numOfChanges: Number,
        paid_id: String,
        paid_expired: Date,
        rating: String,
        impeach: String
    }
  ],
  me_block_list: [
    {
        theone_user_id: String
    }
  ],
  both_match_list: [
    {
        theone_user_id: String
    }
  ],
  both_reject_list: [
      {
          theone_user_id: String
      }
  ],
  // once a day, paid_id, paid_expired
  frequency: [
    {
        name: String,
        paid_id: String,
        paid_expired: Date
    }
  ],
  // paid_id, paid_expired
  ads: {
    paid_id: String,
    paid_expired: Date
  },
  notifications: {
    notify_me_sb_yes_i_no: Boolean,
    notify_me_sb_yes_i_ignore_7_days: Boolean
  },
  line_register_time: Date,
  // Web
  username: {
    type: String,
    index: true
  },
  password: String,
  email: String,
  name: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  // LINE & Web
  self: {
      picture: String,
      img_path: String,
      features: String,
      nickname: String,
      location: String,
      sex: String,
      // orientation: String,
      ori_male: Boolean,
      ori_female: Boolean,
      ori_across: Boolean,
      ori_trans_male: Boolean,
      ori_trans_female: Boolean,
      intro: String,
      age: String,
      height: String,
      weight: String,
      salary: String
  },
  theone: {
      picture: String,
      img_path: String,
      features: String,
      location: String,
      location_2: String,
      location_3: String,
      location_4: String,
      location_5: String,
      min_age: String,
      max_age: String,
      min_height: String,
      max_height: String,
      min_weight: String,
      max_weight: String,
      min_salary: String
  },
  account_status: String,
  role: String,
  paid: Boolean,
  paid_price: String,
  paid_date: String,
  create_date: String
});

// reset password
/*
UserSchema.pre('save', function(next) {
  var user = this;
  var SALT_FACTOR = 5;

  if (!user.isModified('password')) return next();

  bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});
*/

// Will be named as "users" on the collection name on mlab
var User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function(newUser, callback){
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(newUser.password, salt, function(err, hash) {
        // Store hash in your password DB.
        newUser.password = hash;
        newUser.save(callback);
    });
  });
}

// Autehnticate function
module.exports.getUserByUsername = function(username, callback){
  var query = {username: username};
  User.findOne(query, callback); // mongoose method
}

// Autehnticate: serialize
module.exports.getUserById = function(id, callback){
  User.findById(id, callback); // mongoose method
}

// Autehnticate function
module.exports.comparePassword = function(candidatePassword, hash, callback){
  bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    if(err) throw err;
    callback(null, isMatch);
  });
}
