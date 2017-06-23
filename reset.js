var AWS = require("aws-sdk");
var fs = require('fs');
var uuid = require("node-uuid")

AWS.config.update({
    region: "us-west-2",
    endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});

var docClient = new AWS.DynamoDB.DocumentClient();


console.log("Ajout de données à la BDD. Patientez...");
console.log("---- Mise à jour des joueurs ----");
var allPlayers = JSON.parse(fs.readFileSync('joueurs_import.json', 'utf8'));
allPlayers.forEach(function(joueur) {
    var params = {
        TableName: "Joueur",
        Key: {
            "pseudo":  joueur.pseudo
        },
        UpdateExpression: "set fortune = :f, password = :p, #r = :r",
        ExpressionAttributeValues:{
          ":f": joueur.fortune,
          ":p": joueur.password,
          ":r": joueur.role
        },
        ExpressionAttributeNames:{
          "#r": "role"
        }
    };

    docClient.update(params, function(err, data) {
       if (err) {
           console.error("Échec mise à jour joueur " + joueur.pseudo + ". Error JSON:", JSON.stringify(err, null, 2));
       } else {
           console.log("Mise à jour réussie :", joueur.pseudo);
       }
    });
});

console.log("---- Mise à jour des équipes ----");
var allTeams = JSON.parse(fs.readFileSync('equipes_import.json', 'utf8'));
allTeams.forEach(function(equipe) {
    var params = {
        TableName: "Equipe",
        Key: {
          "annee": equipe.annee,
          "nom_equipe": equipe.nom_equipe
        },
        UpdateExpression: "set classement = :c",
        ExpressionAttributeValues: {":c": equipe.classement}
    };

    docClient.update(params, function(err, data) {
       if (err) {
           console.error("Échec mise à jour équipe " + equipe.nom_equipe + ". Error JSON:", JSON.stringify(err, null, 2));
       } else {
           console.log("PutItem succeeded:", equipe.nom_equipe);
       }
    });
});

console.log("---- Mise à jour des matchs ----");

var params = {
    TableName: "Match"
}

docClient.scan(params, (err, data) => {
  if (err){
    console.error("Échec du scan de la table des matchs : " + JSON.stringify(err, null, 2));    
  } else {
    data.Items.forEach(function(match){
      var params = {
        TableName: "Match",
        Key: {
          "ID": match.ID
        },
        UpdateExpression: "set score= :s, en_cours= :ec, fini= :f, paris = :p",
        ExpressionAttributeValues: {
          ":s": [0, 0],
          ":ec": 0,
          ":f": 0,
          ":p": [0, 0]
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
  }
});
