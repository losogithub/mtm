/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 11/8/13
 * Time: 3:29 PM
 * To change this template use File | Settings | File Templates.
 */
var async = require('async');
var OldHotTopic = require('../proxy').OldHotTopic;
var HotTopic = require('../proxy').HotTopic;


//one more thing is to build a connection between hot topics collection and old hot topics collection
// hotTopicsCollection => oldHotTopicsCollection

var hot2OldHot = [
  {fun: calculateHotTopics, delay: 3*60*1000} //3min
]


function alwaysTrue(){
  return true;
}

//calculate and send to old Topics collection
function calculateHotTopics(){
  console.log("calculate hot topics");
  HotTopic.updateHotTopics(function(err, callback){
    if(err){console.log(err); return;}

    //copy to old hot topic collection
    console.log("copy to old hot topics");
    OldHotTopic.copyFromHotTopics();
  })
}


async.each(hot2OldHot, function(item, callback){
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