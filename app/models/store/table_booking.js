var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var table_booking = new schema({
    unique_id: Number,
    store_id: {type: schema.Types.ObjectId,unique:true},
    number_of_person: {type: Number, default: 0},
    table_number: {type: Number, default: 0},
    table_book_date: {type: Date, default: Date.now},
    table_book_time: {type: String, default: ''},
    booking_type: {type: Number, default: 1}, // 1: Table Without Order, 2: Table With Order
    cart_id: {type: schema.Types.ObjectId, default: null},
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

table_booking.plugin(autoIncrement.plugin, {model: 'table_booking', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('table_booking', table_booking);