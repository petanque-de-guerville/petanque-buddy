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
 .factory('equipes', function($resource, $q){
   var deja_requete = false
   var dict = undefined
   var liste = undefined
   return {
     liste_equipes: function() {
         if (deja_requete) {
           return $q.when(liste)
         } else {
           return $resource("/api/equipes/all")
            .query()
            .$promise
            .then(function(res){
              deja_requete = true
              liste = res
              dict = new Map(res.map((i) => [i.nom_equipe, i]));
              return(liste)
            })
         }
       },
     findByNom: function(nom, cb){
       if (deja_requete){
         return $q.when(dict).then(function(d){
           cb(d.get(nom))
         })
       } else {
         return this.liste_equipes().then(function(l){
           cb(dict.get(nom))
         })
       }}
   }})
.factory('joueurs', function($resource, $q){
 var deja_requete = false
 var dict = undefined
 var liste = undefined
 return {
   liste_joueurs: function() {
       if (deja_requete) {
         return $q.when(liste)
       } else {
         return $resource("/api/joueurs/all")
          .query()
          .$promise
          .then(function(res){
            deja_requete = true
            liste = res
            dict = new Map(res.map((i) => [i.pseudo, i]));
            return(liste)
          })
       }
     },
   findByPseudo: function(pseudo, cb){
     if (deja_requete){
       return $q.when(dict).then(function(d){
         cb(d.get(pseudo))
       })
     } else {
       return this.liste_joueurs().then(function(l){
         cb(dict.get(pseudo))
       })
     }}
 }});


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
