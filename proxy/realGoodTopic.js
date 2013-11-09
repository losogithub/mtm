/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 11/9/13
 * Time: 2:41 PM
 * To change this template use File | Settings | File Templates.
 */
var RealGoodTopicModel = require('../models').RealGoodTopicModel;
var ScoredTopic = require('../proxy').ScoredTopic;

function getRealGoodTopics(callback) {
  RealGoodTopicModel.find()
    .exec(callback);
}

function copyFromScoredTopics(callback){
  RealGoodTopicModel.find(function(err, topics){
    if(err){console.log(err); return;}
    topics.forEach(function(topic){
      topic.remove();
    })

    ScoredTopic.getGoodScoredTopics(function(err, newTopics){
      if(err){console.log(err); next(err);}
      console.log("RealGoodTopics length:");
      console.log(newTopics.length);
      newTopics.forEach(function(topic){
        var oldTopic = new RealGoodTopicModel();
        oldTopic._id = topic._id; //copy the id is necessary
        oldTopic.title = topic.title;
        oldTopic.cover_url = topic.cover_url;
        oldTopic.description = topic.description;
        oldTopic.author_name = topic.author_name;
        oldTopic.author_id = topic.author_id;
        oldTopic.PV_count = topic.PV_count;
        oldTopic.create_at = topic.create_at;
        oldTopic.update_at = topic.update_at;
        oldTopic.publishDate = topic.publishDate;
        oldTopic.FVCount = topic.FVCount;
        oldTopic.score = topic.score;
        oldTopic.save(function(err){
          if(err){console.log("oldhottopic save err"); return;}
        });
      })

      return callback(false, newTopics);
    })
  })
}

exports.getRealGoodTopics = getRealGoodTopics;
exports.copyFromScoredTopics = copyFromScoredTopics;