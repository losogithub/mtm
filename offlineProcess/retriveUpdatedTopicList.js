/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 11/8/13
 * Time: 11:03 AM
 * To change this template use File | Settings | File Templates.
 */
var math = require('mathjs')();
var Topic = require('../proxy').Topic;
var User = require('../proxy').User;

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

    console.log("更新热门策展");
    global.realGoodTopicsData = topics.sort(scoreCompare).slice(0, 240);

    var authorMap = {};
    for (var i = 0; i < topics.length; i++) {
      topics[i].score = newHotScore(topics[i].score, topics[i].update_at);
      if (!authorMap[topics[i].author_id]) {
        authorMap[topics[i].author_id] = { score: 0 };
      }
      authorMap[topics[i].author_id].score += topics[i].score ;
    }
    global.recentHotTopicsData = topics.sort(scoreCompare).slice(0, 240);

    var authorScore = [];
    for (var id in authorMap) {
      authorScore.push({ id: id, score: authorMap[id].score });
    }
    authorScore.sort(function (a, b) {
      return (b.score - a.score);
    });
    var authorIds = [];
    var hotAuthorScore = authorScore.slice(0, 14);
    for (var i in hotAuthorScore) {
      authorIds.push(hotAuthorScore[i].id);
    }
    User.getUserByIds(authorIds, function (err, authors) {
      for (var i in authors) {
        authors[i].score = authorMap[authors[i]._id].score;
      }
      authors.sort(function (a, b) {
        return (b.score - a.score);
      });
      global.hotAuthors = authors;
    });
  });
}

module.exports = function () {
  Topic.updateNewTopics();

  extractRecentHotTopics();
  setInterval(extractRecentHotTopics, 60 * 1000);
};