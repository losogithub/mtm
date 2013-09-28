/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/8/13
 * Time: 3:04 PM
 * To change this template use File | Settings | File Templates.
 */
var EventProxy = require('eventproxy');
var ObjectId = require('mongoose').Types.ObjectId;

var models = require('../models');
var TopicModel = models.TopicModel;
var Item = require('./item');

/**
 * 获取新总结id
 * @param callback
 */
var newId = function (callback) {
  console.log('newId');

  //新建总结
  var topic = new TopicModel();
  topic.save(function (err, topic) {
    if (err) {
      console.error('get new topic id failed:' + err);
      callback(null);
    } else {
      console.log('get new topic id done');
      console.log(topic._id);

      //将总结id传给回调函数
      callback(topic._id);
    }
  });
}

/**
 * 验证总结id
 * @param topicId
 * @param callback
 */
var validateId = function (topicId, callback) {
  console.log('validateId===');
  console.log(topicId);

  //查找总结
  TopicModel.findById(topicId, function (err, topic) {
    if (err) {
      console.error('validate topic id failed:' + err);

      //验证出错
      callback(false);

    } else {
      console.log('validate topic id done');
      console.log(topic);

      //验证结果传给回调函数
      callback(topic ? true : false);
    }
  });
}

/**
 * 创建条目链表头
 * @param topicId
 * @param callback
 */
var createVoidItemIfNotExist = function (topicId, callback) {
  console.log('createVoidItemIfNotExist');

  //查找总结
  TopicModel.findById(topicId, function (err, topic) {
    if (err) {
      console.error('find topic failed:' + err);
    } else if (!topic) {
      console.log('topic not found');
    } else {
      console.log('topic=======');
      console.log(topic);

      //创建条目链表头
      Item.createVoidItem(topic, callback);
    }
  });
}

/**
 * 获取一个总结的所有条目
 * @param topicId
 * @param callback
 */
var getContents = function (topicId, callback) {
  console.log('getContents');

  //查找总结
  TopicModel.findById(topicId, function (err, topic) {
    if (err) {
      console.error('find topic failed:' + err);
    } else {

      //获取该总结的所有条目
      Item.getItems(topic.void_item_id, topic.item_count, callback);
    }
  })
}

/**
 * 修改条目数
 * @param topicId
 * @param increment
 */
var increaseItemCountBy = function (topicId, increment) {
  console.log('increaseItemCountBy');

  //查找总结
  TopicModel.findById(topicId, function (err, topic) {
    if (err) {
      console.error('find topic failed:' + err);
    } else {
      console.log('find topic done');

      //修改条目数
      topic.item_count += increment;
      topic.save(function () {
        if (err) {
          console.error('increase item_count failed:' + err);
        } else {
          console.log('increase item_count done');
        }
      });
    }
  })
}

/**
 * 获取人气总结
 */
var getHotMtms = function (callback) {
  console.log('getHotMtms');

  TopicModel.find({void_item_id: {$ne: null}}, function (err, topics) {
    if (err) {
      console.error('find topic failed:' + err);
    } else {
      console.log('find topic done');
      console.log(topics.length);
      callback(topics);
    }
  })
}

exports.newId = newId;//增
exports.validateId = validateId;
exports.getContents = getContents;//查
exports.createVoidItemIfNotExist = createVoidItemIfNotExist;
exports.increaseItemCountBy = increaseItemCountBy;
exports.getHotMtms = getHotMtms;