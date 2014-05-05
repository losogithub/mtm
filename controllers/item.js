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
var downloadImage = require('../helper/downloadImage');

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
    deleteQiniuImage: function(callback){
          if(type == 'IMAGE'){
              Item.getItemById(type, _id, function(err, item){
                  if(err){
                      callback(err);
                  }
                  Item.findItemByUrl(type, item.url, function(err, items){
                      // this means there is only one item in the item collection that has this url.
                      if(items.length == 1){
                          qiniuPlugin.deleteImageFromQiniu(item.qiniuId, function(err, ret){
                              if(err){
                                  console.log("collect delete image from qiniu error, url: " + item.url );
                                  console.log(ret);
                                  next(err);
                              }
                              else{
                                  console.log("collect delete image from qiniu successfully!");
                                  callback(null, ret);
                              }
                          })
                      }
                     else {
                          console.log("collect item num: " + items.length);
                          callback(null, items);
                      }
                  })

              })
          }
      },
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
    item: ['user', 'deleteQiniuImage', function (callback) {
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
      /*
        * according to the image url to get image data and upload to qiniu.
         */
      console.log("edit item at edit page.")
      console.log(data.url);
      console.log("data: ")
      console.log(data);
      /*
        I think this function also is been called by edit operation at colelction part
        thus, first check the url. whether it is start with shizier.qiniudn.com.
         */
      if(data.url.indexOf("http://shizier.qiniudn.com") == -1 ){
          console.log("this is not a qiniu image url");
          downloadImage.downloadBase64Image(data.url, function(err, base64data){
               //upload to qiniu, set qiniuId, update the url.

              var qiniuId = qiniuPlugin.generateQiniuId(_id);
              /*
               update the item url in mongodb
               */
              data.qiniuId = qiniuId;
              data.url = qiniuPlugin.makeQiniuUrl(qiniuId);
              console.log(data);
              //update image url to this new key.
              Item.editItem(type, _id, data, function(err, item){
                  if(err){
                      callback(err);
                  }
                  //upload to qiniu with the imageUrl
                  qiniuPlugin.uploadToQiniu(base64data, qiniuId, function(err, data){
                      if(err){
                          callback(err);
                      }
                  })
              });

          })
      }
        else {
          Item.editItem(type, _id, data, callback);
      }

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


function createImageCollectionItem(req, res, callback) {
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
        console.log('createCollectionItem done');
        callback(null, item);
    });
}
/*
 * not used now.
 */
function ceateImageItemAndUploadToQiniu(req, res, next){

    /*
     first create a image collectionItem, then get the item id as the key.
     If failed, delete this collectionItem.
     */

    createImageCollectionItem(req, res, function(err, item){
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
        console.log("show item qiniuId: "+ item.qiniuId);
        var baseUrl="http://shizier.qiniudn.com/";
        item.url = baseUrl + qiniuId;
        console.log(item);
        //update image url to this new key.
        item.save(function (err, item) {
            if(err){
                next(err);
            }
            //upload to qiniu with the imageUrl
            qiniuPlugin.uploadToQiniu(req.body.imageByteData, qiniuId, function(err, data){
                res.json(helper.getItemData(item));
            })
        })

    })

}


/*
 * this function is called by retrivevImageandUploadToQiniu
 * which is used to create a image collection item,
 * upload imgedata to qiniu,
 * callback to the father function.
 */
function createImageItemUploadQiniu(req, res, callback){

    /*
     first create a image collectionItem, then get the item id as the key.
     If upload failed, delete this collectionItem.
     */
    createImageCollectionItem(req, res, function(err, item){
        if(err){
            console.log(err);
            return callback(err);
        }

        //console.log("image url: " + item.url);
        //console.log("image title: " + item.title);
        //console.log("image quote: " + item.quote);
        //console.log("image des: " + item.description);
        //console.log("image item id: " + item._id);
        //console.log("item type: " + item.type);

        /*
         build a unique image id for qiniu
         item id + timestamp
         */
        var qiniuId = qiniuPlugin.generateQiniuId(item._id);
        /*
         update the item url in mongodb
         */
        item.qiniuId = qiniuId;
        item.url = qiniuPlugin.makeQiniuUrl(qiniuId);
        console.log(item);
        //update image url to this new key.
        item.save(function (err, item) {
            if(err){
                //delete the created item in the collection.
                deleteFailedCollectItem(req, res, function(err, id){
                    if(err){
                        callback(err);
                    }
                });
                callback(err);
            }
            //upload to qiniu with the imageUrl
            qiniuPlugin.uploadToQiniu(req.body.imageByteData, qiniuId, function(err, data){
                if(err){
                    //delete the created item in the collection.
                    deleteFailedCollectItem(req, res, function(err, id){
                        if(err){
                            callback(err);
                        }
                    });
                }
                callback(err, item);
            })
        })

    })

}


function retrivevImageandUploadToQiniu(req, res, next){
    console.log("retrivevImageandUploadToQiniu function:");
    try {
        var data = helper.getData(req);
    } catch (err) {
        return next(err);
    }
    if (!data) {
        return next(new Error(500));
    }

    console.log(data.url);

    //1. retrieve image from url
    downloadImage.downloadBase64Image(data.url, function(err, base64data){
        //console.log(base64data);
        //create item and uploadtoQiniu
        //assign imageByteData
        req.body.imageByteData = base64data;
        createImageItemUploadQiniu(req, res, function(err, data){
           if(err){

               next(err);
           }
            //todo: what really need to send back.?
            res.json(helper.getItemData(data));
        })

    })

}

/*
 *  if the qiniu upload fails, then delete the created item.
 */
function deleteFailedCollectItem(req, res, callback) {
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
            return callback(err, err);
        }

        callback(null, _id);
    });
}



exports.showBookmarklet = showBookmarklet;
exports.createCollectionItem = createCollectionItem;
exports.collectItem = collectItem;
exports.deleteItem = deleteItem;
exports.editItem = editItem;
exports.getDetail = getDetail;
exports.ceateImageItemAndUploadToQiniu = ceateImageItemAndUploadToQiniu;
exports.retrivevImageandUploadToQiniu = retrivevImageandUploadToQiniu;