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

exports.paiement_joueurs = function(ID, cb){
  var params = {
    TableName: "Pari",
    FilterExpression: "ID_match = :ID AND objet_pari = :obj",
    ExpressionAttributeValues: {
      ':ID': ID,
      ':obj': "victoire"}
  }

  docClient.scan(params, function(err, data) {
    if (err){
      cb(err, null)
    } else {
      /* Les paris sont dans data.Items */
      console.log("Paiement des joueurs")
      data.Items.forEach(function(item){
        console.log("Paiement du pari", item.ID)
      })
      cb(null, data)
    }
  })
}
