/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 5/18/14
 * Time: 4:54 AM
 * To change this template use File | Settings | File Templates.
 */
var sanitize = require('validator').sanitize;
var check = require('validator').check;

var Common = require('../common');
var Spit = require('../proxy').Spit;

function createSpit(req, res, next) {
  var itemType = req.body.itemType;
  var itemId = req.body.itemId;
  var text = sanitize(req.body.text).trim();

  try {
    check(text).len(1, 50);
  } catch (e) {
    return next(e);
  }

  Spit.createSpit(itemType, itemId, text, function (err, spit) {
    if (err) return next(err);

    res.json(spit);
  });
}

function likeSpit(req, res, next) {
  var _id = req.body._id;

  var spitLikedKey = _id + req.connection.remoteAddress;
  if (Common.SpitLikedKeys[spitLikedKey]) {
    return next(new Error(403));
  } else {
    Common.SpitLikedKeys[spitLikedKey] = true;
  }

  Spit.likeSpit(_id, function (err, spit) {
    if (err) return next(err);

    res.json({
      like: spit.like
    });
  });
}

exports.createSpit = createSpit;
exports.likeSpit = likeSpit;