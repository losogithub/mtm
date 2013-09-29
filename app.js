/*
*  Module dependencies
*/

var express = require('express');
var ejs = require('ejs');
var partials = require('express-partials');

var config = require('./config');
var routes = require('./routes');

var http = require('http');
var path = require('path');
//get the hostname from the host attribute in config file
// which will be used in the service mail.
var urlinfo = require('url').parse(config.host);
config.hostname = urlinfo.hostname || config.host;



var app = express();

// all environments
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.engine('html', ejs.renderFile);
app.use(express.bodyParser());
app.use(partials());

app.use(express.cookieParser(config.session_secret));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname , '/public')));

routes(app);

http.createServer(app).listen(config.port, function(){
    console.log('Listening on port ' + config.port);
});

//app.listen(config.port);
//console.log('Listening on port ' + config.port);

module.expports = app;