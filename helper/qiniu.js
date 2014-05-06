/**
 * Created by zan on 14-5-4.
 */

var qiniu = require('qiniu');
var config = require('../config');
qiniu.conf.ACCESS_KEY = config.QINIU_ACCESS_KEY;
qiniu.conf.SECRET_KEY = config.QINIU_SECRET_KEY;

function uploadToQiniu(imageByteData, _id, callback){
  var imageDataInfo = _decodeBase64Image(imageByteData);
  if (!imageDataInfo) {
    callback(new Error(400));
  }

  var putPolicy = new qiniu.rs.PutPolicy(config.BUCKET_NAME);
  var upToken = putPolicy.token();
  var extra = new qiniu.io.PutExtra();
  extra.mimeType = imageDataInfo.type;
  qiniu.io.put(upToken, _id, imageDataInfo.data, extra, callback);
}

function deleteImageFromQiniu(key, callback) {
  var client = new qiniu.rs.Client();
  client.remove(config.BUCKET_NAME, key, callback);
}

function _decodeBase64Image(dataString) {
  //todo: possibly may have bugs.
  var matches = dataString.match(/^data:([\w+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return;
  }

  return {
    type: matches[1],
    data: new Buffer(matches[2], 'base64')
  };
}

exports.uploadToQiniu = uploadToQiniu;
exports.deleteImageFromQiniu = deleteImageFromQiniu;