/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 10/9/13
 * Time: 10:38 AM
 * To change this template use File | Settings | File Templates.
 */

/* if logged in, jump to fromUrl page.
   toto: it seems: just use next. we don't need fromUrl.
  which was stored at _loginReferer.
   */
var jumpToLogin = function(req, res, next){
  console.log("jumpToLogin");
  console.log(req.session._loginReferer);
  if((!req.session) || (!req.session.userId) || (req.session.userId == 'undefined')){
    //req.session._loginReferer = req.headers.referer ;
    res.redirect('/login?fromUrl=' + req.url);
  }else
  {
    next();
  }
}

var loginTo = function(req, res, next){
  console.log("jump from show login to: ");
  console.log(req.session._loginReferer);
  if((!req.session) || (!req.session.userId) || (req.session.userId == 'undefined')){
    next()
  }
  else{
    res.redirect(req.session._loginReferer);
  }
}
exports.jumpToLogin = jumpToLogin;
exports.loginTo = loginTo