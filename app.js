var express = require('express')
var app = express()
var passport = require('passport')
var bodyParser = require('body-parser')
var session = require('express-session')
var LocalStrategy = require('passport-local').Strategy;
var path = require('path');
var BDD = require('./BDD')

var score_match_en_cours

// NOTIFICATIONS
var Pusher = require('pusher');
var pusher = new Pusher({
  appId: '357504',
  key: 'b238d890f5ce582a1916',
  secret: '8d4b8b4f4fcf029757b3',
  cluster: 'eu',
  encrypted: true
})
var pushNotifDelay = 1000 * 10
var Notifications = new Set()


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
      secret: 'keyboard cat',
      resave: false,
      saveUninitialized: false
  }));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));


passport.use(new LocalStrategy(
  function(pseudo, password, cb) {
    console.log("Stratégie d'authentification")
    BDD.joueurs.findByPseudo(pseudo, function(err, joueur) {
      if (err) { return cb(err); }
      if (!joueur || joueur.length==0) { return cb(null, false); }
      if (joueur[0].password != password) { return cb(null, false); }
      return cb(null, joueur[0]);
    });
  }));

passport.serializeUser((joueur, done) => {
  done(null, joueur.pseudo);
});

passport.deserializeUser((pseudo, done) => {
  // return user by login
  BDD.joueurs.findByPseudo(pseudo, (err, joueur) => {
    done(err, joueur);
  });
});









app.get('/api/joueurs/:id', (req, res) => {
  BDD.joueurs.findByPseudo(req.params.id, (err, joueur) => {
    if (joueur){
      return res.json(joueur)
    } else {
      return null
    }
  })
});

app.get('/api/equipes/:id', function(req, res) {
  BDD.equipes.findByNom(req.params.id, (err, equipe) => {
    if (equipe){
      return res.json(equipe)
    } else {
      return null
    }
  })
});

app.get('/api/matchs/lire/:annee/:horaire_prevu', function(req, res) {
  BDD.matchs.findByDate({annee: req.params.id, 
                         horaire_prevu: req.params.horaire_prevu}, (err, match) => {
    if (match){
      return res.json(match)
    } else {
      return null
    }
  })
});

app.get('/api/matchs/demarrer/:id', function(req, res) {
  BDD.matchs.stopper((err, data) => {
    if (err){
      return res.status(500).json({status: "Erreur lors de la recherche du match à arrêter."})
    } else {
      Notifications.add('match_arrêté')
      BDD.matchs.demarrer({id: req.params.id}, (err, data) => {
        if (data){
          Notifications.add('matchs_debut')
          return res.status(200).json(data)
        } else {
          return res.status(500).json({status: "Erreur lors du démarrage du match " + req.params.id})
        }
      })    
    }

  })
});

app.get('/api/matchs/stopper/', function(req, res) {
  BDD.matchs.stopper((err, data) => {
    if (err){
      return res.status(500).json({status: "Erreur lors de la recherche du match à arrêter : " + JSON.stringify(err)})
    } else {
      console.log("*************** Notification match arrêté ******************")
      Notifications.add('match_arrêté')
      return res.status(200).json({status: "Match arrêté avec succès." + JSON.stringify(data)})
    }
  })
});

app.get('/api/matchs/scores/:score0/:score1', function(req, res, next){
  console.log(JSON.stringify(req.params))
  BDD.matchs.modifieScores({score0: req.params.score0,
                            score1: req.params.score1}, function(err, data){
                              if (err){
                                return res.status(500).json({status: "Erreur lors de la mise à jour du score : " + JSON.stringify(err)})                    
                              } else {
                                Notifications.add('score_mis_a_jour')
                                score_match_en_cours = data
                                return res.status(200).json({status: "Mise à jour du score avec succès." + JSON.stringify(data)})                           
                              }
                            })
})

app.post('/api/paris/issue_match', function(req, res, next) {
  BDD.matchs.modifieMises({match: req.body.match,
                          num_equipe: req.body.num_equipe,
                          mise: req.body.mise,
                          pseudo: req.body.pseudo}, 

                          (err, data) => {
  if (data){
    BDD.joueurs.addFortune({pseudo: req.body.pseudo,
                            nb_boyards: -req.body.mise}, 
                            (err, data) => {
      if (data){
        BDD.paris.inserePari({match: req.body.match,
                          num_equipe: req.body.num_equipe,
                          mise: req.body.mise,
                          pseudo: req.body.pseudo},
          (err, data) => {
            if (data){
              Notifications.add('matchs_nouveaux_paris')
              return res.status(200).json({status: "Pari inséré et fortune joueur mise à jour"})
            } else {
              return res.status(500).json({status: "Erreur lors de l'insertion du pari."})
            }
          })
      } else {
        return res.status(500).json({status: "Erreur lors de la mise à jour de la fortune de " + req.body.pseudo})
      }
    })
  } else {
    return res.status(500).json({status: "Erreur. Mises sur le match non mises à jour."})
  }
})
})


app.post('/login', function(req, res, next) {
  console.log("Demande d'authentification pour " + req.body.username);
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({
        err: info
      });
    }
    req.logIn(user, function(err) {
      if (err) {
        return res.status(500).json({
          err: 'Could not log in user'
        });
      }
      res.status(200).json({
        status: 'Login successful!'
      });
    });
  })(req, res, next);
});



app.get('/logout', function(req, res) {
  req.logout();
  res.status(200).json({
    status: 'Bye!'
  });
});

app.get('/user/status', function(req, res) {
  if (!req.isAuthenticated()) {
    return res.status(200).json({
      status: false
    });
  }
  res.status(200).json({
    status: true
  });
})

app.get('/', function(req, res) {
        res.sendfile('./public/index.html');
});

app.post('/register', function(req, res) {
  User.register(new User({ username: req.body.username }),
    req.body.password, function(err, account) {
    if (err) {
      return res.status(500).json({
        err: err
      });
    }
    passport.authenticate('local')(req, res, function () {
      return res.status(200).json({
        status: 'Registration successful!'
      });
    });
  });
});

app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    res.send(req.user);
  });


app.listen(3000, "192.168.0.16", function () {
  console.log('Petanque-buddy écoute sur le port 3000...')
})



// NOTIFICATIONS
setInterval(function(){
  console.log(Notifications.size + " nouvelles notifications")
  while (Notifications.size > 0){
    if (Notifications.has('match_arrêté')){
      Notifications.delete('match_arrêté')
      pusher.trigger('MAJ', 'match_terminé', {})
      console.log("Push match terminé envoyé.")
    } else if (Notifications.has('matchs_nouveaux_paris')){
      Notifications.delete('matchs_nouveaux_paris')
      pusher.trigger('MAJ', 'matchs_nouveaux_paris', {})
      console.log("Push nouveaux paris envoyé.")
    } else if (Notifications.has('matchs_debut')){
      Notifications.delete('matchs_debut')
      pusher.trigger('MAJ', 'matchs_debut', {})
      console.log("Push début match.")    
    } else if (Notifications.has('score_mis_a_jour')){
      Notifications.delete('score_mis_a_jour')
      pusher.trigger('MAJ', 'score_mis_a_jour', {score_a_jour: score_match_en_cours})
      console.log("Push score mis à jour.")    
    } else { // affiche les notifs non traitées
      for (let value of Notifications){
        console.log("Notif : " + value)
      }
    }
  }
}, pushNotifDelay)
