// Config
var config = require('./config');

module.exports.filtering = function(user, wishList, blockList, file_array){
  var count = 0;
  var theOneUserIdList = file_array; // Since userid is the same with picture name, so assign directly
  //var wishList = user.recomToMe_list; // user's list, initial is []
  //var blockList = user.me_block_list; // user's block list, initial is []
  var isBlock = false; // A flag that checks if theone is blocked by user
  var filteringList = [];
  var BreakOuterException = {};
  var BreakInnerException = {};
  var BreakBlockException = {};

  try {
      if(theOneUserIdList.length == 0){
        // there's no any recommendations
        filteringList = [];
      } else {

        theOneUserIdList.forEach(function(theOneUserID, outerIndex, outerArray) {
            //console.log("======== theOneUserID ========");
            //console.log(theOneUserID);

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
              isBlock = false;
              // Next outer item
              return;
            }
            // if theone = user self, leave outer loop
            else if(theOneUserID === user.line_userid){
              // Next outer item
              return;
            }
            // if it's not been blocked
            else {
                try {
                    // If wish list is 0 at the beginning (no recommendations)
                    if(wishList.length === 0){
                      //console.log("innerArray length 0: " + wishList.length);
                      // Push to A & B anyways
                      // theOneUserID add to wishList id
                      filteringList.push({theone_user_id: theOneUserID});
                      count++;
                      // Add A to B's list
                    } else {
                        // Wish list loop
                        wishList.forEach(function(userWishUser, innerIndex, innerArray){
                          //console.log("======== userWishUser ========");
                          //console.log(userWishUser);
                          if(theOneUserID === userWishUser.theone_user_id) {
                            //console.log("innerArray same");
                            // the same, break wishList forEach
                            throw BreakInnerException;
                          } else if (theOneUserID !== userWishUser.theone_user_id) {
                            //console.log("innerArray different");
                            // Not the same, and if userWishUser is lastone
                            // 代表媒婆推薦給你的人，沒有在推薦過的名單中
                            if(innerIndex === innerArray.length - 1){
                              //console.log("innerArray to the last");
                              // Such theOneUserID add to filteringList
                              // 就把這個人加入過濾名單中
                              filteringList.push({theone_user_id: theOneUserID});
                              count++;
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
                  //console.log("MAX reach");
                  count=0;
                  // break theOneUserIdList forEach
                  throw BreakOuterException;
                // If there's nothing more to recommend
                } else if(outerIndex === outerArray.length - 1){
                  //console.log("nothing more to recommend");
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
  return filteringList;
}
