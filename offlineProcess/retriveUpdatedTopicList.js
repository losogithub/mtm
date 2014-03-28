/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 11/8/13
 * Time: 11:03 AM
 * To change this template use File | Settings | File Templates.
 */
var math = require('mathjs')();
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
    if (!topics) {
      return;
    }

    for (var i = 0; i < topics.length; i++) {
      topics[i].score = traditionalScore(topics[i].PV_count, topics[i].FVCount);
    }

    //first set it to empty. this is important.
    console.log(topics.length);
    console.log("更新经典总结");
    global.realGoodTopicsData = topics.sort(scoreCompare).slice(0, 240);

    //first set it to empty. this is important.
    console.log("更新左边人气总结");
    for (var i = 0; i < topics.length; i++) {
      topics[i].score = newHotScore(topics[i].score, topics[i].update_at);
    }
    global.recentHotTopicsData = topics.sort(scoreCompare).slice(0, 240);
  });
}

module.exports = function () {
  Topic.updateNewTopics();

  extractRecentHotTopics();
  setInterval(extractRecentHotTopics, 60 * 1000);
};