(function() {
    'use strict';

    var app = angular
    .module('application', [
        'ui.router',
        'ngAnimate',

        //foundation
        'foundation',
        'foundation.dynamicRouting',
        'foundation.dynamicRouting.animations',

        // Other modules
        'ngFileUpload',

        // GrindFind
        'mainApp',
        'skate.Map',
        'skate.Place',
        'skate.User'
      ])
    .config(config)
    .run(run);

    config.$inject = ['$urlRouterProvider', '$locationProvider'];

    function config($urlProvider, $locationProvider) {
    $urlProvider.otherwise('/');

    $locationProvider.html5Mode({
        enabled: false,
        requireBase: false
    });

    $locationProvider.hashPrefix('!');
    }

    function run() {
        FastClick.attach(document.body);
    }
})();

var mainApp = angular.module('mainApp', []);
mainApp.controller('mainController', function($scope, $location) {
    $scope.isActive = function (viewLocation) {
        return viewLocation === $location.path();
    };
});