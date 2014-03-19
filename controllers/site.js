/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/27/13
 * Time: 11:42 PM
 * To change this template use File | Settings | File Templates.
 */

var math = require('mathjs')();

var topicsPerPage = 24;
var topicsInIndex = 12;

function index(req, res) {
  var recentHotTopicsDataPage = global.recentHotTopicsData.slice(0, topicsInIndex);
  var goodTopicsDataPage = global.realGoodTopicsData.slice(0, topicsInIndex);
  var recentUpdatedTopicsData = global.recentUpdatedTopicsData.slice(0, topicsInIndex);

  res.render('index', {
    pageType: 'INDEX',
    hot: recentHotTopicsDataPage,
    realGood: goodTopicsDataPage,
    newTopics: recentUpdatedTopicsData
  });
}

function showHot(req, res) {
  var currentPage = parseInt(req.query.page) || 1;

  var recentHotTopicsDataPage = global.recentHotTopicsData.slice((currentPage - 1) * topicsPerPage, currentPage * topicsPerPage);

  //since I have already restricted recent hot topics to 700. so will never cross 50page.
  var totalPages = math.ceil(global.recentHotTopicsData.length / topicsPerPage);

  res.render('category', {
    pageType: 'HOT',
    topics: recentHotTopicsDataPage,
    totalPage: totalPages,
    currentPage: currentPage
  });
}

function showClassic(req, res) {
  var currentPage = parseInt(req.query.page) || 1;

  var goodTopicsDataPage = global.realGoodTopicsData.slice((currentPage - 1) * topicsPerPage, currentPage * topicsPerPage);
  //since I have already restricted recent hot topics to 700. so will never cross 50page.
  var totalPages = math.ceil(global.realGoodTopicsData.length / topicsPerPage);

  res.render('category', {
    pageType: 'CLASSIC',
    topics: goodTopicsDataPage,
    totalPage: totalPages,
    currentPage: currentPage
  });
}

function showNew(req, res) {
  var currentPage = parseInt(req.query.page) || 1;

  var totalPages = math.ceil(global.recentUpdatedTopicsData.length / topicsPerPage);

  res.render('category', {
    pageType: 'NEW',
    topics: global.recentUpdatedTopicsData,
    totalPage: totalPages,
    currentPage: currentPage
  });
}

exports.index = index;
exports.showHot = showHot;
exports.showClassic = showClassic;
exports.showNew = showNew;