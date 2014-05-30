/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 5/19/14
 * Time: 2:18 AM
 * To change this template use File | Settings | File Templates.
 */

var Comment = require('../models').Comment;

function createComment(itemType, itemId, replyId, authorId, text, callback) {
  callback = callback || function () {
  };

  new Comment({
    itemType: itemType,
    itemId: itemId,
    replyId: replyId || undefined,
    authorId: authorId,
    text: text
  }).save(function (err, comment) {
      callback(err, comment);
    });
}

function getCommentsByItemTypeAndId(itemType, itemId, callback) {
  Comment.find({
    itemType: itemType,
    itemId: itemId
  })
    .sort('-like -_id')
    .exec(callback);
}

function likeComment(_id, callback) {
  callback = callback || function () {
  };

  Comment.findById(_id, function (err, comment) {
    if (err) return callback(err);

    comment.like++;
    comment.save(function (err, comment) {
      callback(err, comment);
    });
  });
}

exports.createComment = createComment;
exports.getCommentsByItemTypeAndId = getCommentsByItemTypeAndId;
exports.likeComment = likeComment;