var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var cancellation_reason = new schema({
    unique_id: Number,
    user_type: {type: Number, default: 0},
    reason: [{type: String,default:[]}],

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
cancellation_reason.plugin(autoIncrement.plugin, {model: 'cancellation_reason', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('cancellation_reason', cancellation_reason);