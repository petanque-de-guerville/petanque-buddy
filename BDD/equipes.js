var AWS = require("aws-sdk");
AWS.config.update({
  region: "us-west-2",
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});
var docClient = new AWS.DynamoDB.DocumentClient()
var joueurs = require('./joueurs.js')

var findByNom = function(nom, cb){
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

      cb(err, data.Items)
  });}
exports.findByNom = findByNom

exports.updateOdds = function(nom_equipe, incOdds, cb){
    console.log("Écriture DynamoDB. Mise à jour cote équipe " + nom_equipe + " : " + incOdds)
    var params = {
      TableName: "Equipe",
      Key:{
        "annee": 2017,
        "nom_equipe": nom_equipe
      },
      UpdateExpression: "set cote = cote + :inc",
      ExpressionAttributeValues: {':inc': incOdds}
    }

    docClient.update(params, function(err, data) {
        if (err) {
            console.error("Mise à jour cote équipe échouée. Erreur JSON:", JSON.stringify(err, null, 2));
            cb(err, null)
        } else {
            console.log("Mise à jour cote équipe " + nom_equipe + " réussie")
            cb(null, data)
        }
    })}