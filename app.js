#!/usr/bin/env nodejs
var express = require('express');
var path = require('path');
var exphbs = require('express-handlebars');

var expressValidator = require('express-validator');
var flash = require('connect-flash');

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
const MongoStore = require('connect-mongo')(session);

var passport = require('passport');

var nodemailer = require('nodemailer');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
var mongoose = require('mongoose');
// Config
var config = require('./config');
// Model
// mongoose.connect('mongodb://'+config.domain+'/loginapp', { useMongoClient: true });
mongoose.connect(config.getDbUrl(), { useMongoClient: true });
var db = mongoose.connection;
// Agenda
var agenda = require('./agenda2');

// Init App
var app = express();

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({
  defaultLayout:'layout'
}));
app.set('view engine', 'handlebars');

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Express Session
app.use(session({
    store: new MongoStore({url: config.getDbUrl()}),
    secret: 'recommand 128 bytes random string',
    saveUninitialized: true,
    resave: true
}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Express Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

// Connect Flash
app.use(flash());

// Global Vars
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

// Route
var routes = require('./routes/index');
app.use('/', routes);
var users = require('./routes/users');
app.use('/users', users);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || config.getServerPort(), function() {
  var port = server.address().port;
  console.log("App now running on port", port);
});
