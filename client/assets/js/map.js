(function() {

    angular.module('skate.Map', ['uiGmapgoogle-maps'])
    .config(function(uiGmapGoogleMapApiProvider) {
        uiGmapGoogleMapApiProvider.configure({
            key: 'AIzaSyBovPRmUSEAduOe4SspxqSt-TngHRdRFNA',
            v: '3.17',
            libraries: 'weather,geometry,visualization'
        });
    })
    .controller("mapController", function($scope, $http, uiGmapGoogleMapApi, placeService) {

        // Hämta användarens nuvarande position
        placeService.getCurrentPosition().then(function(userPosition) {
            // Initiera karta
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

        // Hämta platser från placeService
        placeService.getPlaces().then(function(data) {
            $scope.markers = data; // Sätt hämtad data som markörer
        });

    });
})();
