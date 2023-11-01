var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var request = new schema({

    unique_id: Number,
    city_id: {type: schema.Types.ObjectId},
    country_id: {type: schema.Types.ObjectId},
    timezone: {type: String, default: ""},
    vehicle_id: {type: schema.Types.ObjectId},
    orders: {type: Array, default: []},
    user_id: {type: schema.Types.ObjectId},
    manual_provider_id: {type: schema.Types.ObjectId, default: null},
    user_unique_id: Number,
    request_type: {type: Number, default: 7},
    request_type_id: {type: schema.Types.ObjectId},
    // new params start
    user_detail: {type: Object, default: null},
    store_detail: {type: Object, default: null},
    provider_detail: {type: Object, default: null},
    delivery_type: {type: Number, default: 1},
    destination_index: { type: Number, default: null },
    // new params end
    provider_type: Number,
    provider_type_id: {type: schema.Types.ObjectId},
    provider_id: {type: schema.Types.ObjectId},
    provider_unique_id: Number,
    delivery_status: {type: Number, default: 0},
    delivery_status_manage_id: {type: Number, default: 0},
    delivery_status_by: {type: schema.Types.ObjectId},
    current_provider: {type: schema.Types.ObjectId},

    estimated_time_for_delivery_in_min: {type: Number, default: 0},
    providers_id_that_rejected_order_request: [{type: schema.Types.ObjectId}],
    confirmation_code_for_pick_up_delivery: Number,
    confirmation_code_for_complete_delivery: Number,

    is_forced_assigned: {type: Boolean, default: false},
    provider_location: [{
            type: Number,
            index: '2d'

        }],
    provider_previous_location: [{
            type: Number,
            index: '2d'
        }],
    pickup_addresses: {type: Array, default: []},
    destination_addresses: {type: Array, default: []},
    cancel_reasons: {type: Array, default: []},

    date_time: {type: Array, default: []},

    completed_date_tag: {type: String, default: ""},
    completed_date_in_city_timezone: {
        type: Date,
        default: null
    },

    completed_at: {
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

request.index({delivery_status: 1, delivery_status_manage_id: 1, delivery_status: 1}, {background: true});
request.index({current_provider: 1, delivery_status: 1, delivery_status_manage_id: 1}, {background: true});
request.index({provider_id: 1, delivery_status: 1, delivery_status_manage_id: 1}, {background: true});
request.index({provider_id: 1, delivery_status: 1, delivery_status_manage_id: 1, completed_date_in_city_timezone: 1}, {background: true});

request.plugin(autoIncrement.plugin, {model: 'request', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('request', request);
