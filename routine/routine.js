/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 11/8/13
 * Time: 11:03 AM
 * To change this template use File | Settings | File Templates.
 */
var Topic = require('../proxy').Topic;

function _routine() {
  Topic.updateHotTopics();
  Topic.updateCategoryTopics();
}

function start() {
  Topic.updateNewTopics();
  _routine();

  setInterval(_routine, 60 * 1000);
}

exports.start = start;