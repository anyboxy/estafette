var exports = {};
var db = require("./db");
var ObjectID = require("mongodb").ObjectID;
var fs = require("fs");

exports.install = function(app) {

	var dbDefinition = {
		user: {
			_id: {type: "string", required: true, sort: true},
			classes: {type: "string", array: true, required: false},
			password: {type: "string", required: true}
		},
		answer: {
			_id: {type: "string", required: false, sort: true},
			user: {type: "string", required: true},
			exercise: {type: "string", required: true},
			field: {type: "string", required: true},
			answer: {type:  "string", required: false},
			edLevel: {type: "string", required: true}
		},
		edLevel:{
			_id: {type: "string", required: false, sort: true},
			name:{type: "string", required: true}
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
	
	app.post("/api/login", function(req, res) {
		var q = {_id: req.body.username, password: req.body.password};
		db.collection("users").findOne(q, function(error, result) {
			if (result) {
				req.session.user = result;
				console.log(result);
				res.send({result: result})
			} else {
				console.log(error)
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

	app.post("/api/addUser", function(req, res) {//working
			console.log(req.body);
		if(!req.body)
			res.send({result:false});
		
		var newUser = parseItem(dbDefinition.user, req.body);
		
		if(!newUser)
			res.send({error:"kan geen gebruiker maken"});
		
		var cursor = db.collection("users").find({_id: newUser._id});
		cursor.toArray(function(error, array) {
				
				if(array[0])
					res.send({error: "fout: gebruiker bestaat al!"});
		});
		
		db.collection('users').save(newUser, function(err, result) {
			if (!err) {
				res.send({result:true});
			}
		});
	});
	
	app.get("/api/getEducationLevels", function(req, res) {//working
			var list = fs.readdirSync('./edLevels');
			res.send(list);
	});
	
	
	// token parser
	// commented out for debugging purposes
	app.all("/api/*", function(req, res, next) {
		if (req.session.user == undefined) {
			res.send({result: false, error: "You aren't logged in which is required to use the api's"});
		} else {
			next();
		}
	});
	
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

	app.get("/api/me", function(req, res) {
		res.send({result: req.session.user});
	});

	app.get("/api/answers/:exercise", function(req, res) {
		var cursor = db.collection("answers").find({user: req.session.user._id, exercise: req.params.exercise, edLevel: req.session.user.edLevel});
		cursor.toArray(function(error, array) {
			res.send({result: array});
		});
	});

	app.post("/api/answers/:exercise", function(req, res) {
		var answersSaved = 0;
		for (var i = 0; i < req.body.length; i++) {
			req.body[i].edLevel = req.session.user.edLevel;
			var answer = parseItem(dbDefinition.answer, req.body[i]);
			if(answer.user != req.session.user._id){
				//log and quit
				res.send({result:false})
				return;
			}
			answer.edLevel = req.session.user.edLevel
			answer._id = answer.user + "_" + answer.exercise + "_" + answer.field;
			db.collection("answers").save(answer, function(error, result) {
				answersSaved++;
				if (answersSaved == req.body.length) {
					res.send({result: true});
				}
			});
		}
	});

	
	
	
	app.all("/api/*", function(req, res, next) {
		if (!req.session.user.isAdmin) {
			res.send({result: false, error: "You are not an admin!"});
		} else {
			next();
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
			var numDone = 0;s
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
	
	app.get("/api/getUserList", function(req, res) {//working
		//we need to add some admin-level checking like this:
		/*if(req.session.user.auth_level != admin){
			res.send("not authorized\n");
			return;
		}*/
		
		//same as getEducationLevels
		var i = 0;
		var list = Array();
		
		db.collection("users").find().each(function(err,result){
			if(!result){
				res.send(JSON.stringify(list));
				return
			}
			
			list[i] = result;
			i++;	
		});
	});

	app.post("/api/updateUser", function(req, res) {//not tested
		var user = req.body;
		if(!user)
			res.send({result:false});
		
		db.collection('users').update({_id:user._id},user, function(err, result) {
			if (!err) {
				res.send({result:true});
			}
		});
		
	});

	app.post("/api/removeUser", function(req, res) {//working
		var id = req.body._id
		
		if(!id)
			res.send({result:false});
		else 
		{
			db.collection('users').remove({_id:id},function(err,result){
			if(!err)   
				res.send({result:true});
			else
				res.send({result:dberror});
			});	
		}
			
		
	});
	
	
	
	app.post("/api/addEducationLevels", function(req, res) {
		if(!req.body)
			res.send({result:false});
		
		var newEdLevel = parseItem(dbDefinition.edLevel, req.body);
		
		if(!newUser)
			res.send({result:"no definition"});
		
		db.collection('EducationLevels').save(newEdLevel, function(err, result) {
			if (!err) {
				res.send({result:true});
			}
		});
	});
	
	app.post("/api/removeEducationLevels", function(req, res) {
	});
	
	app.post("/api/getChapters", function(req, res) {
			var list = fs.readdirSync('./edLevels/'+req.body.name);
			res.send(list);
	});
	
	app.post("/api/createChapter", function(req, res) {
			
			var file = fs.readFileSync(req.files.file.path, {encoding: "utf8"});
			
			fs.writeFileSync("./edLevels/"+req.body.edLevel+"/"+req.body.name,file,{encoding: "utf8"});
			res.redirect("cmanager");
	});

	app.post("/api/removeChapter", function(req, res) {
	});
	
	app.post("/api/updateChapter", function(req, res) {
	});
	
	app.post("/api/getContent", function(req, res) {
	});
	
	
	
	
};

module.exports = exports;
