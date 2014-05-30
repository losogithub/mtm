/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 5/25/14
 * Time: 12:56 AM
 * To change this template use File | Settings | File Templates.
 */

var async = require('async');

var Topic2 = require('../models').Topic2;
var User = require('./user');

function createTopic2(text, authorId, callback) {
  callback = callback || function () {
  };

  new Topic2({
    text: text,
    authorId: authorId
  }).save(function (err, topic2) {
      callback(err, topic2);
    });
}

function getTopic2s(callback) {
  Topic2.find()
    .sort('-_id')
    .exec(callback);
}

function getTopic2ByText(text, callback) {
  Topic2.findOne({
    text: text
  }, callback);
}

function getTopic2sByRegExp(regExp, callback) {
  Topic2.find({
    text: regExp
  }, callback);
}

function getTopic2ById(_id, callback) {
  Topic2.findById(_id, callback);
}

function increasePVCountBy(topic, increment, callback) {
  return topic.update({$inc: {PV_count: increment}}, callback);
}

exports.createTopic2 = createTopic2;
exports.getTopic2s = getTopic2s;
exports.getTopic2ByText = getTopic2ByText;
exports.getTopic2sByRegExp = getTopic2sByRegExp;
exports.getTopic2ById = getTopic2ById;
exports.increasePVCountBy = increasePVCountBy;