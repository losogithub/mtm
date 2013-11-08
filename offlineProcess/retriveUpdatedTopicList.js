/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 11/8/13
 * Time: 11:03 AM
 * To change this template use File | Settings | File Templates.
 */
var async = require('async');
var NewTopic = require('../proxy').NewTopic
var OldHotTopic = require('../proxy').OldHotTopic;
var HotTopic = require('../proxy').HotTopic;


//two global variables
global.hotTopicsData = [];
global.updatedTopicsData = [];


var funArray = [
  {fun: extractOldHotTopics, delay: 60*1000}, //an hour
  {fun: extractRecentTopics, delay: 60*1000} // 1 minute
];

function extractRecentTopics(){

  //ensure it is empty.
  updatedTopicsData = [];

  NewTopic.getNewTopics(function(err, topics){
    if(err){next(err);}
    console.log("Update recently updated topics list");
    //console.log(topics);
    var newTopics = topics || [];
    newTopics.forEach(function (topic) {
      updatedTopicsData.push({
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

function  extractOldHotTopics(){

  //first set it to empty. this is important.
  hotTopicsData = [];
  OldHotTopic.getHotTopics(function(err, topics){
    if(err){console.log("cannot find old hot topics "); return;}
    console.log("Update hot topics list");
    console.log(topics.length);
    var hotTopics = topics || [] ;
    for (var i = 0; i < hotTopics.length; i++){
      //console.log("hot topics");
      hotTopicsData.push({
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

