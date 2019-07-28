// Config
var config = require('./config');

module.exports.filtering = function(user, wishList, blockList, ranking_array, matchTheOneDoc){
  var count = 0;
  // 媒婆挑選出來的userID清單
  var theOneUserIdList = ranking_array; // Since userid is the same with picture name, so assign directly
  //var wishList = user.recomToMe_list; // user's list, initial is []
  //var blockList = user.me_block_list; // user's block list, initial is []
  var isBlock = false; // A flag that checks if theone is blocked by user
  var filteringList = [];
  var BreakOuterException = {};
  var BreakInnerException = {};
  var BreakBlockException = {};

  try {
      if(theOneUserIdList.length == 0){
        // console.log("======== no any recommendations ========");
        // there's no any recommendations
        filteringList = [];
      } else {
        // 媒婆挑選出來的userID清單, theOneUserID
        theOneUserIdList.forEach(function(theOneUserID, outerIndex, outerArray) {
            // console.log("======== theOneUserID ========");
            // console.log(theOneUserID);
            // console.log("======== user.line_userid ========");
            // console.log(user.line_userid);

            // Check if this theOneUserID is in block list
            try {
                blockList.forEach(function(blockUser, blockIndex, blockArray){
                  if(theOneUserID === blockUser){
                    // flag this theOneUserID is blocked
                    isBlock = true;
                    // break block loop
                    throw BreakBlockException;
                  }
                  else {
                    // Next block item
                    return;
                  }
                });
            } catch (e) {
              if (e !== BreakBlockException) throw e;
            }

            // if blocked, leave outer loop
            if(isBlock){
              // console.log("======== block ========");
              isBlock = false;
              // Next outer item
              return;
            }
            // if theone = user self, leave outer loop
            else if(theOneUserID === user.line_userid){
              // console.log("======== theone = user self ========");
              // Next outer item
              return;
            }
            // if it's not been blocked
            else {
                try {
                    // If wish list is 0 at the beginning (no recommendations)
                    if(wishList.length === 0){
                      // console.log("======== userWishUser is 0 ========");
                      // // console.log("innerArray length 0: " + wishList.length);
                      // Push to A & B anyways
                      // theOneUserID add to wishList id
                      //filteringList.push({theone_user_id: theOneUserID});
                      //count++;
                      for(var i=0;i<matchTheOneDoc.length;i++){
                        // console.log("=== matchTheOneDoc for ===");
                        // console.log(matchTheOneDoc[i].line_userid);

                        //// console.log("===== IN filtering 2 ======");
                        //// console.log(matchTheOneEachDoc);
                        //// console.log(matchTheOneEachDoc.line_userid);
                        if(theOneUserID == matchTheOneDoc[i].line_userid) {
                          // console.log("=== matchTheOneDoc if ===");
                          // // console.log(matchTheOneDoc[i]);
                          // 就把媒婆推薦的人選的doc，加入過濾名單中
                          // filteringList.push({theone_user_id: theOneUserID})
                          filteringList.push(matchTheOneDoc[i]);
                          // // console.log("=== filteringList ===");
                          // // console.log(filteringList);
                          count++;
                        }
                      }
                      // Add A to B's list
                    } else {
                        // 媒婆推薦的使用者，是否在使用者的推薦清單, userWishUser
                        wishList.forEach(function(userWishUser, innerIndex, innerArray){
                          // console.log("======== userWishUser ========");
                          // // console.log(userWishUser);
                          // 媒婆推薦給你的人，有在推薦過的名單中
                          if(theOneUserID === userWishUser.theone_user_id) {
                            // console.log("innerArray same");
                            // the same, break wishList forEach
                            throw BreakInnerException;
                          // 媒婆推薦給你的人，沒有在推薦過的名單中
                          } else if (theOneUserID !== userWishUser.theone_user_id) {
                            // console.log("innerArray different");
                            // Not the same, and if userWishUser is lastone
                            if(innerIndex === innerArray.length - 1){
                              // console.log("innerArray to the last");
                              // 媒婆推薦給你的人，必須符合使用者設定的theone條件篩選
                              // console.log("=== matchTheOneDoc.length ===");
                              // console.log(matchTheOneDoc.length);

                              for(var i=0;i<matchTheOneDoc.length;i++){
                                // console.log("=== matchTheOneDoc for ===");
                                // console.log(matchTheOneDoc[i].line_userid);

                                //// console.log("===== IN filtering 2 ======");
                                //// console.log(matchTheOneEachDoc);
                                //// console.log(matchTheOneEachDoc.line_userid);
                                if(theOneUserID == matchTheOneDoc[i].line_userid) {
                                  // console.log("=== matchTheOneDoc if ===");
                                  // console.log(matchTheOneDoc[i]);
                                  // 就把媒婆推薦的人選的doc，加入過濾名單中
                                  // filteringList.push({theone_user_id: theOneUserID})
                                  filteringList.push(matchTheOneDoc[i]);
                                  // // console.log("=== filteringList ===");
                                  // // console.log(filteringList);
                                  count++;
                                }
                              }
                            }
                            // next userWishUser
                            return;
                          }
                        });// end inner forEach

                    }// end else

                } catch (e) {
                  if (e !== BreakInnerException) throw e;
                }

                // Finish inner loop, and before start outer loop
                // if reach to Max numbers of recommendations
                if(count == config.getTopTheOne()){
                  //// console.log("MAX reach");
                  count=0;
                  // break theOneUserIdList forEach
                  throw BreakOuterException;
                // If there's nothing more to recommend
                } else if(outerIndex === outerArray.length - 1){
                  //// console.log("nothing more to recommend");
                  count=0;
                  // break theOneUserIdList forEach
                  throw BreakOuterException;
                }

            }// end else block

          });// end outer forEach

        } // end else outer

  } catch (e) {
    if (e !== BreakOuterException) throw e;
  }

  // return
  // // console.log("===filteringList final===");
  // // console.log(filteringList);
  return filteringList;
}
