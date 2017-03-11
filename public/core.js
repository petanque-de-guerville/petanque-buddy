angular
  .module('MyApp',['ngMaterial', 'ngMessages', 'material.svgAssetsCache', 'ngRoute', 'ngResource'])
  .config(['$routeProvider', '$locationProvider',
  function($routeProvider) {
    $routeProvider
      .when('/joueurs', {
        templateUrl: '/views/joueurs.html',
        controller: 'JoueursCtrl'
        })
      .when('/', { templateUrl: '/views/main.html'})
      .otherwise({ redirectTo: '/'});
    }])
  .factory('joueurs', function($http, $q, $resource){
    return {
      data: function() {
        var deferred = $q.defer();
        $resource('/api/joueurs').get({},
                                      function(r) {deferred.resolve(r);},
                                      deferred.reject);
        return deferred.promise;}}})
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
  .controller('JoueursCtrl', function($scope, joueurs) {
    $scope.page = "JOUEURS";
    $scope.joueurs = "Chargement...";
    joueurs.data().then(function(res){
      $scope.joueurs = res.Items;
    }, function(err){
      $scope.joueurs = "Erreur dans le chargement...";
    });
    //console.log($scope.joueurs)
});
