/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 4/14/14
 * Time: 2:20 AM
 * To change this template use File | Settings | File Templates.
 */

var utils = require('./public/javascripts/utils');

module.exports = {
  Topic: {},
  Tags: [],
  AuthorPVCount: {},
  AuthorCategories: {},
  AuthorCategoryList: {},
  TopList: {
    categoryTags: {},
    categoryAuthors: {},
    categoryTopics: {},
    categoryTopicCount: {}
  },
  FeaturedTopics: {},
  CategoryFeaturedTopics: {},
  CATEGORIES2ENG: utils.CATEGORIES2ENG,
  CATEGORIES2CHN: (function () {
    var temp = {};
    for (var key in utils.CATEGORIES2ENG) {
      temp[utils.CATEGORIES2ENG[key]] = key;
    }
    return temp;
  })()
}