/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 10/5/13
 * Time: 8:51 PM
 * To change this template use File | Settings | File Templates.
 */
/**
 * 需要管理员权限
 */

var User = require('../proxy').User;
var LoginToken = require('../proxy').LoginToken;

var check = require('validator').check,
  sanitize = require('validator').sanitize;
var encryp = require('../helper/encryp');
var helper = require('../helper/helper');

var fs = require('fs');
var path = require('path');
/* if logged in, jump to fromUrl page.
 toto: it seems: just use next. we don't need fromUrl.
 which was stored at _loginReferer.
 */
var loginRequired = function (req, res, next) {
  console.log("LoginRequired");
  console.log("loginReferer: %s", req.session._loginReferer);
  //if not login, then redirect to login page.
  if ((!req.session) || (!req.session.userId) || (req.session.userId == 'undefined')) {
    return res.redirect('/login?fromUrl=' + req.url);
  } else {
    next();
  }
}


/*
 after loadUser:
 if logged in: req.session.userId will bu user id
  otherwise: will be null.
  at same time, req.currentUser is assigned user for next middleware or function.
 */
var loadUser = function (req, res, next) {
  console.log("loadUser");
  console.log("from Url: %s", req.query.fromUrl);
  console.log("before the logineReferer: %s", req.session._loginReferer);
  // the first priority is req.query.fromUrl, then referer, finally home
  //note: some req.headers.referer cannot be rendered !!!
  //e.g. if it is login, you shall not jump back to login page.
  req.session._loginReferer = req.query.fromUrl || req.headers.referer || 'home';
  console.log("loginReferer: %s", req.session._loginReferer);

  if (req.session && req.session.userId) {
    // session stores the userId information. means after login
    //console.log("loadUser userId: %s", req.session.userId);
    User.getUserById(req.session.userId, function (err, user) {
      if (err) {
        return next(err);
      }
      if (user) {
        req.currentUser = user; //check whether currentUser is the same with this Id.
        res.locals.username = user.loginName; // used in html template to judefy and display uername
        //added 10.11 2013
        res.locals.imageUrl = user.url;
        next();
      } else {
        //check fail: not login. user cookie contain session id, but not correct.
        //in this case, no corresponding user in the db.
        // if it is showlogin, jump to login.
        console.err("wrong uerId");
        req.session.userId = null;
        next();
      }
    });
  } else if (req.cookies.logintoken && req.cookies.logintoken !== 'undefined') {
    //persistent login
    //console.log("loadUser: auto login, check cookies.logintoken");
    authenticateFromLoginToken(req, res, next);
  }
  else {
    //not login
    //: there is a situation that if user's cookie was stolen and the cookie was cleared by the theft.
    //tdo: I think normally theft have no rights to clear user's cookie.
    // the theft still can login. this is a problem.
    //but here shall not reset password.
    req.session.userId = null;
    next();//just call next, in the next function, will check the userId property of req.session
  }
}


var authenticateFromLoginToken = function (req, res, next) {
  console.log("loginToken: ", req.cookies.logintoken);
  var cookie = JSON.parse(req.cookies.logintoken);
  LoginToken.findByEmailAndSeries(cookie.email, cookie.series, function(err, token){
    if(err){
      console.log("err happen in finding LoginToken by email && series");
      req.session.userId = null;
      //clear the persistent info.
      LoginToken.remove(cookie.email, cookie.series);
      return next(); //require login.
    }
    else if(!token){
      console.log("cannot find in LoginToken by email && series");
      req.session.userId = null;
      //clear the persistent info.
      LoginToken.remove(cookie.email, cookie.series);
      return next(); //require login.
    }
    else {
      //here security shall be better. check cookie.email and cookie.series if exist then check cookie.token.
      //so if found by email and series. still can return not found by email, series and token.

      LoginToken.find(cookie.email, cookie.series, cookie.token,
        function (err, token) {
          if (err) {
            console.log("err in  finding LoginToken by email && series && token.");
            //1. clear persisten cookie.
            LoginToken.remove(cookie.email, cookie.series);
            req.session.userId = null;
            //2. redirect to reset password
            //ask user to reset password from email.
            return res.redirect('/forgetPassword');
            //return next();
          }
          else if (!token){
            console.log("cannot find in LoginToken.");
            console.log("cookie maybe stolen.")
            //1. clear persisten cookie.
            LoginToken.remove(cookie.email, cookie.series);
            req.session.userId = null;
            //2. redirect to reset password
            //ask user to reset password from email.
            //todo: a new page to inform user his cookie maybe stolen.
            return res.redirect('/forgetPassword');
          } else
          //find in LoginToken db.
          {
            User.getUserByMail(token.email, function (err, user) {
              if(err){
                console.log("cannot find user by email in User db.");
                LoginToken.remove(cookie.email, cookie.series);
                req.session.userId = null;
                return next();
              }
            if (user) {
              req.session.userId = user._id;
              req.currentUser = user; //what does this used for ?? get it, passed to the next middleware.

              //used in html template to judgfy and display user name.
              res.locals.username = user.loginName;
              //added 10.11 2013
              res.locals.imageUrl = user.url;
              //update the token
              token.token = LoginToken.randomToken();
              token.save(function () {
                //console.log("token.save function in authenticateFromLoginToken");
                res.cookie('logintoken', token.cookieValue, { expires: new Date(Date.now() + 2 * 604800000), path: '/' }); //todo 7 hours ? or 20 years
                next();
                //if showlogin, redirect to home
              });
            } else {
              //cannot find user
              console.log("cannot find user in User db! err")
              LoginToken.remove(cookie.email, cookie.series);
              req.session.userId = null;
              next();
            }
          });
          }
        });
    }
  })

}


var loginDialog = function(req, res, next){
  console.log("loginDialog");
  console.log("loginReferer: %s", req.session._loginReferer);




  //if not login, then redirect to login page.
  if ((!req.session) || (!req.session.userId) || (req.session.userId == 'undefined')) {
    console.log("Show LoginDialog");
    //send loginDialog html back via ajax

    console.log(__dirname);
    var filename =  __dirname + '/../views/loginDialog.html';
    console.log(filename);
    fs.exists(filename, function(fileok){
      if(!fileok){
        console.log("cannot read file.");
        return;
      }
      else {
        fs.readFile(filename, "utf-8", function(err, file) {
          if(err) {
            console.log(err);
            // write an error response or nothing here
            return;
          }
          //console.log("show file detail");
          //console.log(file);
          var data = {loginDialog: true, loginHtml: file};
          res.header('Access-Control-Allow-Credentials', 'true')
          res.send(data);
        });
      }
    });

  }
  //if has already logged in, jump to next action.
  else {
    next();
  }
}

var loginDialogCheck = function(req, res, next){
  console.log("login dialog check");
  //console.log(req.body);
  //console.log("logineReferer: %s", req.session._loginReferer); //http://localhost:3000/u/benben
  //console.log("body url: %s", req.body.url);

  req.body.url = req.session._loginReferer;


  //now login the user.
  //if not correct, post back
  //else next()
  var loginName = sanitize(req.body.userName).trim().toLowerCase();
  var pass = sanitize(req.body.password).trim();
  var rememberMe = sanitize(req.body.rememberMe).trim();


  //todo1: name can be either name or password
  //todo2: password need encry
  if(helper.validateEmail(loginName)){
    console.log("email address");
    User.getUserByEmailPass(loginName, encryp.md5(pass), function(err, user){
      if(err){ console.log("find err: %s", err); return;}
      else if(!user){
        console.log("cannot find user by email&pass: %s, %s", loginName, pass);
        var data = { correct: false}
        res.header('Access-Control-Allow-Credentials', 'true')
        return res.send(data);
      }
      else {
        //found user by email and password
        req.session.userId = user._id;
        if(rememberMe){
          //persistent cookie
          //var loginToken = new LoginToken({ email: user.email });
          LoginToken.save(user.email, function (loginToken) {
            console.log("logintoken: %s", loginToken.cookieValue);
            res.cookie('logintoken', loginToken.cookieValue, { expires: new Date(Date.now() + 2 * 604800000), path: '/' });
          });
        }

        //then next
        next();
      }
    })
  }

 else {
    //not email, so username
    User.getUserByNamePass(loginName, encryp.md5(pass) , function(err, user){
      if(err){
        console.log("find err: %s", err);
        return
      }
      else if(!user){
        console.log("cannot find user by name&pass: %s, %s", loginName, pass);
        var data = { correct: false}
        res.header('Access-Control-Allow-Credentials', 'true')
        return res.send(data);
      }
      else {
        //found user by name and password
        req.session.userId = user._id;
        if(rememberMe){
          //persistent cookie
          //var loginToken = new LoginToken({ email: user.email });
          LoginToken.save(user.email, function (loginToken) {
            console.log("logintoken: %s", loginToken.cookieValue);
            res.cookie('logintoken', loginToken.cookieValue, { expires: new Date(Date.now() + 2 * 604800000), path: '/' });
          });
        }

        //then next
        next();
      }
    })
  }



}

exports.loginRequired = loginRequired;
exports.loadUser = loadUser;
exports.loginDialog = loginDialog;
exports.loginDialogCheck = loginDialogCheck;
