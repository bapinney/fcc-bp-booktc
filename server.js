console.log("Starting app...");
var chalk = require('chalk');

console.log(chalk.bgBlue.white("Loading config..."));
var config = require('./config/config.js');
//The require'd file will console.log it has been loaded

console.log(chalk.bgBlue.white("Loading packages..."));
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var mongoose = require('mongoose');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session'); // To be used wit passport.session()
var uuid = require('uuid') //Used with session
var passport = require('passport');
var User = require('./models/user.js'); //Mongoose 'User' model
var TwitterStrategy = require('passport-twitter').Strategy;

console.log(chalk.bgCyan.black("Loading routes..."));
var routes = require('./routes/index');
var users = require('./routes/users');

TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY;
TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET;
CALLBACK_URI = process.env.CALLBACK_URI;

console.log(chalk.bgYellow.black("Initializing Express..."));
var app = express();
var port = 8080; 

app.set("title","freeBookCamp");

app.use(session({
    genid: function (req) {
        return uuid.v4(); // 'uuid' module
    },
    resave: true,
    saveUninitialized: true,
    secret: 'tacos'
}));

app.use(passport.initialize());
app.use(passport.session()); //Passport piggybacks off the Express session (above)

//Passport serialization and deserialization
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (obj, done) {
    done(null, obj);
})

passport.use(new TwitterStrategy({
        consumerKey: TWITTER_CONSUMER_KEY,
        consumerSecret: TWITTER_CONSUMER_SECRET,
        callbackURL: CALLBACK_URI,
        passReqToCallback: true //Allows stuff like username to be in the req
    },
    function (req, token, tokenSecret, profile, callback) {
        /*  Properties we care about:
            id, token, name, screen_name, location, description
            All but ID are strings */

        process.nextTick(function () { //Asynchronous

            //Find or Create
            console.log(chalk.bgBlack.yellow("Searching for user ID ") + profile.id);
            User.findOne({
                    provider: "twitter",
                    id      : profile.id
                },
                function (err, user) {
                    console.log(chalk.bgBlack.yellow("User callback"));
                    if (err) {
                        console.log(chalk.bgBlack.red("Error: " + err));
                        callback(err);
                    }
                    if (user) { //We found the user
                        console.log(chalk.bgBlack.green("User found"));
                        return callback(null, user);
                    } else { //User does not exist
                        console.log(chalk.bgWhite.black("User does not exist, yet"));
                        var newUser = new User({
                            provider    : "twitter",
                            id          : profile.id,
                            token       : token,
                            username    : profile.username
                            }
                        );
                        //Since newUser is a Mongoose schema from User, it has its own save method
                        console.log("About to save user: ");
                        newUser.save(function(err, newUser, numAffected) {
                            if (err) {
                                console.log("Error when saving new user: ");
                                console.error(err);
                            }
                            console.log("Num affected: " + numAffected);
                            return callback(null, newUser);
                        });
                    }
                }
            ); 
        });
    })
);


// view engine setup
console.log(chalk.cyan("Setting view engine to Pug..."));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public'), {
    strictMath: true,
    debug: true
}));
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

console.log(chalk.bgYellow.black("Setting promiseLibrary to Bluebird and connecting to MongoDB..."));
var mongooseOpts = {
    // http://mongoosejs.com/docs/promises.html#promises-for-the-mongodb-driver
    promiseLibrary: require('bluebird')
}
mongoose.connect(process.env.MONGO_URI, mongooseOpts);
global.db = mongoose.connection;

global.db.once('open', function () {
    console.log(chalk.bgGreen.black("Connected to MongoDB."));
    
    app.listen(port, function() {
        process.stdout.write('\x07'); //BEEP
        console.log(chalk.bgGreen.black(`Listening on port ${port}.`));
    });
    
});

global.db.on('error', function(error) {
    console.error(chalk.bgRed.black("Mongoose connection error: "));
    console.dir(error);
    console.log("Exiting...");
    process.exit(); //Exits with 'success' code 0 (i.e., clean exit)
});

module.exports = app;
