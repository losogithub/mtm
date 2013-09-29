/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/27/13
 * Time: 11:42 PM
 * To change this template use File | Settings | File Templates.
 */
var Topic = require('../proxy').Topic;

var index = function (req, res, next) {
  Topic.getHotTopics(function (topics) {
    var topicsData = [];
    topics.forEach(function (topic) {
      topicsData.push({
        id: topic._id,
        title: topic.title,
        author: topic.author_id,
        PVCount: topic.PV_count
      });
    });
    res.render('index', {
      title: 'mtm[我设计的信息。策展平台]',
      css: ['/stylesheets/index.css'],
      js: ['/javascripts/index.js'],
      index: 1,
      hot: topicsData
    });
  });
}

exports.index = index;