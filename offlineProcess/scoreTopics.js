/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 11/8/13
 * Time: 1:15 PM
 * To change this template use File | Settings | File Templates.
 */
var math = require('mathjs')();
var Topic = require('../proxy').Topic;
var HotTopic = require('../proxy').ScoredTopic;


var epoch = new Date(1970,1,1);

var epochSeconds = function(date){
  td = date - epoch;
  return td/1000;
}

/*
  compute score for each topic document
* */
/*
 var hotScore = function(pv, likes, createDate, updateDate){
  pvOrder = math.log(pv, 10);
  likeOrder = math.log(likes, 10);
  createSeconds = epochSeconds(createDate) - 1134028003;
  updateSeconds = epochSeconds(updateDate) - 1134028003;
  return math.round(pvOrder + likeOrder  + (0.7 * createSeconds + 0.3 * updateSeconds)/45000, 7);
}
  */

/*
* Our own score compute algorithm
* */

var traditionalScore = function(pv, likes){
  return math.round(pv/100,7) + likes;
}

/*
* This is for the left one, plus the time yinzi
* */
var newHotScore = function(score, updateDate){
  var diff = (Date.now() - updateDate)/(1000*60*60);
  //console.log(diff);
  if (diff < 1) { return score + 10;}
  else return score + 10/diff;
}

//exports.hotScore = hotScore;
exports.traditionalScore = traditionalScore;
exports.newHotScore = newHotScore;
