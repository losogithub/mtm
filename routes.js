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
  // home page
  app.get('/', auth.loadUser, site.index);
  app.get('/home', auth.loadUser, site.index);

  //console.log("router start");

  app.get('/topic/create', auth.loadUser, auth.loginRequired , topic.create);
  app.get('/topic/getid', topic.getId);
  app.get('/topic/getcontents', topic.getContents);
  app.get('/topic/:topicId', auth.loadUser, topic.index);
  app.get('/topic/:topicId/edit', auth.loadUser, topic.edit);
  app.post('/topic/createitem', topic.createItem);
  app.put('/topic/edititem', topic.editItem);
  app.put('/topic/sort', topic.sort);
  app.put('/topic/publish', auth.loadUser, topic.publish);
  app.delete('/topic/deleteitem', topic.deleteItem);


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
  //app.get('/u/:id', auth.loadUser, personal.showPersonal);
  app.get('/works', auth.loadUser, auth.loginRequired, personal.showWorks);
  app.get('/favourites', auth.loadUser, personal.showFavourite);
  app.get('/settings', auth.loadUser, auth.loginRequired, personal.showSettings);
  app.post('/settings', auth.loadUser, personal.updateSettings); //yes, otherwise update whose info

  //todo
  //app.get('/notifications', personal)




  /*
   app.get('/active_account', sign.active_account);

   // password
   app.get('/search_pass', sign.showSearchPass);
   app.post('/search_pass', sign.updateSearchPass);
   app.get('/reset_pass', sign.reset_pass);
   app.post('/reset_pass', sign.update_pass);
   */
}