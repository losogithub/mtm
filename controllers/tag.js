/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 4/12/14
 * Time: 11:38 PM
 * To change this template use File | Settings | File Templates.
 */

var async = require('async');

var Common = require('../common');
var Tags = Common.tags;
var TopList = Common.topList;
var AuthorCategoryList = Common.authorCategoryList;
var Topic = require('../proxy').Topic;
var User = require('../proxy').User;

var topicsPerPage = 12;

function showTag(req, res, next) {
  var tagText = req.params.tagText;
  var tag;
  for (var i in Tags) {
    if (tagText == Tags[i].text) {
      tag = Tags[i];
      break;
    }
  }
  if (!tag) {
    return next(new Error(404));
  }
  async.auto({
    topics: function (callback) {
      Topic.getTagTopics(tag.text, function (err, topics) {
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
      title: tag.text,
      tag: tag.text,
      category: tag.category,
      topicCount: TopList.categoryTopicCount[tag.category],
      totalTopicCount: TopList.totalTopicCount,
      categoryTopicCount: TopList.categoryTopicCount,
      tags: tag.tags,
      totalPage: totalPages,
      currentPage: currentPage,
      authors: authors,
      authorCategoryList: AuthorCategoryList,
      topics: tagTopicsPage
    });
  });
}

exports.showTag = showTag;