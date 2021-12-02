const user = require("./models/user");

module.exports = function(app, passport, db, ObjectId, multer) {

// ===============================================================

// Image Upload Code ====================
  var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/images/uploads')
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now() + ".png")
    }
  });
  var upload = multer({storage: storage}); 

// ========== GET ROUTES ==========

  // index.ejs
  app.get('/', function(req, res) {
    db.collection('ninja').find().toArray((err, result) => {
        if (err) return console.log(err)
        res.render('index.ejs', {
          user : req.user,
          ninja: result
        })
      })
  });

  // battles.ejs
    app.get('/battles', isLoggedIn, function(req, res) {
        db.collection('ninja').find().toArray((err, ninja) => {
          if (err) return console.log(err)
          db.collection('comments').find().toArray((err, comments) => {
            if (err) return console.log(err)
            db.collection('users').find().toArray((err, users) => {
              if (err) return console.log(err)
              db.collection('battles').find().toArray((err, battles) => {
                if (err) return console.log(err)
                console.log(battles.length)
                res.render('battles.ejs', {
                  user : req.user,
                  ninja: ninja,
                  comments: comments,
                  battles: battles,
                  users: users
                })
              })
            })
          })
        })
    });
    app.get('/battle', isLoggedIn, function(req, res) {
        let array = [req.query.ninjaOne, req.query.ninjaTwo]
        array.sort()
        db.collection('ninja').find().toArray((err, ninja) => {
          if (err) return console.log(err)
          db.collection('users').find().toArray((err, users) => {
            if (err) return console.log(err)
            db.collection('battles').find({n1: array[0], n2: array[1]}).toArray((err, battles) => {
              if (err) return console.log(err)
              let battleId = ObjectId(battles[0]._id)
              db.collection('comments').find({battleId: battleId}).toArray((err, comments) => {
                if (err) return console.log(err)
                res.render('battles.ejs', {
                  user : req.user,
                  ninja: ninja,
                  comments: comments,
                  battles: battles,
                  users: users
                })
              })
            })
          })
        })
    });

  // rankings.ejs
    app.get('/rankings', isLoggedIn, function(req, res) {
    db.collection('ninja').find().toArray((err, result) => {
        if (err) return console.log(err)
        res.render('rankings.ejs', {
          user : req.user,
          ninja: result
        })
      })
    });

  // databook.ejs
    app.get('/data/:id', isLoggedIn, function(req, res) {
    let id = ObjectId(req.params.id)
    db.collection('ninja').find({_id: id}).toArray((err, ninja) => {
        if (err) return console.log(err)
        db.collection('data').find({ninjaId: id}).toArray((err, data) => {
          if (err) return console.log(err)
          res.render('databook.ejs', {
            user : req.user,
            ninja: ninja,
            data: data
          })
        })
      })
    });

    app.get('/findData', isLoggedIn, function(req, res) {
    let id = ObjectId(req.query.char)
    console.log(req.query.char)
    db.collection('ninja').find({_id: id}).toArray((err, ninja) => {
        if (err) return console.log(err)
        console.log(ninja)
        db.collection('data').find({ninjaId: id}).toArray((err, data) => {
          if (err) return console.log(err)
          res.render('databook.ejs', {
            user : req.user,
            ninja: ninja,
            data: data
          })
        })
      })
    });

    app.get('/data', isLoggedIn, function(req, res) {
    db.collection('ninja').find().toArray((err, ninja) => {
        if (err) return console.log(err)
        db.collection('data').find().toArray((err, data) => {
          if (err) return console.log(err)
          res.render('data.ejs', {
            user : req.user,
            ninja: ninja,
            data: data
          })
        })
      })
    });

  // profile.ejs
    app.get('/profile', isLoggedIn, function(req, res) {
    db.collection('ninja').find().toArray((err, ninja) => {
        if (err) return console.log(err)
        db.collection('comments').find({userId: req.user._id}).toArray((err, comments) => {
        console.log(comments, req.user._id)
          if (err) return console.log(err)
          res.render('profile.ejs', {
            user : req.user,
            ninja: ninja,
            comments: comments
          })
        })
      })
    });
    app.get('/updateTopThree', isLoggedIn, function(req, res) {
    db.collection('ninja').find().toArray((err, ninja) => {
        if (err) return console.log(err)
        db.collection('comments').find({userId: req.user._id}).toArray((err, comments) => {
          if (err) return console.log(err)
          res.render('profile.ejs', {
            user : req.user,
            ninja: ninja,
            comments: comments
          })
        })
      })
    });



// ========== POST ROUTES ==========

  // comments collection
  app.post('/comment', (req, res) => {
    let user = ObjectId(req.user._id)
    let battle = ObjectId(req.body.battle)
    let charOne
    let charTwo
      db.collection('battles').find({_id: battle}).toArray((err, battles) => {
        let bOne = battles[0].n1.split('')
        for (i=0; i< bOne.length; i++) {
          if (bOne[i] == " ") {
            bOne[i] = "+"
          }
        }
        charOne = bOne.join('')

        let bTwo = battles[0].n2.split('')
        for (i=0; i< bTwo.length; i++) {
          if (bTwo[i] == " ") {
            bTwo[i] = "+"
          }
        }
        charTwo = bTwo.join('')

        db.collection('comments').save({
        comment: req.body.comment,
        userId: user,
        battleId: battle,
        likes: 0
        }, (err, result) => {
          if (err) return console.log(err)
          console.log('saved to database')
          res.redirect(`/battle?ninjaOne=${charOne}&ninjaTwo=${charTwo}`)
        })
      })
  })

    // ninja collection
    app.post('/submitCharacter', upload.single('file-to-upload'), (req, res) => {
      db.collection('ninja').find().toArray((err, ninja) => {
        for (i=0; i<ninja.length; i++) {
          let array = [req.body.name, ninja[i].name]
          array.sort()
          db.collection('battles').save({
            n1: array[0],
            n2: array[1],
            n1votes: 0,
            n2votes: 0
          }, (err, result) => {
            if (err) return console.log(err)
            console.log('saved to database')
          })
        }
      })
      db.collection('ninja').save({
        name: req.body.name,
        img: 'images/uploads/' + req.file.filename,
        battlesWon: 0
      }, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/rankings')
      })
    })



  // data submission (images)
  app.post('/submitData', upload.single('file-to-upload'), (req, res) => {
    let ninjaId = ObjectId(req.body.ninjaId)
    db.collection('data').save({
    caption: req.body.caption,
    ninjaId: ninjaId,
    img: 'images/uploads/' + req.file.filename 
    }, (err, result) => {
      if (err) return console.log(err)
      console.log('saved to database')
      res.redirect(`/data/${req.body.ninjaId}`)
    })
  })



// ========== PUT ROUTES ==========

  // update top three characters for profile
  app.post('/updateTopThree', (req, res) => {
    console.log(req.user._id, req.body)
    let updated = [req.body.first, req.body.second, req.body.third]
    console.log(updated)
      db.collection('users')
      .findOneAndUpdate({
      _id: req.user._id
      }, {
        $set: {
          'local.topThree': updated
        }
      }, {
        sort: {_id: -1},
        upsert: false
      }, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/profile')
      })
    })

  // vote for winner of battle
  app.put('/battles', (req, res) => {
      
      db.collection('battles')
      .findOneAndUpdate({
      n1: req.body.n1, 
      n2: req.body.n2
      }, {
        $set: {
          n1votes: req.body.n1votes,
          n2votes: req.body.n2votes
        }
      }, {
        sort: {_id: -1},
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
    })

    // check/create battle object for characters
    app.put('/checkBattle', (req, res) => {
      
      db.collection('battles')
      .findOneAndUpdate({
      n1: req.body.firstChar, 
      n2: req.body.secondChar
      }, {
        $set: {
          n1: req.body.firstChar, 
          n2: req.body.secondChar
        }
      }, {
        sort: {_id: -1},
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
    })

  // update battlesWon for ninjas
  app.put('/updateWins', (req, res) => {
    let countWon = 0
    let lossesWon = 0
    let winsWon
      db.collection('battles').find().toArray((err, battles) => {
        if (err) return console.log(err)
      for (i=0; i<battles.length; i++) {
        if (battles[i].n1 == req.body.ninjaWon) {
          countWon++
          if (battles[i].n1votes <= battles[i].n2votes) {
            lossesWon++
          }
        } else if (battles[i].n2 == req.body.ninjaWon) {
          countWon++
          if (battles[i].n2votes <= battles[i].n1votes) {
            lossesWon++
          }
        }
      }
      winsWon = countWon - lossesWon
      console.log('win', winsWon, req.body.ninjaWon)
    db.collection('ninja')
      .findOneAndUpdate({
      name: req.body.ninjaWon
      }, {
        $set: {
          battlesWon: winsWon
        }
      }, {
        sort: {_id: -1},
        upsert: false
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
    })
  })

  app.put('/updateLoss', (req, res) => {
    let countLoss = 0
    let lossesLoss = 0
    let winsLoss
      db.collection('battles').find().toArray((err, battles) => {
        if (err) return console.log(err)
      for (i=0; i<battles.length; i++) {
        if (battles[i].n1 == req.body.ninjaLost) {
          countLoss++
          if (battles[i].n1votes <= battles[i].n2votes) {
            lossesLoss++
          }
        } else if (battles[i].n2 == req.body.ninjaLost) {
          countLoss++
          if (battles[i].n2votes <= battles[i].n1votes) {
            lossesLoss++
          }
        }
      }
      winsLoss = countLoss - lossesLoss
      console.log('loss', winsLoss, req.body.ninjaLost)
    db.collection('ninja')
      .findOneAndUpdate({
      name: req.body.ninjaLost
      }, {
        $set: {
          battlesWon: winsLoss
        }
      }, {
        sort: {_id: -1},
        upsert: false
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
    })
  })

  // update likes on comments
  app.put('/updateLikes', (req, res) => {
    let commentId = ObjectId(req.body.commentId)
      db.collection('comments')
      .findOneAndUpdate({
      _id: commentId
      }, {
        $set: {
          likes: req.body.likes + 1
        }
      }, {
        sort: {_id: -1},
        upsert: false
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
    })



    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/login');
}
