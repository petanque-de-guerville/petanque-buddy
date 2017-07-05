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
     findByNom: function(nom){
       if (deja_requete){
         return $q.when(dict).then(function(d){
           return d.get(nom)
         })
       } else {
         return this.liste_equipes().then(function(l){
           return dict.get(nom)
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
          console.log("Chargement des joueurs depuis la BDD")
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
   findByPseudo: function(pseudo, force_reload){
    if (force_reload) {
      deja_requete = false
    }
    if (deja_requete){
       return $q.when(dict).then(function(d){
         return d.get(pseudo)
       })
     } else {
       return this.liste_joueurs().then(function(l){
         return dict.get(pseudo)
       })
     }}
 }})
.factory('profile', function(joueurs, cotes, $rootScope, $q){
  
  var pseudo = undefined
  var fortune = undefined
  var equipe = undefined
  var cote = undefined
  var role = undefined
  
  var init = function(user){
    return(joueurs.findByPseudo(user).then(function(res){
          pseudo = res.pseudo
          fortune = res.fortune
          equipe = res.equipe
          cote = res.cote
          role = res.role
          $rootScope.$broadcast('user:updated')
          return res
        }))   
  }

 var sync = function(){
    return $q.all([joueurs.findByPseudo(pseudo, true)]).then(function(array){
          fortune = array[0].fortune
          equipe = array[0].equipe
          cote = array[0].cote
          role = array[0].role
          $rootScope.$broadcast('user:updated')
          return array[0]              
  })}

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
    init: init,
    sync: sync
  }})
.factory('cotes', function(){
  // var Cotes_joueurs = new Map()
  // var Cotes_equipes = new Map()


  // var getOddsForTeam = function(nom_equipe){
  //   if (Cotes_equipes.has(nom_equipe)){
  //     return $q.when(Cotes_equipes.get(nom_equipe))
  //   } else {
  //     return equipes.findByNom(nom_equipe).then(function(equipe){
  //           var membres = equipe.joueurs
  //           return $q.all([getOddsForPlayer(membres[0]),
  //                   getOddsForPlayer(membres[1]),
  //                   getOddsForPlayer(membres[2])]).then(function(array_cotes){
  //                     console.log("Cotes membres", equipe.nom_equipe, ":", JSON.stringify(array_cotes))
  //                 var coteAgregee = array_cotes[0] + array_cotes[1] + array_cotes[2]
  //                 console.log("Cote équipe : " + equipe.nom_equipe + " : " + coteAgregee)
  //                 Cotes_equipes.set(equipe.nom_equipe, coteAgregee)
  //                 return coteAgregee
  //             })
  //           })
  //   }}
   
  // var getOddsForGame = function(match){
  //   return $q.all([getOddsForTeam(match.equipes[0]), 
  //                  getOddsForTeam(match.equipes[1])]).then(function(array){
  //     var odds1_indiv = array[0]
  //     var odds2_indiv = array[1]
  //     var coeff = 1 / (1 / odds1_indiv + 1 / odds2_indiv);
  //     console.log("getOddsForGame 1 : " + odds1_indiv)
  //     console.log("getOddsForGame 2 : " + odds2_indiv)

  //     var odds1 = 1 / (1 / odds1_indiv * coeff)
  //     var odds2 = 1 / (1 / odds2_indiv * coeff)
  //     return {cotes: [odds1, odds2]}
  //   })
  // }


  // var getOddsForPlayer = function(pseudo){
  //     if (Cotes_joueurs.has(pseudo)){
  //       return $q.when(Cotes_joueurs.get(pseudo))
  //     } else {
  //       return joueurs.findByPseudo(pseudo).then(function(j){
  //         Cotes_joueurs.set(pseudo, j.cote)
  //         return j.cote
  //       })
  //     }}

  var formatOddsForGame = function(match, sep, nb_dec){
    if (typeof(sep)==='undefined') sep = ",";
    if (typeof(nb_dec)==='undefined') nb_dec = 2;

    return ' ' + Math.round(match.cotes[0] * 10**nb_dec)/10**nb_dec + 
              sep + ' ' + Math.round(match.cotes[1] * 10**nb_dec)/10**nb_dec
  }

  return {
    // getOddsForPlayer: getOddsForPlayer,
    // getOddsForGame: getOddsForGame,
    // getOddsForPlayer: getOddsForPlayer,
    formatOddsForGame: formatOddsForGame
  }})
.factory('matchs', function($q, $resource, cotes, $rootScope){
  var liste = undefined
  var update_needed = true

  var liste_matchs = function(){
      if (update_needed){
        console.log("Recalcul de liste_matchs")
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
    
      return $q.when(liste)}
  var prochain = function(){
      return liste_matchs()
              .then(function(res){ return res.find( function(match){
                return (match.en_cours == "0" && match.fini == "0")
              })})}
  var demarrer_match = function(id_match){
    return $resource("/api/matchs/demarrer/" + id_match)
          .get()
          .$promise
          .then(function(res){
            console.log(JSON.stringify(res))
            update_needed = true
            return res
          })}
  var arreter_match_en_cours = function(){
      return $resource("/api/matchs/stopper/")
            .get()
            .$promise
            .then(function(res){
              console.log(JSON.stringify(res))
              update_needed = true
              return res
            })}
  var sync = function(data){
    if (data && data.score_a_jour){
      console.log("Mise à jour score match en cours")
      en_cours().then(function(match_en_cours){
        match_en_cours.score = data.score_a_jour
      })
    } else {
      update_needed = true
      return $q.all([liste_matchs()]).then(function(array){
                update_needed = false
                $rootScope.$broadcast('matchs:updated')
              })
    }}
  var en_cours = function(){
      return liste_matchs()
              .then(function(res){ return res.find( function(match){
                return (match.en_cours == "1")})})}
  var modifie_score_match_en_cours = function(scores){
    return $resource("/api/matchs/scores/" + scores[0] + "/" + scores[1])
          .get()
          .$promise
          .then(function(res){
            console.log("Score mis à jour")
            return res
          })}
  var temps_jusqu_a_match = function(prochain_match){
    var part = prochain_match.horaire_prevu.match(/(\d+):(\d+)/i)
    var hh = parseInt(part[1], 10)
    var mm = parseInt(part[2], 10)

    var date_now = new Date()
    var date_match = new Date(date_now.getFullYear(), date_now.getMonth(), date_now.getDate(), hh, mm, 0)
    var diff_minutes = Math.round((date_match - date_now) / 1000 / 60)
    return diff_minutes
  }

  return {
    liste_matchs,
    temps_jusqu_a_match,
    en_cours,
    prochain,
    prochain_match_de: function(equipe){
      return liste_matchs()
              .then(function(res){ return res.find(function(match){
                return ((match.equipes[0] == equipe || match.equipes[1] == equipe) && match.en_cours == "0" && match.fini == "0")
              }) })},
    matchs_de: function(equipe){
      return liste_matchs()
              .then(function(res){ return res.filter( (el) => (el.equipes[0] == equipe || el.equipes[1] == equipe)) })},
    demarrer_prochain_match: function(){
      return  prochain().then(function(match) {
                return demarrer_match(match.ID)
              })},
    arreter_match_en_cours,
    sync,
    modifie_score_match_en_cours
  }})
.factory('paris', function($q, $http, matchs){
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
        }})
