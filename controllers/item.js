/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 4/25/14
 * Time: 3:52 PM
 * To change this template use File | Settings | File Templates.
 */

var async = require('async');
var extend = require('extend');

var helper = require('../helper/helper');

var Item = require('../proxy').Item;
var User = require('../proxy').User;

var config = require('../config');
var qiniuPlugin = require('../helper/qiniu');

function showBookmarklet(req, res) {
  res.render('item/bookmarklet', {
    layout: false,
    pageType: 'BOOKMARKLET'
  });
}

function createCollectionItem(req, res, next) {
  console.log('createCollectionItem=====');
  var userId = req.session.userId;

  try {
    var data = helper.getData(req);
  } catch (err) {
    return next(err);
  }
  if (!data) {
    return next(new Error(500));
  }

  async.auto({
    item: function (callback) {
      Item.createItem(data, callback);
    },
    user: ['item', function (callback, results) {
      var item = results.item;

      User.collectItem(userId, item._id, callback);
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    var item = results.item;
    res.json(helper.getItemData(item));
    console.log('createCollectionItem done');
  });
}

function collectItem(req, res, next) {
  var userId = req.session.userId;
  var type = req.body.type;
  var _id = req.body._id;

  async.auto({
    item: function (callback) {
      Item.cloneItem(type, _id, function (err, item) {
        if (err) {
          return callback(err);
        }
        if (!item) {
          return callback(new Error(500));
        }

        callback(null, item);
      });
    },
    user: ['item', function (callback, results) {
      var item = results.item;

      User.collectItem(userId, item._id, function (err, user) {
        if (err) {
          return callback(err);
        }
        if (!user) {
          return callback(new Error(400));
        }

        callback(null);
      });
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    var item = results.item;
    res.json(helper.getItemData(item));
  });
}

function deleteItem(req, res, next) {
  var userId = req.session.userId;
  var type = req.body.type;
  var _id = req.body._id;

  async.auto({
    user: function (callback) {
      User.getUserById(userId, function (err, user) {
        if (err) {
          return callback(err);
        }
        if (!user) {
          return callback(new Error(400));
        }

        User.deleteItem(user, _id, callback);
      });
    },
    item: ['user', function (callback) {
      Item.deleteItem(type, _id, callback);
    }]
  }, function (err) {
    if (err) {
      return next(err);
    }

    res.send(200);
  });
}

function _getUserAndAuthId(userId, _id, callback) {
  callback = callback || function () {
  };

  User.getUserById(userId, function (err, user) {
    if (err) {
      return callback(err);
    }
    if (!user) {
      return callback(new Error(400));
    }

    var index = user.items.indexOf(_id);
    if (index < 0) {
      return callback(new Error(403));
    }

    callback(null, user);
  });
}

function editItem(req, res, next) {
  var userId = req.session.userId;
  var _id = req.body._id;
  var type = req.body.type;

  async.auto({
    user: function (callback) {
      _getUserAndAuthId(userId, _id, callback);
    },
    item: ['user', function (callback) {
      try {
        var data = helper.getData(req);
      } catch (err) {
        return callback(err);
      }
      Item.editItem(type, _id, data, callback);
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    var item = results.item;
    res.json(helper.getItemData(item));
  });
}

function getDetail(req, res, next) {
  console.log('getDetail');
  var url = req.query.url;

  if (!url) {
    return res.json({ type: 'CITE' });
  }

  helper.getDetail(url, function (err, results) {
    if (err) {
      return next(err);
    }
    res.json(helper.getItemData(results));
  });
}

exports.showBookmarklet = showBookmarklet;
exports.createCollectionItem = createCollectionItem;
exports.collectItem = collectItem;
exports.deleteItem = deleteItem;
exports.editItem = editItem;
exports.getDetail = getDetail;