/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/27/13
 * Time: 11:42 PM
 * To change this template use File | Settings | File Templates.
 */
var Topic = require('../proxy').Topic;

var index = function (req, res, next) {
  Topic.getHotTopics(function (topics) {
    var topicsData = [];
    topics.forEach(function (topic) {
      topicsData.push({
        id: topic._id,
        coverUrl: topic.cover_url,
        title: topic.title,
        author: topic.author_name,
        PVCount: topic.PV_count,
        des: topic.description
      });
    });
    var DateObj = showDate();
    res.render('index', {
      title: 'mtm[我设计的信息。策展平台]',
      css: ['/stylesheets/index.css'],
      js: ['/javascripts/index.js'],
      pageType: 'INDEX',
      dayInChn : DateObj.dayInChn,
      today: DateObj.today,
      today1: DateObj.today1,
      hot: topicsData
    });
  });
}

var showDate = function(){
  var today = new Date();
  console.log("------------today----------");
  console.log(today);
  var day = today.getDay();
  var dayMap = {0 : "星期日", 1:"星期一", 2:"星期二", 3: "星期三", 4: "星期四", 5:"星期五", 6:"星期六"}
  var dayInChn = dayMap[day];
  var  showToday = today.getFullYear() + '.' + (today.getMonth() + 1) + "." + today.getDate();
  var  showToday1 = showToday.replace('.', '-');
  return {dayInChn: dayInChn, today: showToday, today1: showToday1};
}

exports.index = index;