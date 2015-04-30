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

        // GrindFind
        'skate.Map',
        'skate.Place'
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
