/* ......*/
// main


var express = require('express');
var ejs = require('ejs');
var partials = require('express-partials');

var config = require('./config');
var routes = require('./routes');

//get the hostname from the host attribute in config file
// which will be used in the service mail.
var urlinfo = require('url').parse(config.host);
config.hostname = urlinfo.hostname || config.host;


var app = express();

app.set('view engine', 'html');
app.engine('html', ejs.renderFile);
app.use(express.bodyParser());
app.use(app.router);

app.use(partials());
app.use(express.static(__dirname + '/public'));
app.use(express.cookieParser);
app.use(express.session({
    secret: config.session_secret
}));


routes(app);

app.listen(config.port);
console.log('Listening on port ' + config.port);

module.expports = app;