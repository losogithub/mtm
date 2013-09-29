/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/8/13
 * Time: 7:19 PM
 * To change this template use File | Settings | File Templates.
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

module.exports = mongoose.model('TextItem', {
  type: { type: String, default: 'TEXT'},
  topic_id: ObjectId,
  prev_item: { type: { type: String }, id: ObjectId },
  next_item: { type: { type: String }, id: ObjectId },
  create_at: { type: Date, default: new Date() },
  update_at: { type: Date, default: new Date() },

  text: String
});