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
var request = require('request');
var Iconv = require('iconv').Iconv;
var BufferHelper = require('bufferhelper');
var domain = require('domain');
var phantom = require('phantom');
var fs = require('fs');
var portfinder = require('portfinder');
var mongodb = require('mongodb');
var zlib = require('zlib');
var weibo = require('weibo');
var extend = require('extend');
var config = require('../config');

var helper = require('../helper/helper');
var WeiboHelper = require('../helper/weibo');
var escape = helper.escape;

var Common = require('../common');
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
    }],
    collectionItems: function (callback) {
      User.getItems(userId, callback);
    }
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    var topic = results.topic;
    var items = results.items;
    var itemsData = [];
    items.forEach(function (item) {
      itemsData.push(Item.getItemData(item));
    });
    var collectionItems = results.collectionItems;
    var collectionItemsData = [];
    collectionItems.forEach(function (item) {
      collectionItemsData.push(Item.getItemData(item));
    });
    res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, post-check=0, pre-check=0');
    res.set('Connection', 'close');
    res.set('Expire', '-1');
    res.set('Pragma', 'no-cache');
    res.render('topic/edit', {
      pageType: 'EDIT',
      title: '策展中',
      css: [
        'http://cdn.bootcss.com/messenger/1.4.0/css/messenger.css',
        'http://cdn.bootcss.com/messenger/1.4.0/css/messenger-theme-flat.css',
        'http://cdn.bootcss.com/fancybox/2.1.5/jquery.fancybox.css',
        'http://cdn.bootcss.com/fancybox/2.1.5/helpers/jquery.fancybox-buttons.css',
        'http://cdn.bootcss.com/fancybox/2.1.5/helpers/jquery.fancybox-thumbs.css',
        '/stylesheets/topic.css',
        '/stylesheets/edit.css'
      ],
      js: [
        '/bower_components/angular-elastic/elastic.js',
        '/javascripts/ui-utils.min.js',
        'http://cdn.bootcss.com/messenger/1.4.0/js/messenger.js',
        'http://cdn.bootcss.com/messenger/1.4.0/js/messenger-theme-flat.js',
        'http://cdn.bootcss.com/jquery-mousewheel/3.1.6/jquery.mousewheel.min.js',
        'http://cdn.bootcss.com/fancybox/2.1.5/jquery.fancybox.js',
        'http://cdn.bootcss.com/fancybox/2.1.5/helpers/jquery.fancybox-buttons.js',
        'http://cdn.bootcss.com/fancybox/2.1.5/helpers/jquery.fancybox-thumbs.js',
        '/javascripts/jquery-ui-1.10.3.custom.min.js',
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

  var ep = EventProxy.create('topic', 'items', 'author', function (topic, items, author) {
    var updateDate = topic.update_at.getFullYear() + '-'
      + (topic.update_at.getMonth() + 1) + '-'
      + topic.update_at.getDate();

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
      itemsData.push(Item.getItemData(item));
    });

    var authorData = {
      author: author.loginName,
      imgUrl: author.url,
      description: author.description,
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
    res.render('topic/chang', {
      title: topicData.title,
      description: topicData.description,
      escape: escape,
      topic: topicData,
      items: itemsData,
      authorInfo: authorData,
      layout: false
    });
    console.log('showChang done');
  })
    .fail(function (err) {
      return next(err);
    });

  Topic.getTopicById(topicId, ep.done(function (topic) {
    if (!topic || !topic.publishDate) {
      ep.unbind();
      res.send(404, '您要查看的策展不存在');
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

function showShareChang(req, res, next) {
  console.log('===== showShareChang =====');
  var topicId = req.params.topicId;

  Topic.getTopicById(topicId, function (err, topic) {
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
      Topic.getTopicById(topicId, function (err, topic) {
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
      var topic = results.topic;
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

function showIndex(req, res, next) {
  console.log('showIndex=====');
  var userId = req.session.userId;
  var topicId = req.params.topicId;

  //ep的error没处理
  var ep = EventProxy.create('topic', 'items', 'author', function (topic, items, author) {
    var itemsData = [];
    items.forEach(function (item) {
      itemsData.push(Item.getItemData(item));
    });
    var authorData = {
      author: author.loginName,
      imgUrl: author.url,
      description: helper.linkify(escape(author.description)),
      personalSite: author.personalSite,
      favourite: author.favourite
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
      topic: topic,
      Topic: Common.Topic,
      tags: topic.tags,
      Tags: Common.Tags,
      items: itemsData,
      authorInfo: authorData,
      authorCategoryList: Common.AuthorCategoryList,
      CATEGORIES2ENG: Common.CATEGORIES2ENG,
      liked: liked
    });
    console.log('showIndex done');
  })
    .fail(function (err) {
      return next(err);
    });

  Topic.getTopicById(topicId, ep.done(function (topic) {
    if (!topic || !topic.publishDate) {
      ep.unbind();
      res.send(404, '您要查看的策展不存在');
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
    var data = Item.getData(req);
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
          results.src = results.srcs && results.srcs[0];
          data = results;
          callback();
        });
      } else if (data.type == 'VIDEO_CREATE') {
        _getVideoDetail(data.url, function (err, results) {
          if (err) return callback(err);
          data = results;
          callback();
        });
      } else if (data.type == 'WEIBO_CREATE') {
        _getWeiboDetail(data.url, function (err, results) {
          if (err) return callback(err);
          data = results;
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

        Topic.increaseItemCountBy(topic, 1, function (err, topic) {
          if (err) {
            return callback(err);
          }
          if (!topic) {
            return callback(new Error(500));
          }
          Topic.updateSingleTopicSiteCount(topic);
        });
        callback(null, item);
      });
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    var item = results.item;
    res.json(Item.getItemData(item));
    var topic = results.topic;
    topic.update({ update_at: Date.now() }, function () {
      Topic.updateNewTopics();
    });
    console.log('createItem done');
  });
}

function sortItem(req, res, next) {
  console.log('sort=====');
  var userId = req.session.userId;
  var topicId = req.body.topicId;
  var type = req.body.type;
  var itemId = req.body._id;
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

      Item.detachItem(item, function (err) {
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
      Item.insertItem(prevItem, item, function (err) {
        if (err) {
          callback(err);
          return;
        }

        callback();
      });
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    res.send(200);
    var topic = results.topic;
    topic.update({ update_at: Date.now() }, function () {
      Topic.updateNewTopics();
    });
    console.log('sort done');
  });
}

function insertItem(req, res, next) {
  console.log('insert=====');
  var userId = req.session.userId;
  var topicId = req.body.topicId;
  var type = req.body.type;
  var _id = req.body._id;
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
      Item.getItemById(type, _id, function (err, item) {
        if (err) {
          return callback(err);
        }
        if (!item) {
          return callback(new Error(400));
        }

        callback(null, item);
      });
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
    insert: ['topic', 'prevItem', 'item', 'detach', function (callback, results) {
      var topic = results.topic;
      var prevItem = results.prevItem;
      var item = results.item;
      if (!prevItem) {
        prevItem = {
          type: 'VOID',
          _id: topic.void_item_id
        };
      }
      Item.insertItem(prevItem, item, function (err) {
        if (err) {
          return callback(err);
        }

        Topic.increaseItemCountBy(topic, 1, function (err, topic) {
          if (err) {
            return callback(err);
          }
          if (!topic) {
            return callback(new Error(500));
          }
          Topic.updateSingleTopicSiteCount(topic);
        });
        callback();
      });
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    res.send(200);
    var topic = results.topic;
    topic.update({ update_at: Date.now() }, function () {
      Topic.updateNewTopics();
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
    item: function (callback) {
      _getItemWithAuth(callback, type, itemId, topicId);
    },
    update: ['topic', 'item', function (callback, results) {
      var topic = results.topic;
      var item = results.item;
      try {
        var data = Item.getData(req);
      } catch (err) {
        return callback(err);
      }
      item.update(data, function (err) {
        if (err) {
          return callback(err);
        }

        callback(null);
      });
    }],
    newItem: ['update', function (callback) {
      Item.getItemById(type, itemId, function (err, item) {
        if (err) {
          return callback(err);
        }
        if (!item) {
          return callback(new Error(500));
        }

        callback(null, item);
      });
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    var newItem = results.newItem;
    res.json(Item.getItemData(newItem));
    var topic = results.topic;
    topic.update({ update_at: Date.now() }, function () {
      Topic.updateNewTopics();
    });
    Topic.updateSingleTopicSiteCount(topic);
    console.log('editItem done');
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

        Topic.increaseItemCountBy(topic, -1, function (err, topic) {
          if (err) {
            return callback(err);
          }
          if (!topic) {
            return callback(new Error(500));
          }
          Topic.updateSingleTopicSiteCount(topic);
        });
        callback();
      });
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    res.send(200);
    var topic = results.topic;
    topic.update({ update_at: Date.now() }, function () {
      Topic.updateNewTopics();
    });
    console.log('deleteItem done');
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
      res.send(200);
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
      console.log('publishTopic done');
    });
  }, topicId, authorId);
}

function _getHtml(url, callback) {
  console.log(url);
  callback = callback || function () {
  };
  var d = domain.create();
  d.on('error', function (err) {
    callback(err);
  });
  d.run(function () {
    request({url: url, encoding: null, 'headers': {'Accept-Encoding': 'gzip,deflate', Cookie: config.WEIBO_COOKIE}}, function (error, response, body) {
      if (error) {
        return callback(error);
      }
      var buffer = body;
      async.series([function (callback) {
        switch (response.headers['content-encoding']) {
          case 'gzip':
            zlib.gunzip(buffer, function (err, buf) {
              if (err) {
                return callback(err);
              }

              buffer = buf;
              callback();
            });
            break;
          case 'deflate':
            zlib.inflateRaw(buffer, function (err, buf) {
              if (err) {
                return callback(err);
              }

              buffer = buf;
              callback();
            });
            break;
          default:
            callback();
            break;
        }
      }], function (err) {
        if (err) {
          return callback(err);
        }

        var temp;
        var charset = !(temp = response.headers['content-type']) ? null :
          !(temp = temp.match(/charset=([^\s;]+)/i)) ? null :
            !temp[1] ? null : temp[1];
        console.log(charset);
        try {
          var html = new Iconv(charset || 'UTF-8', 'UTF-8//TRANSLIT//IGNORE').convert(buffer).toString();
        } catch (err) {
          return callback(err);
        }
        var charset2 = !(temp = html.match(/<meta[^<>]+charset\s*=\s*("|')?([^"'\s/>]+)/i)) ? null : temp[2];
        console.log(charset2);
        if (charset2 &&
          (!charset
            || charset2.toLowerCase() != charset.toLowerCase())) {
          try {
            var html = new Iconv(charset2 || 'UTF-8', 'UTF-8//TRANSLIT//IGNORE').convert(buffer).toString();
          } catch (err) {
            return callback(err);
          }
        }

        callback(null, html);
      })
    });
  });
}

function _getLinkDetail(url, callback) {
  callback = callback || function () {
  };
  _getHtml(url, function (err, html) {
    if (err) {
      return callback(err);
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
    if (snippet.length > 140) {
      snippet = snippet.substr(0, 139) + '…';
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
          addToSrcs(img);
        } else {
        }
        continue;
      }
      thumb = !img ? null : !(temp = img.match(/\ssrc\s*=\s*("|')[^"']+\.jpg("|')/i)) ? null : temp[0];
      if (thumb) {
        addToSrcs(img);
        continue;
      }
    }
    console.log(srcs.length);
    callback(null, {
      type: 'LINK',
      url: url,
      title: title,
      snippet: snippet,
      srcs: srcs
    });
  });
}

function _getVideoDetail(url, callback) {
  callback = callback || function () {
  };
  _getHtml(url, function (err, html) {
    if (err) {
      callback(err);
      return;
    }
    var temp;
    var title;
    var quote = utils.getQuote(url, 'VIDEO');
    var vid;
    var cover;
    console.log(quote);
    switch (quote) {
      case 'youku.com':
        //plan A
        //&tt=第二十一回&nbsp;惊见摘头鬼 坑亲王谢幕&pu=
        title = !(temp = html.match(/&tt=(((?!&pu).)*)/i)) ? null : !temp[1] ? null : temp[1];
        //http://v.youku.com/v_show/id_XNjEyOTU3NjE2.html?f=20383529&ev=1
        //http://v.youku.com/v_show/id_XNjQxNTE5MDYw_ev_1.html
        //http://v.youku.com/v_show/id_XOTc4MTQ5MDg=.html
        vid = !(temp = url) ? null : !(temp = temp.match(/id_([\w\-=]{13})/i)) ? null : !temp[1] ? null : temp[1];
        //&pics=http://g1.ykimg.com/0100641F465298B35464C306340F021E6E83FF-FD92-B358-8009-D0B224F8C83D&site=优酷
        //128x96
        cover = !(temp = html.match(/&pics=([^&"']*)/i)) ? null : !temp[1] ? null : temp[1];
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
        //<script...,pic:"http://i1.tdimg.com/183/538/614/p.jpg"...</script>
        //<script...,pic: 'http://i2.tdimg.com/008/657/421/p.jpg'...</script>
        //128x96
        cover = !(temp = html.match(/<script[\s\S]*,pic:\s*("|')([^"']+)("|')[\s\S]*<\/script>/)) ? null : !temp[2] ? null : temp[2];
        break;
      case 'iqiyi.com':
        //专题性质的，即a_的暂不支持，同weibo，无技术障碍
        //plan A
        //<em data-widget-crumbs-elem="name" data-widget-crumbs-name-max="56">恐怖杀手：诡异人体寄生虫-热纪录</em>
        title = !(temp = html.match(/<em data-widget-crumbs-elem="name" data-widget-crumbs-name-max="56">([^<>]*)<\/em>/i)) ? null : !temp[1] ? null : temp[1];
        //http://www.iqiyi.com/a_19rrgjauj5.html(无标题，封面)
        //http://www.iqiyi.com/v_19rrhfcr84.html
        //<div id="flashbox"......data-player-videoid="a97be8194627fef129d23cd05b834f79"......>
        vid = !(temp = html.match(/<div[^<>]*\sid="flashbox"[^<>]*\sdata-player-videoid="([^">]*)/i)) ? null : !temp[1] ? null : temp[1];
        //<meta itemprop="image" content='http://pic5.qiyipic.com/image/20131121/v_103890888_m_601_160_120.jpg' />
        //160x120
        //todo 封面403
        cover = !(temp = html.match(/<meta\s+itemprop="image"\s+content='([^'>]*)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'pps.tv':
        //plan A
        //<h1 class="p-title"><a title="最肥小龙女！陈妍希被喊滚出娱乐圈"
        title = !(temp = html.match(/<h1 class="p-title"><a title="([^"'>]*)/i)) ? null : !temp[1] ? null : temp[1];
        //http://v.pps.tv/play_38J3NV.html
        vid = !(temp = url) ? null : !(temp = temp.match(/(\w{6})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        //<script..."sharepic":"http:\/\/s2.ppsimg.com\/ugc\/ugc_pic\/1\/70\/18adf8c00dcb95a947c272ef063e8f631f8e791d\/480_360_pps-000.jpg"...</script>
        //128x80
        cover = !(temp = html.match(/<script[\s\S]*"sharepic":"([^">]*)"[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1].replace(/\\\//g, '/').replace('480_360', '128_80');
        break;
      case 'sohu.com':
        //plan A
        //<h2>\s20130712 第一期 姚贝娜《也许明天》\s</h2>
        title = !(temp = html.match(/<h2>\s*([^<>]*)\s*<\/h2>/i)) ? null : !temp[1] ? null : temp[1];
        //http://tv.sohu.com/20130712/n381487508.shtml
        //<script type="text/javascript">......var vid="1237900";......</script>
        vid = !(temp = html.match(/<script((?!<\/script>)[\s\S])*\svar vid\s*=\s*['"]([^"'<>;]+)['"];/i)) ? null : !temp[2] ? null : temp[2];
        //<script...var cover="http://photocdn.sohu.com/20130712/vrsb902245.jpg";...</script>
        //120x90
        cover = !(temp = html.match(/<script[\s\S]*var cover="([^">]*)";[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'my.tv.sohu.com':
        //plan A
        //<script>......,title: '立邦漆广告之小屁股篇'......</script>
        title = !(temp = html.match(/<script((?!<\/script>)[\s\S])*\s,title:\s*['"]([^"'<>;]+)['"]/i)) ? null : !temp[2] ? null : temp[2];
        //http://my.tv.sohu.com/us/139695/445280.shtml
        //<script>......var vid  ='445280';......</script>
        vid = !(temp = html.match(/<script((?!<\/script>)[\s\S])*\svar vid\s*=\s*['"]([^"'<>;]+)['"];/i)) ? null : !temp[2] ? null : temp[2];
        //<script...,bCover: 'http://220.img.pp.sohu.com.cn/p220/2012/10/21/4/8/6_13b449acc64g102_445280_1_1.jpg'...</script>
        //120x90
        cover = !(temp = html.match(/<script((?!<\/script>)[\s\S])*,bCover: '([^'>]*)'/i)) ? null : !temp[2] ? null : temp[2];
        break;
      case 'qq.com':
        //plan A
        //var VIDEO_INFO={vid:"c00139loswm",title:" Ballerina",typeid:22,duration:"177",specialTemp:false}
        title = !(temp = html.match(/VIDEO_INFO=\{[\s\S]*title\s*:\s*("|')([^"'}]*)/i)) ? null : !temp[2] ? null : temp[2];
        //http://v.qq.com/page/c/w/m/c00139loswm.html
        //http://v.qq.com/cover/r/r0yx3vkrlz4rj85.html?vid=i00135hjy5k
        vid = (!(temp = url) ? null : !(temp = temp.match(/vid=([\w\-]{11})/i)) ? null : !temp[1] ? null : temp[1])
          || (!(temp = url) ? null : !(temp = temp.match(/([\w\-]{11})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1]);
        //http://vpic.video.qq.com/c00139loswm_160_90_3.jpg
        //160x90
        cover = 'http://vpic.video.qq.com/' + vid + '_160_90_3.jpg';
        break;
      case 'sina.com.cn':
        //http://video.sina.com.cn/haokan/play.html?url=http%3A%2F%2Fmy.tv.sohu.com%2Fus%2F53375285%2F62269772.shtml
        //http://video.sina.com.cn/m/sztvyw_63172701.html
        //上面两种url暂不支持，同weibo，未尝试
        //http://video.sina.com.cn/bl/6646436-1624364062-117652070.html(无封面)
        //http://tv.video.sina.com.cn/play/214323.html(无封面)
        //http://video.sina.com.cn/v/b/50691086-1854900491.html
        //http://video.sina.com.cn/p/news/s/v/2013-11-26/110663190307.html
        //plan A
        //$SCOPE['video'] = {......title:'【拍客】险 学生穿梭烂尾无护栏天桥上学',......}
        //<h1 class="titName" id="videoTitle">我们约会吧 20111115 张孟宁  </h1>
        title = (!(temp = html.match(/\$SCOPE\['video'\]\s*=\s*\{[\s\S]*title\s*:\s*'([^'}]*)/i)) ? null : !temp[1] ? null : temp[1])
          || (!(temp = html.match(/<h1[^>]*>([^<>]*)<\/h1>/i)) ? null : !temp[1] ? null : temp[1]);
        //<script......vid:'120263847',......</script>
        vid = !(temp = html.match(/<script((?!<\/script>)[\s\S])*\s+vid:'(\d+)',/i)) ? null : !temp[2] ? null : temp[2];
        //$SCOPE['video'] = {...pic: 'http://p3.v.iask.com/271/848/50691086_2.jpg',......}
        //119x90
        //135x90
        //160x90
        cover = !(temp = html.match(/\$SCOPE\['video'\] = \{[^{}]*\spic:\s*'([^'{}]*)',/i)) ? null : !temp[1] ? null : temp[1].replace('2.jpg', '1.jpg');
        break;
      case 'ifeng.com':
        //plan A
        //var videoinfo = {......"name": "中方就划设东海防空识别区驳斥美日有关言论",......}
        title = !(temp = html.match(/var videoinfo = \{[\s\S]*"name": "([^"}]*)/i)) ? null : !temp[1] ? null : temp[1];
        //http://v.ifeng.com/mil/mainland/201311/01bf1722-6d9d-419f-bf04-0c3afd6f2cf8.shtml
        //http://v.ifeng.com/ent/yllbt/special/20131125/index.shtml#b2755624-d591-4f08-ae54-349f473fe490(不能获取title，暂不支持，同weibo)
        //http://v.ifeng.com/live/#4AC51C17-9FBE-47F2-8EE0-8285A66EAFF5(直播用的channelId，暂不支持，同weibo)
        vid = !(temp = url) ? null : !(temp = temp.match(/(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})\.shtml([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        //<script..."img": "http://d.ifengimg.com/w120_h90/y0.ifengimg.com/pmop/storage_img/2013/11/25/9533e052-4f28-49b6-b545-87f95cdd643644.jpg",...</script>
        //120x90
        cover = !(temp = html.match(/<script[\s\S]*"img":\s*"([^";,<>]*)"[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'letv.com':
        //plan A
        //var __INFO__={......video : {......title:"唐罗利猜中获双人普吉岛浪漫游—非常了得",//视频名称......}......}
        title = !(temp = html.match(/var __INFO__=\{[\s\S]*video : \{[\s\S]*\stitle:"([^"}]*)/i)) ? null : !temp[1] ? null : temp[1];
        //http://www.letv.com/ptv/vplay/2050605.html
        vid = !(temp = url) ? null : !(temp = temp.match(/(\d{7})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        //<script...share:{pic:"http://i1.letvimg.com/yunzhuanma/201307/11/3790edee80983825b130eb660a067181/thumb/2.jpg",...</script>
        //120x90
        cover = !(temp = html.match(/<script[\s\S]*share:\{pic:"([^";,<>]*)"[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'pptv.com':
        //plan A
        //<title>英超-1314赛季-联赛-第12轮-曼城6：0热刺-精华_PPTV网络电视</title>
        title = !(temp = html.match(/<title>([^<>]*)<\/title>/i)) ? null : !temp[1] ? null : temp[1].substr(0, temp[1].lastIndexOf('_PPTV网络电视'));
        //http://v.pptv.com/show/icwtr6HibzIFicCQKg.html#(无封面)
        //http://v.pptv.com/show/VvVW1T2jE1G0Mpo.html
        vid = !(temp = url) ? null : !(temp = temp.match(/\/(\w+)\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'ku6.com':
        //plan A
        //<h1 title="《全民奥斯卡之幕后》第六期：道哥幽默访谈笑点多">
        title = !(temp = html.match(/<h1 title="([^"'>]*)/i)) ? null : !temp[1] ? null : temp[1];
        //http://v.ku6.com/show/Dq-TEVeOSRPxpr-MKaAhHg...html?hpsrc=1_12_1_1_0
        vid = !(temp = url) ? null : !(temp = temp.match(/([\w\-]{22}\.\.)\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        //<script...cover: "http://vi0.ku6img.com/data1/p9/ku6video/2013/11/22/18/1390433061875_86998474_86998474/1.jpg",...</script>
        //132x99
        cover = !(temp = html.match(/<script[\s\S]*cover:\s*"([^";,<>]*)"[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case '56.com':
        //plan A
        //<h1 id="vh_title">爸爸去哪儿20131122海岛特辑 暖男天天荣升好帮手 </h1>
        //<h1 id="vh_title"><span id="albumTitle">最强cos美少女战士 这样上街不怕被砍吗[搞笑视频 笑死人]</span>
        title = !(temp = html.match(/<h1 id="vh_title">(<span id="albumTitle">)?([^<>]*)(<\/h1>|<\/span>)/i)) ? null : !temp[2] ? null : temp[2];
        //http://www.56.com/u48/v_MTAxMTQ3MDYx.html
        //http://www.56.com/w92/play_album-aid-12053351_vid-MTAwOTU1MDI0.html
        vid = !(temp = url) ? null : !(temp = temp.match(/(\w{12})\.html\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        //<script..."URL_pURL":"24",..."user_id":"r480730716",..."URL_sURL":"3",..."URL_URLid":"sc_138478337743hd",..."img_host":"v19.56.com",...</script>
        //上面对应的url=http://v19.56img.com/images/24/3/r480730716i56olo56i56.com_sc_138478337743hd.jpg
        //130x78
        var p = !(temp = html.match(/<script[\s\S]*"URL_pURL":"([^";,<>]*)"[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1];
        var u = !(temp = html.match(/<script[\s\S]*"user_id":"([^";,<>]*)"[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1];
        var s = !(temp = html.match(/<script[\s\S]*"URL_sURL":"([^";,<>]*)"[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1];
        var id = !(temp = html.match(/<script[\s\S]*"URL_URLid":"([^";,<>]*)"[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1];
        var h = !(temp = html.match(/<script[\s\S]*"img_host":"([^";,<>]*)"[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1].replace('56.com', '56img.com');
        cover = !(p && u && s && id && h) ? null : 'http://' + h + '/images/' + p + '/' + s + '/' + u + 'i56olo56i56.com_' + id + '.jpg';
        break;
      case 'baomihua.com':
        //plan A
        //var temptitle = '权志龙独揽四项大奖演出惊艳全场';
        title = !(temp = html.match(/var temptitle = '([^']*)';/i)) ? null : !temp[1] ? null : temp[1];
        //http://video.baomihua.com/11258722/28470044
        vid = !(temp = url) ? null : !(temp = temp.match(/(\d{8})\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        //<script...var pic = "http://img03.video.baomihua.com/x/28470044.jpg";...</script>(也可以直接拼)
        //120x90
        cover = 'http://img01.video.baomihua.com/x/' + vid + '.jpg';
        break;
      case 'yinyuetai.com':
        //plan A
        //<meta property="og:title"......content="意外 官方版 - 薛之谦"/>
        title = !(temp = html.match(/<meta property="og:title"[^<>]*content="([^">]*)/i)) ? null : !temp[1] ? null : temp[1];
        //http://v.yinyuetai.com/video/818636
        vid = !(temp = url) ? null : !(temp = temp.match(/(\d{6})\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        //<meta property="og:image" content="http://img0.yytcdn.com/video/mv/131125/818636/E66901428C8A00732EBC7FE11A528C50_240x135.jpeg"/>
        //240x135
        //todo playlist
        cover = !(temp = html.match(/<meta property="og:image"[^<>]*content="([^">]*)/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'acfun.tv':
      case 'acfun.com':
        //plan A
        //<h1 id="title-article" class="title" title="视频标题">日产GT-R Nismo</h1>
        title = !(temp = html.match(/<h1 id="title-article" class="title" title="视频标题">([^<>]*)<\/h1>/i)) ? null : !temp[1] ? null : temp[1];
        //http://www.acfun.tv/a/ac926643(这是文章，要排除)
        //http://www.acfun.tv/v/ac926028
        vid = !(temp = url) ? null : !(temp = temp.match(/\/v\/ac(\w+)\/?([?&#]|$)/i)) ? null : !temp[1] ? null : temp[1];
        //<script...system.preview = $.parseSafe('http://g2.ykimg.com/1100641F4650FA56B9414F046A66C3E3F08B15-C6AF-7C3E-27F1-FED09306E33F');...</script>
        cover = !vid ? null : ~vid.indexOf('_') ? null : !(temp = html.match(/<script[\s\S]*system.preview\s*=\s*\$\.parseSafe\('([^';,<>)]*)'[\s\S]*<\/script>/i)) ? null : !temp[1] ? null : temp[1];
        break;
      case 'bilibili.tv':
      case 'bilibili.kankanews.com':
        //plan A
        //<meta name="title" content="【舍长实况】《逃生》全集（6P完结）" />
        title = !(temp = html.match(/<meta name="title" content="([^"<>]+)/i)) ? null : !temp[1] ? null : temp[1];
        //http://www.bilibili.tv/video/av805830
        //http://www.bilibili.tv/video/av805830/index.html
        //http://www.bilibili.tv/video/av805830/index_2.html
        vid = !(temp = url) ? null : !(temp = temp.match(/\/av(\d+)(\/index(_(\d+))?\.html)?\/?([?&#]|$)/i)) ? null : temp[1] + '&page=' + (temp[3] || '1');
        //<img src="http://i0.hdslb.com/u_f/50e9761218ca14014408fa95e8e0af9c.jpg" class="cover_image"/>
        //120x90
        cover = (/index_\d+\.html([?&#]|$)/i.test(url) && !/index(_1)?\.html([?&#]|$)/i.test(url)) ? null : !(temp = html.match(/<img src="([^"<>]+)" class="cover_image"\/>/i)) ? null : !temp[1] ? null : temp[1];
        break;
    }
    if (!vid) {
      callback(new Error(400));
      return;
    }
    if (title && title.length > 50) {
      title = title.substr(0, 49) + '…';
    }
    title = sanitize(title).entityDecode();
    title = sanitize(title).trim();
    callback(null, {
      type: 'VIDEO',
      url: url,
      vid: vid,
      cover: cover,
      title: title
    });
  });
}

function _getWeiboDetail(url, callback) {
  callback = callback || function () {
  };
  var temp;
  var mid = (temp = /weibo\.com\/\d+\/(\w+)/i.exec(url)) && temp[1];
  console.log(mid);
  var data;

  _getHtml('https://api.weibo.com/2/statuses/queryid.json?source=' + config.WEIBO_APPKEY + '&type=1&isBase62=1&mid=' + mid, function (err, html) {
    if (err) {
      return callback(err);
    }
    var idstr = JSON.parse(html).id;
    console.log(idstr);

    _getHtml('https://api.weibo.com/2/statuses/show.json?source=' + config.WEIBO_APPKEY + '&id=' + idstr, function (err, html) {
      if (err) {
        return callback(err);
      }
      console.log(html);
      async.series([function (callback) {
        data = extend(JSON.parse(html), {mid62: mid, id: null});
        if (!data.retweeted_status || !data.retweeted_status.idstr) {
          return callback();
        }
        _getHtml('https://api.weibo.com/2/statuses/querymid.json?source=' + config.WEIBO_APPKEY + '&type=1&id=' + data.retweeted_status.idstr, function (err, html) {
          if (err) {
            return callback(err);
          }
          console.log(JSON.parse(html));
          extend(data.retweeted_status, {mid62: JSON.parse(html).mid, id: null});
          return callback();
        });
      }], function (err) {
        if (err) {
          return callback(err);
        }
        if (!data || data.error) {
          return callback(new Error(400));
        }
        data.parsed_text = WeiboHelper.process_text(escape(data.text));
        if (data.retweeted_status && data.retweeted_status.idstr) {
          data.retweeted_status.parsed_text = WeiboHelper.process_text(escape(data.retweeted_status.text));
        }

        if (data.retweeted_status && data.retweeted_status.idstr) {
          data.retweeted_status.time = Item.getWeiboTime(data.retweeted_status.created_at);
        }
        callback(null, extend(data, {
          type: 'WEIBO',
          url: url,
          time: Item.getWeiboTime(data.created_at)
        }));
      });
    });
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
    res.json(results);
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
    res.json(results);
  });
}

function getWeiboDetail(req, res, next) {
  console.log('getWeiboDetail');
  var url = req.query.url;

  _getWeiboDetail(url, function (err, results) {
    if (err) {
      next(err);
      return;
    }
    res.json(results);
  });
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

exports.createTopic = createTopic;
exports.showEdit = showEdit;
exports.showChang = showChang;
exports.showShareChang = showShareChang;
exports.showIndex = showIndex;
exports.createItem = createItem;
exports.editItem = editItem;
exports.sortItem = sortItem;
exports.insertItem = insertItem;
exports.deleteItem = deleteItem;
exports.deleteTopic = deleteTopic;
exports.saveCover = saveCover;
exports.saveTitle = saveTitle;
exports.saveCategory = saveCategory;
exports.publishTopic = publishTopic;
exports.getLinkDetail = getLinkDetail;
exports.getVideoDetail = getVideoDetail;
exports.getWeiboDetail = getWeiboDetail;
exports.favorite = favorite;
exports.sendChang = sendChang;
exports.addTag = addTag;
exports.removeTag = removeTag;