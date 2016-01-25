var express = require('express');
var router = express.Router();
var auth = require('../controllers/authorization');
var restler = require('restler');

/* GET home page. */
router.get('/', auth.requiresLogin,  function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET login page */
router.get('/login',  function(req, res, next) {
  res.render('login');
});

router.post('/login', function(req, res, next){
  try{
    restler.postJson(
      'https://eu.ldcvia.com/1.0/login',
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
    console.log(e);
    res.render("/login");
  }
})

router.get('/logout', auth.requiresLogin, function(req, res, next){
  res.clearCookie('apikey');
  res.clearCookie('email');
  res.redirect('/');
})

module.exports = router;
