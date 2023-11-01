var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var mass_notification = new schema({
    unique_id: Number,
    message: {type: String, default: ''},
    user_type: Number,
    device_type: {type: String},
    country: {type: schema.Types.ObjectId},
    delivery:{type: schema.Types.ObjectId},
    city:{type: schema.Types.ObjectId},
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
});


mass_notification.plugin(autoIncrement.plugin, {model: 'mass_notification', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('mass_notification', mass_notification);
