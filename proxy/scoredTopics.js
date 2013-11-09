/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 11/6/13
 * Time: 8:56 PM
 * To change this template use File | Settings | File Templates.
 */
var Fiber = require('fibers');
var models = require('../models');
var ScoredTopicModel = models.ScoredTopicModel;
var Topic = require('../proxy').Topic
var ComputeTopicScore = require('../offlineProcess/scoreTopics');

/**
 * 获取人气总结
 *
 */


/*
  score less than 20
  here has a sort: then after counting the time yinzi. the sort maybe faster.
* */

 function getHotScoredTopics(callback) {
  ScoredTopicModel.find({"score" : {"$lt" : 20}}, {"_id" : 1, "title": 1, "cover_url": 1, "description" : 1, "author_name" : 1,
    "author_id" : 1, "PV_count" : 1, "create_at": 1, "update_at": 1, "publishDate":1, "FVCount" :1, "score": 1})
    .sort("-score")
    .exec(callback)

}


/*
 score more than or equal 20
* */
function getGoodScoredTopics(callback){
  ScoredTopicModel.find({"score" : {"$gte" : 20}}, {"_id" : 1, "title": 1, "cover_url": 1, "description" : 1, "author_name" : 1,
    "author_id" : 1, "PV_count" : 1, "create_at": 1, "update_at": 1, "publishDate":1, "FVCount" :1, "score": 1})
    .sort("-score")
    .exec(callback)
}

/*

 remove the current all the topics,
 recompute all the topics from topics collection. and store them.
 */
function updateScoredTopics(callback){



  ScoredTopicModel.find(function(err, docs){
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
      //console.log(topics);

      for(var i = 0 ; i < topics.length; i++){
        var scoredTopic = new ScoredTopicModel();
        scoredTopic._id = topics[i]._id;
        scoredTopic.title = topics[i].title;
        scoredTopic.cover_url = topics[i].cover_url;
        scoredTopic.description = topics[i].description;
        scoredTopic.author_name = topics[i].author_name;
        scoredTopic.author_id = topics[i].author_id;
        scoredTopic.PV_count = topics[i].PV_count;
        scoredTopic.create_at = topics[i].create_at;
        scoredTopic.update_at = topics[i].update_at;
        scoredTopic.publishDate = topics[i].publishDate;
        scoredTopic.FVCount = topics[i].FVCount;
        scoredTopic.score = ComputeTopicScore.traditionalScore(scoredTopic.PV_count, scoredTopic.FVCount);
        //insert into the hot topics collection.
        scoredTopic.save(function(err){
          if(err){console.log(err); return;
          }
          //console.log("scored topic save success!");
        });
      }
      callback(false, topics.length);
    })

  })

}

exports.getHotScoredTopics = getHotScoredTopics;
exports.getGoodScoredTopics = getGoodScoredTopics;
exports.updateScoredTopics = updateScoredTopics;


