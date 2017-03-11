var express = require('express')
var app = express()
var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-2",
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});

var docClient = new AWS.DynamoDB.DocumentClient()




app.use(express.static(__dirname + '/public'));

app.get('/api/joueurs', function(req, res) {
  var table = "Joueur";
  var params = {
      TableName: table
      // Key:{
      //     "annee": 2017,
      //     "nom_equipe": "Les Castors"
      // }
  };

  docClient.scan(params, function(err, data) {
      if (err) {
          console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          console.log("Succès : requête pour les joueurs !");
          res.json(data)
      }
  });
});


app.get('/', function(req, res) {
        res.sendfile('./public/index.html');
});

app.listen(3000, "192.168.0.14", function () {
  console.log('Petanque-buddy écoute sur le port 3000...')
})
