var userApp = angular.module('skate.User', []);

/** Service */
userApp.factory('userService', function($http, $q) {
    var domain = 'http://manu.fhall.se/p3b/';

    var user = {
        // id: null
        id: Math.floor(Math.random() * 99) + 1,
    };

    getUsername(user.id);

    function getUsername(userId) {
        var endPoint = domain + 'get_user.php';

        $http.post(endPoint, {'uid': userId})
        .success(function(data) {
            user.username = data.data.name;
            user.email = data.data.creator_id;
        })
        .error(function(data) {
        });
    }

    /**
     * Login function
     * @param  {[type]} username [description]
     * @param  {[type]} password [description]
     * @return {[type]}          [description]
     */
    function login(username, password) {
        userId = Math.floor(Math.random() * 99) + 1;

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

    $scope.login = function(username, password) {
        userService.login(username, password);
        user = userService.getUser();
    };

    $scope.userId = user.id;
    $scope.user = user;
}]);