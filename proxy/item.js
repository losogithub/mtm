/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/8/13
 * Time: 7:19 PM
 * To change this template use File | Settings | File Templates.
 */
var EventProxy = require('eventproxy');

var models = require('../models');
var ItemModels = models.ItemModels;

/**
 * 创建条目链表头
 * @param topic
 * @param callback
 */
function createVoidItem(topic, callback) {
  var ep = EventProxy.create('voidItem', 'topic', function (voidItem) {
    if (typeof callback === 'function') {
      callback(null, voidItem);
    }
  })
    .fail(callback);

  //查找条目链表头
  getItemById('VOID', topic.void_item_id, ep.done(function (voidItem) {
    if (voidItem) {
      ep.unbind();
      if (typeof callback === 'function') {
        callback(null, voidItem);
      }
      return;
    }

    //创建条目链表头
    voidItem = new ItemModels['VOID']();
    voidItem.save(ep.done(function () {
      //保存条目链表头
      voidItem.prev_item
        = voidItem.next_item
        = { type: 'VOID', id: voidItem._id};
      voidItem.topic_id = topic._id;
      voidItem.save(ep.done('voidItem'));

      //策展指向条目链表头
      topic.void_item_id = voidItem._id;
      topic.save(ep.done('topic'));
    }))
  }))
}

/**
 * 创建条目
 * @param prevItem
 * @param data
 * @param callback
 */
function createItem(prevItem, data, callback) {
  data.type = data.type.replace('_CREATE', '');
  if (!ItemModels[data.type]) {
    callback(new Error('创建条目类型错误：' + data.type));
    return;
  }

  //创建条目
  var item = new ItemModels[data.type](data);
  item.save(function (err) {
    if (err) {
      callback(err);
      return;
    }
    //插入条目
    insertItem(prevItem, item, callback);
  })
}

/**
 * 插入条目
 * @param prevItem
 * @param item
 * @param callback
 */
function insertItem(prevItem, item, callback) {
  var ep = EventProxy.create('item', 'prevItem', 'nextItem', function (item) {
    if (typeof callback === 'function') {
      callback(null, item);
    }
  })
    .fail(callback);

  //查找前趋条目
  getItemById(prevItem.type, prevItem._id, ep.done(function (prev_item) {
    if (!prev_item) {
      ep.emit('error', new Error('前趋条目不存在'));
      return;
    }

    //把前趋条目的后继条目改为目标条目
    var itemTypeId = { type: item.type, id: item._id };
    prev_item.update({next_item: itemTypeId}, ep.done('prevItem'));
    //查找后继条目
    getItemById(prev_item.next_item.type, prev_item.next_item.id, ep.done(function (next_item) {
      if (!next_item) {
        ep.emit('error', new Error('后继条目不存在'));
        return;
      }

      //后继条目的前趋条目改为目标条目
      next_item.update({prev_item: itemTypeId}, ep.done('nextItem'));
      //修改目标条目的前趋条目和后续条目
      var fields = {
        prev_item: { type: prevItem.type, id: prevItem._id },
        next_item: { type: next_item.type, id: next_item.id },//不用深拷贝会导致死循环
        topic_id: prev_item.topic_id
      };
      item.update(fields, ep.done(function () {
        //查找更新后的目标条目
        getItemById(item.type, item._id, ep.done('item'));
      }));
    }));
  }));
}

/**
 * 卸下条目
 * @param item
 * @param callback
 */
function detachItem(item, callback) {
  var ep = EventProxy.create('prevItem', 'nextItem', function () {
    if (typeof callback === 'function') {
      callback(null, item);
    }
  })
    .fail(callback);

  //查找前趋条目
  getItemById(item.prev_item.type, item.prev_item.id, ep.done(function (prev_item) {
    if (!prev_item) {
      ep.emit('error', new Error('前趋条目不存在'));
      return;
    }

    //前趋条目的后继条目改为目标条目
    prev_item.next_item = item.next_item;
    prev_item.update({next_item: {type: item.next_item.type, id: item.next_item.id}}, ep.done('prevItem'));
    //查找后继条目
    getItemById(item.next_item.type, item.next_item.id, ep.done(function (next_item) {
      if (!next_item) {
        ep.emit('error', new Error('后继条目不存在'));
        return;
      }

      //后继条目的前趋条目改为目标条目
      next_item.prev_item = item.prev_item;
      next_item.update({prev_item: {type: item.prev_item.type, id: item.prev_item.id}}, ep.done('nextItem'));
    }));
  }));
}

/**
 * 删除条目
 * @param item
 * @param callback
 */
function deleteItem(item, callback) {
  var ep = new EventProxy().fail(callback);

  //先从链表卸下目标条目
  detachItem(item, ep.done(function (item) {
    item.remove(ep.done(function () {
      //将删除前的条目传给回调函数
      if (typeof callback === 'function') {
        callback(null, item);
      }
    }));
  }));
}

function deleteItemList(itemId, callback) {
  callback = callback || function () {
  };
  _deleteItemList('VOID', itemId, function (err, item) {
    if (err) {
      return callback(err);
    }
    return callback(null, item);
  })
}

function _deleteItemList(itemType, itemId, callback) {
  callback = callback || function () {
  };
  ItemModels[itemType].findByIdAndRemove(itemId, function (err, item) {
    if (err) {
      return callback(err);
    }
    if (!item || !item.next_item || !item.next_item.type || !item.next_item.id) {
      return callback(new Error(404));
    }
    if (item.next_item.type == 'VOID') {
      return callback(null, item);
    }
    _deleteItemList(item.next_item.type, item.next_item.id, callback);
  })
}

/**
 * 获取一个策展的所有条目
 * @param voidItemId
 * @param itemCount
 * @param callback
 */
function getItems(voidItemId, itemCount, callback) {
  getItemById('VOID', voidItemId, function (err, voidItem) {
    if (err || !voidItem) {
      if (typeof callback === 'function') {
        callback(err, voidItem);
      }
      return;
    }

    var items = [];
    _getItems(itemCount, voidItem.next_item.type, voidItem.next_item.id, items, callback);
  });
}

/**
 * 递归获取同一策展的条目
 * @param remain_count
 * @param type
 * @param itemId
 * @param items
 * @param callback
 * @private
 */
function _getItems(remain_count, type, itemId, items, callback) {
  //通过计数器和条目链表头判断结束条件
  //计数器是为了防止链表出错导致死循环！！！
  if (remain_count <= 0
    || type == 'VOID') {

    if (typeof callback === 'function') {
      callback(null, items);
    }
    return;
  }

  //查找条目
  getItemById(type, itemId, function (err, item) {
    if (err || !item) {
      if (typeof callback === 'function') {
        callback(null, items);//不发送err，以使前面找到的条目能发回客户端
      }
      return;
    }

    //条目加入结果集，递归查找下一个条目
    items.push(item);
    _getItems(--remain_count, item.next_item.type, item.next_item.id, items, callback);
  })
}

/**
 * 查找条目
 * @param type
 * @param itemId
 * @param callback
 */
function getItemById(type, itemId, callback) {
  if (!ItemModels[type]) {
    if (typeof callback === 'function') {
      callback(new Error('查找条目类型错误：' + type));
    }
    return;
  }
  ItemModels[type].findById(itemId, callback);
}

exports.createVoidItem = createVoidItem;
exports.createItem = createItem;//增
exports.insertItem = insertItem;
exports.detachItem = detachItem;
exports.deleteItem = deleteItem;//删
exports.deleteItemList = deleteItemList;//删
exports.getItems = getItems;//查
exports.getItemById = getItemById;