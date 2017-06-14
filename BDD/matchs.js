var AWS = require("aws-sdk");
AWS.config.update({
  region: "us-west-2",
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});
var docClient = new AWS.DynamoDB.DocumentClient()

exports.findByDate = function(date, cb){
  var table = "Match";
  var params = {
      TableName: table
  };
  console.log("Requête DynamoDB pour match " + date.horaire_prevu + " (" + date.annee + ")")
  if (date.horaire_prevu != "all"){
    params.FilterExpression = "horaire_prevu = :horaire_prevu AND annee=:annee";
    params.ExpressionAttributeValues = {':horaire_prevu': date.horaire_prevu,
                                        ':annee': date.annee}
  }

  docClient.scan(params, function(err, data) {
      if (err) {
          console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      }
      return cb(err, data.Items)
  });
}

exports.insererPari = function(obj, cb){
  

  obj.match.paris[obj.num_equipe] = obj.match.paris[obj.num_equipe] + obj.mise
  console.log("Écriture DynamoDB pour match " + obj.match.equipes[0] + " vs. " + obj.match.equipes[1] + "(" + obj.match.annee+ ")")
  var params = {
    TableName: "Match",
    Key:{
      "annee": obj.match.annee,
      "horaire_prevu": obj.match.horaire_prevu
    },
    UpdateExpression: "set paris = :paris",
    ExpressionAttributeValues: {':paris': obj.match.paris}
  }

  docClient.update(params, function(err, data) {
      if (err) {
          console.error("Mise à jour du match échouée. Erreur JSON:", JSON.stringify(err, null, 2));
      } else {
          console.log("Mise à jour des paris du match " + obj.match.equipes[0] + " vs. " + obj.match.equipes[1] + 
            " par " + obj.pseudo)
          return cb(err, data)
      }
  });

}
