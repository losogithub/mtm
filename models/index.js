/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/8/13
 * Time: 2:06 PM
 * To change this template use File | Settings | File Templates.
 */
var mongoose = require('mongoose');
var config = require('../config');

mongoose.connect(config.db, function (err) {
  if (err) {
    console.error('connect to %s error: ', config.db, err.message);
    process.exit(1);
  }
});

//models
require('./user');

exports.TopicModel = require('./topic');
exports.ItemModel = require('./item');


exports.User = mongoose.model('User');