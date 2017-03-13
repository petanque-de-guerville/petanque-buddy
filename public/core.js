angular
  .module('MyApp',['ngMaterial', 'ngMessages', 'material.svgAssetsCache', 'ngRoute', 'ngResource'])
  .config(['$routeProvider', '$locationProvider',
  function($routeProvider) {
    $routeProvider
    .when('/joueurs/:pseudo', {
      templateUrl: '/views/fiche_joueur.html',
      controller: 'FicheJoueurCtrl'
      })
      .when('/joueurs', {
        templateUrl: '/views/joueurs.html',
        controller: 'JoueursCtrl'
        })
      .when('/equipes/:nom', {
             templateUrl: '/views/fiche_equipe.html',
             controller: 'FicheEquipeCtrl'
             })
      .when('/equipes', {
          templateUrl: '/views/equipes.html',
          controller: 'EquipesCtrl'
          })
      .when('/', { templateUrl: '/views/main.html'})
      .otherwise({ redirectTo: '/'});
    }])
  .factory('joueurs', function($http, $q, $resource){
    return {
      data: function() {
        var deferred = $q.defer();
        $resource('/api/joueurs/all').get({},
                                      function(r) {deferred.resolve(r);},
                                      deferred.reject);
        return deferred.promise;}}})
 .factory('equipes', function($http, $q, $resource){
    return {
      data: function() {
        var deferred = $q.defer();
        $resource('/api/equipes/all').get({},
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
    })})
  .controller('EquipesCtrl', function($scope, equipes) {
      $scope.page = "ÉQUIPES";
      $scope.equipes = "Chargement...";
      equipes.data().then(function(res){
        $scope.equipes = res.Items;
      }, function(err){
        $scope.equipes = "Erreur dans le chargement...";
      })})
  .controller('FicheEquipeCtrl', function($scope, $routeParams, $resource, $q){
    $scope.nom_equipe = $routeParams.nom;
    $scope.done = false;
    $scope.erreur = false;
    var fetch = function(){
      var deferred = $q.defer();
      $resource('/api/equipes/' + $routeParams.nom).get({},
                                    function(r) {deferred.resolve(r);},
                                    deferred.reject);
      return deferred.promise;};
    fetch().then(function(res){
        $scope.done = true;
        $scope.erreur = false;
        $scope.equipe = res.Items[0];
      }, function(err){
        $scope.done = true;
        $scope.erreur = true;
        });
  })
  .controller('FicheJoueurCtrl', function($scope, $routeParams, $resource, $q){
    $scope.pseudo = $routeParams.pseudo;
    $scope.done = false;
    $scope.erreur = false;
    var fetch = function(){
      var deferred = $q.defer();
      $resource('/api/joueurs/' + $routeParams.pseudo).get({},
                                    function(r) {deferred.resolve(r);},
                                    deferred.reject);
      return deferred.promise;};
    fetch().then(function(res){
        $scope.done = true;
        $scope.erreur = false;
        $scope.joueur = res.Items[0];
      }, function(err){
        $scope.done = true;
        $scope.erreur = true;
        });
  });
