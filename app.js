/*
 *  Module dependencies
 */

var express = require('express');
var ejs = require('ejs');
var partials = require('express-partials');
var fs = require('fs');

//using redis to store session data
var RedisStore = require("connect-redis")(express);
var redis = require('redis').createClient();

var config = require('./config');
var routes = require('./routes');

var http = require('http');
var path = require('path');
//get the hostname from the host attribute in config file
// which will be used in the service mail.
var urlinfo = require('url').parse(config.host);
config.hostname = urlinfo.hostname || config.host;

//global variables instaitate.
//e.g. hotopicsData, updateTopicsData
require('./offlineProcess/retriveUpdatedTopicList')();

//access log file and error log file
var accessLogFile = fs.createWriteStream('access.log', {flags: 'a'});
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
app.use(express.logger({stream: accessLogFile}));
app.use(partials());

app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session(
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
app.use(app.router);

//error log middle ware
app.use(function (err, req, res, next) {
  console.error(err.stack);
  var meta = '[' + new Date() + '] ' + req.url + '\n';
  errorLogFile.write(meta + err.stack + '\n');
  var accept = req.headers.accept || '';
  if (~accept.indexOf('html')) {
    switch (err.message) {
      case '403':
        res.send(403, '您无权修改他人的总结');
        break;
      case '404':
        res.status(404).render('sign/errLink');
        break;
      default :
        res.send(500, '服务器出错：\n' + '\n' + err.stack);
        break;
    }
  } else {
    switch (err.message) {
      case '403':
        res.send(403, '您无权修改他人的总结');
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

routes(app);

//if(!module.parent){
http.createServer(app).listen(config.port, function () {
  console.log('Listening on port ' + config.port);
});
//}

//app.listen(config.port);
//console.log('Listening on port ' + config.port);

module.exports = app;
