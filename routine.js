/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 11/8/13
 * Time: 11:03 AM
 * To change this template use File | Settings | File Templates.
 */
var async = require('async');

var Common = require('./common');
var User = require('./proxy').User;
var TopicProxy = require('./proxy').Topic;
var Topic = require('./controllers/topic');
var Item = require('./proxy').Item;

function _updateRelatedTopics() {
  async.auto({
    topics: function (callback) {
      TopicProxy.getPublishedTopics(callback);
    },
    countTopics: ['topics', _countTopics]
  }, function (err) {
    if (err) {
      return console.error(err.stack);
    }

    console.log('_updateRelatedTopics done')
  });
}

function _countTopics(callback, results) {
  async.forEachSeries(results.topics, function (topic, callback) {
    setTimeout(function () {
      var temp = {};
      var temp2 = [];
      Common.Topic[topic._id] = Common.Topic[topic._id] || {};
      results.topics.forEach(function (topic2) {
        if (topic._id.equals(topic2._id)) {
          return;
        }
        var sameTagsCount = 0;
        topic.tags.forEach(function (tag) {
          topic2.tags.forEach(function (tag2) {
            if (tag == tag2) {
              sameTagsCount++;
            }
          });
        });
        temp2.push(topic2._id.toString());
        temp[topic2._id] = 100 * sameTagsCount
          + 10 * (topic.category == topic2.category ? 1 : 0)
          + (topic.author_id.equals(topic2.author_id) ? 1 : 0);
      });
      temp2.sort(function (a, b) {
        return temp[b] - temp[a];
      });
      Common.Topic[topic._id].relatedTopics = temp2;
      callback();
    }, 2000);
  }, callback);
}

function _update() {
  async.auto({
    topics: function (callback) {
      TopicProxy.getPublishedTopics(callback);
    },
    countTags: ['topics', _countTags],
    calcTags: ['countTags', _calcTags],
    countAuthors: ['topics', 'calcTags', _countAuthors],
    calcAuthors: ['countAuthors', _calcAuthors]
  }, function (err) {
    if (err) {
      return console.error(err.stack);
    }

    console.log('_update done')
  });
}

function _countTags(callback, results) {
  var topicCounts = {};
  var categories = {};
  var authorIds = {};
  var relatives = {};
  results.topics.forEach(function (topic) {
    topic.tags.forEach(function (tagText) {
      topicCounts[tagText] = topicCounts[tagText] || 0;
      topicCounts[tagText]++;

      categories[tagText] = categories[tagText] || {};
      categories[tagText][topic.category] = categories[tagText][topic.category] || 0;
      categories[tagText][topic.category]++;

      authorIds[tagText] = authorIds[tagText] || {};
      authorIds[tagText][topic.author_id] = authorIds[tagText][topic.author_id] || 0;
      authorIds[tagText][topic.author_id]++;

      relatives[tagText] = relatives[tagText] || {};
      topic.tags.forEach(function (tagText2) {
        if (tagText == tagText2) {
          return;
        }
        relatives[tagText][tagText2] = relatives[tagText][tagText2] || 0;
        relatives[tagText][tagText2]++;
      });
    });
  });
  callback(null, {
    topicCounts: topicCounts,
    categories: categories,
    authorIds: authorIds,
    relatives: relatives
  });
}

function _calcTags(callback, results) {
  var topicCounts = results.countTags.topicCounts;
  var categories = results.countTags.categories;
  var authorIds = results.countTags.authorIds;
  var relatives = results.countTags.relatives;
  var tempCommonTags = [];
  for (var tagText in categories) {
    var tempWeight = 0;
    var tempCategory = '未分类';
    for (var category in categories[tagText]) {
      if (categories[tagText][category] > tempWeight) {
        tempWeight = categories[tagText][category];
        tempCategory = category;
      }
    }

    var tempAuthorIds = [];
    for (var authorId in authorIds[tagText]) {
      tempAuthorIds.push(authorId);
    }
    tempAuthorIds.sort(function (a, b) {
      return authorIds[tagText][b] - authorIds[tagText][a];
    });

    var tempTags = [];
    for (var tagText2 in relatives[tagText]) {
      tempTags.push(tagText2);
    }
    tempTags.sort(function (a, b) {
      return relatives[tagText][b] - relatives[tagText][a];
    });

    tempCommonTags[tagText] = {
      category: tempCategory,
      topicCount: topicCounts[tagText],
      authorWeights: authorIds[tagText],
      authorIds: tempAuthorIds,//.slice(0, 7),
      tags: tempTags//.slice(0, 13)
    };
  }
  Common.Tags = tempCommonTags;
  callback(null);
}

function _countAuthors(callback, results) {
  var tempAuthorTopicCount = {};
  var tempAuthorPVCount = {};
  var tempAuthorCategories = {};
  results.topics.forEach(function (topic) {
    tempAuthorTopicCount[topic.author_name] = tempAuthorTopicCount[topic.author_name] || 0;
    tempAuthorTopicCount[topic.author_name] ++;
    tempAuthorPVCount[topic.author_name] = tempAuthorPVCount[topic.author_name] || 0;
    tempAuthorPVCount[topic.author_name] += topic.PV_count + Math.ceil(Math.log((Date.now() - topic.publishDate.getTime())/100000000 + 1) * 100);

    var categories = tempAuthorCategories[topic.author_name]
      = tempAuthorCategories[topic.author_name] || {};
    categories[topic.category] = categories[topic.category] || 0;
    categories[topic.category]++;
  });
  Common.AuthorTopicCount = tempAuthorTopicCount;
  Common.AuthorPVCount = tempAuthorPVCount;
  Common.AuthorCategories = tempAuthorCategories;
  callback(null);
}

function _calcAuthors(callback) {
  var tempAuthorCategoryList = {};
  for (var author in Common.AuthorCategories) {
    var categoryList = tempAuthorCategoryList[author] = [];
    for (var category in Common.AuthorCategories[author]) {
      categoryList.push(category);
    }
    categoryList.sort(function (a, b) {
      return Common.AuthorCategories[author][b] - Common.AuthorCategories[author][a];
    });
  }
  Common.AuthorCategoryList = tempAuthorCategoryList;
  callback(null);
}

function _routine() {
  Topic.updateHotTopics();
  Topic.updateCategoryTopics();
  _update();
}

/*
 * an array to store the visited user, to avoid multi-visit in one day.
 */
function _clearIP () {
  Common.TopicVisitedKeys = {};
  Common.SpitLikedKeys = {};
  Common.CommentLikedKeys = {};
}

function start() {
  Topic.updateNewTopics();
  Topic.updateTopicSiteCount();

  _routine();
  _updateRelatedTopics();

  setInterval(_routine, 60 * 1000);
  setInterval(_updateRelatedTopics, 60 * 60 * 1000);
  setInterval(_clearIP, 24 * 60 * 60 * 1000);
}

exports.start = start;