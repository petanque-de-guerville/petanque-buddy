var AWS = require("aws-sdk");
AWS.config.update({
  region: "us-west-2",
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});
var docClient = new AWS.DynamoDB.DocumentClient()
var equipes = require('./equipes.js')
var paris = require("./paris.js")
var joueurs = require("./joueurs.js")
var cotes = require("./cotes.js")

var findByID = function(id, cb){
  var params = {
      TableName: "Match",
      Key:{
        'ID': id
      }
  };
  console.log("Requête DynamoDB pour match " + id)

  docClient.get(params, function(err, data) {
      if (err) {
          console.error("Impossible de lire les données du match " + id + ". Erreur JSON:", JSON.stringify(err, null, 2));
      }
      return cb(err, data.Item)
  });}

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
  
  var updateExp = (obj.num_equipe == 0) ? "set paris[0] = paris[0] + :mise" : "set paris[1] = paris[1] + :mise"
  console.log("Écriture DynamoDB pour match " + obj.match.equipes[0] + " vs. " + obj.match.equipes[1] + "(" + obj.match.annee+ ")")
  var params = {
    TableName: "Match",
    Key:{
      "ID": obj.match.ID
    },
    UpdateExpression: updateExp,
    ExpressionAttributeValues: {':mise': obj.mise}
  }

  docClient.update(params, function(err, data) {
      if (err) {
          console.error("Mise à jour du match échouée. Erreur JSON:", JSON.stringify(err, null, 2));
      } else {
          console.log("Mise à jour des paris du match " + obj.match.equipes[0] + " vs. " + obj.match.equipes[1] + 
            " par " + obj.pseudo)
          cb(err, data)
      }
  });}

exports.modifieScores = function(obj, cb){
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
            cb(err, data)
        } else {
          if  (data.Count > 0){
            console.log("Écriture DynamoDB : Mise à jour score du match " + JSON.stringify(data.Items[0]))
            var updateExp = "set score[0] = :score0, score[1] = :score1"
            var params = {
              TableName: "Match",
              Key:{
                /* S'il y a plusieurs matchs en cours, on arrête le premier. Devrait pas il y en avoir plusieurs ! */
                "ID": data.Items[0].ID 
              },
            UpdateExpression: updateExp,
            ExpressionAttributeValues: {':score0': parseInt(obj.score0),
                                        ':score1': parseInt(obj.score1)},
            ConditionExpression: "score[0] <= :score0 AND score[1] <= :score1",
            ReturnValues: 'ALL_NEW'
          }

          docClient.update(params, function(err, data) {
              if (err) {
                  console.error("Mise à jour du score échouée. Erreur JSON:", JSON.stringify(err, null, 2));
                  cb(err, null)
              } else {
                  console.log("Mise à jour du score réussie : " + obj.score0 + " " + obj.score1)
                  cb(null, [obj.score0, obj.score1])
                }
              }
              )}
          else {
            cb({error: "Pas de match en cours."}, null)
          }}})
  }

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
  })  }

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
          cb(err, data)
      } else {
        if  (data.Count > 0){
          console.log("Écriture DynamoDB : arrêt match en cours.")
          var params = {
            TableName: "Match",
            Key:{
              /* S'il y a plusieurs matchs en cours, on arrête le premier. Devrait pas il y en avoir plusieurs ! */
              "ID": data.Items[0].ID 
            },
            UpdateExpression: "set fini = :fini, en_cours = :en_cours",
            ExpressionAttributeValues: {':en_cours': 0,
                                        ':fini': 1},
            ReturnValues: 'ALL_NEW'
          }

          docClient.update(params, function(err, data) {
              if (err) {
                  console.error("Arrêt du match en cours échoué. Erreur JSON:", JSON.stringify(err, null, 2));
                  cb(err, null)
              } else {
                  console.log("Arrêt du match " + data.Attributes.ID + " réussi.")
                  /* Paiement des paris */
                  paris.paiement_joueurs(data.Attributes.ID, function(err, ID_match){
                    if (err){
                      cb(err, null)
                    } else {
                      /* Modification des cotes des joueurs */
                      cotes.modification_cotes_equipes_suite_match(ID_match, (err, data) => {
                        if (err){
                          cb(err, null)
                        } else {
                          cb(null, data)
                        }
                      })
                    }
                  })
              }
          })  
        } else {
          console.log("Pas de match à arrêter")
          cb(err, data)
        }
      }
  })}

exports.findByID = findByID