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
skateMap.controller("mapController", function($scope, $http, uiGmapGoogleMapApi, placeService) {
    // Hämta användarens nuvarande position
    placeService.getCurrentPosition().then(function(userPosition) {
        // Centrera kartan
        $scope.map = { center: { latitude: userPosition.latitude, longitude: userPosition.longitude }, zoom: 12, bounds: {} };

        /** Skapa en markör för användarens position */
        userPositionMarker = {
            id: 'userPosition',
            latitude: userPosition.latitude,
            longitude: userPosition.longitude,
            accuracy: userPosition.accuracy,
            options: {
                icon: '/assets/img/icons/user-position.png'
            }
        };

        /** Lägg till markör användarens position till scope */
        $scope.places.push(userPositionMarker);

        /** Övervaka användarens position */
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(function(location) {
                userPositionMarker.latitude = location.coords.latitude;
                userPositionMarker.longitude = location.coords.longitude;
                userPositionMarker.accuracy = location.coords.accuracy;
            });
        }
    });
});
