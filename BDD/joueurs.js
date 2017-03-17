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

  if (pseudo != "all"){
    params.FilterExpression = "pseudo = :pseudo";
    params.ExpressionAttributeValues = {':pseudo': pseudo}
  }

  docClient.scan(params, function(err, data) {
      if (err) {
          console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      }
      
      return cb(err, data.Items)
  });
}
