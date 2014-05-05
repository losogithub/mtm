var fs = require('fs'),
    request = require('request');

var downloadBase64Image = function (url, callback) {
  // Make request to our image url
  request({ url: url, encoding: null }, function (err, res, body) {
    if (err) {
      //todo: need fix how to handle this error.
      return callback(err, "cannot download image");
    }
    if (res.statusCode > 299) {
      //todo: need fix how to handle this error.
      return callback(new Error(500), "cannot download image");
    }
    // So as encoding set to null then request body became Buffer object
    var base64prefix = 'data:' + res.headers['content-type'].match(/[\w+/]+/)[0] + ';base64,'
      , image = body.toString('base64');
    if (typeof callback == 'function') {
      var base64data = base64prefix + image;
      callback(null, base64data);
    }
  });
};

exports.downloadBase64Image = downloadBase64Image;