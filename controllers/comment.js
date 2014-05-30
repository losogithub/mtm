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
var User = require('../proxy/user');

function createComment(req, res, next) {
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

  Comment.createComment(itemType, itemId, replyId, authorId, text, function (err, comment) {
    if (err) return next(err);

    res.json(comment);

    Item.getItemById(itemType, itemId, function (err, item) {
      if (err || !item || item.authorId == authorId) return;

      Message.createMessage(item.authorId, authorId, itemType, itemId, null);
      User.increaseMessageCount(item.authorId, null);
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
exports.likeComment = likeComment;