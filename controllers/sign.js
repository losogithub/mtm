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
  console.log("render singup page");
  console.log(req.session._loginReferer);
  res.render('sign/signup', {
    title: config.name,
    metaHead: '',
    css: '',
    js: '',
    layout: 'signLayout'
  });
};


var signup = function (req, res, next) {
  console.log("now sign up !");
  console.log(req.session._loginReferer);
  var name = sanitize(req.body.username).trim();
  name = sanitize(name).xss();
  var loginname = name.toLowerCase();
  var pass = sanitize(req.body.password).trim();
  pass = sanitize(pass).xss();
  var email = sanitize(req.body.email).trim();
  email = email.toLowerCase();
  email = sanitize(email).xss();
  //var re_pass = sanitize(req.body.re_pass).trim();
  //re_pass = sanitize(re_pass).xss();


  // 1. check name
  var nFlag = true;
  var eFlag = true;
  var pFlag = true;
  var eMsg = '';
  var nMsg = '';
  var pMsg = '';
  if (name === '') {
    nMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">Enter your username(ID).</p>';
    nFlag = false;
  }
  else if (name.length < 5) {
    console.log('name length less than 5');
    nFlag = false;
    nMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">cannot less than 5.</p>';
  }
  else {
    try {
      check(name, '用户名只能使用0-9，a-z，A-Z。').isAlphanumeric();
    } catch (e) {
      nMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">' + e.message + '</p>';
      nFlag = false;
    }
  }


  // 2. check email
  if (email === '') {
    eMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">Enter your email address.</p>';
    eFlag = false;
  }
  else {
    try {
      check(email, '不正确的电子邮箱。').isEmail();
    } catch (e) {
      eMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">' + e.message + '</p>';
      eFlag = false;
    }

  }

  //3. password
  if (pass === '') {
    pMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">Enter your password.</p>';
    pFlag = false;
  }
  else if (pass.length < 4) {
    pMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">Password length shall more than 3.</p>';
    pFlag = false;
  }

  if (nFlag) {
    User.getUserByLoginName(loginname, function (err, user) {
      if (err) {
        return next(err);
      }
      if (user) {
        console.log('user name has been registered!');
        nMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">This username(ID) has already been registered.</p>';
        // because of the callback function asynchronized.
        if (eFlag) {
          User.getUserByMail(email, function (err, user) {
            if (err) {
              return next(err);
            }
            if (user) {
              console.log('user email has been registered');
              eMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">The email address you have entered has already been registered.</p>';
            }

            console.log("nMsg: %s", nMsg);
            console.log("eMsg: %s", eMsg);
            console.log("pMsg: %s", pMsg);
            // finally error render error info page.
            if (eMsg || nMsg || pMsg) {
              console.log("%s", eMsg);
              res.render('sign/registerAccount', {
                title: config.name,
                metaHead: '',
                css: '',
                js: '',
                layout: 'signLayout',
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
              res.render('sign/success_signup', {
                title: config.name,
                emailAddress: email,
                metaHead: '<meta http-equiv="pragma" content="no-cache" /><meta http-equiv="cache-control" content="no-cache" /><meta http-equiv="expires" content="-1" />',
                css: '',
                js: '',
                layout: 'signLayout'
              });
            });
          })
        }
        // not registered user, wrong email.
        else {
          res.render('sign/registerAccount', {
            title: config.name,
            metaHead: '',
            css: '',
            js: '',
            layout: 'signLayout',
            emailMsg: eMsg,
            nameMsg: nMsg,
            passwordMsg: pMsg,
            name: name,
            email: email});
          return;
        }
      }
      else {
        // not registerd username, then check email
        if (eFlag) {
          User.getUserByMail(email, function (err, user) {
            if (err) {
              return next(err);
            }
            if (user) {
              console.log('user email has been registered');
              eMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">The email address you have entered has already been registered.</p>';
            }

            console.log("nMsg: %s", nMsg);
            console.log("eMsg: %s", eMsg);
            console.log("pMsg: %s", pMsg);
            // finally either registerd email address, or wrong password
            if (eMsg || pMsg) {
              console.log("%s", eMsg);
              res.render('sign/registerAccount', {
                title: config.name,
                metaHead: '',
                css: '',
                js: '',
                layout: 'signLayout',
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
              res.render('sign/success_signup', {
                title: config.name,
                emailAddress: email,
                metaHead: '<meta http-equiv="pragma" content="no-cache" /><meta http-equiv="cache-control" content="no-cache" /><meta http-equiv="expires" content="-1" />',
                css: '',
                js: '',
                layout: 'signLayout'
              });
            });
          })
        }
        // correct user, wrong email.
        else {
          res.render('sign/registerAccount', {
            title: config.name,
            metaHead: '',
            css: '',
            js: '',
            layout: 'signLayout',
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
        console.log('user email has been registered');
        eMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">The email address you have entered has already been registered.</p>';
      }

      // wrong name, maybe correct email address.
      res.render('sign/registerAccount', {
        title: config.name,
        metaHead: '',
        css: '',
        js: '',
        layout: 'signLayout',
        emailMsg: eMsg, nameMsg: nMsg, passwordMsg: pMsg, name: name, email: email});
      return;

    })
  }
  else {
    res.render('sign/registerAccount', {
      title: config.name,
      metaHead: '',
      css: '',
      js: '',
      layout: 'signLayout',
      emailMsg: eMsg, nameMsg: nMsg, passwordMsg: pMsg, name: name, email: email});
    return;
  }
};


/**
 * define some page when login just jump to the home page
 * @type {Array}
 */
//notJump means not jump back
//todo: need check
var notJump = [
  '/activeAccount', //active page
  '/resetPassword',     //reset password page, avoid to reset twice
  '/signup',         //register page
  '/forgetPassword'    //forgetpassword
];

/**
 * Show user login page.
 *
 * @param  {HttpRequest} req
 * @param  {HttpResponse} res
 */
var showLogin = function (req, res) {
  console.log("show login session: ");
  console.log(req.session);
  console.log(req.headers.referer);

  //if it is null, then assign to this.
  //otherwise it was assigned by some middleware.
  if (!req.session._loginReferer) {
    req.session._loginReferer = req.headers.referer || 'home';
  }
  console.log(req.session._loginReferer);

  var refer = req.session._loginReferer;
  if (req.session && req.session.userId && req.session.userId !== 'undefined') {
    //if logged in, jump to refer page.
    //note: not all page jump to loginReferer.
    for (var i = 0, len = notJump.length; i !== len; ++i) {
      if (refer.indexOf(notJump[i]) >= 0) {
        refer = 'home';
        break;
      }
    }

    return res.redirect(refer);
  }
  else {
    return res.render('sign/login', {
      title: config.name,
      metaHead: '',
      css: '',
      js: '',
      errMsg: '', email: '', password: '',
      layout: 'signLayout'
    });
  }
};


/**
 * Handle user login.
 *
 * @param {HttpRequest} req
 * @param {HttpResponse} res
 * @param {Function} next
 */
var login = function (req, res, next) {
  var loginname = sanitize(req.body.email).trim().toLowerCase();
  var pass = sanitize(req.body.password).trim();
  var autoLogin = sanitize(req.body.autoLogin).trim();

  console.log("name: %s", loginname);
  console.log("pass: %s", pass);
  console.log("autoLogin: %s", autoLogin);

  var errMsg = '';
  if (!loginname) {
    if (!pass) errMsg = '<p class="MdMsgError01">Enter your email and password.</p>';
    else errMsg = '<p class="MdMsgError01">Enter your email address or username(ID).</p>';
  } else {
    if (!pass) errMsg = '<p class="MdMsgError01">Enter your password.</p>';
  }

  if (errMsg) {
    return res.render('sign/login', {
      title: config.name,
      metaHead: '',
      css: '',
      js: '',
      errMsg: errMsg, email: loginname, password: pass,
      layout: 'signLayout'
    });
  }

  // check loginname is a user id or an email address
  var emailIDFlag = true;
  if (! helper.validateEmail(loginname)) {
    emailIDFlag = false;
    User.getUserByLoginName(loginname, function (err, user) {
      if (err) {
        return next(err);
      }
      if (!user) {
        res.render('sign/login', {
          title: config.name,
          metaHead: '',
          css: '',
          js: '',
          errMsg: '<p class="MdMsgError01">The username does not exist.</p>',
          email: loginname, password: pass,
          layout: 'signLayout'
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
          title: config.name,
          metaHead: '',
          css: '',
          js: '',
          errMsg: '<p class="MdMsgError01">The email address does not exist.</p>',
          email: user.loginName,
          password: pass,
          layout: 'signLayout'
        });
        return;
      } // user if
      checkOnlyPassword(emailIDFlag, pass, autoLogin, user, req, res);
    })

  }
};


//suppose the username id, or email address exists, now check the password:
function checkOnlyPassword(emailIDFlag , pass, autoLogin, user, req, res) {
  console.log("function: checkonly password");
  pass = encryp.md5(pass);
  var email = user.email;
  if(!emailIDFlag){
      email = user.username;
  }
  if (pass !== user.password) {
    res.render('sign/login', {
      title: config.name,
      metaHead: '',
      css: '',
      js: '',
      errMsg: '<p class="MdMsgError01">wrong password.</p>',
      email: email,
      password: '',       // let password be empty
      layout: 'signLayout'
    });
    return;
  }
  if (!user.active) {
    // 从新发送激活邮件
    mail.sendActiveMail(user.email, encryp.md5(user.email + config.session_secret), user.name, user.email);
    return res.render('sign/activeAccount', {
      title: config.name,
      metaHead: '',
      css: '',
      js: '',
      email: email,
      //password: '',       // let password be empty
      layout: 'signLayout'
    });
  }

  req.session.userId = user._id;
  req.currentUser = user;
  console.log("currentUser: %s", req.currentUser);
  if (autoLogin == 'Y') {
    // Remember me
    //var loginToken = new LoginToken({ email: user.email });
    LoginToken.save(user.email, function (loginToken) {
      console.log("logintoken: %s", loginToken.cookieValue);
      res.cookie('logintoken', loginToken.cookieValue, { expires: new Date(Date.now() + 2 * 604800000), path: '/' });
    });
  }

  var refer = req.session._loginReferer || 'home';
  console.log("loginReferer");
  console.log(req.session._loginReferer);

  /* e.g; you want to go to create page, then first jump to login page. after you login, then jump back to previous page.
   */
  res.redirect(refer);
}


// sign out
// need test how this function is worked. especially clearCookie, destroy, redirect
// taozan 9.22.2013
var signout = function (req, res, next) {
  if (req.session) {
    //console.log("signout: currentUser: %s" , req.currentUser);
    console.log("logout: session userId: %s", req.session.userId);
    req.session.destroy(function () {
    });
  }
  // here currentUser maybe empty
  // no problem: since it will use auth to check. at that time currentUser is assigned.
  // so not null
  //console.log("curent user;")
  //console.log(req.currentUser);
  //I see, currentUser only passed between middleware and the final call.
  if (req.currentUser) {
    //combine email and series to make sure only only clear from on computer.
    LoginToken.remove(req.currentUser.email, req.currentUser.series);
  }
  res.clearCookie('logintoken');
  //res.redirect('/home');
  console.log(req.headers.referer);
  var refer = req.headers.referer || 'home';
  return res.render('sign/logoutMessage', {
    title: config.name,
    metaHead: '',
    css: '',
    js: '',
    layout: 'signLayout',
    refer : refer
  })
};


var showForgetPassword = function (req, res) {
  res.render('sign/forgetPassword', {
    title: config.name,
    metaHead: '',
    css: '',
    js: '',
    errMsg: '',
    layout: 'signLayout'
  });
};


var forgetPassword = function (req, res, next) {
  var email = sanitize(req.body.email).trim().toLowerCase();
  console.log(email);
  email = sanitize(email).xss();

  //1. check email format
  var errMsg = '';
  if (email === '') {
    errMsg = 'Enter your email address.';
  }
  else {
    try {
      check(email, '不正确的电子邮箱。').isEmail();
    } catch (e) {
      errMsg = e.message;
    }
  }

  if (errMsg) {
    res.render('sign/forgetPassword', {
      title: config.name,
      metaHead: '',
      css: '',
      js: '',
      errMsg: errMsg,
      layout: 'signLayout'
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
        title: config.name,
        metaHead: '',
        css: '',
        js: '',
        errMsg: 'the email address does not exist.',
        layout: 'signLayout'
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
        console.log(user);
        // 发送重置密码邮件
        // But if the user hasn't been activated ? how to do ?
        mail.sendResetPassMail(email, retrieveKey, user.email);
        res.render('sign/forgetPassSuccessSend', {
          title: config.name,
          metaHead: '',
          css: '',
          js: '',
          layout: 'signLayout'
        })
      });
    }
  });
};

var showResetPassword = function (req, res, next) {
  var key = req.query.key;
  var email = req.query.email;
  User.getUserByEmail(email, key, function (err, user) {
    if (!user) {
      return res.render('sign/errLink',
        {
          title: config.name,
          metaHead: '',
          css: '',
          js: '',
          layout: 'signLayout'
        });
    }
    var now = new Date().getTime();
    var oneDay = 1000 * 60 * 60 * 24;
    if (!user.retrieve_time || now - user.retrieve_time > oneDay) {
      return res.render('sign/errLink',
        {
          title: config.name,
          metaHead: '',
          css: '',
          js: '',
          layout: 'signLayout'
        });
    }
    //finally correct
    return res.render('sign/resetPassword', {
      title: config.name,
      metaHead: '',
      css: '',
      js: '',
      layout: 'signLayout',
      key: key,
      email: email,
      errMsg: ''
    });
  });
}

var resetPassword = function (req, res, next) {
  var psw = req.body.newPassword || '';
  var repsw = req.body.newPasswordConfirm || '';
  var key = req.body.key || '';
  var email = req.body.email || '';

  console.log("pass: %s", psw);
  console.log("repass: %s", repsw);
  if (psw !== repsw) { // already include empty situation. !! no !!!
    return res.render('sign/resetPassword', {
      title: config.name,
      metaHead: '',
      css: '',
      js: '',
      layout: 'signLayout',
      key: key,
      email: email,
      errMsg: '两次密码输入不一致'
    });
  }
  if (psw === '' && repsw === '') {
    return res.render('sign/resetPassword', {
      title: config.name,
      metaHead: '',
      css: '',
      js: '',
      layout: 'signLayout',
      key: key,
      email: email,
      errMsg: '密码不能为空'
    });
  }
  if (psw.length < 6) {
    return res.render('sign/resetPassword', {
      title: config.name,
      metaHead: '',
      css: '',
      js: '',
      layout: 'signLayout',
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
      return res.render('sign/errLink',
        {
          title: config.name,
          metaHead: '',
          css: '',
          js: '',
          layout: 'signLayout'
        });
    }
    console.log(encryp.md5(psw));
    //bug fixed: 10.11.2013. user.pass
    user.password = encryp.md5(psw);
    user.retrieve_key = null;
    user.retrieve_time = null;
    user.active = true; // 用户激活   //But if previously is false. now active. right ! correct.
    user.save(function (err) {
      if (err) {
        return next(err);
      }

      return res.render('sign/resetPasswordSuccess', {
        title: config.name,
        metaHead: '',
        css: '',
        js: '',
        layout: 'signLayout'
      });
    });
  });
}


var activeAccount = function (req, res, next) {
  var key = req.query.key;
  var email = req.query.email;

  User.getUserByMail(email, function (err, user) {
    if (err) {
      return next(err);
    }
    if (!user || encryp.md5(user.email + config.session_secret) !== key || user.active) {
      return res.render('sign/resetPasswordSuccess', {
        title: config.name,
        metaHead: '',
        css: '',
        js: '',
        layout: 'signLayout'
      });
    }

    user.active = true;
    user.save(function (err) {
      if (err) {
        return next(err);
      }
      res.render('sign/activeAccountSuccess', {
        title: config.name,
        metaHead: '',
        css: '',
        js: '',
        layout: 'signLayout'
      })
    });
  });
};

// private
function gen_session(user, res) {
  console.log("gen_session");
  var auth_token = encryp.encrypt(user._id + '\t' + user.name + '\t' + user.pass + '\t' + user.email, config.session_secret);
  //console.log(auth_token);
  res.cookie(config.auth_cookie_name, auth_token, {path: '/', maxAge: 1000 * 60 * 60}); //cookie 有效期1 hour
  //todo: this one not work
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