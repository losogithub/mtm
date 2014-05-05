/**
 * Created by zan on 14-5-4.
 */

var config = require('../config');
var qiniu = require('qiniu');
qiniu.conf.ACCESS_KEY = config.QINIU_ACCESS_KEY;
qiniu.conf.SECRET_KEY = config.QINIU_SECRET_KEY;

//todo: later make domain more flexible
var domain = "shizier.qiniudn.com";

/*
this is for private bucket, sine now it is public, so it is ok.
 */
function downloadImageUrl(key){
    var baseUrl = qiniu.rs.makeBaseUrl(domain, key);
    var policy = new qiniu.rs.GetPolicy();
    return policy.makeRequest(baseUrl);
}

/*
 For image uploading to Qiniu
 */
function generateUpToken(req, res, next){
    var putPolicy = new qiniu.rs.PutPolicy(config.BUCKET_NAME);
    var upToken = putPolicy.token();
    res.json({"upToken": upToken});
    console.log('send upToken to client');
}


function uploadToQiniu(imageByteData, qiniuId, callback){
    var imageDataInfo = decodeBase64Image(imageByteData);
    binaryData = imageDataInfo.data;

    var putPolicy = new qiniu.rs.PutPolicy(config.BUCKET_NAME);
    var upToken = putPolicy.token();
    var extra = new qiniu.io.PutExtra();
    extra.mimeType = imageDataInfo.type;
        //upload to qiniu with the qiniuId
        qiniu.io.put(upToken, qiniuId, binaryData, extra, function(err,ret){
            if(!err){
                console.log(ret.key, ret.hash);
                callback(null, ret);
            }
            else {
                callback(err, ret);
            }
        })

}


function deleteImageFromQiniu(key,callback){
    var client = new qiniu.rs.Client();
    client.remove(config.BUCKET_NAME, key, function(err, ret){
        if(err){
            console.log(err);
            callback(-1, ret);
        }
        else {
            //ok
            callback(null, ret);
        }
    })

}

function generateQiniuId(id){
    var unixTimeStamp = Math.round(+new Date()/1000);
    var qiniuId = id + unixTimeStamp.toString();
    return qiniuId;
}

function makeQiniuUrl(key){
    var baseUrl="http://shizier.qiniudn.com/";
    var url = baseUrl + key;
    return url;
}


function decodeBase64Image(dataString) {
    //todo: possibly may have bugs.
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};

    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');

    return response;
}

exports.generateUpToken = generateUpToken;
exports.downloadImageUrl = downloadImageUrl;
exports.uploadToQiniu = uploadToQiniu;
exports.deleteImageFromQiniu = deleteImageFromQiniu;
exports.generateQiniuId = generateQiniuId;
exports.makeQiniuUrl = makeQiniuUrl;