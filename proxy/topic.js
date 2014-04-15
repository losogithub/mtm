/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/8/13
 * Time: 3:04 PM
 * To change this template use File | Settings | File Templates.
 */
var async = require('async');
var EventProxy = require('eventproxy');

var Common = require('../common');
var models = require('../models');
var TopicModel = models.TopicModel;
var Item = require('./item');
var User = require('./user');

/**
 * 新建策展
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
 * 获取一个策展的所有条目
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
 * 获取所有策展
 */
function getAllTopics(callback) {
  TopicModel.find({ publishDate: { $exists: true } }, callback);
}

function getCategoryTopics(category, callback) {
  if (category == '未分类') {
    TopicModel.find({
      publishDate: { $exists: true },
      category: { $not: { $in: Common.CATEGORY_LIST } }
    }, callback);
  } else {
    TopicModel.find({ publishDate: { $exists: true }, category: category }, callback);
  }
}

function getTagTopics(tagText, callback) {
  TopicModel.find({ publishDate: { $exists: true }, tags: tagText }, callback);
}

/**
 * 获取最新策展
 */
function updateNewTopics(callback) {
  callback = callback || function () {
  };

  TopicModel.find({ publishDate: { $exists: true } })
    .sort('-update_at')
    .limit(240)
    .exec(function (err, topics) {
      if (err) {
        return callback(err);
      }

      Common.TopList.newTopics = topics;

      callback(topics);
    });
}

/**
 * 保存策展
 * @param authorId
 * @param topicId
 * @param title
 * @param coverUrl
 * @param description
 * @param callback
 */
function saveTopic(topic, title, coverUrl, description, callback) {
  callback = callback || function () {
  };

  topic.title = title;
  topic.cover_url = coverUrl;
  topic.description = description;
  topic.update_at = Date.now();
  topic.save(function (err) {
    if (err) {
      return callback(err);
    }
    callback(null, topic);
    updateNewTopics();
  });
}

function saveCategory(topic, category, callback) {
  callback = callback || function () {
  };

  topic.category = category;
  topic.save(function (err) {
    if (err) {
      return callback(err);
    }
    callback(null, topic);
    updateCategoryTopics();
  });
}

function publishTopic(topic, callback) {
  callback = callback || function () {
  };

  if (!topic.title) {
    return callback(new Error(400));
  }
  topic.update_at = Date.now();
  topic.publishDate = Date.now();
  topic.save(function (err) {
    if (err) {
      return callback(err);
    }
    callback(null, topic);
    updateNewTopics();
  });
}

/**
 * 删除策展
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
    updateNewTopics();
  });
}

/**
 * 查找策展
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
  topic.save(function (err) {
    if (err) {
      return callback(err);
    }
    callback(null);
  });
}

function removeTag(topic, tagText, callback) {
  callback = callback || function () {
  };

  for (var i = 0; i < topic.tags.length; i++) {
    if (tagText == topic.tags[i]) {
      topic.tags.splice(i, 1);
      break;
    }
  }
  topic.save(function (err) {
    if (err) {
      return callback(err);
    }
    callback(null);
  });
}

/**
 * 下面是更新top列表的方法
 */

function _traditionalScore(pv, likes) {
  return pv / 100 + likes;
}

function _newHotScore(score, publishDate, updateDate) {
  var publish = (1000 * 60 * 60 * 24) / ((Date.now() - publishDate) || 1);
  Math.min(publish, 1);
  var update = (1000 * 60 * 60) / ((Date.now() - updateDate) || 1);
  Math.min(update, 1);
  return score + 100 * publish + 100 * update;
}

function _scoreCompare(top1, top2) {
  return (top2.score - top1.score);
}

function updateHotTopics() {
  getAllTopics(function (err, topics) {
    if (err) {
      return console.error(err.stack);
    }
    if (!topics) {
      return;
    }

    for (var i in topics) {
      topics[i].score = _traditionalScore(topics[i].PV_count, topics[i].FVCount);
    }

    console.log("更新热门策展");
    Common.TopList.classicTopics = topics.sort(_scoreCompare).slice(0, 240);

    var authorMap = {};
    var tagMap = {};
    for (var i in topics) {
      topics[i].score = _newHotScore(topics[i].score, topics[i].publishDate, topics[i].update_at);
      authorMap[topics[i].author_id] = authorMap[topics[i].author_id] || { score: 0 };
      authorMap[topics[i].author_id].score += topics[i].score;
      for (var j = 0; j < topics[i].tags.length; j++) {
        tagMap[topics[i].tags[j]] = tagMap[topics[i].tags[j]] || { score: 0 };
        tagMap[topics[i].tags[j]].score += topics[i].score;
      }
    }
    Common.TopList.hotTopics = topics.sort(_scoreCompare).slice(0, 240);
    Common.TopList.totalTopicCount = topics.length;

    var authorIds = [];
    for (var id in authorMap) {
      authorIds.push(id);
    }
    authorIds.sort(function (a, b) {
      return (authorMap[b].score - authorMap[a].score);
    });
    var hotAuthorIds = authorIds.slice(0, 17);
    User.getUserByIds(hotAuthorIds, function (err, authors) {
      authors.sort(function (a, b) {
        return (authorMap[b._id].score - authorMap[a._id].score);
      });
      Common.TopList.hotAuthors = authors;
    });

    var tagTexts = [];
    for (var text in tagMap) {
      tagTexts.push(text);
    }
    tagTexts.sort(function (a, b) {
      return (tagMap[b].score - tagMap[a].score);
    });
    Common.TopList.hotTags = tagTexts.slice(0, 7);
  });
}

function updateCategoryTopics() {
  for (var category in Common.CATEGORIES) {
    (function (category) {
      getCategoryTopics(category, function (err, topics) {
        if (err) {
          return console.error(err.stack);
        }
        if (!topics) {
          return;
        }

        for (var i in topics) {
          topics[i].score = _traditionalScore(topics[i].PV_count, topics[i].FVCount);
        }

        var authorMap = {};
        var tagMap = {};
        for (var i in topics) {
          topics[i].score = _newHotScore(topics[i].score, topics[i].publishDate, topics[i].update_at);
          authorMap[topics[i].author_id] = authorMap[topics[i].author_id] || { score: 0 };
          authorMap[topics[i].author_id].score += topics[i].score;
          for (var j = 0; j < topics[i].tags.length; j++) {
            tagMap[topics[i].tags[j]] = tagMap[topics[i].tags[j]] || { score: 0 };
            tagMap[topics[i].tags[j]].score += topics[i].score;
          }
        }
        Common.TopList.categoryTopics[category] = topics.sort(_scoreCompare).slice(0, 240);
        Common.TopList.categoryTopicCount[category] = topics.length;

        var authorIds = [];
        for (var id in authorMap) {
          authorIds.push(id);
        }
        authorIds.sort(function (a, b) {
          return (authorMap[b].score - authorMap[a].score);
        });
        var hotAuthorIds = authorIds.slice(0, 17);
        User.getUserByIds(hotAuthorIds, function (err, authors) {
          authors.sort(function (a, b) {
            return (authorMap[b._id].score - authorMap[a._id].score);
          });
          Common.TopList.categoryAuthors[category] = authors;
        });

        var tagTexts = [];
        for (var text in tagMap) {
          tagTexts.push(text);
        }
        tagTexts.sort(function (a, b) {
          return (tagMap[b].score - tagMap[a].score);
        });
        Common.TopList.categoryTags[category] = tagTexts.slice(0, 7);
      });
    })(category);
  }
}

exports.createTopic = createTopic;//增
exports.getContents = getContents;//查
exports.increaseItemCountBy = increaseItemCountBy;
exports.increasePVCountBy = increasePVCountBy;
exports.getAllTopics = getAllTopics;
exports.getCategoryTopics = getCategoryTopics;
exports.getTagTopics = getTagTopics;
exports.saveTopic = saveTopic;//改
exports.saveCategory = saveCategory;//改
exports.publishTopic = publishTopic;
exports.deleteTopic = deleteTopic;//删
exports.getTopicById = getTopicById;//查
exports.getTopicsByIdsSorted = getTopicsByIdsSorted;
exports.getPublishedTopics = getPublishedTopics;
exports.addTag = addTag;
exports.removeTag = removeTag;

exports.updateNewTopics = updateNewTopics;
exports.updateHotTopics = updateHotTopics;
exports.updateCategoryTopics = updateCategoryTopics;