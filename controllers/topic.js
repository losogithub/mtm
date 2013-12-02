/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/2/13
 * Time: 12:55 AM
 * To change this template use File | Settings | File Templates.
 */
var async = require('async');
var EventProxy = require('eventproxy');
var sanitize = require('validator').sanitize;
var check = require('validator').check;
var Url = require('url');
var http = require('follow-redirects').http;
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');
var domain = require('domain');

var helper = require('../helper/helper');
var escape = helper.escape;

var Topic = require('../proxy').Topic;
var Item = require('../proxy').Item;
var User = require('../proxy').User;

var utils = require('../public/javascripts/utils');

function createTopic(req, res, next) {
  var userId = req.session.userId;

  Topic.createTopic(userId, function (err, topic) {
    if (err) {
      next(err);
      return;
    }
    if (!topic) {
      next(new Error(404));
      return;
    }

    console.log('createTopic done');
    res.redirect('/topic/' + topic._id + '/edit');
  });
}

function showEdit(req, res, next) {
  console.log('showEdit=====');
  var userId = req.session.userId;
  var topicId = req.params.topicId;

  async.auto({
    topic: function (callback) {
      _getTopicWithAuth(callback, topicId, userId);
    },
    items: ['topic', function (callback, results) {
      var topic = results.topic;
      Topic.getContents(topic, function (err, items) {
        if (err) {
          callback(err);
          return;
        }
        if (!items) {
          callback(new Error(404));
          return;
        }

        callback(null, items);
      });
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    var topic = results.topic;
    var items = results.items;
    var topicData = {
      _id: topic._id,
      title: topic.title,
      coverUrl: topic.cover_url,
      description: topic.description,
      publishDate: topic.publishDate
    };
    var itemsData = [];
    items.forEach(function (item) {
      itemsData.push(_getItemData(item));
    });
    res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, post-check=0, pre-check=0');
    res.set('Connection', 'close');
    res.set('Expire', '-1');
    res.set('Pragma', 'no-cache');
    res.render('topic/edit', {
      title: '编辑总结',
      css: [
        'http://cdn.bootcss.com/fancybox/2.1.5/jquery.fancybox.css',
        'http://cdn.bootcss.com/fancybox/2.1.5/helpers/jquery.fancybox-buttons.css',
        'http://cdn.bootcss.com/fancybox/2.1.5/helpers/jquery.fancybox-thumbs.css',
        '/stylesheets/topic.css',
        '/stylesheets/edit.css'
      ],
      js: [
        'http://cdn.bootcss.com/jquery-mousewheel/3.1.6/jquery.mousewheel.min.js',
        'http://cdn.bootcss.com/fancybox/2.1.5/jquery.fancybox.js',
        'http://cdn.bootcss.com/fancybox/2.1.5/helpers/jquery.fancybox-buttons.js',
        'http://cdn.bootcss.com/fancybox/2.1.5/helpers/jquery.fancybox-thumbs.js',
        'http://cdn.bootcss.com/autosize.js/1.17.1/autosize-min.js',
        '/javascripts/jquery-ui-1.10.3.custom.min.js',
        'http://cdn.bootcss.com/jquery-validate/1.11.1/jquery.validate.min.js',
        '/javascripts/utils.js',
        '/javascripts/edit.js'
      ],
      escape: escape,
      topic: topicData,
      items: itemsData
    });
    console.log('showEdit done');
  });
}

function showIndex(req, res, next) {
  console.log('showIndex=====');
  var userId = req.session.userId;
  var topicId = req.params.topicId;
  //2013.11.30
  req.session._loginReferer = '/topic/' + topicId;
  var currentPage = req.query.page || 1;

  var ep = EventProxy.create('topic', 'items', 'author', function (topic, items, author) {
    var updateDate = topic.update_at.getFullYear() + '年'
      + (topic.update_at.getMonth() + 1) + '月'
      + topic.update_at.getDate() + '日';

    var topicData = {
      _id: topic._id,
      title: topic.title,
      coverUrl: topic.cover_url,
      description: topic.description,
      updateAt: updateDate,
      author: topic.author_name,
      PVCount: topic.PV_count,
      FVCount: topic.FVCount
    };
    var itemsData = [];
    items.forEach(function (item) {
      itemsData.push(_getItemData(item));
    });

    var authorData = {
      author: author.loginName,
      imgUrl: author.url,
      //description: balinkify.linkify(escape(user.description), {target: " "}),
      description: helper.linkify(escape(author.description)),
      personalSite: author.personalSite
    };

    var liked = false; //default, not login user.
    //If a login user, check liked before or not.
    if (req.session && req.session.userId) {
      //console.log("currentUser", req.currentUser);
      //check in FVTopicList
      var likeList = req.currentUser.FVTopicList;
      if (likeList.indexOf(topic._id) > -1) {
        console.log("liked before");
        liked = true;
      }
    }

    res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, post-check=0, pre-check=0');
    res.set('Connection', 'close');
    res.set('Expire', '-1');
    res.set('Pragma', 'no-cache');
    res.render('topic/index', {
      title: topicData.title,
      description: topicData.description,
      css: [
        'http://cdn.bootcss.com/fancybox/2.1.5/jquery.fancybox.css',
        'http://cdn.bootcss.com/fancybox/2.1.5/helpers/jquery.fancybox-buttons.css',
        'http://cdn.bootcss.com/fancybox/2.1.5/helpers/jquery.fancybox-thumbs.css',
        '/stylesheets/topic.css'
      ],
      js: [
        'http://cdn.bootcss.com/jquery-mousewheel/3.1.6/jquery.mousewheel.min.js',
        'http://cdn.bootcss.com/fancybox/2.1.5/jquery.fancybox.js',
        'http://cdn.bootcss.com/fancybox/2.1.5/helpers/jquery.fancybox-buttons.js',
        'http://cdn.bootcss.com/fancybox/2.1.5/helpers/jquery.fancybox-thumbs.js'
      ],
      escape: escape,
      isAuthor: topic.author_id == userId,
      topic: topicData,
      items: itemsData,
      authorInfo: authorData,
      liked: liked,
      currentPage: currentPage,
      totalPage: 4
    });
    console.log('showIndex done');
  })
    .fail(function (err) {
      console.error(err.stack);
      res.send(500, err);
    });

  Topic.getTopicById(topicId, ep.done(function (topic) {
    if (!topic || !topic.publishDate) {
      ep.unbind();
      res.send(404, '您要查看的总结不存在');
      return;
    }

    ep.emit('topic', topic);
    Topic.increasePVCountBy(topic, 1).exec();
    Topic.getContents(topic, ep.done(function (items) {
      if (!items) {
        ep.unbind();
        res.send(404, '条目列表头不存在');
        return;
      }

      ep.emit('items', items);
    }));
    //author information: website url, description, images.
    User.getUserByLoginName(topic.author_name, ep.done(function (author) {
      if (!author) {
        ep.unbind();
        res.send(404, '作者不存在');
        return;
      }

      ep.emit('author', author);
    }));
  }));
}

function _getData(req) {
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
      check(title).len(0, 100);
      check(snippet).len(0, 200);
      if (src.length) check(src).isUrl();
      check(description).len(0, 300);

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
      check(title).len(0, 100);
      if (quote.length) check(quote).isUrl();
      check(description).len(0, 300);

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
      var title = sanitize(req.body.title).trim();
      var description = sanitize(req.body.description).trim();

      check(url).notNull().isUrl();
      check(title).len(0, 100);
      check(description).len(0, 300);

      data = {
        url: url,
        title: title,
        description: description
      }
      break;
    case 'CITE':
      var cite = sanitize(req.body.cite).trim();
      var url = sanitize(req.body.url).trim();
      var title = sanitize(req.body.title).trim();
      var description = sanitize(req.body.description).trim();

      check(cite).len(1, 500);
      if (url.length) check(url).isUrl();
      check(title).len(0, 100);
      check(description).len(0, 300);

      data = {
        cite: cite,
        url: url,
        title: title,
        description: description
      }
      break;
    case 'TEXT':
      var text = sanitize(req.body.text).trim();

      check(text).len(1, 2000);

      data = {
        text: text
      }
      break;
    case 'TITLE':
      var title = sanitize(req.body.title).trim();

      check(title).len(0, 100);

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

function _getItemData(item) {
  var itemData;

  switch (item.type) {
    case 'LINK':
      itemData = {
        itemId: item._id,
        type: item.type,
        url: item.url,
        title: item.title,
        snippet: item.snippet,
        src: item.src,
        description: item.description
      }
      break;
    case 'IMAGE':
      itemData = {
        itemId: item._id,
        type: item.type,
        url: item.url,
        title: item.title,
        quote: item.quote,
        quoteDomain: utils.getImageQuoteDomain(item.quote),
        description: item.description
      }
      break;
    case 'VIDEO':
      var quote = utils.getVideoQuote(item.url);
      itemData = {
        itemId: item._id,
        type: item.type,
        url: item.url,
        quote: quote,
        vid: item.vid,
        title: item.title,
        description: item.description
      }
      break;
    case 'CITE':
      itemData = {
        itemId: item._id,
        type: item.type,
        cite: item.cite,
        url: item.url,
        title: item.title,
        description: item.description
      }
      break;
    case 'TEXT':
      itemData = {
        itemId: item._id,
        type: item.type,
        text: item.text
      }
      break;
    case 'TITLE':
      itemData = {
        itemId: item._id,
        type: item.type,
        title: item.title
      }
      break;
    default:
      itemData = {};
      break;
  }
  return itemData;
}

function _getTopicWithAuth(callback, topicId, userId) {
  Topic.getTopicById(topicId, function (err, topic) {
    if (err) {
      callback(err);
      return;
    }

    if (!topic) {
      callback(new Error(404));
      return;
    }

    if (topic.author_id != userId) {
      callback(new Error(403));
      return;
    }

    callback(null, topic);
  });
}

function _getPrevItemWithAuth(callback, prevItemType, prevItemId, topicId) {
  if (!prevItemType || !prevItemId) {
    callback();
    return;
  }

  Item.getItemById(prevItemType, prevItemId, function (err, prevItem) {
    if (!prevItem) {
      callback(new Error(404));
      return;
    }

    if (prevItem.topic_id != topicId) {
      callback(new Error(403));
      return;
    }

    callback(null, prevItem);
  });
}

function _getItemWithAuth(callback, type, itemId, topicId) {
  Item.getItemById(type, itemId, function (err, item) {
    if (err) {
      callback(err);
      return;
    }

    if (!item) {
      callback(new Error(404));
      return;
    }

    if (item.topic_id != topicId) {
      callback(new Error(403));
      return;
    }

    callback(null, item);
  });
}

function createItem(req, res, next) {
  console.log('createItem=====');
  var userId = req.session.userId;
  var topicId = req.body.topicId;
  var prevItemType = req.body.prevItemType;
  var prevItemId = req.body.prevItemId;

  try {
    var data = _getData(req);
  } catch (err) {
    next(err);
    return;
  }
  if (!data) {
    next(new Error(500));
    return;
  }

  async.auto({
    parse: function (callback) {
      if (data.type == 'LINK_CREATE') {
        _getLinkDetail(data.url, function (err, results) {
          if (err) return callback(err);
          data.title = results.title;
          data.snippet = results.snippet;
          callback();
        });
      } else if (data.type == 'VIDEO_CREATE') {
        _getVideoDetail(data.url, function (err, results) {
          if (err) return callback(err);
          data.vid = results.vid;
          data.title = results.title;
          callback();
        });
      } else {
        callback();
      }
    },
    topic: function (callback) {
      _getTopicWithAuth(callback, topicId, userId);
    },
    prevItem: function (callback) {
      _getPrevItemWithAuth(callback, prevItemType, prevItemId, topicId);
    },
    item: ['parse', 'topic', 'prevItem', function (callback, results) {
      var topic = results.topic;
      var prevItem = results.prevItem;
      if (!prevItem) {
        prevItem = {
          type: 'VOID',
          _id: topic.void_item_id
        };
      }
      Item.createItem(prevItem, data, function (err, item) {
        if (err) {
          callback(err);
          return;
        }

        if (!item) {
          callback(new Error(500));
          return;
        }

        Topic.increaseItemCountBy(topic, 1).exec();
        callback(null, item);
      });
      topic.update_at = Date.now();
      topic.save();
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    var item = results.item;
    res.json(_getItemData(item));
    console.log('createItem done');
  });
}

function sortItem(req, res, next) {
  console.log('sort=====');
  var userId = req.session.userId;
  var topicId = req.body.topicId;
  var type = req.body.type;
  var itemId = req.body.itemId;
  var prevItemType = req.body.prevItemType;
  var prevItemId = req.body.prevItemId;

  async.auto({
    topic: function (callback) {
      _getTopicWithAuth(callback, topicId, userId);
    },
    prevItem: function (callback) {
      _getPrevItemWithAuth(callback, prevItemType, prevItemId, topicId);
    },
    item: function (callback) {
      _getItemWithAuth(callback, type, itemId, topicId);
    },
    detach: ['topic', 'prevItem', 'item', function (callback, results) {
      var item = results.item;

      Item.detachItem(item, function (err, item) {
        if (err) {
          callback(err);
          return;
        }

        callback();
      });
    }],
    insert: ['detach', function (callback, results) {
      var topic = results.topic;
      var prevItem = results.prevItem;
      var item = results.item;
      if (!prevItem) {
        prevItem = {
          type: 'VOID',
          _id: topic.void_item_id
        };
      }
      Item.insertItem(prevItem, item, function (err, item) {
        if (err) {
          callback(err);
          return;
        }

        callback();
      });
      topic.update_at = Date.now();
      topic.save();
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    res.send(200);
    console.log('sort done');
  });
}

function editItem(req, res, next) {
  console.log('editItem=====');
  var userId = req.session.userId;
  var topicId = req.body.topicId;
  var itemId = req.body.itemId;
  var type = req.body.type;

  async.auto({
    topic: function (callback) {
      _getTopicWithAuth(callback, topicId, userId);
    },
    item: function (callback) {
      _getItemWithAuth(callback, type, itemId, topicId);
    },
    update: ['topic', 'item', function (callback, results) {
      var topic = results.topic;
      var item = results.item;
      try {
        var data = _getData(req);
      } catch (err) {
        console.error(err.stack);
        callback(err);
        return;
      }
      item.update(data, function (err) {
        if (err) {
          callback(err);
          return;
        }

        callback();
      });
      topic.update_at = Date.now();
      topic.save();
    }],
    newItem: ['update', function (callback, results) {
      Item.getItemById(type, itemId, function (err, item) {
        if (err) {
          callback(err);
          return;
        }

        callback(null, item);
      });
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    var newItem = results.newItem;
    res.json(_getItemData(newItem));
    console.log('editItem done');
  });
}

function deleteItem(req, res, next) {
  console.log('deleteItem=====');
  var userId = req.session.userId;
  var topicId = req.body.topicId;
  var type = req.body.type;
  var itemId = req.body.itemId;

  async.auto({
    topic: function (callback) {
      _getTopicWithAuth(callback, topicId, userId);
    },
    item: function (callback) {
      _getItemWithAuth(callback, type, itemId, topicId);
    },
    deleteItem: ['topic', 'item', function (callback, results) {
      var topic = results.topic;
      var item = results.item;
      Item.deleteItem(item, function (err, item) {
        if (err) {
          callback(err);
          return;
        }

        Topic.increaseItemCountBy(topic, -1).exec();
        callback();
      });
      topic.update_at = Date.now();
      topic.save();
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    res.send(200);
    console.log('deleteItem done');
  });
}

function deleteTopic(req, res, next) {
  console.log('deleteTopic=====');
  var authorId = req.session.userId;
  var topicId = req.params.topicId;

  Topic.deleteTopic(authorId, topicId, function (err) {
    if (err) {
      return next(err);
    }
    res.send(200);
    console.log('deleteTopic done');
  });
}

function saveTopic(req, res, next) {
  console.log('saveTopic=====');
  var authorId = req.session.userId;
  var topicId = req.body.topicId;
  var title = sanitize(req.body.title).trim();
  var coverUrl = sanitize(req.body.coverUrl).trim();
  var description = sanitize(req.body.description).trim();
  var publish = req.body.publish;

  try {
    check(title).len(5, 50);
    check(description).len(0, 150);
  } catch (err) {
    next(err);
    return;
  }

  Topic.saveTopic(authorId, topicId, title, coverUrl, description, publish, function (err) {
    if (err) {
      return next(err);
    }
    res.send(200);
    console.log('saveTopic done');
  });
}

function _getHtml(url, callback) {
  console.log(url);
  var d = domain.create();
  d.on('error', function (err) {
    if (typeof callback == 'function') {
      callback(err);
    }
  });
  d.run(function () {
    http.get(url, function (response) {
      var bufferHelper = new BufferHelper();
      response.on('data', function (chunk) {
        bufferHelper.concat(chunk);
      });
      response.on('end', function () {
        var temp;
        var charset = !(temp = response.headers['content-type']) ? null :
          !(temp = temp.match(/charset=([^;]+)/i)) ? null :
            !temp[1] ? null : temp[1];
        var buffer = bufferHelper.toBuffer();
        console.log(charset);
        try {
          var html = iconv.decode(buffer, charset);
        } catch (err) {
          callback(err);
          return;
        }
        var charset2 = (!(temp = html.match(/<meta\s+http-equiv\s*=\s*("|')?Content-Type("|')?\s+content\s*=\s*("|')[^"']*charset\s*=\s*([^"']+)\s*("|')[^>]*>/i)) ? null : temp[4])
          || (!(temp = html.match(/<meta\s+charset\s*=\s*("|')([^"']+)("|')[^>]*>/i)) ? null : temp[2]);
        if (charset2 &&
          (!charset
            || charset2.toLowerCase() != charset.toLowerCase())) {
          try {
            var html = iconv.decode(buffer, charset2);
          } catch (err) {
            callback(err);
            return;
          }
        }
        console.log(charset2);

        if (typeof callback === 'function') {
          callback(null, html);
        }
      })
    });
  });
}

function _getLinkDetail(url, callback) {
  _getHtml(url, function (err, html) {
    if (err) {
      if (typeof callback === 'function') {
        callback(err);
      }
      return;
    }
    var temp;
    var title = !(temp = html.match(/<title[^>]*>([^<]*)<\/title[^>]*>/i)) ? null : temp[1];
    title = sanitize(title).entityDecode();
    title = sanitize(title).trim();

    temp = !(temp = html.match(/<meta([^>]*)name\s*=\s*("|')description("|')([^>]*)>/i)) ? null : temp[1] + temp[4];
    var snippet = (!temp ? null : !(temp = temp.match(/content\s*=\s*("|')([^"']*)("|')/i)) ? null : temp[2].trim())
      || html.substr((temp = html.indexOf('<body')) < 0 ? 0 : temp)
      .replace(/<script((?!<\/script>)[\s\S])*<\/script>/gi, ' ')
      .replace(/<style((?!<\/style>)[\s\S])*<\/style>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (snippet.length > 200) {
      snippet = snippet.substr(0, 199) + '…';
    }
    snippet = sanitize(snippet).entityDecode();
    snippet = sanitize(snippet).trim();

    var imgs = !html ? null : html.match(/<img[^>]*>/gi);
    console.log(imgs ? imgs.length : 0);
    var thumb;
    var img;
    var width;
    var height;
    var srcs = [];
    var obj = {};
    var addToSrcs = function (img) {
      var src = !img ? null : !(temp = img.match(/\ssrc\s*=\s*("|')([^"']+)("|')/i)) ? null : temp[2];
      if (!src) {
        return;
      }
      src = utils.suffixImage(Url.resolve(url, src));
      if (!src || obj[src]) {
        return;
      }
      console.log('++' + src);
      srcs.push(src);
      obj[src] = true;
    };
    for (var i in imgs) {
      img = imgs[i];
      width = !img ? null : !(temp = img.match(/\swidth\s*=\s*("|')([\d]+)("|')/i)) ? null : temp[2];
      height = !img ? null : !(temp = img.match(/\sheight\s*=\s*("|')([\d]+)("|')/i)) ? null : temp[2];
      if (width || height) {
        if (width >= 150 && height >= 70) {
          console.log('++' + img);
          addToSrcs(img);
        } else {
          console.log('--' + img);
        }
        continue;
      }
      thumb = !img ? null : !(temp = img.match(/\ssrc\s*=\s*("|')[^"']+\.jpg("|')/i)) ? null : temp[0];
      if (thumb) {
        console.log('++' + img);
        addToSrcs(img);
        continue;
      }
    }
    console.log(srcs.length);
    if (typeof callback == 'function') {
      callback(null, {
        title: title,
        snippet: snippet,
        srcs: srcs
      });
    }
  });
}

function _getVideoDetail(url, callback) {
  _getHtml(url, function (err, html) {
    if (err) {
      if (typeof callback === 'function') {
        callback(err);
      }
      return;
    }
    var temp;
    var title;
    var quote = utils.getVideoQuote(url);
    var vid;
    console.log(quote);
    switch (quote) {
      case 'youku.com':
        //plan A
        //&tt=第二十一回&nbsp;惊见摘头鬼 坑亲王谢幕&pu=
        title = !(temp = html.match(/&tt=(((?!&pu).)*)/i)) ? null : !temp[1] ? null : temp[1];
        //http://v.youku.com/v_show/id_XNjEyOTU3NjE2.html?f=20383529&ev=1
        vid = !(temp = url) ? null : !(temp = temp.match(/id_([\w\-]{13})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'tudou.com':
        //plan A
        //,kw: '爆笑恶搞淮秀帮-超强阵容配音坑爹的谣言时代（淮秀帮 出品）-2bzhan.cc'
        //,kw:"校长 开房找我啊"
        //,kw: "星映话之《金刚狼2：狼叔来袭》上集"
        title = (!(temp = html.match(/,kw:\s*('|")(.*)('|")/)) ? null : !temp[2] ? null : temp[2])
          //plan B1
          //<h4 class="vcate_title" id="vcate_title"><a href="http://www.tudou.com/albumcover/RHCS8jx9TQo.html" target="_blank">星映话之《金刚狼2：狼叔来袭》上集</a></h4>
          || (!(temp = html.match(/<h4 class="vcate_title" id="vcate_title"><a(.*)>(.*)<\/a><\/h4>/)) ? null : !temp[2] ? null : temp[2])
          //plan B2
          //<h1 class="kw" id="videoKw" title="爆笑恶搞淮秀帮-超强阵容配音坑爹的谣言时代（淮秀帮 出品）-2bzhan.cc">爆笑恶搞淮秀帮-超强阵容配音坑爹的谣言时代（淮秀帮 出品）-2bzhan.cc</h1>
          || (!(temp = html.match(/<h1 class="kw" id="videoKw"(.*)>(.*)<\/h1>/)) ? null : !temp[2] ? null : temp[2])
          //plan B3
          //<span id="vcate_title" class="vcate_title">校长 开房找我啊</span>
          || (!(temp = html.match(/<span id="vcate_title" class="vcate_title">(.*)<\/span>/)) ? null : !temp[1] ? null : temp[1])
          //plan C
          || (!(temp = html.match(/<title>([^_]+)(.*)<\/title>/)) ? null : !temp[1] ? null : temp[1]);
        //http://www.tudou.com/listplay/pKzzr-WLvwk/snBiS0Y74PQ.html
        //http://www.tudou.com/programs/view/TtwcrB0saxg
        vid = !(temp = url) ? null : !(temp = temp.match(/([\w\-]{11})(\.html)?\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'iqiyi.com':
        //专题性质的，即a_的暂不支持，同weibo，无技术障碍
        //plan A
        //<em data-widget-crumbs-elem="name" data-widget-crumbs-name-max="56">恐怖杀手：诡异人体寄生虫-热纪录</em>
        title = !(temp = html.match(/<em data-widget-crumbs-elem="name" data-widget-crumbs-name-max="56">([^<>]*)<\/em>/i)) ? null : !temp[1] ? null : temp[1];
        //http://www.iqiyi.com/v_19rrhfcr84.html
        //<div id="flashbox"......data-player-videoid="a97be8194627fef129d23cd05b834f79"......>
        vid = !(temp = html.match(/<div[^<>]*\sid="flashbox"[^<>]*\sdata-player-videoid="([^">]*)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'pps.tv':
        //plan A
        //<h1 class="p-title"><a title="最肥小龙女！陈妍希被喊滚出娱乐圈"
        title = !(temp = html.match(/<h1 class="p-title"><a title="([^"'>]*)/i)) ? null : !temp[1] ? null : temp[1];
        //http://v.pps.tv/play_38J3NV.html
        vid = !(temp = url) ? null : !(temp = temp.match(/(\w{6})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'sohu.com':
        //plan A
        //<h2>\s20130712 第一期 姚贝娜《也许明天》\s</h2>
        title = !(temp = html.match(/<h2>\s*([^<>]*)\s*<\/h2>/i)) ? null : !temp[1] ? null : temp[1];
        //http://tv.sohu.com/20130712/n381487508.shtml
        //<script type="text/javascript">......var vid="1237900";......</script>
        vid = !(temp = html.match(/<script type="text\/javascript">[^<>]*\svar vid="([^"<>;]+)";[^<>]*<\/script>/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'qq.com':
        //plan A
        //var VIDEO_INFO={vid:"c00139loswm",title:" Ballerina",typeid:22,duration:"177",specialTemp:false}
        title = !(temp = html.match(/VIDEO_INFO=\{[\s\S]*title\s*:\s*("|')([^"'}]*)/i)) ? null : !temp[2] ? null : temp[2];
        //http://v.qq.com/page/c/w/m/c00139loswm.html
        //http://v.qq.com/cover/r/r0yx3vkrlz4rj85.html?vid=i00135hjy5k
        vid = (!(temp = url) ? null : !(temp = temp.match(/vid=([\w\-]{11})/i)) ? null : !temp[1] ? null : temp[1])
          || (!(temp = url) ? null : !(temp = temp.match(/([\w\-]{11})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1]);
        break;
      case 'sina.com.cn':
        //http://video.sina.com.cn/haokan/play.html?url=http%3A%2F%2Fmy.tv.sohu.com%2Fus%2F53375285%2F62269772.shtml
        //http://video.sina.com.cn/m/sztvyw_63172701.html
        //上面两种url暂不支持，同weibo，未尝试
        //plan A
        //$SCOPE['video'] = {......title:'【拍客】险 学生穿梭烂尾无护栏天桥上学',......}
        title = !(temp = html.match(/\$SCOPE\['video'\]\s*=\s*\{[\s\S]*title\s*:\s*'([^'}]*)/i)) ? null : !temp[1] ? null : temp[1];
        //http://video.sina.com.cn/bl/6646436-1624364062-117652070.html
        //http://video.sina.com.cn/v/b/50691086-1854900491.html
        //http://video.sina.com.cn/p/news/s/v/2013-11-26/110663190307.html
        //$SCOPE['video'] = {......vid:'120263847',......}
        vid = !(temp = html.match(/\$SCOPE\['video'\] = \{[^{}]*\svid:'([^'{}]*)',/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'ifeng.com':
        //plan A
        //var videoinfo = {......"name": "中方就划设东海防空识别区驳斥美日有关言论",......}
        title = !(temp = html.match(/var videoinfo = \{[\s\S]*"name": "([^"}]*)/i)) ? null : !temp[1] ? null : temp[1];
        //http://v.ifeng.com/mil/mainland/201311/01bf1722-6d9d-419f-bf04-0c3afd6f2cf8.shtml
        //http://v.ifeng.com/ent/yllbt/special/20131125/index.shtml#b2755624-d591-4f08-ae54-349f473fe490(不能获取title，暂不支持，同weibo)
        //http://v.ifeng.com/live/#4AC51C17-9FBE-47F2-8EE0-8285A66EAFF5(直播用的channelId，暂不支持，同weibo)
        vid = !(temp = url) ? null : !(temp = temp.match(/(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})\.shtml([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'letv.com':
        //plan A
        //var __INFO__={......video : {......title:"唐罗利猜中获双人普吉岛浪漫游—非常了得",//视频名称......}......}
        title = !(temp = html.match(/var __INFO__=\{[\s\S]*video : \{[\s\S]*\stitle:"([^"}]*)/i)) ? null : !temp[1] ? null : temp[1];
        //http://www.letv.com/ptv/vplay/2050605.html
        vid = !(temp = url) ? null : !(temp = temp.match(/(\d{7})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'pptv.com':
        //plan A
        //<title>英超-1314赛季-联赛-第12轮-曼城6：0热刺-精华_PPTV网络电视</title>
        title = !(temp = html.match(/<title>([^<>]*)<\/title>/i)) ? null : !temp[1] ? null : temp[1].substr(0, temp[1].lastIndexOf('_PPTV网络电视'));
        //http://v.pptv.com/show/icwtr6HibzIFicCQKg.html#
        vid = !(temp = url) ? null : !(temp = temp.match(/(\w{18})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'ku6.com':
        //plan A
        //<h1 title="《全民奥斯卡之幕后》第六期：道哥幽默访谈笑点多">
        title = !(temp = html.match(/<h1 title="([^"'>]*)/i)) ? null : !temp[1] ? null : temp[1];
        //http://v.ku6.com/show/Dq-TEVeOSRPxpr-MKaAhHg...html?hpsrc=1_12_1_1_0
        vid = !(temp = url) ? null : !(temp = temp.match(/([\w\-]{22}\.\.)\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case '56.com':
        //plan A
        //<h1 id="vh_title">爸爸去哪儿20131122海岛特辑 暖男天天荣升好帮手 </h1>
        //<h1 id="vh_title"><span id="albumTitle">最强cos美少女战士 这样上街不怕被砍吗[搞笑视频 笑死人]</span>
        title = !(temp = html.match(/<h1 id="vh_title">(<span id="albumTitle">)?([^<>]*)(<\/h1>|<\/span>)/i)) ? null : !temp[2] ? null : temp[2];
        //http://www.56.com/u48/v_MTAxMTQ3MDYx.html
        //http://www.56.com/w92/play_album-aid-12053351_vid-MTAwOTU1MDI0.html
        vid = !(temp = url) ? null : !(temp = temp.match(/(\w{12})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'baomihua.com':
        //plan A
        //var temptitle = '权志龙独揽四项大奖演出惊艳全场';
        title = !(temp = html.match(/var temptitle = '([^']*)';/i)) ? null : !temp[1] ? null : temp[1];
        //http://video.baomihua.com/11258722/28470044
        vid = !(temp = url) ? null : !(temp = temp.match(/(\d{8})\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'yinyuetai.com':
        //plan A
        //<meta property="og:title"......content="意外 官方版 - 薛之谦"/>
        title = !(temp = html.match(/<meta property="og:title"[^<>]*content="([^">]*)/i)) ? null : !temp[1] ? null : temp[1];
        //http://v.yinyuetai.com/video/818636
        vid = !(temp = url) ? null : !(temp = temp.match(/(\d{6})\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'acfun.tv':
        //plan A
        //<h1 id="title-article" class="title" title="视频标题">日产GT-R Nismo</h1>
        title = !(temp = html.match(/<h1 id="title-article" class="title" title="视频标题">([^<>]*)<\/h1>/i)) ? null : !temp[1] ? null : temp[1];
        //http://www.acfun.tv/a/ac926643(这是文章，要排除)
        //http://www.acfun.tv/v/ac926028
        vid = !(temp = url) ? null : !(temp = temp.match(/\/v\/ac(\w+)\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'bilibili.tv':
        //plan A
        //<h2 title="想恶搞女友却发现惊人秘密">
        title = !(temp = html.match(/<h2 title="([^">]*)>/i)) ? null : !temp[1] ? null : temp[1];
        //http://www.bilibili.tv/video/av805830/index_2.html
        vid = !(temp = url) ? null : !(temp = temp.match(/\/av(\d+)\/(index_(\d+)\.html)?([?&#]|$)/i)) ? null : temp[1] + '&page=' + (temp[3] || '1');
        break;
    }
    console.log(title);
    title = sanitize(title).entityDecode();
    title = sanitize(title).trim();
    if (typeof callback == 'function') {
      callback(null, {
        vid: vid,
        title: title
      });
    }
  });
}

function getLinkDetail(req, res, next) {
  console.log('getLinkDetail');
  var url = req.query.url;

  _getLinkDetail(url, function (err, results) {
    if (err) {
      next(err);
      return;
    }
    res.json({
      url: url,
      title: results ? results.title : undefined,
      snippet: results ? results.snippet : undefined,
      srcs: results ? results.srcs : undefined
    });
  });
}

function getVideoDetail(req, res, next) {
  console.log('getVideoDetail');
  var url = req.query.url;

  _getVideoDetail(url, function (err, results) {
    if (err) {
      next(err);
      return;
    }
    if (!results.vid) {
      next(new Error(400));
      return;
    }
    res.json({
      url: url,
      vid: results ? results.vid : undefined,
      title: results ? results.title : undefined
    });
  });
}

function AddorRemoveLikes(req, res) {
  console.log("add or remove likes for topic");
  var topicId = req.body.topicId;
  var toLike = req.body.toLike || "true";
  console.log(topicId);
  console.log(toLike);//string

  //what need to do is.
  //1. add/remove likes in topic
  //2. add/remove topicId in likeList for the current user.

  //get current viewer info according to userId
  if (req.session && req.session.userId) {
    User.getUserById(req.session.userId, function (err, user) {
      if (err) {
        console.log(err);
        return;
      }
      else if (!user) {
        console.log("cannot find user by id");
        return;
      }
      else {
        //found the user
        if (toLike == "true") {
          //if does not in the array, push.
          if (user.FVTopicList.indexOf(topicId) == -1) {
            user.FVTopicList.push(topicId);
          }
          //otherwise do nothing.
        } else {
          //toLike "false"
          var index = user.FVTopicList.indexOf(topicId);
          if (index > -1) {
            user.FVTopicList.splice(index, 1);
          }
        }

        user.save(function (err) {
          if (err) {
            console.log("user save err ");
            return;
          }
        })

        //update topic info
        Topic.getTopicById(topicId, function (err, topic) {
          if (err) {
            console.log(err);
            return;
          }
          else if (!topic) {
            console.log("cannot find topic");
            return;
          }
          else {
            //found the topic according to id.
            var userId = user._id;
            console.log("----------------------")
            console.log(typeof toLike);
            if (toLike == "true") {
              if (topic.FVList.indexOf(userId) == -1) {
                //not exist
                topic.FVList.push(userId);
                topic.FVCount += 1;
              }
              //otherwise already found. do nothing
            }
            else {
              //toLike == "false"
              var index = topic.FVList.indexOf(userId);
              if (index > -1) {
                topic.FVList.splice(index, 1);
                topic.FVCount -= 1;
              }
              //otherwise do nothing
            }

            topic.save(function (err) {
              if (err) {
                console.log("topic save err");
              }
            });
            console.log("-------------------------------");
            //console.log(user);
            console.log("-------------------------------");
            //console.log(topic);
            //now successfully update info for both author and viewer.
            //send information back
            res.header('Access-Control-Allow-Credentials', 'true')
            res.contentType('json');
            //res.writeHead(200);
            //if need login, then in auth.js, loginDialog : true,
            //correct attribute is used for login Dialog success situation.
            res.send({FVCount: topic.FVCount, correct: true, userName: user.loginName, toLike: toLike });

          }
        })
      }
    })
  }

}

exports.createTopic = createTopic;
exports.showEdit = showEdit;
exports.showIndex = showIndex;
exports.createItem = createItem;
exports.editItem = editItem;
exports.sortItem = sortItem;
exports.deleteItem = deleteItem;
exports.deleteTopic = deleteTopic;
exports.saveTopic = saveTopic;
exports.getLinkDetail = getLinkDetail;
exports.getVideoDetail = getVideoDetail;
exports.AddorRemoveLikes = AddorRemoveLikes;