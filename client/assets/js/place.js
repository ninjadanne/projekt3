var placeApp = angular.module('skate.Place', []);

/** Service */
placeApp.factory('placeService', function($http, $q) {

    var userPosition = getCurrentPosition().then(function(position) {
        return position;
    });
    var places = [];

    var filterTags = [];

    /**
     * Get places from backend
     * @param  {[type]} coords [description]
     * @return {[type]}        [description]
     */
    function getPlaces(coords) {
        var coords = coords ? coords : userPosition; // If coords is null get current position
        endPoint = 'http://manu.fhall.se/p3b/place_by_coor.php';
       // var endPoint = 'http://p3b.dev/place_by_coor.php';

       var dfr = $q.defer();

       if (places.length > 0) {
           dfr.resolve(places);
       } else {
            $http.get(endPoint, {'lat': coords.latitude, 'lng': coords.longitude}).success(function(data) {
                data = data.data;

                for (var i = 0; i < data.length; i++) { // Loopa igenom alla hämtade platser
                    place = convertPlace(data[i]);
                    // place.id = place.longitude + ',' + place.latitude;
                    place.id = data[i].id;
                    place.keyId = place.id;

                    places.push(place);
                    addFilterTags(place.tags);
                }

                dfr.resolve(places); // Return places
            });
       }

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
            });

            dfr.resolve(place);
        }

        return dfr.promise;
    }

    function commentPlace(placeId, comment) {
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

    /**
     * Add filter tags
     * @param {[type]} tags [description]
     */
    function addFilterTags(tags) {
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

/** Get places controller */
placeApp.controller('getPlaces', ['$scope', '$filter', 'placeService', function($scope, $filter, placeService) {
    placeService.getPlaces().then(function(places) {
        $scope.places = places;
    });
    $scope.sortOrder = true;
    $scope.orderBy = function() {
        var orderBy = $filter('orderBy');
        var property = $scope.selectedItem;
        $scope.places = orderBy($scope.places, property, $scope.sortOrder.ascending);
    };
}]);

/** Get place controller */
placeApp.controller('getPlace', ['$scope', 'placeService', function($scope, placeService) {
    placeService.getPlace($scope.params.placeId).then(function(place ) {
        $scope.place = place;
    });
}]);

/** Sort and filter the places */
placeApp.controller('sortFilterPlaces', ['$scope', '$filter', 'placeService', function($scope, $filter, placeService) {
    $scope.orderBy = function() {
        var orderBy = $filter('orderBy');
        var property = $scope.selectedItem;
        $scope.places = orderBy($scope.places, property);
    };
}]);

/** Rating controller */
placeApp.controller("RatingCtrl", function($scope) {
   $scope.isReadonly = true;
})
.directive("starRating", function() {
  return {
    restrict : "EA",
    template : "<ul class='rating' ng-class='{readonly: readonly}'>" +
               "  <li ng-repeat='star in stars' ng-class='star' ng-click='toggle($index)'>" +
               "    <img zf-iconic='' icon='star' size='small' class='iconic-color'>" + //&#9733
               "  </li>" +
               "</ul>",
    scope : {
      ratingValue : "=ngModel",
      max : "=?", //optional: default is 5
      onRatingSelected : "&?",
      readonly: "=?"
    },
    link : function(scope, elem, attrs) {
      if (scope.max == undefined) { scope.max = 5; }
      function updateStars() {
        scope.stars = [];
        for (var i = 0; i < scope.max; i++) {
          scope.stars.push({
            filled : i < scope.ratingValue
          });
        }
      };
      scope.toggle = function(index) {
        if (scope.readonly == undefined || scope.readonly == false){
          scope.ratingValue = index + 1;
          scope.onRatingSelected({
            rating: index + 1
          });
        }
      };
      scope.$watch("ratingValue", function(oldVal, newVal) {
        if (newVal) { updateStars(); }
      });
    }
  };
});