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

    /** Init the map */
    $scope.map = { zoom: 12, bounds: {}, pan: true };

    /** Marker for users position */
    userPositionMarker = null;

    /** Array with all markers */
    $scope.markers = [];

    /** Watch the places in scope and add them as markers */
    $scope.$watch('places', function() {
        $scope.markers = $scope.places;
    });

    // Get the users current position
    placeService.getCurrentPosition().then(function(userPosition) {
        // Centrera kartan
        if (userPosition.latitude == -1) {
            userPosition = { latitude: 55.613565, longitude: 12.983973, accuarcy: -1 };
        }

        setUserPosition(userPosition.latitude, userPosition.longitude, userPosition.accuracy, true);

    });

    /**
     * Set the user position and create a marker for it
     * @param {[type]} latitude  [description]
     * @param {[type]} longitude [description]
     * @param {[type]} accuracy  [description]
     * @param {[type]} centerTo  [description]
     */
    var setUserPosition = function(latitude, longitude, accuracy, centerTo) {
        if (!userPositionMarker) {
            /** Skapa en markör för användarens position */
            userPositionMarker = {
                id: 'userPosition',
                idKey: 'userPosition',
                latitude: latitude,
                longitude: longitude,
                accuracy: accuracy,
                options: {
                    icon: '/assets/img/icons/user-position.png'
                }
            };

            /** Lägg till markör användarens position till scope */
            $scope.markers.push(userPositionMarker);
        } else {
            userPositionMarker.latitude = latitude;
            userPositionMarker.longitude = longitude;
            userPositionMarker.accuracy = accuracy;
        }

        if (centerTo) {
            $scope.centerMapToUserPosition();
        }
    };

    /**
     * Center the map to the users position
     */
    $scope.centerMapToUserPosition = function() {
        if (userPositionMarker) {
            $scope.map.center = {
                latitude: userPositionMarker.latitude,
                longitude: userPositionMarker.longitude
            };
        }
    };
}]);
