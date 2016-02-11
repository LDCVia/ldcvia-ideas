var express = require('express');
var router = express.Router();
var auth = require('../controllers/authorization');
var restler = require('restler');
var cookie = require('cookie');
var _ = require("underscore");

function getCookies(req){
  var cookies = _.map(req.cookies, function(val, key) {
    if(key == "connect.sid"){
      return key + "=" + val['connect.sid'];
    }
  }).join("; ");
  return cookies;
}

/* GET home page. */
router.get('/', auth.requiresLogin,  function(req, res, next) {
  try{
    restler.get(
      process.env.LDCVIA_IDEAS_APIHOST + "/collections/ldcvia-ideas/ideas",
      {headers:
        {'cookie': getCookies(req)}
      }
    )
    .on('complete', function(data, response){
      if(response.statusCode == 200){
        res.render('index', {"tab":"home", "email": req.cookies.email, "ideas": data, "title": "LDC Via Ideas"});
      }else{
        res.render("login", {"error": data});
      }
    });
  }catch(e){
    res.render("login", {"error": e});
  }
});

router.get('/newidea', auth.requiresLogin, function(req, res, next){
  res.render("idea-new", {"tab": "newidea", "email": req.cookies.email, "title": "New Idea | LDC Via Ideas"});
})

router.post('/newidea', auth.requiresLogin, function(req, res, next){
  var data = {};
  data.body = req.body.body;
  data.title = req.body.title;
  data.priority = req.body.priority;
  data.status = req.body.status;
  data.createdby = req.cookies.email;
  data.datecreated = new Date();
  data.__form = "ideas";
  data.votes = 0;
  var unid = data.datecreated.getTime();
  data.__unid = unid;
  restler.putJson(
    process.env.LDCVIA_IDEAS_APIHOST + "/document/ldcvia-ideas/ideas/" + unid,
    data,
    {headers:
      {'cookie': getCookies(req)}
    }
  )
  .on('complete', function(data, response){
    res.redirect("/");
  })
})

router.get('/idea/:unid', auth.requiresLogin, function(req, res, next){
  try{
    restler.get(
      process.env.LDCVIA_IDEAS_APIHOST + "/document/ldcvia-ideas/ideas/" + req.params.unid + "?all",
      {headers:
        {'cookie': getCookies(req)}
      }
    )
    .on('complete', function(data, response){
      res.render('idea-read', {"tab":"idea", "email": req.cookies.email, "idea": data, "title": data.title + " | LDC Via Ideas"});
    });
  }catch(e){
    res.render("login", {"error": e});
  }
})

router.get('/editidea/:unid', auth.requiresLogin, function(req, res, next){
  try{
    restler.get(
      process.env.LDCVIA_IDEAS_APIHOST + "/document/ldcvia-ideas/ideas/" + req.params.unid + "?all",
      {headers:
        {'cookie': getCookies(req)}
      }
    )
    .on('complete', function(data, response){
      data.priorities = ["High", "Medium", "Low"];
      data.statuses = ["New","In Progress","Rejected","Complete"];
      if (data.__iseditable){
        res.render('idea-edit', {"tab":"idea", "email": req.cookies.email, "idea": data, "title": data.title + " | LDC Via Ideas"});
      }else{
        res.render('idea-read', {"tab":"idea", "email": req.cookies.email, "idea": data, "title": data.title + " | LDC Via Ideas"});
      }
    });
  }catch(e){
    res.render("login", {"error": e});
  }
})

router.post('/editidea/:unid', auth.requiresLogin, function(req, res, next){
  var data = {};
  data.body = req.body.body;
  data.title = req.body.title;
  data.priority = req.body.priority;
  data.status = req.body.status;
  restler.postJson(
    process.env.LDCVIA_IDEAS_APIHOST + "/document/ldcvia-ideas/ideas/" + req.params.unid,
    data,
    {headers:
      {'cookie': getCookies(req)}
    }
  )
  .on('complete', function(data, response){
    res.redirect("/idea/" + req.params.unid);
  })
})

router.get('/upvote/:unid', auth.requiresLogin, function(req, res, next){
  castVote(req, res, 1, function(votes, votecast, err){
    if (err){
      res.status(200).send({"votes": votes, "votecast": votecast, "error": err});
    }else{
      res.status(200).send({"votes": votes, "votecast": votecast});
    }
  })
})

router.get('/downvote/:unid', auth.requiresLogin, function(req, res, next){
  castVote(req, res, -1, function(votes, votecast, err){
    if (err){
      res.status(200).send({"votes": votes, "votecast": votecast, "error": err});
    }else{
      res.status(200).send({"votes": votes, "votecast": votecast});
    }
  })
})

function castVote(req, res, score, callback){
  var email = req.cookies.email;
  var data = {"filters": [
    {
      "operator": "equals",
      "field": "__parentid",
      "value": req.params.unid
    },
    {
      "operator": "equals",
      "field": "createdby",
      "value": email
    }
  ]};
  restler.postJson(
    process.env.LDCVIA_IDEAS_APIHOST + "/search/ldcvia-ideas/votes?join=and",
    data,
    {headers:
      {'cookie': getCookies(req)}
    }
  ).on('complete', function(data, response){
    console.log("Got " + data.count + " votes");
    if (data.count == 0){
      //Insert a new vote
      var vote = {};
      var date = new Date();
      var unid = date.getTime();
      vote.__unid = unid;
      vote.createdby = email;
      vote.vote = score;
      vote.__parentid = req.params.unid;
      vote.__form = "vote";

      restler.putJson(
        process.env.LDCVIA_IDEAS_APIHOST + "/document/ldcvia-ideas/votes/" + unid,
        vote,
        {headers:
          {'cookie': getCookies(req)}
        }
      ).on('complete', function(data, response){
        //Update the idea with the score
        restler.get(
          process.env.LDCVIA_IDEAS_APIHOST + "/document/ldcvia-ideas/ideas/" + req.params.unid,
          {headers:
            {'cookie': getCookies(req)}
          }
        ).on('complete', function(data, response){
          if (!data.votes){
            data.votes = 0;
          }
          var newscore = data.votes + score;
          restler.postJson(
            process.env.LDCVIA_IDEAS_APIHOST + "/document/ldcvia-ideas/ideas/" + req.params.unid,
            {"votes": newscore},
            {headers:
              {'cookie': getCookies(req)}
            }
          ).on('complete', function(data, response){
            callback(newscore, true);
          })
        })
      })
    }else{
      //The user has already cast a vote so return current score
      restler.get(
        process.env.LDCVIA_IDEAS_APIHOST + "/document/ldcvia-ideas/ideas/" + req.params.unid,
        {headers:
          {'cookie': getCookies(req)}
        }
      ).on('complete', function(data, response){
        if(data.votes){
          callback(data.votes, false, "Vote already cast");
        }else{
          callback(0, false, "Vote already cast");
        }
      })
    }
  })
}

router.get("/deleteidea/:unid", auth.requiresLogin, function(req, res, next){
  try{
    restler.del(
      process.env.LDCVIA_IDEAS_APIHOST + "/document/ldcvia-ideas/ideas/" + req.params.unid,
      {headers:
        {'cookie': getCookies(req)}
      }
    )
    .on('complete', function(data, response){
      res.redirect("/");
    });
  }catch(e){
    res.render("login", {"error": e});
  }
})

router.get('/about', function(req, res, next) {
  try{
    restler.get(
      process.env.LDCVIA_IDEAS_APIHOST + "/document/ldcvia-ideas/staticpages/about",
      {headers:
        {'apikey': process.env.LDCVIA_IDEAS_ADMINAPIKEY}
      }
    )
    .on('complete', function(data, response){
      res.render('static', {"tab":"about", "email": req.cookies.email, "page": data, "title": "About | LDC Via Ideas"});
    });
  }catch(e){
    res.render("login", {"error": e});
  }
});

router.get('/contact', function(req, res, next) {
  try{
    restler.get(
      process.env.LDCVIA_IDEAS_APIHOST + "/document/ldcvia-ideas/staticpages/contact",
      {headers:
        {'apikey': process.env.LDCVIA_IDEAS_ADMINAPIKEY}
      }
    )
    .on('complete', function(data, response){
      res.render('static', {"tab":"contact", "email": req.cookies.email, "page": data, "title": "Contact | LDC Via Ideas"});
    });
  }catch(e){
    res.render("login", {"error": e});
  }
});

/* GET login page */
router.get('/login',  function(req, res, next) {
  res.render('login', {"tab": "home", "title": "Login | LDC Via Ideas"});
});

router.post('/login', function(req, res, next){
  try{
    restler.postJson(
      "https://eu.ldcvia.com/login",
      {'username': req.body.email, 'email': req.body.email, 'password': req.body.password}
    ).on('complete', function (data, response){
      // display returned cookies in header
      var setcookie = response.headers["set-cookie"];
      var cookieobj = {};
      for (var i=0; i<setcookie.length; i++){
        if (setcookie[i].indexOf("connect.sid=") > -1){
          cookieobj = cookie.parse(setcookie[i]);
        }
      }
      if (cookieobj['connect.sid'] && data.success){
        res.cookie('connect.sid', cookieobj);
        res.cookie('email', req.body.email);
        res.redirect("/");
      }else{
        res.render("login", {"error": data.errors[0]});
      };
    });
  }catch(e){
    res.render("/login");
  }
})

router.get('/logout', auth.requiresLogin, function(req, res, next){
  res.clearCookie('connect.sid');
  res.clearCookie('email');
  res.redirect('/');
})

module.exports = router;
