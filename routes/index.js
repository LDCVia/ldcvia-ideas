var express = require('express');
var router = express.Router();
var auth = require('../controllers/authorization');
var restler = require('restler');

/* GET home page. */
router.get('/', auth.requiresLogin,  function(req, res, next) {
  try{
    restler.get(
      process.env.LDCVIA_IDEAS_APIHOST + "/collections/ldcvia-ideas/ideas",
      {headers:
        {'apikey': req.cookies.apikey}
      }
    )
    .on('complete', function(data, response){
      res.render('index', {"tab":"home", "email": req.cookies.email, "ideas": data});
    });
  }catch(e){
    res.render("login", {"error": e});
  }
});

router.get('/about', function(req, res, next) {
  try{
    restler.get(
      process.env.LDCVIA_IDEAS_APIHOST + "/document/ldcvia-ideas/staticpages/about",
      {headers:
        {'apikey': process.env.LDCVIA_IDEAS_ADMINAPIKEY}
      }
    )
    .on('complete', function(data, response){
      res.render('static', {"tab":"about", "page": data});
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
      res.render('static', {"tab":"contact", "page": data});
    });
  }catch(e){
    res.render("login", {"error": e});
  }
});

/* GET login page */
router.get('/login',  function(req, res, next) {
  res.render('login', {"tab": "home"});
});

router.post('/login', function(req, res, next){
  try{
    restler.postJson(
      process.env.LDCVIA_IDEAS_APIHOST + '/login',
      {'username': req.body.email, 'password': req.body.password}
    ).on('complete', function (data, response){
      if (data.apikey){
        res.cookie('apikey', data.apikey);
        res.cookie('email', data.email);
        res.redirect("/");
      }else{
        res.render("login", {"error": data.error});
      };
    });
  }catch(e){
    res.render("/login");
  }
})

router.get('/logout', auth.requiresLogin, function(req, res, next){
  res.clearCookie('apikey');
  res.clearCookie('email');
  res.redirect('/');
})

module.exports = router;
