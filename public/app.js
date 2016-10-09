var gBooksURI = "https://www.googleapis.com/books/v1/volumes?q=";

var ngApp = angular.module('fcc-bp-booktc', ['ui.router', 'ngAnimate']);

ngApp.run(function($rootScope, $http) {
    console.log("%capp.js loaded","background-color:lightgreen; color:black; font-size:12px")
    $rootScope.signedIn = document.getElementById("sign-out") !== null;
    
    

});

ngApp.config(function ($stateProvider, $urlRouterProvider) {
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

ngApp.controller('allbooks', function($scope, $rootScope, $http) {
    $scope.signedIn = $rootScope.signedIn;
    
    var itemsPerPage = 8;
    $scope.pollingCompleted = false;
    $scope.error = false;
    $scope.statusMessage = "Loading books...";
    $scope.initTooltips = function() {
        $('[data-toggle="tooltip"]').tooltip(); 
    }
    
    $scope.$on('$stateChangeSuccess', function() { 
        var grid = angular.element("#book-grid");
        $scope.myUsername = angular.element('#li-sign-out').data('username');

        if (!$rootScope.signedIn) {
            sessionStorage.setItem("preLoginPage", document.location.hash);
        }
        else {

        }
      
        var req = {
            method: 'POST',
            url: "getbooks",
            data: { page: 1, limit: itemsPerPage} //The first page is 1, NOT 0
        };
        
        $http(req).then(
            function(res) { //Success function
                $scope.pollingCompleted = true;
                $scope.error = false;
                $scope.pages = res.data.pages;
                $scope.page = res.data.page;
                $scope.books = res.data.data;
            },
            function(res) { //Error function text is in res.data
                $scope.pollingCompleted = true;
                $scope.error = true;
                $scope.statusMessage = `Error returned by server: ${res.data}`;
            }
        );
        
    });
    
    $scope.nextPage = function() {
        if (angular.element("#next_button").css("display") == "none") {
            return false;
        }
        $scope.error = false;
        $scope.statusMessage = "Fetching next page...";
        $scope.pollingCompleted = false;
        
        var req = {
            method: 'POST',
            url: "getbooks",
            data: { page: ($scope.page + 1), limit: itemsPerPage }
        }
                
        $http(req).then(
            function(res) {
                $scope.pages = res.data.pages;
                $scope.page = res.data.page;
                $scope.books = res.data.data;
                $scope.pollingCompleted = true;
            },
            function(res) {
                $scope.pollingCompleted = true;
                $scope.error = true;
                $scope.statusMessage = "Error while fetching data...";
            }
        );
    };
    
    $scope.prevPage = function() {
        if (angular.element("#prev_button").css("display") == "none") {
            return false;
        }
        $scope.error = false;
        $scope.statusMessage = "Fetching next page...";
        $scope.pollingCompleted = false;
        
        var req = {
            method: 'POST',
            url: "getbooks",
            data: { page: ($scope.page - 1), limit: itemsPerPage }
        }
                
        $http(req).then(
            function(res) {
                $scope.pages = res.data.pages;
                $scope.page = res.data.page;
                $scope.books = res.data.data;
                $scope.pollingCompleted = true;
            },
            function(res) {
                $scope.pollingCompleted = true;
                $scope.error = true;
                $scope.statusMessage = "Error while fetching data...";
            }
        );
    };
    
    $scope.tradeBook = function($event) {
        $scope.error = false;
        var book = angular.element($event.target).scope().book;
        if (typeof book == "undefined" || typeof book._id == "undefined") {
            console.log("%cUnable to find book data in JSON", "background-color: red; color: white; font-size:16px;");
            return false;
        }

        var req = {
            method: 'POST',
            url: "requestTrade",
            data: {bookRequested: book._id}
        }
        
        $http(req).then(
            function(res) {
                if (res.hasOwnProperty("data") && res.data.hasOwnProperty("status") && res.data.status == "success") {
                    $($event.target).fadeOut();
                    $scope.updateTradeBtns(); //Show the new counts in the trade buttons...
                    $scope.$emit("UpdateMyTradeReqs",{});
                }
            },
            function(res) { //Error
                if (res.hasOwnProperty("data") && res.data.hasOwnProperty("status") && res.data.hasOwnProperty("message") && res.data.status == "error") {
                    $scope.error = true;
                    $scope.statusMessage = res.data.message;
                }
            }
        )
    }
    
});

ngApp.directive('dlEnter', function() {
    return function(scope, element, attributes) {
        //Bind the event to that element
        element.bind("keydown keypress", function(event) {
            var keyCode = event.which || event.keyCode; //Save the value of the one that isn't null
            
            if (keyCode === 13) {// Enterkey
                scope.$apply(function() {
                    scope.$eval(attributes.dlEnter);
                });
                
                event.preventDefault(); //Don't let the UA do anything else on this event...
            }
        })
    }
})

ngApp.controller('addbook', function($scope, $http, $state) {
    
    $scope.add_disabled = true; //Keep the button disabled at the start
    $scope.book = {};
    
    //Use the ol' Moby Dick book cover as a placeholder, until the end-user clicks on a book title to preview
    $scope.book.img2use = "/images/moby dick.jpg";
    
    //Gets fired on page change within app or when refreshed anew
    $scope.$on('$stateChangeSuccess', function() { 
        //Sets focus to the Book Title INPUT, the first input on this page
        
        angular.element("#title_input").focus();
    });
    
    /**
     * Dummy function used to prevent default event responses.  Used in SELECT to prevent the enter key from causing a form submit
     */
    $scope.preventDefault = function() {
    }
    
    $scope.searchButtonClick = function() {
        if ($("#status_text").hasClass("status_text_error")) {
            $("#status_text").removeClass("status_text_error");
        }
        $("#search_button").addClass("searching-indicator");
        $scope.add_disabled = true;
        var searchQuery = $("#title_input")[0].value;
        var queryURI = gBooksURI + encodeURIComponent(searchQuery);
        $("#status_text").text("Searching for books...");
                
        /* Just so I don't forget... The $http legacy promise methods success and error have been deprecated. Use the standard "then" method instead. */
        
        $http.get(queryURI)
        .then(function(response) {
            if (response.data.hasOwnProperty("items")) {
                //Hide the status text...
                $("#status_text").text("");
                $scope.searchResults = response.data;
                $scope.updateResultsList();
            }
            else { //Not an error, but no results returned.  There sill not be a response.data.error.message, as this is not an error but simply just no results...
                $("#status_text").addClass("status_text_error");
                $("#status_text").text("Error: No results returned");
            }
            angular.element("#book_select").focus();
        }, function(response) {
            if (response.data.error.message.length > 0) {
                $("#status_text").addClass("status_text_error");
                $("#status_text").text("Error: " + response.data.error.message);
            }
            else {
                $("#status_text").addClass("status_text_error");
                $("#status_text").text("An error occurred while querying for data");
            }
        });
        
    }
    
    $scope.updateCoverPreview = function() {
        if (!$scope.hasOwnProperty("book")) {
            console.error("Expected $scope to have property book");
            return false;
        }
        if (!$scope.book.hasOwnProperty("selectedBook")) {
            console.error("%cExpected $scope to have property 'selectedBook'.", "background-color:black; color:red; font-size:12px");
            return false;
        }
        if (isNaN(Number($scope.book.selectedBook))) {
            console.error("%cUnabled to cast 'selectedBook' to Number.", "background-color:black; color:red; font-size:12px");
            return false;
        }
        var selectedBookIndex = Number($scope.book.selectedBook);
        
        $scope.add_disabled = false;
        angular.element("#book_preview").addClass("book_shadow");
        
                
        if (typeof $scope.searchResults.items[selectedBookIndex].volumeInfo.imageLinks !== "undefined") {
            var img2use = $scope.searchResults.items[selectedBookIndex].volumeInfo.imageLinks.thumbnail;
            $scope.book.img2use = img2use;
            $scope.book.title = $scope.searchResults.items[selectedBookIndex].volumeInfo.title;
        }
        else {
            $scope.book.img2use = "/images/hand-holding-book.jpg";
        }
    }
    
    $scope.updateResultsList = function() {
        angular.element("#book_select").empty();
        for (i=0; i < $scope.searchResults.items.length; i++) {
            var title = $scope.searchResults.items[i].volumeInfo.title;
            var option = document.createElement("option");
            
            option.text = title;
            
            //So we have a reference, using our ngModel, on what the user selected...
            option.value = i;
            angular.element("#book_select")[0].add(option);
        }
        $("#book_select")[0].disabled = false;
    }
    
    
    
    $scope.addBook = function() {
        $scope.resultError = undefined;
        var abBtn = angular.element("#add_book_button");
        $scope.add_disabled = true; //Disable the button to prevent duplicatation...
        abBtn.removeClass("add-button").addClass("adding-button").text("adding...");
        
        var book = {title: $scope.book.title,
                   image: $scope.book.img2use
                   }
        
        $http({method: 'POST',
              url: '/addnewbook',
             data: book})
        .then(function(response) {
            if (response.data.status == "added") {
                abBtn.removeClass("adding-button").addClass("add-success-button").text("Success!");
                setTimeout(function() { $state.go("mybooks");}, 5000);
            }
        }, function(response) { //Error
            $scope.resultError = true;
            $scope.resultErrorMessage = response.data;
            window.alert("There was an error processing your request: " + response.data);
            abBtn.removeClass("adding-button").addClass("add-error-button").text("Error");
        });
    }
    
});

ngApp.controller('logout', function($scope, $http) {
    $scope.$on('$stateChangeSuccess', function() { 
        document.location.href = "/"; //The purpose of this is to break out of the UI-Router container as the header will now be different (i.e., the Sign Out button will now be a Sign In button)
    });
});

ngApp.controller('mybooks', function($scope, $rootScope, $http) {
    $scope.signedIn = $rootScope.signedIn;
    
    var itemsPerPage = 8;
    
    $scope.pollingCompleted = false;
    $scope.error = false;
    $scope.statusMessage = "Loading books...";
    
    $scope.$on('$stateChangeSuccess', function() { 
        var grid = angular.element("#book-grid");
        
        var req = {
            method: 'POST',
            url: "mybooks",
            data: { page: 1, limit: itemsPerPage} //The first page is 1, NOT 0
        };
        
        $http(req).then(
            function(res) { //Success function
                $scope.pollingCompleted = true;
                $scope.error = false;
                $scope.pages = res.data.pages;
                $scope.page = res.data.page;
                $scope.books = res.data.data;
            },
            function(res) { //Error function text is in res.data
                $scope.pollingCompleted = true;
                $scope.error = true;
                $scope.statusMessage = `Error returned by server: ${res.data}`;
            }
        );
        
        
    });
    
    $scope.nextPage = function() {
        if (angular.element("#next_button").css("display") == "none") {
            return false;
        }
        $scope.error = false;
        $scope.statusMessage = "Fetching next page...";
        $scope.pollingCompleted = false;
        
        var req = {
            method: 'POST',
            url: "mybooks",
            data: { page: ($scope.page + 1), limit: itemsPerPage }
        }
                
        $http(req).then(
            function(res) {
                $scope.pages = res.data.pages;
                $scope.page = res.data.page;
                $scope.books = res.data.data;
                $scope.pollingCompleted = true;
            },
            function(res) {
                $scope.pollingCompleted = true;
                $scope.error = true;
                $scope.statusMessage = "Error while fetching data...";
            }
        );
    };
    
    $scope.prevPage = function() {
        if (angular.element("#prev_button").css("display") == "none") {
            return false;
        }
        $scope.error = false;
        $scope.statusMessage = "Fetching next page...";
        $scope.pollingCompleted = false;
        
        var req = {
            method: 'POST',
            url: "mybooks",
            data: { page: ($scope.page - 1), limit: itemsPerPage }
        }
                
        $http(req).then(
            function(res) {
                $scope.pages = res.data.pages;
                $scope.page = res.data.page;
                $scope.books = res.data.data;
                $scope.pollingCompleted = true;
            },
            function(res) {
                $scope.pollingCompleted = true;
                $scope.error = true;
                $scope.statusMessage = "Error while fetching data...";
            }
        );
    };
    
});

ngApp.controller('profile', function ($scope, $http, $state) {
    $scope.minNameLen = 6;
    $scope.minCityLen = 3;
    $scope.isRequired = true;
    $scope.$on('$stateChangeSuccess', function () {
        angular.element("#status_text").text("Fetching profile information...");
        $http({
            method: 'GET',
            url: '/profileinfo'
        }).then(function successCb(res) {
            $scope.fullname = res.data.fullname;
            $scope.city = res.data.city;
            $scope.state = res.data.state;
            angular.element("#profile_form *:disabled").removeAttr("disabled");
            angular.element("#status_text").text("");
            angular.element("#form_name").focus();
        }, function errorCb(res) {});
    });

    $scope.updateProfile = function () {
        $scope.submitDisabled = true;
        var formBtn = angular.element("#form_button");

        var data = {
            fullname: $scope.fullname,
            city: $scope.city,
            state: $scope.state
        }


        var config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
            }
        };

        angular.element("#form_button").removeClass("btn-success").addClass("btn-info").text("Updating...");


        $http({
                method: 'POST',
                url: "/updateProfile",
                data: data
            })
            .then(function (res) {
                    if (typeof res.data.status !== "undefined" && res.data.status == "success") {
                        angular.element("#form_button").removeClass("btn-info").addClass("btn-disabled-success").text("Success!");
                        window.setTimeout(function () {
                            $state.go('home');
                        }, 3000);
                    }
                },
                function (res) {
                    angular.element("#form_button").removeClass("btn-info").addClass("btn-danger").text("Error.  Please try again later.");
                });
    }

});
ngApp.directive('repeatDone', function () {
    return {
        restrict: "A", //Restricts to only Attributes
        /*
        Directives that want to modify the DOM typically use the link option to register DOM listeners as well as update the DOM. It is executed after the template has been cloned and is where directive logic will be put.

        link takes a function with the following signature, function link(scope, element, attrs, controller, transcludeFn) { ... }, where:

        scope is an Angular scope object.
        element is the jqLite-wrapped element that this directive matches.
        attrs is a hash object with key-value pairs of normalized attribute names and their corresponding attribute values.
        controller is the directive's required controller instance(s) or its own controller (if any). The exact value depends on the directive's require property.
        transcludeFn is a transclude linking function pre-bound to the correct transclusion scope.
        */
        link: function (scope, element, attrs) {
            if (scope.$last) {
                scope.$eval(attrs.repeatDone);
            }
        }
    };
});

ngApp.controller('TradeBtnsCtrl', function($scope, $http, $rootScope) {
    
    var vm = this; //Used for relaying the trade data to the view...
    
    $scope.currentPane = null;
    
    $scope.slideToggle = function(cbFunc) {
        if ($scope.requestedPane == $scope.currentPane) {
            if (typeof cbFunc == "function") {
                $("#tradeBtnsMenu").transition({"height": 0, "padding": 0}, 2500, 'easeInOutCubic', function() {
                    $scope.currentPane = null;
                    cbFunc();
                });
            }
            else {
                $("#tradeBtnsMenu").transition({"height": 0, "padding": 0}, 2500, 'easeInOutCubic', function() {
                    $scope.currentPane = null;
                });
            }
        }
        else if ($scope.currentPane == null) {
            if (parseInt($("#tradeBtnsMenu").css("height")) == 0) {
                if (typeof cbFunc == "function") {
                    $("#tradeBtnsMenu").transition({"height": 200, "padding": "10px"}, 2500, 'easeInOutCubic', function() {
                        $scope.currentPane = $scope.requestedPane;
                        cbFunc();                        
                    });
                }
                else {
                    $("#tradeBtnsMenu").transition({"height": 200, "padding": "10px"}, 2500, 'easeInOutCubic')
                    $scope.currentPane = $scope.requestedPane;
                }            
            }            
        }
        else {
            if (typeof cbFunc == "function") {
                $("#tradeBtnsMenu").transition({"height": 0, "padding": 0}, 2500, 'easeInOutCubic', function() {
                    $scope.currentPane = null;
                    cbFunc();
                });
            }
            else {
                $("#tradeBtnsMenu").transition({"height": 0, "padding": 0}, 2500, 'easeInOutCubic', function() {
                    $scope.currentPane = null;
                });
            }
        }
    }
    
    $scope.approveTrade = function(event, trade) {
        event.target.parentElement.classList.add("ti-pending");
        $http({
            method: "POST",
            url: '/acceptTrade',
            data: {
                id: trade._id
            } 
        }).then(function successCb(res) {
            if (res.data.hasOwnProperty("result") && res.data.result == "success") {
                angular.element(event.target.parentElement).remove();
                if ($scope.currentPane == "showReqsForMe") {
                    $rootScope.$emit("UpdateReqsForMe")
                }
                else {
                    $rootScope.$emit("UpdateMyTradeReqs", {});
                }
                $rootScope.updateTradeBtns();
            }
        }, function errorCb(res) {
            //console.dir(res);
        })
    }
    
    $scope.declineTrade = function(event, trade) {
        event.target.parentElement.classList.add("ti-pending");
        $http({
            method: "POST",
            url: '/declineTrade',
            data: {
                id: trade._id
            }
        }).then(function successCb(res) {
            if (res.data.hasOwnProperty("result") && res.data.result == "success") {
                angular.element(event.target.parentElement).remove();
                if ($scope.currentPane == "showReqsForMe") {
                    $rootScope.$emit("UpdateReqsForMe")
                }
                else {
                    $rootScope.$emit("UpdateMyTradeReqs", {});
                }
                $rootScope.$emit("UpdateTradeButtons", {});
            }
        }, function errorCb(res) {
        })
        event.target.parentElement.classList.add("ti-pending");
    }
    
    $scope.removeTradeEle = function(tradeDiv) {
        if (tradeDiv.tagName == "DIV" && angular.element(tradeDiv).scope().hasOwnProperty("trade")) {
            angular.element(tradeDiv).remove();
        }
    }
    
    $scope.showMyTradeReqs = function() {
        $scope.requestedPane = "showMyTradeReqs";
        if ($scope.currentPane == null) {
            $scope.slideToggle();
            $scope.queryMyTrades();
        }
        else if ($scope.currentPane !== "showMyTradeReqs") {
            $scope.slideToggle(function() {
                $scope.queryMyTrades();
                $scope.slideToggle();
            })
        }
        else {
            $scope.slideToggle();
        }
    };
        
    $scope.queryReqsForMe = function() {
        $http({
            method: "GET",
            url: '/getTradeReqsForMe'
        }).then(function successCb(res) {
            $scope.trades = res.data;
        }, function errorCb(res) {})
    }        

    
    $scope.queryMyTrades = function() {
        $http({
            method: "GET",
            url: '/getMyTradeReqs'
        }).then(function successCb(res) {
            $scope.trades = res.data;
        }, function errorCb(res) {})
    }
    
    $scope.showReqsForMe = function() {
        $scope.requestedPane = "showReqsForMe";
        if ($scope.currentPane == null) {
            $scope.slideToggle();
            $scope.queryReqsForMe();
        }
        else if ($scope.currentPane !== "showReqsForMe") {
            $scope.slideToggle(function() {
                $scope.queryReqsForMe();
                $scope.slideToggle();
            })
        }
        else {
            $scope.slideToggle();
        }
    };
    
    $scope.showUser = function(event, user) {
        angular.element(".profile-info").remove();
        if ($scope.lastShowUserTarget == event.target) {
            return false;
            $scope.lastShowUserTarget = null;
        }
        else {
            $scope.lastShowUserTarget = event.target;
            $http({url: "getProfile/" + user.userName}).then(
                function(res) {
                    var curDiv = angular.element(event.target.parentElement);
                    var city = (res.data.city == null ? "<i>(empty)</i>" : res.data.city);
                    var state = (res.data.state == null ? "<i>(empty)</i>" : res.data.state);
                    var fullname = (res.data.fullname == null ? "<i>(empty)</i>" : res.data.fullname);
                    var profInfo = angular.element(`<div>${user.userName} - Full Name: ${fullname} - City: ${city} - State: ${state}</div>`);
                    profInfo[0].classList.add("profile-info");
                    curDiv.append(profInfo);
                }
            );
        }
    }
    
    $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        $rootScope.updateTradeBtns();   
    });
    
    $rootScope.$on("UpdateTradeButtons", function() {
        $scope.updateTradeBtns();
    })
    
    $rootScope.$on("UpdateMyTradeReqs", function() {
        $scope.queryMyTrades();
    })
    
    $rootScope.$on("UpdateReqsForMe", function() {
        $scope.queryReqsForMe();
    })
    
    //$rootScope because areas outside of this controller will call it
    $rootScope.updateTradeBtns = function() {
        var req = {
            method: 'GET',
            url: "getNTrades"
        };
        $http(req).then(
            function(res) {
                if (res.data.hasOwnProperty("nReqsForYou")) {
                    $rootScope.nReqsForMe = `(${res.data.nReqsForYou})`;
                }
                if (res.data.hasOwnProperty("nYourReqs")) {
                    $rootScope.nMyReqs = `(${res.data.nYourReqs})`;
                }
            },
            function(res) { //Error
                console.error("Error fetching trade counts...");
            }
        );
    }
})

$(function() { //Document ready
    //Also works when an elements acceskey is used (instead of click)
    $(".navbar-nav>li>a").click(function(event) {
        if (event.clientX == 0 && event.clientY == 0) { //Keyboard was used instead of mouse (as clientX & Y is the mouse's position)
            $(event.target.parentElement).addClass("navKbSelect");
            $(event.target.parentElement).one("webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend", function(event) {
                $(event.target).removeClass("navKbSelect");
            });     
        }
    });
});