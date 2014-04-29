var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.ObjectId;

//todo: image
var UserSchema = new Schema({
  loginName: {type: String, unique: true},
  birthday: String,
  gender: String,
  password: String,
  email: {type: String, unique: true},
  url: String,
  description: String,
  personalSite: String,
  active: Boolean,

  retrieve_time: Number,
  retrieve_key: String,

  //topics array
  topics: [ObjectId],
  topicCount: {type: Number, default: 0},
  PVCount: {type: Number, default: 0},

  items: [ObjectId],

  //support user likes
  favourite: {type: Number, default: 0},
  favouriteList: [ObjectId], //liked by someone
  likeList: [ObjectId], //like some one

  //the topics that user like
  FVTopicList: [ObjectId],

  //topic creation task
  TopicTaskList: [ObjectId] // suggestion task

});

mongoose.model('User', UserSchema);