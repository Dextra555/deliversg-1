var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var city = new schema({
    unique_id: Number,
    bad_weather: {type: Boolean, default: false},
    country_id: {type: schema.Types.ObjectId},
    city_code: {type: String, default: ""},
    city_name: {type: String, default: ""},
    
    is_cash_payment_mode: {type: Boolean, default: false},
    is_other_payment_mode: {type: Boolean, default: true},
    is_promo_apply: {type: Boolean, default: false},
        
    city_locations: {type: Array, index1: '3d', default: []},
    is_use_radius: {type: Boolean, default: true},
    zone_business: {type: Boolean, default: false},
        
    is_ads_visible: {type: Boolean, default: true},
    is_business: {type: Boolean, default: false},
    payment_gateway: [{type: schema.Types.ObjectId}],
    city_radius: {type: Number, default: 0},
    deliveries_in_city: [{type: schema.Types.ObjectId}],
    timezone: {type: String, default: ""},
    city_lat_long: [{
            type: Number,
            index: '2d'
        }],

    is_check_provider_wallet_amount_for_received_cash_request: {type: Boolean, default: false},
    provider_min_wallet_amount_for_received_cash_request: {type: Number, default: 0},

    is_provider_earning_add_in_wallet_on_cash_payment: {type: Boolean, default: true},
    is_store_earning_add_in_wallet_on_cash_payment: {type: Boolean, default: true},
    is_provider_earning_add_in_wallet_on_other_payment: {type: Boolean, default: false},
    is_store_earning_add_in_wallet_on_other_payment: {type: Boolean, default: false},
    daily_cron_date: {
        type: Date,
        default: null
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

city.index({country_id: 1, city_name: 1, city_code: 1}, {background: true});
city.index({country_id: 1, is_business: 1}, {background: true});

city.plugin(autoIncrement.plugin, {model: 'city', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('city', city);
