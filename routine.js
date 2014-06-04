/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 11/8/13
 * Time: 11:03 AM
 * To change this template use File | Settings | File Templates.
 */
var async = require('async');
var extend = require('extend');

var Common = require('./common');
var Topic2 = require('./proxy/topic2');
var User = require('./proxy/user');
var Item = require('./proxy/item');
var Comment = require('./proxy/comment');

var helper = require('./helper/helper');
var utils = require('./public/javascripts/utils');

function _clearIP() {
  Common.TopicVisitedKeys = {};
  Common.SpitLikedKeys = {};
  Common.CommentLikedKeys = {};
}

function updateHotTopics(callback) {
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

        async.auto({
          topic: function (callback) {
            Topic2.getTopic2ById(item.topicId, function (err, topic) {
              if (err) return callback(err);

              var newTopic = topic.toJSON();
              newTopic.itemCount = 1;
              newItem.topic = newTopic;

              topics[item.topicId] = newTopic;
              items.push(newItem);
              callback();
            });
          },
          author: ['topic', function (callback) {
            User.getUserById(item.authorId, function (err, user) {
              if (err) return callback(err);

              if (user) {
                newItem.author = {
                  loginName: user.loginName,
                  url: user.url
                };
              }

              callback();
            });
          }]
        }, callback);
      }, function (err) {
        if (err) return callback(err);

        callback(null, items);
      });
    }],
    comments: ['items', function (callback, results) {
      var items = results.items;
      async.forEachSeries(items, function (item, callback) {
        Comment.getCommentsByItemTypeAndId(item.type, item._id, function (err, tempComments) {
          if (err) return callback(err);

          async.mapSeries(tempComments, function (comment, callback) {
            var newComment = comment.toJSON();

            function _prefixZero(num) {
              return num < 10 ? '0' + num : num;
            }
            var temp = comment.createDate;
            newComment.createDate = temp.getFullYear() + '-'
              + _prefixZero(temp.getMonth() + 1) + '-'
              + _prefixZero(temp.getDate()) + ' '
              + _prefixZero(temp.getHours()) + ':'
              + _prefixZero(temp.getMinutes()) + ':'
              + _prefixZero(temp.getSeconds());

            User.getUserById(comment.authorId, function (err, user) {
              if (err) return callback(err);

              if (user) {
                newComment.author = {
                  loginName: user.loginName,
                  url: user.url
                };
              }

              callback(null, newComment);
            });
          }, function (err, newComments) {
            if (err) return callback(err);

            item.comments = newComments;
            callback();
          });
        });
      }, callback);
    }]
  }, function (err, results) {
    if (err) return callback(err);

    var items = results.items;

    items.forEach(function (item) {
      if (item && item.type && item._id) {
        extend(
          item,
          helper.getItemData(item)
        );
      }
    });

    Common.HotTopics = items;
    callback();
  });
}

function _routine() {
  async.series([
    function (callback) {
      updateHotTopics(callback);
    }
  ], function () {
    setTimeout(function () {
      _routine();
    }, 60 * 1000);
  })
}

function start() {
  _routine();
  setInterval(_clearIP, 24 * 60 * 60 * 1000);
}

exports.start = start;