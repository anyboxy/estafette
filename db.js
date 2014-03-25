
var exports = {};
exports.ready = false;

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;


var dbUrl = 'mongodb://localhost/';
if (process.env.OPENSHIFT_MONGODB_DB_HOST) {
	dbUrl = 'mongodb://admin:kWfMTF99y7iy@' + process.env.OPENSHIFT_MONGODB_DB_HOST + ':' + process.env.OPENSHIFT_MONGODB_DB_PORT + '/'
}
MongoClient.connect(dbUrl, function(err, db) {
    if(err) throw err;
    exports.db = db;
    exports.ready = true;
 });

exports.collection = function(name) {
	return exports.db.collection(name);
};

module.exports = exports;