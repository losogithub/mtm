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
  createAt: { type: Date, default: Date.now },
  retrieve_time: Number,
  retrieve_key: String,

  //topics array
  PVCount: {type: Number, default: 0},

  //collection
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