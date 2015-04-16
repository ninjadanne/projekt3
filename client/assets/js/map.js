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
        // Do stuff with your $scope.
        // Note: Some of the directives require at least something to be defined originally!
        // e.g. $scope.markers = []

        // Stapelbäddsparken
        $scope.map = { center: { latitude: 55.613565, longitude: 12.983973 }, zoom: 12 };

        // uiGmapGoogleMapApi is a promise.
        // The "then" callback function provides the google.maps object.
        uiGmapGoogleMapApi.then(function(maps) {

        });
    });
})();
