/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/8/13
 * Time: 1:21 PM
 * To change this template use File | Settings | File Templates.
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

module.exports = mongoose.model('Topic', {
  title: String,
  cover_url: String,
  description: String,
  author_id: ObjectId,
  author_name: String,
  item_count: { type: Number, default: 0 },
  PV_count: { type: Number, default: 0 },
  void_item_id: ObjectId,
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },
  draft: Boolean,
  publishDate: Date,
  FVCount : {type: Number, default:0},
  FVList:[ObjectId ]
});