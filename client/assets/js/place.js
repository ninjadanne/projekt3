var placeApp = angular.module('skate.Place', []);

/** Service */
placeApp.factory('placeService', function($http, $q) {

    var userPosition = getCurrentPosition().then(function(position) {
        return position;
    });
    var places = [];
    var filterTags = [];

    var domain = 'http://manu.fhall.se/p3b/';
    // var domain = 'http://p3b.dev/';

    /**
     * Get places from backend
     * @param  {[type]} coords [description]
     * @return {[type]}        [description]
     */
    function getPlaces(coords) {
        var coords = coords ? coords : userPosition; // If coords is null get current position
        var endPoint = domain + 'place_by_coor.php';
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
        var cached = false;
        var endPoint = domain + 'get_place.php';
        // var endPoint = 'http://p3b.dev/get_place.php';

        var dfr = $q.defer();

        // Loop through all the cached places to find the one with id
        $.each(places, function(i, p) {
            if (p.id == id) {
                dfr.resolve(p);
                cached = true;
            }
        });

        if (! cached) {
            $http.post(endPoint, {'pid': id}).success(function(data) {
                place = convertPlace(data.place[0]);
                dfr.resolve(place);
            });
        }

        return dfr.promise;
    }

    /**
     * Comment a place
     * @param  {[type]} placeId [description]
     * @param  {[type]} comment [description]
     * @return {[type]}         [description]
     */
    function commentPlace(placeId, userId, comment) {
    }

    /**
     * Rate a place
     * @param  {[type]} placeId [description]
     * @param  {[type]} userId  [description]
     * @param  {[type]} rating  [description]
     * @return {[type]}         [description]
     */
    function ratePlace(placeId, userId, rating) {
        var endPoint = domain + 'rate.php';

        var dfr = $q.defer();

        $http.post(endPoint, {'pid': placeId, 'uid': userId, 'rating': rating}).success(function(data) {
            dfr.resolve(data);
        });

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
            tags: splitToTags(place.Activity), // The tags are space separated
            description: place.Description,
            rating: Math.round(place.Rating * 10) / 10, // Round the rating to 1 decimal
            images: []
        };

        if (place.Pic_URI) {
            convertedPlace.images.push({uri: place.Pic_URI});
        }

        // PLACEHOLDER PICS, REMOVE WHEN GOING LIVE!
        convertedPlace.images.push({uri: 'assets/img/spot_placeholder.jpg'});
        convertedPlace.images.push({uri: 'assets/img/spot_placeholder2.jpg'});

        return convertedPlace;
    }

    /**
     * Get the users current position
     * @return {[type]} [description]
     */
    function getCurrentPosition() {
        var dfr = $q.defer();
        // Standard startposition (Stapelbäddsparken, Malmö)
        var userPosition = { latitude: 55.613565, longitude: 12.983973, accuarcy: 0 };

        // Om enheten och klienten stöder geolocation
        if (navigator.geolocation) {
            // Hämta användarens position
            navigator.geolocation.getCurrentPosition(function(location) {
                userPosition = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    accuracy: location.coords.accuracy
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
    function addFilterTags(tagString) {
        tags = splitToTags(tagString);

        var i = tags.length;

        while (i--) {
            tag = tags[i].toLowerCase(); // To lower case
            tag = tag.charAt(0).toUpperCase() + tag.slice(1); // First letter to upper case

            if (!hasFilterTag(tag)) { // If not already in array
                filterTags.push({
                    name: tag,
                    value: tag.toLowerCase()
                });
            }
        }
    }
    function splitToTags(tagString) {
        var tags = [];

        tagString = tagString + ""; // Fix, force a string
        var tempTags = tagString.split(" ");

        var i = tempTags.length;

        while (i--) {
            tempTags2 = tempTags[i] + "";
            tempTags2 = tempTags2.split(",");

            var x = tempTags2.length;
            while (x--) {
                tags.push(tempTags2[x]);
            }
        }

        return tags;

    }
    function hasFilterTag(tag) {
        var i = filterTags.length;
        while (i--) {
            if (filterTags[i].name === tag) {
                return true;
            }
        }
        return false;
    }

    function getPlacesWithTag(tag) {
        var placesWithTag = [];
        var i = places.length;

        while (i--) {
            place = places[i];

            var x = place.tags.length;
            while (x--) {
                var placeTag = (place.tags[x] + '').toLowerCase();
                if (placeTag == tag) {
                    placesWithTag.push(place);
                }
            }
        }

        return placesWithTag;
    }

    return {
        filterTags: filterTags,
        getPlaces: function(coords) {
            return getPlaces(coords);
        },
        getPlace: function(id) {
            return getPlace(id);
        },
        ratePlace: function(userId, placeId, rating) {
            return ratePlace(userId, placeId, rating);
        },
        getPlacesWithTag: function(tag) {
            return getPlacesWithTag(tag);
        },
        getCurrentPosition: function() {
            return userPosition;
        }
    };
});

/** Controllers */

/** Get places controller */
placeApp.controller('getPlaces', ['$scope', '$filter', 'placeService', function($scope, $filter, placeService) {
    var allPlaces = [];

    placeService.getPlaces().then(function(places) {
        allPlaces = places;
        $scope.places = places;
        sortPlaces();
    });

    $scope.filterTags = placeService.filterTags;
    $scope.orderPlaces = {
        property: 'rating',
        invert: 'true'
    };
    $scope.filterTag = {tag: null};

    $scope.searchTag = {tag: null};

    // Watch the sortOrder order (radio buttons)
    $scope.$watch('orderPlaces.invert', function() {
       sortPlaces();
    });

    // Watch the sortOrder property (dropdown)
    $scope.$watch('orderPlaces.property', function() {
       sortPlaces();
    });

    // Watch the filterTag property (dropdown)
    $scope.$watch('filterTag.tag', function() {
        filterPlaces();
    });

    // Watch the searchTag property (dropdown)
    $scope.$watch('searchTag.tag', function() {
        searchPlaces();
    });

    var sortPlaces = function() {
        var orderBy = $filter('orderBy');
        $scope.places = orderBy($scope.places, $scope.orderPlaces.property, ($scope.orderPlaces.invert === "true"));
    };

    var filterPlaces = function() {
        if ($scope.filterTag.tag !== null) {
            if ('value' in $scope.filterTag.tag) {
                $scope.places = placeService.getPlacesWithTag($scope.filterTag.tag.value);
            }
        } else {
            $scope.places = allPlaces;
        }
    };

    var searchPlaces = function() {
         if ($scope.searchTag.tag !== '') {
            var i = allPlaces.length;
            var places = [];
            while (i--) {
              var title = allPlaces[i].title + '';
              if (title.includes($scope.searchTag.tag)){
                places.push(allPlaces[i]);
              }
            }

                $scope.places = places;
         } else {
            $scope.places = allPlaces;
        }
    };

}]);

/** Get place controller */
placeApp.controller('getPlace', ['$scope', 'placeService', function($scope, placeService) {
    placeService.getPlace($scope.params.placeId).then(function(place) {
        $scope.place = place;
    });
}]);

/** Rating controller */
placeApp.controller("RatingCtrl", ['$scope', function($scope) {
    $scope.isReadonly = false;
}])
.directive("starRating", ['placeService', 'userService', function(placeService, userService) {
    function ratePlace(placeId, rating) {
        user = userService.getUser();
        placeService.ratePlace(placeId, user.id, rating);
    }
    // console.log(scope);
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
      }
      scope.toggle = function(index) {
        if (scope.readonly == undefined || scope.readonly == false){
          scope.ratingValue = index + 1;
          scope.onRatingSelected({
            rating: index + 1
          });
        }
        var placeId = scope.$parent.place.id;
        ratePlace(placeId, scope.ratingValue);
      };
      scope.$watch("ratingValue", function(oldVal, newVal) {
        if (newVal) { updateStars(); }
      });
    }
  };
}]);

/** Slick slider */
placeApp.directive('slickSlider', function($timeout){
  return{
    restrict:'A',
    link: function(scope,element,attrs){
      $timeout(function(){
        $(element).slick(scope.$eval(attrs.slickSlider));
      });
    }
  };
});