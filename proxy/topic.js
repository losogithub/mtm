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

  User.getUserById(authorId, function (err, user) {
    if (err) {
      return callback(err);
    }
    if (!user) {
      return callback(new Error(400));
    }

    var topic = new TopicModel();
    topic.author_id = authorId;
    topic.author_name = user.loginName;
    topic.save(function (err, topic) {
      callback(err, topic);
    });
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
  topic.save(function (err, topic) {
    callback(err, topic);
  });
}

function saveTitle(topic, title, description, callback) {
  topic.title = title;
  topic.description = description;
  topic.update_at = Date.now();
  topic.save(function (err, topic) {
    callback(err, topic);
  });
}

function saveCategory(topic, category, callback) {
  topic.category = category;
  topic.save(function (err, topic) {
    callback(err, topic);
  });
}

function publishTopic(topic, callback) {
  if (!topic.title) {
    return callback(new Error(400));
  }
  topic.update_at = Date.now();
  topic.publishDate = Date.now();
  topic.save(function (err, topic) {
    callback(err, topic);
  });
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

function getAllTopicsByAuthorId(authorId, callback) {
  TopicModel.find({ author_id: authorId}, callback);
}

function getAllTopicsByAuthorIdSorted(authorId, opt, callback) {
  TopicModel.find({ author_id: authorId})
    .sort(opt)
    .exec(callback);
}

function getPublishedTopicsByAuthorIdSorted(authorId, opt, callback) {
  TopicModel.find({ author_id: authorId, publishDate: { $exists: true } })
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
  topic.save(function (err, topic) {
    callback(err, topic);
  });
}

function removeTag(topic, tagText, callback) {
  for (var i = 0; i < topic.tags.length; i++) {
    if (tagText == topic.tags[i]) {
      topic.tags.splice(i, 1);
      break;
    }
  }
  topic.save(function (err, topic) {
    callback(err, topic);
  });
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
exports.getAllTopicsByAuthorId = getAllTopicsByAuthorId;
exports.getAllTopicsByAuthorIdSorted = getAllTopicsByAuthorIdSorted;
exports.getPublishedTopicsByAuthorIdSorted = getPublishedTopicsByAuthorIdSorted;

exports.addTag = addTag;
exports.removeTag = removeTag;