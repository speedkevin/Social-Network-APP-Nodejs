======== python ==========
source venv/bin/activate
python server.py

======== pip =============
pip install --upgrade pip

======== Tensorflow ==========
https://www.tensorflow.org/install/
sudo pip3 install tensorflow

install path:
/Library/Frameworks/Python.framework/Versions/3.5/lib/python3.5/site-packages

check version:
import tensorflow as tf
tf.__version__

======== virtualenv ==========
source /venv/bin/activate

======== Tensorflow CNN ==========
Blog:
http://cv-tricks.com/tensorflow-tutorial/training-convolutional-neural-network-for-image-classification/
Source code:
https://github.com/sankit1/cv-tricks.com

Issue: no module for cv2:
fix:
(venv)> pip install opencv-python
(venv)> pip install sklearn
(venv)> pip install scipy

======== mongoDB ==========
Head to mongodv shell:
cd /Users/speedkevin/mongodb/bin
mongo
=>
use loginapp

CRUD operations: https://docs.mongodb.com/manual/crud/

## Whole document ##
Create:
db.collection.save()

Search:
db.collection.find()
db.collection.find({"name":"jhtang"});

Update:
db.collection.update(query, update, options)

Delete:
db.users.deleteOne({name:"qq"})

## Items ##
ASSUME:
{
   id: 1,
   fruits: [ "apples", "pears", "oranges", "grapes", "bananas" ],
   vegetables: [ "carrots", "celery", "squash", "carrots" ]
}

Update (pull):
db.collection.update(
    { },
    { $pull: { fruits: { $in: [ "apples", "oranges" ] }, vegetables: "carrots" } },
    { multi: true }
)

Update (push):

## Javascript array ##

New/delete item:
push
pop

======== npm & node ==========

<package.json dependencies update>
npm i -g npm-check-updates
npm-check-updates -u
npm install

<npm upgrade>
sudo npm install npm@latest -g

<Update node>
sudo npm cache clean -f
sudo npm install -g n
sudo n stable

<Check node version>
node --version


======== Django ==========
pip3 install Django

======== ISSUES ==========
MODULE_NOT_FOUND
=> 重新安裝node
https://nodejs.org/en/#download

<Kill process listen to port 3000>
lsof -i tcp:3000
(e.g. PID: 12345)
kill -9 12345

TypeError: Cannot create property 'mailer' on string 'SMTP'
=>
var smtpTransport = nodemailer.createTransport('SMTP', {
  service: 'Gmail',
  auth: {
      user: 'speedkevin3@gmail.com',
      pass: '@855Speed172'
  }
});
改成
var xoauth2 = require('xoauth2');
var smtpTransport = nodemailer.createTransport('SMTP', {
  service: 'Gmail',
  auth: {
    xoauth2: xoauth2.createXOAuth2Generator({
      user: 'speedkevin3@gmail.com',
      pass: '@855Speed172'
    })
  }
});

======== waterfall template =========
async.waterfall([
    // if(event.source.userId do not exist in DB), so as URL token do not exist in DB
    function(callback) {
        var var1...
        callback(err, var1);
    },
    // Generate URL token for routing, and can not duplicate with any other token
    function(var1, callback) {
        var var2 ...
        callback(err, var1, var2);
    },
    // Save userID and this token into database under requesting user
    function(var1, var2, callback) {
        var var3 ...
        callback(err, var1, var2, var3);
    },
    function(var1, var2, var3, callback) {
        callback(err, 'done');
    }
], function (err, result) {
});
