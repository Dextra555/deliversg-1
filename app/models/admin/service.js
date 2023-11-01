
var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var service = new schema({
    unique_id: Number,
    country_id: {type: schema.Types.ObjectId},
    city_id: {type: schema.Types.ObjectId},
    delivery_type_id: {type: schema.Types.ObjectId},
    delivery_type: {type: Number, default: 1},
    delivery_service_id: {type: schema.Types.ObjectId},
    base_price_distance: {type: Number, default: 0},
    vehicle_id: {type: schema.Types.ObjectId},
    base_price: {type: Number, default: 0},
    price_per_stop: {type: Number, default: 0},
    price_per_unit_distance: {type: Number, default: 0},
    price_per_unit_time: {type: Number, default: 0},
    service_tax: {type: Number, default: 0},
    service_taxes: { type: Array, default: [] },
    min_fare: {type: Number, default: 0},
    is_use_distance_calculation: {type: Boolean, default: false},
    cancellation_fee: {type: Number, default: 0},
    admin_profit_mode_on_delivery: Number,
    admin_profit_value_on_delivery: Number,
    delivery_price_setting: {type: Array, default: []},
    surge_hours: {type: Array, default: []},
    is_surge_hours: {type: Boolean, default: false},
    is_business: {type: Boolean, default: false},
    is_default: {type: Boolean, default: false},
    type_id: {type: schema.Types.ObjectId, default: null},
    admin_type: {type: Number, default:1},
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

service.index({city_id: 1, type_id: 1}, {background: true});

service.plugin(autoIncrement.plugin, {model: 'service', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('service', service);