/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 10/1/13
 * Time: 11:16 PM
 * To change this template use File | Settings | File Templates.
 */

var User = require('../proxy').User;
var Topic = require('../proxy').Topic;
var config = require('../config');

var showWorks = function (req, res) {

    //console.log(req.session);
    //req.session.destroy();
    //res.clearCookie(config.auth_cookie_name, { path: '/' });
    if (!req.session.userId){
      console.log("back to home page, null userId");
        res.redirect('home');
        return;
    }
  console.log("render show works page");

    //before rendering, prepare enough information.
    // according to the user name to find out :
    // image,
    // topics

  var userId = req.session.userId;
  console.log("userId: %s", userId);
  User.getUserById(userId, function(err, user){

    var topics = user.topics;
    var topicsInfos = [];
    for (var i = 0; i < topics.length; i++){
        Topic.getTopicById(topics[i], function(err, topic){
          topic._id = "http://" + config.hostname + ":" + config.port + "/" + topic._id;
          topicsInfos.push(topic);
        });
    }

    res.render('personal/works', {
      title: config.name,
      css: '',
      js : '',
      layout: 'personalLayout',
      username: user.loginName,
      favourite: user.favourite,
      topicsCount: user.topicCount,
      topicsPageView: user.pageviewCount,
      topics: topicsInfos
    });


  });


}

var showFavourite = function(req, res){
    console.log('render show favourite page');
    console.log(req.session);
    /*
    if(!req.session.userId){
        res.redirect('home');
    }  */
    res.render('personal/favourite', {
        title: config.name,
        css: [
            '/stylesheets/personalAccountManage/MTM_mypage_newsfeed_13800104942008.css'
        ],
        js : '' ,
        layout: 'personalLayout'
    });
}

var showSettings = function(req, res){
  console.log('render settings  page');

  if(!req.session.userId){
    res.redirect('home');
    return;
  }
  var userId = req.session.userId;
  User.getUserById(userId, function(err, user){
    res.render('personal/settings', {
      title: config.name,
      css: '',
      js: '',
      layout: 'personalLayout',
      username: user.loginName,
      favourite: user.favourite,
      topicsCount: user.topicCount,
      topicsPageView: user.pageviewCount
    });
  });

}


exports.showWorks = showWorks;
exports.showFavourite = showFavourite;
exports.showSettings = showSettings;