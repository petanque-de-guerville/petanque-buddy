var AWS = require("aws-sdk");
AWS.config.update({
  region: "us-west-2",
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});
var docClient = new AWS.DynamoDB.DocumentClient()

exports.findByPseudo = function(pseudo, cb){
  var table = "Joueur";
  var params = {
      TableName: table
  };

  console.log("Requête DynamoDB pour joueur " + pseudo)

  if (pseudo != "all"){
    params.FilterExpression = "pseudo = :pseudo";
    params.ExpressionAttributeValues = {':pseudo': pseudo}
  }

  docClient.scan(params, function(err, data) {
      if (err) {
          console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      }

      cb(err, data.Items)
  });
}

exports.addFortune = function(obj, cb){

  console.log("Écriture DynamoDB. Mise à jour fortune de " + obj.pseudo + " : " + obj.nb_boyards + " boyards.")
  var params = {
    TableName: "Joueur",
    Key:{
      "pseudo": obj.pseudo
    },
    UpdateExpression: "set fortune = fortune + :nb",
    ExpressionAttributeValues: {':nb': obj.nb_boyards}
  }

  docClient.update(params, function(err, data) {
      if (err) {
          console.error("Mise à jour du joueur échouée. Erreur JSON:", JSON.stringify(err, null, 2));
          cb(err, null)
      } else {
          console.log("Mise à jour de la fortune du joueur " + obj.pseudo)
          return cb(null, data)
      }
  });
}
