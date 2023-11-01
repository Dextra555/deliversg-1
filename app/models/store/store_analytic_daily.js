var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var store_analytic_daily = new schema({
    unique_id: Number,
    store_id: {type: schema.Types.ObjectId},
    date_tag: {type: String, default: ""},

    received: {type: Number, default: 0},
    total_orders:{type: Number, default: 0},
    accepted: {type: Number, default: 0},
    rejected: {type: Number, default: 0},
    cancelled: {type: Number, default: 0},
    order_ready: {type: Number, default: 0},
    completed: {type: Number, default: 0},
    acception_ratio: {type: Number, default: 0},
    rejection_ratio: {type: Number, default: 0},
    cancellation_ratio: {type: Number, default: 0},
    completed_ratio: {type: Number, default: 0},
    order_ready_ratio:{type: Number, default: 0},
    total_items: {type: Number, default: 0},
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

store_analytic_daily.index({store_id: 1, date_tage: 1}, {background: true});

store_analytic_daily.plugin(autoIncrement.plugin, {model: 'store_analytic_daily', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('store_analytic_daily', store_analytic_daily);