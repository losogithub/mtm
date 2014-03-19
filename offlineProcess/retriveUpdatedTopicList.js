/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 11/8/13
 * Time: 11:03 AM
 * To change this template use File | Settings | File Templates.
 */
var math = require('mathjs')();
var NewTopic = require('../proxy').NewTopic;
var Topic = require('../proxy').Topic;

function traditionalScore(pv, likes) {
  return math.round(pv / 100, 7) + likes;
}

/*
 * This is for the left one, plus the time yinzi
 * */
function newHotScore(score, updateDate) {
  var diff = (1000 * 60 * 60) / ((Date.now() - updateDate) || 1);
  //console.log(diff);
  if (diff > 1) {
    diff = 1;
  }
  return score + 10 * diff;
}

function scoreCompare(top1, top2) {
  return (top2.score - top1.score);
}

function extractRecentHotTopics() {
  Topic.getAllTopics(function (err, topics) {
    if (err) {
      console.log(err);
      return;
    }
    //console.log("get all topics from topics collection");
    //console.log(topics);

    for (var i = 0; i < topics.length; i++) {
      topics[i].score = traditionalScore(topics[i].PV_count, topics[i].FVCount);
    }

    //first set it to empty. this is important.
    global.realGoodTopicsData = [];
    console.log(topics.length);
    console.log("更新经典总结");
    var hotTopics = topics || [];
    hotTopics.sort(scoreCompare).slice(0, 240);
    for (var i = 0; i < hotTopics.length; i++) {
      //console.log("hot topics");
      global.realGoodTopicsData.push({
        _id: hotTopics[i]._id,
        coverUrl: hotTopics[i].cover_url,
        title: hotTopics[i].title,
        author: hotTopics[i].author_name,
        FVCount: hotTopics[i].FVCount,
        PVCount: hotTopics[i].PV_count
      });
    }

    //first set it to empty. this is important.
    global.recentHotTopicsData = [];
    console.log("更新左边人气总结");
    hotTopics = topics || [];
    for (var i = 0; i < topics.length; i++) {
      topics[i].score = newHotScore(topics[i].score, topics[i].update_at);
    }
    hotTopics.sort(scoreCompare).slice(0, 240);
    for (var i = 0; i < hotTopics.length; i++) {
      //console.log("hot topics");
      global.recentHotTopicsData.push({
        _id: hotTopics[i]._id,
        coverUrl: hotTopics[i].cover_url,
        title: hotTopics[i].title,
        author: hotTopics[i].author_name,
        FVCount: hotTopics[i].FVCount,
        PVCount: hotTopics[i].PV_count
      });
    }
    if (typeof callback === 'function') {
      callback(false, topics.length);
    }
  })
}

module.exports = function () {
  NewTopic.getNewTopics(function (err, topics) {
    if (err) {
      console.error(err.stack);
      return;
    }
    NewTopic.updateNewTopics(topics);
  })

  extractRecentHotTopics();
  setInterval(extractRecentHotTopics, 60 * 1000);
};