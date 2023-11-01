var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var deliver_fee = new schema({
    unique_id: Number,
    delivery_fee: 
    {type: Array, default: [{
        from: {type: Number},
        to: {type: Number},
        fee: {type: Boolean}
    }]},
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

deliver_fee.plugin(autoIncrement.plugin, {model: 'deliver_fee', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('deliver_fee', deliver_fee);