var chalk = require('chalk');
var express = require('express');
var passport = require('passport');
var router = express.Router();
var User = require('../models/user.js');

//Login check
var loggedIn = function(req, res, next) {
    if (req.user) {
        next();
    }
    else {
        res.render("login.pug");
    }
};

var errIfLoggedOut = function(req, res, next) {
    if (req.user) {
        next();
    }
    else {
        res.status(401).send("Must be signed in to perform this action"); //Unauthenticated
    }
}

/* GET home page. */
router.get('/', function(req, res, next) {
    if (typeof req.user !== "undefined") {
        res.render('shell', { title: req.app.get("title"), username: req.user.username });
    }
    else {
        res.render('shell', { title: req.app.get("title"), username: undefined });
    }
});

router.get('/addbook', loggedIn ,function(req, res, next) {
    res.render("addbook.pug");
});

router.get('/allbooks', function(req, res, next) {
    res.render("allbooks.pug");
})

router.get('/loginRtn', function(req, res, next) {
    res.render("loginrtn.pug");
});

router.get('/logout', function(req, res, next) {
    req.logout();
    res.render('logout.pug');
});

// My Books
router.get('/mybooks', loggedIn, function(req, res, next) {
    res.render("mybooks.pug");
})

// Profile
router.get('/profile', loggedIn, function(req, res, next) {
    console.log(chalk.cyan("At profile..."));
    User.findOne()
    
    res.render("profile.pug");
})

// Splash page
router.get('/splash', function(req, res, next) {
    res.render('home');
});

router.get('/auth/twitter', function(req, res, next) {
    passport.authenticate('twitter', function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            console.log("USER NOT DEFINED");
            return res.redirect('/');
        }
    })(req, res, next);
});


router.get('/auth/twitter/callback', passport.authenticate('twitter', {
	successRedirect : '/#/loginRtn',
	failureRedirect : '/'
}));

module.exports = router;
