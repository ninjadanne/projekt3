var placeApp = angular.module('skate.Place', []);

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
placeApp.controller('getPlace', ['$scope', '$location', 'placeService', function($scope, $location, placeService) {

    /** Create and register the current place observer */
    var placeObserver = function(place) {
        $scope.place = place;
    };
    placeService.registerCurrentPlaceObserver(placeObserver);

    /** Get the current place */
    placeService.getPlace($scope.params.placeId, true).then(function(place) {
        $scope.place = place;
    });

    /** Scope function for deleting a palce */
    $scope.deletePlace = function() {
        sure = window.confirm('Är du säker?');
        if (sure) {
            $location.path('/placelist');
            placeService.deletePlace($scope.place.id).then(function() {});
        }
    };
}])
.directive("starRating", ['placeService', function(userService) {
    function ratePlace(placeId, rating) {
        placeService.ratePlace(placeId, rating);
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
placeApp.controller('addPlace', function($scope, $location, FoundationApi, placeService, userService) {

    var file = null;

    placeService.getCurrentPosition().then(function(userPosition) {
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
        FoundationApi.closeActiveElements('ng-scope');
        placeService.addPlace($scope.newPlace).then(function(place) {});
    }
});

placeApp.controller('editPlace', function($scope, FoundationApi, placeService) {
    $scope.editPlace = function() {
        FoundationApi.closeActiveElements('ng-scope');
        placeService.updatePlace($scope.place);
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

