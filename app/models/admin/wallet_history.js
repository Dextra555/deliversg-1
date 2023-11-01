var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var wallet = new schema({
    unique_id: Number,
    user_type: Number,
    user_unique_id: Number,
    user_id: {type: schema.Types.ObjectId},
    country_id: {type: schema.Types.ObjectId},
    from_amount: {type: Number, default: 0},
    from_currency_code: {type: String, default: ""},
    to_currency_code: {type: String, default: ""},
    current_rate: {type: Number, default: 1},
    wallet_information: {type: Object, default: {}},

    wallet_status: {type: Number, default: 0},
    wallet_comment_id: {type: Number, default: 1},
    wallet_description: {type: String, default: ""},

    wallet_amount: {type: Number, default: 0},
    added_wallet: {type: Number, default: 0},
    total_wallet_amount: {type: Number, default: 0},
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

wallet.index({wallet_comment_id: 1, user_type: 1, created_at: 1}, {background: true});

wallet.plugin(autoIncrement.plugin, {model: 'wallet', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('wallet', wallet);