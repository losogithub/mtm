/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 11/8/13
 * Time: 2:31 PM
 * To change this template use File | Settings | File Templates.
 */

var RecentHotTopicModel = require('../models').RecentHotTopicModel;
var ScoredTopic = require('../proxy').ScoredTopic;
/**
 * 获取人气总结
 */
function getRecentHotTopics(callback) {
  RecentHotTopicModel.find()
    .sort("-score")
    .exec(callback);
}

function updateRecentHotTopics(documents, callback){
  RecentHotTopicModel.find(function(err, topics){
    if(err){console.log(err); return;}
    topics.forEach(function(topic){
      topic.remove();
    })
  //insert all the new documents
    documents.forEach(function(topic){
      var recentHotTopic = new RecentHotTopicModel();
      recentHotTopic._id = topic._id; //copy the id is necessary
      recentHotTopic.title = topic.title;
      recentHotTopic.cover_url = topic.cover_url;
      recentHotTopic.description = topic.description;
      recentHotTopic.author_name = topic.author_name;
      recentHotTopic.author_id = topic.author_id;
      recentHotTopic.PV_count = topic.PV_count;
      recentHotTopic.create_at = topic.create_at;
      recentHotTopic.update_at = topic.update_at;
      recentHotTopic.publishDate = topic.publishDate;
      recentHotTopic.FVCount = topic.FVCount;
      recentHotTopic.score = topic.score;
      recentHotTopic.save(function(err){
        if(err){console.log(" recent hottopic save err"); return;}
      });//save
    });//forEach
    return callback(false, "saved");
  });//find
}

/*
function copyFromScoredTopics(callback){
 RecentHotTopicModel.find(function(err, topics){
 if(err){console.log(err); return;}
 topics.forEach(function(topic){
 topic.remove();
 })

 ScoredTopic.getHotScoredTopics(function(err, newTopics){
      if(err){console.log(err); next(err);}
 newTopics.forEach(function(topic){
 var oldTopic = new RecentHotTopicModel();
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
 })
  })
}

*/
exports.getRecentHotTopics = getRecentHotTopics;
exports.updateRecentHotTopics = updateRecentHotTopics;
//exports.copyFromScoredTopics = copyFromScoredTopics;