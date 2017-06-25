var MyApp = angular.module("MyApp");

MyApp
.controller('mainCtrl', function($scope, profile, matchs){ 
    $scope.nom_joueur = profile.pseudo()
    if ($scope.nom_joueur != undefined) {
      matchs.prochain_match_de(profile.equipe()).then(function(match){
        if (match != null){
          $scope.prochain_match = { "horaire": match.horaire_prevu}
        } else {
          $scope.prochain_match = null
        }
      })
    }})
.controller('AppCtrl', function ($scope, $mdSidenav, AuthService, $location, profile) {

    $scope.$on('user:updated', function(event,data) {
      $scope.estAdmin = profile.est("admin")
    });
    
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
          profile.init($scope.loginForm.username).then(function(res){          
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

    equipes.findByNom($routeParams.nom).then(function(e){
      $scope.equipe = e;
      $scope.done = true;
      return e
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

    joueurs.findByPseudo($routeParams.pseudo).then(function(j){
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
    
    var pusher = new Pusher('b238d890f5ce582a1916', {
      cluster: 'eu',
      encrypted: true
    })
    var channel = pusher.subscribe('MAJ')
    channel.bind('MAJ_matchs', function(data) {
      console.log("Reçu notif mise à jour back end")
      matchs.refresh().then(affichage_matchs);
    });


    $scope.done = false;
    $scope.erreur = false;
    $scope.pas_de_match_en_cours = true
    $scope.fortune = profile.getFortune();

    $scope.pari_plus_un = function(match, num_equipe){
      if (profile.getFortune() > 0){
        paris.ajouter_pari(match, num_equipe, profile.pseudo())
             .then(function(){        
                profile.addToFortune(-1) // Pas besoin de faire une mise à jour pushée car seul cet utilisateur est impacté
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
      }}
    $scope.format_cotes_match = function(match){
      return cotes.formatOddsForGame(match, ', ', 2)
    }
      

    var affichage_matchs = function(){
      $q.all([matchs.liste_matchs(),
              matchs.en_cours(),
              matchs.prochain()]).then(function(array){
          
          $scope.done = true;
          $scope.erreur = false;

          $scope.liste_matchs = array[0].filter(function(elt){ return (elt.fini == 0)});
          
          if (array[1] != undefined){
            $scope.pas_de_match_en_cours = false
            $scope.match_en_cours =  array[1]
            $scope.cotes_en_cours_formatees = $scope.format_cotes_match($scope.match_en_cours)
          }
          
          if (array[2] != undefined){
            $scope.prochain_match =  array[2]
            $scope.cotes_prochain_formatees  = $scope.format_cotes_match($scope.prochain_match)
          }
          
        }, function(err){
          $scope.erreur = true;
          $scope.done = true;
          console.log("Erreur lors du chargement de la liste des matchs..." + JSON.stringify(err))})}

    affichage_matchs()
})
.controller('parierCtrl', function(){})
.controller('AdminCtrl', function(matchs, $q, $scope){
    $scope.demarrer_match = function(){
      matchs.demarrer_prochain_match().then(function(){ controle_des_matchs()})
    }

    $scope.arreter_match_en_cours = function(){
      matchs.arreter_match_en_cours().then(function(){ controle_des_matchs()})
    }

    var controle_des_matchs = function(){
      $scope.done = false;
      $scope.erreur = false;
      $scope.pas_de_match_en_cours = true

     $q.all([matchs.en_cours(),
            matchs.prochain()]).then(function(array){
        
        $scope.done = true;
        $scope.erreur = false;

        if (array[0] != undefined){
          $scope.pas_de_match_en_cours = false
          $scope.match_en_cours =  array[0]
        }
        
        if (array[1] != undefined){
          $scope.prochain_match =  array[1]
        }
      }, function(err){
        $scope.erreur = true;
        $scope.done = true;
        console.log("Erreur lors du chargement des matchs...")})}

    controle_des_matchs()
})