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
var downloadImage = require('../helper/downloadImage');
var qiniuPlugin = require('../helper/qiniu');

/**
 * 新建策展
 * @param userId
 * @param callback
 */
function createTopic(authorId, callback) {
  callback = callback || function () {
  };

  async.auto({
    user: function (callback) {
      User.getUserById(authorId, callback);
    },
    topics: function (callback) {
      getAllTopicsByAuthorId(authorId, callback);
    }
  }, function (err, results) {
    if (err) {
      return callback(err);
    }
    var user = results.user;
    if (!user) {
      return callback(new Error(400));
    }

    var topic = new TopicModel();
    topic.author_id = authorId;
    topic.author_name = user.loginName;
    var topics = results.topics;
    if (!topics.length) {
      topic.cover_url = 'http://shizier.qiniudn.com/533d3555d1178f3f783ad3e31400124490166';
      topic.title = '标题：这是您的第一篇策展，点击上方↑↑↑“图片”修改封面';
      topic.description = '描述：点击右侧→“铅笔按钮”修改标题、描述';
    }
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
  async.auto({
    qiniu: function (callback) {
      if (!coverUrl) {
        topic.cover_url = null;
        return callback();
      }
      downloadImage.downloadBase64Image(coverUrl, null, function (err, base64data) {
        var time = Date.now();
        topic.cover_url = "http://shizier.qiniudn.com/" + topic._id + time;
        qiniuPlugin.uploadToQiniu(base64data, topic._id.toString() + time, callback);
      });
    }
  }, function (err) {
    if (err) {
      return callback(err);
    }

    topic.update_at = Date.now();
    topic.save(function (err, topic) {
      callback(err, topic);
    });
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

function getTopicsById(topicIds, callback) {
  TopicModel.find({ _id: { $in: topicIds } }, callback);
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
exports.getTopicsById = getTopicsById;//查
exports.getPublishedTopicById = getPublishedTopicById;//查
exports.getAllTopicsByAuthorId = getAllTopicsByAuthorId;
exports.getAllTopicsByAuthorIdSorted = getAllTopicsByAuthorIdSorted;
exports.getPublishedTopicsByAuthorIdSorted = getPublishedTopicsByAuthorIdSorted;

exports.addTag = addTag;
exports.removeTag = removeTag;