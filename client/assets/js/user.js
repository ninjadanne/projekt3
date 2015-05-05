var userApp = angular.module('skate.User', []);

/** Service */
userApp.factory('userService', function($http, $q) {
    var user = {
        // id: null
        id: 1
    };

    /**
     * Login function
     * @param  {[type]} username [description]
     * @param  {[type]} password [description]
     * @return {[type]}          [description]
     */
    function login(username, password) {
        userId = 1;

        user.id = userId;
        return userId;
    }

    return {
        getUser: function() {
            return user;
        },
        login: function(username, password) {
            return login(username, password);
        }
    };
});

/** Controllers */

userApp.controller('userController', ['$scope', 'userService', function($scope, userService) {
    user = null;
    user = userService.getUser();

    $scope.login = function() {
        userService.login();
        user = userService.getUser();
    };

    $scope.userId = user.id;
}]);