/** Skate map module */
var skateMap = angular.module('skate.Map', ['uiGmapgoogle-maps']);

/** Skate map config */
skateMap.config(function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        v: '3.17',
        libraries: 'weather,geometry,visualization'
    });
});

/** Skate map controllers */
skateMap.controller("mapController", ['$scope', '$http', 'uiGmapGoogleMapApi', 'placeService', function($scope, $http, uiGmapGoogleMapApi, placeService) {

    /** Markör för användarens position */
    userPositionMarker = null;

    // Hämta användarens nuvarande position
    placeService.getCurrentPosition().then(function(userPosition) {
        // Centrera kartan
        $scope.map = { center: { latitude: userPosition.latitude, longitude: userPosition.longitude }, zoom: 12, bounds: {}, pan: true };

        /** Övervaka användarens position */
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(function(location) {
                setUserPosition(location.coords.latitude, location.coords.longitude, location.coords.accuracy);
            });
        }
    });

    var setUserPosition = function(latitude, longitude, accuracy) {
        if (!userPositionMarker) {
            /** Skapa en markör för användarens position */
            userPositionMarker = {
                id: 'userPosition',
                latitude: latitude,
                longitude: longitude,
                accuracy: accuracy,
                options: {
                    icon: '/assets/img/icons/user-position.png'
                }
            };

            /** Lägg till markör användarens position till scope */
            $scope.places.push(userPositionMarker);
        } else {
            userPositionMarker.latitude = latitude;
            userPositionMarker.longitude = longitude;
            userPositionMarker.accuracy = accuracy;
        }
    };

    $scope.centerMapToUserPosition = function() {
        if (userPositionMarker) {
            $scope.map.center = {
                latitude: userPositionMarker.latitude,
                longitude: userPositionMarker.longitude
            };
            // $scope.map.refresh = true;
        }
    };
}]);
