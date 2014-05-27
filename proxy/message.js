/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 5/27/14
 * Time: 1:06 PM
 * To change this template use File | Settings | File Templates.
 */

var Message = require('../models').Message;

function createMessage(ownerId, authorId, itemType, itemId, callback) {
  callback = callback || function () {
  };

  new Message({
    ownerId: ownerId,
    authorId: authorId,
    itemType: itemType,
    itemId: itemId
  }).save(function (err, spit) {
      callback(err, spit);
    });
}

function getMessagesByOwnerId(ownerId, callback) {
  Message.find({
    ownerId: ownerId
  })
    .sort('-_id')
    .exec(callback);
}

exports.createMessage = createMessage;
exports.getMessagesByOwnerId = getMessagesByOwnerId;