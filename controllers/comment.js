/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 5/19/14
 * Time: 2:29 AM
 * To change this template use File | Settings | File Templates.
 */

var sanitize = require('validator').sanitize;
var check = require('validator').check;

var Common = require('../common');
var Item = require('../proxy/item');
var Comment = require('../proxy/comment');
var Message = require('../proxy/message');

function createComment(req, res, next) {
  var topicId = req.body.topicId;
  var replyId = req.body.replyId;
  var authorId = req.session.userId;
  var text = sanitize(req.body.text).trim();

  try {
    check(text).len(1, 140);
  } catch (e) {
    return next(e);
  }

  Comment.createComment(topicId, replyId, authorId, text, function (err, comment) {
    if (err) return next(err);

    res.json(comment);
  });
}

function createComment2(req, res, next) {
  var itemType = req.body.itemType;
  var itemId = req.body.itemId;
  var replyId = req.body.replyId;
  var authorId = req.session.userId;//允许为空
  var text = sanitize(req.body.text).trim();

  try {
    check(text).len(1, 140);
  } catch (e) {
    return next(e);
  }

  Comment.createComment2(itemType, itemId, replyId, authorId, text, function (err, comment) {
    if (err) return next(err);

    res.json(comment);
    Item.getItemById(itemType, itemId, function (err, item) {
      if (err || !item) return;

      Message.createMessage(item.authorId, authorId, itemType, itemId, null);
    });
  });
}

function likeComment(req, res, next) {
  var _id = req.body._id;

  var key = _id + req.connection.remoteAddress;
  if (Common.CommentLikedKeys[key]) {
    return next(new Error(403));
  }

  Comment.likeComment(_id, function (err, comment) {
    if (err) return next(err);

    res.json({
      like: comment.like
    });
    Common.CommentLikedKeys[key] = true;
  });
}

exports.createComment = createComment;
exports.createComment2 = createComment2;
exports.likeComment = likeComment;