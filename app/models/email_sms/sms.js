var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var sms_detail = new schema({
    unique_id: Number,
    sms_unique_title: String,
    sms_content: String,
    is_send: {type: Boolean, default: false}

});
sms_detail.plugin(autoIncrement.plugin, {model: 'sms_detail', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('sms_detail', sms_detail);