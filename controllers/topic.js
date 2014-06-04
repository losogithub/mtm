/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/2/13
 * Time: 12:55 AM
 * To change this template use File | Settings | File Templates.
 */
var async = require('async');
var extend = require('extend');

var config = require('../config');
var helper = require('../helper/helper');
var escape = helper.escape;

var Topic = require('../proxy/topic');
var Item = require('../proxy/item');
var Comment = require('../proxy/comment');
var User = require('../proxy/user');

var utils = require('../public/javascripts/utils');

function showIndex(req, res, next) {
  console.log('topic showIndex=====');
  var userId = req.session.userId;
  var topicId = req.params.topicId;

  async.auto({
    topic: function (callback) {
      Topic.getTopicById(topicId, callback);
    },
    author: ['topic', function (callback, results) {
      var topic = results.topic;
      if (!topic) return callback(new Error(404));

      User.getUserById(topic.author_id, callback);
    }],
    items: ['topic', function (callback, results) {
      var topic = results.topic;
      if (!topic) return callback(new Error(404));

      Item.getItems(topic, callback);
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    var topic = results.topic;
    var author = results.author;
    var items = results.items;

    var itemsData = [];
    items.forEach(function (item) {
      if (item && item.type && item._id) {
        itemsData.push(helper.getItemData(item));
      }
    });

    res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, post-check=0, pre-check=0');
    res.set('Connection', 'close');
    res.set('Expire', '-1');
    res.set('Pragma', 'no-cache');
    res.render('topic/index', {
      pageType: 'TOPIC',
      title: topic.title,
      description: topic.description,
      css: [
        '/stylesheets/topic.css'
      ],
      js: [
        '/javascripts/utils.js'
      ],
      escape: escape,
      isAuthor: topic.author_id == userId,
      topic: topic,
      items: itemsData,
      author: author
    });

    console.log('showIndex done');
  });
}

exports.showIndex = showIndex;