var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var advertise = new schema({
    unique_id: Number,
    created_by: Number,
    created_id: {type: schema.Types.ObjectId},
    created_unique_id: Number,
    city_id: {type: schema.Types.ObjectId},
    country_id: {type: schema.Types.ObjectId},
    city_unique_id: Number,
    country_unique_id: Number,
    ads_type: Number,
    ads_for: Number,
    ads_detail: {type: String, default: ""},
    is_ads_visible: {type: Boolean, default: false},
    is_ads_approve_by_admin: {type: Boolean, default: false},
    is_ads_have_expiry_date: {type: Boolean, default: false},
    expiry_date: {
        type: Date
    },
    is_ads_redirect_to_store: {type: Boolean, default: false},
    store_id: {type: schema.Types.ObjectId, default: null},
    image_for_banner: {type: String, default: ""},
    image_for_mobile: {type: String, default: ""},
    image_url: {type: String, default: ""},

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

advertise.index({country_id: 1, city_id: 1}, {background: true});
advertise.index({ads_for: 1, city_id: 1}, {background: true});
advertise.index({is_ads_visible: 1}, {background: true});


advertise.plugin(autoIncrement.plugin, {model: 'advertise', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('advertise', advertise);