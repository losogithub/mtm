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
  app.get('/test', function (req, res) {
    res.render('sign/resetPassword');
  });
  // home page
  app.get('/', site.index);
  app.get('/home', site.index);

  //console.log("router start");
  app.post('/loginDialogCheck', auth.loginDialog, auth.loginDialogCheck);
  app.post('/topic/favorite', auth.loginDialog, topic.AddorRemoveLikes);

  app.get('/topic/create', auth.loginRequired, topic.showCreate);
  app.get('/topic/contents', auth.userRequired, topic.getContents);
  app.get('/topic/link_detail', topic.getLinkDetail);
  app.get('/topic/video_detail', topic.getVideoDetail);
  app.get('/topic/:topicId', topic.showIndex);
  app.get('/topic/:topicId/edit', auth.loginRequired, topic.showEdit);
  app.post('/topic/create', auth.userRequired, topic.createTopic);
  app.post('/topic/item', auth.userRequired, topic.createItem);
  app.put('/topic/item', auth.userRequired, topic.editItem);
  app.put('/topic/sort', auth.userRequired, topic.sortItem);
  app.put('/topic/save', auth.userRequired, topic.saveTopic);
  app.delete('/topic/item', auth.userRequired, topic.deleteItem);
  app.delete('/topic/:topicId', auth.userRequired, topic.deleteTopic);


  // sign up, login, logout
  app.get('/signup', sign.showSignUp);
  app.post('/signup', sign.signup);
  app.get('/login', sign.showLogin);
  app.post('/login', sign.login);
  app.post('/logout', sign.signout);
  app.get('/forgetPassword', sign.showForgetPassword);
  app.post('/forgetPassword', sign.forgetPassword);
  app.get('/resetPassword', sign.showResetPassword);
  app.post('/resetPassword', sign.resetPassword);
  app.get('/activeAccount', sign.activeAccount);


  //personal management

  app.get('/works', auth.loginRequired, personal.showWorks);
  app.get('/favourites', personal.showFavourite);
  app.get('/settings', auth.loginRequired, personal.showSettings);
  app.post('/settings', personal.updateSettings); //yes, otherwise update whose info
  app.get('/account', auth.loginRequired, personal.showConfirmPassword);
  app.post('/account', personal.passwordVerify);

  //eventhough logged in, still check
  //at the same time, get username from db.
  app.get('/accountModify', auth.loginRequired, personal.showAccountModify);
  //think more later.
  app.post('/accountModify', auth.loginRequired, personal.accountModify);

  //todo
  //app.get('/notifications', personal)


  //show personal page
  app.get('/u/:authorName', personal.showPersonal);
  app.post('/u/favorite', auth.loginDialog, personal.AddorRemoveLikes);

  /*
   app.get('/active_account', sign.active_account);

   // password
   app.get('/search_pass', sign.showSearchPass);
   app.post('/search_pass', sign.updateSearchPass);
   app.get('/reset_pass', sign.reset_pass);
   app.post('/reset_pass', sign.update_pass);
   */
  app.get('*', function (req, res, next) {
    next(new Error(404));
  })
}