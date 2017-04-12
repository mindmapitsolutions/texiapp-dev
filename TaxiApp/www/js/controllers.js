angular.module('taxi.controllers', ['ngCordova'])

/***********
Startup Map Controller to show device location
***********/
.controller('ShowMapController', function ($scope, $cordovaGeolocation) {

    navigator.geolocation.getCurrentPosition(onSuccess, onError);

    function onSuccess(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        console.log("lat : " + lat + " lng : " + lng);

    }

    function onError(error) {
        console.log('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
    }

    var posOptions = {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
    };

    $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
        var lat = position.coords.latitude;
        var long = position.coords.longitude;

        var myLatlng = new google.maps.LatLng(lat, long);

        var mapOptions = {
            center: myLatlng,
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        var map = new google.maps.Map(document.getElementById("map"), mapOptions);

        var marker = new google.maps.Marker({
            position: myLatlng,
            title: "You Are Here!"
        });

        marker.setMap(map);

        $scope.map = map;
        //$ionicLoading.hide();

    }, function (err) {
        //$ionicLoading.hide();
        console.log(err);
    });
})
//*****  End of ShowMapController

/***********
  Controller to send device location to database
***********/

.controller('SendLocationController', function ($scope, $cordovaGeolocation, SaveMyData) {

    $scope.saveMyPos = function () {



        var posOptions = { timeout: 10000, enableHighAccuracy: true };
        $cordovaGeolocation.getCurrentPosition(posOptions)  // it will get current device position

        .then(function (position) {
            var lat = position.coords.latitude
            var long = position.coords.longitude


            SaveMyData.create({ lati: lat, longi: long }).success(function (savedTodo) {
                $scope.todos.push(savedTodo);
            }).error(function (error) {
                alert('Failed to save');
            });
        })

    };

})
//*****  End of SendLocationController

/***********
  Controller to login facebook
***********/
.controller('FbLoginController', function ($scope, $state, $q, UserService, $ionicLoading, SaveMyData) {
    // This is the success callback from the login method
    var fbLoginSuccess = function (response) {
        if (!response.authResponse) {
            fbLoginError("Cannot find the authResponse");
            return;
        }

        var authResponse = response.authResponse;

        getFacebookProfileInfo(authResponse)
        .then(function (profileInfo) {
            // For the purpose of this example I will store user data on local storage
            UserService.setUser({
                authResponse: authResponse,
                userID: profileInfo.id,
                name: profileInfo.name,
                email: profileInfo.email,
                picture: "http://graph.facebook.com/" + authResponse.userID + "/picture?type=large"
            });

            $ionicLoading.hide();
            $state.go('app.devicelocation');
        }, function (fail) {
            // Fail get profile info
            console.log('profile info fail', fail);
        });
    };

    // This is the fail callback from the login method
    var fbLoginError = function (error) {
        console.log('fbLoginError', error);
        $ionicLoading.hide();
    };

    // This method is to get the user profile info from the facebook api
    var getFacebookProfileInfo = function (authResponse) {
        var info = $q.defer();

        facebookConnectPlugin.api('/me?fields=email,name&access_token=' + authResponse.accessToken, null,
          function (response) {
              console.log(response);
              info.resolve(response);
          },
          function (response) {
              console.log(response);
              info.reject(response);
          }
        );
        return info.promise;
    };

    //This method is executed when the user press the "Login with facebook" button
    $scope.facebookSignIn = function () {
        facebookConnectPlugin.getLoginStatus(function (success) {
            if (success.status === 'connected') {
                // The user is logged in and has authenticated your app, and response.authResponse supplies
                // the user's ID, a valid access token, a signed request, and the time the access token
                // and signed request each expire
                console.log('getLoginStatus', success.status);

                // Check if we have our user saved
                var user = UserService.getUser('facebook');   // ll be calling our rethinkdb get/with his id

                if (!user.userID) { // ll call this if our user is not logged in
                    getFacebookProfileInfo(success.authResponse)
					.then(function (profileInfo) {
					    // this example will store user data on local storage and ll call createUser to add his data
					    UserService.setUser({
					        authResponse: success.authResponse,
					        userID: profileInfo.id,
					        name: profileInfo.name,
					        email: profileInfo.email,
					        picture: "http://graph.facebook.com/" + success.authResponse.userID + "/picture?type=large"
					    });



					    $state.go('app.devicelocation');
					}, function (fail) {
					    // Fail get profile info
					    console.log('profile info fail', fail);
					});
                } else {
                    $state.go('app.devicelocation');
                }
            } else {
                // If (success.status === 'not_authorized') the user is logged in to Facebook,
                // but has not authenticated your app
                // Else the person is not logged into Facebook,
                // so we're not sure if they are logged into this app or not.

                console.log('getLoginStatus', success.status);

                $ionicLoading.show({
                    template: 'Logging in...'
                });

                // Ask the permissions you need. You can learn more about
                // FB permissions here: https://developers.facebook.com/docs/facebook-login/permissions/v2.4
                facebookConnectPlugin.login(['email', 'public_profile'], fbLoginSuccess, fbLoginError);
            }
        });
    };
})
//*****  End of FbLoginController

/***********
  Controller to logout facebook
***********/
.controller('FbLogoutController', function ($scope, UserService, $ionicActionSheet, $state, $ionicLoading) {
    $scope.user = UserService.getUser();

    $scope.showLogOutMenu = function () {
        var hideSheet = $ionicActionSheet.show({
            destructiveText: 'Logout',
            titleText: 'Are you sure you want to logout?',
            cancelText: 'Cancel',
            cancel: function () { },
            buttonClicked: function (index) {
                return true;
            },
            destructiveButtonClicked: function () {
                $ionicLoading.show({
                    template: 'Logging out...'
                });

                // Facebook logout
                facebookConnectPlugin.logout(function () {
                    $ionicLoading.hide();
                    $state.go('app.startup');
                },
                function (fail) {
                    $ionicLoading.hide();
                });
            }
        });
    };
})
//*****  End of FbLogoutController

/***********
  Controller to store facebook data
***********/
////.controller('TodoCtrl', function ($scope, $stateParams, todoStorage, filterFilter) {
////    $scope.todos = [];

////    $scope.newTodo = '';
////    $scope.editedTodo = null;


////    $scope.addTodo = function () {
////        var newTitle = $scope.newTodo.trim();
////        if (!newTitle.length) {
////            return;
////        }
////        var newTodo = {
////            title: newTitle,
////            completed: false
////        }
////        todoStorage.create(newTodo).success(function (savedTodo) {
////            $scope.todos.push(savedTodo);
////        }).error(function (error) {
////            alert('Failed to save the new TODO');
////        });
////        $scope.newTodo = '';
////    };

////    $scope.toggleTodo = function (todo) {
////        var copyTodo = angular.extend({}, todo);
////        copyTodo.completed = !copyTodo.completed
////        todoStorage.update(copyTodo).success(function (newTodo) {
////            if (newTodo === 'null') { // Compare with a string because of https://github.com/angular/angular.js/issues/2973
////                $scope.todos.splice($scope.todos.indexOf(todo), 1);
////            }
////            else {
////                $scope.todos[$scope.todos.indexOf(todo)] = newTodo;
////                $scope.editedTodo = null;
////            }
////        }).error(function () {
////            console.log('fds');
////            alert('Failed to update the status of this TODO');
////        });

////    };
////    $scope.editTodo = function (todo) {
////        $scope.editedTodo = todo;
////        // Clone the original todo to restore it on demand.
////        $scope.originalTodo = angular.extend({}, todo);
////    };

////    $scope.doneEditing = function (todo, $event) {
////        todo.title = todo.title.trim();
////        if ((todo._saving !== true) && ($scope.originalTodo.title !== todo.title)) {
////            todo._saving = true; // submit and blur trigger this method. Let's save the document just once
////            todoStorage.update(todo).success(function (newTodo) {
////                if (newTodo === 'null') { // Compare with a string because of https://github.com/angular/angular.js/issues/2973
////                    console.log('hum');
////                    $scope.todos.splice($scope.todos.indexOf(todo), 1);
////                }
////                else {
////                    $scope.todos[$scope.todos.indexOf(todo)] = newTodo;
////                    $scope.editedTodo = null;
////                }
////            }).error(function () {
////                todo._saving = false;
////                alert('Failed to update this TODO');
////            });
////        }
////        else {
////            $scope.editedTodo = null;
////        }
////    };

////    $scope.revertEditing = function (todo) {
////        $scope.todos[$scope.todos.indexOf(todo)] = $scope.originalTodo;
////        $scope.doneEditing($scope.originalTodo);
////    };

////    $scope.removeTodo = function (todo) {
////        todoStorage.delete(todo.id).success(function () {
////            $scope.todos.splice($scope.todos.indexOf(todo), 1);
////        }).error(function () {
////            alert('Failed to delete this TODO');
////        });
////    };

////    $scope.clearCompletedTodos = function () {
////        $scope.todos.forEach(function (todo) {
////            if (todo.completed) {
////                $scope.removeTodo(todo);
////            }
////        });
////    };

////    $scope.markAll = function (completed) {
////        $scope.todos.forEach(function (todo) {
////            if (todo.completed !== !completed) {
////                $scope.toggleTodo(todo);
////            }
////            //todo.completed = !completed;
////        });
////    };
////})

//*****  End of store



.controller('PlaylistCtrl', function ($scope, $stateParams) {
})



/***********
  Controller to store facebook data temp checking
***********/
.controller('CheckFbLoginController', function ($scope, $state, $q, UserService, $ionicLoading, SaveMyData) {
    // This is the success callback from the login method
    var fbLoginSuccess = function (response) {
        if (!response.authResponse) {
            fbLoginError("Cannot find the authResponse");
            return;
        }

        var authResponse = response.authResponse;

        getFacebookProfileInfo(authResponse)
        .then(function (profileInfo) {
            // For the purpose of this example I will store user data on local storage
            UserService.setUser({
                authResponse: authResponse,
                userID: profileInfo.id,
                name: profileInfo.name,
                email: profileInfo.email,
                picture: "http://graph.facebook.com/" + authResponse.userID + "/picture?type=large"
            });

            $ionicLoading.hide();
            $state.go('app.devicelocation');
        }, function (fail) {
            // Fail get profile info
            console.log('profile info fail', fail);
        });
    };

    // This is the fail callback from the login method
    var fbLoginError = function (error) {
        console.log('fbLoginError', error);
        $ionicLoading.hide();
    };

    // This method is to get the user profile info from the facebook api
    var getFacebookProfileInfo = function (authResponse) {
        var info = $q.defer();

        facebookConnectPlugin.api('/me?fields=email,name&access_token=' + authResponse.accessToken, null,
          function (response) {
              console.log(response);
              info.resolve(response);
          },
          function (response) {
              console.log(response);
              info.reject(response);
          }
        );
        return info.promise;
    };

    //This method is executed when the user press the "Login with facebook" button
    $scope.facebookSignIn = function () {
        facebookConnectPlugin.getLoginStatus(function (success) {
            if (success.status === 'connected') {
                // The user is logged in and has authenticated your app, and response.authResponse supplies
                // the user's ID, a valid access token, a signed request, and the time the access token
                // and signed request each expire
                console.log('getLoginStatus', success.status);

                // Check if we have our user saved
                var user = UserService.getUser('facebook');   // ll be calling our rethinkdb get/with his id

                if (!user.userID) { // ll call this if our user is not logged in
                    getFacebookProfileInfo(success.authResponse)
					.then(function (profileInfo) {
					    // this example will store user data on local storage and ll call createUser to add his data
					    UserService.setUser({
					        authResponse: success.authResponse,
					        userID: profileInfo.id,
					        name: profileInfo.name,
					        email: profileInfo.email,
					        picture: "http://graph.facebook.com/" + success.authResponse.userID + "/picture?type=large",
					    });
					    alert(success.authResponse)


					    $state.go('app.devicelocation');
					}, function (fail) {
					    // Fail get profile info
					    console.log('profile info fail', fail);
					});
                } else {
                    $state.go('app.devicelocation');
                }
            } else {
                // If (success.status === 'not_authorized') the user is logged in to Facebook,
                // but has not authenticated your app
                // Else the person is not logged into Facebook,
                // so we're not sure if they are logged into this app or not.

                console.log('getLoginStatus', success.status);

                $ionicLoading.show({
                    template: 'Logging in...'
                });

                // Ask the permissions you need. You can learn more about
                // FB permissions here: https://developers.facebook.com/docs/facebook-login/permissions/v2.4
                facebookConnectPlugin.login(['email', 'public_profile'], fbLoginSuccess, fbLoginError);
            }
        });
    };
});
//*****  End of store