/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 4/15/14
 * Time: 10:56 AM
 * To change this template use File | Settings | File Templates.
 */
var Common = require('../common');

function band(req, res, next) {
  res.locals.CATEGORIES2ENG = Common.CATEGORIES2ENG;
  next();
}

exports.band = band;