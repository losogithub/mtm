var express = require('express');
var ejs = require('ejs');
var partials = require('express-partials');

var config = require('./config');
var routes = require('./routes');

var app = express();

app.set('view engine', 'html');
app.engine('html', ejs.renderFile);
app.use(express.bodyParser());
app.use(partials());
app.use(express.static(__dirname + '/public'));

routes(app);

app.listen(config.port);
console.log('Listening on port ' + config.port);