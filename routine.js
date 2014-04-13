/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 11/8/13
 * Time: 11:03 AM
 * To change this template use File | Settings | File Templates.
 */
var async = require('async');

var Common = require('./common');
var Tags = Common.tags;
var AuthorCategories = Common.authorCategories;
var Topic = require('./proxy').Topic;

function _updateTags() {
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
  var categories = {};
  var authorIds = {};
  var relatives = {};
  for (var i in results.topics) {
    var topic = results.topics[i];
    for (var j = 0; j < topic.tags.length; j++) {
      var tagText = topic.tags[j];

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
    categories: categories,
    authorIds: authorIds,
    relatives: relatives
  });
}

function _calcTags(callback, results) {
  var categories = results.countTags.categories;
  var authorIds = results.countTags.authorIds;
  var relatives = results.countTags.relatives;
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

    Tags.push({
      text: tagText,
      category: tempCategory,
      authorWeights: authorIds[tagText],
      authorIds: tempAuthorIds.slice(0, 17),
      tags: tempTags.slice(0, 7)
    });
  }
  callback(null);
}

function _countAuthors(callback, results) {
  for (var i in results.topics) {
    var topic = results.topics[i];

    AuthorCategories[topic.author_name] = AuthorCategories[topic.author_name] || {};
    AuthorCategories[topic.author_name][topic.category] = AuthorCategories[topic.author_name][topic.category] || 0;
    AuthorCategories[topic.author_name][topic.category]++;
  }
  callback(null);
}

function _calcAuthors(callback) {
  for (var author in AuthorCategories) {
    var categories = AuthorCategories[author]['categories'] = [];
    for (var category in AuthorCategories[author]) {
      categories.push(category);
    }
    categories.sort(function (a, b) {
      return AuthorCategories[author][b] - AuthorCategories[author][a];
    });
  }
  callback(null);
}

function _routine() {
  Topic.updateHotTopics();
  Topic.updateCategoryTopics();
  _updateTags();
}

function start() {
  Topic.updateNewTopics();
  _routine();

  setInterval(_routine, 60 * 1000);
}

exports.start = start;