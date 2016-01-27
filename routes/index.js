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
      res.render('index', {"tab":"home", "email": req.cookies.email, "ideas": data, "title": "LDC Via Ideas"});
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
  var unid = data.datecreated.getTime();
  data.__unid = unid;
  restler.putJson(
    process.env.LDCVIA_IDEAS_APIHOST + "/document/ldcvia-ideas/ideas/" + unid,
    data,
    {headers:
      {'apikey': req.cookies.apikey}
    }
  )
  .on('complete', function(data, response){
    res.redirect("/");
  })
})

router.get('/idea/:unid', auth.requiresLogin, function(req, res, next){
  try{
    restler.get(
      process.env.LDCVIA_IDEAS_APIHOST + "/document/ldcvia-ideas/ideas/" + req.params.unid,
      {headers:
        {'apikey': req.cookies.apikey}
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
      process.env.LDCVIA_IDEAS_APIHOST + "/document/ldcvia-ideas/ideas/" + req.params.unid,
      {headers:
        {'apikey': req.cookies.apikey}
      }
    )
    .on('complete', function(data, response){
      data.priorities = ["High", "Medium", "Low"];
      data.statuses = ["New","In Progress","Rejected","Complete"];
      res.render('idea-edit', {"tab":"idea", "email": req.cookies.email, "idea": data, "title": data.title + " | LDC Via Ideas"});
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
      {'apikey': req.cookies.apikey}
    }
  )
  .on('complete', function(data, response){
    res.redirect("/idea/" + req.params.unid);
  })
})

router.get("/deleteidea/:unid", auth.requiresLogin, function(req, res, next){
  try{
    restler.del(
      process.env.LDCVIA_IDEAS_APIHOST + "/document/ldcvia-ideas/ideas/" + req.params.unid,
      {headers:
        {'apikey': req.cookies.apikey}
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
