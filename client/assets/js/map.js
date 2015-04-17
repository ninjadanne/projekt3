(function() {

    var mapModule = angular
    .module('googleMaps', ['uiGmapgoogle-maps'])
    .config(function(uiGmapGoogleMapApiProvider) {
        uiGmapGoogleMapApiProvider.configure({
            key: 'AIzaSyBovPRmUSEAduOe4SspxqSt-TngHRdRFNA',
            v: '3.17',
            libraries: 'weather,geometry,visualization'
        });
    })
    .controller("mapController", function($scope, uiGmapGoogleMapApi) {
        // Centrera till Stapelbäddsparken
        $scope.map = { center: { latitude: 55.613565, longitude: 12.983973 }, zoom: 12 };
        // Sätt ut en markör
        $scope.marker = {
            id: 0,
            coords: {
                latitude: 55.613565,
                longitude: 12.983973
            }
        };

        // uiGmapGoogleMapApi is a promise
        uiGmapGoogleMapApi.then(function(maps) {

        });
    });
})();
