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
app.use(express.session({secret: "infles_rocks"}))//lol
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

api.install(app);

app.get('/', function(req, res) {
	res.redirect('/dashboard');
});

app.get('/dbmanager', function(req, res) {
	if(!req.session.user.isAdmin)
	{
		res.redirect("/dashboard");
		return;
	}
	res.sendfile("dbmanage.html");
});
app.get('/cmanager', function(req, res) {
	if(!req.session.user.isAdmin)
	{
		res.redirect("/dashboard");
		return;
	}
	res.sendfile("cmanager.html");
});
app.get('/register', function(req, res) {
	res.sendfile("register.html");
});

app.get('/login', function(req, res) {
	res.sendfile("login.html");
});

app.get('/dashboard', function(req, res) {
	if (!req.session.user) {
		res.redirect("/login");
		return;
	}
	if(req.session.user.isAdmin)
	{
		res.sendfile("admin.html");
		return;
	}
	
	res.sendfile('edLevels/' + req.session.user.edLevel + '/dashboard.html');
});

app.get("/exercise/:exercise", function(req, res) {
	if (!req.session.user) {
		res.redirect("/login");
		return;
	}
	res.sendfile("exercise.html");
});

app.get("/exercises/:exercise", function(req, res) {
	if (!req.session.user) {
		res.redirect("/login");
		return;
	}
	var exercise = req.url.substring(req.url.lastIndexOf("/") + 1);
	
	res.sendfile("edLevels/"+req.session.user.edLevel+"/"+req.url.substring(req.url.lastIndexOf("/") + 1));
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