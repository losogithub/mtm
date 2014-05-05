/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/8/13
 * Time: 7:19 PM
 * To change this template use File | Settings | File Templates.
 */
var async = require('async');
var extend = require('extend');
var qiniuPlugin = require('../helper/qiniu');

var ItemModels = require('../models').ItemModels;

function cloneItem(type, _id, callback) {
  callback = callback || function () {
  };

  getItemById(type, _id, function (err, item) {
    if (err) {
      return callback(err);
    }
    if (!item) {
      return callback(new Error(400));
    }

    item._id = (new ItemModels[type]())._id;
    ItemModels[type].create(item, function (err, item) {
      if (err) {
        return callback(err);
      }
      if (!item) {
        return callback(new Error(500));
      }

      callback(null, item);
    });
  })
}

/**
 * 创建条目
 * @param data
 * @param callback
 */
function createItem(data, callback) {
  data.type = data.type.replace('_CREATE', '');
  var item = new ItemModels[data.type](data);
  item.save(function (err, item) {
    callback(err, item)
  })
}

function deleteItem(type, _id, callback) {
  ItemModels[type].findByIdAndRemove(_id, callback);
}

/**
 * 获取一个策展的所有条目
 * @param topic
 * @param callback
 */
/*
 * check all the image items, update its url according to qiniu.
 */
function getItems(topic, callback) {
  callback = callback || function () {
  };

  var items = [];
  async.forEachSeries(topic.items, function (item, callback) {
    if (item && item.type && item.id) {
      getItemById(item.type, item.id, function (err, item) {
        if (err) {
          return callback(err);
        }
        if (!item) {
//          return callback(new Error(500));
          callback();
        }

        items.push(item);
        callback();
      });
    } else {
      callback();
    }
  }, function (err) {
    if (err) {
      return callback(err);
    }
      //renew image items from qiniu
      //2014.5.4 check the images from qiniu
      //renewImageItems(items);
      callback(null, items);
  });
}

/**
 * 查找条目
 * @param type
 * @param itemId
 * @param callback
 */
function getItemById(type, itemId, callback) {
  ItemModels[type].findById(itemId, callback);
}

/*
 * update the image item to support retrieve from qiniu.
 * basically, 1. check the image link from qiniu or not, then check the timestamp
 * 1. it not passed, directly use it
 * 2. otherwise, get a new one.
 * 2014.5.4 stefanzan
 */

function getItemsById(ids, callback) {
  callback = callback || function () {
  };

  var allItems = [];
  async.forEach(['LINK', 'IMAGE', 'VIDEO', 'CITE', 'WEIBO', 'TEXT', 'TITLE'], function (type, callback) {
    ItemModels[type].find({ _id: { $in: ids } }, function (err, items) {
      if (err) {
        return callback(err);
      }

      allItems = allItems.concat(items);
      callback(null);
    });
  }, function (err) {
    if (err) {
      return callback(err);
    }

    //2014.5.4 check the images from qiniu
    //renewImageItems(allItems);

    allItems.sort(function (a, b) {
      return parseInt(b._id, 16) - parseInt(a._id, 16);
    });
    callback(null, allItems);
  });
}

function editItem(type, _id, data, callback) {
  callback = callback || function () {
  };

  getItemById(type, _id, function (err, item) {
    if (err) {
      return callback(err);
    }
    if (!item) {
      return callback(new Error(404));
    }

    extend(item, data);
    item.save(function (err, item) {
      callback(err, item)
    });
  });
}

function renewImageItems(items){
  var itemsLength = items.length;
    //console.log("items length: " + itemsLength);
  for(var i = 0; i < itemsLength ; i++){
      if(items[i].type == "IMAGE"){
          items[i] = checkImageItemTimeStamp(items[i]);
      }
  }
}

function checkImageItemTimeStamp(item){
    //console.log("check iamge timestamp");
    //console.log(item);
   //http://shizier.qiniu.com/fdasfewaeagaf23?e=31432434&token=fdgestgre5454tgrt4654te=

   //need to consider the previous case that the url not from qiniu.
   var headUrl = "http://shzier.qiniudn.com";

    //case 1:
   if((item.url.indexOf(headUrl) == -1) && (!item.qiniuId)){

       return item;
   }
    //case 2:
    if((item.url.indexOf(headUrl) == -1) && (item.qiniuId)){
      // the url is not from qiniu, but having a qiniu id
      //get a url from qiniu.
      item.url = qiniuPlugin.downloadImageUrl(item.qiniuId);
      //update this item in mongodb
      //Item.updateById(item.type, item._id, item);
        item.save(function (err, item) {
            if(err){
                next(err);
            }
        })
      return item;
    }

   //case 3:
   //console.log("image item url: " + item.url);
   //console.log("image qiniu id: " + item.qiniuId);
   var obj = require('url').parse(item.url);
   var timeStamp = obj.query.e;
   var timeNow = Math.round(+new Date()/1000);
   if(timeNow - timeStamp >= 3600){
      //update the timestamp
     item.url = qiniuPlugin.downloadImageUrl(item.qiniuId);
       //update this item in mongodb
     //Item.updateById(item.type, item._id, item);
     item.save(function (err, item) {
            if(err){
                next(err);
            }
       })
   }
   return item;
}

/*
 * check totally how many image items using the same image url.
 * this is useful for deleting checking.
 */
function findItemByUrl(type, url, callback){
    ItemModels[type].find({'url': url}, callback);
}


exports.cloneItem = cloneItem;//增
exports.createItem = createItem;//增
exports.getItems = getItems;//查
exports.getItemById = getItemById;//查
exports.getItemsById = getItemsById;//查
exports.editItem = editItem;
exports.deleteItem = deleteItem;//删
exports.findItemByUrl = findItemByUrl;
