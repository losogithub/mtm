/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 5/18/14
 * Time: 3:08 AM
 * To change this template use File | Settings | File Templates.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

module.exports = mongoose.model('Spit', {
  itemType: String,
  itemId: ObjectId,
  text: String,
  like: { type: Number, default: 0 },
  createDate: { type: Date, default: Date.now }
});