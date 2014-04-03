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
  TopicModel.find({ publishDate: { $exists: true } })
    //.sort('-_id')
    .exec(callback);
}

function getCategoryTopics(category, callback) {
  if (category == '未分类') {
    TopicModel.find({
      publishDate: { $exists: true },
      category: { $not: { $in: topList.CATEGORIES_ARRAY } }
    })
      .exec(callback);
  } else {
    TopicModel.find({ publishDate: { $exists: true }, category: category })
      .exec(callback);
  }
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

      topList.newTopics = topics;

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
      console.log(err);
      return;
    }
    if (!topics) {
      return;
    }

    for (var i = 0; i < topics.length; i++) {
      topics[i].score = _traditionalScore(topics[i].PV_count, topics[i].FVCount);
    }

    console.log("更新热门策展");
    topList.classicTopics = topics.sort(_scoreCompare).slice(0, 240);

    var authorMap = {};
    for (var i = 0; i < topics.length; i++) {
      topics[i].score = _newHotScore(topics[i].score, topics[i].publishDate, topics[i].update_at);
      if (!authorMap[topics[i].author_id]) {
        authorMap[topics[i].author_id] = { score: 0 };
      }
      authorMap[topics[i].author_id].score += topics[i].score;
    }
    topList.hotTopics = topics.sort(_scoreCompare).slice(0, 240);

    var authorScore = [];
    for (var id in authorMap) {
      authorScore.push({ id: id, score: authorMap[id].score });
    }
    authorScore.sort(function (a, b) {
      return (b.score - a.score);
    });
    var authorIds = [];
    var hotAuthorScore = authorScore.slice(0, 17);
    for (var i in hotAuthorScore) {
      authorIds.push(hotAuthorScore[i].id);
    }
    User.getUserByIds(authorIds, function (err, authors) {
      for (var i in authors) {
        authors[i].score = authorMap[authors[i]._id].score;
      }
      authors.sort(function (a, b) {
        return (b.score - a.score);
      });
      topList.hotAuthors = authors;
    });
  });
}

function updateCategoryTopics() {
  for (var category in topList.CATEGORIES) {
    (function (category) {
      getCategoryTopics(category, function (err, topics) {
        if (err) {
          console.log(err);
          return;
        }
        if (!topics) {
          return;
        }

        for (var i = 0; i < topics.length; i++) {
          topics[i].score = _traditionalScore(topics[i].PV_count, topics[i].FVCount);
        }

        var authorMap = {};
        for (var i = 0; i < topics.length; i++) {
          topics[i].score = _newHotScore(topics[i].score, topics[i].publishDate, topics[i].update_at);
          if (!authorMap[topics[i].author_id]) {
            authorMap[topics[i].author_id] = { score: 0 };
          }
          authorMap[topics[i].author_id].score += topics[i].score;
        }
        topList.categoryTopics[category] = topics.sort(_scoreCompare).slice(0, 240);

        var authorScore = [];
        for (var id in authorMap) {
          authorScore.push({ id: id, score: authorMap[id].score });
        }
        authorScore.sort(function (a, b) {
          return (b.score - a.score);
        });
        var authorIds = [];
        var hotAuthorScore = authorScore.slice(0, 17);
        for (var i in hotAuthorScore) {
          authorIds.push(hotAuthorScore[i].id);
        }
        User.getUserByIds(authorIds, function (err, authors) {
          for (var i in authors) {
            authors[i].score = authorMap[authors[i]._id].score;
          }
          authors.sort(function (a, b) {
            return (b.score - a.score);
          });
          topList.categoryAuthors[category] = authors;
        });
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
exports.updateNewTopics = updateNewTopics;
exports.saveTopic = saveTopic;//改
exports.saveCategory = saveCategory;//改
exports.publishTopic = publishTopic;
exports.deleteTopic = deleteTopic;//删
exports.getTopicById = getTopicById;//查
exports.getTopicsByIdsSorted = getTopicsByIdsSorted;
exports.getPublishedTopics = getPublishedTopics;


exports.topList = topList = {
  CATEGORIES: {
    '未分类': 1,
    '娱乐': 1,
    '科技': 1,
    '新闻': 1,
    '时尚': 1,
    '生活': 1,
    '幽默': 1,
    '文化': 1,
    '商业': 1,
    '体育': 1
  },
  CATEGORIES_ARRAY: [
    '娱乐',
    '科技',
    '新闻',
    '时尚',
    '生活',
    '幽默',
    '文化',
    '商业',
    '体育'
  ],//不能有“未分类”！！！
  categoryAuthors: {},
  categoryTopics: {}
};
exports.updateHotTopics = updateHotTopics;
exports.updateCategoryTopics = updateCategoryTopics;