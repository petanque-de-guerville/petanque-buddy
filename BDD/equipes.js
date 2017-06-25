var AWS = require("aws-sdk");
AWS.config.update({
  region: "us-west-2",
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});
var docClient = new AWS.DynamoDB.DocumentClient()
var joueurs = require('./joueurs.js')

exports.findByNom = function(nom, cb){
  var table = "Equipe";
  var params = {
      TableName: table
  };
  console.log("Requête DynamoDB pour équipe " + nom)
  if (nom != "all"){
    params.FilterExpression = "nom_equipe = :nom";
    params.ExpressionAttributeValues = {':nom': nom}
  }

  docClient.scan(params, function(err, data) {
      if (err) {
          console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      }

      return cb(err, data.Items)
  });
}

exports.computeOdds = function(nom, cb){
  console.log("Calcul de la cote de l'équipe " + nom)
  var table = "Equipe";
  var params = {
      TableName: table,
      FilterExpression: "nom_equipe = :nom",
      ExpressionAttributeValues: {':nom': nom},
  }
  
  docClient.scan(params, function(err, data) {
      if (err) {
          console.error("Échec du calcul de la cote :", JSON.stringify(err, null, 2));
          cb(err, null)
      } else {
        var membres = data.Items[0].joueurs
        joueurs.findByPseudo(membres[0], function(err1, j1){
            joueurs.findByPseudo(membres[1], function(err2, j2){
                joueurs.findByPseudo(membres[2], function(err3, j3){
                    cb(err, j1[0].cote + j2[0].cote + j3[0].cote)
                  })
                })
              })
      }
  })
}
