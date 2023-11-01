var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var sms_gateway = new schema({
    unique_id: Number,
    name: {type: String, default: ""} ,
    description: {type: String, default: ""} ,
    sms_auth_id: {type: String, default: ""} ,
    sms_auth_token: {type: String, default: ""} ,
    sms_number: {type: String, default: ""} ,
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }

}, {
    strict: true,
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
})


sms_gateway.plugin(autoIncrement.plugin, {model: 'sms_gateway', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('sms_gateway', sms_gateway);