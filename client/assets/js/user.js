var userApp = angular.module('skate.User', []);

/** Service */
userApp.factory('userService', function($http, $q, FoundationApi) {
    var domain = 'http://manu.fhall.se/p3b/';

    var user = {
        id: null,
        // id: Math.floor(Math.random() * 99) + 1,
        username: null,
        email: null
    };

    /**
     * Get the user from backend
     * @param  {[type]} userId [description]
     * @return {[type]}        [description]
     */
    function getUser(userId) {
        var endPoint = domain + 'get_user.php';

        var dfr = $q.defer();

        $http.post(endPoint, {'uid': userId})
        .success(function(data) {
            dfr.resolve(
                {
                    username: data.data.name,
                    email: data.data.creator_id
                }
            );
        })
        .error(function(data) {
            FoundationApi.publish('error-notifications', {title: 'Oj!', content: 'Kunde inte logga in'});
        });

        return dfr.promise;
    }

    /**
     * Login function
     * @param  {[type]} username [description]
     * @param  {[type]} password [description]
     * @return {[type]}          [description]
     */
    function login(username, password) {
        id = Math.floor(Math.random() * 99) + 1;

        var dfr = $q.defer();

        getUser(id).then(function(BEuser) {
            user = {
                id: id,
                username: BEuser.username,
                email: BEuser.email
            };

            dfr.resolve(user);
            // return user;
        });

        return dfr.promise;
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
        userService.login(username, password).then(function() {
            $scope.user = userService.getUser();
            FoundationApi.closeActiveElements('ng-scope');
        });
    }
}]);