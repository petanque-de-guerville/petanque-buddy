var AWS = require("aws-sdk");
var uuid = require('node-uuid');

AWS.config.update({
  region: "us-west-2",
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});
var docClient = new AWS.DynamoDB.DocumentClient()

exports.inserePari = function(obj, cb){
  
    var params = {
        TableName: "Pari",
        Item: {
            "ID": uuid.v4(),
            "ID_match": obj.match.ID,
            "mise": obj.mise,
            "objet_pari": "victoire",
            "cible_pari": obj.num_equipe,
            "parieur": obj.pseudo
        }
    };

    docClient.put(params, function(err, data) {
     if (err) {
          console.error("Insertion pari échouée. Erreur JSON:", JSON.stringify(err, null, 2));
      } else {
          console.log("Insertion pari réussie.")
      }
      return cb(err, data)
  });
}
