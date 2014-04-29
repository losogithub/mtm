/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/8/13
 * Time: 3:04 PM
 * To change this template use File | Settings | File Templates.
 */
var async = require('async');

var Common = require('../common');
var TopicModel = require('../models').TopicModel;
var User = require('./user');

/**
 * 新建策展
 * @param userId
 * @param callback
 */
function createTopic(authorId, callback) {
  callback = callback || function () {
  };

  var topic = new TopicModel();

  User.appendTopic(authorId, topic._id, function (err, author) {
    if (err) {
      return callback(err);
    }
    if (!author) {
      return callback(new Error('作者不存在'))
    }

    topic.author_id = authorId;
    topic.author_name = author.loginName;
    topic.save(callback);
  });
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
 * 获取所有策展
 */
function getAllTopics(callback) {
  TopicModel.find({}, callback);
}

function getPublishedTopics(callback) {
  TopicModel.find({ publishDate: { $exists: true } }, callback);
}

function getNewTopics(callback) {
  TopicModel.find({ publishDate: { $exists: true } })
    .sort('-update_at')
    .limit(120)
    .exec(callback);
}

function getCategoryTopics(category, callback) {
  if (category == '未分类') {
    var classedList = [];
    for (var key in Common.CATEGORIES2ENG) {
      if (key == '未分类') {
        continue;
      }
      classedList.push(key);
    }
    TopicModel.find({
      publishDate: { $exists: true },
      category: { $not: { $in: classedList } }
    }, callback);
  } else {
    TopicModel.find({ publishDate: { $exists: true }, category: category }, callback);
  }
}

function getTagTopics(tagText, callback) {
  TopicModel.find({ publishDate: { $exists: true }, tags: tagText }, callback);
}

function saveCover(topic, coverUrl, callback) {
  topic.cover_url = coverUrl;
  topic.update_at = Date.now();
  topic.save(callback);
}

function saveTitle(topic, title, description, callback) {
  topic.title = title;
  topic.description = description;
  topic.update_at = Date.now();
  topic.save(callback);
}

function saveCategory(topic, category, callback) {
  topic.category = category;
  topic.save(callback);
}

function publishTopic(topic, callback) {
  if (!topic.title) {
    return callback(new Error(400));
  }
  topic.update_at = Date.now();
  topic.publishDate = Date.now();
  topic.save(callback);
}

/**
 * 删除策展
 * @param authorId
 * @param topicId
 * @param callback
 */
function deleteTopic(topic, callback) {
  topic.remove(callback);
}

/**
 * 查找策展
 * @param topicId
 * @param callback
 */
function getTopicById(topicId, callback) {
  TopicModel.findById(topicId, callback);
}

function getPublishedTopicById(topicId, callback) {
  TopicModel.findOne({ _id: topicId, publishDate: { $exists: true } }, callback);
}

function getTopicsByIdsSorted(topicIds, opt, callback) {
  TopicModel.find({'_id': {"$in": topicIds}})
    .sort(opt)
    .exec(callback);
}

function getPublishedTopics2(topicIds, opt, callback) {
  TopicModel.find({'_id': {"$in": topicIds}, publishDate: {$exists: true}})
    .sort(opt)
    .exec(callback);
}

function addTag(topic, tagText, callback) {
  callback = callback || function () {
  };

  if (topic.tags.length == 5) {
    return callback(new Error(400));
  }

  for (var i = 0; i < topic.tags.length; i++) {
    if (tagText == topic.tags[i]) {
      return callback(new Error(400));
    }
  }
  topic.tags.push(tagText);
  topic.save(callback);
}

function removeTag(topic, tagText, callback) {
  for (var i = 0; i < topic.tags.length; i++) {
    if (tagText == topic.tags[i]) {
      topic.tags.splice(i, 1);
      break;
    }
  }
  topic.save(callback);
}

exports.createTopic = createTopic;//增
exports.increasePVCountBy = increasePVCountBy;

exports.getAllTopics = getAllTopics;
exports.getPublishedTopics = getPublishedTopics;
exports.getNewTopics = getNewTopics;
exports.getCategoryTopics = getCategoryTopics;
exports.getTagTopics = getTagTopics;

exports.saveCover = saveCover;//改
exports.saveTitle = saveTitle;//改
exports.saveCategory = saveCategory;//改

exports.publishTopic = publishTopic;
exports.deleteTopic = deleteTopic;//删

exports.getTopicById = getTopicById;//查
exports.getPublishedTopicById = getPublishedTopicById;//查
exports.getTopicsByIdsSorted = getTopicsByIdsSorted;
exports.getPublishedTopics2 = getPublishedTopics2;

exports.addTag = addTag;
exports.removeTag = removeTag;