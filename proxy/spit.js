/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 5/18/14
 * Time: 3:14 AM
 * To change this template use File | Settings | File Templates.
 */

var Spit = require('../models').Spit;

function createSpit(itemType, itemId, text, callback) {
  callback = callback || function () {
  };

  new Spit({
    itemType: itemType,
    itemId: itemId,
    text: text
  }).save(function (err, spit) {
      callback(err, spit);
    });
}

function getSpitsByItemTypeAndId(itemType, itemId, callback) {
  Spit.find({
    itemType: itemType,
    itemId: itemId
  })
    .sort('-like -_id')
    .exec(callback);
}

function likeSpit(_id, callback) {
  callback = callback || function () {
  };

  Spit.findById(_id, function (err, spit) {
    if (err) return callback(err);

    spit.like++;
    spit.save(function (err, spit) {
      callback(err, spit);
    });
  });
}

exports.createSpit = createSpit;
exports.getSpitsByItemTypeAndId = getSpitsByItemTypeAndId;
exports.likeSpit = likeSpit;