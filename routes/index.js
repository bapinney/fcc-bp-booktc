var chalk = require('chalk');
var express = require('express');
var passport = require('passport');
var router = express.Router();
var Book = require('../models/book.js');
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
    console.dir(req.user);
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


//THIS IS POST
router.post('/addnewbook', loggedIn, function(req, res, next) {
    console.log("At addnewbook...");
    console.log("Checking for req.body.title and req.body.image...");
    if (!req.hasOwnProperty("body") ||
        !req.body.hasOwnProperty("title") ||
        !req.body.hasOwnProperty("image")) 
    {
        res.status(500).send("Unable to add book.  Please check data and try again...");
        return false;
    }
    
    var newBook = new Book({
        bookOwner: {
            userProvider: req.user.provider,
            userId: req.user.id,
            userName: req.user.username
        },
        imgUrl: req.body.image,
        title: req.body.title,
        likes: []
    });

    newBook.save(function (err, result) {
        if (err) {
            console.log("Error!");
            res.status(500).send("Error adding book to library");
            return false;
        }
        if (result) {
            console.dir(result);
            res.json({status: "added"});
            return true;
        }
        return false;
    });
    
});

router.get('/allbooks', function(req, res, next) {
    res.render("allbooks.pug");
})

router.post('/getbooks', function(req, res, next) {
    console.log(chalk.bgBlue.white("At getbooks!"));
    if (typeof req.body.page !== "undefined") {
        var page = Number(req.body.page);
        console.log("Page is " + page);
        console.log(typeof page);
    }
    else {
        var page = 1;
        console.log("Defaulting page to 1...");
    }
    if (typeof req.body.limit == "number") {
        var limit = req.body.limit;
    }
    else {
        var limit = 10;
    }
    
    Book.paginate({}, { page: page, sort: { dateAdded: -1}, limit: limit }, function(err, results) {
        console.dir(results);
        var returnJson = {};
        if (typeof results.total !== "undefined") {
            returnJson.total = results.total;
            returnJson.pages = results.pages;
            returnJson.page = results.page;
        }
        returnJson.data = results.docs;
        console.log("here is returnJson");
        res.json(returnJson);
    })
});

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
    User.findOne({
        username: req.user.username
    }, function(err, user) {
        if (err) {
            res.error("Error: " + err)
        }
        if (user) {
            res.render("profile.pug", {profile: user.profile});
        }    
    });
})

// Profile Info
router.get('/profileinfo', loggedIn, function(req, res, next) {
    console.log(chalk.cyan("At profileinfo..."));
    User.findOne({
        username: req.user.username
    }, function(err, user) {
        if (err) {
            res.json({err: "Error fetching user information"});
        }
        if (user) {
            console.log("Here is profile information being returned...");
            console.dir(user.profile);
            res.json(user.profile);
        }    
    });
});

// Splash page
router.get('/splash', function(req, res, next) {
    res.render('home');
});

router.post("/updateProfile", function (req, res, next) {
    console.log(chalk.cyan("Update Profile called!"));
    User.findOne({
        username: req.user.username
    }, function (err, user) {
        if (err) {
            console.error("Error!!!: " + err);
            res.error("Error: " + err);
        }
        if (user) {
            console.log("At user...");
            console.dir(user);
            console.log("At user._doc.profile...");
            console.dir(user._doc.profile);
            user.profile.fullname = req.body.fullname;
            user.profile.city = req.body.city;
            user.profile.state = req.body.state;
            user.save(function(err, user) {
                if (err) {
                    console.error(err);
                    res.status(500).error("Error")
                }
                else {
                    console.log("Saved called without errors!");
                    res.json({status: "success"});
                }
            });
        }

    });
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
