/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/2/13
 * Time: 12:55 AM
 * To change this template use File | Settings | File Templates.
 */
var sanitize = require('validator').sanitize;
var escape = require('escape-html');

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
            topicUrl: req.url,
            title: topic.title,
            coverUrl: topic.cover_url,
            description: topic.description,
            updateAt: updateAt,
            author: topic.author_name,
            PVCount: topic.PV_count
          };
          var itemsData = [];
          items.forEach(function (item) {
            itemsData.push(_getItemData(item));
          });
          res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, post-check=0, pre-check=0');
          res.set('Connection', 'close');
          res.set('Expire', '-1');
          res.set('Pragma', 'no-cache');
          res.render('topic/index', {
            css: [
              '/stylesheets/topic.css'
            ],
            escape: escape,
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
  //add by zan for checking login
  /*
  if((!req.session) || (!req.session.userId) || (req.session.userId == 'undefined')){
    console.log("not login, create page");
    console.log(req.headers['referrer']);// even I click on the crate button, still undefined !
    console.log(req.session._loginReferer);
    req.session._loginReferer = req.headers.referer ;
    res.redirect('/login?fromUrl=' + req.url);
  } */

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
          coverUrl: topic.cover_url,
          description: topic.description
        };
        var itemsData = [];
        items.forEach(function (item) {
          itemsData.push(_getItemData(item));
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
            '/javascripts/jquery.validate.min.js',
            '/javascripts/edit.js'
          ],
          escape: escape,
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
    res.json({ topicId: topicId });
  });
}

var getContents = function (req, res, next) {
  var topicId = req.query.topicId;
  Topic.validateId(topicId, function (valid, topic) {
    if (!valid) {
      getId(req, res, next);
    } else if (topic.published) {
      res.json({
        redirect: '/topic/' + topicId + '/edit'
      });
    } else {
      Topic.getContents(topicId, function (topic, items) {
        var topicData = {
          title: topic.title,
          coverUrl: topic.cover_url,
          description: topic.description
        };
        var itemsData = [];
        items.forEach(function (item) {
          itemsData.push(_getItemData(item));
        });
        res.json({
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

  var data = _getData(req);
  if (!data) {
    return;
  }

  Topic.createVoidItemIfNotExist(topicId, function (topic) {
    Item.createItem(
      topic,
      prevItemType,
      prevItemId,
      data,
      function (item) {
        Topic.increaseItemCountBy(topicId, 1);
        console.log('create item done.');
        res.json(_getItemData(item));
      })
  })
}

var _getData = function (req, _id) {
  var type = req.body.type;
  var data;

  switch (type) {
    case 'IMAGE':
      var url = sanitize(req.body.url).trim();
      var title = sanitize(req.body.title).trim();
      var quote = sanitize(req.body.quote).trim();
      var description = sanitize(req.body.description).trim();

      data = {
        url: url,
        title: title,
        quote: quote,
        description: description
      }
      break;
    case 'TEXT':
      var text = sanitize(req.body.text).trim();

      data = {
        text: text
      }
      break;
    case 'TITLE':
      var title = sanitize(req.body.title).trim();

      data = {
        title: title
      }
      break;
    default :
      break;
  }
  data.type = type;
  if (_id) {
    data._id = _id;
  }
  return data;
}

var _getItemData = function (item) {
  var itemData;

  switch (item.type) {
    case 'IMAGE':
      itemData = {
        itemId: item._id,
        type: item.type,
        url: item.url,
        title: item.title,
        quote: item.quote,
        description: item.description
      }
      break;
    case 'TEXT':
      itemData = {
        itemId: item._id,
        type: item.type,
        text: item.text
      }
      break;
    case 'TITLE':
      itemData = {
        itemId: item._id,
        type: item.type,
        title: item.title
      }
      break;
    default:
      break;
  }
  return itemData;
}

var editItem = function (req, res, next) {
  var itemId = req.body.itemId;

  var data = _getData(req, itemId);
  Item.editItem(data, function (item) {
    console.log(item.text);
    res.json(_getItemData(item));
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
  var authorId =  req.session.userId;
  var topicId = req.body.topicId;
  var title = req.body.title;
  var coverUrl = req.body.coverUrl;
  var description = req.body.description;

  Topic.publish( authorId,topicId, title, coverUrl, description, function () {

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