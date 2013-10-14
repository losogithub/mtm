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
var User= require('./user');

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
      callback(false, topic);

    } else {
      console.log('validate topic id done');
      console.log(topic);

      //验证结果传给回调函数
      callback(topic ? true : false, topic);
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
      Item.getItems(topic.void_item_id, topic.item_count, function (items) {
        if (callback) {
          callback(topic, items);
        }
      });
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
      topic.save(function (err) {
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
 * 修改访问量
 * @param topicId
 * @param increment
 */
var increasePVCountBy = function (topic, increment, callback) {
  console.log('increasePVCountBy');

  //修改条目数
  topic.PV_count += increment;
  topic.save(function (err, topic) {
    if (err) {
      console.error('increase PV_count failed:' + err);
    } else {
      console.log('increase PV_count done');
      if (callback) {
        callback(topic);
      }
    }
  });
}

/**
 * 获取人气总结
 */
var getHotTopics = function (callback) {
  console.log('getHotTopics');

  TopicModel.find({ publishDate: { $ne: null } })
    .sort('-_id')
    .exec(function (err, topics) {
      if (err) {
        console.error('find topic failed:' + err);
      } else {
        console.log('find topic done');
        console.log(topics.length);
        callback(topics);
      }
    });
}

var save = function (authorId, topicId, title, coverUrl, description, publish, callback) {
  console.log('publish');

  TopicModel.findById(topicId, function (err, topic) {
    if (err) {
      console.error('find topic failed:' + err);
    } else if (!topic) {
      console.log('topic not found');
    } else {
      console.log('find topic done');

      //append this topic into user information
      console.log("topic Id: %s", topicId);
      console.log("author Id: %s", authorId);
      User.appendTopic(authorId, topicId, function (author) {

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
        topic.save(function (err) {
          if (err) {
            console.error('save topic failed:' + err);
          } else {

            callback();
          }
        });
      });
    }
  });
}

var getTopicById = function(topicId, callback){
    console.log('getTopicById');
    //查找总结
    TopicModel.findById(topicId, function (err, topic) {
        if (err) {
            console.error('find topic failed:' + err);
        } else {
            console.log('find topic done');
            callback(err, topic);
        }
    });
}

var getTopicsByIdsSorted = function(topicIds, opt, callback){
  TopicModel.find({'_id' : {"$in" : topicIds}})
    .sort(opt)
    .exec(function (err, topics){
      if(err){
        console.err("cannot find topics by ids: " + err);
        //todo: return null ok or not
        return ;
      }else{
        //console.log("model return topics");
        //console.log(topics);
        callback(err, topics);
      }
    })
}

exports.newId = newId;//增
exports.validateId = validateId;
exports.getContents = getContents;//查
exports.createVoidItemIfNotExist = createVoidItemIfNotExist;
exports.increaseItemCountBy = increaseItemCountBy;
exports.increasePVCountBy = increasePVCountBy;
exports.getHotTopics = getHotTopics;
exports.save = save;
exports.getTopicById = getTopicById;
exports.getTopicsByIdsSorted = getTopicsByIdsSorted;