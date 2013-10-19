/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 9/2/13
 * Time: 12:55 AM
 * To change this template use File | Settings | File Templates.
 */
var sanitize = require('validator').sanitize;
var escape = require('escape-html');
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');

var helper = require('../helper/helper');


var User = require('../proxy').User;

var Topic = require('../proxy').Topic;
var Item = require('../proxy').Item;

var REGEXP_URL = /^((http[s]?|ftp):\/)?\/?((([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9]))(:([^\/]*))?(((\/\w+)*\/)([\w\-\.]+[^#?\s]+))?(\?([^#]*))?(#(.*))?$/;

var index = function (req, res, next) {

  console.log("topic index");
  var topicId = req.params.topicId;

  Topic.validateId(topicId, function (valid, topic) {
    if (valid && topic.publishDate) {

      Topic.increasePVCountBy(topic, 1, function (topic) {

        Topic.getContents(topicId, function (topic, items) {
          var updateAt = topic.update_at.getFullYear() + '年'
            + (topic.update_at.getMonth() + 1) + '月'
            + topic.update_at.getDate() + '日';

          //author information: website url, description, images.
          User.getUserByLoginName(topic.author_name, function(err, user){
            if(err){ console.log(err); return;}
            else if (!user){
              console.log("cannot find user");
              return;
            }
            var authorData = {
              author: user.loginName,
              imgUrl:  user.url,
              //description: balinkify.linkify(escape(user.description), {target: " "}),
              description: helper.linkify(escape(user.description)),
              personalSite: user.personalSite
            };
            //console.log("author Data:-------------------");
            //console.log(authorData);

            var topicData = {
              topicId: topic._id,
              title: topic.title,
              coverUrl: topic.cover_url,
              description: topic.description,
              updateAt: updateAt,
              author: topic.author_name,
              PVCount: topic.PV_count,
              FVCount: topic.FVCount
            };

            var itemsData = [];
            items.forEach(function (item) {
              itemsData.push(_getItemData(item));
            });

            var liked = false; //default, not login user.
            //If a login user, check liked before or not.
            if(req.session && req.session.userId){
              //console.log("currentUser", req.currentUser);
              //check in FVTopicList
              var likeList = req.currentUser.FVTopicList;
              if (likeList.indexOf(topic._id) > -1){
                console.log("liked befoere");
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
              js:[
                '/javascripts/showTopic.js'
              ],
              escape: escape,
              url: req.url,
              topic: topicData,
              items: itemsData ,
              authorInfo: authorData,
              liked: liked
            });

          })

        });
      });
    } else {
      res.send('您要查看的总结不存在');
    }
  })
}

var create = function (req, res, next) {
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
      '/javascripts/edit.js'
    ],
    backUrl: req.headers.referer ? req.headers.referer : '/works'
  });
}

var edit = function (req, res, next) {
  var topicId = req.params.topicId;
  Topic.validateId(topicId, function (valid, topic) {
    if (!valid) {
      res.send('您要修改的总结不存在');
    } else {
      Topic.getContents(topicId, function (topic, items) {
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
            '/javascripts/edit.js'
          ],
          escape: escape,
          backUrl: req.headers.referer ? req.headers.referer : './',
          topic: topicData,
          items: itemsData
        });
      });
    }
  });
}

var getId = function (req, res, next) {
  Topic.newId(function (topicId) {
    res.json({ topicId: topicId });
  });
}

var getContents = function (req, res, next) {
  var topicId = req.query.topicId;
  Topic.validateId(topicId, function (valid, topic) {
    if (!valid) {
      getId(req, res, next);
    } else if (topic.publishDate) {
      res.json({
        redirect: '/topic/' + topicId + '/edit'
      });
    } else {
      Topic.getContents(topicId, function (topic, items) {
        var topicData = {
          title: topic.title,
          coverUrl: topic.cover_url,
          description: topic.description
        };
        var itemsData = [];
        items.forEach(function (item) {
          itemsData.push(_getItemData(item));
        });
        res.json({
          topicData: topicData,
          itemsData: itemsData
        });
      })
    }
  })
}

var createItem = function (req, res, next) {
  var topicId = req.body.topicId;
  var prevItemType = req.body.prevItemType;
  var prevItemId = req.body.prevItemId;

  var data = _getData(req);
  if (!data) {
    return;
  }

  Topic.createVoidItemIfNotExist(topicId, function (topic) {
    Item.createItem(
      topic,
      prevItemType,
      prevItemId,
      data,
      function (item) {
        Topic.increaseItemCountBy(topicId, 1);
        console.log('create item done.');
        res.json(_getItemData(item));
      })
  })
}

var _getData = function (req, _id) {
  var type = req.body.type;
  var data;

  switch (type) {
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
      break;
  }
  data.type = type;
  if (_id) {
    data._id = _id;
  }
  return data;
}

var _getItemData = function (item) {
  var itemData;

  switch (item.type) {
    case 'IMAGE':
      itemData = {
        itemId: item._id,
        type: item.type,
        url: item.url,
        title: item.title,
        quote: item.quote,
        description: item.description
      }
      break;
    case 'VIDEO':
      itemData = {
        itemId: item._id,
        type: item.type,
        url: item.url,
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
      break;
  }
  return itemData;
}

var editItem = function (req, res, next) {
  var itemId = req.body.itemId;

  var data = _getData(req, itemId);
  Item.editItem(data, function (item) {
    console.log(item.text);
    res.json(_getItemData(item));
  });
}

var sort = function (req, res, next) {
  var topicId = req.body.topicId;
  var type = req.body.type;
  var itemId = req.body.itemId;
  var prevItemType = req.body.prevItemType;
  var prevItemId = req.body.prevItemId;
  Topic.createVoidItemIfNotExist(topicId, function (topic) {
    Item.detachItem(type, itemId, function (item) {
      prevItemType = prevItemType || 'VOID';
      prevItemId = prevItemId || topic.void_item_id;
      Item.insertItem(item, prevItemType, prevItemId);
    })
  })
  res.send(200);
}

var deleteItem = function (req, res, next) {
  var type = req.body.type;
  var itemId = req.body.itemId;
  Item.deleteItem(type, itemId, function (item) {
    Topic.increaseItemCountBy(item.topic_id, -1);
  });
  res.send(200);
}

var save = function (req, res, next) {
  var authorId = req.session.userId;
  var topicId = req.body.topicId;
  var title = req.body.title;
  var coverUrl = req.body.coverUrl;
  var description = req.body.description;
  var publish = req.body.publish;

  Topic.save(authorId, topicId, title, coverUrl, description, publish, function () {
    res.send(200);
  });
}

var getVideoTitle = function (req, res, next) {
  var url = req.query.url;

  require('http').get(url, function (response) {
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
      var domain = !urlParts ? null : urlParts[3];
      var title;
      console.log(domain);
      if (domain && /tudou\.com$/.test(domain)) {
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
      res.json({ title: title});
    })
  })
    //必须处理error，否则抛出异常
    .on('error', function (err) {
      console.log(err.message);
      res.json({ title: null});
    });
}

var AddorRemoveLikes = function(req, res){
  console.log("add or remove likes for topic");
  var topicId = req.body.topicId;
  var toLike = req.body.toLike || "true";
  console.log(topicId);
  console.log(toLike);//string

  //what need to do is.
  //1. add/remove likes in topic
  //2. add/remove topicId in likeList for the current user.

  //get current viewer info according to userId
  if(req.session && req.session.userId){
    User.getUserById(req.session.userId, function(err, user){
      if(err){console.log(err); return;}
      else if(!user){console.log("cannot find user by id"); return;}
      else {
        //found the user
        if(toLike == "true"){
          //if does not in the array, push.
          if(user.FVTopicList.indexOf(topicId) == -1){
            user.FVTopicList.push(topicId);
          }
          //otherwise do nothing.
        } else {
          //toLike "false"
          var index = user.FVTopicList.indexOf(topicId);
          if( index > -1) {
            user.FVTopicList.splice(index, 1);
          }
        }

        user.save(function(err){
          if(err){
            console.log("user save err ");
            return;
          }
        })

        //update topic info
        Topic.getTopicById(topicId, function(err, topic){
          if(err){console.log(err); return;}
          else if(!topic){console.log("cannot find topic"); return;}
          else{
            //found the topic according to id.
            var userId = user._id;
            console.log("----------------------")
            console.log(typeof toLike);
            if(toLike == "true"){
              if(topic.FVList.indexOf(userId) == -1){
                //not exist
                topic.FVList.push(userId);
                topic.FVCount += 1;
                }
              //otherwise already found. do nothing
            }
            else
            {
              //toLike == "false"
              var index = topic.FVList.indexOf(userId);
              if( index > -1) {
                topic.FVList.splice(index, 1);
                topic.FVCount -= 1;
              }
              //otherwise do nothing
            }

            topic.save(function(err){
              if(err){ console.log("topic save err");}
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
            res.send({loginDialog: false, FVCount: topic.FVCount , correct: true, userName: user.loginName, toLike: toLike });

          }
        })
      }
    })
  }

}

exports.index = index;
exports.create = create;
exports.edit = edit;
exports.getId = getId;
exports.getContents = getContents;
exports.createItem = createItem;
exports.editItem = editItem;
exports.sort = sort;
exports.deleteItem = deleteItem;
exports.save = save;
exports.getVideoTitle = getVideoTitle;
exports.AddorRemoveLikes = AddorRemoveLikes;