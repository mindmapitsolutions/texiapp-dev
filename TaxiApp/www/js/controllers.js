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

        $scope.todos = [];
        $scope.dispLat = null;
        $scope.dispLong = null;
        var posOptions = { timeout: 10000, enableHighAccuracy: true };
        $cordovaGeolocation.getCurrentPosition(posOptions)  // it will get current device position

        .then(function (position) {
            var lat = position.coords.latitude
            var long = position.coords.longitude
            $scope.dispLat = lat;
            $scope.dispLong = long;

            SaveMyData.create({ lati: lat, longi: long }).success(function (savedTodo) {
                $scope.todos.push(savedTodo);
            }).error(function (error) {
                alert(error);
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
    $scope.todo = [];
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

					    SaveMyData.create({ userId: profileInfo.id, name: profileInfo.name, email: profileInfo.email }).success(function (savedTodo) {
					        $scope.todos.push(savedTodo);
					    }).error(function (error) {
					        alert('Failed to save');
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



.controller('checktoastcntrl', function ($scope, $stateParams, $ionicPopup, $timeout) {
    $scope.showPopup = function () {
        $scope.data = {};

        // An elaborate, custom popup
        var myPopup = $ionicPopup.show({
            template: '<select ng-model="selectType" ng-change="showSelectValue(selectType)"><option>Driver</option><option>Client</option></select>',
            title: 'Select User Type!',
            scope: $scope,
            buttons: [
              {
                  text: '<b>Cancel</b>',
                  type: 'button-positive'
              },
              {
                  text: '<b>Save</b>',
                  type: 'button-positive',
                  onTap: function (e) {
                      if (!$scope.selectType) {
                          //don't allow the user to close unless he enters wifi password
                          alert(mySelect);
                      } else {
                          return $scope.selectType;
                      }
                  }
              }
            ],
        });

        $scope.showSelectValue = function (mySelect) {
            alert(mySelect);
        }


        //$scope.showSelectValue = function (mySelect) {
        //    alert(mySelect);
        //}

        myPopup.then(function (res) {
            console.log('Tapped!', res);
        });


    };

    // A confirm dialog
    $scope.showConfirm = function () {
        var confirmPopup = $ionicPopup.confirm({
            title: 'I m Confirm box',
            template: 'ok?'
        });

        confirmPopup.then(function (res) {
            if (res) {
                console.log('You are sure');
            } else {
                console.log('You are not sure');
            }
        });
    };

    // An alert dialog
    $scope.showAlert = function () {
        var alertPopup = $ionicPopup.alert({
            title: 'Don\'t Alert!',
            template: 'I m alert'
        });

        alertPopup.then(function (res) {
            console.log('i m alert box');
        });
    };

})


.controller('callLocation', function ($scope, $cordovaGeolocation) {

    $scope.getData = function () {


        var posOptions = { timeout: 10000, enableHighAccuracy: true };
        $cordovaGeolocation.getCurrentPosition(posOptions)  // it will get current device position

        .then(function (position) {
            var lat = position.coords.latitude
            var long = position.coords.longitude

            $scope.dispLat = lat;
            $scope.dispLong = long;

            var myLatlng = new google.maps.LatLng(lat, long);

            var mapOptions = {
                center: myLatlng,
                zoom: 16,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            var map = new google.maps.Map(document.getElementById("map"), mapOptions);

            $scope.map = map;
            //alert('Called in callLocation ' + lat + '   ' + long)
        }, function (err) {
            alert.log(err)
        });

        var watchOptions = { timeout: 3000, enableHighAccuracy: true };
        var watch = $cordovaGeolocation.watchPosition(watchOptions);

        watch.then(
           null,

           function (err) {
               alert.log(err)
           },

           function (position) {
               var lat = position.coords.latitude
               var long = position.coords.longitude
               alert(lat + '' + long)
           }
        );

        watch.clearWatch();
    }
})



/*********************************
checking saving
//*********************************/

/***********
  Controller to login facebook
***********/
.controller('checkFbLoginController', function ($scope, $state, $q, UserService, $ionicPopup, $ionicLoading, SaveMyData) {
    // This is the success callback from the login method
    $scope.todo = [];
    $scope.userType = null;

    $scope.showPopup = function () {


        // An elaborate, custom popup
        var myPopup = $ionicPopup.show({
            template: '<ion-select ng-model="selectType" ng-change="showSelectValue(selectType)"><ion-option selected="selected">Driver</ion-option><ion-option>Client</ion-option></ion-select>',
            title: 'Select User Type!',
            scope: $scope,
            buttons: [
              {
                  text: '<b>Cancel</b>',
                  type: 'button-positive',
              },
              {
                  text: '<b>Save</b>',
                  type: 'button-positive',
                  onTap: function (e) {
                      if (!$scope.userType) {
                          e.preventDefault();
                      } else {
                          $scope.facebookSignIn();
                      }
                  }
              }
            ],
        });

        $scope.showSelectValue = function (mySelect) {
            $scope.userType = mySelect;
        }


        //$scope.showSelectValue = function (mySelect) {
        //    alert(mySelect);
        //}

        myPopup.then(function (res) {

        });


    };


    var fbLoginSuccess = function (response) {
        if (!response.authResponse) {
            fbLoginError("Cannot find the authResponse");
            return;
        }

        var authResponse = response.authResponse;
        $scope.todos = [];

        getFacebookProfileInfo(authResponse)
        .then(function (profileInfo) {
            // For the purpose of this example I will store user data on local storage
            UserService.setUser({
                authResponse: authResponse,
                userLoginType: $scope.userType,
                userID: profileInfo.id,
                name: profileInfo.name,
                email: profileInfo.email,
                picture: "http://graph.facebook.com/" + authResponse.userID + "/picture?type=large"
            });

            var getPresentUsers = false;

            SaveMyData.checkfbUser(profileInfo.id).success(function (todo) {
                if (todo.length > 0) {
                    getPresentUsers = true;
                    $ionicLoading.hide();
                    $state.go('app.devicelocation');
                }
                else {

                    // pop check
                    alert("userLoginType" + " " + $scope.userType);

                    // pop up check

                    SaveMyData.createfb({ authResponse: authResponse, userLoginType: $scope.userType, userId: profileInfo.id, name: profileInfo.name, email: profileInfo.email, picture: "http://graph.facebook.com/" + authResponse.userID + "/picture?type=large" }).success(function (savedTodo) {
                        $scope.todos.push(savedTodo);
                        $ionicLoading.hide();
                        if ($scope.userType == "Driver")
                            $state.go('app.admin');
                    }).error(function (error) {
                        alert(error);
                    });
                }

            }).error(function (error) {
                alert(error.message);

            });

            //if (getPresentUser === false) {
            //    SaveMyData.createfb({ authResponse: authResponse, userId: profileInfo.id, name: profileInfo.name, email: profileInfo.email, picture: "http://graph.facebook.com/" + authResponse.userID + "/picture?type=large" }).success(function (savedTodo) {
            //        $scope.todos.push(savedTodo);
            //    }).error(function (error) {
            //        alert(error);
            //    });
            //}

            //$ionicLoading.hide();
            //$state.go('app.devicelocation');
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
					        userLoginType: $scope.userType,
					        userID: profileInfo.id,
					        name: profileInfo.name,
					        email: profileInfo.email,
					        picture: "http://graph.facebook.com/" + success.authResponse.userID + "/picture?type=large"
					    });

					    SaveMyData.createfb({ authResponse: authResponse, userLoginType: $scope.userType, userId: profileInfo.id, name: profileInfo.name, email: profileInfo.email, picture: "http://graph.facebook.com/" + authResponse.userID + "/picture?type=large" }).success(function (savedTodo) {
					        $scope.todos.push(savedTodo);
					        $ionicLoading.hide();
					        $state.go('app.devicelocation');
					    }).error(function (error) {
					        alert(error);
					    });
					    //SaveMyData.createfb({ userId: profileInfo.id, name: profileInfo.name, email: profileInfo.email }).success(function (savedTodo) {
					    //    $scope.todos.push(savedTodo);
					    //}).error(function (error) {
					    //    alert('Failed to save');
					    //});

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

                alert("userLoginType" + " " + $scope.userType);
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
//*****  End of FbLoginController

//*********************************

.controller('TodoCtrl', function ($scope, $stateParams, SaveMyData, filterFilter) {
    $scope.todos = [];

    SaveMyData.get().success(function (todos) {
        $scope.todos = todos;
    }).error(function (error) {
        alert(error.details + " " + error.status + " " + error.title + " " + error.source);

    });

})

.controller('checkCtrl', function ($scope, $ionicLoading, $compile) {

    var site = new google.maps.LatLng(55.9879314, -4.3042387);
    var hospital = new google.maps.LatLng(55.8934378, -4.2201905);

    var mapOptions = {
        streetViewControl: true,
        center: site,
        zoom: 18,
        mapTypeId: google.maps.MapTypeId.TERRAIN
    };
    var map = new google.maps.Map(document.getElementById("map"),
        mapOptions);

    //Marker + infowindow + angularjs compiled ng-click
    var contentString = "<div><a ng-click='clickTest()'>Click me!</a></div>";
    var compiled = $compile(contentString)($scope);

    var infowindow = new google.maps.InfoWindow({
        content: compiled[0]
    });

    var marker = new google.maps.Marker({
        position: site,
        map: map,
        title: 'Strathblane (Job Location)'
    });

    var hospitalRoute = new google.maps.Marker({
        position: hospital,
        map: map,
        title: 'Hospital (Stobhill)'
    });

    var infowindow = new google.maps.InfoWindow({
        content: "Project Location"
    });

    infowindow.open(map, marker);

    var hospitalwindow = new google.maps.InfoWindow({
        content: "Nearest Hospital"
    });

    hospitalwindow.open(map, hospitalRoute);

    google.maps.event.addListener(marker, 'click', function () {
        infowindow.open(map, marker);
    });

    $scope.map = map;

    var directionsService = new google.maps.DirectionsService();
    var directionsDisplay = new google.maps.DirectionsRenderer();

    var request = {
        origin: site,
        destination: hospital,
        travelMode: google.maps.TravelMode.DRIVING
    };
    directionsService.route(request, function (response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
        }
    });

    directionsDisplay.setMap(map);



    google.maps.event.addDomListener(window, 'load', initialize);

    $scope.centerOnMe = function () {
        if (!$scope.map) {
            return;
        }

        $scope.loading = $ionicLoading.show({
            content: 'Getting current location...',
            showBackdrop: false
        });
        navigator.geolocation.getCurrentPosition(function (pos) {
            $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
            $scope.loading.hide();
        }, function (error) {
            alert('Unable to get location: ' + error.message);
        });
    };
});