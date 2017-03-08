var AWS = require("aws-sdk");
var fs = require('fs');

AWS.config.update({
    region: "us-west-2",
    endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});

var docClient = new AWS.DynamoDB.DocumentClient();


console.log("Ajout de jour à la BDD. Patientez...");

var allPlayers = JSON.parse(fs.readFileSync('joueurs_import.json', 'utf8'));
allPlayers.forEach(function(joueur) {
    var params = {
        TableName: "Joueur",
        Item: {
            "pseudo":  joueur.pseudo,
            "equipes": joueur.equipes,
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
