/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/8/13
 * Time: 3:04 PM
 * To change this template use File | Settings | File Templates.
 */
var async = require('async');

var TopicModel = require('../models').TopicModel;

/**
 * 查找策展
 * @param topicId
 * @param callback
 */
function getTopicById(topicId, callback) {
  TopicModel.findById(topicId, callback);
}

exports.getTopicById = getTopicById;//查