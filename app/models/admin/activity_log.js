
var mongoose = require('mongoose');
var smongoose = require('../../../config/smongoose')
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var activity_log = new schema({
    name: {type: String, default: ""},
    type: {type: String, default: ""},
    weight: {type: Number, default: 0},
    visible: {type: Boolean, default: true},
    caller_type: {type: String, default: ""},
    caller_id: {type: String, default: ""},
    success: {type: Boolean, default: false},
    error_code: { type: Number, default: 0},
    start_at: {type: Date, default: Date.now()},
    end_at: {type: Date, default: Date.now()},
    param: {type: Object, default: {}},
    response_code: {type: Object, default: {}},
    caller_info: {type: Object, default: {}}

}, {
    strict: true,
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

// admin.index({email: 1, admin_type: 1}, {background: true});
// admin.index({username: 1, password: 1}, {background: true});
// admin.index({email: 1, password: 1}, {background: true});
module.exports = global.smongoose.model('activity_log', activity_log);