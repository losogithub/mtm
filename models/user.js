var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.ObjectId;

//todo: image
var UserSchema = new Schema({
  name: {type: String, index: true},
  loginName: {type: String, unique: true},
  birthday: {type: String},
  gender: {type: String},
  password: {type: String},
  email: {type: String, unique: true},
  url: {type: String},
  description: {type: String},
  personalSite: {type: String},
  active: {type: Boolean, default: true},

  retrieve_time: {type: Number},
  retrieve_key: {type: String},

  //topics array
  topics: [ObjectId ],
  topicCount: {type: Number, default: 0},
  pageviewCount: {type: Number, default: 0},

  //support user likes
  favourite: {type: Number, default: 0},
  favouriteList: [ObjectId], //liked by someone
  likeList: [ObjectId], //like some one

  //the topics that user like
  FVTopicList: [ObjectId]

});

mongoose.model('User', UserSchema);