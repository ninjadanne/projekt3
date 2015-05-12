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
skateMap.controller("mapController", ['$scope', 'uiGmapGoogleMapApi', 'placeService', function($scope, uiGmapGoogleMapApi, placeService) {

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

    /** Listen for the centerMapToPosition event */
    $scope.$on('centerMapToPlace', function(event, place) {
        centerMapToPosition(place.latitude, place.longitude);
    });

    // Get the users current position
    placeService.getCurrentPosition().then(function(userPosition) {
        // Center the map
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

            /** Add the user marker to the markers */
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
            centerMapToPosition(userPositionMarker.latitude, userPositionMarker.longitude);
        }
    };

    /**
     * Center the map to a position
     * @param  {[type]} latitude  [description]
     * @param  {[type]} longitude [description]
     */
    function centerMapToPosition(latitude, longitude) {
        console.log('Centering map to ' + latitude + ', ' + longitude);
        $scope.map.center = {
            latitude: latitude,
            longitude: longitude
        };
    }
}]);

skateMap.controller('placeMapController', ['$scope', 'uiGmapGoogleMapApi', 'placeService', function($scope, uiGmapGoogleMapApi, placeService){

    $scope.render = false;

    $scope.renderMap = function() {
        $scope.render = true;
    };

    $scope.$watch('render', function() {
        console.log($scope.render);
        if($scope.render === true) {
            /** Init the map */
            $scope.map = { zoom: 17, bounds: {}, pan: true };

            // Get the users current position
            placeService.getCurrentPosition().then(function(userPosition) {
                // Center the map
                if (userPosition.latitude == -1) {
                    userPosition = { latitude: 55.613565, longitude: 12.983973, accuarcy: -1 };
                }

                $scope.map.center = {
                    latitude: userPosition.latitude,
                    longitude: userPosition.longitude
                };
            });
        }
    });
}]);
