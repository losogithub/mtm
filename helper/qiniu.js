/**
 * Created by zan on 14-5-4.
 */

var config = require('../config');
var qiniu = require('qiniu');
qiniu.conf.ACCESS_KEY = config.QINIU_ACCESS_KEY;
qiniu.conf.SECRET_KEY = config.QINIU_SECRET_KEY;

//todo: later make domain more flexible
var domain = "shizier.qiniudn.com";

function downloadImageUrl(domain, key){
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


function uploadToQiniu(imageByteData, qiniuId, next){
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
                next(null, ret);
            }
            else {
                console.log(err);
                //todo how to handle error
                // according to different error inform, either retrieve or delete the saved item.

                next(-1, ret);
            }
        })

}

function decodeBase64Image(dataString) {
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