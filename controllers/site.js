/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/27/13
 * Time: 11:42 PM
 * To change this template use File | Settings | File Templates.
 */
var async = require('async');
var extend = require('extend');

var Common = require('../common');
var Topic = require('../proxy/topic');
var Topic2 = require('../proxy/topic2');
var User = require('../proxy/user');
var Item = require('../proxy/item');
var Comment = require('../proxy/comment');

var helper = require('../helper/helper');
var utils = require('../public/javascripts/utils');

//var topicsPerPage = 24;
//var topicsInIndex = 24;
//var newTopicsPerPage = 19;
var topicsPerPage = 12;

function showTest(req, res) {
  async.auto({
    tempItems: function (callback) {
      Item.getAllTopic2Items(callback);
    },
    items: ['tempItems', function (callback, results) {
      var tempItems = results.tempItems;

      var topics = {};
      var items = [];
      async.forEachSeries(tempItems, function (item, callback) {
        if (topics[item.topicId]) {
          topics[item.topicId].itemCount++;
          return callback();
        }

        var newItem = item.toJSON();
        newItem.create_at = utils.getFormatedDate(newItem.create_at);

        Topic2.getTopic2ById(item.topicId, function (err, topic) {
          if (err) return callback(err);

          topic.itemCount = 0;
          extend(newItem, {
            topic: topic
          });

          topics[item.topicId] = topic;
          items.push(newItem);
          callback();
        });
      }, function (err) {
        if (err) return callback(err);

        callback(null, items);
      });
    }],
    comments: ['items', function (callback, results) {
      var items = results.items;
      var comments = {};
      async.forEachSeries(items, function (item, callback) {
        Comment.getCommentsByItemTypeAndId(item.type, item._id, function (err, tempComments) {
          if (err) return callback(err);

          async.mapSeries(tempComments, function (comment, callback) {
            var newComment = comment.toJSON();

            var key = comment._id + req.connection.remoteAddress;
            if (Common.CommentLikedKeys[key]) {
              newComment.liked = true;
            }

            User.getUserById(comment.authorId, function (err, user) {
              if (err) return callback(err);

              if (user) {
                extend(newComment, {
                  author: {
                    loginName: user.loginName,
                    url: user.url
                  }
                });
              }

              callback(null, newComment);
            });
          }, function (err, newComments) {
            if (err) return callback(err);

            comments[item._id] = newComments;
            callback();
          });
        });
      }, function (err) {
        if (err) return callback(err);

        callback(null, comments);
      });
    }]
  }, function (err, results) {
    var items = results.items;
    var comments = results.comments;

    var itemsData = [];
    items.forEach(function (item) {
      if (item && item.type && item._id) {
        itemsData.push(extend(
          item,
          helper.getItemData(item)
        ));
      }
    });

    res.render('test', {
      pageType: 'TEST',
      css: [
        '/bower_components/perfect-scrollbar/min/perfect-scrollbar-0.4.10.min.css',
        'http://cdn.bootcss.com/messenger/1.4.0/css/messenger.css',
        'http://cdn.bootcss.com/messenger/1.4.0/css/messenger-theme-flat.css',
        '/stylesheets/topic2.css'
      ],
      js: [
        '/bower_components/perfect-scrollbar/min/perfect-scrollbar-0.4.10.min.js',
        'http://cdn.bootcss.com/messenger/1.4.0/js/messenger.js',
        'http://cdn.bootcss.com/messenger/1.4.0/js/messenger-theme-flat.js',
        'http://cdn.bootcss.com/jquery-mousewheel/3.1.6/jquery.mousewheel.min.js',
        '/javascripts/utils.js',
        '/javascripts/topic2.js'
      ],
      items: itemsData,
      comments: comments
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