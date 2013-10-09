var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

module.exports = mongoose.model('CiteItem', {
  type: { type: String, default: 'CITE'},
  topic_id: ObjectId,
  prev_item: { type: { type: String }, id: ObjectId },
  next_item: { type: { type: String }, id: ObjectId },
  create_at: { type: Date, default: new Date() },
  update_at: { type: Date, default: new Date() },

  cite: String,
  url: String,
  title: String,
  description: String
});