/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/2/13
 * Time: 12:43 AM
 * To change this template use File | Settings | File Templates.
 */
var site = require('./controllers/site');
var topic = require('./controllers/topic');
var sign = require('./controllers/sign');
var personal = require('./controllers/personal');
var auth = require('./middlewares/auth');


module.exports = function (app) {
  app.get('*', auth.loadUser);
  // home page
  app.get('/', site.index);
  app.get('/home', site.index);

  //console.log("router start");
  app.post('/topic/favorite', auth.loadUser, auth.loginDialog, topic.AddorRemoveLikes);
  app.post('/topic/loginDialogCheck', auth.loginDialogCheck, topic.AddorRemoveLikes);

  app.get('/topic/create', auth.loadUser, auth.loginRequired , topic.create);
  app.get('/topic/id', topic.getId);
  app.get('/topic/contents', topic.getContents);
  app.get('/topic/video_title', topic.getVideoTitle);
  app.get('/topic/:topicId', auth.loadUser, topic.index);
  app.get('/topic/:topicId/edit', auth.loadUser, topic.edit);
  app.post('/topic/item', topic.createItem);
  app.put('/topic/item', topic.editItem);
  app.put('/topic/sort', topic.sort);
  app.put('/topic/save', auth.loadUser, topic.save);
  app.delete('/topic/item', topic.deleteItem);



  // sign up, login, logout
  app.get('/signup', sign.showSignUp);
  app.get('/registerAccount', sign.signup);
  app.post('/signup', sign.signup);
  app.post('/registerAccount', sign.signup);
  app.get('/login', auth.loadUser, sign.showLogin);
  app.post('/login', sign.login);
  app.get('/logout', auth.loadUser, sign.signout);
  app.get('/forgetPassword', sign.showForgetPassword);
  app.post('/forgetPassword', sign.forgetPassword);
  app.get('/resetPassword', sign.showResetPassword);
  app.post('/resetPassword', sign.resetPassword);
  app.get('/activeAccount', sign.activeAccount);


  //personal management

  app.get('/works', auth.loadUser, auth.loginRequired, personal.showWorks);
  app.get('/favourites', auth.loadUser, personal.showFavourite);
  app.get('/settings', auth.loadUser, auth.loginRequired, personal.showSettings);
  app.post('/settings', auth.loadUser, personal.updateSettings); //yes, otherwise update whose info
  app.get('/account', auth.loadUser, auth.loginRequired, personal.showConfirmPassword);
  app.post('/account', personal.passwordVerify);

  //eventhough logged in, still check
  //at the same time, get username from db.
  app.get('/accountModify',auth.loadUser, auth.loginRequired , personal.showAccountModify);
  //think more later.
  app.post('/accountModify', auth.loadUser, auth.loginRequired, personal.accountModify);

  //todo
  //app.get('/notifications', personal)


  //show personal page
  app.get('/u/:authorName', auth.loadUser, personal.showPersonal);
  app.post('/u', auth.loadUser, auth.loginDialog, personal.AddorRemoveLikes);

  app.post('/loginDialogCheck', auth.loginDialogCheck, personal.AddorRemoveLikes);

  /*
   app.get('/active_account', sign.active_account);

   // password
   app.get('/search_pass', sign.showSearchPass);
   app.post('/search_pass', sign.updateSearchPass);
   app.get('/reset_pass', sign.reset_pass);
   app.post('/reset_pass', sign.update_pass);
   */
}