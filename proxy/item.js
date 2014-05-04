/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/8/13
 * Time: 7:19 PM
 * To change this template use File | Settings | File Templates.
 */
var async = require('async');
var sanitize = require('validator').sanitize;
var check = require('validator').check;

var models = require('../models');
var ItemModels = models.ItemModels;
var helper = require('../helper/helper');
var qiniuPlugin = require('../helper/qiniu');
var utils = require('../public/javascripts/utils');

function updateById(type, _id, data, callback) {
  callback = callback || function () {
  };

  ItemModels[type].update({ _id: _id }, data, function (err) {
    if (err) {
      return callback(err);
    }

    callback(null);
  });
}

function createCollectionItem(data, callback) {
  if (!ItemModels[data.type]) {
    return callback(new Error('创建条目类型错误：' + data.type));
  }

  //创建条目
  var item = new ItemModels[data.type](data);
  item.save(callback);
}

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

function deleteCollectionItem(type, _id, callback) {
  callback = callback || function () {
  };

  getItemById(type, _id, function (err, item) {
    if (err) {
      return callback(err);
    }
    if (!item) {
      return callback(new Error(400));
    }

    item.remove(function (err, item) {
      if (err) {
        return callback(err);
      }
      if (!item) {
        return callback(new Error(500));
      }

      callback(null, item);
    });
  });
}

/**
 * 创建条目
 * @param data
 * @param callback
 */
function createItem(data, callback) {
  callback = callback || function () {
  };

  data.type = data.type.replace('_CREATE', '');
  if (!ItemModels[data.type]) {
    return callback(new Error('创建条目类型错误：' + data.type));
  }

  //创建条目
  var item = new ItemModels[data.type](data);
  item.save(function (err, item) {
    if (err) {
      return callback(err);
    }
    callback(null, item);
  })
}

/**
 * 删除条目
 * @param item
 * @param callback
 */
function deleteItem(item, callback) {
    item.remove(callback);
}

function deleteItemList(items, callback) {
  callback = callback || function () {
  };

  async.forEach(items, function (item, callback) {
    ItemModels[item.type].findByIdAndRemove(item.id, function (err) {
      if (err) {
        return callback(err);
      }
      callback();
    });
  }, function (err) {
    if (err) {
      return callback(err);
    }
    callback();
  })
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
    ItemModels[item.type].findById(item.id, function (err, item) {
      if (err) {
        return callback(err);
      }
      if (!item) {
        return callback(new Error(500));
      }


      items.push(item);
      callback(null);
    })
  }, function (err) {
    if (err) {
      return callback(err);
    }
      //renew image items from qiniu
      //2014.5.4 check the images from qiniu
      renewImageItems(items);
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
  if (!ItemModels[type]) {
    if (typeof callback === 'function') {
      callback(new Error('查找条目类型错误：' + type));
    }
    return;
  }
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
    renewImageItems(allItems);

    allItems.sort(function (a, b) {
      return parseInt(b._id, 16) - parseInt(a._id, 16);
    });
    callback(null, allItems);
  })
}

function getData(req) {
  var type = req.body.type;
  var data;

  switch (type) {
    case 'LINK_CREATE':
    case 'LINK':
      var url = sanitize(req.body.url).trim();
      var title = sanitize(req.body.title).trim();
      var snippet = sanitize(req.body.snippet).trim();
      var src = sanitize(req.body.src).trim();
      var description = sanitize(req.body.description).trim();

      check(url).notNull().isUrl();
      check(title).len(0, 50);
      check(snippet).len(0, 140);
      if (src.length) check(src).isUrl();
      check(description).len(0, 140);

      data = {
        url: url,
        title: title,
        snippet: snippet,
        src: src,
        description: description
      }
      break;
    case 'IMAGE_CREATE':
    case 'IMAGE':
      var url = sanitize(req.body.url).trim();
      var title = sanitize(req.body.title).trim();
      var quote = sanitize(req.body.quote).trim();
      var description = sanitize(req.body.description).trim();

      check(url).notNull().isUrl();
      check(title).len(0, 50);
      if (quote.length) check(quote).isUrl();
      check(description).len(0, 140);

      data = {
        url: url,
        title: title,
        quote: quote,
        description: description
      }
      break;
    case 'VIDEO_CREATE':
    case 'VIDEO':
      var url = sanitize(req.body.url).trim();
      var vid = sanitize(req.body.vid).trim();
      var cover = sanitize(req.body.cover).trim();
      var title = sanitize(req.body.title).trim();
      var description = sanitize(req.body.description).trim();

      check(url).notNull().isUrl();
      if (type == 'VIDEO') check(vid).notNull();
      if (cover.length) check(cover).isUrl();
      check(title).len(0, 50);
      check(description).len(0, 140);

      data = {
        url: url,
        vid: vid,
        cover: cover,
        title: title,
        description: description
      }
      break;
    case 'CITE':
      var cite = sanitize(req.body.cite).trim();
      var url = sanitize(req.body.url).trim();
      var title = sanitize(req.body.title).trim();
      var description = sanitize(req.body.description).trim();

      check(cite).len(1, 140);
      if (url.length) check(url).isUrl();
      check(title).len(0, 50);
      check(description).len(0, 140);

      data = {
        cite: cite,
        url: url,
        title: title,
        description: description
      }
      break;
    case 'WEIBO_CREATE':
    case 'WEIBO':
      var url = sanitize(req.body.url).trim();
      var description = sanitize(req.body.description).trim();
      var created_at = sanitize(req.body.created_at).trim();
      var idstr = sanitize(req.body.idstr).trim();
      var mid62 = sanitize(req.body.mid62).trim();
      var text = sanitize(req.body.text).trim();
      var parsed_text = sanitize(req.body.parsed_text).trim();
      var source = sanitize(req.body.source).trim();
      var pic_urls = req.body.pic_urls;
      var user = req.body.user;
      var retweeted_status = req.body.retweeted_status;

      check(url).notNull().isUrl();
      check(description).len(0, 140);

      data = {
        url: url,
        description: description,
        created_at: created_at,
        idstr: idstr,
        mid62: mid62,
        text: text,
        parsed_text: parsed_text,
        source: source,
        pic_urls: pic_urls,
        user: user,
        retweeted_status: retweeted_status
      }
      break;
    case 'TEXT':
      var text = sanitize(req.body.text).trim();

      check(text).len(1, 140);

      data = {
        text: text
      }
      break;
    case 'TITLE':
      var title = sanitize(req.body.title).trim();

      check(title).len(1, 50);

      data = {
        title: title
      }
      break;
    default :
      data = {};
      break;
  }
  data.type = type;
  return data;
}

function getItemData(item) {
  var itemData;

  switch (item.type) {
    case 'LINK':
      itemData = {
        url: item.url,
        fav: utils.getFav(item.url),
        title: item.title,
        snippet: item.snippet,
        src: item.src,
        description: item.description
      }
      break;
    case 'IMAGE':
      itemData = {
        url: item.url,
        title: item.title,
        quote: item.quote,
        quoteDomain: utils.getQuote(item.quote),
        description: item.description
      }
      break;
    case 'VIDEO':
      itemData = {
        url: item.url,
        quote: utils.getQuote(item.url, 'VIDEO'),
        cover: item.cover,
        vid: item.vid,
        title: item.title,
        description: item.description
      }
      break;
    case 'CITE':
      itemData = {
        cite: item.cite,
        url: item.url,
        title: item.title,
        description: item.description
      }
      break;
    case 'WEIBO':
      itemData = {
        url: item.url,
        description: item.description,
        created_at: item.created_at,
        time: helper.getWeiboTime(item.created_at),
        idstr: item.idstr,
        mid62: item.mid62,
        text: item.text,
        parsed_text: item.parsed_text,
        source: item.source,
        pic_urls: item.pic_urls,
        user: item.user.toObject(),
        retweeted_status: item.retweeted_status.toObject()
      }

      if (itemData.retweeted_status && itemData.retweeted_status.idstr) {
        itemData.retweeted_status.time = helper.getWeiboTime(item.retweeted_status.created_at);
      }
      break;
    case 'TEXT':
      itemData = {
        text: item.text
      }
      break;
    case 'TITLE':
      itemData = {
        title: item.title
      }
      break;
    default:
      itemData = {};
      break;
  }
  itemData._id = item._id;
  itemData.type = item.type;
  return itemData;
}

function renewImageItems(items){
  var itemsLength = items.length;
    console.log("items length: " + itemsLength);
  for(var i = 0; i < itemsLength ; i++){
      if(items[i].type == "IMAGE"){
          items[i] = checkImageItemTimeStamp(items[i]);
      }
  }
}

function checkImageItemTimeStamp(item){
    console.log("check iamge timestamp");
    console.log(item);
   //http://shizier.qiniu.com/fdasfewaeagaf23?e=31432434&token=fdgestgre5454tgrt4654te=

   //need to consider the previous case that the url not from qiniu.
   var headUrl = "http://shzier.qiniu.com";
   if((item.url.indexOf(headUrl) == -1) && (!item.qiniuId)){

       return item;
   }

    console.log("image item url: " + item.url);
    console.log("image qiniu id: " + item.qiniuId);
   var obj = require('url').parse(item.url);
   var timeStamp = obj.query.e;
   var timeNow = Math.round(+new Date()/1000);
   if(timeNow - timeStamp >= 3600){
      //update the timestamp
     item.url = qiniuPlugin.downloadImageUrl()
       //update this item in mongodb
     Item.updateById(item.type, item._id, item);
   }
   return item;
}

exports.updateById = updateById;

exports.createCollectionItem = createCollectionItem;//增
exports.cloneItem = cloneItem;
exports.deleteCollectionItem = deleteCollectionItem;
exports.createItem = createItem;//增
exports.deleteItem = deleteItem;//删
exports.deleteItemList = deleteItemList;//删
exports.getItems = getItems;//查
exports.getItemById = getItemById;
exports.getItemsById = getItemsById;

exports.getData = getData;
exports.getItemData = getItemData;