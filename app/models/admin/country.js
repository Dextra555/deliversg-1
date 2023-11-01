var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var country = new schema({
    unique_id: Number,
    currency_rate: {type: Number, default: 1},
    country_name: {type: String, default: ""},
    country_flag: {type: String, default: ""},
    country_code: {type: String, default: ""},
    country_timezone: {type: Array, default: []},
    currency_name: {type: String, default: ""},
    currency_code: {type: String, default: ""},
    currency_sign: {type: String, default: ""},
    country_phone_code: {type: String, default: ""},
    country_code_2: {type: String, default: ""},
    is_ads_visible: {type: Boolean, default: true},
    referral_bonus_to_user: {type: Number, default: 0},
    referral_bonus_to_user_friend: {type: Number, default: 0},
    no_of_user_use_referral: {type: Number, default: 0},
    referral_bonus_to_store: {type: Number, default: 0},
    referral_bonus_to_store_friend: {type: Number, default: 0},
    no_of_store_use_referral: {type: Number, default: 0},
    referral_bonus_to_provider: {type: Number, default: 0},
    referral_bonus_to_provider_friend: {type: Number, default: 0},
    no_of_provider_use_referral: {type: Number, default: 0},
    is_business: {type: Boolean, default: false},
    is_distance_unit_mile: {type: Boolean, default: false},
    is_referral_user: {type: Boolean, default: true},
    is_referral_store: {type: Boolean, default: true},
    is_referral_provider: {type: Boolean, default: true},
    minimum_phone_number_length: {type: Number, default: 8},
    maximum_phone_number_length: {type: Number, default: 10},
    is_auto_transfer_for_store: {type: Boolean, default: false},
    auto_transfer_day_for_store: {type: Number, default: 7},
    is_auto_transfer_for_deliveryman: {type: Boolean, default: false},
    auto_transfer_day_for_deliveryman: {type: Number, default: 7},
    taxes: {type: Array, default: []},
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

country.index({country_name: 1, is_business: 1}, {background: true});
country.index({country_code: 1, is_business: 1}, {background: true});
country.index({country_code_2: 1, is_business: 1}, {background: true});

country.plugin(autoIncrement.plugin, {model: 'country', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('country', country);