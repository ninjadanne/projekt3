(function() {
    var placeService = angular.module('placeService', []);
    placeService.controller('getPlaces', function($scope, $http) {
        $http.get('http://manu.fhall.se/p3/place')
        .success(function(data, status, headers, config) {
            $scope.places = data;
        })
        .error(function(data, status, headers, config) {
        });
    });
})();
