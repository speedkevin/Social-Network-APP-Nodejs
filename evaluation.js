function isNotInList(userId, list){
  if(list.String === undefined){
    return true;
  } else {
    list.forEach(function(value, index, array) {
      if(userId === value.theone_user_id){
        return false;
      } else {
        if(index === array.length - 1){
          return true;
        }
      }
    });
  }
}

function isInListResponse(userId, list){
  if(list.String === undefined){
    return undefined;
  } else {
    list.forEach(function(value, index, array) {
      if(userId === value.theone_user_id){
        return value.response;
      } else {
        if(index === array.length - 1){
          return undefined;
        }
      }
    });
  }
}

module.exports.evaluation = function(user, theOneSortingDoc) {
  var evaluationResult = [];
  theOneSortingDoc.forEach(function(theOneDoc, myindex, myarray) {
    var userId = user.line_userid;
    var usersList = user.recomToMe_list;
    var theOneId = theOneDoc.line_userid;
    var theOneList = theOneDoc.recomToMe_list;
    //console.log("theOneDoc: "+ theOneDoc.line_userid);
    //console.log("user.recomToMe_list: "+ user.recomToMe_list.String);

    if(user.recomToMe_list.String === undefined){
      user.recomToMe_list = [];
    };

    // if theOneUserID is not in user's recomToMe_list
    if(isNotInList(theOneId, usersList)){
      // if user.line_userid is not in theOneUser.recomToMe_list
      if(isNotInList(userId, theOneList)){
        evaluationResult.push({userId: userId, pushUser: 1, userMsg: '首次推薦，想要認識對方嗎？', userResp: 'yet',
          theOneId: theOneId, pushTheOne: 1, theOneMsg: '首次推薦，想要認識對方嗎？', theOneResp: 'yet' });
        // save [1,1] into evaluationList
        // Push both A & B later
      }
      // if user.line_userid is in theOneUser.recomToMe_list, and theOneUser's recomToMe_list's response is undefined
      else if(isInListResponse(userId, theOneList) === 'yet'){
        evaluationResult.push({userId: userId, pushUser: 1, userMsg: '首次推薦，想要認識對方嗎？', userResp: 'yet',
          theOneId: theOneId, pushTheOne: 0, theOneMsg: '', theOneResp: 'yet' });
      }
      // if user.line_userid is in theOneUser.recomToMe_list, and theOneUser's recomToMe_list's response is yes
      else if(isInListResponse(userId, theOneList) === 'yes'){
        evaluationResult.push({userId: userId, pushUser: 1,  userMsg: '對方有想要認識您，想要認識對方嗎？', userResp: 'yet',
          theOneId: theOneId, pushTheOne: 0, theOneMsg: '',  theOneResp: 'yes' });
      }
      // if user.line_userid is in theOneUser.recomToMe_list, and theOneUser's recomToMe_list's response is no
      else if(isInListResponse(userId, theOneList) === 'no'){
        evaluationResult.push({userId: userId, pushUser: 1,  userMsg: '有把您推薦過給對方，想要打破沉默，互相認識嗎？', userResp: 'yet',
          theOneId: theOneId, pushTheOne: 0, theOneMsg: '',  theOneResp: 'no'});
      }
    }
    // if theOneUserID is in user's recomToMe_list, and user's recomToMe_list's response is undefined
    else if(isInListResponse(theOneId, usersList) === 'yet'){
      // if user.line_userid is not in theOneUser.recomToMe_list
      if(isNotInList(userId, theOneList)){
        evaluationResult.push({userId: userId, pushUser: 0,  userMsg: '', userResp: 'yet',
          theOneId: theOneId, pushTheOne: 1, theOneMsg: '有把您推薦過給對方，但對方還未回應，想要主動認識對方嗎？',  theOneResp: 'yet' });
      }
      // if user.line_userid is in theOneUser.recomToMe_list, and theOneUser's recomToMe_list's response is undefined
      else if(isInListResponse(userId, theOneList) === 'yet'){
        evaluationResult.push({userId: userId, pushUser: 1,  userMsg: '您和對方都還沒有回應，想要打破沉默，互相認識嗎？', userResp: 'yet',
          theOneId: theOneId, pushTheOne: 1, theOneMsg: '您和對方都還沒有回應，想要打破沉默，互相認識嗎？' ,  theOneResp: 'yet'});
      }
      // if user.line_userid is in theOneUser.recomToMe_list, and theOneUser's recomToMe_list's response is yes
      else if(isInListResponse(userId, theOneList) === 'yes'){
        evaluationResult.push({userId: userId, pushUser: 1,  userMsg: '對方按了接受，想要認識您，想要主動認識對方嗎？', userResp: 'yet',
          theOneId: theOneId, pushTheOne: 1, theOneMsg: '正在等待對方回應，如果對方也接受，雙方就有機會更進一步認識。', theOneResp: 'yes'});
      }
      // if user.line_userid is in theOneUser.recomToMe_list, and theOneUser's recomToMe_list's response is no
      else if(isInListResponse(userId, theOneList) === 'no'){
        evaluationResult.push({userId: userId, pushUser: 0,  userMsg: '', userResp: 'yet',
          theOneId: theOneId, pushTheOne: 0, theOneMsg: '', theOneResp: 'no'});
      }
    }
    // if theOneUserID is in user's recomToMe_list, and user's recomToMe_list's response is yes
    else if(isInListResponse(theOneId, usersList) === 'yes'){
      // if user.line_userid is not in theOneUser.recomToMe_list
      if(isNotInList(userId, theOneList)){
        evaluationResult.push({userId: userId, pushUser: 1, userMsg: '正在等待對方回應，如果對方也接受，雙方就有機會更進一步認識。', userResp: 'yes',
          theOneId: theOneId, pushTheOne: 1, theOneMsg: '對方按了接受，想要認識您，想要主動認識對方嗎？', theOneResp: 'yet' });
      }
      // if user.line_userid is in theOneUser.recomToMe_list, and theOneUser's recomToMe_list's response is undefined
      else if(isInListResponse(userId, theOneList) === 'yet'){
        evaluationResult.push({userId: userId, pushUser: 1,  userMsg: '正在等待對方回應，如果對方也接受，雙方就有機會更進一步認識。', userResp: 'yes',
          theOneId: theOneId, pushTheOne: 1, theOneMsg: '對方按了接受，想要認識您，想要主動認識對方嗎？', theOneResp: 'yet'});
      }
      // if user.line_userid is in theOneUser.recomToMe_list, and theOneUser's recomToMe_list's response is yes
      else if(isInListResponse(userId, theOneList) === 'yes'){
        evaluationResult.push({userId: userId, pushUser: 1, userMsg: '恭喜！雙方都想要彼此認識！', userResp: 'yes',
          theOneId: theOneId, pushTheOne: 1, theOneMsg: '恭喜！雙方都想要彼此認識！', theOneResp: 'yes'});
      }
      // if user.line_userid is in theOneUser.recomToMe_list, and theOneUser's recomToMe_list's response is no
      else if(isInListResponse(userId, theOneList) === 'no'){
        evaluationResult.push({userId: userId, pushUser: 1,  userMsg: '正在等待對方回應，如果對方也接受，雙方就有機會更進一步認識。', userResp: 'yes',
          theOneId: theOneId, pushTheOne: 1, theOneMsg: '對方想要認識您喔！您要不要再三考慮一下，給對方一個機會呢？', theOneResp: 'no'});
      }
    }
    // if theOneUserID is in user's recomToMe_list, and user's recomToMe_list's response is no
    else if(isInListResponse(theOneId, usersList) === 'no'){
      // if user.line_userid is not in theOneUser.recomToMe_list
      if(isNotInList(userId, theOneList)){
        evaluationResult.push({userId: userId, pushUser: 0,  userMsg: '', userResp: 'no',
          theOneId: theOneId, pushTheOne: 0, theOneMsg: '', theOneResp: 'yet' });
      }
      // if user.line_userid is in theOneUser.recomToMe_list, and theOneUser's recomToMe_list's response is undefined
      else if(isInListResponse(userId, theOneList) === 'yet'){
        evaluationResult.push({userId: userId, pushUser: 0,  userMsg: '', userResp: 'no',
          theOneId: theOneId, pushTheOne: 0, theOneMsg: '', theOneResp: 'yet' });
      }
      // if user.line_userid is in theOneUser.recomToMe_list, and theOneUser's recomToMe_list's response is yes
      else if(isInListResponse(userId, theOneList) === 'yes'){
        evaluationResult.push({userId: userId, pushUser: 1,  userMsg: '對方想要認識您喔！您要不要再三考慮一下，給對方一個機會呢？', userResp: 'no',
          theOneId: theOneId, pushTheOne: 1, theOneMsg: '正在等待對方回應，如果對方也接受，雙方就有機會更進一步認識。', theOneResp: 'yes' });
      }
      // if user.line_userid is in theOneUser.recomToMe_list, and theOneUser's recomToMe_list's response is no
      else if(isInListResponse(userId, theOneList) === 'no'){
        evaluationResult.push({userId: userId, pushUser: 0,  userMsg: '', userResp: 'no',
          theOneId: theOneId, pushTheOne: 0, theOneMsg: '', theOneResp: 'no' });
      }
    }
  });
  // console.log(evaluationResult);
  return evaluationResult;
}
