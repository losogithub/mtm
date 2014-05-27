/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 5/27/14
 * Time: 12:54 PM
 * To change this template use File | Settings | File Templates.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

module.exports = mongoose.model('Message', {
  type: { type: String },
  ownerId: ObjectId,
  authorId: ObjectId,
  itemType: String,
  itemId: ObjectId,
  hasRead: Boolean,
  createDate: { type: Date, default: Date.now }
});