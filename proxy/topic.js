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
function createTopic(authorId, callback) {
  callback = callback || function () {
  };
  var ep = EventProxy.create('topic', 'voidItem', function (topic) {
    callback(null, topic);
  })
    .fail(callback);

  var topic = new TopicModel();

  Item.createVoidItem(topic, ep.done('voidItem'));

  User.appendTopic(authorId, topic._id, ep.done(function (author) {
    if (!author) {
      ep.emit('error', new Error('作者不存在'))
      return;
    }
    topic.author_id = authorId;
    topic.author_name = author.loginName;
    topic.save(ep.done('topic'));
  }));
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
  TopicModel.find({ publishDate: { $exists: true } })
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
function saveTopic(topic, title, coverUrl, description, publish, callback) {
  callback = callback || function () {
  };

  topic.title = title;
  topic.cover_url = coverUrl;
  topic.description = description;
  topic.update_at = Date.now();
  if (publish) {
    topic.publishDate = new Date();
  }
  topic.save(function (err) {
    if (err) {
      return callback(err);
    }
    callback(null, topic);
    if (topic.publishDate) {
      NewTopic.saveNewTopic(topic);
    }
  });
}

/**
 * 删除总结
 * @param authorId
 * @param topicId
 * @param callback
 */
function deleteTopic(topic, callback) {
  callback = callback || function () {
  };

  topic.remove(function (err) {
    if (err) {
      return callback(err);
    }
    callback(null, topic);
    Item.deleteItemList(topic.void_item_id, callback);
    User.deleteTopic(topic.author_id, topic._id);
    NewTopic.deleteNewTopic(topic._id);
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

function getPublishedTopics(topicIds, opt, callback) {
  TopicModel.find({'_id': {"$in": topicIds}, publishDate: {$exists: true}})
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
exports.getPublishedTopics = getPublishedTopics;