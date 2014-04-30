/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 4/25/14
 * Time: 3:52 PM
 * To change this template use File | Settings | File Templates.
 */

var async = require('async');

var helper = require('../helper/helper');

var Item = require('../proxy').Item;
var User = require('../proxy').User;

var config = require('../config');
var qiniu = require('qiniu');
qiniu.conf.ACCESS_KEY = config.QINIU_ACCESS_KEY;
qiniu.conf.SECRET_KEY = config.QINIU_SECRET_KEY;


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
    var data = Item.getData(req);
  } catch (err) {
    return next(err);
  }
  if (!data) {
    return next(new Error(500));
  }

  async.auto({
    item: function (callback) {
      Item.createCollectionItem(data, function (err, item) {
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
    res.json(Item.getItemData(item));
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
    res.json(Item.getItemData(item));
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
      Item.deleteCollectionItem(type, _id, function (err, item) {
        if (err) {
          return callback(err);
        }
        if (!item) {
          return callback(new Error(500));
        }

        callback(null, item);
      });
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
    update: ['user', function (callback) {
      try {
        var data = Item.getData(req);
      } catch (err) {
        return callback(err);
      }
      Item.updateById(type, _id, data, callback);
    }],
    newItem: ['update', function (callback) {
      Item.getItemById(type, _id, function (err, item) {
        if (err) {
          return callback(err);
        }
        if (!item) {
          return callback(new Error(500));
        }

        callback(null, item);
      });
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    var newItem = results.newItem;
    res.json(Item.getItemData(newItem));
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
    res.json(Item.getItemData(results));
  });
}

function generateUpToken(req, res, next){
    var putPolicy = new qiniu.rs.PutPolicy(config.BUCKET_NAME);
    var upToken = putPolicy.token();
    res.json({"upToken": upToken});
    console.log('send upToken to client');
}


function uploadToQiniu(req, res, next){
    var imageDataInfo = decodeBase64Image(req.body.imageByteData);
    binaryData = imageDataInfo.data;

    var putPolicy = new qiniu.rs.PutPolicy(config.BUCKET_NAME);
    var upToken = putPolicy.token();
    var extra = new qiniu.io.PutExtra();
    extra.mimeType = imageDataInfo.type;

    //generate a unique key for this image
    var key= "123";
    /*
    first create a image collectionItem, then get the item id as the key.
    If failed, delete this collectionItem.
     */

    qiniu.io.put(upToken, key, binaryData, extra, function(err,ret){
        if(!err){
            console.log(ret.key, ret.hash);
            res.json({"result": "0"});
        }
        else {
            console.log(err);
            res.json({"result": "-1"});
        }
    })
}

function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};

    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');

    return response;
}

exports.showBookmarklet = showBookmarklet;
exports.createCollectionItem = createCollectionItem;
exports.collectItem = collectItem;
exports.deleteItem = deleteItem;
exports.editItem = editItem;
exports.getDetail = getDetail;
exports.generateUpToken = generateUpToken;
exports.uploadToQiniu = uploadToQiniu;