var exports = {};
var db = require("./db");
var ObjectID = require("mongodb").ObjectID;
var fs = require("fs");

exports.install = function(app) {

	var dbDefinition = {
		user: {
			_id: {type: "string", required: true, sort: true},
			classes: {type: "string", array: true, required: true},
			password: {type: "string", required: true}
		},
		answer: {
			_id: {type: "string", required: false, sort: true},
			user: {type: "string", required: true},
			exercise: {type: "string", required: true},
			field: {type: "string", required: true},
			answer: {type:  "string", required: false}
		}
	};

	var _p11 = new ObjectID(), _p12 = new ObjectID();
	var dbDefaults = {
		users: [
			{
				_id: "123",
				password: "1111AA",
				classes: ["B1A"],
				role: "teacher"
			},
			{
				_id: "456",
				password: "1111AA",
				classes: ["B1A"],
				role: "pupil"
			}
		],
		answers: []
	}

	var parseType = function(type, input) {
		switch (type) {
		case "id":
			return ObjectID.createFromHexString(input);
		case "string":
			return input;
		case "number":
			return Number(input);
			break;
		case "date":
			return new Date(input);
			break;
		case "*":
			return input;
			break;
		}
	}

	var parseInput = function(fieldDef, input) {
		if (fieldDef.array) {
			if (input.length === undefined) {
				input = [input];
			}
			var r = [];
			for (var i = 0; i < input.length; i++) {
				r.push(parseType(input[i]));
			}
			return r;
		} else {
			return parseType(fieldDef.type, input);
		}
	}

	var parseItem = function(itemDef, input) {
		for (x in itemDef) {
			var fieldDef = itemDef[x];
			if (fieldDef.required && input[x] == undefined) {
				return false;
			}
			if (input[x] != undefined) {
				input[x] = parseInput(fieldDef, input[x]);
			}
		}
		return input;
	}

	var sendCursor = function(req, res, collection, query, definition) {
		var limit = !isNaN(req.query.limit) ? Math.max(1, Math.min(1000, parseInt(req.query.limit))) : 100;
		var sortDirection = req.query.direction;
		var sortField = req.query.sortby;
		var since = req.query.since;
		var until = req.query.until;
		var page = !isNaN(req.query.page) ? Math.max(0, parseInt(req.query.page)) : 0;

		if (sortDirection != "asc" && sortDirection != "desc") {
			sortDirection = "asc"
		}

		if (!sortField || !definition[sortField] || definition[sortField].sort !== true) {
			sortField = "_id";
		}

		if (since || until) {
			query[sortField] = {};
			if (since) {
				query[sortField]['$gt'] = parseInput(definition[sortField], since);
			}
			if (until) {
				query[sortField]['$lt'] = parseInput(definition[sortField], until);
			}
		}

		var cursor = collection.find(query);
		cursor.limit(limit);
		cursor.sort(sortField, sortDirection);
		cursor.count(function(err, count) {
			var body = {};
			body.count = count;
			body.pages = Math.ceil(count / limit);


			var realPage = Math.min(body.pages - 1, page);
			if (realPage > 0) {
				cursor.skip(realPage * limit);
			}

			body.page = realPage;
			body.skipped = realPage * limit;
			body.hasNext = realPage + 1 < body.pages;
			body.hasPrev = realPage > 0;

			cursor.toArray(function(err, items) {
				body.result = items;
				res.send(body);
			});
		})
	};

	app.get("/api/reset", function(req, res) {
		for (collName in dbDefaults) {
			new function (collName) {
				db.collection(collName).drop(function() {
					var collDef = dbDefaults[collName];
					var coll = db.collection(collName);
					coll.insert(collDef, function () {
						// check
					});
				});
			}(collName);
		}
		res.send({result: true});
	});

	app.post("/api/login", function(req, res) {
		var q = {_id: req.body.username, password: req.body.password};
		console.log(req.body);
		db.collection("users").findOne(q, function(error, result) {
			if (result) {
				req.session.user = result;
				res.send({result: result})
			} else {
				res.send({result: false});
			}
		});
	});

	app.all("/api/logout", function(req, res) {
		if (req.session.user) {
			delete req.session.user;
			res.send({result: true});
		} else {
			res.send({result: false, error: "you weren't even logged in yet!"});
		}
	});

	// token parser
	app.all("/api/*", function(req, res, next) {
		if (req.session.user == undefined) {
			res.send({result: false, error: "You aren't logged in which is required to use the api's"});
		} else {
			next();
		}
	});

	app.get("/api/me", function(req, res) {
		res.send({result: req.session.user});
	});

	app.get("/api/answers/:exercise", function(req, res) {
		var cursor = db.collection("answers").find({user: req.session.user._id, exercise: req.params.exercise});
		cursor.toArray(function(error, array) {
			res.send({result: array});
		});
	});

	app.post("/api/answers/:exercise", function(req, res) {
		var answersSaved = 0;
		for (var i = 0; i < req.body.length; i++) {
			var answer = parseItem(dbDefinition.answer, req.body[i]);
			answer._id = answer.user + "_" + answer.exercise + "_" + answer.field;
			db.collection("answers").save(answer, function(error, result) {
				answersSaved++;
				if (answersSaved == req.body.length) {
					res.send({result: true});
				}
			});
		}
	});

	app.get("/upload", function(req, res) {
		res.sendfile("upload.html");
	});

	app.post("/upload", function(req, res) {
		if (req.files.users == undefined) {
			res.send("Gebruikersbestand niet gevonden!");
			return;
		}
		fs.readFile(req.files.users.path, {encoding: "utf8"}, function (err, data) {
			data = data.split(/[;\r\n]/);
			var users = [];
			for (var i = 0; i < data.length; i+=2) {
				if (data[i].length == 0) {
					i--;
					continue;
				}
				var user = {_id: data[i], password: data[i + 1]};
				users.push(user);
			}
			var numDone = 0;
			for (var i = 0; i < users.length; i++) {
				db.collection('users').save(users[i], function(err, result) {
					numDone++;
					if (numDone == users.length) {
						res.send("Gebruikers zijn bijgewerkt");
					}
				});
			}
		});
	});

};

module.exports = exports;