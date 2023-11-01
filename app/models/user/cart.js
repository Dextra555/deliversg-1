var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var cart = new schema({

    unique_id: Number,
    cart_unique_token: String,
    user_id: {type: schema.Types.ObjectId},
    user_type: {type: Number, default: 7},
    user_type_id: {type: schema.Types.ObjectId},
    
    store_id: {type: schema.Types.ObjectId, default: null},
    order_payment_id: {type: schema.Types.ObjectId, default: null},
    order_id: {type: schema.Types.ObjectId},
    city_id: {type: schema.Types.ObjectId},
    total_item_tax: {type: Number, default: 0},
    delivery_type: {type: Number, default: 1},
    language: {type: Number, default: 1},
    
    pickup_addresses: {type: Array, default: []},
    destination_addresses : {type: Array, default: []},
    order_details: {type: Array, default: []},
    total_item_count: {type: Number, default: 0},
    total_cart_price:{type: Number, default: 0},
    is_use_item_tax: {type: Boolean, default: false},
    is_tax_included: {type: Boolean, default: false},
    store_taxes: {type: Array, default: []},
    table_no: { type: Number, default: 0 },
    no_of_persons: {type: Number, default: 0},
    booking_type: {type: Number, default: 0},
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

cart.index({cart_unique_token: 1}, {background: true});

cart.plugin(autoIncrement.plugin, {model: 'cart', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('cart', cart);
