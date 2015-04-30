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
    });



    // Övervaka användarens position
    // if (navigator.geolocation) {
    //     navigator.geolocation.watchPosition(function(location) {
    //         userPosition = {
    //             latitude: location.coords.latitude,
    //             longitude: location.coords.longitude
    //         };
    //         $scope.map.center = userPosition;
    //         $scope.map.refresh = true;

    //         console.log(userPosition);
    //     });
    // }
});
