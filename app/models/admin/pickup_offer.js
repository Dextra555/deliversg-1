var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var pickup_offer = new schema({
    unique_id: Number,
    offer_value: {type: Number},
    offer_detail: {type: String},
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

pickup_offer.plugin(autoIncrement.plugin, {model: 'pickup_offer', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('pickup_offer', pickup_offer);