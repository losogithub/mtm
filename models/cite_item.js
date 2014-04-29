var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

module.exports = mongoose.model('CiteItem', {
  type: { type: String, default: 'CITE'},
  prev_item: { type: { type: String }, id: ObjectId },
  next_item: { type: { type: String }, id: ObjectId },
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },

  cite: String,
  url: String,
  title: String,
  description: String
});