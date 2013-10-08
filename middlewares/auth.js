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


var loginRequired = function (req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
    //todo:  show a login frame.
  }
  next();
};

/*
loadUser fail will always leads to home page
 */
var loadUser = function (req, res, next) {
  console.log("loadUser");
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
        next();
      } else {
        //check fail: not login
        next();//just call next, in the next function, will check the userId property of req.session
      }
    });
  } else if (req.cookies.logintoken && req.cookies.logintoken !== 'undefined') {
    //persistent login
    //console.log("loadUser: auto login, check cookies.logintoken");
    authenticateFromLoginToken(req, res, next);
  }
  else {
    //not login
    next();//just call next, in the next function, will check the userId property of req.session
  }
}


var authenticateFromLoginToken = function (req, res, next) {
  console.log("loginToken: ", req.cookies.logintoken);

  var cookie = JSON.parse(req.cookies.logintoken);

  //todo: here security shall be better. check cookie.email and cookie.series if exist then check cookie.token.
  LoginToken.find(cookie.email, cookie.series, cookie.token,
    function (err, token) {
      if (err) {
        console.log("cannot find in LoginToken");
        //not login
        next();
      }
      User.getUserByMail(token.email, function (err, user) {
        if (user) {
          req.session.userId = user._id;
          req.currentUser = user; //what does this used for ?? todo

          //used in html template to judgfy and display user name.
          res.locals.username = user.loginName;
          //update the token
          token.token = LoginToken.randomToken();
          token.save(function () {
            //console.log("token.save function in authenticateFromLoginToken");
            res.cookie('logintoken', token.cookieValue, { expires: new Date(Date.now() + 2 * 604800000), path: '/' }); //todo 7 hours ? or 20 years
            next();
          });
        } else {
          next();
        }
      });
    });
}


/*
If user has been logged in or has persistent cookie, then jump to home page.
otherwise require login.
 */
var loadLogin = function (req, res, next) {
  console.log("loadLogin");
  if (req.session.userId) {
  // session stores the userId information. means after login
    console.log("loadLogin userId: %s", req.session.userId);
    User.getUserById(req.session.userId, function (err, user) {
      if (err) {
        return next(err);
      }
      if (user) {
        req.currentUser = user; //check whether currentUser is the same with this Id.
        //logged in
        res.locals.username = user.loginName;
        res.redirect('/home');
      } else {
        //not login
        next(); //revised: go to login page
      }
    });
  } else if (req.cookies.logintoken && req.cookies.logintoken !== 'undefined') {
    //console.log("loadUser: auto login, check cookies.logintoken");
    loginAuthenticateFromLoginToken(req, res, next);
  }
  else {
    //require login
    next();
  }
}

var loginAuthenticateFromLoginToken = function (req, res, next) {
  var cookie = JSON.parse(req.cookies.logintoken);
  console.log("logintoken");
  console.log(req.cookies.logintoken);
  //console.log("connect.sid");
  //console.log(req.cookies['connect.sid']);

  //todo here need revise to check theft.
  LoginToken.find(cookie.email, cookie.series, cookie.token,
    function (err, token) {
      if (err) {
        console.log("cannot find in LoginToken");
        next(); //require login
      }
      User.getUserByMail(token.email, function (err, user) {
        if (user) {
          req.session.userId = user._id;
          req.currentUser = user;

          res.locals.username = user.loginName;
          token.token = LoginToken.randomToken(); //update the random token
          token.save(function () {
            console.log("token.save function in authenticateFromLoginToken");
            res.cookie('logintoken', token.cookieValue, { expires: new Date(Date.now() + 2 * 604800000), path: '/' }); //cookie still has expire time ?
            res.redirect('/home');
          });
        } else {
          next(); //require login
        }
      });
    });
}


// deprecated
var userInfo = function (req, res, next) {
  if (!req.session || !req.session.userId) {
    return next();
  }
  User.getUserById(req.session.userId, function (err, user) {
    if (user) {
      res.locals.username = user.loginName;
    }
    return next();
  });
};

exports.loginRequired = loginRequired;
exports.loadUser = loadUser;
exports.loadLogin = loadLogin;
exports.userInfo = userInfo;
