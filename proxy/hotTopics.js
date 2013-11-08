/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 11/6/13
 * Time: 8:56 PM
 * To change this template use File | Settings | File Templates.
 */

var models = require('../models');
var HotTopicModel = models.HotTopicModel;
var Topic = require('../proxy').Topic
var ScoreTopics = require('../offlineProcess/scoreTopics');

/**
 * 获取人气总结
 * todo: get the first 700 topics
 */

var limitedNumber = 600;
function getHotTopics(callback) {
  HotTopicModel.find()
    .sort('score').limit(limitedNumber)
    .exec(callback);
}


/*

 remove the current all the topics,
 recompute all the topics from topics collection. and store them.
 */
function updateHotTopics(callback){

  HotTopicModel.find(function(err, docs){
    if(err){ console.log(err); return }
    //remove old one
    //console.log("remove each");
    docs.forEach(function(doc){
      doc.remove();
    })

    //get from Topics collection
    Topic.getAllTopics(function(err, topics){
      if(err){console.log(err); next(err);}
      //console.log("get all topics from topics collection");
      topics.forEach(function(topic){
        // create hotTopic document
        var hotTopic = new HotTopicModel();
        hotTopic._id = topic._id;
        hotTopic.title = topic.title;
        hotTopic.cover_url = topic.cover_url;
        hotTopic.description = topic.description;
        hotTopic.author_name = topic.author_name;
        hotTopic.author_id = topic.author_id;
        hotTopic.PV_count = topic.PV_count;
        hotTopic.create_at = topic.create_at;
        hotTopic.update_at = topic.update_at;
        hotTopic.publishDate = topic.publishDate;
        hotTopic.FVCount = topic.FVCount;
        hotTopic.scope = ScoreTopics.hotScore(hotTopic.PV_count, hotTopic.FVCount, hotTopic.create_at, hotTopic.update_at);
        //insert into the hot topics collection.
        hotTopic.save(function(err){
          if(err){console.log(err); return;}
        });
      })

      //after saved all
      callback();

    })

  })

}

exports.getHotTopics = getHotTopics;
exports.updateHotTopics = updateHotTopics;


