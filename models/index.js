/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/8/13
 * Time: 2:06 PM
 * To change this template use File | Settings | File Templates.
 */
var mongoose = require('mongoose');
var config = require('../config');

mongoose.connect(config.db, function (err) {
  if (err) {
    console.error('connect to %s error: ', config.db, err.message);
    process.exit(1);
  }
});

exports.TopicModel = require('./topic');
exports.Topic2 = require('./topic2');
exports.ItemModels = {
  'LINK': require('./link_item'),
  'IMAGE': require('./image_item'),
  'VIDEO': require('./video_item'),
  'CITE': require('./cite_item'),
  'WEIBO': require('./weibo_item')
}
exports.Comment = require('./comment');
exports.Message = require('./message');

exports.User = require('./user');
exports.LoginToken = require('./loginToken');