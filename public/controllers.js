var MyApp = angular.module("MyApp");

MyApp
.controller('mainCtrl', function($scope, profile, matchs){ 
    $scope.nom_joueur = profile.pseudo()
    if ($scope.nom_joueur != undefined) {
      matchs.prochain_match_de(profile.equipe()).then(function(match){
        if (match != null){
          $scope.duree_avant_match = matchs.temps_jusqu_a_match(match)
          $scope.prochain_match = { "horaire": match.horaire_prevu}
        } else {
          $scope.prochain_match = null
        }
      })
    }})
.controller('AppCtrl', function ($scope, $mdSidenav, AuthService, $location, profile, $rootScope, matchs, equipes, joueurs) {


    // Gestion des notifications envoyées par backend
    var pusher = new Pusher('b238d890f5ce582a1916', {
      cluster: 'eu',
      encrypted: true
    })
    var channel = pusher.subscribe('MAJ')
    channel.bind('match_terminé', function(data) {
      console.log("Reçu notif mise à jour back end : fin de match")
      matchs.sync().then(function(){
        console.log("Mise à jour profile")
        equipes.sync()
        joueurs.sync()
        profile.sync()
      })
    })

    channel.bind('matchs_nouveaux_paris', function(data){
      console.log("Reçu notif mise à jour back end : nouveaux paris")
      matchs.sync()
    });

    channel.bind('matchs_debut', function(data){
      console.log("Reçu notif back end : début nouveau match")
      matchs.sync()
    })

    channel.bind('score_mis_a_jour', function(data){
      console.log("Reçu notif back end : score mis à jour")
      matchs.sync(data)
    })


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
    $scope.$on('equipes:update_needed', function(event,data) {
      affichage_page()
    })


    var affichage_page = function(){
      $scope.done = false;
      $scope.erreur = false;
      $scope.prochain_match = undefined
      $scope.liste_matchs = undefined
      
      equipes.findByNom($routeParams.nom).then(function(e){
        $scope.equipe = e;
        $scope.done = true;
        $scope.cote = e.cote
      })

      matchs.prochain_match_de($scope.nom_equipe).then(function(match){
        $scope.prochain_match = { "adversaire": (match.equipes[0] == $scope.nom_equipe) ? match.equipes[1] : match.equipes[0],
                                  "horaire": match.horaire_prevu}
      })

      matchs.matchs_de($scope.nom_equipe).then(function(matchs_de){
        $scope.liste_matchs = matchs_de
      })      }
    
    affichage_page()
})
.controller('FicheJoueurCtrl', function($scope, $routeParams, joueurs, matchs){
    $scope.pseudo = $routeParams.pseudo;

    $scope.$on('joueurs:update_needed', (event, data) => {
      affichage_page()
    })

    var affichage_page = function(){
      $scope.done = false;
      $scope.erreur = false;
      $scope.duree_avant_match = undefined
      $scope.joueur = undefined

      joueurs.findByPseudo($routeParams.pseudo).then(function(j){
        $scope.joueur = j
        matchs.prochain_match_de(j.equipe).then(match => {
          if (match){
            $scope.duree_avant_match = matchs.temps_jusqu_a_match(match)
          } else {
            $scope.duree_avant_match = null
          }
          $scope.done = true})
      })

    }

    affichage_page()
  })
.controller('MaFicheCtrl', function($scope, profile, matchs){
    $scope.profile = profile
    $scope.changerMDP = false
    $scope.MDP_differents = false
    $scope.changeMDP = function(){
      if ($scope.loginForm.password_1 != $scope.loginForm.password_2){
        $scope.MDP_differents = true
      } else {
        console.log("Changer le mot de passe en BDD")
      }
    }

    matchs.prochain_match_de(profile.equipe()).then(match => {
      $scope.prochain_match = match
      $scope.num_equipe = (match.equipes[0] == profile.equipe()) ? 0 : 1
      $scope.duree_avant_match = matchs.temps_jusqu_a_match(match)
    })

  })
.controller('MatchsCtrl', function($scope, matchs, $q, cotes, profile, $mdDialog, paris){
    

    $scope.$on('matchs:updated', function(event,data) {
      affichage_matchs()
    })

    $scope.$on('user:updated', function(event,data) {
      $scope.fortune = profile.getFortune().toFixed(2);
      console.log("Fortune : " + $scope.fortune)  
    })

    // $scope.$on('matchs:score_a_jour', function(event, data){
    //   $scope.match_en_cours = matchs.en_cours()
    // })

    $scope.pari_plus_un = function(match, num_equipe, index){
      if (profile.getFortune() > 0){
        paris.ajouter_pari(match, num_equipe, profile.pseudo())
             .then(function(){        
                profile.addToFortune(-1) // Pas besoin de faire une mise à jour pushée car seul cet utilisateur est impacté
                                        // et la fonction ajouter_pari se charge de retirer 1 à la fortune en BDD
                $scope.fortune = profile.getFortune().toFixed(2)
                $scope.clicked[index] = false
                match.paris[num_equipe] = match.paris[num_equipe] + 1 // On fait ces écritures pour le joueur en attendant que 
                                                                      // la màj du serveur soit notifiée (y compris pour prendre
                                                                      // en compte les paris des autres joueurs)
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
      return cotes.formatOddsForGame(match, 2)
    }
      
    $scope.affiche_parieurs = function(match, num_equipe){
        paris.parieurs_tel_match(match, num_equipe).then(Paris => {
          var texte = "";
          if (Paris.Count == 0){
            texte = "Aucun pari enregistré."
          } else {
            var result = new Map(); 
            Paris.Items.forEach(pari => { 
              if (result.get(pari.parieur)) {
                result.set(pari.parieur, result.get(pari.parieur) + pari.mise) 
              } else {
                result.set(pari.parieur, pari.mise) 
              }})
            for (let key of result.keys()){
              texte += key + " a misé " + result.get(key) + " boyards. </br>"
            }
          }

          $mdDialog.show(
           $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#popupContainer')))
                    .clickOutsideToClose(true)
                    .title('Liste des parieurs')
                    .htmlContent(texte)
                    .ariaLabel('Liste des parieurs')
                    .ok('OK'))      
        })
    }

    var affichage_matchs = function(){
      $scope.done = false;
      $scope.erreur = false;
      $scope.pas_de_match_en_cours = true
      $scope.fortune = (profile.getFortune() != undefined) ? profile.getFortune().toFixed(2) : "Pas connecté" ;
      $scope.clicked = []

      $q.all([matchs.liste_matchs(),
              matchs.en_cours(),
              matchs.prochain()]).then(function(array){
          
          $scope.done = true;
          $scope.erreur = false;

          $scope.liste_matchs = array[0].filter(function(elt){ return (elt.fini == 0 && elt.en_cours == 0)});
          
          if (array[1] != undefined){
            $scope.pas_de_match_en_cours = false
            $scope.match_en_cours =  array[1]
            $scope.cotes_en_cours_formatees = $scope.format_cotes_match($scope.match_en_cours)
          } else {
            $scope.pas_de_match_en_cours = true            
          }
          
          if (array[2] != undefined){
            $scope.prochain_match =  array[2]
            $scope.cotes_prochain_formatees  = $scope.format_cotes_match($scope.prochain_match)
          }
          return
        }, function(err){
          $scope.erreur = true;
          $scope.done = true;
          console.log("Erreur lors du chargement de la liste des matchs..." + JSON.stringify(err))})}

    affichage_matchs()
})
.controller('parierCtrl', function(){})
.controller('AdminCtrl', function(matchs, $q, $scope, $mdToast, profile, matchs){
    var stop_count = 0
    
    $scope.demarrer_match = function(){
      matchs.demarrer_prochain_match().then(function(){ controle_des_matchs()})
    }

    $scope.arreter_match_en_cours = function(){
      stop_count++
      if (stop_count != 2){
        $mdToast.show(
          $mdToast.simple()
            .textContent("Appuyer une deuxième fois pour stopper le match.")
            .position("bottom")
            .hideDelay(1000))
      } else {
        matchs.arreter_match_en_cours().then(function(){ 
          controle_des_matchs()})  
      } 
    }

    var controle_des_matchs = function(){
      stop_count = 0
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
          $scope.score = [{'score': $scope.match_en_cours.score[0]},
                          {'score': $scope.match_en_cours.score[1]}] // Structure alambiquée pour que la view se mette à jour quand on ajoute 1
        }
        
        if (array[1] != undefined){
          $scope.prochain_match =  array[1]
        }
      }, function(err){
        $scope.erreur = true;
        $scope.done = true;
        console.log("Erreur lors du chargement des matchs...")})}

    $scope.score_plus_un = function(num_equipe){
      $scope.score[num_equipe].score = parseInt($scope.score[num_equipe].score) + 1
      matchs.modifie_score_match_en_cours([$scope.score[0].score, $scope.score[1].score])
    }

    controle_des_matchs()
})