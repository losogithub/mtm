/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/27/13
 * Time: 11:42 PM
 * To change this template use File | Settings | File Templates.
 */

/*

 * */
var math = require('mathjs')();

var topicsPerPage = 20;
var goodTopicsPerPage = 10;

function index(req, res, next) {


  //console.log(hotTopics);

  //set default to the first page.
  var currentPage = req.query.page || '1';

  var recentHotTopicsDataPage = global.recentHotTopicsData.slice((currentPage - 1) * topicsPerPage, currentPage * topicsPerPage);

  //since I have already restricted recent hot topics to 700. so will never cross 50page.
  var totalPages = math.max(math.ceil(global.recentHotTopicsData.length / topicsPerPage), math.ceil(global.realGoodTopicsData.length / goodTopicsPerPage));


  var goodTopicsDataPage = global.realGoodTopicsData.slice((currentPage - 1) * goodTopicsPerPage, currentPage * goodTopicsPerPage);


  var DateObj = _showDate();
  res.render('index', {
    css: ['/stylesheets/index.css'],
    pageType: 'INDEX',
    dayInChn: DateObj.dayInChn,
    today: DateObj.today,
    today1: DateObj.today1,
    hot: recentHotTopicsDataPage,
    realGood: goodTopicsDataPage,
    newTopics: global.recentUpdatedTopicsData,
    totalPage: totalPages,
    currentPage: currentPage
  });
}

function _showDate() {
  var today = new Date();
  console.log("------------today----------");
  console.log(today);
  var day = today.getDay();
  var dayMap = {0: "星期日", 1: "星期一", 2: "星期二", 3: "星期三", 4: "星期四", 5: "星期五", 6: "星期六"}
  var dayInChn = dayMap[day];
  var showToday = today.getFullYear() + '.' + (today.getMonth() + 1) + "." + today.getDate();
  var showToday1 = showToday.replace('.', '-');
  return {dayInChn: dayInChn, today: showToday, today1: showToday1};
}

exports.index = index;