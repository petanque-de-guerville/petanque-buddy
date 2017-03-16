var express = require('express')
var app = express()
//var md-icons =require('material-design-icons')
var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-2",
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});

var docClient = new AWS.DynamoDB.DocumentClient()




app.use(express.static(__dirname + '/public'));

app.get('/api/joueurs/:id', function(req, res) {
  var table = "Joueur";
  var params = {
      TableName: table
  };

  if (req.params.id != "all"){
    params.FilterExpression = "pseudo = :pseudo";
    params.ExpressionAttributeValues = {':pseudo': req.params.id}
  }

  docClient.scan(params, function(err, data) {
      if (err) {
          console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          console.log("Succès : requête pour les joueurs !");
          res.json(data)
      }
  });
});

app.get('/api/equipes/:id', function(req, res) {
  var table = "Equipe";
  var params = {
      TableName: table
  };

  if (req.params.id != "all"){
      params.FilterExpression = "nom_equipe = :equipe";
      params.ExpressionAttributeValues = {':equipe' : req.params.id};
  }

  docClient.scan(params, function(err, data) {
      if (err) {
          console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          console.log("Succès : requête pour les équipes !");
          res.json(data);
      }
  });

});


app.get('/', function(req, res) {
        res.sendfile('./public/index.html');
});

app.listen(3000, "192.168.0.14", function () {
  console.log('Petanque-buddy écoute sur le port 3000...')
})
