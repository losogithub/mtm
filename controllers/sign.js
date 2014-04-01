/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 9/22/13
 * Time: 12:20 PM
 * To change this template use File | Settings | File Templates.
 */
var check = require('validator').check,
  sanitize = require('validator').sanitize;

var encryp = require('../helper/encryp');
var helper = require('../helper/helper');
var config = require('../config');


var User = require('../proxy').User;
var LoginToken = require('../proxy').LoginToken;
var mail = require('../services/mail');


var showSignUp = function (req, res) {
  console.log("render register page");
  //console.log("login Referer: ", req.session._loginReferer);
  //2013.12.16 revise _loginReferer to loginOrSignup

  //2013.11.30 check whether is a already logged in user
  //var refer = req.session._loginReferer || '/';

  //for already logged in user
    console.log("referer: ", req.headers.referer);
  //var  refer = req.headers.referer || '/';

  if(req.session && req.session.userId){
      /*
      If it is a logged in user, jump to its refer or home.
      shall we consider a black list ?
      //todo:
       */
    // for signup, seems no need of req.query.fromUrl
    var refer = req.headers.referer || '/';
    return res.redirect(refer);
  }
  else{
    res.render('sign/signup');
  }

};


var signup = function (req, res, next) {
  console.log("----- Register -------");
  //console.log("login Referer: ", req.session._loginReferer);
  console.log("header referer: ", req.headers.referer);

  var name = sanitize(req.body.username).trim();
  name = sanitize(name).xss();
  var loginname = name;
  var pass = sanitize(req.body.password).trim();
  pass = sanitize(pass).xss();
  var email = sanitize(req.body.email).trim();
  email = email;
  email = sanitize(email).xss();

  // 1. check name
  // nFlag: name flag
  // eFlag: email flag
  // pFlag: password flag
  var nFlag = true;
  var eFlag = true;
  var pFlag = true;
  var eMsg = '';
  var nMsg = '';
  var pMsg = '';
  if (name === '') {
    nMsg = '请输入您的注册用户名。';
    nFlag = false;
  }
  //todo: chinese name support.
  else if (name.length < 2) {
    console.log('name length less than 2');
    nFlag = false;
    nMsg = '长度不能少于2.';
  }
  else {
    /*
     2014-3-20 20:30
     in order to support underscore and chinese character, update to use regex
     */
    /*
     try {
     //check(name, '用户名只能使用0-9，a-z，A-Z。').isAlphanumeric();


     } catch (e) {
     nMsg = e.message;
     nFlag = false;
     }
     */
    //韩语，日语，中文
    var nameOK = name.match(/^[\x3130-\x318F\xAC00-\xD7A3\u0800-\u4e00\u0391-\uFFE5\w]+$/);
    // var nameOK = name.match(/^[\u0391-\uFFE5\w]+$/);
    if (nameOK == null){
      nMsg = "用户名只能使用中文，英文，日文，韩文和下划线的组合";
      nFlag = false;
    }
  }


  // 2. check email
  if (email === '') {
    eMsg = '请输入您的注册邮箱。';
    eFlag = false;
  }
  else {
    try {
      check(email, '不正确的电子邮箱。').isEmail();
    } catch (e) {
      eMsg = e.message;
      eFlag = false;
    }

  }

  //3. password
  if (pass === '') {
    pMsg = '请输入您的密码。';
  }
  else if (pass.length < 6) {
    pMsg = '密码最少不能短于6位。';
  }

  if (nFlag) {
    User.getUserByLoginName(loginname, function (err, user) {
      if (err) {
        return next(err);
      }
      if (user) {
        console.log('user name has been registered!');
        nMsg = '对不起，该用户名已被注册。';
        // because of the callback function asynchronized.
        if (eFlag) {
          User.getUserByMail(email, function (err, user) {
            if (err) {
              return next(err);
            }
            if (user) {
              console.log('user email has been registered');
              eMsg = '对不起，该邮箱已被注册。';
            }

            console.log("nMsg: %s", nMsg);
            console.log("eMsg: %s", eMsg);
            console.log("pMsg: %s", pMsg);
            // finally error render error info page.
            if (eMsg || nMsg || pMsg) {
              //console.log("%s", eMsg);
              res.render('sign/signup', {
                emailMsg: eMsg,
                nameMsg: nMsg,
                passwordMsg: pMsg,
                name: name,
                email: email});
              return;
            }

            // success
            // md5 the pass
            pass = encryp.md5(pass);

            User.newAndSave(name, loginname, pass, email, false, function (err) {
              if (err) {
                return next(err);
              }
              // 发送激活邮件
              mail.sendActiveMail(email, encryp.md5(email + config.session_secret), name, email);
              //todo: what does these set means ? 2013.11.26
              res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, post-check=0, pre-check=0');
              res.set('Connection', 'close');
              res.set('Expire', '-1');
              res.set('Pragma', 'no-cache');
              res.render('sign/activeAccount', {
                emailAddress: email
              });
            });
          })
        }
        // not registered user, wrong email. i.e. eFlag=false
        else {
          res.render('sign/signup', {
            emailMsg: eMsg,
            nameMsg: nMsg,
            passwordMsg: pMsg,
            name: name,
            email: email});
          return;
        }
      }
      else {
        // cannot find the user by loginname
        // not register username, then check email
        if (eFlag) {
          User.getUserByMail(email, function (err, user) {
            if (err) {
              return next(err);
            }
            if (user) {
              console.log('user email has been registered');
              eMsg = '对不起，该邮箱已被注册。';
            }

            console.log("nMsg: %s", nMsg);
            console.log("eMsg: %s", eMsg);
            console.log("pMsg: %s", pMsg);
            // finally either registerd email address, or wrong password
            if (eMsg || pMsg) {
              //console.log("%s", eMsg);
              res.render('sign/signup', {
                emailMsg: eMsg,
                nameMsg: nMsg,
                passwordMsg: pMsg,
                name: name,
                email: email});
              return;
            }

            // success
            // md5 the pass
            pass = encryp.md5(pass);
            User.newAndSave(name, loginname, pass, email, false, function (err) {
              if (err) {
                return next(err);
              }
              // 发送激活邮件
              mail.sendActiveMail(email, encryp.md5(email + config.session_secret), name, email);
              res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, post-check=0, pre-check=0');
              res.set('Connection', 'close');
              res.set('Expire', '-1');
              res.set('Pragma', 'no-cache');
              res.render('sign/activeAccount', {
                emailAddress: email
              });
            });
          })
        }
        // correct username, wrong email.
        else {
          res.render('sign/signup', {
            emailMsg: eMsg,
            nameMsg: nMsg,
            passwordMsg: pMsg,
            name: name,
            email: email});
          return;
        }
      }
    });
  }
  else if (eFlag) {
    User.getUserByMail(email, function (err, user) {
      if (err) {
        return next(err);
      }
      if (user) {
        //console.log('has');
        eMsg = '对不起，该邮箱已被注册。';
      }

      // wrong name, maybe correct email address.
      res.render('sign/signup', {
        emailMsg: eMsg, nameMsg: nMsg, passwordMsg: pMsg, name: name, email: email});
      return;

    })
  }
  else {
    res.render('sign/signup', {
      emailMsg: eMsg, nameMsg: nMsg, passwordMsg: pMsg, name: name, email: email});
    return;
  }
};


/**
 * Show user login page.
 *
 * @param  {HttpRequest} req
 * @param  {HttpResponse} res
 */
var showLogin = function (req, res) {
  console.log("----- Show login page ----");
  //console.log("session: ", req.session);
  console.log("referer: ", req.headers.referer);

  //if it is null, then assign to this.
  //otherwise it was assigned by some middleware.
  //No, 2013.11.30 if it is not null, it must be assigned before not equal to /login. So you  cannot revise it.
  //even it equals to /singup. it is ok. later in login function will check this.
  /*
  if (!req.session._loginReferer) {
    req.session._loginReferer =  req.headers.referer || '/';
  }
  */

  //var refer = req.session._loginReferer || '/';


  //todo: 2013.11.26 it seems needed for jump
  //2013.12.16: seems no need.
  //e.g. before login: suppose you go to forgetPassword page, then  you click login.
  // after you successfully logged in, it shall not jump to forgetpassword page.
  // 2 example: suppose you are at register page, then click loggin, after succesfully loggin,
  //  shall not jump to register page.


  // suppose an already logged in user, you shall jump to home.
  if (req.session && req.session.userId && req.session.userId !== 'undefined') {
   //if logged in, jump to refer page.
   //note: not all page jump to loginReferer.
   //add: 2013.11.23: it seems impossible for this situation. So I commented it.
   // 2013.11.26. No, maybe not.
   /*for (var i = 0, len = notJump.length; i !== len; ++i) {
   if (refer.indexOf(notJump[i]) >= 0) {
   refer = '/';
   break;
   }
   } */

    console.log("already logged in user.");
    var refer = req.query.fromUrl || req.headers.referer || '/';
    return res.redirect(refer);
  }

  else {
    return res.render('sign/login');
  }
}


var notJumpForLogin = [
  '/signup',
  '/forgetPassword',
  '/login'
];


/**
 * Handle user login.
 *
 * @param {HttpRequest} req
 * @param {HttpResponse} res
 * @param {Function} next
 */
function login(req, res, next) {
  var loginname = sanitize(req.body.username).trim();
  var pass = sanitize(req.body.password).trim();
  var autoLogin = sanitize(req.body.autoLogin).trim();

  console.log("---login post-------");
  console.log("name: %s", loginname);
  console.log("pass: *********");
  console.log("autoLogin: %s", autoLogin);

  var errMsg = '';
  if (!loginname) {
    if (!pass) errMsg = '请输入您的用户名，密码。';
    else errMsg = '请输入您的用户名或则邮箱。';
  } else {
    if (!pass) errMsg = '请输入您的密码。';
  }

  if (errMsg) {
    return res.render('sign/login', {
      errMsg: errMsg, email: loginname
    });
  }

  // check loginname is a user id or an email address
  var emailIDFlag = true;
  if (!helper.validateEmail(loginname)) {
    emailIDFlag = false;
    User.getUserByLoginName(loginname, function (err, user) {
      if (err) {
        return next(err);
      }
      if (!user) {
        res.render('sign/login', {
          errMsg: '对不起，该用户名尚未注册。',
          email: loginname
        });
        return;
      }

      checkOnlyPassword(emailIDFlag, pass, autoLogin, user, req, res);

    })
  } else {
    emailIDFlag = true;
    User.getUserByMail(loginname, function (err, user) {
      if (err) {
        return next(err);
      }
      if (!user) {
        res.render('sign/login', {
          errMsg: '对不起，该邮箱尚未注册。',
          email: loginname//user.loginName
        });
        return;
      } // user if
      checkOnlyPassword(emailIDFlag, pass, autoLogin, user, req, res);
    })

  }
};


//suppose the username id, or email address exists, now check the password:
function checkOnlyPassword(emailIDFlag, pass, autoLogin, user, req, res) {
  console.log("----login: check user password.------");
  pass = encryp.md5(pass);
  var email = user.email;
  if (!emailIDFlag) {
    email = user.loginName;
  }
  if (pass !== user.password) {
    res.render('sign/login', {
      errMsg: '您输入的密码不正确。',
      email: email
    });
    return;
  }
  if (!user.active) {
    // 从新发送激活邮件
    mail.sendActiveMail(user.email, encryp.md5(user.email + config.session_secret), user.loginName, user.email);
    return res.render('sign/activeAccount', {
      emailAddress: user.email
    });
  }

  req.session.userId = user._id;
  req.currentUser = user;
  //console.log("currentUser: %s", req.currentUser);
  if (autoLogin == 'Y') {
    // Remember me
    //var loginToken = new LoginToken({ email: user.email });
    LoginToken.save(user.email, function (loginToken) {
      //console.log("logintoken: %s", loginToken.cookieValue);
      res.cookie('logintoken', loginToken.cookieValue, { expires: new Date(Date.now() + 2 * 604800000), path: '/' });
    });
  }

  /*
  login successfully !
  not jump to which page.
   */
 // console.log("req.session._loginReferr: ", req.session._loginReferer);
  console.log("header referer: ", req.headers.referer);
  //var refer = req.session._loginReferer || '/';
  var refer = req.query.fromUrl || req.headers.referer || '/';
  //console.log("loginReferer");
  //console.log(req.session._loginReferer);

  /* e.g; you want to go to create page, then first jump to login page. after you login, then jump back to previous page.
   */
  // 2013.11.26 need check the refer not equal to signup, loginin, forgetpassword
  for (var i = 0, len = notJumpForLogin.length; i !== len; ++i) {
    if (refer.indexOf(notJumpForLogin[i]) >= 0) {
      refer = '/';
      break;
    }
  }
  console.log("After login, jump to: ", refer);
  res.redirect(refer);
};


/**
 * define some page when login just jump to the home page
 * @type {Array}
 */
//notJump means not jump back
var notJump = [
  '/works',
  '/settings',
  '/account',
  '/accountModify'
];

// sign out
// need test how this function is worked. especially clearCookie, destroy, redirect
// taozan 9.22.2013
var signout = function (req, res, next) {
  if (req.session) {
    //console.log("signout: currentUser: %s" , req.currentUser);
    console.log("-----logout------");
    console.log("session userId: ", req.session.userId);
    req.session.destroy(function () {
    });
  }
  // here currentUser maybe empty
  // no problem: since it will use auth to check. at that time currentUser is assigned.
  // so not null
  //console.log("curent user;")
  //console.log(req.currentUser);
  //I see, currentUser only passed between middleware and the final call.
  if(req.cookies.logintoken){
    var cookie = JSON.parse(req.cookies.logintoken);

    console.log("cookie: ", cookie);
    //console.log(req.currentUser.series);
    if (cookie.email && cookie.series) {
      //combine email and series to make sure only only clear from on computer.
      LoginToken.remove(cookie.email, cookie.series);
    }
    res.clearCookie('logintoken');
  }
  //add: 2013.11.24
  //delete user information in res, otherwise, will be displayed.
  //note: they are stored in locals under res. not res directly.
  res.locals.username = "";
  res.locals.imageUrl = "";
  //console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$");
  //console.log(res.username);
  //console.log(res.imageUrl);

  //res.redirect('/');
  //console.log(req.headers.referer);
  //need a black list
  // logout cannot have req.query.fromUrl
  var refer = req.headers.referer || '/';
  for (var i = 0, len = notJump.length; i !== len; ++i) {
    if (refer.indexOf(notJump[i]) >= 0) {
      refer = '/';
      break;
    }
  }
  //console.log("render logout");
  //console.log(res);
  return res.render('sign/logout', {
    refer: refer
  })
};


var showForgetPassword = function (req, res) {
  console.log("------ show forget password page -----");
  res.render('sign/forgetPassword', {
    errMsg: ''
  });
};


var forgetPassword = function (req, res, next) {
  console.log("-----forget password check email ------");
  var email = sanitize(req.body.email).trim();
  console.log(email);
  email = sanitize(email).xss();

  //1. check email format
  var errMsg = '';
  if (email === '') {
    errMsg = '请输入您的注册邮箱。';
  }
  else {
    try {
      check(email, '您的电子邮箱格式不正确。').isEmail();
    } catch (e) {
      errMsg = e.message;
    }
  }

  if (errMsg) {
    res.render('sign/forgetPassword', {
      errMsg: errMsg
    });
  }

  //2. maybe need to check the existence of the email.
  User.getUserByMail(email, function (err, user) {
    if (err) {
      return next(err);
    }
    //console.log(user);
    if (!user) {
      res.render('sign/forgetPassword', {
        errMsg: '对不起，该邮箱不存在。'
      });
    }
    else {
      // 动态生成retrive_key和timestamp到users collection,之后重置密码进行验证
      var retrieveKey = encryp.randomString(15);
      user.retrieve_key = retrieveKey;
      user.retrieve_time = new Date().getTime();
      user.save(function (err) {
        if (err) {
          return next(err);
        }
        //console.log(user);
        // 发送重置密码邮件
        // But if the user hasn't been activated ? how to do ?
        // 2013.11.26 ? I don't think there is any problem.
        mail.sendResetPassMail(email, retrieveKey, user.email);
        res.render('sign/forgetPasswordSend')
      });
    }
  });
};

var showResetPassword = function (req, res, next) {
  var key = req.query.key;
  var email = req.query.email;
  User.getUserByEmail(email, key, function (err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(new Error(400));
    }
    var now = new Date().getTime();
    var oneHour = 1000 * 60 * 60;
    if (!user.retrieve_time || now - user.retrieve_time > oneHour) {
      return next(new Error(403));
    }
    //finally correct
    return res.render('sign/resetPassword', {
      key: key,
      email: email,
      errMsg: ''
    });
  });
}

function resetPassword(req, res, next) {
  var psw = req.body.newPassword || '';
  var repsw = req.body.newPasswordConfirm || '';
  var key = req.body.key || '';
  var email = req.body.email || '';

  //console.log("pass: %s", psw);
  //console.log("repass: %s", repsw);
  if (psw !== repsw) { // already include empty situation. !! no !!!
    return res.render('sign/resetPassword', {
      key: key,
      email: email,
      errMsg: '两次密码输入不一致'
    });
  }
  //if (psw === '' && repsw === '') {
  //changed to the following line. 2013.11.26 22:49
  //comment: in fact, the same.
  if (psw === '' || repsw === '') {
    return res.render('sign/resetPassword', {
      key: key,
      email: email,
      errMsg: '密码不能为空'
    });
  }
  if (psw.length < 6) {
    return res.render('sign/resetPassword', {
      key: key,
      email: email,
      errMsg: '密码不能少于6位'
    });
  }

  //todo: for password check, maybe lift to a single function for complext password checking.
  // such as cannot only be alphabeta, cannot only be number.


  User.getUserByEmail(email, key, function (err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(new Error(400));
    }
    //console.log(encryp.md5(psw));
    //bug fixed: 10.11.2013. user.pass
    //qian wan remember: first encry using md5.
    user.password = encryp.md5(psw);
    user.retrieve_key = null;
    user.retrieve_time = null;
    user.active = true; // 用户激活   //But if previously is false. now active. right ! correct.
    //2013.11.26  even previous is false, it is ok.
    user.save(function (err) {
      if (err) {
        return next(err);
      }

      return res.render('sign/resetPasswordSuccess');
    });
  });
}


var activeAccount = function (req, res, next) {
  console.log(req.query);
  var key = req.query.key;
  var email = req.query.email;

  console.log("----active account-----");
  console.log(key);
  console.log(email);

  User.getUserByMail(email, function (err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(new Error(400));
    }
    else if(user.active){

      //duplicated code
      //start
      console.log("firstly logout");
      if (req.session.userId) {
        console.log("session userId: ", req.session.userId);
        req.session.destroy(function () {
        });
      }
      if(req.cookies.logintoken){
        var cookie = JSON.parse(req.cookies.logintoken);
        console.log("cookie: ", cookie);
        if (cookie.email && cookie.series) {
          //combine email and series to make sure only only clear from on computer.
          LoginToken.remove(cookie.email, cookie.series);
        }
        res.clearCookie('logintoken');
      }
      res.locals.username = "";
      res.locals.imageUrl = "";




      //active the user and make him/her a logged in user.
      //2013.12.02
      user.active = true;
      //bug fix: change req to res. 2013.12.02 19:42
      res.locals.username = user.loginName;
      res.locals.imgUrl = user.url; //the name for image url is not good.
      //bug fix: add one more:
      //But I am wondering this session cannot be passed to next round.
      //jihao: really workds. Ok, I don't unserstand hwo session is passed.
      req.session.userId = user._id;

      user.save(function (err) {
        if (err) {
          return next(err);
        }
        res.render('sign/activeAccountSuccess')
        return;
      });
      //end
    }
    else if (encryp.md5(user.email + config.session_secret) !== key) {
      console.log("check not equal");
      return next(new Error(403));
    }

    //2013.12.02 Before active, first check whether ther is an login user and logout it.
    //copy from logout function
    console.log("firstly logout");
    if (req.session.userId) {
      console.log("session userId: ", req.session.userId);
      req.session.destroy(function () {
      });
    }
    if(req.cookies.logintoken){
      var cookie = JSON.parse(req.cookies.logintoken);
      console.log("cookie: ", cookie);
      if (cookie.email && cookie.series) {
        //combine email and series to make sure only only clear from on computer.
        LoginToken.remove(cookie.email, cookie.series);
      }
      res.clearCookie('logintoken');
    }
    res.locals.username = "";
    res.locals.imageUrl = "";



    //active the user and make him/her a logged in user.
    //2013.12.02
    user.active = true;
    //bug fix: change req to res. 2013.12.02 19:42
    res.locals.username = user.loginName;
    res.locals.imgUrl = user.url; //the name for image url is not good.
    //bug fix: add one more:
    //But I am wondering this session cannot be passed to next round.
    //jihao: really workds. Ok, I don't unserstand hwo session is passed.
    req.session.userId = user._id;

    user.save(function (err) {
      if (err) {
        return next(err);
      }
      res.render('sign/activeAccountSuccess')
      return;
    });
  });
};

// private
function gen_session(user, res) {
  //console.log("gen_session");
  // so cookie is encryped here. 2013.11.26
  var auth_token = encryp.encrypt(user._id + '\t' + user.name + '\t' + user.pass + '\t' + user.email, config.session_secret);
  //console.log(auth_token);
  res.cookie(config.auth_cookie_name, auth_token, {path: '/', maxAge: 1000 * 60 * 60}); //cookie 有效期1 hour
  //todo: this one not work
  // I don't think so. 2013.11.26  22:56
  console.log(res.cookie);
}


exports.showSignUp = showSignUp;
exports.signup = signup;
exports.showLogin = showLogin;
exports.login = login;
exports.signout = signout;
exports.showForgetPassword = showForgetPassword;
exports.forgetPassword = forgetPassword;
exports.showResetPassword = showResetPassword;
exports.resetPassword = resetPassword;
exports.activeAccount = activeAccount;