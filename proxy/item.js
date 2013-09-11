/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/8/13
 * Time: 7:19 PM
 * To change this template use File | Settings | File Templates.
 */
var EventProxy = require('eventproxy');

var models = require('../models');
var ItemModel = models.ItemModel;

var detachItem = function (itemId, callback) {
  console.log('detach item.');
  ItemModel.findById(itemId, 'prev_item_id next_item_id', function (err, item) {
    if (err) {
      console.error('fail to find item:' + err);
    } else if (!item) {
      console.log('item not found');
    } else {
      ItemModel.findById(item.prev_item_id, null, function (err, prev_item) {
        if (err) {
          console.error('fail to find prev_item:' + err);
        } else if (!prev_item) {
          console.log('prev_item not found');
        } else {
          ItemModel.findById(item.next_item_id, null, function (err, next_item) {
            if (err) {
              console.error('fail to find next_item:' + err);
            } else if (!next_item) {
              console.log('next_item not found');
            } else {
              prev_item.next_item_id = item.next_item_id;
              next_item.prev_item_id = item.prev_item_id;
              prev_item.save(function (err) {
                if (err) {
                  console.error('fail to save prev_item:' + err);
                } else {
                  next_item.save(function (err) {
                    if (err) {
                      console.error('fail to save next_item:' + err);
                    } else {
                      callback(item);
                    }
                  })
                }
              })
            }
          })
        }
      })
    }
  });
}

var insertItem = function (item, prevItemId, callback) {
  console.log('insert item.');
  ItemModel.findById(prevItemId, 'next_item_id', function (err, prev_item) {
    if (err) {
      console.error('fail to find prev item:' + err);
    } else if (!prev_item) {
      console.log('prev_item not found');
    } else {
      ItemModel.findById(prev_item.next_item_id, null, function (err, next_item) {
        if (err) {
          console.error('fail to find next item:' + err);
        } else if (!prev_item) {
          console.log('prev_item not found');
        } else {
          item.prev_item_id = prevItemId;
          item.next_item_id = next_item._id;
          prev_item.next_item_id = item._id;
          next_item.prev_item_id = item._id;
          item.save(function (err) {
            if (err) {
              console.error('fail to save item:' + err);
            } else {
              prev_item.save(function (err) {
                if (err) {
                  console.error('fail to save prev_item:' + err);
                } else {
                  next_item.save(function (err) {
                    if (err) {
                      console.error('fail to save next_item:' + err);
                    } else {
                      callback(item);
                    }
                  })
                }
              })
            }
          });
        }
      });
    }
  });
}

exports.insertItem = insertItem;
exports.detachItem = detachItem;