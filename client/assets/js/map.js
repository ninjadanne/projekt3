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
        // Standard startposition (Stapelbäddsparken, Malmö)
        var userPosition = { latitude: 55.613565, longitude: 12.983973 };

        // Initiera karta
        $scope.map = { center: { latitude: userPosition.latitude, longitude: userPosition.longitude }, zoom: 12, bounds: {} };

        // Funktion för att centrera kartan
        function centerMap(position) {
            $scope.map.center = position;
            $scope.map.refresh = true;
        }

        // Om enheten och klienten stöder geolocation
        if (navigator.geolocation) {
            // Hämta användarens position
            navigator.geolocation.getCurrentPosition(function(location) {
                userPosition = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };
                centerMap(userPosition);
            });
            // Övervaka användarens position
            navigator.geolocation.watchPosition(function(location) {
                userPosition = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                };
                centerMap(userPosition);
            });
        }

        // Övervaka markörerna
        // $scope.$watch('markers', function() {
        //     $scope.markers = markers;
        // });

        // Hämta platser från placeService
        placeService.getPlaces().then(function(data) {
            $scope.markers = data; // Sätt hämtad data som markörer
        });

    });
})();
