/**
 * Module dependencies.
 */


console.log("starting...");

var express = require('express');
var http = require('http');
var path = require('path');
var api = require('./api');

var app = express();

// all environments
app.set('ipaddress', process.env.OPENSHIFT_NODEJS_IP);
app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 8888);
app.use(express.cookieParser());
app.use(express.session({secret: "infles_rocks"}))
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

api.install(app);

app.get('/', function(req, res) {
	res.redirect('/dashboard');
});

app.get('/login', function(req, res) {
	res.sendfile("login.html");
});

app.get('/dashboard', function(req, res) {
	if (!req.session.user) {
		res.redirect("/login");
		return;
	}
	res.sendfile('dashboard.html');
});

app.get("/exercise/:exercise", function(req, res) {
	if (!req.session.user) {
		res.redirect("/login");
		return;
	}
	res.sendfile("exercise.html");
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var server = http.createServer(app);
server.listen(app.get('port'), app.get('ipaddress'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

module.exports = server;