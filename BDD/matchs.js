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
  });}

exports.modifieMises = function(obj, cb){
  

  obj.match.paris[obj.num_equipe] = obj.match.paris[obj.num_equipe] + obj.mise
  console.log("Écriture DynamoDB pour match " + obj.match.equipes[0] + " vs. " + obj.match.equipes[1] + "(" + obj.match.annee+ ")")
  var params = {
    TableName: "Match",
    Key:{
      "ID": obj.match.ID
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
  });}

exports.demarrer = function(obj, cb){

  console.log("Écriture DynamoDB : démarrage match " + obj.id)
  var params = {
    TableName: "Match",
    Key:{
      "ID": obj.id
    },
    UpdateExpression: "set en_cours = :en_cours",
    ExpressionAttributeValues: {':en_cours': 1},
    ReturnValues: 'ALL_NEW'
  }

  docClient.update(params, function(err, data) {
      if (err) {
          console.error("Démarrage du match échoué. Erreur JSON:", JSON.stringify(err, null, 2));
      } else {
          console.log("Démarrage du match " + obj.id + " réussi.")
          return cb(err, data.Attributes)
      }
  })  
}

exports.stopper = function(cb){
  
  console.log("Recherche match en cours...")
  var params = {
      TableName: "Match",
      FilterExpression: "en_cours = :en_cours",
      ExpressionAttributeValues: {':en_cours': 1}
  }
  
  docClient.scan(params, function(err, data) {
      console.log("Recherche match en cours terminée.")
      if (err) {
          console.error("Erreur lors de la recherche du match en cours. Error JSON:", JSON.stringify(err, null, 2));
          return cb(err, data)
      } else {
        if  (data.Count > 0){
          console.log("Écriture DynamoDB : arrêt match en cours.")
          var params = {
            TableName: "Match",
            Key:{
              "ID": data.Items[0].ID /* S'il y a plusieurs matchs en cours, on arrête le premier. */
            },
            UpdateExpression: "set fini = :fini, en_cours = :en_cours",
            ExpressionAttributeValues: {':en_cours': 0,
                                        ':fini': 1},
            ReturnValues: 'ALL_NEW'
          }

          return docClient.update(params, function(err, data) {
              if (err) {
                  console.error("Arrêt du match en cours échoué. Erreur JSON:", JSON.stringify(err, null, 2));
              } else {
                  console.log("Arrêt du match " + data.Attributes.ID + " réussi.")
              }
              return cb(err, data)
          })  
        } else {
          console.log("Pas de match à arrêter")
          return cb(err, data)
        }
      }
  })
}
