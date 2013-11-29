/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/8/13
 * Time: 3:04 PM
 * To change this template use File | Settings | File Templates.
 */
var EventProxy = require('eventproxy');

var models = require('../models');
var TopicModel = models.TopicModel;
var Item = require('./item');
var User = require('./user');

var NewTopic = require('./newTopics');

/**
 * 新建总结
 * @param userId
 * @param callback
 */
function createTopic(userId, callback) {
  var ep = EventProxy.create('topic', 'voidItem', function (topic) {
    if (typeof callback === 'function') {
      callback(null, topic);
    }
  })
    .fail(callback);

  var topic = new TopicModel();
  topic.author_id = userId;
  topic.save(ep.done('topic'));

  Item.createVoidItem(topic, ep.done('voidItem'));
}

/**
 * 获取一个总结的所有条目
 * @param topic
 * @param callback
 */
function getContents(topic, callback) {
  Item.getItems(topic.void_item_id, topic.item_count, callback);
}

/**
 * 修改条目数
 * @param topic
 * @param increment
 */
function increaseItemCountBy(topic, increment, callback) {
  return topic.update({$inc: {item_count: increment}}, callback);
}

/**
 * 修改访问量
 * @param topic
 * @param increment
 */
function increasePVCountBy(topic, increment, callback) {
  return topic.update({$inc: {PV_count: increment}}, callback);
}

/**
 * 获取人气总结
 */
function getAllTopics(callback) {
  TopicModel.find({ publishDate: { $ne: null } })
    //.sort('-_id')
    .exec(callback);
}

/**
 * 保存总结
 * @param authorId
 * @param topicId
 * @param title
 * @param coverUrl
 * @param description
 * @param publish
 * @param callback
 */
function saveTopic(authorId, topicId, title, coverUrl, description, publish, callback) {
  var ep = new EventProxy().fail(callback);

  TopicModel.findById(topicId, ep.done(function (topic) {
    if (!topic) {
      ep.emit('error', new Error('总结不存在'));
      return;
    }

    User.appendTopic(authorId, topicId, ep.done(function (author) {
      if (!author) {
        ep.emit('error', new Error('作者不存在'))
        return;
      }

      topic.author_id = authorId;
      topic.author_name = author.loginName;
      topic.title = title;
      topic.cover_url = coverUrl;
      topic.description = description;
      topic.update_at = Date.now();
      if (publish) {
        topic.draft = false;
        topic.publishDate = new Date();
      } else if (!topic.publishDate) {
        topic.draft = true;
      }
      topic.save(ep.done(function () {
        //add: 11.07 2013 add the published topic to new topics db.
        //But this maybe not new topics here !!!
        // in matome, it calls update list.
        if (publish || topic.publishDate) {
          NewTopic.saveNewTopic(topic);
        }
        if (typeof callback === 'function') {
          callback(null, topic);
        }
      }));
    }));
  }));
}

/**
 * 删除总结
 * @param authorId
 * @param topicId
 * @param callback
 */
function deleteTopic(authorId, topicId, callback) {
  callback = callback || function () {
  };
  TopicModel.findById(topicId, function (err, topic) {
    if (err) {
      callback(err);
      return;
    }
    if (!topic) {
      callback(new Error(404));
      return;
    }
    if (topic.author_id != authorId) {
      callback(new Error(403));
      return;
    }

    topic.remove(function (err) {
      if (err) {
        callback(err);
        return;
      }
      callback(null, topic);
      return;
    });

    Item.deleteItemList(topic.void_item_id, callback);
  });
}

/**
 * 查找总结
 * @param topicId
 * @param callback
 */
function getTopicById(topicId, callback) {
  TopicModel.findById(topicId, callback);
}

function getTopicsByIdsSorted(topicIds, opt, callback) {
  TopicModel.find({'_id': {"$in": topicIds}})
    .sort(opt)
    .exec(callback);
}

exports.createTopic = createTopic;//增
exports.getContents = getContents;//查
exports.increaseItemCountBy = increaseItemCountBy;
exports.increasePVCountBy = increasePVCountBy;
exports.getAllTopics = getAllTopics;
exports.saveTopic = saveTopic;//改
exports.deleteTopic = deleteTopic;//删
exports.getTopicById = getTopicById;//查
exports.getTopicsByIdsSorted = getTopicsByIdsSorted;