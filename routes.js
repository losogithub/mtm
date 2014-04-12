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
var tag = require('./controllers/tag');
var personal = require('./controllers/personal');
var support = require('./controllers/support');

var about = require('./controllers/about');

module.exports = function (app) {
  app.get('/test', function (req, res) {
    res.render('sign/resetPassword');
  });
  // home page
  app.get('/', site.index);
  app.get('/hot', site.showHot);
  app.get('/classic', site.showClassic);
  app.get('/new', site.showNew);
  app.get('/entertainment', site.showEntertainment);
  app.get('/tech', site.showTech);
  app.get('/news', site.showNews);
  app.get('/fashion', site.showFashion);
  app.get('/life', site.showLife);
  app.get('/humor', site.showHumor);
  app.get('/culture', site.showCulture);
  app.get('/business', site.showBusiness);
  app.get('/sport', site.showSport);
  app.get('/unclassified', site.showUnclassified);

  //console.log("router start");
  app.post('/login_dialog', auth.loginDialogCheck);
  app.post('/topic/favorite', auth.userRequired, topic.favorite);

  //策展
  app.get('/topic/create', auth.loginRequired, topic.createTopic);
  app.get('/topic/link_detail', topic.getLinkDetail);
  app.get('/topic/video_detail', topic.getVideoDetail);
  app.get('/topic/weibo_detail', topic.getWeiboDetail);
  app.get('/topic/:topicId', topic.showIndex);
  app.get('/topic/:topicId/edit', auth.loginRequired, topic.showEdit);
  app.get('/topic/:topicId/chang', topic.showChang);
  app.get('/topic/:topicId/share_chang', topic.showShareChang);
  app.post('/topic/item', auth.userRequired, topic.createItem);
  app.put('/topic/item', auth.userRequired, topic.editItem);
  app.put('/topic/sort', auth.userRequired, topic.sortItem);
  app.put('/topic/save', auth.userRequired, topic.saveTopic);
  app.put('/topic/category', auth.userRequired, topic.saveCategory);
  app.put('/topic/publish', auth.userRequired, topic.publishTopic);
  app.delete('/topic/item', auth.userRequired, topic.deleteItem);
  app.delete('/topic/:topicId', auth.userRequired, topic.deleteTopic);

  app.put('/tag', auth.userRequired, topic.addTag);
  app.post('/tag', auth.userRequired, topic.removeTag);//因为angular的delete不支持附加data。。。
  app.get('/tag/:tagText', tag.showTag);


  app.get('/chang/:topicId', topic.sendChang);

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
  app.get('/settings', auth.loginRequired, personal.showSettings);
  app.post('/settings', auth.userRequired, personal.updateSettings); //yes, otherwise update whose info
  app.get('/account', auth.loginRequired, personal.showConfirmPassword);
  app.post('/account', auth.userRequired, personal.passwordVerify);

  //eventhough logged in, still check
  //at the same time, get username from db.
  app.get('/accountModify', auth.loginRequired, personal.showAccountModify);
  //think more later.
  app.post('/accountModify', auth.loginRequired, personal.accountModify);

  //todo
  //app.get('/notifications', personal)

  //show personal page
  app.get('/u/:authorName', personal.showPersonal);
  app.post('/u/favorite', auth.userRequired, personal.favorite);

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
  })
}