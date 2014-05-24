/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 5/25/14
 * Time: 12:04 AM
 * To change this template use File | Settings | File Templates.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

module.exports = mongoose.model('Topic2', {
  text: String,
  authorId: ObjectId,
  PVCount: { type: Number, default: 0 },
  createDate: { type: Date, default: Date.now }
});