/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/27/13
 * Time: 11:42 PM
 * To change this template use File | Settings | File Templates.
 */
var async = require('async');
var extend = require('extend');

var Common = require('../common');
var Topic2 = require('../proxy/topic2');
var User = require('../proxy/user');
var Item = require('../proxy/item');
var Comment = require('../proxy/comment');

var helper = require('../helper/helper');
var utils = require('../public/javascripts/utils');

function showIndex(req, res) {
  res.render('index', {
    pageType: 'INDEX',
    css: [
      '/stylesheets/topic2.css'
    ],
    js: [
      '/javascripts/utils.js',
      '/javascripts/topic.js'
    ]
  });
}

function showTool(req, res) {
  res.render('tool', {
    title: '采集神器',
    pageType: 'TOOL'
  });
}

exports.showIndex = showIndex;
exports.showTool = showTool;