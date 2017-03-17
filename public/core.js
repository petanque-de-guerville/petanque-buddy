var MyApp = angular.module('MyApp',
                          ['ngMaterial', 'ngMessages', 'ngRoute', 'ngResource']); //'material.svgAssetsCache'
MyApp.config(['$routeProvider', '$locationProvider',
  function($routeProvider) {
    $routeProvider
    .when('/joueurs/:pseudo', {
      templateUrl: '/views/fiche_joueur.html',
      controller: 'FicheJoueurCtrl',
      access: {restricted: true}
      })
      .when('/joueurs', {
        templateUrl: '/views/joueurs.html',
        controller: 'JoueursCtrl',
        access: {restricted: true}
        })
      .when('/equipes/:nom', {
             templateUrl: '/views/fiche_equipe.html',
             controller: 'FicheEquipeCtrl',
             access: {restricted: true}
             })
      .when('/equipes', {
          templateUrl: '/views/equipes.html',
          controller: 'EquipesCtrl',
          access: {restricted: true}
          })
      .when('/', {
          templateUrl: '/views/main.html',
          access: {restricted: false}})
      .when('/login',{
        templateUrl: '/views/login.html',
        controller: 'LoginCtrl',
        access: {restricted: false}
        })
      .when('/logout', {
    controller: 'logoutController',
    access: {restricted: false}
  })
  .when('/register', {
    templateUrl: 'views/register.html',
    controller: 'RegisterCtrl',
    access: {restricted: false}
  })
      .otherwise({ redirectTo: '/'});
    }])
  .factory('joueurs', function($http, $resource){
    var deferred = undefined
    return {
      liste: function() {
          if (!deferred) {
                deferred = $resource('/api/joueurs/all')
                          .query()
                          .$promise
          }
          return deferred
          }}
    })
 .factory('equipes', function($http, $resource){
   var deferred = undefined
   return {
     liste: function() {
         if (!deferred) {
               deferred = $resource('/api/equipes/all')
                         .query()
                         .$promise
         }
         return deferred
         }}
   })

MyApp.run(function ($rootScope, $location, $route, AuthService) {
          $rootScope.$on('$routeChangeStart',
            function (event, next, current) {
              AuthService.getUserStatus()
              .then(function(){
                if (next.access.restricted && !AuthService.isLoggedIn()){
                  $location.path('/login');
                  $route.reload();
                }
              });
          });
        });
