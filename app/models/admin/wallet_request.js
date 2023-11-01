var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var wallet_request = new schema({
    unique_id: Number,
    user_type: Number,
    user_unique_id: Number,
    user_id: {type: schema.Types.ObjectId},
    country_id: {type: schema.Types.ObjectId},
    wallet_currency_code: {type: String, default: ""},
    admin_currency_code: {type: String, default: ""},
    wallet_to_admin_current_rate: {type: Number, default: 1},
    requested_wallet_amount: {type: Number, default: 0},
    total_wallet_amount: {type: Number, default: 0},
    approved_requested_wallet_amount: {type: Number, default: 0},
    after_total_wallet_amount: {type: Number, default: 0},
    wallet_status: Number,
    description_for_request_wallet_amount: {type: String, default: ""},
    transaction_details: {type: String, default: ""},
    is_payment_mode_cash: {type: Boolean},
    wallet_request_accepted_id: {type: schema.Types.ObjectId},
    wallet_request_transaction_id: {type: schema.Types.ObjectId},
    wallet_request_cancelled_by: Number,
    wallet_request_cancelled_id: {type: schema.Types.ObjectId},
    transaction_date: {
        type: Date,
        default: Date.now
    },
    completed_date: {
        type: Date,
        default: Date.now
    },
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

wallet_request.index({user_id: 1, user_type: 1}, {background: true});
wallet_request.index({created_at: 1}, {background: true});

wallet_request.plugin(autoIncrement.plugin, {model: 'wallet_request', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('wallet_request', wallet_request);