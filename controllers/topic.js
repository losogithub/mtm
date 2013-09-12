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

var create = function (req, res, next) {
  res.render('topic/edit', {
    title: 'mtm',
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
  Topic.newId(function (id) {
    res.send({ id: id });
  });
}

var getContents = function (req, res, next) {
  console.log(req.originalUrl);
  Topic.validateId(req.query.id, function (valid) {
    if (valid) {
      Topic.getContents(req.query.id, function (items) {
        res.send({ itemsData: items });
      })
    } else {
      getId(req, res, next);
    }
  })
}

var createItem = function (req, res, next) {
  var topicId = req.body.topicId;
  var prevItemId = req.body.prevItemId;
  var type = req.body.type;
  var text = sanitize(req.body.text).trim();
  text = sanitize(text).xss();
  Topic.newAndSave(
    topicId,
    prevItemId,
    type,
    text,
    function (item) {
      console.log('create item done.');
      res.send({
        _id: item._id,
        type: item.type,
        text: item.text
      });
    });
}

var editItem = function (req, res, next) {
  var itemId = req.body.itemId;
  var type = req.body.type;
  var text = sanitize(req.body.text).trim();
  text = sanitize(text).xss();
  Item.editItem(itemId, type, text, function (item) {
    res.send({
      _id: item._id,
      type: item.type,
      text: item.text
    });
  });
}

var sort = function (req, res, next) {
  var topicId = req.body.topicId;
  var itemId = req.body.itemId;
  var prevItemId = req.body.prevItemId;
  Topic.createVoidItemIfRequired(topicId, function (topic) {
    Item.detachItem(itemId, function (item) {
      prevItemId = prevItemId || topic.void_item_id;
      Item.insertItem(item, prevItemId, function () {
        res.send(0);
      })
    })
  })
}

var deleteItem = function (req, res, next) {
  var topicId = req.body.topicId;
  var itemId = req.body.itemId;
  Item.deleteItem(itemId, function () {
    res.send(0);
  });
}

exports.create = create;
exports.getId = getId;
exports.getContents = getContents;
exports.createItem = createItem;
exports.editItem = editItem;
exports.sort = sort;
exports.deleteItem = deleteItem;