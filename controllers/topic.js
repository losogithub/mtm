/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/2/13
 * Time: 12:55 AM
 * To change this template use File | Settings | File Templates.
 */
var async = require('async');
var sanitize = require('validator').sanitize;
var check = require('validator').check;
var phantom = require('phantom');
var fs = require('fs');
var portfinder = require('portfinder');
var mongodb = require('mongodb');

var config = require('../config');
var helper = require('../helper/helper');
var escape = helper.escape;

var Common = require('../common');
var Topic = require('../proxy').Topic;
var Item = require('../proxy').Item;
var User = require('../proxy').User;

var utils = require('../public/javascripts/utils');

function showIndex(req, res, next) {
  console.log('showIndex=====');
  var userId = req.session.userId;
  var topicId = req.params.topicId;

  async.auto({
    relatedTopics: function (callback) {
      if (!Common.Topic[topicId] || !Common.Topic[topicId].relatedTopics) {
        return callback(null, []);
      }
      async.map(Common.Topic[topicId].relatedTopics.slice(0, 5), function (topicId, callback) {
        Topic.getTopicById(topicId, callback);
      }, callback);
    },
    topic: function (callback) {
      Topic.getPublishedTopicById(topicId, callback);
    },
    author: ['topic', function (callback, results) {
      var topic = results.topic;
      if (!topic) {
        return callback(new Error(404));
      }
      User.getUserById(topic.author_id, callback);
    }],
    items: ['topic', function (callback, results) {
      var topic = results.topic;
      if (!topic) {
        return callback(new Error(404));
      }
      Item.getItems(topic, callback);
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    var relatedTopics = results.relatedTopics;
    var topic = results.topic;
    var author = results.author;
    var items = results.items;
    var itemsData = [];
    items.forEach(function (item) {
      if (item && item.type && item._id) {
        itemsData.push(helper.getItemData(item));
      }
    });

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
      pageType: 'TOPIC',
      title: topic.title,
      description: topic.description,
      css: [
        'http://cdn.bootcss.com/messenger/1.4.0/css/messenger.css',
        'http://cdn.bootcss.com/messenger/1.4.0/css/messenger-theme-flat.css',
        'http://cdn.bootcss.com/fancybox/2.1.5/jquery.fancybox.css',
        'http://cdn.bootcss.com/fancybox/2.1.5/helpers/jquery.fancybox-buttons.css',
        'http://cdn.bootcss.com/fancybox/2.1.5/helpers/jquery.fancybox-thumbs.css',
        '/stylesheets/topic.css'
      ],
      js: [
        '/javascripts/ng-tags-input.js',
        'http://cdn.bootcss.com/messenger/1.4.0/js/messenger.js',
        'http://cdn.bootcss.com/messenger/1.4.0/js/messenger-theme-flat.js',
        'http://cdn.bootcss.com/jquery-mousewheel/3.1.6/jquery.mousewheel.min.js',
        'http://cdn.bootcss.com/fancybox/2.1.5/jquery.fancybox.js',
        'http://cdn.bootcss.com/fancybox/2.1.5/helpers/jquery.fancybox-buttons.js',
        'http://cdn.bootcss.com/fancybox/2.1.5/helpers/jquery.fancybox-thumbs.js',
        '/javascripts/utils.js',
        '/javascripts/topic.js'
      ],
      escape: escape,
      isAuthor: topic.author_id == userId,
      topicCount: Common.TopList.categoryTopicCount[topic.category],
      totalTopicCount: Common.TopList.totalTopicCount,
      categoryTopicCount: Common.TopList.categoryTopicCount,
      relatedTopics: relatedTopics,
      topic: topic,
      Topic: Common.Topic,
      tags: topic.tags,
      Tags: Common.Tags,
      items: itemsData,
      author: author,
      authorCategoryList: Common.AuthorCategoryList,
      CATEGORIES2ENG: Common.CATEGORIES2ENG,
      liked: liked
    });

    var visitKey = topicId.toString() + req.connection.remoteAddress;
    if (!Common.VisitedArray[visitKey]) {
      Common.VisitedArray[visitKey] = true;
      Topic.increasePVCountBy(topic, 1).exec();
    }
    console.log('showIndex done');
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
      Item.getItems(topic, callback);
    }],
    user: function (callback) {
      User.getUserById(userId, callback);
    },
    collectionItems: ['user', function (callback, results) {
      var user = results.user;
      Item.getItemsById(user.items, callback);
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    var topic = results.topic;
    var items = results.items;
    var itemsData = [];
    items.forEach(function (item) {
      if (item && item.type && item._id) {
        itemsData.push(helper.getItemData(item));
      }
    });
    var collectionItems = results.collectionItems;
    var collectionItemsData = [];
    collectionItems.forEach(function (item) {
      collectionItemsData.push(helper.getItemData(item));
    });
    res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, post-check=0, pre-check=0');
    res.set('Connection', 'close');
    res.set('Expire', '-1');
    res.set('Pragma', 'no-cache');
    res.render('topic/edit', {
      pageType: 'EDIT',
      title: '策展中',
      css: [
        '/bower_components/perfect-scrollbar/min/perfect-scrollbar-0.4.10.min.css',
        'http://cdn.bootcss.com/messenger/1.4.0/css/messenger.css',
        'http://cdn.bootcss.com/messenger/1.4.0/css/messenger-theme-flat.css',
        'http://cdn.bootcss.com/fancybox/2.1.5/jquery.fancybox.css',
        'http://cdn.bootcss.com/fancybox/2.1.5/helpers/jquery.fancybox-buttons.css',
        'http://cdn.bootcss.com/fancybox/2.1.5/helpers/jquery.fancybox-thumbs.css',
        '/stylesheets/topic.css',
        '/stylesheets/edit.css'
      ],
      js: [
        '/bower_components/perfect-scrollbar/min/perfect-scrollbar-0.4.10.min.js',
        '/bower_components/angular-elastic/elastic.js',
        '/javascripts/ui-utils.min.js',
        'http://cdn.bootcss.com/messenger/1.4.0/js/messenger.js',
        'http://cdn.bootcss.com/messenger/1.4.0/js/messenger-theme-flat.js',
        'http://cdn.bootcss.com/jquery-mousewheel/3.1.6/jquery.mousewheel.min.js',
        'http://cdn.bootcss.com/fancybox/2.1.5/jquery.fancybox.js',
        'http://cdn.bootcss.com/fancybox/2.1.5/helpers/jquery.fancybox-buttons.js',
        'http://cdn.bootcss.com/fancybox/2.1.5/helpers/jquery.fancybox-thumbs.js',
        '/javascripts/jquery-ui-1.10.4.custom.min.js',
        '/bower_components/angular-ui-sortable/sortable.js',
        'http://cdn.bootcss.com/jquery-validate/1.11.1/jquery.validate.min.js',
        '/javascripts/utils.js',
        '/javascripts/edit.js'
      ],
      escape: escape,
      topic: topic,
      items: itemsData,
      collectionItems: collectionItemsData
    });
    console.log('showEdit done');
  });
}

function showChang(req, res, next) {
  console.log('===== showChang =====');
  var topicId = req.params.topicId;

  async.auto({
    topic: function (callback) {
      Topic.getPublishedTopicById(topicId, callback);
    },
    author: ['topic', function (callback, results) {
      var topic = results.topic;
      User.getUserById(topic.author_id, callback);
    }],
    items: ['topic', function (callback, results) {
      var topic = results.topic;
      Item.getItems(topic, callback);
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    var topic = results.topic;
    var author = results.author;
    var items = results.items;

    var itemsData = [];
    items.forEach(function (item) {
      if (item && item.type && item._id) {
        itemsData.push(helper.getItemData(item));
      }
    });

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
    res.render('topic/chang', {
      title: topic.title,
      description: topic.description,
      escape: escape,
      topic: topic,
      items: itemsData,
      author: author,
      layout: false
    });
    console.log('showChang done');
  });
}

function showShareChang(req, res, next) {
  console.log('===== showShareChang =====');
  var topicId = req.params.topicId;

  Topic.getPublishedTopicById(topicId, function (err, topic) {
    if (err) {
      return next(err);
    }
    if (!topic || !topic.publishDate) {
      return next(new Error(404));
    }

    res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, post-check=0, pre-check=0');
    res.set('Connection', 'close');
    res.set('Expire', '-1');
    res.set('Pragma', 'no-cache');
    res.render('topic/shareChang', {
      title: topic.title,
      description: topic.description,
      css: [
        '/stylesheets/shareChang.css'
      ]
    });
    console.log('showShareChang done');
  });
}

function sendChang(req, res, next) {
  var topicId = req.params.topicId;
  async.auto({
    db: function (callback) {
      var MongoClient = mongodb.MongoClient;
      MongoClient.connect(config.db, function (err, db) {
        if (err) return next(err);

        callback(null, db);
      });
    },
    topic: function (callback) {
      //get the topic data
      Topic.getPublishedTopicById(topicId, function (err, topic) {
        if (err) {
          return next(err);
        }
        if (!topic) {
          return next(new Error(404));
        }
        if (!topic.publishDate) {
          return next(new Error(403));
        }

        callback(null, topic);
      });
    },
    needRender: ['db', 'topic', function (callback, results) {
      var db = results.db;
      var time = results.topic.update_at.getTime();

      if (req.query.force) {
        return callback(null, 1);
      }
      //check the existence
      mongodb.GridStore.exist(db, topicId, function (err, result) {
        if (err) {
          return next(err);
        }
        if (!result) {
          console.log("~~~~~~~~~~~not exists, create~~~~~~~~~");
          return callback(null, 1);
        }
        var gs = new mongodb.GridStore(db, topicId, "r");
        gs.open(function (err, gs) {
          if (err) {
            return next(err);
          }

          if (gs.metadata.updateAt != time) {
            console.log("render jpg again!");
            //regenerate new
            return callback(null, 1);
          }

          callback(null, 0);
        });
      });
    }],
    render: ['db', 'topic', 'needRender', function (callback, results) {
      var db = results.db;
      var time = results.topic.update_at.getTime();
      var needRender = results.needRender;

      if (!needRender) return callback();

      _generateImage(db, topicId, time, callback);
    }]
  }, function (err, results) {
    if (err) return next(err);

    var db = results.db;
    var render = results.render;

    var gs = new mongodb.GridStore(db, topicId, "r");
    gs.open(function (err, gs) {
      if (err) return next(err);
      gs.read(function (err, data) {
        if (err) {
          console.log("read err");
          throw err;
        }
        res.writeHead('200', {'Content-Type': 'image/jpeg'});
        res.end(data, 'binary');
        if (typeof render === 'function') render();//删除临时文件
      });
    });
  });
}


/*
 tag : used to notify regenerate
 */
function _generateImage(db, topicId, time, callback) {
  portfinder.getPort(function (err, port) {
    if (err) return callback(err);

    console.log("port: ", port);
    var filename = topicId + '_' + time + '.jpg';
    var fullFilePath = 'public/images/chang/' + filename;
    phantom.create({port: port}, function (ph) {
      ph.createPage(function (page) {
        try {
          page.open('http://localhost:3000/topic/' + topicId + '/chang', function () {
            page.render(fullFilePath, function () {
              ph.exit();

              _storeMongoGrid(db, topicId, time, fullFilePath, callback);
            });
          });
        } catch (e) {
          ph.exit();
        }
      });
    });
  });
}

function _storeMongoGrid(db, topicId, time, fullFilePath, callback) {
  var gs = new mongodb.GridStore(db, topicId, "w", {
    "metadata": {
      "updateAt": time
    }
  });
  gs.writeFile(fullFilePath, function (err) {
    if (err) return callback(err);

    gs.close(function (err) {
      if (err) return callback(err);

      callback(null, function () {
        fs.unlink(fullFilePath);
      });
    });
  });
}

function _getTopicWithAuth(callback, topicId, userId, isAdmin) {
  Topic.getTopicById(topicId, function (err, topic) {
    if (err) {
      callback(err);
      return;
    }
    if (!topic) {
      callback(new Error(404));
      return;
    }

    if (topic.author_id != userId && !isAdmin) {
      console.log(topic.author_id);
      console.log(userId);
      console.log(topic.author_id != userId);
      console.log(!isAdmin);
      callback(new Error(403));
      return;
    }

    callback(null, topic);
  });
}

function createItem(req, res, next) {
  console.log('createItem=====');
  var userId = req.session.userId;
  var topicId = req.body.topicId;
  var prevItemId = req.body.prevItemId;

  try {
    var data = helper.getData(req, true);
  } catch (err) {
    return next(err);
  }
  if (!data) {
    return next(new Error(500));
  }

  async.auto({
    parse: function (callback) {
      if (data.type != 'LINK_CREATE') {
        return callback();
      }
      helper.getDetail(data.url, function (err, results) {
        if (err) return callback(err);

        if (results) {
          data = results;
          return callback();
        }

        helper.getLinkDetail(data.url, function (err, results) {
          if (err) return callback(err);
          data = results;
          callback();
        });
      });
    },
    topic: function (callback) {
      _getTopicWithAuth(callback, topicId, userId);
    },
    item: ['parse', function (callback) {
      Item.createItem(data, callback);
    }],
    newTopic: ['topic', 'item', function (callback, results) {
      var topic = results.topic;
      var item = results.item;
      var prevItemIndex = -1;
      for (var i = 0; i < topic.items.length; i++) {
        if (topic.items[i] && topic.items[i].id == prevItemId) {
          prevItemIndex = i;
          break;
        }
      }
      topic.items.splice(prevItemIndex + 1, 0, {
        type: item.type,
        id: item._id
      });
      topic.update_at = Date.now();
      topic.save(function (err) {
        callback(err);
      })
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    var item = results.item;
    var topic = results.topic;
    res.json(helper.getItemData(item));
    updateNewTopics();
    _updateSingleTopicSiteCount(topic);
    console.log('createItem done');
  });
}

function sortItem(req, res, next) {
  console.log('sort=====');
  var userId = req.session.userId;
  var topicId = req.body.topicId;
  var _id = req.body._id;
  var prevItemId = req.body.prevItemId;

  async.auto({
    topic: function (callback) {
      _getTopicWithAuth(callback, topicId, userId);
    },
    insert: ['topic', function (callback, results) {
      var topic = results.topic;

      var index = -1;
      for (var i = 0; i < topic.items.length; i++) {
        if (topic.items[i] && topic.items[i].id == _id) {
          index = i;
          break;
        }
      }
      var temp = topic.items.splice(index, 1)[0];
      var prevItemIndex = -1;
      for (var i = 0; i < topic.items.length; i++) {
        if (topic.items[i] && topic.items[i].id == prevItemId) {
          prevItemIndex = i;
          break;
        }
      }
      topic.items.splice(prevItemIndex + 1, 0, temp);
      topic.update_at = Date.now();
      topic.save(function (err) {
        callback(err);
      });
    }]
  }, function (err) {
    if (err) {
      return next(err);
    }

    res.send(200);
    updateNewTopics();
    console.log('sort done');
  });
}

function insertItem(req, res, next) {
  console.log('insert=====');
  var userId = req.session.userId;
  var topicId = req.body.topicId;
  var type = req.body.type;
  var _id = req.body._id;
  var prevItemId = req.body.prevItemId;

  async.auto({
    topic: function (callback) {
      _getTopicWithAuth(callback, topicId, userId);
    },
    detach: function (callback) {
      User.getUserById(userId, function (err, user) {
        if (err) {
          return callback(err);
        }
        if (!user) {
          return callback(new Error(400));
        }

        User.deleteItem(user, _id, callback);
      });
    },
    insert: ['topic', 'detach', function (callback, results) {
      var topic = results.topic;

      var prevItemIndex = -1;
      for (var i = 0; i < topic.items.length; i++) {
        if (topic.items[i] && topic.items[i].id == prevItemId) {
          prevItemIndex = i;
          break;
        }
      }
      topic.items.splice(prevItemIndex + 1, 0, {
        type: type,
        id: _id
      });
      topic.update_at = Date.now();
      topic.save(function (err) {
        callback(err);
      });
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    res.send(200);
    var topic = results.topic;
    topic.update({ update_at: Date.now() }, function () {
      updateNewTopics();
      _updateSingleTopicSiteCount(topic);
    });
    console.log('insert done');
  });
}

function editItem(req, res, next) {
  console.log('editItem=====');
  var userId = req.session.userId;
  var topicId = req.body.topicId;
  var itemId = req.body._id;
  var type = req.body.type;

  async.auto({
    topic: function (callback) {
      _getTopicWithAuth(callback, topicId, userId);
    },
    item: ['topic', function (callback) {
      try {
        var data = helper.getData(req);
      } catch (err) {
        return callback(err);
      }
      Item.editItem(type, itemId, data, callback);
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    var item = results.item;
    res.json(helper.getItemData(item));
    console.log('editItem done');
    var topic = results.topic;
    topic.update({ update_at: Date.now() }, function () {
      updateNewTopics();
      _updateSingleTopicSiteCount(topic);
    });
  });
}

function deleteItem(req, res, next) {
  console.log('deleteItem=====');
  var userId = req.session.userId;
  var topicId = req.body.topicId;
  var type = req.body.type;
  var itemId = req.body._id;

  async.auto({
    topic: function (callback) {
      _getTopicWithAuth(callback, topicId, userId);
    },
    deleteItem: ['topic', function (callback, results) {
      var topic = results.topic;
      Item.deleteItem(type, itemId, function (err) {
        if (err) {
          return callback(err);
        }
        var index = -1;
        for (var i = 0; i < topic.items.length; i++) {
          if (topic.items[i] && topic.items[i].id == itemId) {
            index = i;
            break;
          }
        }
        if (index == -1) {
          return callback(new Error(400));
        }
        topic.items.splice(index, 1);
        topic.update_at = Date.now();
        topic.save(function (err) {
          callback(err);
        });
      });
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    res.send(200);
    var topic = results.topic;
    updateNewTopics();
    _updateSingleTopicSiteCount(topic);
    console.log('deleteItem done');
  });
}

function createTopic(req, res, next) {
  var userId = req.session.userId;

  async.auto({
    topics: function (callback) {
      Topic.getAllTopicsByAuthorId(userId, callback);
    },
    topic: ['topics', function (callback, results) {
      var topics = results.topics;
      for (var i = 0; i < topics.length; i++) {
        var topic = topics[i];
        if (!topic.url && !topic.title && !topic.description && !topic.items.length) {
          return callback(null, topic);
        }
      }
      Topic.createTopic(userId, callback);
    }],
    if: ['topics', 'topic', function (callback, results) {
      if (results.topics.length) {
        return callback();
      }
      var topic = results.topic;
      async.auto({
        item1: function (callback) {
          Item.createItem({
            type: 'TITLE',
            title: '一篇策展由若干不同类型的条目排列而成，一个条目又叫一个“石子儿”，我是一个“标题”类型石子儿'
          }, callback);
        },
        item2: function (callback) {
          Item.createItem({
            type: 'TEXT',
            text: '石子儿有7种类型：“标题”、“文本”、“图片”、“引文”、“视频”、“微博”、“网页”。我是一个“文本”类型石子儿。'
          }, callback);
        },
        item3: function (callback) {
          Item.createItem({
            type: 'IMAGE',
            url: 'http://shizier.qiniudn.com/5374276ca256f58aab500db8',
            title: '家庭DIY蛋糕心得-蛋糕-美食',
            quote: 'http://eat.gansudaily.com.cn/system/2009/03/04/011014400.shtml',
            description: '我是一个“图片”类型石子儿'
          }, callback);
        },
        item4: function (callback) {
          Item.createItem({
            type: 'CITE',
            cite: '2012年被业界称为“内容策展年”。因社交化媒体2009-2010年爆发式发展，网络上的社交互动，最终将发展为社交化内容策展的需要。\n因此2012年，互联网的结构化、一键式、社交化内容策展将有机会深度整合和提升。\n社交媒体行业的第一个潮流转变了信息消费方式，社交化策展也将随时间彻底改变用户发现内容并与之互动的方式。',
            url: 'http://baike.baidu.com/link?url=j6aZ12vpok49HYrwJIIauQkT5ZTwL38eeBy_oH69-JW7EOmdIQamwmCppXVn3nr2NiM_HBhkiHVW1lQG7-U4yK',
            title: '策展_百度百科',
            description: '我是一个“引文”类型石子儿'
          }, callback);
        },
        item5: function (callback) {
          Item.createItem({
            type: 'VIDEO',
            vid: 'Bz5Uh9CK0PnUKTeR8hCtNw..',
            cover: 'http://vi0.ku6img.com/data1/p3/ku6video/2013/1/5/6/1362547555180_38758694_38758694/5.jpg',
            url: 'http://v.ku6.com/show/Bz5Uh9CK0PnUKTeR8hCtNw...html?nr=1',
            title: '品位生活 策展人带你看画展',
            description: '我是一个“视频”类型石子儿'
          }, callback);
        },
        item6: function (callback) {
          Item.createItem({
            type: 'LINK',
            url: 'http://shizier.com',
            title: '石子儿 - 互联网内容策展',
            description: '我是一个“网页”类型石子儿'
          }, callback);
        },
        item7: function (callback) {
          Item.createItem({
            type: 'TITLE',
            title: '每个石子儿右侧→有操作按钮：“采集”收藏到右侧，“箭头”拖放或上下移动，以及“修改”“删除”'
          }, callback);
        },
        item8: function (callback) {
          Item.createItem({
            type: 'TITLE',
            title: '使用右侧边栏→→→的魔术棒图标下的“★采集石子儿”从任意网站“一键”采集石子儿'
          }, callback);
        },
        item9: function (callback) {
          Item.createItem({
            type: 'TITLE',
            title: '把鼠标移动到两个石子儿之间“↓↓↓”会出现添加菜单'
          }, callback);
        },
        item10: function (callback) {
          Item.createItem({
            type: 'TEXT',
            text: '到此为止，您已经了解了石子儿的基本使用方法。您可以修改这篇策展，或点击右上角的“返回”，然后创建一篇新空白策展。'
          }, callback);
        },
        item11: function (callback) {
          Item.createItem({
            type: 'LINK',
            url: 'http://shizier.com/topic/533d3555d1178f3f783ad3e3',
            title: '手把手教你如何做策展',
            description: '想了解更多技巧？'
          }, callback);
        },
        append: ['item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7', 'item8', 'item9', 'item10', 'item11', function (callback, results) {
          var item1 = results.item1;
          var item2 = results.item2;
          var item3 = results.item3;
          var item4 = results.item4;
          var item5 = results.item5;
          var item6 = results.item6;
          var item7 = results.item7;
          var item8 = results.item8;
          var item9 = results.item9;
          var item10 = results.item10;
          var item11 = results.item11;
          topic.items = [{
            type: item1.type,
            id: item1._id
          },{
            type: item2.type,
            id: item2._id
          },{
            type: item3.type,
            id: item3._id
          },{
            type: item4.type,
            id: item4._id
          },{
            type: item5.type,
            id: item5._id
          },{
            type: item6.type,
            id: item6._id
          },{
            type: item7.type,
            id: item7._id
          },{
            type: item8.type,
            id: item8._id
          },{
            type: item9.type,
            id: item9._id
          },{
            type: item10.type,
            id: item10._id
          },{
            type: item11.type,
            id: item11._id
          }];
          topic.save(callback);
        }]
      }, callback);
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }
    var topic = results.topic;
    if (!topic) {
      return next(new Error(500));
    }

    console.log('createTopic done');
    res.redirect('/topic/' + topic._id + '/edit');
  });
}

function deleteTopic(req, res, next) {
  console.log('deleteTopic=====');
  var authorId = req.session.userId;
  var topicId = req.params.topicId;

  _getTopicWithAuth(function (err, topic) {
    if (err) {
      return next(err);
    }
    Topic.deleteTopic(topic, function (err) {
      if (err) {
        return next(err);
      }

      async.forEach(topic.items, function (item, callback) {
        Item.deleteItem(item.type, item.id, callback);
      });
      res.send(200);
      updateNewTopics();
      _updateSingleTopicSiteCount(topic, true);
      console.log('deleteTopic done');
    });
  }, topicId, authorId);
}

function saveCover(req, res, next) {
  console.log('saveCover=====');
  var authorId = req.session.userId;
  var _id = req.body._id;
  var cover_url = sanitize(req.body.cover_url).trim();

  _getTopicWithAuth(function (err, topic) {
    if (err) {
      return next(err);
    }
    Topic.saveCover(topic, cover_url, function (err, topic) {
      if (err) {
        return next(err);
      }
      res.json({
        _id: topic._id,
        cover_url: topic.cover_url
      });
      updateNewTopics();
      console.log('saveCover done');
    });
  }, _id, authorId);
}

function saveTitle(req, res, next) {
  console.log('saveTitle=====');
  var authorId = req.session.userId;
  var _id = req.body._id;
  var title = sanitize(req.body.title).trim();
  var description = sanitize(req.body.description).trim();

  try {
    check(title).len(5, 50);
    check(description).len(0, 140);
  } catch (err) {
    return next(err);
  }

  _getTopicWithAuth(function (err, topic) {
    if (err) {
      return next(err);
    }
    Topic.saveTitle(topic, title, description, function (err, topic) {
      if (err) {
        return next(err);
      }
      res.json({
        _id: topic._id,
        title: topic.title,
        description: topic.description
      });
      updateNewTopics();
      console.log('saveTitle done');
    });
  }, _id, authorId);
}

function saveCategory(req, res, next) {
  console.log('saveCategory=====');
  var authorId = req.session.userId;
  var topicId = req.body.topicId;
  var category = sanitize(req.body.category).trim();
  var valid = Common.CATEGORIES2ENG[category];

  if (!valid) {
    return next(new Error(400));
  }

  _getTopicWithAuth(function (err, topic) {
    if (err) {
      return next(err);
    }
    Topic.saveCategory(topic, category, function (err, topic) {
      if (err) {
        return next(err);
      }
      res.json({
        category: topic.category
      });
      updateCategoryTopics();
      console.log('saveCategory done');
    });
  }, topicId, authorId, res.locals.isAdmin);
}

function publishTopic(req, res, next) {
  console.log('publishTopic=====');
  var authorId = req.session.userId;
  var topicId = req.body.topicId;

  _getTopicWithAuth(function (err, topic) {
    if (err) {
      return next(err);
    }
    Topic.publishTopic(topic, function (err) {
      if (err) {
        return next(err);
      }
      res.send(200);
      updateNewTopics();
      _updateSingleTopicSiteCount(topic);
      console.log('publishTopic done');
    });
  }, topicId, authorId);
}

function favorite(req, res, next) {
  console.log("add or remove likes for topic");
  var topicId = req.body.topicId;
  var toLike = sanitize(req.body.toLike).toBoolean();

  //what need to do is.
  //1. add/remove likes in topic
  //2. add/remove topicId in likeList for the current user.

  User.getUserById(req.session.userId, function (err, user) {
    if (err) {
      console.log(err);
      return next(err);
    }
    if (!user) {
      console.log("cannot find user by id");
      return next(new Error(400));
    }
    //found the user
    if (toLike) {
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
        return next(err);
      }

      //update topic info
      Topic.getTopicById(topicId, function (err, topic) {
        if (err) {
          console.log(err);
          return next(err);
        }
        if (!topic) {
          console.log("cannot find topic");
          return next(new Error(400));
        }
        var userId = user._id;
        if (toLike) {
          if (topic.FVList.indexOf(userId) == -1) {
            //not exist
            topic.FVList.push(userId);
            topic.FVCount += 1;
          }
        } else {
          //toLike == "false"
          var index = topic.FVList.indexOf(userId);
          if (index > -1) {
            topic.FVList.splice(index, 1);
            topic.FVCount -= 1;
          }
        }

        topic.save(function (err) {
          if (err) {
            console.log("topic save err");
            return next(err);
          }
          res.send({FVCount: topic.FVCount });
        });
      });
    });
  });
}

function addTag(req, res, next) {
  var tagText = sanitize(req.body.text).trim();
  var userId = req.session.userId;
  var topicId = req.body.topicId;

  try {
    check(tagText).len(0, 20);
  } catch (err) {
    return next(err);
  }

  async.auto({
    topic: function (callback) {
      _getTopicWithAuth(callback, topicId, userId);
    },
    tag: ['topic', function (callback, results) {
      Topic.addTag(results.topic, tagText, callback);
    }]
  }, function (err) {
    if (err) {
      return next(err);
    }

    res.send(200);
  });
}

function removeTag(req, res, next) {
  var tagText = sanitize(req.body.text).trim();
  var userId = req.session.userId;
  var topicId = req.body.topicId;

  async.auto({
    topic: function (callback) {
      _getTopicWithAuth(callback, topicId, userId);
    },
    tag: ['topic', function (callback, results) {
      Topic.removeTag(results.topic, tagText, callback);
    }]
  }, function (err) {
    if (err) {
      return next(err);
    }

    res.send(200);
  });
}

/**
 * 下面是更新top列表的方法
 */
function updateNewTopics() {
  Topic.getNewTopics(function (err, topics) {
    if (err) {
      return console.error(err.stack);
    }

    Common.TopList.newTopics = topics;
  });
}

function _traditionalScore(pv, likes) {
  return pv / 100 + likes;
}

function _newHotScore(score, publishDate, updateDate) {
  var publish = (1000 * 60 * 60 * 24) / ((Date.now() - publishDate) || 1);
  Math.min(publish, 1);
  var update = (1000 * 60 * 60) / ((Date.now() - updateDate) || 1);
  Math.min(update, 1);
  return score + 100 * publish + 100 * update;
}

function _scoreCompare(top1, top2) {
  return (top2.score - top1.score);
}

function updateHotTopics() {
  Topic.getPublishedTopics(function (err, topics) {
    if (err) {
      return console.error(err.stack);
    }
    if (!topics) {
      return;
    }

    for (var i in topics) {
      topics[i].score = _traditionalScore(topics[i].PV_count, topics[i].FVCount);
    }

    console.log("更新热门策展");
    Common.TopList.classicTopics = topics.sort(_scoreCompare).slice(0, 120);

    var authorMap = {};
    var tagMap = {};
    for (var i in topics) {
      topics[i].score = _newHotScore(topics[i].score, topics[i].publishDate, topics[i].update_at);
      authorMap[topics[i].author_id] = authorMap[topics[i].author_id] || { score: 0 };
      authorMap[topics[i].author_id].score += topics[i].score;
      for (var j = 0; j < topics[i].tags.length; j++) {
        tagMap[topics[i].tags[j]] = tagMap[topics[i].tags[j]] || { score: 0 };
        tagMap[topics[i].tags[j]].score += topics[i].score;
      }
    }
    Common.TopList.hotTopics = topics.sort(_scoreCompare).slice(0, 120);
    Common.TopList.totalTopicCount = topics.length;
    Common.FeaturedTopics = topics.slice(0, 3);
    async.forEachSeries(Common.FeaturedTopics, function (topic, callback) {
      User.getUserById(topic.author_id, function (err, user) {
        if (err) {
          return callback(err);
        }
        if (!user) {
          return callback(new Error());
        }
        topic.author_url = user.url;
        callback(null);
      });
    }, function (err) {
      if (err) {
        console.error(err.stack);
      }
    });

    var authorIds = [];
    for (var id in authorMap) {
      authorIds.push(id);
    }
    authorIds.sort(function (a, b) {
      return (authorMap[b].score - authorMap[a].score);
    });
    var hotAuthorIds = authorIds.slice(0, 7);
    User.getUserByIds(hotAuthorIds, function (err, authors) {
      authors.sort(function (a, b) {
        return (authorMap[b._id].score - authorMap[a._id].score);
      });
      Common.TopList.hotAuthors = authors;
    });

    var tagTexts = [];
    for (var text in tagMap) {
      tagTexts.push(text);
    }
    tagTexts.sort(function (a, b) {
      return (tagMap[b].score - tagMap[a].score);
    });
    Common.TopList.hotTags = tagTexts.slice(0, 13);
  });
}

function updateCategoryTopics() {
  for (var category in Common.CATEGORIES2ENG) {
    (function (category) {
      Topic.getCategoryTopics(category, function (err, topics) {
        if (err) {
          return console.error(err.stack);
        }
        if (!topics) {
          return;
        }

        for (var i in topics) {
          topics[i].score = _traditionalScore(topics[i].PV_count, topics[i].FVCount);
        }

        var authorMap = {};
        var tagMap = {};
        for (var i in topics) {
          topics[i].score = _newHotScore(topics[i].score, topics[i].publishDate, topics[i].update_at);
          authorMap[topics[i].author_id] = authorMap[topics[i].author_id] || { score: 0 };
          authorMap[topics[i].author_id].score += topics[i].score;
          for (var j = 0; j < topics[i].tags.length; j++) {
            tagMap[topics[i].tags[j]] = tagMap[topics[i].tags[j]] || { score: 0 };
            tagMap[topics[i].tags[j]].score += topics[i].score;
          }
        }
        Common.TopList.categoryTopics[category] = topics.sort(_scoreCompare).slice(0, 120);
        Common.TopList.categoryTopicCount[category] = topics.length;

        var authorIds = [];
        for (var id in authorMap) {
          authorIds.push(id);
        }
        authorIds.sort(function (a, b) {
          return (authorMap[b].score - authorMap[a].score);
        });
        var hotAuthorIds = authorIds;//.slice(0, 7);
        User.getUserByIds(hotAuthorIds, function (err, authors) {
          authors.sort(function (a, b) {
            return (authorMap[b._id].score - authorMap[a._id].score);
          });
          Common.TopList.categoryAuthors[category] = authors;
        });

        var tagTexts = [];
        for (var text in tagMap) {
          tagTexts.push(text);
        }
        tagTexts.sort(function (a, b) {
          return (tagMap[b].score - tagMap[a].score);
        });
        Common.TopList.categoryTags[category] = tagTexts;//.slice(0, 13);
      });
    })(category);
  }
}

function _updateSingleTopicSiteCount(topic, deleted) {
  if (deleted) {
    delete Common.Topic[topic._id];
    return;
  }
  Item.getItems(topic, function (err, items) {
    if (err) {
      return;
    }
    if (!items) {
      return;
    }

    var urlCount = 0;
    var siteList = [];
    items.forEach(function (item) {
      if (item && item.url) {
        urlCount++;
        siteList.push(utils.getQuote(item.type == 'IMAGE' ? item.quote : item.url));
      }
    });
    Common.Topic[topic._id] = Common.Topic[topic._id] || {};
    Common.Topic[topic._id].urlCount = urlCount;
    var sites = {};
    siteList.forEach(function (site) {
      sites[site] = 1;
    });
    Common.Topic[topic._id].siteCount = Object.keys(sites).length;
  });
}

function updateTopicSiteCount() {
  Topic.getPublishedTopics(function (err, topics) {
    if (err) {
      return console.error(err.stack);
    }

    topics.forEach(function (topic) {
      _updateSingleTopicSiteCount(topic);
    });
  });
}

exports.createTopic = createTopic;
exports.showEdit = showEdit;
exports.showChang = showChang;
exports.showShareChang = showShareChang;
exports.showIndex = showIndex;
exports.createItem = createItem;
exports.sortItem = sortItem;
exports.insertItem = insertItem;
exports.editItem = editItem;
exports.deleteItem = deleteItem;
exports.deleteTopic = deleteTopic;
exports.saveCover = saveCover;
exports.saveTitle = saveTitle;
exports.saveCategory = saveCategory;
exports.publishTopic = publishTopic;
exports.favorite = favorite;
exports.sendChang = sendChang;
exports.addTag = addTag;
exports.removeTag = removeTag;

exports.updateNewTopics = updateNewTopics;
exports.updateHotTopics = updateHotTopics;
exports.updateCategoryTopics = updateCategoryTopics;
exports.updateTopicSiteCount = updateTopicSiteCount;