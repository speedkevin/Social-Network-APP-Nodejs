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
var filter = require('./filtering');
// Include evaluation
var eva = require('./evaluation');
// Include LINE bot
var myBot = require('./myLineBot');

function reqTheOneFeatures(filename) {
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
  return axios.get('http://' + config.getPythonDomain() + ':' + config.getPythonPort() + '/getTheOneFeatures/' + filename);
}

async function getTheOneFeatures(filename) {
  try {
      let features = await reqTheOneFeatures(filename);
      return features;
  } catch (jqXHR) {
      console.error("Get feature error: "+jqXHR.statusText);
      return;
  }
}

function reqProb(filename, feature) {
  return axios.get('http://' + config.getPythonDomain() + ':' + config.getPythonPort() + '/getProb/'+filename+'/'+feature);
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

  // Define a "job", an arbitrary function that agenda can execute
  agenda.define('find the best mate', function(job, done) {
    // Fetch N users from database
    User.find({"line_userid":"U5979300808a6bbe3ddbdf72adfd9f96d"}, function(err, user) {
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
      else {
          // Get filename from DB
          // var filename = 'boy01.jpg';
          var filename = user[0].theone.picture;
          console.log("filename: "+filename);

          // if theone's features is in DB

          // else
          // Asynchronous request
          // request Python server: image filename (Ajax javascript)
          // ******* file size 不能太小 *******
          // if theone's features dont exist in DB, get & Save features into DB
          getTheOneFeatures(filename).then(function(features) {
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
                filteringList = filter.filtering(user[0], user[0].recomToMe_list, user[0].me_block_list, file_array);
                console.log("==========filteringList============");
                console.log(filteringList);

                /* Retrive theone's info from Database and sorted as filteringList's order */
                // Shift from theone_user_id to conditions line_userid
                var conditions = [];
                var theOneSortingDoc = []; // The one list
                filteringList.forEach(function(value, index, array) {
                  conditions.push({line_userid: value.theone_user_id});
                });
                console.log("========== conditions ============");
                console.log(conditions);

                // 加上使用者所設的對象條件

                // Sorting
                // for each theOneUserID in filteringList
                User.find({ $or: conditions }, function(err, resultUser) {
                  // resultUser is sorted by Database
                  // console.log("resultUser: "+ resultUser[0].line_userid + " " + resultUser[1].line_userid + " " + resultUser[2].line_userid);
                  filteringList.forEach(function(outValue, outIndex, outArray) {
                    resultUser.forEach(function(inValue, inIndex, inArray) {
                      if(outValue.theone_user_id === inValue.line_userid){
                        theOneSortingDoc.push(inValue);
                      }
                    });
                  });
                  console.log("========== theOneSortingDoc ============");
                  console.log(theOneSortingDoc);
                  //console.log("sorting: "+ theOneSortingDoc[0].line_userid + " " + theOneSortingDoc[1].line_userid + " " + theOneSortingDoc[2].line_userid);

                  // evaluation(user[0], theOneSortingDoc)
                  // [1,1] means A will add to B's list, and vice versa
                  // [0,1] means A will add to B's list
                  var evaluationResultList = [];
                  evaluationResultList = eva.evaluation(user[0], theOneSortingDoc);
                  console.log("==========evaluationResultList============");
                  console.log(evaluationResultList);

                  // push message, depends on evaluationResultList
                  // send email or send LINE message (w/ recommendations) to clients
                  // var temp_user_list = user[0].recomToMe_list;
                  var wholeList = [];
                  // Add previous old list to whole list
                  wholeList = preTheOneList;
                  // console.log("==========wholeList============");
                  // console.log(wholeList);
                  evaluationResultList.forEach(function(evaDoc, evaIndex, evaArray) {
                    // Get new theone doc
                    var myNewDoc;
                    for(var i=0; i<theOneSortingDoc.length ; i++){
                      if(evaDoc.theOneId === theOneSortingDoc[i].line_userid) {
                        myNewDoc = theOneSortingDoc[i];
                      }
                    }
                    // Push message to new theone
                    if(evaDoc.pushUser === 1) {
                      myBot.pushLineMessage(evaDoc.userId, evaDoc.userMsg, myNewDoc.theOneId); // and time
                    } else if (evaDoc.pushTheOne === 1) {
                      myBot.pushLineMessage(evaDoc.theOneId, evaDoc.theOneMsg, myNewDoc.userId); // and time
                    }

                    // Add new theone into user's whole list
                    wholeList.push({theone_user_id: evaDoc.theOneId, response: evaDoc.userResp});
                    // console.log("==========wholeList 2============");
                    // console.log(wholeList);

                    // User is added to new theone's list
                    resultUser[evaIndex].recomToMe_list.push({theone_user_id: evaDoc.userId, response: evaDoc.theOneResp});
                    // Save theone update info to DB
                    resultUser[evaIndex].save(function (err) {
                      if (err) console.log('Theone save unsuccessful.');
                    });

                  });

                  // Save/Update to Database
                  // 1. A's thone's features
                  // 2. Save to recomToMe_list.theone_user_id, recomToMe_list.response
                  // 3. Save log: from evaluationResultList + time
                  // which neams: A's recomToMe_list will add 1,2,3, and A will be added to 4/5/6's recomToMe_list
                  // whole list add to schema
                  user[0].recomToMe_list = wholeList;
                  // console.log("==========wholeList 3============");
                  // console.log(wholeList);

                  // Save user update info to DB
                  user[0].save(function (err) {
                    if (err) console.log('User save unsuccessful.');
                  });


                });// end find
            }// end else
            }).catch(error => {
              console.log(error);
            }); // end getProb
          }).catch(error => {
            console.log(error);
          }); // end getFeatures
      } // end check Validation
    });//end db find
    done();
  }); // end define

  // Wait for agenda to connect. Should never fail since connection failures
  // should happen in the `await MongoClient.connect()` call.
  await new Promise(resolve => agenda.once('ready', resolve()));

  // Schedule a job for 1 second from now and persist it to mongodb.
  // Jobs are uniquely defined by their name, in this case "hello"
  //agenda.every('1 seconds', 'hello');
  //agenda.schedule(new Date(Date.now() + 1000), 'find the best mate');
  //agenda.start();

  agenda.on('ready', function() {
    //agenda.every('1 week', 'find the best mate');
    agenda.every('1 minutes', 'find the best mate');
    agenda.start();
  });
}

run().catch(error => {
  console.error(error);
  process.exit(-1);
});
