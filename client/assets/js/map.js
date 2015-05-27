/** Skate map module */
var skateMap = angular.module('skate.Map', ['uiGmapgoogle-maps']);

/** Skate map config */
skateMap.config(function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        v: '3.17',
        // libraries: 'weather,geometry,visualization'
    });
});

/** Skate map controllers */
skateMap.controller("mapController", ['$scope', 'uiGmapGoogleMapApi', 'placeService', function($scope, uiGmapGoogleMapApi, placeService) {

    /** Marker for users position */
    userPositionMarker = null;

    /** Init the map */
    $scope.map = {
        zoom: 12,
        bounds: {},
        pan: true,
        markers: [],
        center: null
    };

    /** Function for setting the map markers  */
    var addPlaceMarkers = function(places) {
        // Copy the places and set them as map markers
        $scope.map.markers = places.slice();
        getUserPosition();
    };

    /** Function for setting the current place */
    var setCurrentPlace = function(place) {
        centerMapToPosition(place.latitude, place.longitude);
    };

    /** Register observer for place list and current place in service */
    placeService.registerPlaceListObserver('map', addPlaceMarkers);
    placeService.registerCurrentPlaceObserver('map', setCurrentPlace);

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
            $scope.userPosition = userPosition;
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
        var replaced = false;
        angular.forEach($scope.map.markers, function(marker) {
            if (marker.id === userPositionMarker.id) {
                replaced = true;
                $scope.map.markers.splice(index, 1); // Remove the current user position marker
                $scope.map.markers.push(userPositionMarker); // Add the new
            }
            index++;
        });

        if (!replaced) {
            $scope.map.markers.push(userPositionMarker);
        }

        if (centerTo && !$scope.map.center) {
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

    var userPosition = null;

    var positionMarker = {
        id: 'userPosition',
        idKey: 'userPosition',
        options: {
            // icon: 'assets/img/icons/user-position.png',
            draggable: true
        },
        events: {
            dragend: function (marker, eventName, args) {
                var lat = marker.getPosition().lat();
                var lon = marker.getPosition().lng();
                positionMarker.place.latitude = lat;
                positionMarker.place.longitude = lon;
            }
        },
        coords: {},
        place: {}
    };

    var setCurrentPlacePosition = function(position) {
        placePosition = position;
    };
    placeService.registerCurrentPlaceObserver('placeMap', setCurrentPlacePosition);

    placeService.getCurrentPosition().then(function(position) {
        userPosition = position;
    });

    $scope.renderMap = function(place) {
        if (place) {
            positionMarker.place = place;
            positionMarker.coords = {
                latitude: place.latitude,
                longitude: place.longitude
            };
        } else {
            positionMarker.place = $scope.$parent.newPlace;
            positionMarker.coords = {
                latitude: userPosition.latitude,
                longitude: userPosition.longitude
            };
        }
        /** Init the map */
        $scope.map = {
            zoom: 17,
            bounds: {},
            pan: true,
            marker: positionMarker
        };

        $scope.map.center = {
            latitude: positionMarker.coords.latitude,
            longitude: positionMarker.coords.longitude
        };
    };
}]);
