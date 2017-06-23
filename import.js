var AWS = require("aws-sdk");
var fs = require('fs');
var uuid = require("node-uuid")

AWS.config.update({
    region: "us-west-2",
    endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});

var docClient = new AWS.DynamoDB.DocumentClient();


console.log("Ajout de données à la BDD. Patientez...");
console.log("---- Import joueurs ----");
var allPlayers = JSON.parse(fs.readFileSync('joueurs_import.json', 'utf8'));
allPlayers.forEach(function(joueur) {
    var params = {
        TableName: "Joueur",
        Item: {
            "pseudo":  joueur.pseudo,
            "equipe": joueur.equipe,
            "fortune":  joueur.fortune,
            "password": joueur.password,
            "role": joueur.role
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

console.log("---- Import matchs ----");
var allGames = JSON.parse(fs.readFileSync('matchs_import.json', 'utf8'));
allGames.forEach(function(match) {
    var params = {
        TableName: "Match",
        Item: {
            "ID": uuid.v4(),
            "annee":  match.annee,
            "equipes": match.equipes,
            "horaire_prevu": match.horaire_prevu,
            "score": match.score,
            "en_cours": match.en_cours,
            "fini": match.fini,
            "paris": match.paris
        }
    };

    docClient.put(params, function(err, data) {
       if (err) {
           console.error("Unable to add game", match.equipes, ". Error JSON:", JSON.stringify(err, null, 2));
       } else {
           console.log("PutItem succeeded:", match.equipes);
       }
    });
});

