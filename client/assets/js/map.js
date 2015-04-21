(function() {

    angular.module('googleMaps', ['uiGmapgoogle-maps'])
    .config(function(uiGmapGoogleMapApiProvider) {
        uiGmapGoogleMapApiProvider.configure({
            key: 'AIzaSyBovPRmUSEAduOe4SspxqSt-TngHRdRFNA',
            v: '3.17',
            libraries: 'weather,geometry,visualization'
        });
    })
    .controller("mapController", function($scope, $http, uiGmapGoogleMapApi, placeService) {
        // Centrera till Stapelbäddsparken
        $scope.map = { center: { latitude: 55.613565, longitude: 12.983973 }, zoom: 12, bounds: {} };

        // Skapa en array med markers
        var markers = [];

        $scope.$watch('markers', function() {
            $scope.markers = markers;
        });

        // Hämta platser från placeService
        placeService.getPlaces().then(function(data) {
            for (var i = 0; i < data.length; i++) { // Loopa igenom alla hämtade markers
                markers.push({
                    id: data[i].id,
                    idKey: data[i].id,
                    title: data[i].name,
                    latitude: data[i].lat,
                    longitude: data[i].lon
                });
            }
        });

        // Sätt markers till scope
        $scope.markers = markers;
    });
})();
