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
var Topic = require('./proxy').Topic;

function _update() {
  async.auto({
    topics: function (callback) {
      Topic.getAllTopics(function (err, topics) {
        if (err) {
          return callback(err);
        }
        callback(null, topics);
      });
    },
    countTags: ['topics', _countTags],
    calcTags: ['countTags', _calcTags],
    countAuthors: ['topics', _countAuthors],
    calcAuthors: ['countAuthors', _calcAuthors]
  }, function (err) {
    if (err) {
      return console.error(err.stack);
    }
  });
}

function _countTags(callback, results) {
  var topicCounts = {};
  var categories = {};
  var authorIds = {};
  var relatives = {};
  for (var i in results.topics) {
    var topic = results.topics[i];
    for (var j = 0; j < topic.tags.length; j++) {
      var tagText = topic.tags[j];

      topicCounts[tagText] = topicCounts[tagText] || 0;
      topicCounts[tagText]++;

      categories[tagText] = categories[tagText] || {};
      categories[tagText][topic.category] = categories[tagText][topic.category] || 0;
      categories[tagText][topic.category]++;

      authorIds[tagText] = authorIds[tagText] || {};
      authorIds[tagText][topic.author_id] = authorIds[tagText][topic.author_id] || 0;
      authorIds[tagText][topic.author_id]++;

      relatives[tagText] = relatives[tagText] || {};
      for (var k = 0; k < topic.tags.length; k++) {
        var tagText2 = topic.tags[k];
        if (tagText != tagText2) {
          relatives[tagText][tagText2] = relatives[tagText][tagText2] || 0;
          relatives[tagText][tagText2]++;
        }
      }
    }
  }
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
      authorIds: tempAuthorIds.slice(0, 7),
      tags: tempTags.slice(0, 13)
    };
  }
  Common.Tags = tempCommonTags;
  callback(null);
}

function _countAuthors(callback, results) {
  var tempAuthorPVCount = {};
  var tempAuthorCategories = {};
  results.topics.forEach(function (topic) {
    tempAuthorPVCount[topic.author_name] = tempAuthorPVCount[topic.author_name] || 0;
    tempAuthorPVCount[topic.author_name] += topic.PV_count;

    var categories = tempAuthorCategories[topic.author_name]
      = tempAuthorCategories[topic.author_name] || {};
    categories[topic.category] = categories[topic.category] || 0;
    categories[topic.category]++;
  });
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

function start() {
  Topic.updateNewTopics();
  Topic.updateTopicSiteCount();
  _routine();

  setInterval(_routine, 60 * 1000);
}

exports.start = start;