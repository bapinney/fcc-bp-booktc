console.log("%capp.js loaded","background-color:darkgreen; color:white; font-size:12px")

var ngApp = angular.module('fcc-bp-booktc', ['ui.router', 'ngAnimate']);
ngApp.config(function ($stateProvider, $urlRouterProvider) {
    console.log("Inside router!!!");
    console.log(typeof $urlRouterProvider);
    $urlRouterProvider.otherwise('/home'); //Where we go if there is no route

    // templateProvider: Provider function that returns HTML content string. See http://angular-ui.github.io/ui-router/site/#/api/ui.router.state.$stateProvider
    $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: 'splash'
        })
        .state('logout', {
            url: '/logout',
            templateUrl: 'logout'
        })
        .state('mybooks', {
            url: '/mybooks',
            templateUrl: 'mybooks' //Resolves to mybooks.pug in routes/index.js
        })
        .state('addbook', {
            url: '/add',
            templateUrl: 'addbook'
        })
        .state('all', {
            url: '/allbooks',
            templateUrl: 'allbooks'
        })
        .state('profile', {
            url: '/profile',
            templateUrl: 'profile'
        })
        .state('recent', {
            url: '/recent',
            templateUrl: 'recent'
        })
        .state('user', {
            url: '/user/:username',
            templateUrl: 'user' //Resolves to userpins.pug in routes.js
        });
    
    //When a user returns from auth
    $stateProvider.state('loginRtn', {
        url: '/loginRtn',
        templateUrl: 'loginrtn'
    });
    
});

ngApp.controller('allbooks', function($scope, $compile, $http) {
    console.log("At all!books");
    $scope.$on('$stateChangeSuccess', function() { 
        console.log("%c At allbooks!", "color:blue; font-size:20px");
        
    });
});

ngApp.controller('addbook', function($scope, $compile, $http) {
    console.log("At allbooks");
    
    //Gets fired on page change within app or when refreshed anew
    $scope.$on('$stateChangeSuccess', function() { 
        console.log("%c At addbook $sCS!", "color:blue; font-size:20px");    
    });
    
    $scope.searchButtonClick = function() {
        console.log("ow!!!");
    }
});

ngApp.controller('logout', function($scope, $http) {
    $scope.$on('$stateChangeSuccess', function() { 
        console.log("%c At logout!", "color:blue; font-size:20px");
        document.location.href = "/"; //The purpose of this is to break out of the UI-Router container as the header will now be different (i.e., the Sign Out button will now be a Sign In button)
    });
});

ngApp.controller('mybooks', function($scope, $compile, $http) {
    console.log("At mybooks");
    $scope.$on('$stateChangeSuccess', function() { 
        console.log("%c At mybooks!", "color:blue; font-size:20px");

    });
});

$(function() { //Document ready
    //Also works when an elements acceskey is used (instead of click)
    $(".navbar-nav>li>a").click(function(event) {
        if (event.clientX == 0 && event.clientY == 0) { //Keyboard was used instead of mouse (as clientX & Y is the mouse's position)
            //console.dir(event);
            $(event.target.parentElement).addClass("navKbSelect");
            $(event.target.parentElement).one("webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend", function(event) {
                //console.log("Animation ended...");
                //console.dir(event);
                $(event.target).removeClass("navKbSelect");
            });     
        }
    });
});