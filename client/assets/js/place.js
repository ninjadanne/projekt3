var placeApp = angular.module('skate.Place', []);

/** Service */
placeApp.factory('placeService', function($http, $q, Upload, FoundationApi) {

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

        var endPoint = domain + 'place_by_coor.php';

        if (!coords) {
            return "This function requires coordinates";
        }

       var dfr = $q.defer();

       if (places.length > 0) {
           dfr.resolve(places);
       } else {
            $http.post(endPoint, {'lat': coords.latitude, 'lng': coords.longitude})
            .success(function(data) {

                if (data.success) {
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
                } else {
                    FoundationApi.publish('error-notifications', {title: 'Oj!', content: 'Platstjänsten hittade inga platser.'});
                }
            }).error(function() {
                FoundationApi.publish('error-notifications', { title: 'Oj!', content: 'Kunde inte ladda in platser från platstjänst.'});
            });
       }

        return dfr.promise; // Return a promise
    }

    function getPlace(id) {
        var cached = false;
        var endPoint = domain + 'get_place.php';

        var dfr = $q.defer();

        // Loop through all the cached places to find the one with id
        /* $.each(places, function(i, p) {
            if (p.id == id) {
                dfr.resolve(p);
                cached = true;
            }
        }); */

        /* if (! cached) { */
            $http.post(endPoint, {'pid': id})
            .success(function(data) {
                place = convertPlace(data.place[0]);
                place.comments = data.comments;
                console.log(place);
                dfr.resolve(place);
            })
            .error(function() {
                FoundationApi.publish('error-notifications', { title: 'Oj!', content: 'Kunde inte ladda in plats från platstjänst.' });
            });
        /* } */

        return dfr.promise;
    }

    /**
     * Delete a place
     * @param  {[type]} id [description]
     * @return {[type]}    [description]
     */
    function deletePlace(id)
    {
        var endPoint = domain + 'delete_place.php';
        var dfr = $q.defer();

        $http.post(endPoint, {'pid': id, 'delete': true})
        .success(function(data) {
            dfr.resolve(data);
        })
        .error(function() {
            FoundationApi.publish('error-notifications', { title: 'Oj!', content: 'Kunde inte ta bort plats från platstjänst.' });
        });

        return dfr.promise;
    }

    /**
     * Comment a place
     * @param  {[type]} placeId [description]
     * @param  {[type]} comment [description]
     * @return {[type]}         [description]
     */
    function addComment(placeId, userId, comment) {
        var endPoint = domain + 'comment.php';

        var endpoint_data = {
            'pid': placeId,
            'uid': userId,
            'comment': comment,
        };

        var dfr = $q.defer();

        $http.post(endPoint, endpoint_data).success(function(data) {
            dfr.resolve(data);
        });

        return dfr.promise;
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

    function addPlace(place) {
        var endPoint = domain + 'insert_place.php';

        var endpoint_data = {
            'uid': place.uid,
            'name': place.title,
            'latitude': place.latitude,
            'longitude': place.longitude,
            'description': place.description,
            'pic': place.pic,
            'cat': place.cat,
        };

        var dfr = $q.defer();

        $http.post(endPoint, endpoint_data)
        .success(function(data) {
            if (!data.success) {
                FoundationApi.publish('error-notifications', {title: 'Oj!', content: 'Platstjänsten vill inte lägga till platsen. Meddelande: ' + data.message});
            } else {
                var id = data.message.split(" = ")[1];
                place.id = id;
                place = convertPlace(place);
                dfr.resolve(place);
            }
            dfr.resolve(data);
        }).error(function(err, data) {
            FoundationApi.publish('error-notifications', {title: 'Oj!', content: 'Platstjänsten vill inte lägga till platsen.'});
        });

        return dfr.promise;

    }

    function uploadImage(image) {
        var endPoint = domain + 'upload.php';

        var dfr = $q.defer();

        Upload.upload({
            url: endPoint,
            data: {fname: image.name},
            file: image,
        })
        .success(function(data, status, headers, config) {
            // file is uploaded successfully
            if (data[0] == 'File size cannot exceed 2 MB') {
                FoundationApi.publish('error-notifications', {title: 'Oj!', content: 'Platstjänsten säger att bilden är över 2MB, vilket den inte får vara'});
            } else {
                console.log(data);
                dfr.resolve(data);
            }
        }).error(function(data) {
            FoundationApi.publish('error-notifications', {title: 'Oj!', content: 'Fick ett felmeddelande vid uppladning av bild: ' + data[0]});
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
            id: place.id,
            title: place.Name,
            latitude: place.Latitude,
            longitude: place.Longitude,
            tags: splitToTags(place.Activity), // The tags are space separated
            description: place.Description,
            rating: (Math.round(place.Rating * 10) / 10).toFixed(1), // Round the rating to 1 decimal
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
        var userPosition = { };

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
        } else {
            userPosition = {
                latitude: -1,
                longitude: -1,
                accuracy: -1
            };
            dfr.resolve(userPosition);
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
        },
        addPlace: function(name, description, pic, uid, longitude, latitude, cat) {
            return addPlace(name, description, pic, uid, longitude, latitude, cat);
        },
        deletePlace: function(id) {
            return deletePlace(id);
        },
        uploadImage: function(image) {
            return uploadImage(image);
        },
        addComment: function(placeId, userId, comment, pic) {
            return addComment(placeId, userId, comment, pic);
        }
    };
});

/** Controllers */

/** Get places controller */
placeApp.controller('getPlaces', ['$scope', '$filter', 'placeService', function($scope, $filter, placeService) {
    var allPlaces = [];

    placeService.getCurrentPosition().then(function(position) {
        $scope.userPosition = position;

        placeService.getPlaces(position).then(function(places) {
            allPlaces = places;
            $scope.places = places;
            sortPlaces();
        });
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
            var searchTag = angular.lowercase($scope.searchTag.tag);
            var i = allPlaces.length;
            var places = [];
            while (i--) {
              var title = angular.lowercase(allPlaces[i].title) + '';
              if (title.includes(searchTag)){
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
        $scope.$emit('centerMapToPlace', place);
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
  return {
    restrict : "EA",
    template : "<ul class='userrating' ng-class='{readonly: readonly}'>" +
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

/** Add commment controller */
placeApp.controller('addComment', function($scope, $rootScope, placeService, userService ) {

    $scope.addComment = function() {

        pid = $rootScope.$stateParams.placeId;
        uid = userService.getUser().id;
        comment = $scope.newComment.comment;

        placeService.addComment(pid, uid, comment);

    }


});

/** Add place controller */
placeApp.controller('addPlace', function($scope, $location, FoundationApi, placeService, userService) {

    var file = null;

    $scope.newPlace = {
        id: null,
        title: null,
        description: null,
        pic: null,
        longitude: null,
        latitude: null,
        cat: null
    };

    placeService.getCurrentPosition().then(function(up) {
        $scope.newPlace.latitude = up.latitude;
        $scope.newPlace.longitude = up.longitude;
    });

    $scope.addPlace = function() {
        $scope.newPlace.uid = userService.getUser().id;
        if (file) {
            image = placeService.uploadImage(file).then(function(image) {
                $scope.newPlace.pic = image.uri;
                placeService.addPlace($scope.newPlace).then(function(place) {
                    // Place should be added to the scope directly without the need to refresh the page
                });
            });
        } else {
            placeService.addPlace($scope.newPlace).then(function(place) {
                // Place should be added to the scope directly without the need to refresh the page
                console.log('sparad');
                FoundationApi.closeActiveElements('ng-scope');
                location.reload();
            });
        }
    };

    $scope.uploadFile = function(files) {
        file = files[0];
    };
});

placeApp.controller('editPlace', function($scope, placeService) {
    $scope.edit = function() {
        placeService.addPlace($scope.place);
    };
});

placeApp.controller('deletePlace', function($scope, $rootScope, $location, placeService) {
    console.log($scope.places);
    $scope.delete = function() {
        sure = window.confirm('Är du säker?');
        if (sure) {
            var placeId = $rootScope.$stateParams.placeId;
            placeService.deletePlace(placeId).then(function() {
                // location.reload();
                // window.location = "#!/placelist";

                $location.path('/placelist');
            });
        }
    };
});

/** Slick slider */
placeApp.directive('slickSlider', function($interval){
  return{
    restrict:'A',
    link: function(scope,element,attrs){
      $interval(function(){
        $(element).slick(scope.$eval(attrs.slickSlider));
      },2000);
    }
  };
});

