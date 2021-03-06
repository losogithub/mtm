/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/8/13
 * Time: 7:19 PM
 * To change this template use File | Settings | File Templates.
 */
var async = require('async');
var extend = require('extend');

var ItemModels = require('../models').ItemModels;
var downloadImage = require('../helper/downloadImage');
var qiniuPlugin = require('../helper/qiniu');

/**
 * 创建条目
 * @param data
 * @param callback
 */
function createItem(data, callback) {
  var item = new ItemModels[data.type](data);
  async.auto({
    if: function (callback) {
      if (data.type != 'IMAGE') {
        return callback();
      }
      async.auto({
        base64data: function (callback) {
          if (data.imageByteData) {
            return callback(null, data.imageByteData);
          }
          downloadImage.downloadBase64Image(data.url, data.quote, callback);
        },
        qiniu: ['base64data', function(callback, results) {
          var base64data = results.base64data;
          qiniuPlugin.uploadToQiniu(base64data, item._id.toString(), callback);
          item.originalUrl = item.url;
          item.url = "http://shizier.qiniudn.com/" + item._id;
        }]
      }, callback);
    }
  }, function (err) {
    if (err) {
      return callback(err);
    }

    item.save(function (err, item) {
      callback(err, item);
    });
  });
}

/**
 * 获取一个策展的所有条目
 * @param topic
 * @param callback
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
          return callback();
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

    callback(null, items);
  });
}

function getAllTopic2Items(callback) {
  callback = callback || function () {
  };

  var allItems = [];
  async.forEach(['LINK', 'IMAGE', 'VIDEO', 'CITE', 'WEIBO'], function (type, callback) {
    ItemModels[type].find({ topicId: { $exists: true } }, function (err, items) {
      if (err) return callback(err);

      allItems = allItems.concat(items);
      callback();
    });
  }, function (err) {
    if (err) return callback(err);

    allItems.sort(function (a, b) {
      return parseInt(b._id, 16) - parseInt(a._id, 16);
    });
    callback(null, allItems);
  });
}

function getItemsByTopicId(topicId, callback) {
  callback = callback || function () {
  };

  var allItems = [];
  async.forEach(['LINK', 'IMAGE', 'VIDEO', 'CITE', 'WEIBO'], function (type, callback) {
    ItemModels[type].find({ topicId: topicId }, function (err, items) {
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

    allItems.sort(function (a, b) {
      return parseInt(b._id, 16) - parseInt(a._id, 16);
    });
    callback(null, allItems);
  });
}

/**
 * 查找条目
 * @param type
 * @param itemId
 * @param callback
 */
function getItemById(type, itemId, callback) {
  if (!ItemModels[type]) return callback();
  ItemModels[type].findById(itemId, callback);
}

function getItemsById(ids, callback) {
  callback = callback || function () {
  };

  var allItems = [];
  async.forEach(['LINK', 'IMAGE', 'VIDEO', 'CITE', 'WEIBO'], function (type, callback) {
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

function deleteItem(type, _id, callback) {
  getItemById(type, _id, function (err, item) {
    if (err) {
      return callback(err);
    }
    if (!item) {
      return callback(new Error(404));
    }

    item.remove(callback);
  });
}

exports.createItem = createItem;//增
exports.getItems = getItems;//查
exports.getAllTopic2Items = getAllTopic2Items;//查
exports.getItemsByTopicId = getItemsByTopicId;//查
exports.getItemById = getItemById;//查
exports.getItemsById = getItemsById;//查
exports.editItem = editItem;
exports.deleteItem = deleteItem;//删