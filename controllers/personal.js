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
  console.log("sort strategy: ")
  console.log(req.query.mt);
  console.log(req.query.mo);

  res.locals.path = req.path.replace(/\/$/, '');

  console.log("render show works page");
  User.getUserById(req.session.userId, function (err, user) {
    if (err) {
      return next(err)
    }
    if(!user){
      //if cannot find user by userId. the userId must be wrong.
      //usually this shall not happen. If user have already login.
      console.err("cannot find user by userId");
      req.session.userId = null;
      return res.render('/login');
    }

    var topics = user.topics;
    //var topicsInfos = [];
    var mt = req.query.mt || 'p';
    var mo = req.query.mo || 'd';

    //empty topics
    if(!topics){
      return renderWorks(user, [], '', '', '', res);
    }
    //use this function to get all the details of topics.
    getAndSortTopics(mt, mo, topics, function(err, topicDetails){
      if(err){
        console.log("err");
        return;
      }else{
        //use a for to add some attributes
        if(!topicDetails){
          console.log("err, cannot get topic details, but have topic ids");
          //???? shall return or not
          return;
        }

        for (var i =0; i < topicDetails.length; i++){
          topicDetails[i].topicUrl= "/topic/" + topicDetails[i]._id;
          topicDetails[i].create_date = topicDetails[i].create_at.getFullYear() + '年'
            + (topicDetails[i].create_at.getMonth() + 1) + '月'
            + topicDetails[i].create_at.getDate() + '日';
        }

        //render according to different attributes.
        if(mt == 'c'){
         if(mo == 'd'){
           return renderWorks(user, topicDetails, 'SELECTED', '', '', '', 'a', 'd', 'd', 'd' ,res);
         } else {
           return renderWorks(user, topicDetails, 'SELECTED', '', '', '', 'd', 'd', 'd', 'd' ,res);
         }
        }
        if(mt == 'u'){
          if(mo == 'd'){
            return renderWorks(user, topicDetails, '', 'SELECTED', '', '', 'd', 'a', 'd', 'd' ,res);
          }else {
            return renderWorks(user, topicDetails, '', 'SELECTED', '', '', 'd', 'd', 'd', 'd' ,res);
          }
        }
        if(mt =='p'){
          if(mo == 'd'){
            return renderWorks(user, topicDetails, '', '', 'SELECTED', '', 'd', 'd', 'a', 'd' ,res);
          } else {
            return renderWorks(user, topicDetails, '', '', 'SELECTED', '', 'd', 'd', 'd', 'd' ,res);
          }
        }
        if(mt == 'r'){
          if(mo == 'd'){
            return renderWorks(user, topicDetails, '', '', '', 'SELECTED', 'd', 'd', 'd', 'a' ,res);
          }else {
            return renderWorks(user, topicDetails, '', '', '', 'SELECTED', 'd', 'd', 'd', 'd' ,res);
          }
        }
      }
    });
  });

}

/*
 Find topics inside TopicModel and sort them in a certain order.
 */
var getAndSortTopics = function(mt, mo, topics, callback){
  if(mt == 'c'){
    var order ='create_at';
    if (mo == 'd'){order = '-' + order;}
    return Topic.getTopicsByIdsSorted(topics, order, callback);
  }
  if(mt == 'u'){
    var order ='update_at';
    if (mo == 'd'){order = '-' + order;}
    return Topic.getTopicsByIdsSorted(topics, order, callback);

  }
  if(mt == 'p'){
    var order ='PV_count';
    if (mo == 'd'){order = '-' + order;}
    console.log("sort by pv");
    return Topic.getTopicsByIdsSorted(topics, order, callback);
  }
  if(mt == 'r'){
    //todo  how to count the rate.
    var order ='create_at';
    if (mo == 'd'){order = '-' + order;}
    return Topic.getTopicsByIdsSorted(topics, order, callback);
  }
}


var renderWorks = function(user, topicsInfos, isSelectC, isSelectU, isSelectP, isSelectR,
                           createV, updateV, pageViewV, rateV,
                           res, next){
  res.render('personal/index', {
    title: config.name,
    css: [
      '/stylesheets/personal.css'
    ],
    js: '',
    pageType: 'PERSONAL',
    personalType: 'WORKS',
    username: user.loginName,
    favourite: user.favourite,
    topicsCount: user.topicCount,
    topicsPageView: user.pageviewCount,
    topics: topicsInfos,
    isSelectC: isSelectC,
    isSelectU: isSelectU,
    isSelectP: isSelectP,
    isSelectR: isSelectR,
    createV: createV,
    updateV: updateV,
    pageViewV: pageViewV,
    rateV: rateV
  });
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