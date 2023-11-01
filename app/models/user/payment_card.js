var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

var payment_card = new schema({
    unique_id: Number,
    payment_token: {type: String, default: ""},
    card_type: {type: String, default: ""},
    card_expiry_date: {type: String, default: ""},
    card_holder_name: {type: String, default: ""},
    user_id: {type: schema.Types.ObjectId},
    user_type: Number,
    customer_id: {type: String, default: ""},
    payment_id: {type: schema.Types.ObjectId},
    is_default: {type: Boolean, default: false},
    last_four: {type: String, default: ""},
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
payment_card.plugin(autoIncrement.plugin, {model: 'payment_card', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('payment_card', payment_card);