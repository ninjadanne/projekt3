(function() {

    var mapModule = angular
    .module('googleMaps', ['uiGmapgoogle-maps', 'placeService'])
    .config(function(uiGmapGoogleMapApiProvider) {
        uiGmapGoogleMapApiProvider.configure({
            key: 'AIzaSyBovPRmUSEAduOe4SspxqSt-TngHRdRFNA',
            v: '3.17',
            libraries: 'weather,geometry,visualization'
        });
    })
    .controller("mapController", function($scope, $http, uiGmapGoogleMapApi) {
        // Centrera till Stapelbäddsparken
        $scope.map = { center: { latitude: 55.613565, longitude: 12.983973 }, zoom: 12, bounds: {} };

        $http.get('http://manu.fhall.se/p3/place')
        .success(function(data, status, headers, config) {
            // Sätt ut en markör
            var markers = [];

            $scope.$watch('markers', function() {
                $scope.markers = markers;
                console.log($scope.markers);
            });

            for (var i = 0; i < data.length; i++) {
                markers.push({
                    id: data[i].id,
                    idKey: data[i].id,
                    title: data[i].name,
                    latitude: data[i].lat,
                    longitude: data[i].lon
                });
            }

            $scope.markers = markers;
        })
        .error(function(data, status, headers, config) {
            console.log('error!');
        });

        // uiGmapGoogleMapApi is a promise
        uiGmapGoogleMapApi.then(function(maps) {
        });
    });
})();
