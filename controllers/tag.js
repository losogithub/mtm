/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 4/12/14
 * Time: 11:38 PM
 * To change this template use File | Settings | File Templates.
 */

var async = require('async');

var Common = require('../common');
var Topic = require('../proxy').Topic;
var User = require('../proxy').User;

var topicsPerPage = 12;

function showTag(req, res, next) {
  var tagText = req.params.tagText;
  var tag = Common.Tags[tagText];
  if (!tag) {
    return next(new Error(404));
  }
  async.auto({
    topics: function (callback) {
      Topic.getTagTopics(tagText, function (err, topics) {
        if (err) {
          return callback(err);
        }
        callback(null, topics);
      });
    },
    authors: function (callback) {
      User.getUserByIds(tag.authorIds, function (err, authors) {
        if (err) {
          return callback(err);
        }
        authors.sort(function (a, b) {
          return (tag.authorWeights[b._id].score - tag.authorWeights[a._id].score);
        });
        callback(null, authors);
      });
    }
  }, function (err, results) {
    if (err) {
      return next(err);
    }
    var authors = results.authors;
    var topics = results.topics;
    var currentPage = parseInt(req.query.page) || 1;

    var tagTopicsPage = topics.slice((currentPage - 1) * topicsPerPage, currentPage * topicsPerPage);
    var totalPages = Math.ceil(topics.length / topicsPerPage);
    res.render('tag/tag', {
      pageType: 'TAG',
      title: tagText,
      tag: tagText,
      category: tag.category,
      topicCount: Common.TopList.categoryTopicCount[tag.category],
      totalTopicCount: Common.TopList.totalTopicCount,
      categoryTopicCount: Common.TopList.categoryTopicCount,
      tags: tag.tags,
      Tags: Common.Tags,
      totalPage: totalPages,
      currentPage: currentPage,
      authors: authors,
      AuthorCategoryList: Common.AuthorCategoryList,
      topics: tagTopicsPage,
      Topic: Common.Topic
    });
  });
}

exports.showTag = showTag;