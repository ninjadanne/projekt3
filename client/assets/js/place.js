(function() {
    var placeApp = angular.module('skate.Place', []);

    placeApp.factory('placeService', function($http, $q) {
        return {
            getPlaces: function() {
                endPoint = 'http://manu.fhall.se/p3b/';
                lat = '55.5919247';
                lon = '13.0105638';
                var dfr = $q.defer();
                var places;
                $http.get(endPoint + 'place_by_coor.php', {'lat': lat, 'lng': lon}).success(function(data) {
                    places = [];
                    data = data.data;

                    dfr.resolve(places);

                    for (var i = 0; i < data.length; i++) { // Loopa igenom alla hämtade platser
                        places.push({
                            id: i,
                            idKey: i,
                            title: data[i].Name,
                            latitude: data[i].Latitude,
                            longitude: data[i].Longitude,
                            tags: data[i].Activity.split(' '), // The tags are space separated
                            description: data[i].Description,
                            rating: Math.round(data[i].Rating * 10) / 10, // Round the rating to 1 decimal
                            images: [
                                {
                                    uri: data[i].Pic_URI
                                }
                            ]
                        });
                    }
                });
                return dfr.promise; // Return a promise
            }
        };
    });
    placeApp.controller('getPlaces', ['$scope', '$http', 'placeService', function($scope, $http, placeService) {
        placeService.getPlaces().then(function(data) {
            $scope.places = data;
        });
    }]);
})();
