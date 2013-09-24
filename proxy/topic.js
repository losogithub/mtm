/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/8/13
 * Time: 3:04 PM
 * To change this template use File | Settings | File Templates.
 */
var EventProxy = require('eventproxy');
var ObjectId = require('mongoose').Types.ObjectId;

var models = require('../models');
var TopicModel = models.TopicModel;
var ItemModel = models.ItemModel;
var Item = require('./item');

var newId = function (callback) {
  var topic = new TopicModel();
  topic.save(function (err, product) {
    if (err) {
      console.error('get new topic id failed:' + err);
      callback(null);
    } else {
      console.log('get new topic id done');
      console.log(product._id);
      callback(product._id);
    }
  });
}

var validateId = function (id, callback) {
  console.log(id);
  TopicModel.findById(id, null, function (err, topic) {
    if (err) {
      console.error('validate topic id failed:' + err);
      callback(false);
    } else {
      console.log('validate topic id done');
      console.log(topic);
      callback(topic ? true : false);
    }
  });
}

var newAndSave = function (topic_id, prev_item_id, type, text, callback) {
  var item = new ItemModel();
  item.type = type;
  item.text = text;
  createVoidItemIfRequired(topic_id, function (topic) {
    Item.insertItem(item, topic.void_item_id, function (item) {
      topic.item_count++;
      topic.save(function (err) {
        if (err) {
          console.error('increase topic.item_count failed:' + err);
        } else {
          callback(item);
        }
      });
    });
  })
}

var createVoidItemIfRequired = function (topicId, callback) {
  TopicModel.findById(topicId, 'void_item_id item_count', function (err, topic) {
    if (err) {
      console.error('find topic failed:' + err);
    } else if (!topic) {
      console.log('topic not found');
    } else {
      ItemModel.findById(topic.void_item_id, function (err, void_item) {
        if (err) {
          console.error('find void item failed:' + err);
        } else if (void_item) {
          console.log('void item found');
          callback(topic);
        } else {
          console.log('void item not found');
          void_item = new ItemModel();
          void_item.save(function (err, void_item) {
            if (err) {
              console.error('create void item failed:' + err);
            } else {
              console.log('void item created');
              topic.void_item_id
                = void_item.prev_item_id
                = void_item.next_item_id
                = void_item._id;
              topic.save(function (err) {
                if (err) {
                  console.error('save topic.void_item_id failed:' + err);
                } else {
                  void_item.save(function (err) {
                    if (err) {
                      console.error('save void item.prev&next failed:' + err);
                    } else {
                      callback(topic);
                    }
                  });
                }
              })
            }
          })
        }
      })
    }
  });
}

var getContents = function (id, callback) {
  TopicModel.findById(id, 'void_item_id item_count', function (err, topic) {
    if (err) {
      console.error('get void_item_id failed:' + err);
    } else {
      var items = [];
      ItemModel.findById(topic.void_item_id, function (err, void_item) {
        if (err) {
          console.error('find void item failed:' + err);
        } else {
          if (void_item) {
            console.log('void item found');
            _getItems(topic.item_count, void_item._id, void_item.next_item_id, items, function () {
              callback(items);
            });
          } else {
            console.log('void item not found');
            callback(items);
          }
        }
      });
    }
  })
}

var _getItems = function (remain_count, void_item_id, id, items, callback) {
  if (remain_count <= 0) {
    console.log('no more items, remain_count:%d', remain_count);
    callback();
    return;
  }
  ItemModel.findById(id, function (err, item) {
    if (err) {
      console.error('get item failed:' + err);
    } else {
      if (item && item._id + '' !=  void_item_id + '') {
        items.push({ _id: item._id, type: item.type, text: item.text });
        _getItems(--remain_count, void_item_id, item.next_item_id, items, callback);
      } else {
        console.log('no more items');
        callback();
      }
    }
  })
}

exports.newId = newId;
exports.validateId = validateId;
exports.newAndSave = newAndSave;
exports.getContents = getContents;
exports.createVoidItemIfRequired = createVoidItemIfRequired;