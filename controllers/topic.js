/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/2/13
 * Time: 12:55 AM
 * To change this template use File | Settings | File Templates.
 */
var sanitize = require('validator').sanitize;

var Topic = require('../proxy').Topic;
var Item = require('../proxy').Item;

var index = function (req, res, next) {
  res.render('topic/index', {

  });
}

var create = function (req, res, next) {
  res.render('topic/edit', {
    title: '创建总结-mtm',
    css: [
      '/stylesheets/edit.css',
      '/stylesheets/jquery-ui-1.10.3.custom.css'
    ],
    js: [
      '/javascripts/edit.js'
    ]
  });
}

var getId = function (req, res, next) {
  Topic.newId(function (topicId) {
    res.send({ topicId: topicId });
  });
}

var getContents = function (req, res, next) {
  var topicId = req.query.topicId;
  Topic.validateId(topicId, function (valid) {
    if (valid) {
      Topic.getContents(topicId, function (items) {
        var itemsData = [];
        items.forEach(function (item) {
          itemsData.push({
            type: item.type,
            itemId: item._id,
            text: item.text,
            title: item.title
          });
        });
        res.send({ itemsData: itemsData });
      })
    } else {
      getId(req, res, next);
    }
  })
}

var createItem = function (req, res, next) {
  var topicId = req.body.topicId;
  var prevItemType = req.body.prevItemType;
  var prevItemId = req.body.prevItemId;
  var type = req.body.type;
  var text = sanitize(req.body.text).trim();
  text = sanitize(text).xss();
  var title = sanitize(req.body.title).trim();
  title = sanitize(title).xss();
  var data = {
    text: text,
    title: title
  }

  Topic.createVoidItemIfNotExist(topicId, function (topic) {
    Item.createItem(
      topic,
      prevItemType,
      prevItemId,
      type,
      data,
      function (item) {
        Topic.increaseItemCountBy(topicId, 1);
        console.log('create item done.');
        res.send({
          itemId: item._id,
          type: item.type,
          text: item.text,
          title: item.title
        });
      })
  })
}

var editItem = function (req, res, next) {
  var type = req.body.type;
  var itemId = req.body.itemId;
  var text = sanitize(req.body.text).trim();
  text = sanitize(text).xss();
  var title = sanitize(req.body.title).trim();
  title = sanitize(title).xss();
  var data = {
    text: text,
    title: title
  }
  Item.editItem(type, itemId, data, function (item) {
    res.send({
      itemId: item._id,
      type: item.type,
      text: item.text,
      title: item.title
    });
  });
}

var sort = function (req, res, next) {
  var topicId = req.body.topicId;
  var type = req.body.type;
  var itemId = req.body.itemId;
  var prevItemType = req.body.prevItemType;
  var prevItemId = req.body.prevItemId;
  Topic.createVoidItemIfNotExist(topicId, function (topic) {
    Item.detachItem(type, itemId, function (item) {
      prevItemType = prevItemType || 'VOID';
      prevItemId = prevItemId || topic.void_item_id;
      Item.insertItem(item, prevItemType, prevItemId, function () {
        res.send(0);
      })
    })
  })
}

var deleteItem = function (req, res, next) {
  var type = req.body.type;
  var itemId = req.body.itemId;
  Item.deleteItem(type, itemId, function (item) {
    Topic.increaseItemCountBy(item.topic_id, -1);
  });
  res.send(0);
}

exports.index = index;
exports.create = create;
exports.getId = getId;
exports.getContents = getContents;
exports.createItem = createItem;
exports.editItem = editItem;
exports.sort = sort;
exports.deleteItem = deleteItem;