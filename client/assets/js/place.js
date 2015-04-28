var placeApp = angular.module('skate.Place', []);

/** Service */
placeApp.factory('placeService', function($http, $q) {

    var userPosition = getCurrentPosition().then(function(position) {
        return position;
    });
    var places = [];

    /**
     * Get places from backend
     * @param  {[type]} coords [description]
     * @return {[type]}        [description]
     */
    function getPlaces(coords) {
        var coords = coords ? coords : getCurrentPosition(); // If coords is null get current position
        endPoint = 'http://manu.fhall.se/p3b/place_by_coor.php';
       // var endPoint = 'http://p3b.dev/place_by_coor.php';

        var dfr = $q.defer();

        $http.get(endPoint, {'lat': coords.latitude, 'lng': coords.longitude}).success(function(data) {
            data = data.data;

            for (var i = 0; i < data.length; i++) { // Loopa igenom alla hämtade platser
                place = convertPlace(data[i]);
                // place.id = place.longitude + ',' + place.latitude;
                place.id = i;
                places[place.id] = place;
            }

            dfr.resolve(places); // Return places
        });
        return dfr.promise; // Return a promise
    }

    function getPlace(id) {
        var place = null;
         endPoint = 'http://manu.fhall.se/p3b/get_place.php';
        //var endPoint = 'http://p3b.dev/get_place.php';

        var dfr = $q.defer();

        if (places[id]) {
            dfr.resolve(places[id]);
        } else {
            $http.get(endPoint, {'pid': id}).success(function(data) {
                place = data;
                console.log(data);
            });

            dfr.resolve(place);
        }

        return dfr.promise;
    }

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
            return getPlaces(coords);
        },
        getPlace: function(id) {
            return getPlace(id);
        },
        getCurrentPosition: function() {
            return userPosition;
        }
    };
});

/** Controllers */
placeApp.controller('getPlaces', ['$scope', 'placeService', function($scope, placeService) {
    placeService.getPlaces().then(function(places) {
        console.log(places);
        $scope.places = places;
    });
}]);

placeApp.controller('getPlace', ['$scope', 'placeService', function($scope, placeService) {
    placeService.getPlace($scope.params.placeId).then(function(place ) {
        $scope.place = place;
    });
}]);
