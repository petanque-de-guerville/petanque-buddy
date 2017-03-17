var MyApp = angular.module("MyApp");

MyApp.controller('AppCtrl', function ($scope, $mdSidenav, AuthService) {
    if (AuthService.isLoggedIn()){
      $scope.icone_connexion = "lock"
    } else{
      $scope.icone_connexion = "lock_open"
    }
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

  })
  .controller("LoginCtrl", function($scope, AuthService, $location){
    $scope.login = function () {
      if (AuthService.isLoggedIn()) {AuthService.logout();}
      // initial values
      $scope.error = false;
      $scope.disabled = true;

      // call login from service
      AuthService.login($scope.loginForm.username, $scope.loginForm.password)
        // handle success
        .then(function () {
          $location.path('/');
          $scope.loginForm = {};
        })
        // handle error
        .catch(function () {
          $scope.error = true;
          $scope.errorMessage = "L'utilisateur et mot de passe ne correspondent pas.";
          $scope.disabled = false;
          $scope.loginForm = {};
        });

    }})
  .controller('logoutController', ['$scope', '$location', 'AuthService',
    function ($scope, $location, AuthService) {

      $scope.logout = function () {

        // call logout from service
        AuthService.logout()
          .then(function () {
            $location.path('/login');
          });

      };

  }])
  .controller('RegisterCtrl',
  ['$scope', '$location', 'AuthService',
  function ($scope, $location, AuthService) {

    $scope.register = function () {

      // initial values
      $scope.error = false;
      $scope.disabled = true;

      // call register from service
      AuthService.register($scope.registerForm.username, $scope.registerForm.password)
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

    };

}])
  .controller('JoueursCtrl', function($scope, joueurs) {
    $scope.page = "JOUEURS";
    $scope.joueurs = "Chargement...";
    joueurs.liste_joueurs().then(function(arr){
      $scope.joueurs = arr;
    }, function(err){
      $scope.joueurs = "Erreur lors du chargement...";
    })
  })
  .controller('EquipesCtrl', function($scope, equipes) {
      $scope.page = "ÉQUIPES";
      $scope.equipes = "Chargement...";
      equipes.liste_equipes().then(function(arr){
        $scope.equipes = arr;
      }, function(err){
        $scope.equipes = "Erreur lors du chargement...";
      })
})
  .controller('FicheEquipeCtrl', function($scope, $routeParams, equipes){
    $scope.nom_equipe = $routeParams.nom;
    $scope.done = false;
    $scope.erreur = false;

    equipes.findByNom($routeParams.nom, function(e){
      $scope.equipe = e;
      $scope.done = true;
    })
  })
  .controller('FicheJoueurCtrl', function($scope, $routeParams, joueurs){
    $scope.pseudo = $routeParams.pseudo;
    $scope.done = false;
    $scope.erreur = false;

    joueurs.findByPseudo($routeParams.pseudo, function(j){
      $scope.joueur = j
      $scope.done = true;
    })
  });
