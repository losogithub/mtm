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
var request = require('request');
var domain = require('domain');
var phantom = require('phantom');
var fs = require('fs');
var portfinder = require('portfinder');
var mongodb = require('mongodb');
var extend = require('extend');
var config = require('../config');

var helper = require('../helper/helper');
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
      return next(err);
    }
    if (!topic) {
      return next(new Error(500));
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

    callback(null, item);
  });
}

function createItem(req, res, next) {
  console.log('createItem=====');
  var userId = req.session.userId;
  var topicId = req.body.topicId;
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
        helper.getLinkDetail(data.url, function (err, results) {
          if (err) return callback(err);
          results.src = results.srcs && results.srcs[0];
          data = results;
          callback();
        });
      } else if (data.type == 'VIDEO_CREATE') {
        helper.getVideoDetail(data.url, function (err, results) {
          if (err) return callback(err);
          data = results;
          callback();
        });
      } else if (data.type == 'WEIBO_CREATE') {
        helper.getWeiboDetail(data.url, function (err, results) {
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
    item: ['parse', function (callback) {
      Item.createItem(data, function (err, item) {
        if (err) {
          callback(err);
          return;
        }

        if (!item) {
          callback(new Error(500));
          return;
        }

        callback(null, item);
      });
    }],
    insert: ['topic', 'item', function (callback, results) {
      var topic = results.topic;
      var item = results.item;
      var prevItemIndex = -1;
      for (var i = 0; i < topic.items.length; i++) {
        if (topic.items[i].id == prevItemId) {
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
        if (err) {
          return callback(err);
        }
        callback();
        Topic.updateNewTopics();
        Topic.updateSingleTopicSiteCount(topic);
      })
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    var item = results.item;
    res.json(Item.getItemData(item));
    console.log('createItem done');
  });
}

function sortItem(req, res, next) {
  console.log('sort=====');
  var userId = req.session.userId;
  var topicId = req.body.topicId;
  var itemId = req.body._id;
  var prevItemId = req.body.prevItemId;

  async.auto({
    topic: function (callback) {
      _getTopicWithAuth(callback, topicId, userId);
    },
    insert: ['topic', function (callback, results) {
      var topic = results.topic;

      var index = -1;
      for (var i = 0; i < topic.items.length; i++) {
        if (topic.items[i].id == itemId) {
          index = i;
          break;
        }
      }
      var temp = topic.items.splice(index, 1)[0];
      var prevItemIndex = -1;
      for (var i = 0; i < topic.items.length; i++) {
        if (topic.items[i].id == prevItemId) {
          prevItemIndex = i;
          break;
        }
      }
      topic.items.splice(prevItemIndex + 1, 0, temp);
      topic.update_at = Date.now();
      topic.save(function (err) {
        if (err) {
          return callback(err);
        }
        callback();
        Topic.updateNewTopics();
      });
    }]
  }, function (err) {
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
      var item = results.item;
      try {
        var data = Item.getData(req);
      } catch (err) {
        return callback(err);
      }
      extend(item, data);
      item.save(function (err, item) {
        if (err) {
          return callback(err);
        }

        callback(null, item);
      });
    }]
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    var update = results.update;
    res.json(Item.getItemData(update));
    console.log('editItem done');
    var topic = results.topic;
    topic.update({ update_at: Date.now() }, function () {
      Topic.updateNewTopics();
      Topic.updateSingleTopicSiteCount(topic);
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
    item: function (callback) {
      _getItemWithAuth(callback, type, itemId, topicId);
    },
    deleteItem: ['topic', 'item', function (callback, results) {
      var topic = results.topic;
      var item = results.item;
      Item.deleteItem(item, function (err) {
        if (err) {
          return callback(err);
        }
        var index = -1;
        for (var i = 0; i < topic.items.length; i++) {
          if (topic.items[i].id.equals(item._id)) {
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
          if (err) {
            return callback(err);
          }
          callback();
          Topic.updateNewTopics();
          Topic.updateSingleTopicSiteCount(topic);
        })
      });
    }]
  }, function (err) {
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