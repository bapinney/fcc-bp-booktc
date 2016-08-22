console.log("Starting app...");
var chalk = require('chalk');

console.log(chalk.bgBlue.white("Loading packages..."));
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

console.log(chalk.bgCyan.black("Loading routes..."));
var routes = require('./routes/index');
var users = require('./routes/users');

console.log(chalk.bgYellow.black("Initializing Express..."));
var app = express();
app.set("title","freeBookCamp");
var port = 8080; 

// view engine setup
console.log(chalk.cyan("Setting view engine to Pug..."));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

console.log(chalk.cyan("Initializing routes..."));
app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
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
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


app.listen(port, function() {
        process.stdout.write('\x07'); //BEEP
        console.log(chalk.bgGreen.black(`Listening on port ${port}.`));
});

module.exports = app;
