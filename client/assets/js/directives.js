var directives = angular.module('skate.Directives', []);

directives.directive("starRating", ['placeService', function(placeService) {
    function ratePlace(placeId, rating) {
        placeService.ratePlace(placeId, rating);
    }
    return {
        restrict: "EA",
        templateUrl: "templates/directives/starRating.html",
        scope : {
            ratingValue : "=ngModel",
            max : "=?",
            onRatingSelected : "&?",
            readonly: "=?"
        },
        link : function(scope, elem, attrs) {
            if (scope.max === undefined) { scope.max = 5; }
            function updateStars() {
                scope.stars = [];

                for (var i = 0; i < scope.max; i++) {
                    scope.stars.push({
                        filled : i < scope.ratingValue
                    });
                }
            }
            scope.toggle = function(index) {
                if (scope.readonly === undefined || scope.readonly === false){
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