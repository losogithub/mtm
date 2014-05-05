/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/2/13
 * Time: 12:43 AM
 * To change this template use File | Settings | File Templates.
 */

var Common = require('./common');
var auth = require('./middlewares/auth');
var widget = require('./middlewares/widget');
var site = require('./controllers/site');
var sign = require('./controllers/sign');
var topic = require('./controllers/topic');
var item = require('./controllers/item');
var tag = require('./controllers/tag');
var user = require('./controllers/user');
var support = require('./controllers/support');
var about = require('./controllers/about');

module.exports = function (app) {
  app.get('/test', function (req, res) {
    res.render('sign/resetPassword');
  });
  // home page
  app.get('/', widget.band, site.index);
  app.get('/new', widget.band, site.showNew);
  app.get('/:category', function (req, res, next) {
    res.locals.categoryType = req.params.category;
    next();
  });
  for (var key in Common.CATEGORIES2ENG) {
    var value = Common.CATEGORIES2ENG[key];
    app.get('/' + value, widget.band, site.showCategory);
  }

  app.post('/topic/favorite', auth.userRequired, topic.favorite);

  //策展
  app.get('/topic/create', auth.loginRequired, topic.createTopic);
  app.get('/topic/:topicId', widget.band, topic.showIndex);
  app.get('/topic/:topicId/edit', auth.loginRequired, topic.showEdit);
  app.get('/topic/:topicId/chang', topic.showChang);
  app.get('/topic/:topicId/share_chang', topic.showShareChang);
  app.post('/topic/item', auth.userRequired, topic.createItem);
  app.put('/topic/item', auth.userRequired, topic.editItem);
  app.put('/topic/sort', auth.userRequired, topic.sortItem);
  app.put('/topic/cover', auth.userRequired, topic.saveCover);
  app.put('/topic/title', auth.userRequired, topic.saveTitle);
  app.put('/topic/category', auth.userRequired, topic.saveCategory);
  app.put('/topic/publish', auth.userRequired, topic.publishTopic);
  app.delete('/topic/item', auth.userRequired, topic.deleteItem);
  app.delete('/topic/:topicId', auth.userRequired, topic.deleteTopic);

  //item
  app.get('/bookmarklet', item.showBookmarklet);
  app.get('/item/detail', auth.userRequired, item.getDetail);
  app.post('/item/bookmarklet', auth.userRequired, item.createCollectionItem);//topic下面有同名方法，重构的时候注意
  app.post('/item', auth.userRequired, item.collectItem);
  app.put('/item', auth.userRequired, item.editItem);
  app.delete('/item', auth.userRequired, item.deleteItem);

  //item image uploading
  //app.get('/item/image/uptoken', auth.userRequired, item.generateUpToken);
  app.post('/item/image/postfromclient', auth.userRequired,item.ceateImageItemAndUploadToQiniu);
  //tag
  app.get('/tag/:tagText', widget.band, tag.showTag);
  app.post('/tag', auth.userRequired, topic.addTag);
  app.delete('/tag', auth.userRequired, topic.removeTag);


  app.get('/chang/:topicId', topic.sendChang);

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

  /*
   app.get('/active_account', sign.active_account);

   // password
   app.get('/search_pass', sign.showSearchPass);
   app.post('/search_pass', sign.updateSearchPass);
   app.get('/reset_pass', sign.reset_pass);
   app.post('/reset_pass', sign.update_pass);
   */

  //About
  app.get('/about', about.showAbout);
  app.get('/rules', about.showRules);
  //note  url with / ended not ok. todo
  app.get('/privacy', about.showPrivacy);
  //app.get('/privacy', about.showPrivacyCenter);
  app.get('/help', about.showHelp);
  app.get('/faq/:helpId', about.showEachHelp);

  //support
  app.get('/topicsuggestion',support.topicSuggestion);
  app.post('/addSuggestionTopic',support.addSuggestionTopic);
//  app.post('/takeSuggestionTopic/:suggId',support.takeSuggestionTopic);
  app.post('/takeSuggestionTopic',support.takeSuggestionTopic);
  app.get('/topicSuggestionLog',support.topicSuggestionLog);

  app.get('*', function (req, res, next) {
    next(new Error(404));
  });
}