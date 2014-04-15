/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/27/13
 * Time: 11:42 PM
 * To change this template use File | Settings | File Templates.
 */

var Common = require('../common');

//var topicsPerPage = 24;
//var topicsInIndex = 24;
//var newTopicsPerPage = 19;
var topicsPerPage = 12;
var topicsInIndex = 12;
var newTopicsPerPage = 10;

function index(req, res) {
  res.render('index', {
    pageType: 'INDEX',
    topicCount: Common.TopList.totalTopicCount,
    totalTopicCount: Common.TopList.totalTopicCount,
    categoryTopicCount: Common.TopList.categoryTopicCount,
    hot: Common.TopList.hotTopics.slice(0, topicsInIndex),
    realGood: Common.TopList.classicTopics.slice(0, topicsInIndex),
    newTopics: Common.TopList.newTopics.slice(0, newTopicsPerPage),
    authors: Common.TopList.hotAuthors,
    authorCategoryList: Common.AuthorCategoryList,
    tags: Common.TopList.hotTags
  });
}

function showHot(req, res) {
  var currentPage = parseInt(req.query.page) || 1;

  var recentHotTopicsDataPage = Common.TopList.hotTopics.slice((currentPage - 1) * topicsPerPage, currentPage * topicsPerPage);

  //since I have already restricted recent hot topics to 700. so will never cross 50page.
  var totalPages = Math.ceil(Common.TopList.hotTopics.length / topicsPerPage);

  res.render('category', {
    title: '综合',
    pageType: '综合',
    topicCount: Common.TopList.totalTopicCount,
    totalTopicCount: Common.TopList.totalTopicCount,
    categoryTopicCount: Common.TopList.categoryTopicCount,
    topics: recentHotTopicsDataPage,
    totalPage: totalPages,
    currentPage: currentPage,
    authors: Common.TopList.hotAuthors,
    authorCategoryList: Common.AuthorCategoryList,
    tags: Common.TopList.hotTags
  });
}

function showClassic(req, res) {
  var currentPage = parseInt(req.query.page) || 1;

  var goodTopicsDataPage = Common.TopList.classicTopics.slice((currentPage - 1) * topicsPerPage, currentPage * topicsPerPage);
  //since I have already restricted recent hot topics to 700. so will never cross 50page.
  var totalPages = Math.ceil(Common.TopList.classicTopics.length / topicsPerPage);

  res.render('category', {
    pageType: 'CLASSIC',
    topics: goodTopicsDataPage,
    totalPage: totalPages,
    currentPage: currentPage
  });
}

function showNew(req, res) {
  var currentPage = parseInt(req.query.page) || 1;

  var newTopicsPage = Common.TopList.newTopics.slice((currentPage - 1) * topicsPerPage, currentPage * topicsPerPage);
  var totalPages = Math.ceil(Common.TopList.newTopics.length / topicsPerPage);

  res.render('category', {
    title: '最新',
    pageType: '最新',
    topicCount: Common.TopList.totalTopicCount,
    totalTopicCount: Common.TopList.totalTopicCount,
    categoryTopicCount: Common.TopList.categoryTopicCount,
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

function showLife(req, res) {
  _showCategory(req, res, '生活');
}

function showHumor(req, res) {
  _showCategory(req, res, '幽默');
}

function showCulture(req, res) {
  _showCategory(req, res, '文化');
}

function showBusiness(req, res) {
  _showCategory(req, res, '商业');
}

function showSport(req, res) {
  _showCategory(req, res, '体育');
}

function showUnclassified(req, res) {
  _showCategory(req, res, '未分类');
}

function _showCategory(req, res, category) {
  var currentPage = parseInt(req.query.page) || 1;

  var categoryTopicsPage = Common.TopList.categoryTopics[category].slice((currentPage - 1) * topicsPerPage, currentPage * topicsPerPage);
  var totalPages = Math.ceil(Common.TopList.categoryTopics[category].length / topicsPerPage);

  res.render('category', {
    title: category,
    pageType: category,
    topicCount: Common.TopList.categoryTopicCount[category],
    totalTopicCount: Common.TopList.totalTopicCount,
    categoryTopicCount: Common.TopList.categoryTopicCount,
    topics: categoryTopicsPage,
    totalPage: totalPages,
    currentPage: currentPage,
    authors: Common.TopList.categoryAuthors[category],
    authorCategoryList: Common.AuthorCategoryList,
    tags: Common.TopList.categoryTags[category]
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
exports.showLife = showLife;
exports.showHumor = showHumor;
exports.showCulture = showCulture;
exports.showBusiness = showBusiness;
exports.showSport = showSport;
exports.showUnclassified = showUnclassified;