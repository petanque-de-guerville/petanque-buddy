var express = require('express')
var app = express()
var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-2",
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});

var docClient = new AWS.DynamoDB.DocumentClient()




app.use(express.static(__dirname + '/public'));

app.get('/api/equipes', function(req, res) {
  var table = "Equipe";
  var params = {
      TableName: table,
      Key:{
          "annee": 2017,
          "nom_equipe": "Les Castors"
      }
  };

  docClient.get(params, function(err, data) {
      if (err) {
          console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
          res.json(data)
      }
  });
});


app.get('*', function(req, res) {
        res.sendfile('./public/index.html');
});

app.listen(3000, function () {
  console.log('Petanque-buddy écoute sur le port 3000...')
})
