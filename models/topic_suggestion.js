var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SuggestionTopicSchema = new Schema({
  content: {type: String, unique: true} ,
  proposer:String
});

var SuggestionTopicLogSchema = new Schema({
    content: {type: String, unique: true} ,
    proposer:String,
    taker:String
});


exports.TopicSuggestionModel = mongoose.model('SuggestionTopic', SuggestionTopicSchema);
exports.SuggestionTopicLogModel = mongoose.model('SuggestionTopicLog', SuggestionTopicLogSchema);