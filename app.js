var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var FileStore = require('session-file-store')(session);

var routes = require('./routes/index');
var specialist = require('./routes/specialist');
var search = require('./routes/search').search;
var user = require('./routes/user');
var msg = require('./routes/msg');
var hbs = require('hbs');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  store: new FileStore({retries: 1, ttl: 3600 * 24 * 30, reapInterval: 3600, logFn: function(msg){}}),
  secret: '9zhaowoapp@shenzhen',
  resave: false,
  saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/specialist', specialist);
app.use('/search', search);
app.use('/user', user);
app.use('/msg', msg);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

//app.set('env', 'development');

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    logErr('main', err);
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  logErr('main', err);
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


//==============================
global.logDbg = function(line, msg){
  if(1){
		console.log("Debug " + __filename + " " + line  + ": " + msg);
	}
}

global.logMsg = function(line, msg){
  console.log("Info " + __filename + " " + line  + ": " + msg);
}

global.logErr = function(line, msg){
  console.log("Error " + __filename + " " + line  + ": " + msg);
}

module.exports = app;
