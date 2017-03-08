var AWS = require("aws-sdk");
var fs = require('fs');

AWS.config.update({
    region: "us-west-2",
    endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});

var docClient = new AWS.DynamoDB.DocumentClient();


console.log("Ajout de jour à la BDD. Patientez...");
console.log("---- Import joueurs ----");
var allPlayers = JSON.parse(fs.readFileSync('joueurs_import.json', 'utf8'));
allPlayers.forEach(function(joueur) {
    var params = {
        TableName: "Joueur",
        Item: {
            "pseudo":  joueur.pseudo,
            "equipe": joueur.equipe,
            "fortune":  joueur.fortune
        }
    };

    docClient.put(params, function(err, data) {
       if (err) {
           console.error("Unable to add player", joueur.pseudo, ". Error JSON:", JSON.stringify(err, null, 2));
       } else {
           console.log("PutItem succeeded:", joueur.pseudo);
       }
    });
});

console.log("---- Import équipes ----");
var allTeams = JSON.parse(fs.readFileSync('equipes_import.json', 'utf8'));
allTeams.forEach(function(equipe) {
    var params = {
        TableName: "Equipe",
        Item: {
            "annee":  equipe.annee,
            "nom_equipe": equipe.nom_equipe,
            "joueurs":  equipe.joueurs,
            "classement": equipe.classement
        }
    };

    docClient.put(params, function(err, data) {
       if (err) {
           console.error("Unable to add team", equipe.nom_equipe, ". Error JSON:", JSON.stringify(err, null, 2));
       } else {
           console.log("PutItem succeeded:", equipe.nom_equipe);
       }
    });
});
