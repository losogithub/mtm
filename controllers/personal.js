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

var showWorks = function (req, res, next) {

  //console.log(req.session);

  //before rendering, prepare enough information.
  // according to the user name to find out :
  // image,
  // topics

  //var userId = req.session.userId;
  //console.log("userId: %s", userId);
  res.locals.path = req.path.replace(/\/$/, '');

  if (req.session && req.session.userId && req.session.userId !== 'undefined') {
    console.log("render show works page");
    User.getUserById(req.session.userId, function (err, user) {
      if (err) {
        return next(err)
      }
      req.currentUser = user;
      var topics = user.topics;
      var topicsInfos = [];
      getTopics(topics.length, topics, topicsInfos, user, res);
    });
  }  else{
    return res.redirect('/home');
  }
  /*else if (req.currentUser){
    //console.log(req.cookies.logintoken);
    var topics = req.currentUser.topics;
    var topicsInfos = [];
    getTopics(0, null, topicsInfos, {}, res);
  } */
}
// a function for recursively retrieve the topic information,
// finally render them.
var getTopics = function (i, topics, topicsInfos, user, res, next) {
  if (i < topics.length) {

    Topic.getTopicById(topics[i], function (err, topic) {
      if (err) {
        console.log("no topic ?");
        next(err);
      }
      //console.log("topic");
      //console.log(topic);
      //console.log("topic id: %s", topic._id);
      topic.topicUrl = "/topic/" + topic._id;
      topic.create_date = topic.create_at.getFullYear() + '年'
        + (topic.create_at.getMonth() + 1) + '月'
        + topic.create_at.getDate() + '日';
      topicsInfos.push(topic);
      getTopics(++i, topics, topicsInfos, user, res);
    });
  } else {
    res.render('personal/index', {
      title: config.name,
      css: '',
      js: '',
      pageType: 'PERSONAL',
      personalType: 'WORKS',
      username: user.loginName,
      favourite: user.favourite,
      topicsCount: user.topicCount,
      topicsPageView: user.pageviewCount,
      topics: topicsInfos
    });
  }
}


var showFavourite = function (req, res) {
  res.locals.path = req.path.replace(/\/$/, '');
  if(req.session && req.session.userId && req.session.userId !== 'undefined'){
    console.log('render show favourite page');
    res.render('personal/favourite', {
      title: config.name,
      css: [
        '/stylesheets/personal.css'
      ],
      js: '',
      pageType: 'PERSONAL'
    });
  } else {
    return res.redirect('/home');
  }

}

var showSettings = function (req, res) {
  if(req.session && req.session.userId && req.session.userId !== 'undefined'){
    console.log('render settings  page');
    var userId = req.session.userId;
    User.getUserById(userId, function (err, user) {
      res.render('personal/index', {
        title: config.name,
        css: [
          '/stylesheets/personal.css'
        ],
        js: '',
        pageType: 'PERSONAL',
        personalType: 'SETTINGS',
        username: user.loginName,
        favourite: user.favourite,
        topicsCount: user.topicCount,
        topicsPageView: user.pageviewCount
      });
    });
  } else {
    return res.redirect('/home');
  }
}


exports.showWorks = showWorks;
exports.showFavourite = showFavourite;
exports.showSettings = showSettings;