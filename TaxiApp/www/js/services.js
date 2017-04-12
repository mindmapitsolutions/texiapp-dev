angular.module('taxi')

.factory('SaveMyData', function ($http) {
    var STORAGE_ID = 'saveMyData-angularjs';

    return {
        get: function () {
            var url = 'http://localhost:3000/checklogin';
            return $http.get(url);
        },
        create: function (todo) {
            var url = 'http://localhost:3000/checklogin';
            return $http.post(url, todo);
        },
        update: function (todo) {
            var url = 'http://localhost:3000/checklogin/' + todo.id;
            return $http.put(url, todo);
        }
    };
})

.service('UserService', function () {
    // For the purpose of this example I will store user data on ionic local storage but you should save it on a database
    var setUser = function (user_data) {
        // this is to save our user 
        window.localStorage.starter_facebook_user = JSON.stringify(user_data);
    };

    var getUser = function () {
        //this is to get user
        return JSON.parse(window.localStorage.starter_facebook_user || '{}');
    };

    return {
        getUser: getUser,
        setUser: setUser
    };
})