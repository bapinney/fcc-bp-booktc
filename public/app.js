console.log("%capp.js loaded","background-color:darkgreen; color:white; font-size:12px")
var gBooksURI = "https://www.googleapis.com/books/v1/volumes?q=";

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
    $scope.pollingCompleted = false;
    $scope.error = false;
    $scope.statusMessage = "Loading data 123...";
    $scope.$on('$stateChangeSuccess', function() { 
        console.log("%c At allbooks $sCS!", "color:blue; font-size:16px");
        var grid = angular.element("#book-grid");
        console.log("Polling for all books...");
      
        var req = {
            method: 'POST',
            url: "getbooks",
            data: { page: 0, limit: 30}
        };
        
        $http(req).then(
            function(res) { //Success function
                console.log("Setting pollingCompleted to true...");
                console.dir(res);
                $scope.pollingCompleted = true;
                $scope.error = false;
                //$scope.statusMessage = "should not show..."; -- Works
                $scope.pages = res.data.pages;
                $scope.page = res.data.page;
                $scope.books = res.data.data;
            },
            function(res) { //Error function text is in res.data
                console.log("At error func");
                $scope.pollingCompleted = true;
                $scope.error = true;
                $scope.statusMessage = `Error returned by server: ${res.data}`;
            }
        )
    });
    
    $scope.nextPage = function() {
        console.log("Next Page clicked");
    }
    
});

ngApp.directive('dlEnter', function() {
    return function(scope, element, attributes) {
        //Bind the event to that element
        element.bind("keydown keypress", function(event) {
            var keyCode = event.which || event.keyCode; //Save the value of the one that isn't null
            
            if (keyCode === 13) {// Enterkey
                console.log("Enter key was pressed! :D");
                scope.$apply(function() {
                    scope.$eval(attributes.dlEnter);
                });
                
                event.preventDefault(); //Don't let the UA do anything else on this event...
            }
        })
    }
})

ngApp.controller('addbook', function($scope, $compile, $http) {
    console.log("At allbooks");
    
    $scope.add_disabled = true; //Keep the button disabled at the start
    $scope.book = {};
    
    //Use the ol' Moby Dick book cover as a placeholder, until the end-user clicks on a book title to preview
    $scope.book.img2use = "/images/moby dick.jpg";
    
    //Gets fired on page change within app or when refreshed anew
    $scope.$on('$stateChangeSuccess', function() { 
        console.log("%c At addbook $sCS!", "color:blue");
        //Sets focus to the Book Title INPUT, the first input on this page
        
        angular.element("#title_input").focus();
    });
    
    /**
     * Dummy function used to prevent default event responses.  Used in SELECT to prevent the enter key from causing a form submit
     */
    $scope.preventDefault = function() {
        console.log("At pD");
    }
    
    $scope.searchButtonClick = function() {
        console.log("Search button clicked...");
        if ($("#status_text").hasClass("status_text_error")) {
            console.log("Removing status_text_error");
            $("#status_text").removeClass("status_text_error");
        }
        console.log("Adding UI feedback to button...");
        $("#search_button").addClass("searching-indicator");
        console.log("Disabling the Add Book button, in case this is a secondary search...");
        $scope.add_disabled = true;
        var searchQuery = $("#title_input")[0].value;
        console.log(`SearchQuery is ${searchQuery}`);
        var queryURI = gBooksURI + encodeURIComponent(searchQuery);
        console.log(`queryURI is ${queryURI}`);
        $("#status_text").text("Searching for books...");
                
        /* Just so I don't forget... The $http legacy promise methods success and error have been deprecated. Use the standard "then" method instead. */
        
        $http.get(queryURI)
        .then(function(response) {
            console.dir(response);
            if (response.data.hasOwnProperty("items")) {
                console.log("We have items!!!");
                //Hide the status text...
                $("#status_text").text("");
                console.log(response.data.items.length);
                console.log("Setting $scope.searchResults to response.data");
                $scope.searchResults = response.data;
                console.log("Calling updateResultsList...");
                $scope.updateResultsList();
            }
            else { //Not an error, but no results returned.  There sill not be a response.data.error.message, as this is not an error but simply just no results...
                console.log("No results returned");
                $("#status_text").addClass("status_text_error");
                $("#status_text").text("Error: No results returned");
            }
            angular.element("#book_select").focus();
        }, function(response) {
            console.dir(response);
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
        //console.dir($scope);
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
        console.log("Update results list called...");
        console.log("Clearing previous results, if any...");
        angular.element("#book_select").empty();
        console.dir($scope);
        console.dir($scope.searchResults);
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
        console.dir($scope);
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
                console.log("Book added!")
            }
        }, function(response) { //Error
            console.log("At error");
            $scope.resultError = true;
            $scope.resultErrorMessage = "idk, my bff Jill?";
            window.alert("There was an error processing your request: " + response.data);
        });
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

ngApp.controller('profile', function($scope, $http) {
   console.log("Inside profile controller");
    $scope.$on('$stateChangeSuccess', function() {
        angular.element("#form_name").focus();
    });
    
    $scope.updateProfile = function() {
        console.log("updateProfile called!");
        console.dir($scope);
        
        var data = {
            fullname: $scope.fullname,
            city:     $scope.city,
            state:    $scope.state
        }
        
        
        var config = {
            headers : {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
            }
        };
        
        angular.element("#form_button").removeClass("btn-success").addClass("btn-info").text("Updating...");
        $http.post("updateProfile", data)
    }
    
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