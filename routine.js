/**
 * Created with JetBrains WebStorm.
 * User: stefanzan
 * Date: 11/8/13
 * Time: 11:03 AM
 * To change this template use File | Settings | File Templates.
 */
var async = require('async');

var Common = require('./common');

function _clearIP () {
  Common.TopicVisitedKeys = {};
  Common.SpitLikedKeys = {};
  Common.CommentLikedKeys = {};
}

function start() {
  setInterval(_clearIP, 24 * 60 * 60 * 1000);
}

exports.start = start;