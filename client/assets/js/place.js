var placeApp = angular.module('skate.Place', []);

/** Controllers */

/** Get places controller */
placeApp.controller('getPlaces', ['$scope', '$filter', 'placeService', 'geoService', function($scope, $filter, placeService, geoService) {

    /** Scope models */
    $scope.filterTags = placeService.filterTags;
    $scope.filterTags.unshift({name: 'Alla platser', value: null});
    $scope.orderPlaces = {
        property: 'rating',
        invert: 'true'
    };
    $scope.filterTag = {tag: {}};
    $scope.searchTag = {tag: null};

    /** Create and register the place list observer callback */
    var updatePlaceList = function(places) {
        var orderBy = $filter('orderBy');
        $scope.places = orderBy(places, $scope.orderPlaces.property, ($scope.orderPlaces.invert === "true"));
    };
    placeService.registerPlaceListObserver('getPlaces', updatePlaceList);

    /** Get the users position and find places around it */
    geoService.getUserPosition().then(function(position) {
        placeService.getPlaces(position);
    });

    /** Watch the sortOrder order (radio buttons) */
    $scope.$watch('orderPlaces.invert', function() {
        var orderBy = $filter('orderBy');
        $scope.places = orderBy($scope.places, $scope.orderPlaces.property, ($scope.orderPlaces.invert === "true"));
    });

    /** Watch the sortOrder property (dropdown) */
    $scope.$watch('orderPlaces.property', function() {
        var orderBy = $filter('orderBy');
        $scope.places = orderBy($scope.places, $scope.orderPlaces.property, ($scope.orderPlaces.invert === "true"));
    });

    /** Watch the filterTag property (dropdown) */
    $scope.$watch('filterTag.tag', function() {
        placeService.filterPlacesByTag($scope.filterTag.tag.value);
    });

    /** Watch the searchTag property (dropdown) */
    $scope.$watch('searchTag.tag', function() {
        placeService.searchPlaces($scope.searchTag.tag);
    });

}]);

/** Get place controller */
placeApp.controller('getPlace', ['$scope', '$location', 'placeService', 'geoService', function($scope, $location, placeService, geoService) {

    /** Get the current place */
    placeService.getPlace($scope.params.placeId, true).then(function(place) {
        placeObserver(place);
    });

    /** Create and register the current place observer */
    var placeObserver = function(place) {
        if ($scope.place) {
            if (place.id !== $scope.place.id) {
                $scope.place = place;
                getPlaceAddress();
            }
        } else {
            $scope.place = place;
            getPlaceAddress();
        }
    };
    placeService.registerCurrentPlaceObserver('getPlace', placeObserver);

    function getPlaceAddress() {
        if (!$scope.address && geoService.geoCode) {
            geoService.geoCode($scope.place.latitude, $scope.place.longitude).then(
                function(address) {
                    if (address[0]) {
                        if (address[0].formatted_address) {
                            $scope.place.address = address[0].formatted_address;
                        }
                    }
                }
            );
        }
    }

    /** Scope function for deleting a palce */
    $scope.deletePlace = function() {
        sure = window.confirm('Är du säker?');
        if (sure) {
            $location.path('/placelist');
            placeService.deletePlace($scope.place.id).then(function() {});
        }
    };
}]);

/** Add commment controller */
placeApp.controller('addComment', function($scope, $rootScope, placeService, FoundationApi) {
    var file = null;

    $scope.addComment = function() {
        pid = $rootScope.$stateParams.placeId;
        comment = $scope.newComment.comment;

        if (file) {
            FoundationApi.closeActiveElements('ng-scope');
            placeService.uploadImage(file).then(function(image) {
                placeService.addComment(pid, comment, image.uri).then(function(comment) {
                });
            });
        } else {
            FoundationApi.closeActiveElements('ng-scope');
            placeService.addComment(pid, comment).then(function(comment) {
            });
        }
    };

    $scope.uploadFile = function(files) {
        file = files[0];
        $scope.newComment.uploadFile = files[0];
    };
});

/** Add place controller */
placeApp.controller('addPlace', function($scope, $location, FoundationApi, placeService, userService, geoService) {

    var file = null;

    geoService.getUserPosition().then(function(userPosition) {
        $scope.newPlace.latitude = userPosition.latitude;
        $scope.newPlace.longitude = userPosition.longitude;
    });

    $scope.addPlace = function() {
        if (file) {
            placeService.uploadImage(file).then(function(image) {
                $scope.newPlace.pic = image.uri;
                addPlace();
            });
        } else {
            $scope.newPlace.pic = null;
            addPlace();
        }
    };

    $scope.uploadFile = function(files) {
        file = files[0];
    };

    function addPlace() {
        var valid = placeService.validateInput($scope.newPlace);

        if (Object.keys(valid).length === 0) {
            FoundationApi.closeActiveElements('ng-scope');
            placeService.addPlace($scope.newPlace).then(function(place) {
                $scope.newPlace = null;
            });
        } else {
            var errors = "Följande behöver du justera.";
            for (var error in valid) {
                errors = errors + " " + valid[error];
            }
            FoundationApi.publish('error-notifications', {title: 'Oj!', content: errors});
        }
    }
});

placeApp.controller('editPlace', function($scope, FoundationApi, placeService) {

    /** Get the current place */
    $scope.place = placeService.currentPlace;

    /** Create and register the current place observer */
    var placeObserver = function(place) {
        $scope.place = place;
    };
    placeService.registerCurrentPlaceObserver('editPlace', placeObserver);

    $scope.editPlace = function() {
        var valid = placeService.validateInput($scope.place);

        if (Object.keys(valid).length === 0) {
            FoundationApi.closeActiveElements('ng-scope');
            placeService.updatePlace($scope.place);
        } else {
            var errors = "Följande behöver du justera. ";
            for (var error in valid) {
                errors = errors + " " + valid[error];
            }
            FoundationApi.publish('error-notifications', {title: 'Oj!', content: errors});
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
