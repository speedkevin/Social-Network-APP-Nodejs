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
      console.error("Get feature error: "+jqXHR.statusText);
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
  const db = await MongoClient.connect(config.getDbUrl());
  // Agenda will use the given mongodb connection to persist data, so jobs
  // will go in the "dejavu" database's "jobs" collection.
  const agenda = new Agenda().mongo(db, 'jobs');
  console.log("okokokok");
  // Define a "job", an arbitrary function that agenda can execute
  agenda.define('find the best mate', function(job, done) {
    console.log("in define");
    // Find N users from database
    User.find({"line_userid":"U5979300808a6bbe3ddbdf72adfd9f96d"}, function(err, user) {
    // User.find({ $or: [ {"line_userid":"U5979300808a6bbe3ddbdf72adfd9f96d"}, {"line_userid":"U36f3f481ed38216ea10cecd1fd9fe195"} ] }, function(err, user) {

      console.log("user in the beginning");
      console.log(user[0].recomToMe_list.length);
      var preTheOneListLength = user[0].recomToMe_list.length;
      var preTheOneList = [];
      user[0].recomToMe_list.forEach(function(x, y, z) {
        preTheOneList.push(x);
      });
      // for each user
      // Check user need to finish mandatory settings
      if(user[0].self.nickname === undefined){myBot.pushSettingMessage(user[0].line_userid, '你沒有填寫自己暱稱。');
      } else if (user[0].self.location === undefined) {myBot.pushSettingMessage(user[0].line_userid, '你沒有填寫自己居住地。');
      } else if (user[0].self.height === undefined) {myBot.pushSettingMessage(user[0].line_userid, '你沒有填寫自己身高。');
      } else if (user[0].self.weight === undefined) {myBot.pushSettingMessage(user[0].line_userid, '你沒有填寫自己體重。');
      } else if (user[0].self.sex === undefined) {myBot.pushSettingMessage(user[0].line_userid, '你沒有填寫自己性別。');
      } else if (user[0].self.picture === undefined) {myBot.pushSettingMessage(user[0].line_userid, '你沒有上傳自己照片。');
      } else if (user[0].self.orientation === undefined) {myBot.pushSettingMessage(user[0].line_userid, '你沒有填寫自己喜歡的性別。');
      } else if (user[0].theone.location === undefined) {myBot.pushSettingMessage(user[0].line_userid, '你沒有填寫對方居住地。');
      } else if (user[0].theone.picture === undefined) {myBot.pushSettingMessage(user[0].line_userid, '你沒有上傳理想對象照片。');
      } else if (user[0].theone.min_height === undefined) {myBot.pushSettingMessage(user[0].line_userid, '你沒有填寫對方身高。');
      } else if (user[0].theone.max_height === undefined) {myBot.pushSettingMessage(user[0].line_userid, '你沒有填寫對方身高。');
      } else if (user[0].theone.min_weight === undefined) {myBot.pushSettingMessage(user[0].line_userid, '你沒有填寫對方體重。');
      } else if (user[0].theone.max_weight === undefined) {myBot.pushSettingMessage(user[0].line_userid, '你沒有填寫對方體重。');
      }
      else {
        // Do something flexible
        // Find the users match theone's criteria
        // 男女，女男，男男，女女
        User.find({ $or: [ { "self.location": user[0].theone.location },
                          { "self.location": user[0].theone.location_2 },
                          { "self.location": user[0].theone.location_3 },
                          { "self.location": user[0].theone.location_4 },
                          { "self.location": user[0].theone.location_5 } ],
                  "self.age": { $gte: user[0].theone.min_age, $lte: user[0].theone.max_age },
                  "self.weight": { $gte: user[0].theone.min_weight, $lte: user[0].theone.max_weight },
                  "self.height": { $gte: user[0].theone.min_height, $lte: user[0].theone.max_height },
                  "self.salary": { $gte: user[0].theone.min_salary },
                  "self.sex": user[0].self.orientation,
                  "self.orientation": user[0].self.sex }, function(err, matchTheOneDoc) {
          console.log("matchTheOneDoc");
          console.log(matchTheOneDoc);
          // Get filename from DB
          // var filename = 'boy01.jpg';
          var filename = user[0].theone.picture;
          var img_path = user[0].theone.img_path;
          console.log("filename: " + filename);
          console.log("image_path: " + img_path);
          // if theone's features is in DB

          // else
          // Asynchronous request
          // request Python server: image filename (Ajax javascript)
          // ******* file size 不能太小 *******
          // if theone's features dont exist in DB, get & Save features into DB
          getTheOneFeatures(img_path, filename).then(function(features) {
            console.log("Feature result: "+features.data);
            console.log("filename: "+filename);

            // Save theone's features in DB
            user[0].theone.features = features.data;

            //request Python server: image filename, features (Ajax javascript)
            getProb(filename, features.data).then(function(prob) {
              //console.log(prob.data); // a, b, c,....
              var file_array = [];
              if(prob.data === undefined){
                // Nothing has to recommend, ignore this agenda
                console.log("========== pro data undefined ==========");
              } else {
                console.log("========== pro data exist ==========");
                if(!prob.data.includes(",")) {
                  file_array = [prob.data];
                } else {
                  file_array = prob.data.split(','); // [a, b, c,....]
                }

                console.log(file_array);
                console.log(file_array.length);

                // Initial user[i].recomToMe_list
                if(user[0].recomToMe_list.length === 0) {
                  console.log("Recommendation list is 0");
                  user[0].recomToMe_list = [];
                }
                // Initial user[i].me_block_list
                if(user[0].me_block_list.length === 0) {
                  console.log("Block list is 0");
                  user[0].me_block_list = [];
                }

                // Filtering(user[0], file_array), recommendation list size will be reduced to N
                // 1. Select Top N theone: config.getTopTheOne()
                // return [{id_1}, {id_2}, ....]
                // 2. Exclude theone in user's block list
                // 3. Exclude theone in user's recom list
                var filteringList = [];
                filteringList = filter.filtering(user[0], user[0].recomToMe_list, user[0].me_block_list, file_array, matchTheOneDoc);
                console.log("==========filteringList============");
                console.log(filteringList);
                var theOneSortingDoc = filteringList;

                // evaluation(user[0], theOneSortingDoc)
                // [1,1] means A will add to B's list, and vice versa
                // [0,1] means A will add to B's list
                var evaluationResultList = [];
                evaluationResultList = eva.evaluation(user[0], theOneSortingDoc);
                console.log("==========evaluationResultList============");
                console.log(evaluationResultList);
                // [ { userId: 'U5979300808a6bbe3ddbdf72adfd9f96d',
                // pushUser: 1,
                // userMsg: '首次推薦，想要認識對方嗎？',
                // userResp: 'yet',
                // theOneId: 'U36f3f481ed38216ea10cecd1fd9fe195',
                // pushTheOne: 1,
                // theOneMsg: '首次推薦，想要認識對方嗎？',
                // theOneResp: 'yet' } ]
		if(evaluationResultList.length !== 0) {
                // push message, depends on evaluationResultList
                // send email or send LINE message (w/ recommendations) to clients
                // var temp_user_list = user[0].recomToMe_list;
                var wholeList = [];
                // Add previous old list to whole list
                // 使用者的推薦清單
                wholeList = preTheOneList;
                // console.log("==========wholeList============");
                // console.log(wholeList);
                evaluationResultList.forEach(function(evaDoc, evaIndex, evaArray) {
                  // Push message to new theone
                  if(evaDoc.pushUser === 1) {
                    myBot.pushLineMessage(evaDoc.userId, evaDoc.userMsg, evaDoc.theOneId); // and time
                  }
		  if (evaDoc.pushTheOne === 1) {
                    myBot.pushLineMessage(evaDoc.theOneId, evaDoc.theOneMsg, evaDoc.userId); // and time
                  }

                  // Add new theone into user's whole list
                  // 把評估後的新的theone人選，加入使用者推薦清單，含使用者對theone的回應
                  wholeList.push({theone_user_id: evaDoc.theOneId, response: evaDoc.userResp});
                  // console.log("==========wholeList 2============");
                  // console.log(wholeList);

                  // 相反的，也把新的user的ID，加入theone的推薦清單，含theone對使用者的回應
                  // 找到要儲存的theone的recom list
                  for(var i=0;i<matchTheOneDoc.length;i++){
                    if(evaDoc.theOneId === matchTheOneDoc[i].line_userid){
                      // 放到recom list
                      matchTheOneDoc[i].recomToMe_list.push({theone_user_id: evaDoc.userId, response: evaDoc.theOneResp});
                      // Save theone update info to DB
                      matchTheOneDoc[i].save(function (err) {
                        if (err) console.log('Theone save unsuccessful.');
                      });
                    }
                  }

                }); // end evaluationResultList.forEach

                // Save/Update to Database
                // 1. A's thone's features
                // 2. Save to recomToMe_list.theone_user_id, recomToMe_list.response
                // 3. Save log: from evaluationResultList + time
                // which neams: A's recomToMe_list will add 1,2,3, and A will be added to 4/5/6's recomToMe_list
                // whole list add to schema
                // wholeList有舊和新的推薦名單
                user[0].recomToMe_list = wholeList;
                // console.log("==========wholeList 3============");
                // console.log(wholeList);

                // Save user update info to DB
                user[0].save(function (err) {
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
        });// end find
      }// end else in outer find
    });//end outer find
    done();
  }); // end define

  // Wait for agenda to connect. Should never fail since connection failures
  // should happen in the `await MongoClient.connect()` call.
  await new Promise(resolve => agenda.once('ready', resolve()));

  // Schedule a job for 1 second from now and persist it to mongodb.
  // Jobs are uniquely defined by their name, in this case "hello"
  //agenda.every('1 seconds', 'hello');
  agenda.schedule(new Date(Date.now() + 1000), 'find the best mate');
  agenda.start();
/*
  agenda.on('ready', function() {
    //agenda.every('1 week', 'find the best mate');
    agenda.every('1 weeks', 'find the best mate');
    agenda.start();
  });
  */
}

run().catch(error => {
  console.error(error);
  process.exit(-1);
});
