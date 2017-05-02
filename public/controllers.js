var MyApp = angular.module("MyApp");

MyApp.controller('AppCtrl', function ($scope, $mdSidenav, AuthService, $location) {

    $scope.$watch(AuthService.isLoggedIn, function(newVal, oldVal){
      if (newVal){
        $scope.icone_connexion = "lock_open"
        $scope.estLoggue = true
      } else {
        $scope.icone_connexion = "lock"
        $scope.estLoggue = false
      }
    })
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
    }

    $scope.login_or_logout = function(){
      $scope.close()
      if (AuthService.isLoggedIn()){
        AuthService.logout()
        $location.path("/")
      } else {
        $location.path("/login")
      }
    }

  })
.controller("LoginCtrl", function($scope, AuthService, $location, profile){
    $scope.login = function () {
        // initial values
      $scope.error = false;
      $scope.disabled = true;

      // call login from service
      AuthService.login($scope.loginForm.username, $scope.loginForm.password)
        // handle success
        .then(function () {
          profile.init($scope.loginForm.username)
          $location.path('/');          
          $scope.loginForm = {}
        })
        // handle error
        .catch(function () {
          $scope.error = true;
          $scope.errorMessage = "L'utilisateur et mot de passe ne correspondent pas.";
          $scope.disabled = false;
          $scope.loginForm = {};
        })}})
.controller('logoutController', ['$scope', '$location', 'AuthService',
    function ($scope, $location, AuthService) {

      $scope.logout = function () {

        // call logout from service
        AuthService.logout()
          .then(function () {
            $location.path('/login');
          });

      };}])
.controller('RegisterCtrl',
  ['$scope', '$location', 'AuthService',
  function ($scope, $location, AuthService) {

    $scope.register = function () {

      // initial values
      $scope.error = false;
      $scope.disabled = true;

      // call register from service
      AuthService.register($scope.registerForm.pseudo, $scope.registerForm.password)
        // handle success
        .then(function () {
          $location.path('/login');
          $scope.disabled = false;
          $scope.registerForm = {};
        })
        // handle error
        .catch(function () {
          $scope.error = true;
          $scope.errorMessage = "Something went wrong!";
          $scope.disabled = false;
          $scope.registerForm = {};
        });

    };}])
.controller('JoueursCtrl', function($scope, joueurs) {
    $scope.page = "JOUEURS";
    $scope.joueurs = "Chargement...";
    joueurs.liste_joueurs().then(function(arr){
      $scope.joueurs = arr;
    }, function(err){
      $scope.joueurs = "Erreur lors du chargement...";
    })})
.controller('EquipesCtrl', function($scope, equipes) {
      $scope.page = "ÉQUIPES";
      $scope.equipes = "Chargement...";
      equipes.liste_equipes().then(function(arr){
        $scope.equipes = arr;
      }, function(err){
        $scope.equipes = "Erreur lors du chargement...";
      })})
.controller('FicheEquipeCtrl', function($scope, $routeParams, equipes){
    $scope.nom_equipe = $routeParams.nom;
    $scope.done = false;
    $scope.erreur = false;

    equipes.findByNom($routeParams.nom, function(e){
      $scope.equipe = e;
      $scope.done = true;
    })})
.controller('FicheJoueurCtrl', function($scope, $routeParams, joueurs, cotes){
    $scope.pseudo = $routeParams.pseudo;
    $scope.done = false;
    $scope.erreur = false;

    joueurs.findByPseudo($routeParams.pseudo, function(j){
      j.cote = cotes.getOddsForPlayer(j.pseudo).cote;
      $scope.joueur = j
      $scope.done = true;
    }) })
.controller('MaFicheCtrl', function($scope, profile){
    $scope.profile = profile
    $scope.changerMDP = false
    $scope.MDP_differents = false
    $scope.changeMDP = function(){
      if ($scope.loginForm.password_1 != $scope.loginForm.password_2){
        $scope.MDP_differents = true
      } else {
        console.log("Changer le mot de passe en BDD")
      }
    }})
.controller('MatchsCtrl', function($scope, matchs, $q){
    $scope.done = false;
    $scope.erreur = false;

    $q.all([matchs.liste_matchs(), 
            matchs.en_cours(),
            matchs.prochain()]).then(
      function(array){
        $scope.done = true;
        $scope.erreur = false;
        $scope.liste_matchs = array[0];
        $scope.match_en_cours = array[1];
        $scope.prochain_match = array[2];
      },
      function(err){
        $scope.erreur = true;
        $scope.done = true;
        console.log("Erreur lors du chargement de la liste des matchs...")})

    })
