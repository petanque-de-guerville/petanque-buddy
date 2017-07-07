var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-2",
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});
var docClient = new AWS.DynamoDB.DocumentClient()

var matchs = require("./matchs.js")
var equipes = require("./equipes.js")
var joueurs = require("./joueurs.js")

var updateOddsPlayer = function(pseudo, majJoueur, cb){
    console.log("Écriture DynamoDB. Mise à jour cote de " + pseudo + " : " + majJoueur)
    var params = {
      TableName: "Joueur",
      Key:{
        "pseudo": pseudo
      },
      UpdateExpression: "set cote = cote + :maj",
      ExpressionAttributeValues: {':maj': majJoueur}
    }

    docClient.update(params, function(err, data) {
        if (err) {
            console.error("Mise à jour du joueur " + pseudo + " échouée. Erreur JSON:", JSON.stringify(err, null, 2));
            cb(err, null)
        } else {
            console.log("Mise à jour de la fortune du joueur " + pseudo)
            cb(null, data)
        }
    })}
var updateOddsTeamsSimultaneously = function(noms_equipes, majIncCotes, cb){
  equipes.findByNom(noms_equipes[0], function(err, equipe0){
    if(err){
      cb(err, null)
    } else {
      equipes.findByNom(noms_equipes[1], function(err, equipe1){
        if (err){
          cb(err, null)
        } else {
          var eq0 = equipe0[0]
          var eq1 = equipe1[0]
          let majJoueur0 = majIncCotes[0] / 3
          let majJoueur1 = majIncCotes[1] / 3

          equipes.updateOdds(noms_equipes[0], majIncCotes[0], (err, data) => {
            if (err){
              cb(err, null)
            } else {
              equipes.updateOdds(noms_equipes[1], majIncCotes[1], (err, data) => {              
                if (err){
                  cb(err, null)
                } else {
                  var joueursTraites = 0
                  var postUpdate = function(){
                        joueursTraites++
                        if (joueursTraites == eq0.joueurs.length + eq1.joueurs.length) {
                          cb(null, {'nb_joueurs_traites': eq0.joueurs.length + eq1.joueurs.length})
                        }
                  }

                  eq0.joueurs.forEach( membre => {
                    updateOddsPlayer(membre, majJoueur0, (err, joueurAJour) => {
                      if (err){
                        cb(err, null)
                      } else {
                        postUpdate()
                      }})})

                  eq1.joueurs.forEach( membre => {
                    updateOddsPlayer(membre, majJoueur1, (err, joueurAJour) => {
                      if (err){
                        cb(err, null)
                      } else {
                        postUpdate()
                      }})})                  
                }
              })
            }})
        }})
    }
  })}


exports.modification_cotes_equipes_suite_match = function(ID, cb){
  matchs.findByID(ID, function(err, match){
  if (err){
    cb(err, null)
  } else {
    let prob0 = 1 / match.cotes[0] 
    let prob1 = 1 / match.cotes[1]
    if (match.score[0] != match.score[1]){ 
      let prob = [prob0, prob1]
      let vict = (match.score[0] > match.score[1]) ? 0 : 1
      let maxMajProba = prob[1-vict] * (1 - prob[vict])
      let majProba = Math.sqrt(Math.abs(match.score[0] - match.score[1])/Math.max(13, match.score[0], match.score[1])) * maxMajProba
      console.log("inc maj probas : " + majProba)
      let majCotes = [0, 0]
      var signe = function(equipe){ return ((equipe == vict) ? -1 : 1)}
      for (eq in [0, 1]){
        majCotes[eq] = signe(eq) / (prob[eq] * prob[eq]) * majProba / (1 - signe(eq) * majProba / prob[eq]) 
      } 
      console.log("inc maj cotes : " + majCotes)
      updateOddsTeamsSimultaneously(match.equipes, majCotes, (err, data) => {
        if (err){
          cb(err, null)
        } else {
          console.log("Mise à jour cote des joueurs : " + JSON.stringify(data))
          cb(null, data)
        }
      })           
    } else { // match nul on ressert les probas : le moins bon devient meilleur et vice et versa
      let maxMajProba = Math.max(prob0, prob1) - Math.min(prob0, prob1)
      let majProba = 1/3 * maxMajProba // chaque équipe se rapproche de l'autre d'1/3 de la proba qui les sépare
      let signe
      if (prob0 > prob1){
        signe = -1
      } else if (prob0 < prob1){
        signe = 1
      } else {
        signe = 0
      }

      let majCote0 = signe * majProba / (prob0 * (prob0 - signe * majProba))
      let majCote1 = -signe * majProba / (prob1 * (prob1 + signe * majProba))
      updateOddsTeamsSimultaneously(match.equipes, [majCote0, majCote1], (err, data) => {
        if (err){
          cb(err, null)
        } else {
          console.log("Mise à jour cote des joueurs : " + JSON.stringify(data))
          cb(null, data)
        }
      })              
    }
  }})
}


exports.computeOddsMatch = function(match, cb){
  console.log("Calcul de la cote du match opposant " + match.equipes[0] + " à " + match.equipes[1])
  
  equipes.findByNom(match.equipes[0], function(err0, eq0){
    equipes.findByNom(match.equipes[1], function(err1, eq1){
            console.log(match.equipes[0], match.equipes[1], JSON.stringify([eq0, eq1]))
            var odds1_indiv = eq0[0].cote
            var odds2_indiv = eq1[0].cote
            
            var coeff = 1 / (1 / odds1_indiv + 1 / odds2_indiv);

            var odds1 = 1 / (1 / odds1_indiv * coeff)
            var odds2 = 1 / (1 / odds2_indiv * coeff)
            
            cb([err0, err1], [odds1, odds2])

    })
  })}
exports.computeOddsTeam = function(nom, cb){
  console.log("Calcul de la cote de l'équipe " + nom)
  equipes.findByNom(nom, function(err, equipes) {
      if (err) {
          console.error("Échec du calcul de la cote :", JSON.stringify(err, null, 2));
          cb(err, null)
      } else {
        var membres = equipes[0].joueurs
        joueurs.findByPseudo(membres[0], function(err1, j1){
            joueurs.findByPseudo(membres[1], function(err2, j2){
                joueurs.findByPseudo(membres[2], function(err3, j3){
                    cb(err, j1[0].cote + j2[0].cote + j3[0].cote)
                  })
                })
              })
      }
  })}
