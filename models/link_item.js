/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 10/26/13
 * Time: 12:24 AM
 * To change this template use File | Settings | File Templates.
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

module.exports = mongoose.model('LinkItem', {
  type: { type: String, default: 'LINK'},
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },

  url: String,
  title: String,
  snippet: String,
  src: String,
  description: String
});