/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/27/13
 * Time: 11:42 PM
 * To change this template use File | Settings | File Templates.
 */
var async = require('async');

var Common = require('../common');
var Topic = require('../proxy/topic');
var User = require('../proxy/user');

//var topicsPerPage = 24;
//var topicsInIndex = 24;
//var newTopicsPerPage = 19;
var topicsPerPage = 12;

function showTest(req, res) {
  var featuredTopics = Common.FeaturedTopics;
  async.auto({
    topics: function (callback) {
      Topic.getTopicsById(['5337986887a4d07730f2c4c9', '533d3555d1178f3f783ad3e3'], callback);
    },
    authors: ['topics', function (callback, results) {
      var topics = results.topics;
      async.forEachSeries(topics, function (topic, callback) {
        User.getUserById(topic.author_id, function (err, user) {
          if (err) {
            return callback(err);
          }
          if (!user) {
            return callback(new Error());
          }
          topic.author_url = user.url;
          callback(null);
        });
      }, callback);
    }]
  }, function (err, results) {
    res.render('test', {
      pageType: 'TEST'
    });
  });
}

function index(req, res) {
  var featuredTopics = Common.FeaturedTopics;
  async.auto({
    topics: function (callback) {
      Topic.getTopicsById(['5337986887a4d07730f2c4c9', '533d3555d1178f3f783ad3e3'], callback);
    },
    authors: ['topics', function (callback, results) {
      var topics = results.topics;
      async.forEachSeries(topics, function (topic, callback) {
        User.getUserById(topic.author_id, function (err, user) {
          if (err) {
            return callback(err);
          }
          if (!user) {
            return callback(new Error());
          }
          topic.author_url = user.url;
          callback(null);
        });
      }, callback);
    }]
  }, function (err, results) {
    if (!err) {
      featuredTopics = results.topics.concat(featuredTopics);
    }
    res.render('index', {
      pageType: 'INDEX',
      topicCount: Common.TopList.totalTopicCount,
      totalTopicCount: Common.TopList.totalTopicCount,
      categoryTopicCount: Common.TopList.categoryTopicCount,
      featuredTopics: featuredTopics,
      categoryTopics : Common.TopList.categoryTopics,
      AuthorCategoryList: Common.AuthorCategoryList,
      Tags: Common.Tags,
      Topic: Common.Topic,
      categoryAuthors: Common.TopList.categoryAuthors,
      categoryTags: Common.TopList.categoryTags
    });
  });
}

function showNew(req, res) {
  var currentPage = parseInt(req.query.page) || 1;

  var newTopicsPage = Common.TopList.newTopics
    ? Common.TopList.newTopics.slice((currentPage - 1) * topicsPerPage, currentPage * topicsPerPage)
    : [];
  var totalPages = Math.ceil(Common.TopList.newTopics
    ? Common.TopList.newTopics.length / topicsPerPage
    : 0);

  res.render('category', {
    title: '最新',
    pageType: '最新',
    topicCount: Common.TopList.totalTopicCount,
    totalTopicCount: Common.TopList.totalTopicCount,
    categoryTopicCount: Common.TopList.categoryTopicCount,
    topics: newTopicsPage,
    totalPage: totalPages,
    currentPage: currentPage,
    Topic: Common.Topic
  });
}

function showCategory(req, res) {
  var currentPage = parseInt(req.query.page) || 1;
  var category = Common.CATEGORIES2CHN[res.locals.categoryType];

  var categoryTopicsPage = Common.TopList.categoryTopics[category]
    ? Common.TopList.categoryTopics[category].slice((currentPage - 1) * topicsPerPage, currentPage * topicsPerPage)
    : [];
  var totalPages = Math.ceil(Common.TopList.categoryTopics[category]
    ? Common.TopList.categoryTopics[category].length / topicsPerPage
    : 0);

  res.render('category', {
    title: category,
    pageType: category,
    topicCount: Common.TopList.categoryTopicCount[category],
    totalTopicCount: Common.TopList.totalTopicCount,
    categoryTopicCount: Common.TopList.categoryTopicCount,
    topics: categoryTopicsPage,
    totalPage: totalPages,
    currentPage: currentPage,
    authors: Common.TopList.categoryAuthors[category],
    AuthorCategoryList: Common.AuthorCategoryList,
    tags: Common.TopList.categoryTags[category],
    Tags: Common.Tags,
    Topic: Common.Topic
  });
}

exports.showTest = showTest;
exports.index = index;
exports.showNew = showNew;
exports.showCategory = showCategory;