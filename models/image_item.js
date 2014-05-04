/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/8/13
 * Time: 7:19 PM
 * To change this template use File | Settings | File Templates.
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

module.exports = mongoose.model('ImageItem', {
  type: { type: String, default: 'IMAGE'},
  topic_id: ObjectId,
  prev_item: { type: { type: String }, id: ObjectId },
  next_item: { type: { type: String }, id: ObjectId },
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },

  url: String,
  title: String,
  quote: String,
  description: String,
  qiniuId: String
});