angular.module("MyApp").factory('AuthService', ['$q', '$timeout', '$http', function ($q, $timeout, $http) {
  // create user variable
  var user = null;
  var currentUser = undefined
  // return available functions for use in the controllers
  return ({
    isLoggedIn: isLoggedIn,
    getUserStatus: getUserStatus,
    login: login,
    logout: logout,
    register: register,
    currentUser : function(){ return currentUser}
  });

  function isLoggedIn() {
    if(user) {
      return true;
    } else {
      return false;
    }
  }

  function getUserStatus() {
    return $http.get('/user/status')
  // handle success
  .success(function (data) {
    if(data.status){
      user = true;
    } else {
      user = false;
    }
  })
  // handle error
  .error(function (data) {
    user = false;
  });

  }

  function login(username, password) {

    // create a new instance of deferred
    var deferred = $q.defer();

    // send a post request to the server
    $http.post('/login',
      {username: username, password: password})
      // handle success
      .success(function (data, status) {
        if(status === 200 && data.status){
          user = true;
          currentUser = username
          deferred.resolve();
        } else {
          console.log("Connexion refusée")
          user = false;
          deferred.reject();
        }
      })
      // handle error
      .error(function (data) {
        console.log("Erreur à la connexion")
        user = false;
        deferred.reject();
      });

    // return promise object
    return deferred.promise;

  }

  function logout() {

    // create a new instance of deferred
    var deferred = $q.defer();

    // send a get request to the server
    $http.get('/logout')
      // handle success
      .success(function (data) {
        user = false;
        currentUser = undefined
        deferred.resolve();
      })
      // handle error
      .error(function (data) {
        user = false;
        deferred.reject();
      });

    // return promise object
    return deferred.promise;

  }

  function register(username, password) {

    // create a new instance of deferred
    var deferred = $q.defer();

    // send a post request to the server
    $http.post('/register',
      {username: username, password: password})
      // handle success
      .success(function (data, status) {
        if(status === 200 && data.status){
          deferred.resolve();
        } else {
          deferred.reject();
        }
      })
      // handle error
      .error(function (data) {
        deferred.reject();
      });

    // return promise object
    return deferred.promise;

  }}])
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
 }})
.factory('profile', function(joueurs, cotes, $rootScope){
  
  var pseudo = undefined
  var fortune = undefined
  var equipe = undefined
  var cote = undefined
  var role = undefined
  
  init = function(user, cb){
    joueurs.findByPseudo(user, function(res){
          pseudo = res.pseudo
          fortune = res.fortune
          equipe = res.equipe
          cote = cotes.getOddsForPlayer(res.pseudo).cote
          role = res.role
          $rootScope.$broadcast('user:updated')
          cb()
    })    
  }

  return {
    pseudo: function(){ return pseudo},
    addToFortune: function(inc){ fortune = fortune + inc},
    setFortune: function(new_f){ fortune = new_f},
    getFortune: function(){ return fortune},
    equipe: function(){ return equipe},
    cote: function(){return cote},
    role: function(){ return role},
    est: function(role_test){ 
      if (role != undefined) {
          return role.includes(role_test)
      } 
      else return false},
    init: init
  }})
.factory('cotes', function(){
  getAggregatedOddsForTeam = function(team){
    // Fonction triviale
    // En attente de la gestion des cotes

    return {cote_equipe: Math.round(100 * ((Math.random()*3)+1))/100}
  }

  getOddsForGame = function(teams){
    // Fonction triviale
    // En attente de la gestion des cotes
    var odds1 = getAggregatedOddsForTeam(teams[0]).cote_equipe;
    var odds2 = getAggregatedOddsForTeam(teams[1]).cote_equipe;
    var coeff = 1 / (1 / odds1 + 1 / odds2);
    return {cotes: [ 1 / (coeff * 1 / odds1), 1 / (coeff * 1 / odds2)]}
  }


  getOddsForPlayer = function(pseudo){
    // Fonction triviale
    // En attente de la gestion des cotes

    return {cote: Math.round(100 * ((Math.random()*3)+1))/100}
  }

  formatOddsForGame = function(teams, sep, nb_dec){
    if (typeof(sep)==='undefined') sep = ",";
    if (typeof(nb_dec)==='undefined') nb_dec = 2;
    var cotes = getOddsForGame(teams).cotes
    return ' ' + Math.round(cotes[0] * 10**nb_dec)/10**nb_dec + sep + ' ' + Math.round(cotes[1] * 10**nb_dec)/10**nb_dec
  }

  return {
    getOddsForGame: getOddsForGame,
    getOddsForPlayer: getOddsForPlayer,
    formatOddsForGame: formatOddsForGame
  }})
.factory('matchs', function($q, $resource){
  var liste = undefined
  var update_needed = true

  var liste_matchs = function(){
      if (update_needed){
        var deferred = $q.defer()

        $resource("/api/matchs/lire/2017/all")
          .query()
          .$promise
          .then(function(res){
            liste = res.sort(function compare(a, b) {
                  if (a.horaire_prevu < b.horaire_prevu)
                     return -1;
                  if (a.horaire_prevu > b.horaire_prevu)
                     return 1;
                  
                  console.log("Erreur : deux matchs à la même heure !" + JSON.stringify(a) + " " + JSON.stringify(b))
                  return 0;
                })
            update_needed = false
            deferred.resolve(liste)
          })

        liste = deferred.promise;
      }
    
      return $q.when(liste)
  }

  var prochain = function(){
      return liste_matchs()
              .then(function(res){ return res.find( function(match){
                return (match.en_cours == "0" && match.fini == "0")
              })})
  }

  var demarrer_match = function(id_match){
    return $resource("/api/matchs/demarrer/" + id_match)
          .get()
          .$promise
          .then(function(res){
            console.log(JSON.stringify(res))
            update_needed = true
            return res
          })
  }

  var arreter_match_en_cours = function(){
      return $resource("/api/matchs/stopper/")
            .get()
            .$promise
            .then(function(res){
              console.log(JSON.stringify(res))
              update_needed = true
              return res
            })
    }

  return {
    liste_matchs: liste_matchs,
    en_cours: function(){
      return liste_matchs()
              .then(function(res){ return res.find( function(match){
                return (match.en_cours == "1")
              })})
    },
    prochain: prochain,
    prochain_match_de: function(equipe){
      return liste_matchs()
              .then(function(res){ return res.find(function(match){
                return ((match.equipes[0] == equipe || match.equipes[1] == equipe) && match.en_cours == "0" && match.fini == "0")
              }) })
    },
    matchs_de: function(equipe){
      return liste_matchs()
              .then(function(res){ return res.filter( (el) => (el.equipes[0] == equipe || el.equipes[1] == equipe)) })
    },
    demarrer_prochain_match: function(){
      return  prochain().then(function(match) {
                return demarrer_match(match.ID)
              })
    },
    arreter_match_en_cours: arreter_match_en_cours
  }
})
.factory('paris', function($q, $http){
  return {maj: function(){},
          ajouter_pari: function(match, num_equipe, pseudo){
                var deferred = $q.defer();
                $http.post('/api/paris/issue_match', {match: match,
                                                      num_equipe: num_equipe,
                                                      mise: 1,
                                                      pseudo: pseudo})
                      // handle success
                      .success(function (data, status) {
                        if(status === 200 && data.status){
                          console.log("Insertion réussie.")
                          deferred.resolve();
                        } else {
                          console.log("Insertion échouée bien que retour de fonction réussi.")
                          deferred.reject();
                        }})
                      // handle error
                      .error(function (data) {
                        console.log("Insertion échouée.")
                        deferred.reject();
                      })
                return deferred.promise
              }
        }
})
