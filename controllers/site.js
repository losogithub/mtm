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
    featuredTopics: Common.FeaturedTopics,
    hot: Common.TopList.hotTopics.slice(0, topicsInIndex),
    categoryTopics : Common.TopList.categoryTopics,
    realGood: Common.TopList.classicTopics.slice(0, topicsInIndex),
    newTopics: Common.TopList.newTopics.slice(0, newTopicsPerPage),
    authors: Common.TopList.hotAuthors,
    authorCategoryList: Common.AuthorCategoryList,
    tags: Common.TopList.hotTags
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

function showCategory(req, res) {
  var currentPage = parseInt(req.query.page) || 1;
  var category = Common.CATEGORIES2CHN[res.locals.categoryType];
  console.log(Common.CATEGORIES2CHN);
  console.log(res.locals.categoryType);

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
exports.showNew = showNew;
exports.showCategory = showCategory;