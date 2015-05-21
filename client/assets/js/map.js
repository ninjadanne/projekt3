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

    /** Marker for users position */
    userPositionMarker = null;

    /** Init the map */
    $scope.map = { zoom: 12, bounds: {}, pan: true };

    /** Array with all markers */
    $scope.map.markers = [];

    /** Function for setting the map markers  */
    var addPlaceMarkers = function(places) {
        $scope.map.markers = places;

        if (userPositionMarker === null) {
            getUserPosition();
        }
    };

    /** Function for setting the current place */
    var setCurrentPlace = function(place) {
        centerMapToPosition(place.latitude, place.longitude);
    };

    /** Register observer for place list and current place in service */
    placeService.registerPlaceListObserver(addPlaceMarkers);
    placeService.registerCurrentPlaceObserver(setCurrentPlace);

    $scope.map.markersEvents = {
        click: function(marker, eventName, model, arguments) {
            var size = model.title.length + 10;
            $scope.map.window.model = model;
            $scope.map.window.show = true;
            $scope.map.window.marker = marker;
            $scope.map.window.options.content = '<a href="#!/place/' + model.id + '" style="width: ' + size + 'em;">' + model.title + '</a>';
        }
    };

    $scope.map.window = {
        marker: {},
        model: {},
        show: false,
        closeClick: function() {
            this.show = false;
        },
        options: {} // define when map is ready
    };

    // Get the users current position
    function getUserPosition() {
        placeService.getCurrentPosition().then(function(userPosition) {
            if (userPosition.latitude == -1) {
                userPosition = { latitude: 55.613565, longitude: 12.983973, accuarcy: -1 };
            }
            $scope.userPosition = userPosition;
            // Center the map
            setUserPositionMarker(userPosition.latitude, userPosition.longitude, userPosition.accuracy, true);
        });
    }

    /**
     * Set the user position and create a marker for it
     * @param {[type]} latitude  [description]
     * @param {[type]} longitude [description]
     * @param {[type]} accuracy  [description]
     * @param {[type]} centerTo  [description]
     */
     function setUserPositionMarker(latitude, longitude, accuracy, centerTo) {
        if (!userPositionMarker) {
            /** Skapa en markör för användarens position */
            userPositionMarker = {
                id: 'userPosition',
                idKey: 'userPosition',
                latitude: latitude,
                longitude: longitude,
                accuracy: accuracy,
                options: {
                    icon: 'assets/img/icons/user-position.png'
                }
            };
        } else {
            userPositionMarker.latitude = latitude;
            userPositionMarker.longitude = longitude;
            userPositionMarker.accuracy = accuracy;
        }

        var index = 0;
        angular.forEach($scope.map.markers, function(marker) {
            if (marker.id === userPositionMarker.id) {
                $scope.map.markers.splice(index, 1); // Remove the current user position marker
                $scope.map.markers.push(userPositionMarker); // Add the new
            }
            index++;
        });

        if (centerTo) {
            $scope.centerMapToUserPosition();
        }
    }

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
