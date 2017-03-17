var AWS = require("aws-sdk");
AWS.config.update({
  region: "us-west-2",
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});
var docClient = new AWS.DynamoDB.DocumentClient()

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
