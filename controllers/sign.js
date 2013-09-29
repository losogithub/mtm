/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 9/22/13
 * Time: 12:20 PM
 * To change this template use File | Settings | File Templates.
 */
var check = require('validator').check,
    sanitize = require('validator').sanitize;

var crypto = require('crypto');
var config = require('../config');


var User = require('../proxy').User;
var mail = require('../services/mail');

var showSignUp = function (req, res) {
    console.log("render singup page");
    res.render('sign/signup', {
        title: config.name,
        metaHead: '',
        css: '',
        js : '' ,
        layout: 'signLayout'
    });
};


var signup = function (req, res, next) {
    console.log("now sign up !");
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
    if(name === ''){ nMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">Enter your username(ID).</p>'; nFlag = false;}
    else if (name.length < 5) {
        console.log('name length less than 5');
        nFlag = false;
        nMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">cannot less than 5.</p>' ;}
    else {
        try {
            check(name, '用户名只能使用0-9，a-z，A-Z。').isAlphanumeric();
        } catch (e) {
            nMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">' + e.message + '</p>';
            nFlag = false;
        }
    }


    // 2. check email
    if(email === ''){eMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">Enter your email address.</p>'; eFlag = false; }
    else {
        try {
            check(email, '不正确的电子邮箱。').isEmail();
        } catch (e) {
            eMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">' +  e.message + '</p>';
            eFlag = false;
        }

    }

    //3. password
    if(pass === '') {pMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">Enter your password.</p>'; pFlag = false; }
    else if (pass.length < 4) {pMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">Password length shall more than 3.</p>'; pFlag = false; }

    if (nFlag){
        User.getUserByName(loginname, function(err, user){
            if(err){
                return next(err);
            }
            if(user){
                console.log('user name has been registered!');
                nMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">This username(ID) has already been registered.</p>';
                // because of the callback function asynchronized.
                if(eFlag){
                    User.getUserByMail(email, function(err, user){
                        if(err){
                            return next(err);
                        }
                        if(user){
                            console.log('user email has been registered');
                            eMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">The email address you have entered has already been registered.</p>';
                        }

                        console.log("nMsg: %s", nMsg);
                        console.log("eMsg: %s", eMsg);
                        console.log("pMsg: %s", pMsg);
                        // finally error render error info page.
                        if( eMsg || nMsg || pMsg){
                            console.log("%s", eMsg);
                            res.render('sign/registerAccount', {
                                title: config.name,
                                metaHead: '',
                                css: '',
                                js : '' ,
                                layout: 'signLayout',
                                emailMsg : eMsg,
                                nameMsg : nMsg,
                                passwordMsg : pMsg,
                                name: name,
                                email: email});
                            return;
                        }

                        // success
                        // md5 the pass
                        pass = md5(pass);

                        User.newAndSave(name, loginname, pass, email, true, function (err) { //gaitrue
                            if (err) {
                                return next(err);
                            }
                            // 发送激活邮件
                            mail.sendActiveMail(email, md5(email + config.session_secret), name, email);
                            res.render('sign/success_signup', {
                                title: config.name,
                                emailAddress: email,
                                metaHead: '<meta http-equiv="pragma" content="no-cache" /><meta http-equiv="cache-control" content="no-cache" /><meta http-equiv="expires" content="-1" />',
                                css: '',
                                js: '',
                                layout:'signLayout'
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
                        js : '' ,
                        layout: 'signLayout',
                        emailMsg : eMsg,
                        nameMsg : nMsg,
                        passwordMsg : pMsg,
                        name: name,
                        email: email});
                    return;
                }
            }
            else {
                // not registerd username, then check email
                if(eFlag){
                    User.getUserByMail(email, function(err, user){
                        if(err){
                            return next(err);
                        }
                        if(user){
                            console.log('user email has been registered');
                            eMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">The email address you have entered has already been registered.</p>';
                        }

                        console.log("nMsg: %s", nMsg);
                        console.log("eMsg: %s", eMsg);
                        console.log("pMsg: %s", pMsg);
                        // finally either registerd email address, or wrong password
                        if( eMsg || pMsg){
                            console.log("%s", eMsg);
                            res.render('sign/registerAccount', {
                                title: config.name,
                                metaHead: '',
                                css: '',
                                js : '' ,
                                layout: 'signLayout',
                                emailMsg : eMsg,
                                nameMsg : nMsg,
                                passwordMsg : pMsg,
                                name: name,
                                email: email});
                            return;
                        }

                        // success
                        // md5 the pass
                        pass = md5(pass);
                        User.newAndSave(name, loginname, pass, email, true, function (err) { // gaitrue
                            if (err) {
                                return next(err);
                            }
                            // 发送激活邮件
                            mail.sendActiveMail(email, md5(email + config.session_secret), name, email);
                            res.render('sign/success_signup', {
                                title: config.name,
                                emailAddress: email,
                                metaHead: '<meta http-equiv="pragma" content="no-cache" /><meta http-equiv="cache-control" content="no-cache" /><meta http-equiv="expires" content="-1" />',
                                css: '',
                                js: '',
                                layout:'signLayout'
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
                        js : '' ,
                        layout: 'signLayout',
                        emailMsg : eMsg,
                        nameMsg : nMsg,
                        passwordMsg : pMsg,
                        name: name,
                        email: email});
                    return;
                }
            }
        });
    }
    else if(eFlag){
        User.getUserByMail(email, function(err, user){
            if(err){
                return next(err);
            }
            if(user){
                console.log('user email has been registered');
                eMsg = '<p htmlfor="_email" generated="true" class="MdMsgError01">The email address you have entered has already been registered.</p>';
            }

            // wrong name, maybe correct email address.
            res.render('sign/registerAccount', {
                title: config.name,
                metaHead: '',
                css: '',
                js : '' ,
                layout: 'signLayout',
                emailMsg : eMsg, nameMsg : nMsg, passwordMsg : pMsg, name: name, email: email});
            return;

        })
    }
    else {
        res.render('sign/registerAccount', {
            title: config.name,
            metaHead: '',
            css: '',
            js : '' ,
            layout: 'signLayout',
            emailMsg : eMsg, nameMsg : nMsg, passwordMsg : pMsg, name: name, email: email});
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
    console.log(req.session);
    //console.log(req.headers.referrer);
    req.session._loginReferer = req.headers.referer ;  //add this later todo: taozan 9.27
    res.render('sign/login', {
        title: config.name,
        metaHead: '',
        css: '',
        js: '',
        errMsg: '', email: '', password: '',
        layout: 'signLayout'
    });
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

    console.log("name: %s, %d", loginname, loginname.length);
    console.log("pass: %s", pass);
    var errMsg = '';
    if(!loginname ){
        if(!pass) errMsg = '<p class="MdMsgError01">Enter your email and password.</p>';
        else errMsg = '<p class="MdMsgError01">Enter your email address or username(ID).</p>';
    }else {
        if(!pass) errMsg = '<p class="MdMsgError01">Enter your password.</p>';
    }

    if (errMsg){
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
    if (loginname.indexOf('@') == -1) {
        emailIDFlag = true;
        User.getUserByLoginName(loginname, function(err, user){
            if(err)
            {return next(err);}
            if(!user){
                res.render('sign/login',{
                    title: config.name,
                    metaHead: '',
                    css: '',
                    js: '',
                    errMsg: '<p class="MdMsgError01">The username address does not exist.</p>',
                    email: loginname, password: pass,
                    layout: 'signLayout'
                });
                return;
            }

            checkOnlyPassword(pass, user, res);

        })
    } else
    {
        emailIDFlag = false;
        User.getUserByMail(loginname, function(err, user){
            if(err){
                return next(err);
            }
            if (!user){
                res.render('sign/login',{
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
            checkOnlyPassword(pass, user, res);
        })

    }
};


//suppose the username id, or email address exists, now check the password:
function checkOnlyPassword(pass, user, res){
    //this code will duplicate. bad.
    pass = md5(pass);
    if (pass !== user.password){
        res.render('sign/login',{
            title: config.name,
            metaHead: '',
            css: '',
            js: '',
            errMsg: '<p class="MdMsgError01">wrong password.</p>',
            email: user.loginName,
            password: '',       // let password be empty
            layout: 'signLayout'
        });
        return;
    }
    if (!user.active) {
        // 从新发送激活邮件
        mail.sendActiveMail(user.email, md5(user.email + config.session_secret), user.name, user.email);
        return res.render('sign/activeAccount', {
            title: config.name,
            metaHead: '',
            css: '',
            js: '',
            //errMsg: '<p class="MdMsgError01">此帐号还没有被激活，激活链接已发送到 ' + user.email + ' 邮箱，请查收。</p>',
            email: user.loginName,
            //password: '',       // let password be empty
            layout: 'signLayout'
            });
    }
    // store session cookie
    //gen_session(user, res);
    //check at some page just jump to home page
    /*
    var refer = req.session._loginReferer || 'home';     // taozan 9.22.2013
    for (var i = 0, len = notJump.length; i !== len; ++i) {
        if (refer.indexOf(notJump[i]) >= 0) {
            refer = 'home';
            break;
        }
    }

    res.redirect(refer);
    */
    res.redirect('home');
}





// sign out
// need test how this function is worked. especially clearCookie, destroy, redirect
// taozan 9.22.2013
var signout = function (req, res, next) {
    req.session.destroy();
    res.clearCookie(config.auth_cookie_name, { path: '/' });
    res.redirect(req.headers.referer || 'home');
};





// private
function gen_session(user, res) {
    var auth_token = encrypt(user._id + '\t' + user.name + '\t' + user.pass + '\t' + user.email, config.session_secret);
    res.cookie(config.auth_cookie_name, auth_token, {path: '/', maxAge: 1000 * 60 * 60 * 24 * 30}); //cookie 有效期30天
}

function encrypt(str, secret) {
    var cipher = crypto.createCipher('aes192', secret);
    var enc = cipher.update(str, 'utf8', 'hex');
    enc += cipher.final('hex');
    return enc;
}

function decrypt(str, secret) {
    var decipher = crypto.createDecipher('aes192', secret);
    var dec = decipher.update(str, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
}

function md5(str) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(str);
    str = md5sum.digest('hex');
    return str;
}

function randomString(size) {
    size = size || 6;
    var code_string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var max_num = code_string.length + 1;
    var new_pass = '';
    while (size > 0) {
        new_pass += code_string.charAt(Math.floor(Math.random() * max_num));
        size--;
    }
    return new_pass;
}

exports.showSignUp = showSignUp;
exports.signup = signup;
exports.showLogin = showLogin;
exports.login = login;
exports.signout = signout;