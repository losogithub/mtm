/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 5/25/14
 * Time: 8:35 AM
 * To change this template use File | Settings | File Templates.
 */

var async = require('async');
var extend = require('extend');

var helper = require('../helper/helper');
var Common = require('../common');
var Topic2 = require('../proxy/topic2');
var User = require('../proxy/user');
var Item = require('../proxy/item');
var Comment = require('../proxy/comment');
var utils = require('../public/javascripts/utils');

function showIndex(req, res, next) {
  console.log('topic2 showIndex=====');

  console.log('ip: ' + req.connection.remoteAddress);
  console.log("topicId: " + req.params.topicId);
  var topicText = req.params.topicText;

  async.auto({
    topic: function (callback) {
      Topic2.getTopic2ByText(topicText, callback);
    },
    tempItems: ['topic', function (callback, results) {
      var topic = results.topic;
      if (!topic) return callback(new Error(404));

      Item.getItemsByTopicId(topic._id, callback);
    }],
    items: ['tempItems', function (callback, results) {
      var tempItems = results.tempItems;

      async.mapSeries(tempItems, function (item, callback) {
        var newItem = item.toJSON();
        newItem.create_at = utils.getFormatedDate(newItem.create_at);

        User.getUserById(item.authorId, function (err, user) {
          if (err) return callback(err);

          if (user) {
            extend(newItem, {
              author: {
                loginName: user.loginName,
                url: user.url
              }
            })
          }

          callback(null, newItem);
        });
      }, callback);
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
    if (err) {
      return next(err);
    }

    var topic = results.topic;
    var items = results.items;
    var comments = results.comments;

    var itemsData = [];
    items.forEach(function (item) {
      if (item && item.type && item._id) {
        itemsData.push(extend(
          helper.getItemData(item), {
            author: item.author,
            create_at: item.create_at
          }
        ));
      }
    });

    res.render('topic2/topic', {
      pageType: 'TOPIC',
      title: '#' + topic.text + '#',
      topic: topic,
      css: [
        '/bower_components/perfect-scrollbar/min/perfect-scrollbar-0.4.10.min.css',
        'http://cdn.bootcss.com/messenger/1.4.0/css/messenger.css',
        'http://cdn.bootcss.com/messenger/1.4.0/css/messenger-theme-flat.css',
        '/stylesheets/topic2.css'
      ],
      js: [
        '/bower_components/perfect-scrollbar/min/perfect-scrollbar-0.4.10.min.js',
        '/javascripts/ng-tags-input.js',
        'http://cdn.bootcss.com/messenger/1.4.0/js/messenger.js',
        'http://cdn.bootcss.com/messenger/1.4.0/js/messenger-theme-flat.js',
        'http://cdn.bootcss.com/jquery-mousewheel/3.1.6/jquery.mousewheel.min.js',
        '/javascripts/utils.js',
        '/javascripts/topic2.js'
      ],
      items: itemsData,
      comments: comments
    });

    var key = topic._id + req.connection.remoteAddress;
    if (!Common.TopicVisitedKeys[key]) {
      Common.TopicVisitedKeys[key] = true;
      Topic2.increasePVCountBy(topic, 1, null);
    }
    console.log('showIndex done');
  });
}

function getHintTopics(req, res, next) {
  var topicText = req.query.topic;

  Topic2.getTopic2sByRegExp(new RegExp(topicText.toString(), 'i'), function (err, topics) {
    if (err) return next(err);

    var topicTexts = [];
    topics.slice(0, 5).forEach(function (topic) {
      if (!topic.text) return;

      topicTexts.push(topic.text);
    });
    res.json(topicTexts);
  });
}

exports.showIndex = showIndex;
exports.getHintTopics = getHintTopics;