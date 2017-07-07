var AWS = require("aws-sdk");
var fs = require('fs');
var uuid = require("node-uuid")

AWS.config.update({
    region: "us-west-2",
    endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});

var docClient = new AWS.DynamoDB.DocumentClient();
var equipes = require('./BDD/equipes.js')
var matchs = require('./BDD/matchs.js')
var cotes = require('./BDD/cotes.js')

console.log("Ajout de données à la BDD. Patientez...");
console.log("---- Mise à jour des joueurs ----");
var allPlayers = JSON.parse(fs.readFileSync('joueurs_import.json', 'utf8'));
var nbJoueursATraiter = allPlayers.length
allPlayers.forEach(function(joueur) {
    var params = {
        TableName: "Joueur",
        Key: {
            "pseudo":  joueur.pseudo
        },
        UpdateExpression: "set fortune = :f, password = :p, #r = :r, cote=:c",
        ExpressionAttributeValues:{
          ":f": joueur.fortune,
          ":p": joueur.password,
          ":r": joueur.role,
          ":c": joueur.cote
        },
        ExpressionAttributeNames:{
          "#r": "role"
        }
    };

    docClient.update(params, function(err, data) {
       if (err) {
           console.error("Échec mise à jour joueur " + joueur.pseudo + ". Error JSON:", JSON.stringify(err, null, 2));
       } else {
          nbJoueursATraiter--
           console.log("Mise à jour réussie :", joueur.pseudo);
           if(nbJoueursATraiter == 0){
            MAJ_equipes()
           }
       }
    });
});

var MAJ_equipes = function(){
  console.log("---- Mise à jour des équipes ----");
  var allTeams = JSON.parse(fs.readFileSync('equipes_import.json', 'utf8'));
  var nbEquipesATraiter = allTeams.length
  allTeams.forEach(function(equipe) {
      
      cotes.computeOddsTeam(equipe.nom_equipe, function(err, coteEquipe){
        console.log("Cote pour l'équipe", equipe.nom_equipe, ":", coteEquipe)
        var params = {
            TableName: "Equipe",
            Key: {
              "annee": equipe.annee,
              "nom_equipe": equipe.nom_equipe
            },
            UpdateExpression: "set classement = :c, cote = :cote",
            ExpressionAttributeValues: {":c": equipe.classement,
                                        ":cote": coteEquipe}
        };

        docClient.update(params, function(err, data) {
           if (err) {
               console.error("Échec mise à jour équipe " + equipe.nom_equipe + ". Error JSON:", JSON.stringify(err, null, 2));
           } else {
              nbEquipesATraiter--
              console.log("PutItem succeeded:", equipe.nom_equipe);
              if (nbEquipesATraiter == 0) {
                MAJ_matchs()
              }
           }
        })
      })
  });


}



var MAJ_matchs = function(){
  console.log("---- Mise à jour des matchs ----");

    var params = {
      TableName: "Match"
  }

  docClient.scan(params, (err, data) => {
    if (err){
      console.error("Échec du scan de la table des matchs : " + JSON.stringify(err, null, 2));    
    } else {
      data.Items.forEach(function(match){

        cotes.computeOddsMatch(match, function(err, cotes_ce_match){


          var params = {
            TableName: "Match",
            Key: {
              "ID": match.ID
            },
            UpdateExpression: "set score= :s, en_cours= :ec, fini= :f, paris = :p, cotes = :cotes",
            ExpressionAttributeValues: {
              ":s": [0, 0],
              ":ec": 0,
              ":f": 0,
              ":p": [0, 0],
              ":cotes": cotes_ce_match
            }
          } 

          docClient.update(params, function(err, data) {
            if (err) {
              console.error("Échec de la mise à jour : " + JSON.stringify(err, null, 2));
            } else {
              console.log("Match mis à jour : " + match.ID);
            }
          })
        })
      })
    }
  });
}
