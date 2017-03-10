angular
  .module('MyApp',['ngMaterial', 'ngMessages', 'material.svgAssetsCache', 'ngRoute'])
  .config(['$routeProvider', '$locationProvider',
  function($routeProvider) {
    $routeProvider
      .when('/:page', {
        templateUrl: function(params){return '/views/' + params.page + '.html'},
        controller: 'JoueursCtrl'
        })
      .when('/', { templateUrl: '/views/main.html'})
      .otherwise({ redirectTo: '/'});
    }])
  .controller('AppCtrl', function ($scope, $mdSidenav) {
    $scope.toShow = "home";

    $scope.toggleMenu = function() {
        $mdSidenav("left")
          .toggle();
    };

    $scope.close = function () {
      $mdSidenav('left').close();
    };

    $scope.show = function (toShow) {
      $scope.toShow = toShow;
    }})
  .controller('JoueursCtrl', ['$scope', function($scope) {
    $scope.page = "JOUEURS";
}]);
