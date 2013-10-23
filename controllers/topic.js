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
var escape = require('escape-html');
var http = require('http');
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');

var helper = require('../helper/helper');

var Topic = require('../proxy').Topic;
var Item = require('../proxy').Item;
var User = require('../proxy').User;

var utils = require('../public/javascripts/utils');

function create(req, res, next) {
  res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, post-check=0, pre-check=0');
  res.set('Connection', 'close');
  res.set('Expire', '-1');
  res.set('Pragma', 'no-cache');
  res.render('topic/edit', {
    title: '创建总结-mtm',
    css: [
      '/stylesheets/jquery-ui-1.10.3.custom.css',
      '/stylesheets/edit.css'
    ],
    js: [
      '/javascripts/jquery.autosize.min.js',
      '/javascripts/jquery-ui-1.10.3.custom.min.js',
      '/javascripts/jquery.validate.min.js',
      '/javascripts/utils.js',
      '/javascripts/edit.js'
    ],
    backUrl: req.headers.referer ? req.headers.referer : '/works'
  });
}

function createTopic(req, res, next) {
  console.log('createTopic=====');
  var userId = req.session.userId;

  Topic.createTopic(userId, function (err, topic) {
    if (err || !topic) {
      console.error(err);
      res.send(500, '新建总结失败');
      return;
    }

    console.log('createTopic done');
    console.log(topic);
    res.json({ topicId: topic._id })
  });
}

function getContents(req, res, next) {
  console.log('getContents=====');
  var userId = req.session.userId;
  var topicId = req.query.topicId;

  var ep = EventProxy.create('topic', 'items', function (topic, items) {
    console.log('getContents done');
    var topicData = {
      title: topic.title,
      coverUrl: topic.cover_url,
      description: topic.description
    }
    var itemsData = [];
    items.forEach(function (item) {
      itemsData.push(_getItemData(item));
    });
    res.json({
      topicData: topicData,
      itemsData: itemsData
    });
  })
    .fail(function (err) {
      console.error(err);
      res.send(500, '查找总结失败');
    });

  Topic.getTopicById(topicId, ep.done(function (topic) {
    if (!topic || topic.author_id != userId) {
      ep.unbind();
      createTopic(req, res, next);
      return;
    }

    if (topic.publishDate) {
      ep.unbind();
      res.json({
        redirect: '/topic/' + topicId + '/edit'
      });
      return;
    }

    ep.emit('topic', topic);
    Topic.getContents(topic, ep.done(function (items) {
      if (!items) {
        ep.unbind();
        res.send(500, '查找总结失败');
        return;
      }

      ep.emit('items', items);
    }));
  }));
}

function editTopic(req, res, next) {
  console.log('editTopic=====');
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
      console.error(err.stack);
      switch (err.message) {
        case 403:
          res.send(403, '您无权修改他人的总结');
          break;
        case 404:
          res.send(404, '总结不存在');
          break;
        default :
          res.send(500, '打开总结编辑页面失败');
          break;
      }
      return;
    }

    var topic = results.topic;
    var items = results.items;
    var topicData = {
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
      title: '修改总结-mtm',
      css: [
        '/stylesheets/edit.css',
        '/stylesheets/jquery-ui-1.10.3.custom.css'
      ],
      js: [
        '/javascripts/jquery.autosize.min.js',
        '/javascripts/jquery-ui-1.10.3.custom.min.js',
        '/javascripts/jquery.validate.min.js',
        '/javascripts/utils.js',
        '/javascripts/edit.js'
      ],
      escape: escape,
      backUrl: req.headers.referer ? req.headers.referer : './',
      topic: topicData,
      items: itemsData
    });
    console.log('editTopic done');
  });
}

function index(req, res, next) {
  console.log('index=====');
  var topicId = req.params.topicId;
  var currentPage = req.query.page || 1;

  var ep = EventProxy.create('topic', 'items', 'author', function (topic, items, author) {
    var updateDate = topic.update_at.getFullYear() + '年'
      + (topic.update_at.getMonth() + 1) + '月'
      + topic.update_at.getDate() + '日';

    var topicData = {
      topicId: topic._id,
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
      css: [
        '/stylesheets/topic.css'
      ],
      js: [
        '/javascripts/showTopic.js'
      ],
      escape: escape,
      url: req.url,
      topic: topicData,
      items: itemsData,
      authorInfo: authorData,
      liked: liked,
      currentPage: currentPage,
      totalPage: 4
    });
    console.log('index done');
  })
    .fail(function (err) {
      console.error(err);
      res.send(500, '查找总结失败');
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

function _getData(req, _id) {
  var type = req.body.type;
  var data;

  switch (type) {
    case 'IMAGE_CREATE':
      var url = sanitize(req.body.url).trim();

      data = {
        url: url
      }
      break;
    case 'IMAGE':
      var url = sanitize(req.body.url).trim();
      var title = sanitize(req.body.title).trim();
      var quote = sanitize(req.body.quote).trim();
      var description = sanitize(req.body.description).trim();

      data = {
        url: url,
        title: title,
        quote: quote,
        description: description
      }
      break;
    case 'VIDEO_CREATE':
      var url = sanitize(req.body.url).trim();

      data = {
        url: url
      }
      break;
    case 'VIDEO':
      var url = sanitize(req.body.url).trim();
      var title = sanitize(req.body.title).trim();
      var description = sanitize(req.body.description).trim();

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

      data = {
        cite: cite,
        url: url,
        title: title,
        description: description
      }
      break;
    case 'TEXT':
      var text = sanitize(req.body.text).trim();

      data = {
        text: text
      }
      break;
    case 'TITLE':
      var title = sanitize(req.body.title).trim();

      data = {
        title: title
      }
      break;
    default :
      data = {};
      break;
  }
  data.type = type;
  if (_id) {
    data._id = _id;
  }
  return data;
}

function _getItemData(item) {
  var itemData;
  var temp;

  switch (item.type) {
    case 'IMAGE':
      itemData = {
        itemId: item._id,
        type: item.type,
        url: item.url,
        title: item.title,
        quote: item.quote,
        quoteDomain: !item.quote ? null : !(temp = item.quote.match(REGEXP_URL)) ? null : temp[2],
        description: item.description
      }
      break;
    case 'VIDEO':
      var quoteAndVid = utils.getVideoQuoteAndVid(item.url);
      itemData = {
        itemId: item._id,
        type: item.type,
        url: item.url,
        quote: quoteAndVid.quote,
        vid: quoteAndVid.vid,
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

  var data = _getData(req);
  if (!data) {
    return;
  }

  async.auto({
    videoTitle: function (callback) {
      if (data.type != 'VIDEO_CREATE') {
        callback();
        return;
      }

      _getVideoTitle(data.url, function (err, title) {
        data.title = title;
        callback();
      });
    },
    topic: function (callback) {
      _getTopicWithAuth(callback, topicId, userId);
    },
    prevItem: function (callback) {
      _getPrevItemWithAuth(callback, prevItemType, prevItemId, topicId);
    },
    item: ['videoTitle', 'topic', 'prevItem', function (callback, results) {
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
    }]
  }, function (err, results) {
    if (err) {
      console.error(err.stack);
      switch (err.message) {
        case 403:
          res.send(403, '您无权修改他人的总结');
          break;
        case 404:
          res.send(404, '总结不存在');
          break;
        default :
          res.send(500, '创建条目失败');
          break;
      }
      return;
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
    }]
  }, function (err, results) {
    if (err) {
      console.error(err.stack);
      switch (err.message) {
        case 403:
          res.send(403, '您无权修改他人的总结');
          break;
        case 404:
          res.send(404, '总结不存在');
          break;
        default :
          res.send(500, '排序失败');
          break;
      }
      return;
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
      var item = results.item;
      var data = _getData(req);
      item.update(data, function (err) {
        if (err) {
          callback(err);
          return;
        }

        callback();
      });
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
      console.error(err.stack);
      switch (err.message) {
        case 403:
          res.send(403, '您无权修改他人的总结');
          break;
        case 404:
          res.send(404, '总结不存在');
          break;
        default :
          res.send(500, '编辑条目失败');
          break;
      }
      return;
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
    }]
  }, function (err, results) {
    if (err) {
      console.error(err.stack);
      switch (err.message) {
        case 403:
          res.send(403, '您无权修改他人的总结');
          break;
        case 404:
          res.send(404, '总结不存在');
          break;
        default :
          res.send(500, '删除条目失败');
          break;
      }
      return;
    }

    res.send(200);
    console.log('deleteItem done');
  });
}

function saveTopic(req, res, next) {
  console.log('save=====');
  var authorId = req.session.userId;
  var topicId = req.body.topicId;
  var title = req.body.title;
  var coverUrl = req.body.coverUrl;
  var description = req.body.description;
  var publish = req.body.publish;

  Topic.saveTopic(authorId, topicId, title, coverUrl, description, publish, function () {
    res.send(200);
    console.log('save done');
  });
}

function _getVideoTitle(url, callback) {
  http.get(url, function (response) {
    var bufferHelper = new BufferHelper();
    response.on('data', function (chunk) {
      bufferHelper.concat(chunk);
    });
    response.on('end', function () {
      var temp;
      var charset = !(temp = response.headers['content-type']) ? '' :
        !(temp = temp.match(/charset=([^;]+)/i)) ? '' :
          !temp[1] ? '' : temp[1];
      console.log(charset);
      var html = iconv.decode(bufferHelper.toBuffer(), charset);
      var urlParts = url.match(REGEXP_URL);
      var domain = !urlParts ? null : urlParts[2];
      var title;
      console.log(domain);
      if (/tudou\.com$/.test(domain)) {
        console.log('tudou.com');
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
        console.log(title);
      }
      if (typeof callback == 'function') {
        callback(null, title);
      }
    })
  })
    //必须处理error，否则抛出异常
    .on('error', function (err) {
      if (typeof callback == 'function') {
        callback(err);
      }
    });
}

function getVideoTitle(req, res, next) {
  console.log('getVideoTitle');
  var url = req.query.url;

  _getVideoTitle(url, function (err, title) {
    res.json({
      url: url,
      title: title
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
            res.send({loginDialog: false, FVCount: topic.FVCount, correct: true, userName: user.loginName, toLike: toLike });

          }
        })
      }
    })
  }

}

exports.create = create;
exports.createTopic = createTopic;
exports.getContents = getContents;
exports.editTopic = editTopic;
exports.index = index;
exports.createItem = createItem;
exports.editItem = editItem;
exports.sortItem = sortItem;
exports.deleteItem = deleteItem;
exports.saveTopic = saveTopic;
exports.getVideoTitle = getVideoTitle;
exports.AddorRemoveLikes = AddorRemoveLikes;