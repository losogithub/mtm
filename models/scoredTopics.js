/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 11/8/13
 * Time: 2:03 PM
 * To change this template use File | Settings | File Templates.
 */
/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/8/13
 * Time: 1:21 PM
 * To change this template use File | Settings | File Templates.
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
var Schema = mongoose.Schema;

var TopicSchema = new Schema({
  title: String,
  cover_url: String,
  description: String,
  author_name: String,
  author_id: ObjectId,
  PV_count: { type: Number, default: 0 },
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },
  publishDate: Date,
  FVCount : {type: Number, default:0},
  score: {type: Number, default: 0}
});


exports.ScoredTopicModel= mongoose.model('ScoredTopic', TopicSchema, 'scoredTopics');

/* the left one*/
exports.RecentHotTopicModel= mongoose.model('ScoredTopic', TopicSchema, 'recentHotTopics');
/* the right side one */
exports.RealGoodTopicModel= mongoose.model('ScoredTopic', TopicSchema, 'realGoodTopics');
