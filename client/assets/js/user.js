var userApp = angular.module('skate.User', []);

/** Controllers */

userApp.controller('userController', ['$scope', 'FoundationApi', 'userService', function($scope, FoundationApi, userService) {
    $scope.user = null;

    // Uncomment below to automatically login
    // login();

    $scope.login = function(username, password) {
        login(username, password);
    };

    $scope.logout = function() {
        $scope.user = null;
    };

    function login(username, password) {
        FoundationApi.closeActiveElements('ng-scope');
        userService.login(username, password).then(function() {
            $scope.user = userService.user;
        });
    }
}]);