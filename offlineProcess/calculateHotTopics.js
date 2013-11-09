/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 11/8/13
 * Time: 3:29 PM
 * To change this template use File | Settings | File Templates.
 */

var async = require('async');
var RecentHotTopic = require('../proxy').RecentHotTopic;
var RealGoodTopic = require('../proxy').RealGoodTopic;
var ScoredTopic = require('../proxy').ScoredTopic;
var ComputeTopic = require('./scoreTopics');

//one more thing is to build a connection between hot topics collection and old hot topics collection
// hotTopicsCollection => oldHotTopicsCollection

var scoredTopic2Hot = [
  {fun: updateScoredTopicScore, delay: 3*60*1000}, //3min
  //{fun: updateTwoTopicDB, delay: 4*60*1000}
]


var limitedNumber = 600; // the total numbers of the recent hot topics

function alwaysTrue(){
  return true;
}

function scoreCompare(top1, top2){
  return (top2.score -top1.score);
}

/*
 update the score and then send to each the two databases.
* */
function updateScoredTopicScore(){
  console.log("calculate score for each topic");

    ScoredTopic.updateScoredTopics(function(err, callback){
    if(err){console.log(err); return;}

    setTimeout(updateTwoTopicDB, 1000*60); //delay one minute;

  })
}

function updateTwoTopicDB(){
  //compute the new score , sort it then copy it
  console.log("向人气总结数据库和经典总结数据库拷贝数据");

  RealGoodTopic.copyFromScoredTopics(function(err, alldata){
    if(err){console.log("copy err"); return;}
    console.log("人气总结数据库拷贝完毕.")
  })

  ScoredTopic.getHotScoredTopics(function(err, topics){
    if(err){console.log("cannot fnd hot scored hot topics"); return;}
    console.log("recent hot scored topics length");
    console.log(topics.length);
    //get a new score.
    for (var i = 0; i < topics.length; i++){
      topics[i].score = ComputeTopic.newHotScore(topics[i].score, topics[i].update_at);
    }

    var newTopics = topics.sort(scoreCompare);

    var documents = newTopics.slice(0, limitedNumber);

    RecentHotTopic.updateRecentHotTopics(documents,function(err, ok){
      if(err){console.log(err); return;}
    })
    console.log("经典总结数据库拷贝完毕.")
  })

}


async.each(scoredTopic2Hot, function(item, callback){
    async.whilst(alwaysTrue, function(cb){
        item.fun();
        setTimeout(cb, item.delay);
      },
      function(err){
        console.log(err);
      }
    )
  }
  ,function(err){
    console.log(err);
  }
)
