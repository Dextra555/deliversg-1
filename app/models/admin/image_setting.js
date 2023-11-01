var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var image_setting = new schema({
    unique_id: Number,
    delivery_image_ratio: Number,
    delivery_icon_ratio: Number,
    delivery_map_pin_ratio: Number,

    image_type: [{type: String, default: ""}],
    icon_image_type: [{type: String, default: ""}],
    map_pin_image_type: [{type: String, default: ""}],

    vehicle_image_ratio: Number,
    vehicle_map_pin_ratio: Number,

    product_image_ratio: Number,
    item_image_ratio: Number,

    ads_fullscreen_image_ratio: Number,
    ads_banner_image_ratio: Number,

    ads_fullscreen_image_min_width: Number,
    ads_fullscreen_image_min_height: Number,
    ads_fullscreen_image_max_width: Number,
    ads_fullscreen_image_max_height: Number,
    ads_banner_image_min_width: Number,
    ads_banner_image_min_height: Number,
    ads_banner_image_max_width: Number,
    ads_banner_image_max_height: Number,

    delivery_icon_minimum_size: Number,
    delivery_icon_maximum_size: Number,

    delivery_image_min_width: Number,
    delivery_image_min_height: Number,

    vehicle_image_min_width: Number,
    vehicle_image_min_height: Number,

    item_image_min_width: Number,
    item_image_min_height: Number,

    product_image_min_width: Number,
    product_image_min_height: Number,

    delivery_image_max_width: Number,
    delivery_image_max_height: Number,

    vehicle_image_max_width: Number,
    vehicle_image_max_height: Number,

    item_image_max_width: Number,
    item_image_max_height: Number,

    product_image_max_width: Number,
    product_image_max_height: Number,

    delivery_map_pin_min_width: Number,
    delivery_map_pin_min_height: Number,
    vehicle_map_pin_min_width: Number,
    vehicle_map_pin_min_height: Number,

    delivery_map_pin_max_width: Number,
    delivery_map_pin_max_height: Number,
    vehicle_map_pin_max_width: Number,
    vehicle_map_pin_max_height: Number,

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
image_setting.plugin(autoIncrement.plugin, {model: 'image_setting', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('image_setting', image_setting);