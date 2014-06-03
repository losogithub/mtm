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
var Topic2 = require('../proxy/topic2');
var User = require('../proxy/user');
var Item = require('../proxy/item');
var Comment = require('../proxy/comment');

var helper = require('../helper/helper');
var utils = require('../public/javascripts/utils');

function showIndex(req, res) {
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

              topic.itemCount = 1;
              extend(newItem, {
                topic: topic
              });

              topics[item.topicId] = topic;
              items.push(newItem);
              callback();
            });
          },
          author: ['topic', function (callback) {
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

    res.render('index', {
      pageType: 'INDEX',
      css: [
        '/stylesheets/topic2.css'
      ],
      js: [
        'http://cdn.bootcss.com/jquery-mousewheel/3.1.6/jquery.mousewheel.min.js',
        '/javascripts/utils.js',
        '/javascripts/topic.js'
      ],
      items: itemsData,
      comments: comments
    });
  });
}

function showTool(req, res) {
  res.render('tool', {
    title: '采集神器',
    pageType: 'TOOL'
  });
}

exports.showIndex = showIndex;
exports.showTool = showTool;