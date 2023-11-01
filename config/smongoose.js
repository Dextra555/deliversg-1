var config = require('./config')
var mongoose = require('mongoose')
var autoIncrement = require('mongoose-auto-increment')

module.exports = function(){
    var const2 = mongoose.createConnection(config.activity_log_db, {});
    autoIncrement.initialize(mongoose.connection);

    return const2;
}