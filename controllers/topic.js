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
  var topicId = req.params.topicId;

  Topic.validateId(topicId, function (valid, topic) {
    if (valid && topic.published) {

      Topic.increasePVCountBy(topic, 1, function (topic) {

        Topic.getContents(topicId, function (topic, items) {
          var updateAt = topic.update_at.getFullYear() + '年'
            + (topic.update_at.getMonth() + 1) + '月'
            + topic.update_at.getDate() + '日';
          var topicData = {
            title: topic.title,
            desc: topic.desc,
            updateAt: updateAt,
            author: topic.author_id,
            PVCount: topic.PV_count
          };
          var itemsData = [];
          items.forEach(function (item) {
            itemsData.push({
              type: item.type,
              itemId: item._id,
              text: item.text,
              title: item.title
            });
          });
          res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, post-check=0, pre-check=0');
          res.set('Connection', 'close');
          res.set('Expire', '-1');
          res.set('Pragma', 'no-cache');
          res.render('topic/index', {
            css: [
              '/stylesheets/topic.css'
            ],
            url: req.url,
            topic: topicData,
            items: itemsData
          });
        });
      });
    } else {
      res.send('您要查看的总结不存在');
    }
  })
}

var create = function (req, res, next) {
  res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, post-check=0, pre-check=0');
  res.set('Connection', 'close');
  res.set('Expire', '-1');
  res.set('Pragma', 'no-cache');
  res.render('topic/edit', {
    title: '创建总结-mtm',
    css: [
      '/stylesheets/edit.css',
      '/stylesheets/jquery-ui-1.10.3.custom.css'
    ],
    js: [
      '/javascripts/jquery.autosize.min.js',
      '/javascripts/jquery-ui-1.10.3.custom.min.js',
      'http://ajax.aspnetcdn.com/ajax/jquery.validate/1.11.1/jquery.validate.min.js',
      '/javascripts/edit.js'
    ]
  });
}

var edit = function (req, res, next) {
  var topicId = req.params.topicId;

  Topic.validateId(topicId, function (valid, topic) {
    if (valid && topic.published) {

      Topic.getContents(topicId, function (topic, items) {
        var topicData = {
          title: topic.title,
          desc: topic.desc
        };
        var itemsData = [];
        items.forEach(function (item) {
          itemsData.push({
            type: item.type,
            itemId: item._id,
            text: item.text,
            title: item.title
          });
        });
        res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, post-check=0, pre-check=0');
        res.set('Connection', 'close');
        res.set('Expire', '-1');
        res.set('Pragma', 'no-cache');
        res.render('topic/edit', {
          title: '修改总结-mtm',
          css: [
            '/stylesheets/edit.css',
            '/stylesheets/jquery-ui-1.10.3.custom.css'
          ],
          js: [
            '/javascripts/jquery.autosize.min.js',
            '/javascripts/jquery-ui-1.10.3.custom.min.js',
            'http://ajax.aspnetcdn.com/ajax/jquery.validate/1.11.1/jquery.validate.min.js',
            '/javascripts/edit.js'
          ],
          topic: topicData,
          items: itemsData
        });
      });
    } else {
      res.send('您要修改的总结不存在');
    }
  });
}

var getId = function (req, res, next) {
  Topic.newId(function (topicId) {
    res.send({ topicId: topicId });
  });
}

var getContents = function (req, res, next) {
  var topicId = req.query.topicId;
  Topic.validateId(topicId, function (valid, topic) {
    if (!valid) {
      getId(req, res, next);
    } else if (topic.published) {
      res.send({
        redirect: '/topic/' + topicId + '/edit'
      });
    } else {
      Topic.getContents(topicId, function (topic, items) {
        var topicData = {
          title: topic.title,
          desc: topic.desc
        };
        var itemsData = [];
        items.forEach(function (item) {
          itemsData.push({
            type: item.type,
            itemId: item._id,
            text: item.text,
            title: item.title
          });
        });
        res.send({
          topicData: topicData,
          itemsData: itemsData
        });
      })
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
      Item.insertItem(item, prevItemType, prevItemId);
    })
  })
  res.send(200);
}

var deleteItem = function (req, res, next) {
  var type = req.body.type;
  var itemId = req.body.itemId;
  Item.deleteItem(type, itemId, function (item) {
    Topic.increaseItemCountBy(item.topic_id, -1);
  });
  res.send(200);
}

var publish = function (req, res, next) {
  var topicId = req.body.topicId;
  var title = req.body.title;
  var desc = req.body.desc;
  Topic.publish(topicId, title, desc, function () {
    res.send(200);
  });
}

exports.index = index;
exports.create = create;
exports.edit = edit;
exports.getId = getId;
exports.getContents = getContents;
exports.createItem = createItem;
exports.editItem = editItem;
exports.sort = sort;
exports.deleteItem = deleteItem;
exports.publish = publish;