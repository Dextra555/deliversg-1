var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var vehicle = new schema({
    unique_id: Number,
    vehicle_name: {type: String, default: ""} ,
    description: {type: String, default: ""} ,
    image_url: {type: String, default: ""},
    map_pin_image_url: {type: String, default: ""},
    is_business: {type: Boolean, default: false},
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

vehicle.index({is_business: 1}, {background: true});

vehicle.plugin(autoIncrement.plugin, {model: 'vehicle', field: 'unique_id', startAt: 1,incrementBy: 1});
module.exports = mongoose.model('vehicle', vehicle);