var placeApp = angular.module('skate.Place', []);

/** Service */
placeApp.factory('placeService', function($http, $q, Upload, FoundationApi, userService) {

    var user = userService.getUser();
    var userPosition = getCurrentPosition().then(function(position) {
        return position;
    });
    var allPlaces = [];
    var places = [];
    var currentPlace = null;
    var filterTags = [];

    var domain = 'http://manu.fhall.se/p3b/';
    // var domain = 'http://p3b.dev/';

    /** List of observers */
    var placeListObservers = [];
    var currentPlaceObservers = [];

    /** Register an observer for place list */
    var registerPlaceListObserver = function(observer) {
        placeListObservers.push(observer);
    };

    /** Notify place list observers */
    var notifyPlaceListObservers = function() {
        angular.forEach(placeListObservers, function(observer) {
            observer(places);
        });
    };

    /** Register an observer for current place */
    var registerCurrentPlaceObserver = function(observer) {
        currentPlaceObservers.push(observer);
    };

    /** Notify current place observers */
    var notifyCurrentPlaceObservers = function() {
        angular.forEach(currentPlaceObservers, function(observer) {
            observer(currentPlace);
        });
    };

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
            $http.post(endPoint, {'lat': coords.latitude, 'lng': coords.longitude, 'uid': user.id})
            .success(function(data) {

                if (data.success) {
                    data = data.data;

                    for (var i = 0; i < data.length; i++) { // Loopa igenom alla hämtade platser
                        place = convertPlace(data[i]);
                        // place.id = place.longitude + ',' + place.latitude;
                        place.id = data[i].id;
                        place.keyId = place.id;
                        place.comments = data[i].Comments;
                        place.checkinsTotal = data[i].Checkins;
                        place.images = [];

                        angular.forEach(place.comments, function(comment) {
                            if (comment.image_uri) {
                                place.images.push({ 'uri': comment.image_uri });
                            }
                        });

                        if (place.images.length === 0) {
                            place.images.push({'uri': 'assets/img/spot_placeholder.jpg'});
                        }

                        places.push(place);
                        addFilterTags(place.tags);
                    }

                    allPlaces = places;
                    dfr.resolve(places); // Return places
                    notifyPlaceListObservers();
                } else {
                    FoundationApi.publish('error-notifications', {title: 'Oj!', content: 'Platstjänsten hittade inga platser vid den här positionen.'});
                }
            }).error(function() {
                FoundationApi.publish('error-notifications', { title: 'Oj!', content: 'Kunde inte ladda in platser från platstjänst.'});
            });
       }

        return dfr.promise; // Return a promise
    }

    function getPlace(id, current) {
        var cached = false;
        var endPoint = domain + 'get_place.php';
        var place = null;

        var dfr = $q.defer();

        // Loop through all the cached places to find the one with id
         angular.forEach(places, function(place) {
            if (place.id == id) {
                dfr.resolve(place);
                cached = true;

                if (current) {
                    currentPlace = place;
                    notifyCurrentPlaceObservers();
                }
            }
        });

        if (! cached) {
            $http.post(endPoint, {'pid': id, 'uid': user.id})
            .success(function(data) {
                place = convertPlace(data.place[0]);
                place.comments = data.comments;
                place.images = [];

                angular.forEach(data.comments, function(comment) {
                    if (comment.image_uri) {
                        place.images.push({'uri': comment.image_uri});
                    }
                });

                if (place.images.length === 0) {
                    place.images.push({'uri': 'assets/img/spot_placeholder.jpg'});
                }

                dfr.resolve(place);

                if (current) {
                    currentPlace = place;
                    notifyCurrentPlaceObservers();
                }
            })
            .error(function() {
                FoundationApi.publish('error-notifications', { title: 'Oj!', content: 'Kunde inte ladda in plats från platstjänst.' });
            });
        }

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

            var index = 0;
            angular.forEach(places, function(place) {
                if (place.id == id) {
                    places.splice(index, 1); // Remove the place from the place list
                }
                index++;
            });
            dfr.resolve(data);
            notifyPlaceListObservers();
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
    function addComment(placeId, userId, comment, pic) {
        var endPoint = domain + 'comment.php';

        var endpoint_data = {
            'pid': placeId,
            'uid': userId,
            'comment': comment,
            'pic': pic
        };

        var dfr = $q.defer();

        $http.post(endPoint, endpoint_data).success(function(data) {
            dfr.resolve(data);
            angular.forEach(places, function(place) {
                if (place.id == placeId) {
                    place.comments.push(data.data);
                    currentPlace = place;
                    notifyPlaceListObservers();
                    notifyCurrentPlaceObservers();
                }
            });
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

        $http.post(endPoint, {'pid': placeId, 'uid': userId, 'rating': rating})
        .success(function(data) {
            dfr.resolve(data);
            angular.forEach(places, function(p) {
                if (p.id == placeId) {
                    p.user_rating = rating;
                    p.rating = data.avg_rating;
                    notifyPlaceListObservers();
                    currentPlace = p;
                    notifyCurrentPlaceObservers();
                }
            });
        })
        .error(function(data) {
        });

        return dfr.promise;
    }

    function addPlace(place) {
        var endPoint = domain + 'insert_place.php';

        var endpoint_data = {
            'uid': user.id,
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
            console.log(data);
            if (!data.success) {
                FoundationApi.publish('error-notifications', {title: 'Oj!', content: 'Platstjänsten vill inte lägga till platsen. Meddelande: ' + data.message});
            } else {
                var id = data.message.split(" = ")[1];
                place.id = id;
                place.rating = '0.0';

                if (!place.images) {
                    place.images = [];
                    place.images.push({'uri': 'assets/img/spot_placeholder.jpg'});
                } else if(place.images.length === 0) {
                    place.images.push({'uri': 'assets/img/spot_placeholder.jpg'});
                }

                // place = convertPlace(place);
                places.push(place);

                dfr.resolve(place);
                notifyPlaceListObservers();
            }
            dfr.resolve(data);
        }).error(function(err, data) {
            FoundationApi.publish('error-notifications', {title: 'Oj!', content: 'Platstjänsten vill inte lägga till platsen.'});
        });

        return dfr.promise;

    }

    /**
     * Upload an image to backendf
     * @param  {[type]} image [description]
     * @return {[type]}       [description]
     */
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
            user_rating: place.user_rating ? place.user_rating : '0.0',
            images: []
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
        var userPosition = {
            latitude: 55.613565,
            longitude: 12.983973,
            accuracy: -1
        };

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
            },
            function() {
                dfr.resolve(userPosition);
            });
        } else {
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

            if (!filterTagExists(tag)) { // If not already in array
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
    function filterTagExists(tag) {
        var i = filterTags.length;
        while (i--) {
            if (filterTags[i].name === tag) {
                return true;
            }
        }
        return false;
    }

    function filterPlacesByTag(tag) {
        if (!tag) {
            places = allPlaces;
        } else {
            tag = tag.toLowerCase();
            places = [];

            angular.forEach(allPlaces, function(place) {
                angular.forEach(place.tags, function(ptag) {
                    if (ptag.toLowerCase() == tag) {
                        places.push(place);
                    }
                });
            });
        }

        notifyPlaceListObservers();
    }

    function searchPlaces(searchString) {
        if (searchString) {
            searchString = searchString.toLowerCase();
            places = [];
            angular.forEach(allPlaces, function(place) {
                title = place.title.toLowerCase();
                if (title.startsWith(searchString)) {
                    places.push(place);
                }
            });
        } else {
            places = allPlaces;
        }
        notifyPlaceListObservers();
    }

    return {
        filterTags: filterTags,
        currentPlace: currentPlace,
        getPlaces: function(coords) {
            return getPlaces(coords);
        },
        getPlace: function(id, currentPlace) {
            return getPlace(id, currentPlace);
        },
        ratePlace: function(userId, placeId, rating) {
            return ratePlace(userId, placeId, rating);
        },
        filterPlacesByTag: function(tag) {
            return filterPlacesByTag(tag);
        },
        searchPlaces: function(searchString) {
            return searchPlaces(searchString);
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
        },
        registerPlaceListObserver: function(observer) {
            registerPlaceListObserver(observer);
        },
        registerCurrentPlaceObserver: function(observer) {
            registerCurrentPlaceObserver(observer);
        }
    };
});

/** Controllers */

/** Get places controller */
placeApp.controller('getPlaces', ['$scope', '$filter', 'placeService', function($scope, $filter, placeService) {

    var updatePlaceList = function(places) {
        $scope.places = places;
    };

    placeService.registerPlaceListObserver(updatePlaceList);

    placeService.getCurrentPosition().then(function(position) {
        placeService.getPlaces(position);
    });

    $scope.filterTags = placeService.filterTags;
    $scope.filterTags.unshift({name: 'Alla platser', value: null});
    $scope.orderPlaces = {
        property: 'rating',
        invert: 'true'
    };
    $scope.filterTag = {tag: {}};

    $scope.searchTag = {tag: null};

    // Watch the sortOrder order (radio buttons)
    $scope.$watch('orderPlaces.invert', function() {
        var orderBy = $filter('orderBy');
        $scope.places = orderBy($scope.places, $scope.orderPlaces.property, ($scope.orderPlaces.invert === "true"));
    });

    // Watch the sortOrder property (dropdown)
    $scope.$watch('orderPlaces.property', function() {
        var orderBy = $filter('orderBy');
        $scope.places = orderBy($scope.places, $scope.orderPlaces.property, ($scope.orderPlaces.invert === "true"));
    });

    // Watch the filterTag property (dropdown)
    $scope.$watch('filterTag.tag', function() {
        placeService.filterPlacesByTag($scope.filterTag.tag.value);
    });

    // Watch the searchTag property (dropdown)
    $scope.$watch('searchTag.tag', function() {
        placeService.searchPlaces($scope.searchTag.tag);
    });

}]);

/** Get place controller */
placeApp.controller('getPlace', ['$scope', 'placeService', function($scope, placeService) {
    var placeObserver = function(place) {
        $scope.place = place;
    };

    placeService.registerCurrentPlaceObserver(placeObserver);

    placeService.getPlace($scope.params.placeId, true).then(function(place) {
        $scope.place = place;
    });
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
placeApp.controller('addComment', function($scope, $rootScope, placeService, userService, FoundationApi) {
    var file = null;

    $scope.addComment = function() {
        pid = $rootScope.$stateParams.placeId;
        uid = userService.getUser().id;
        comment = $scope.newComment.comment;

        if (file) {
            image = placeService.uploadImage(file).then(function(image) {
                placeService.addComment(pid, uid, comment, image.uri).then(function(place) {
                FoundationApi.closeActiveElements('ng-scope');
                    // Comment should be added to the scope directly without the need to refresh the page
                });
            });
        } else {
            placeService.addComment(pid, uid, comment).then(function(place) {
                FoundationApi.closeActiveElements('ng-scope');
                // $location.path('/placelist');
            });
        }
    };

    $scope.uploadFile = function(files) {
        file = files[0];
    };
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
        $scope.newplace = file;
        placeService.addPlace($scope.newPlace).then(function(place) {
            FoundationApi.closeActiveElements('ng-scope');
        });
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
    $scope.delete = function() {
        sure = window.confirm('Är du säker?');
        if (sure) {
            var placeId = $rootScope.$stateParams.placeId;
            placeService.deletePlace(placeId).then(function() {
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

