var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var table_settings = new schema({
    unique_id: Number,
    store_id: {type: schema.Types.ObjectId,unique:true},
    is_table_reservation: {
        type:Boolean,
        default:false
    },
    is_table_reservation_with_order: {
        type:Boolean,
        default:false
    },
    is_cancellation_charges_for_with_order: {
        type:Boolean,
        default:false
    },
    is_set_booking_fees: {
        type:Boolean,
        default:false
    },
    is_cancellation_charges_for_without_order: {
        type:Boolean,
        default:false
    },
    booking_fees: {
        type:Number,
        default:0
    },
    with_order_cancellation_charges:{
        type: Array, default: []
    },
    without_order_cancellation_charges:{
        type: Array, default: []
    },
    table_reservation_time: {
        type:Number,
        default:0
    },
    user_come_before_time:{
        type:Number,
        default:0
    }, 
    reservation_max_days:{
        type:Number,
        default:0
    },
    reservation_person_min_seat:{
        type:Number,
        default:0
    },
    reservation_person_max_seat:{
        type:Number,
        default:0
    },
    booking_time: {
        type: Array, default: [
            {
                "is_booking_open" : true,
                "is_booking_open_full_time" : true,
                "day" : 0,
                "day_time" : []
            }, 
            {
                "is_booking_open" : true,
                "is_booking_open_full_time" : true,
                "day" : 1,
                "day_time" : []
            }, 
            {
                "is_booking_open" : true,
                "is_booking_open_full_time" : true,
                "day" : 2,
                "day_time" : []
            }, 
            {
                "is_booking_open" : true,
                "is_booking_open_full_time" : true,
                "day" : 3,
                "day_time" : []
            }, 
            {
                "is_booking_open" : true,
                "is_booking_open_full_time" : true,
                "day" : 4,
                "day_time" : []
            }, 
            {
                "is_booking_open" : true,
                "is_booking_open_full_time" : true,
                "day" : 5,
                "day_time" : []
            }, 
            {
                "is_booking_open" : true,
                "is_booking_open_full_time" : true,
                "day" : 6,
                "day_time" : []
            }
        ]
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

table_settings.plugin(autoIncrement.plugin, {model: 'table_settings', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('table_settings', table_settings);