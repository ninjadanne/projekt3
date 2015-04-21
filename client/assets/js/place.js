(function() {
    var placeApp = angular.module('placeApp', []);
    placeApp.factory('placeService', function($http, $q) {
        return {
            getPlaces: function() {
                var dfr = $q.defer();
                var places;
                $http.get('http://manu.fhall.se/p3/place').success(function(data) {
                    dfr.resolve(data);
                });
                return dfr.promise; // Return a promise
            }
        };
    });
    placeApp.controller('getPlaces', ['$scope', '$http', 'placeService', function($scope, $http, placeService) {
        placeService.getPlaces().then(function(data) {
            $scope.places = data;
        });
    }]);
})();
