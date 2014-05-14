/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/27/13
 * Time: 11:42 PM
 * To change this template use File | Settings | File Templates.
 */
var async = require('async');

var Common = require('../common');
var Topic = require('../proxy').Topic;
var User = require('../proxy').User;

//var topicsPerPage = 24;
//var topicsInIndex = 24;
//var newTopicsPerPage = 19;
var topicsPerPage = 12;
var topicsInIndex = 12;
var newTopicsPerPage = 10;

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
      hot: Common.TopList.hotTopics.slice(0, topicsInIndex),
      categoryTopics : Common.TopList.categoryTopics,
      realGood: Common.TopList.classicTopics.slice(0, topicsInIndex),
      newTopics: Common.TopList.newTopics.slice(0, newTopicsPerPage),
      authorCategoryList: Common.AuthorCategoryList,
      Tags: Common.Tags,
      Topic: Common.Topic,
      categoryAuthors: Common.TopList.categoryAuthors,
      categoryTags: Common.TopList.categoryTags
    });
  });
}

function showNew(req, res) {
  var currentPage = parseInt(req.query.page) || 1;

  var newTopicsPage = Common.TopList.newTopics.slice((currentPage - 1) * topicsPerPage, currentPage * topicsPerPage);
  var totalPages = Math.ceil(Common.TopList.newTopics.length / topicsPerPage);

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
  console.log(Common.CATEGORIES2CHN);
  console.log(res.locals.categoryType);

  var categoryTopicsPage = Common.TopList.categoryTopics[category].slice((currentPage - 1) * topicsPerPage, currentPage * topicsPerPage);
  var totalPages = Math.ceil(Common.TopList.categoryTopics[category].length / topicsPerPage);

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
    authorCategoryList: Common.AuthorCategoryList,
    tags: Common.TopList.categoryTags[category],
    Tags: Common.Tags,
    Topic: Common.Topic
  });
}

exports.index = index;
exports.showNew = showNew;
exports.showCategory = showCategory;