/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 11/8/13
 * Time: 2:31 PM
 * To change this template use File | Settings | File Templates.
 */

var OldHotTopicModel = require('../models').OldHotTopicModel;
var HotTopic = require('../proxy').HotTopic;
/**
 * 获取人气总结
 */
function getHotTopics(callback) {
  OldHotTopicModel.find()
    .exec(callback);
}

function copyFromHotTopics(callback){
  OldHotTopicModel.find(function(err, topics){
    if(err){console.log(err); return;}
    topics.forEach(function(topic){
      topic.remove();
    })

    HotTopic.getHotTopics(function(err, newTopics){
      if(err){console.log(err); next(err);}
      newTopics.forEach(function(topic){
        var oldTopic = new OldHotTopicModel();
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


exports.getHotTopics = getHotTopics;
exports.copyFromHotTopics = copyFromHotTopics;