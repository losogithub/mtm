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
  item.save(callback)
}

function deleteItem(type, _id, callback) {
  ItemModels[type].findByIdAndRemove(_id, callback);
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
    getItemById(item.type, item.id, function (err, item) {
      if (err) {
        return callback(err);
      }
      if (!item) {
        return callback(new Error(500));
      }

      items.push(item);
      callback(null);
    });
  }, function (err) {
    if (err) {
      return callback(err);
    }

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
    item.save(callback);
  });
}

exports.cloneItem = cloneItem;//增
exports.createItem = createItem;//增
exports.getItems = getItems;//查
exports.getItemById = getItemById;//查
exports.getItemsById = getItemsById;//查
exports.editItem = editItem;
exports.deleteItem = deleteItem;//删