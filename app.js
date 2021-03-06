/*
 *  Module dependencies
 */

var express = require('express');
var ejs = require('ejs');
var partials = require('express-partials');
var fs = require('fs');
require('graceful-fs');//调用一次就会修改fs模块

//using redis to store session data
var session = require('express-session');
var RedisStore = require("connect-redis")(session);
var redis = require('redis').createClient();
var bodyParser = require('body-parser');

var config = require('./config');
var routes = require('./routes');

var http = require('http');
var path = require('path');
//get the hostname from the host attribute in config file
// which will be used in the service mail.
var urlinfo = require('url').parse(config.host);
config.hostname = urlinfo.hostname || config.host;

//deleted outdated images
//require('./offlineProcess/changPictureUpdate')();

//access log file and error log file
var errorLogFile = fs.createWriteStream('error.log', {flags: 'a'});

var app = express();

process.on('uncaughtException', function (err) {
  console.error('process.on Caught exception: ' + err.stack);
  var meta = 'process.on:[' + new Date() + ']\n';
  errorLogFile.write(meta + err.stack + '\n');
});

// all environments
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.engine('html', ejs.renderFile);

//add log middleware
app.use(partials());

app.use(bodyParser({limit: '50mb'}));
app.use(require('cookie-parser')());
app.use(session(
  {
    secret: config.session_secret,
    store: new RedisStore({host: 'localhost', port: 6379, client: redis, ttl: 3 * 24 * 60 * 60}),
    cookie: {maxAge: 3 * 24 * 60 * 60 * 1000}
  }
));

app.use(function (req, res, next) {
  var d = require('domain').create();
  d.add(req);
  d.add(res);
  d.on('error', function (err) {
    next(err);
  });
  d.run(next);
})
app.use(express.static(path.join(__dirname, '/public')));
app.use(require('./middlewares/auth').loadUser);

routes(app);

//error log middle ware
app.use(function (err, req, res, next) {
  var meta = '[' + new Date() + '] ' + req.url + '\nreferer:' + req.url + '\nip:' + req.connection.remoteAddress + '\n';
  console.error(meta + err.stack || err);
  errorLogFile.write(meta + err.stack || err + '\n');
  var accept = req.headers.accept || '';
  if (~accept.indexOf('html')) {
    switch (err.message) {
      case '400':
        res.send(400, '请求参数错误');
        break;
      case '403':
        res.send(403, '您无权修改他人的策展');
        break;
      case '404':
        res.status(404).render('error');
        break;
      default :
        res.send(500, '服务器出错：\n' + '\n' + err.stack);
        break;
    }
  } else {
    switch (err.message) {
      case '400':
        res.send(400, '请求参数错误');
        break;
      case '403':
        res.send(403, '您无权修改他人的策展');
        break;
      case '404':
        res.send(404, '您请求的资源不存在');
        break;
      default :
        res.send(500, '服务器出错：\n' + '\n' + err.stack);
        break;
    }
  }
});

//if(!module.parent){
http.createServer(app).listen(config.port, function () {
  console.log('Listening on port ' + config.port);

  //global variables instaitate.
  //e.g. hotopicsData, updateTopicsData
  require('./routine').start();
});
//}

//app.listen(config.port);
//console.log('Listening on port ' + config.port);

module.exports = app;
