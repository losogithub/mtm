/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 4/12/14
 * Time: 4:59 PM
 * To change this template use File | Settings | File Templates.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.ObjectId;

//todo: image
var TagSchema = new Schema({
  text: { type: String, unique: true },

  followers: [ObjectId],
  followerCount: { type: Number, default: 0 }
});

exports.TagModel = mongoose.model('Tag', TagSchema);