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
var createVoidItem = function (topic, callback) {
  console.log('createVoidItem');

  //查找条目链表头
  ItemModels['VOID'].findById(topic.void_item_id, function (err, void_item) {
    if (err) {
      console.error('find void item failed:' + err);
    } else if (void_item) {
      console.log('void item found');

      //将总结返回给回调函数
      callback(topic);

    } else {
      console.log('void item not found');

      //创建条目链表头
      void_item = new ItemModels['VOID']();
      void_item.save(function (err, void_item) {
        if (err) {
          console.error('create void item failed:' + err);
        } else {
          console.log('void item created===');
          console.log(void_item);
          //保存条目链表头
          void_item.prev_item
            = void_item.next_item
            = { type: 'VOID', id: void_item._id};
          void_item.topic_id = topic._id;
          void_item.save(function (err, void_item) {
            if (err) {
              console.error('save void item.prev&next failed:' + err);
            } else {
              console.log('void_item=======');
              console.log(void_item);

              //总结指向条目链表头
              topic.void_item_id = void_item._id;
              topic.save(function (err, topic) {
                if (err) {
                  console.error('save topic.void_item_id failed:' + err);
                } else {
                  console.log('topic=======');
                  console.log(topic);

                  //将总结传给回调函数
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

/**
 * 创建条目
 * @param topic
 * @param prevItemType
 * @param prevItemId
 * @param type
 * @param data
 * @param callback
 */
var createItem = function (topic, prevItemType, prevItemId, type, data, callback) {
  console.log('createItem');

  //创建条目
  var item = new ItemModels[type]();
  item.type = type;
  item.text = data.text;
  item.title = data.title;

  //插入条目
  insertItem(
    item,
    prevItemType ? prevItemType : 'VOID',
    prevItemId ? prevItemId : topic.void_item_id,
    function (item) {
      callback(item);
    });
}

/**
 * 插入条目
 * @param item
 * @param prevItemType
 * @param prevItemId
 * @param callback
 */
var insertItem = function (item, prevItemType, prevItemId, callback) {
  console.log('insertItem.');

  //查找前趋条目
  ItemModels[prevItemType].findById(prevItemId, function (err, prev_item) {
    if (err) {
      console.error('find prev_item failed:' + err);
    } else if (!prev_item) {
      console.log('prev_item not found');
    } else {
      console.log('prev_item===');
      console.log(prev_item);
      //把前趋条目的后继条目改为目标条目
      var nextItemTypeId = { type: prev_item.next_item.type, id: prev_item.next_item.id };//对前趋条目的next_item属性深拷贝
      var itemTypeId = { type: item.type, id: item._id }
      prev_item.next_item = itemTypeId;
      prev_item.save(function (err, prev_item) {
        if (err) {
          console.error('save prev_item failed:' + err);
        } else {
          console.log('prev_item===');
          console.log(prev_item);

          //查找后继条目
          ItemModels[nextItemTypeId.type].findById(nextItemTypeId.id, function (err, next_item) {
            if (err) {
              console.error('find next item failed:' + err);
            } else if (!next_item) {
              console.log('next_item not found');
            } else {
              console.log('next_item===');
              console.log(next_item);
              //后继条目的前趋条目改为目标条目
              next_item.prev_item = itemTypeId;
              next_item.save(function (err, next_item) {
                if (err) {
                  console.error('save next_item failed:' + err);
                } else {
                  console.log('next_item===');
                  console.log(next_item);

                  //修改目标条目的前趋条目和后续条目
                  item.prev_item = { type: prevItemType, id: prevItemId };
                  item.next_item = nextItemTypeId;
                  item.topic_id = prev_item.topic_id;
                  item.save(function (err, item) {
                    if (err) {
                      console.error('save item failed:' + err);
                    } else {
                      console.log('item===');
                      console.log(item);

                      //将目标条目传给回调函数
                      if (callback) {
                        callback(item);
                      }
                    }
                  })
                }
              })
            }
          })
        }
      })
    }
  })
}

/**
 * 卸下条目
 * @param type
 * @param itemId
 * @param callback
 */
var detachItem = function (type, itemId, callback) {
  console.log('detach item.');

  //查找条目
  ItemModels[type].findById(itemId, function (err, item) {
    if (err) {
      console.error('find item failed:' + err);
    } else if (!item) {
      console.log('item not found');
    } else {

      //查找前趋条目
      ItemModels[item.prev_item.type].findById(item.prev_item.id, function (err, prev_item) {
        if (err) {
          console.error('find prev_item failed:' + err);
        } else if (!prev_item) {
          console.log('prev_item not found');
        } else {
          //前趋条目的后继条目改为目标条目
          prev_item.next_item = item.next_item;
          prev_item.save(function (err) {
            if (err) {
              console.error('save prev_item failed:' + err);
            } else {

              //查找后继条目
              ItemModels[item.next_item.type].findById(item.next_item.id, function (err, next_item) {
                if (err) {
                  console.error('find next_item failed:' + err);
                } else if (!next_item) {
                  console.log('next_item not found');
                } else {
                  //后继条目的前趋条目改为目标条目
                  next_item.prev_item = item.prev_item;
                  next_item.save(function (err) {
                    if (err) {
                      console.error('save next_item failed:' + err);
                    } else {

                      //将目标条目传给回调函数
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
  })
}

/**
 * 删除条目
 * @param type
 * @param itemId
 * @param callback
 */
var deleteItem = function (type, itemId, callback) {
  console.log('deleteItem');

  //先卸下目标条目
  this.detachItem(type, itemId, function (item) {
    item.remove(function (err) {
      if (err) {
        console.error('remove item failed:' + err);
      } else {
        console.log('item===');
        console.log(item);

        //将删除前的条目传给回调函数
        callback(item);
      }
    });
  })
}

/**
 * 修改条目
 * @param type
 * @param itemId
 * @param data
 * @param callback
 */
var editItem = function (type, itemId, data, callback) {
  console.log('editItem');

  //查找条目
  ItemModels[type].findById(itemId, function (err, item) {
    if (err) {
      console.error('find item failed:' + err);
    } else if (!item) {
      console.log('item not found');
    } else {

      //修改条目
      item.text = data.text;
      item.title = data.title;
      item.save(function (err, item) {
        if (err) {
          console.error('save item failed:' + err);
        } else {

          //将修改后的条目传给回调函数
          callback(item);
        }
      })
    }
  })
}

/**
 * 获取一个总结的所有条目
 * @param voidItemId
 * @param itemCount
 * @param callback
 */
var getItems = function (voidItemId, itemCount, callback) {
  console.log('getItems');

  var items = [];
  ItemModels['VOID'].findById(voidItemId, function (err, void_item) {
    if (err) {
      console.error('find void item failed:' + err);
    } else if (!void_item) {
      console.log('void item not found');
      if (callback) {
        callback(items);
      }
    } else {
      console.log('void item found');
      _getItems(itemCount, void_item.next_item.type, void_item.next_item.id, items, function () {
        if (callback) {
          callback(items);
        }
      });
    }
  });
}

/**
 * 递归获取同一总结的条目
 * @param remain_count
 * @param type
 * @param itemId
 * @param items
 * @param callback
 * @private
 */
var _getItems = function (remain_count, type, itemId, items, callback) {
  console.log('_getItems');

  //通过计数器和条目链表头判断结束条件
  // 计数器是为了防止链表出错导致死循环！！！
  if (remain_count <= 0
    || type == 'VOID') {
    console.log('no more items, remain_count:' + remain_count);

    //回调函数无参数
    callback();
    return;
  }

  //查找条目
  ItemModels[type].findById(itemId, function (err, item) {
    if (err) {
      console.error('get item failed:' + err);
    } else if (!item) {
      console.log('item not found');
    } else {

      //条目加入结果集，递归查找下一个条目
      items.push(item);
      _getItems(--remain_count, item.next_item.type, item.next_item.id, items, callback);
    }
  })
}

exports.createVoidItem = createVoidItem;
exports.createItem = createItem;//增
exports.insertItem = insertItem;
exports.detachItem = detachItem;
exports.deleteItem = deleteItem;//删
exports.editItem = editItem;//改
exports.getItems = getItems;//查