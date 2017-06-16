var MyApp = angular.module("MyApp");

MyApp.controller('mainCtrl', function($scope, profile, matchs){ 
    $scope.nom_joueur = profile.pseudo()
    if ($scope.nom_joueur != undefined) {
      matchs.prochain_match_de(profile.equipe()).then(function(match){
      $scope.prochain_match = { "horaire": match.horaire_prevu}})
    } })
.controller('AppCtrl', function ($scope, $mdSidenav, AuthService, $location) {

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
    } })
.controller("LoginCtrl", function($scope, AuthService, $location, profile){
    $scope.login = function () {
        // initial values
      $scope.error = false;
      $scope.disabled = true;

      // call login from service
      AuthService.login($scope.loginForm.username, $scope.loginForm.password)
        // handle success
        .then(function () {
          profile.init($scope.loginForm.username, function(){          
            $location.path('/');          
            $scope.loginForm = {}
          })
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
.controller('FicheEquipeCtrl', function($scope, $routeParams, equipes, matchs){
    $scope.nom_equipe = $routeParams.nom;
    $scope.done = false;
    $scope.erreur = false;

    equipes.findByNom($routeParams.nom, function(e){
      $scope.equipe = e;
      $scope.done = true;
    })

    matchs.prochain_match_de($scope.nom_equipe).then(function(match){
      $scope.prochain_match = { "adversaire": (match.equipes[0] == $scope.nom_equipe) ? match.equipes[1] : match.equipes[0],
                                "horaire": match.horaire_prevu}
    })

    matchs.matchs_de($scope.nom_equipe).then(function(matchs_de){
      $scope.liste_matchs = matchs_de
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
.controller('MatchsCtrl', function($scope, matchs, $q, cotes, profile, $mdDialog, paris){
    $scope.done = false;
    $scope.erreur = false;
    $scope.pas_de_match_en_cours = true
    $scope.fortune = profile.getFortune();

    $scope.pari_plus_un = function(match, num_equipe){
      if (profile.getFortune() > 0){
        paris.ajouter_pari(match, num_equipe, profile.pseudo())
             .then(function(){        
                match.paris[num_equipe] = match.paris[num_equipe] + 1
                profile.addToFortune(-1)
                $scope.fortune = profile.getFortune()
              })
      } else {
        $mdDialog.show(
           $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#popupContainer')))
                    .clickOutsideToClose(true)
                    .title('Pari impossible !')
                    .textContent('Plus assez de boyards !')
                    .ariaLabel('Alerte : plus assez de boyards')
                    .ok('OK'))
      }
    }
  


    $scope.format_cotes_match = function(match){
      if( match.cotes){
        return(match.cotes)
      }

      var cotes_ce_match = cotes.formatOddsForGame(match.equipes, ', ', 2)
      match.cotes = cotes_ce_match
      return cotes_ce_match
    }

    $q.all([matchs.liste_matchs(),
            matchs.en_cours(),
            matchs.prochain()]).then(function(array){
        
        $scope.done = true;
        $scope.erreur = false;

        $scope.liste_matchs = array[0];
        if (array[1] != undefined){
          $scope.pas_de_match_en_cours = false
          $scope.match_en_cours =  array[1]
          $scope.cotes_en_cours_formatees = cotes.formatOddsForGame($scope.match_en_cours.equipes)  
        }
        $scope.prochain_match =  array[2]
        
        
        $scope.cotes_prochain_formatees = cotes.formatOddsForGame($scope.prochain_match.equipes)
        
      }, function(err){
        $scope.erreur = true;
        $scope.done = true;
        console.log("Erreur lors du chargement de la liste des matchs...")})})
.controller('parierCtrl', function(){})