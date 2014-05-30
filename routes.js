/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/2/13
 * Time: 12:43 AM
 * To change this template use File | Settings | File Templates.
 */

var auth = require('./middlewares/auth');
var site = require('./controllers/site');
var sign = require('./controllers/sign');
var topic = require('./controllers/topic');
var topic2 = require('./controllers/topic2');
var item = require('./controllers/item');
var comment = require('./controllers/comment');
var user = require('./controllers/user');
var about = require('./controllers/about');
var manage = require('./controllers/manage');

module.exports = function (app) {
  app.get('/test', site.showIndex);
  // home page
  app.get('/', site.showIndex);
  app.get('/tool', site.showTool);

  //策展
  app.get('/topic/:topicId', topic.showIndex);

  app.get('/t/:topicText', topic2.showIndex);

  app.post('/comment/like', comment.likeComment);
  app.post('/comment2', comment.createComment);

  //item
  app.get('/item/detail', auth.userRequired, item.getDetail);
  app.post('/item', auth.userRequired, item.createItem);
  app.put('/item', auth.userRequired, item.editItem);
  app.delete('/item', auth.userRequired, item.deleteItem);

  app.get('/bookmarklet', item.showBookmarklet);
  app.get('/bookmarklet/topics', topic2.getHintTopics);

  // sign up, login, logout
  app.get('/signup', sign.showSignUp);
  app.post('/signup', sign.signup);
  app.get('/login', sign.showLogin);
  app.post('/login', sign.login);
  app.post('/login_dialog', sign.loginDialog);
  app.post('/logout', sign.signout);
  app.get('/forgetPassword', sign.showForgetPassword);
  app.post('/forgetPassword', sign.forgetPassword);
  app.get('/resetPassword', sign.showResetPassword);
  app.post('/resetPassword', sign.resetPassword);
  app.get('/activeAccount', sign.activeAccount);

  //user management
  app.get('/users', user.showUsers);
  app.get('/works', auth.loginRequired, user.showWorks);
  app.get('/settings', auth.loginRequired, user.showSettings);
  app.post('/settings', auth.userRequired, user.updateSettings); //yes, otherwise update whose info
  app.get('/account', auth.loginRequired, user.showConfirmPassword);
  app.post('/account', auth.userRequired, user.passwordVerify);

  //eventhough logged in, still check
  //at the same time, get username from db.
  app.get('/accountModify', auth.loginRequired, user.showAccountModify);
  //think more later.
  app.post('/accountModify', auth.loginRequired, user.accountModify);
  //todo
  //app.get('/notifications', user)
  //show user page
  app.get('/u/:authorName', user.showPersonal);
  app.post('/u/favorite', auth.userRequired, user.favorite);

  //group email sending
  app.get('/manage/groupemail', manage.showGroupEmail);
  app.post('/manage/groupemail', manage.sendGroupMail);

  //About
  app.get('/about', about.showAbout);
  app.get('/rules', about.showRules);
  //note  url with / ended not ok. todo
  app.get('/privacy', about.showPrivacy);
  //app.get('/privacy', about.showPrivacyCenter);
  app.get('/help', about.showHelp);
  app.get('/faq/:helpId', about.showEachHelp);

  app.get('*', function (req, res, next) {
    next(new Error(404));
  });
}