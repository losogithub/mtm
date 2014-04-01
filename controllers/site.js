/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/27/13
 * Time: 11:42 PM
 * To change this template use File | Settings | File Templates.
 */

var math = require('mathjs')();

var topicsPerPage = 24;
var topicsInIndex = 24;
var newTopicsPerPage = 19;

function index(req, res) {
  res.render('index', {
    pageType: 'INDEX',
    hot: global.recentHotTopicsData.slice(0, topicsInIndex),
    realGood: global.realGoodTopicsData.slice(0, topicsInIndex),
    newTopics: global.newTopics.slice(0, newTopicsPerPage),
    authors: global.hotAuthors
  });
}

function showHot(req, res) {
  var currentPage = parseInt(req.query.page) || 1;

  var recentHotTopicsDataPage = global.recentHotTopicsData.slice((currentPage - 1) * topicsPerPage, currentPage * topicsPerPage);

  //since I have already restricted recent hot topics to 700. so will never cross 50page.
  var totalPages = math.ceil(global.recentHotTopicsData.length / topicsPerPage);

  res.render('category', {
    pageType: '综合',
    topics: recentHotTopicsDataPage,
    totalPage: totalPages,
    currentPage: currentPage,
    authors: global.hotAuthors
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

  var newTopicsPage = global.newTopics.slice((currentPage - 1) * topicsPerPage, currentPage * topicsPerPage);
  var totalPages = math.ceil(global.newTopics.length / topicsPerPage);

  res.render('category', {
    pageType: '最新',
    topics: newTopicsPage,
    totalPage: totalPages,
    currentPage: currentPage
  });
}

function showEntertainment(req, res) {
  _showCategory(req, res, '娱乐');
}

function showTech(req, res) {
  _showCategory(req, res, '科技');
}

function showNews(req, res) {
  _showCategory(req, res, '新闻');
}

function showFashion(req, res) {
  _showCategory(req, res, '时尚');
}

function showUnclassified(req, res) {
  _showCategory(req, res, '未分类');
}

function _showCategory(req, res, catogory) {
  var currentPage = parseInt(req.query.page) || 1;

  var categoryTopicsPage = global.categoryTopics[catogory].slice((currentPage - 1) * topicsPerPage, currentPage * topicsPerPage);
  var totalPages = math.ceil(global.categoryTopics[catogory].length / topicsPerPage);
  var authors = global.categoryAuthors[catogory];

  res.render('category', {
    pageType: catogory,
    topics: categoryTopicsPage,
    totalPage: totalPages,
    currentPage: currentPage,
    authors: authors
  });
}

exports.index = index;
exports.showHot = showHot;
exports.showClassic = showClassic;
exports.showNew = showNew;
exports.showEntertainment = showEntertainment;
exports.showTech = showTech;
exports.showNews = showNews;
exports.showFashion = showFashion;
exports.showUnclassified = showUnclassified;