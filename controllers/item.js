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
    var data = Item.getData(req);
  } catch (err) {
    return next(err);
  }
  if (!data) {
    return next(new Error(500));
  }

  async.auto({
    item: function (callback) {
        //note: this createCollectionItem is another function in proxy of Item.js
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
    //added by stefanzan 5.4 2014
    next(null, item);
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

function ceateImageItemAndUploadToQiniu(req, res, next){

    /*
     first create a image collectionItem, then get the item id as the key.
     If failed, delete this collectionItem.
     */

    createCollectionItem(req, res, function(err, item){
        if(err){
            console.log(err);
            next(err);
        }

        console.log("image url: " + item.url);
        console.log("image title: " + item.title);
        console.log("image quote: " + item.quote);
        console.log("image des: " + item.description);
        console.log("image item id: " + item._id);
        console.log("item type: " + item.type);

        /*
        build a unique image id for qiniu
        item id + timestamp
         */
        var unixTimeStamp = Math.round(+new Date()/1000);
        var qiniuId = item._id + unixTimeStamp.toString();
        //console.log("image id: "+ qiniuId);

        /*
        update the item url in mongodb
         */
        item.qiniuId = qiniuId;
        console.log(item);
        //update image url to this new key.
        Item.updateById(item.type, item._id, item);
        //upload to qiniu with the imageUrl
        qiniuPlugin.uploadToQiniu(req.body.imageByteData, qiniuId, function(err, data){

        })
    })

}



exports.showBookmarklet = showBookmarklet;
exports.createCollectionItem = createCollectionItem;
exports.collectItem = collectItem;
exports.deleteItem = deleteItem;
exports.editItem = editItem;
exports.getDetail = getDetail;
exports.ceateImageItemAndUploadToQiniu = ceateImageItemAndUploadToQiniu;