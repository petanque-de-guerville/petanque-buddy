var express = require('express')
var app = express()
var passport = require('passport')
var bodyParser = require('body-parser')
var session = require('express-session')
var LocalStrategy = require('passport-local').Strategy;
var path = require('path');
var BDD = require('./BDD')



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

app.get('/api/matchs/:annee/:horaire_prevu', function(req, res) {
  BDD.matchs.findByDate({annee: req.params.id, 
                         horaire_prevu: req.params.horaire_prevu}, (err, match) => {
    if (match){
      return res.json(match)
    } else {
      return null
    }
  })
});

app.post('/api/paris', function(req, res, next) {
  BDD.matchs.insererPari({match: req.body.match,
                          num_equipe: req.body.num_equipe,
                          mise: req.body.mise,
                          pseudo: req.body.pseudo}, 

                          (err, data) => {
                            if (data){
                              BDD.joueurs.addFortune({pseudo: req.body.pseudo,
                                                      nb_boyards: -req.body.mise}, 
                                                      (err, data) => {
                                                        if (data){
                                                          return res.status(200).json({status: "Pari inséré et fortune joueur mise à jour"})
                                                        } else {
                                                          return res.status(500).json({status: "Erreur lors de la mise à jour de la fortune de " + req.body.pseudo})
                                                        }
                              })
                            } else {
                              return res.status(500).json({status: "Erreur. Pari non inséré."})
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
