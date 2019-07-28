// Config
var config = require('./config');
//LINE
const line = require('@line/bot-sdk');

module.exports.pushLineMessage = function(userId, msg, otherSideId) {
  const client = new line.Client({
    channelAccessToken: config.getChannelAccessToken()
  });
/*
  const message = {
    type: 'text',
    text: msg
  };*/
  const message = {
    "type": "template",
    "altText": msg,
    "template": {
        "type": "buttons",
        "thumbnailImageUrl": "https://" + config.getPyDomain() + "/show/self/" + otherSideId + ".jpeg",
	"imageAspectRatio": "square",
        "title": msg,
        "text": "請選擇接受/拒絕對方",
        "actions": [
            {
              "type": "postback",
              "label": "接受",
              "data": "yes&" + otherSideId // send data to linebot, including "accept" and "other side ID"
            },
            {
              "type": "postback",
              "label": "拒絕",
              "data": "no&" + otherSideId
            }
        ]
    }
  };

  client.pushMessage(userId, message)
    .then(() => {

    })
    .catch((err) => {
      // error handling
    });
}

module.exports.pushSettingMessage = function(user_id, msg) {
  console.log(user_id + ": " + msg);
  const client = new line.Client({
    channelAccessToken: config.getChannelAccessToken()
  });

  const message = {
    type: 'text',
    text: msg
  };

  client.pushMessage(user_id, message)
    .then(() => {

    })
    .catch((err) => {
      // error handling
    });
}


module.exports.pushContact = function(user_id, msg, otherSideId) {

  const client = new line.Client({
    channelAccessToken: config.getChannelAccessToken()
  });

  const message = {
    "type": "template",
    "altText": "新的適合對象出現了！趕快認識對方吧！",
    "template": {
        "type": "buttons",
        "thumbnailImageUrl": "https://" + config.getPyDomain() + "/show/self/" + otherSideId + ".jpeg",
	"imageAspectRatio": "square",
        "title": msg,
        "text": "以下更多功能可以提供選擇。",
        "actions": [
            {
              "type": "postback",
              "label": "評價 | 評論 | 封鎖",
              "data": "ratingCommentBlock&" + otherSideId // send data to linebot, including "accept" and "other side ID"
            }
        ]
    }
  };

  client.pushMessage(user_id, message)
    .then(() => {

    })
    .catch((err) => {
      // error handling
    });
}
