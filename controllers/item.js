/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 4/25/14
 * Time: 3:52 PM
 * To change this template use File | Settings | File Templates.
 */

var async = require('async');
var extend = require('extend');
var sanitize = require('validator').sanitize;
var check = require('validator').check;

var helper = require('../helper/helper');

var Item = require('../proxy/item');
var User = require('../proxy/user');
var Topic2 = require('../proxy/topic2');

var config = require('../config');

function showBookmarklet(req, res) {
  res.render('item/bookmarklet', {
    layout: false,
    pageType: 'BOOKMARKLET'
  });
}

function deleteItem(req, res, next) {
  var userId = req.session.userId;
  var type = req.body.type;
  var _id = req.body._id;

  async.auto({
    user: function (callback) {
      User.getUserById(userId, function (err, user) {
        if (err) {
          return callback(err);
        }
        if (!user) {
          return callback(new Error(400));
        }

        User.deleteItem(user, _id, callback);
      });
    },
    item: ['user', function (callback) {
      Item.deleteItem(type, _id, callback);
    }]
  }, function (err) {
    if (err) {
      return next(err);
    }

    res.send(200);
  });
}

function _getUserAndAuthId(userId, _id, callback) {
  callback = callback || function () {
  };

  User.getUserById(userId, function (err, user) {
    if (err) {
      return callback(err);
    }
    if (!user) {
      return callback(new Error(400));
    }

    var index = user.items.indexOf(_id);
    if (index < 0) {
      return callback(new Error(403));
    }

    callback(null, user);
  });
}

function editItem(req, res, next) {
  var userId = req.session.userId;
  var _id = req.body._id;
  var type = req.body.type;

  async.auto({
    user: function (callback) {
      _getUserAndAuthId(userId, _id, callback);
    },
    item: ['user', function (callback) {
      try {
        var data = helper.getData(req);
      } catch (err) {
        return callback(err);
      }
      Item.editItem(type, _id, data, callback);
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    var item = results.item;
    res.json(helper.getItemData(item));
  });
}

function getDetail(req, res, next) {
  console.log('getDetail');
  var url = req.query.url;

  async.auto({
    topics: function (callback) {
      Topic2.getTopic2s(callback);
    },
    detail: function (callback) {
      helper.getDetail(url, callback);
    }
  }, function (err, results) {
    if (err) return next(err);

    var topics = results.topics;
    var topicTexts = [];
    topics.slice(0, 5).forEach(function (topic) {
      if (!topic.text) {
        return;
      }
      topicTexts.push(topic.text);
    });
    var detail = results.detail;
    res.json({
      topicTexts: topicTexts,
      detail: detail && helper.getItemData(detail)
    });
  });
}

function createItem(req, res, next) {
  console.log('createItem=====');
  var userId = req.session.userId;
  var topicText = sanitize(req.body.topic).trim();

  try {
    var data = helper.getData(req, true);
    check(topicText).len(0, 20);
  } catch (err) {
    return next(err);
  }
  if (!data) {
    return next(new Error(500));
  }

  async.auto({
    tempTopic: function (callback) {
      Topic2.getTopic2ByText(topicText, callback);
    },
    topic: ['tempTopic', function (callback, results) {
      var topic = results.tempTopic;
      if (topic) return callback(null, topic);

      Topic2.createTopic2(topicText, userId, callback);
    }],
    item: ['topic', function (callback, results) {
      data.authorId = userId;
      data.topicId = results.topic._id;
      Item.createItem(data, callback);
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    var item = results.item;
    res.json(helper.getItemData(item));
    console.log('createItem done');
  });
}

exports.showBookmarklet = showBookmarklet;
exports.deleteItem = deleteItem;
exports.editItem = editItem;
exports.getDetail = getDetail;
exports.createItem = createItem;