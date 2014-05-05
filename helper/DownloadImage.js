var fs = require('fs'),
    request = require('request');



var downloadBase64Image = function (url, callback) {
    // Make request to our image url
    request({url: url, encoding: null}, function (err, res, body) {
        if (!err && res.statusCode == 200) {
            // So as encoding set to null then request body became Buffer object
            var base64prefix = 'data:' + res.headers['content-type'] + ';base64,'
                , image = body.toString('base64');
            if (typeof callback == 'function') {
                var base64data = base64prefix +  image;
                console.log(base64data);
                callback(null, base64data);
            }
        } else {
            //todo: need fix how to handle this error.
            callback(-1, "cannot download image");
        }
    });
};

exports.downloadBase64Image = downloadBase64Image;