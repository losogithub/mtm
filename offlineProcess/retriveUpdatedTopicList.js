/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 11/8/13
 * Time: 11:03 AM
 * To change this template use File | Settings | File Templates.
 */
var async = require('async');
var NewTopic = require('../proxy').NewTopic
var RecentHotTopic = require('../proxy').RecentHotTopic;
var RealGoodTopic = require('../proxy').RealGoodTopic;


//two global variables
global.recentHotTopicsData = [];
global.realGoodTopicsData = [];
global.recentUpdatedTopicsData = [];


var funArray = [
  {fun: extractRecentHotTopics, delay: 60*1000}, //an hour
  {fun: extractRealGoodTopics, delay: 3*60*1000}, //3 hours
  {fun: extractUpdatedRecentTopics, delay: 60*1000} // 1 minute
];

function extractUpdatedRecentTopics(){

  //ensure it is empty.
  global.recentUpdatedTopicsData = [];

  NewTopic.getNewTopics(function(err, topics){
    if(err){next(err);}
    console.log("更新最新总结列表");
    console.log(topics.length);
    var newTopics = topics || [];
    newTopics.forEach(function (topic) {
      recentUpdatedTopicsData.push({
        id: topic._id,
        coverUrl: topic.cover_url,
        title: topic.title,
        author: topic.author_name,
        PVCount: topic.PV_count,
        des: topic.description
      });
    });
  });
}

function  extractRecentHotTopics(){

  //first set it to empty. this is important.
  global.recentHotTopicsData = [];
  RecentHotTopic.getRecentHotTopics(function(err, topics){
    if(err){console.log("cannot find old hot topics "); return;}
    console.log("更新左边人气总结");
    console.log(topics.length);
    var hotTopics = topics || [] ;
    for (var i = 0; i < hotTopics.length; i++){
      //console.log("hot topics");
      recentHotTopicsData.push({
        id: hotTopics[i]._id,
        coverUrl: hotTopics[i].cover_url,
        title: hotTopics[i].title,
        author: hotTopics[i].author_name,
        PVCount: hotTopics[i].PV_count,
        des: hotTopics[i].description
      });
    };
  });
}


function extractRealGoodTopics(){
  //first set it to empty. this is important.
  global.realGoodTopicsData = [];
  RealGoodTopic.getRealGoodTopics(function(err, topics){
    if(err){console.log("cannot find old hot topics "); return;}
    console.log("更新经典总结");
    console.log(topics.length);
    var hotTopics = topics || [] ;
    for (var i = 0; i < hotTopics.length; i++){
      //console.log("hot topics");
      realGoodTopicsData.push({
        id: hotTopics[i]._id,
        coverUrl: hotTopics[i].cover_url,
        title: hotTopics[i].title,
        author: hotTopics[i].author_name,
        PVCount: hotTopics[i].PV_count,
        des: hotTopics[i].description
      });
    };
  });
}

function alwaysTrue(){
  return true;
}


async.each(funArray, function(item, callback){
    async.whilst(alwaysTrue, function(cb){
        item.fun();
        setTimeout(cb, item.delay);
      },
      function(err){
        console.log("shall not happen");
      }
    );
  },
  function(err){
    console.log(err);
  }
)

