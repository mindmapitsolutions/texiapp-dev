// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('taxi', ['ionic', 'taxi.controllers'])

.run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (cordova.platformId === "ios" && window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);

        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
    });
})

.config(function ($stateProvider, $urlRouterProvider) {

    $stateProvider

    .state('app', {
        url: '/app',
        abstract: true,
        templateUrl: 'templates/menu.html',
        //controller: 'AppCtrl'
    })
    
    .state('app.fblogin', {
        url: '/fblogin',
        views: {
            'menuContent': {
                templateUrl: 'templates/fblogin.html',
                controller: 'FbLoginController'
            }
        }
    })

    .state('app.checkfblogin', {
        url: '/checkfblogin',
        views: {
            'menuContent': {
                templateUrl: 'templates/checkfblogin.html',
                controller: 'CheckFbLoginController'
            }
        }
    })

      .state('app.devicelocation', {
          url: '/devicelocation',
          views: {
              'menuContent': {
                  templateUrl: 'templates/devicelocation.html',
                  controller: 'SendLocationController'
              }
          }
      })

    .state('app.admin', {
        url: '/admin',
        views: {
            'menuContent': {
                templateUrl: 'templates/admin.html'
            }
        }
    })

   .state('app.fblogout', {
       url: '/fblogout',
       views: {
           'menuContent': {
               templateUrl: 'templates/fblogout.html',
               controller: 'FbLogoutController'
           }
       }
   })

   .state('app.startup', {
       url: '/startup',
       views: {
           'menuContent': {
               templateUrl: 'templates/startup.html',
               controller: 'ShowMapController'
           }
       }
   });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/startup');
});
