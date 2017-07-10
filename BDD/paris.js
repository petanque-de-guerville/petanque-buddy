var AWS = require("aws-sdk");
var uuid = require('node-uuid');

AWS.config.update({
  region: "us-west-2",
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});
var docClient = new AWS.DynamoDB.DocumentClient()
var matchs = require("./matchs.js")
var joueurs = require("./joueurs.js")

exports.inserePari = function(obj, cb){
  
    var params = {
        TableName: "Pari",
        Item: {
            "ID": uuid.v4(),
            "ID_match": obj.match.ID,
            "mise": obj.mise,
            "objet_pari": "victoire",
            "cible_pari": obj.num_equipe,
            "parieur": obj.pseudo,
            "cote": obj.match.cotes[obj.num_equipe]
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
  matchs.findByID(ID, function(err, match){
    var equipe_victoire = (match.score[0] > match.score[1]) ? 0 : 1

    var params = {
      TableName: "Pari",
      FilterExpression: "ID_match = :ID AND objet_pari = :obj",
      ExpressionAttributeValues: {
        ':ID': match.ID,
        ':obj': "victoire"}
    }

    docClient.scan(params, function(err, Paris) {
      if (err){
        cb(err, null)
      } else {
        /* Les paris sont dans data.Items */
        console.log("Paiement des joueurs")
        Paris.Items.forEach(function(pari){
          console.log("Paiement du pari", pari.ID)
          if (pari.cible_pari == equipe_victoire){
            console.log(pari.parieur, "gagne", pari.cote * pari.mise, "boyards.")
            joueurs.addFortune({pseudo: pari.parieur,
                                nb_boyards: pari.cote * pari.mise},
                                function(err, data){
                                  if (err){
                                    console.log("Paiement de", pari.parieur, "échoué")
                                  }
                                })
          } else {
            console.log(pari.parieur, "perd", pari.mise, "boyards.")
          }

        })
        cb(null, ID)
      }
    })

  })
}

exports.parieurs_tel_match = function(obj, callback){
    var params = {
      TableName: "Pari",
      FilterExpression: "ID_match = :ID AND objet_pari = :obj AND cible_pari=:eq",
      ExpressionAttributeValues: {
        ':ID': obj.match.ID,
        ':obj': "victoire",
        ':eq': obj.num_equipe}
    }

    docClient.scan(params, function(err, Paris) {
      if (err){
        callback(err, null)
      } else {
        callback(null, Paris)
      }
    })
}