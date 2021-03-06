/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 10/10/13
 * Time: 1:09 AM
 * To change this template use File | Settings | File Templates.
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

module.exports = mongoose.model('VideoItem', {
  type: { type: String, default: 'VIDEO'},
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },
  authorId: ObjectId,
  topicId: ObjectId,

  url: String,
  vid: String,
  cover: String,
  title: String,
  description: String
});