/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 5/19/14
 * Time: 2:09 AM
 * To change this template use File | Settings | File Templates.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

module.exports = mongoose.model('Comment', {
  topicId: ObjectId,
  replyId: ObjectId,
  authorId: ObjectId,
  text: String,
  like: { type: Number, default: 0 },
  createDate: { type: Date, default: Date.now }
});