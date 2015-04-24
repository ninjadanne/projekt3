var placeApp = angular.module('skate.Place', []);

/** Service */
placeApp.factory('placeService', function($http, $q) {
    /**
     * Convert a place response from backend
     * @param  {[type]} place [description]
     * @return {[type]}       [description]
     */
    function convertPlace(place) {
        var convertedPlace = {
            title: place.Name,
            latitude: place.Latitude,
            longitude: place.Longitude,
            tags: place.Activity.split(' '), // The tags are space separated
            description: place.Description,
            rating: Math.round(place.Rating * 10) / 10, // Round the rating to 1 decimal
            images: [
                {
                    uri: place.Pic_URI
                }
            ]
        };
        return convertedPlace;
    }

    /**
     * Get the users current position
     * @return {[type]} [description]
     */
    function getCurrentPosition() {
        var dfr = $q.defer();
        // Standard startposition (Stapelbäddsparken, Malmö)
        var userPosition = { latitude: 55.613565, longitude: 12.983973 };

        // Om enheten och klienten stöder geolocation
        if (navigator.geolocation) {
            // Hämta användarens position
            navigator.geolocation.getCurrentPosition(function(location) {
                userPosition = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };
                dfr.resolve(userPosition);
            });
        }

        return dfr.promise; // Return a promise
    }

    return {
        getPlaces: function(coords) {
            coords = coords ? coords : getCurrentPosition(); // If coords is null get current position
            endPoint = 'http://manu.fhall.se/p3b/place_by_coor.php';
            var dfr = $q.defer();
            var places = [];
            $http.get(endPoint, {'lat': coords.latitude, 'lng': coords.longitude}).success(function(data) {
                data = data.data;

                for (var i = 0; i < data.length; i++) { // Loopa igenom alla hämtade platser
                    place = convertPlace(data[i]);
                    place.id = i;
                    places.push(place);
                }

                dfr.resolve(places); // Return places
            });
            return dfr.promise; // Return a promise
        },
        getCurrentPosition: function() {
            return getCurrentPosition();
        }
    };
});

/** Controllers */
placeApp.controller('getPlaces', ['$scope', '$http', 'placeService', function($scope, $http, placeService) {
    placeService.getPlaces().then(function(places) {
        $scope.places = places;
    });
}]);
