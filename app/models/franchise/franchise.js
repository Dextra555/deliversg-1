var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var franchise = new schema({
    unique_id: Number,
    admin_type: Number,
    is_visible: {type: Boolean, default: true},

    store_delivery_id: {type: schema.Types.ObjectId},
    store_ids: [{type: schema.Types.ObjectId,default:[]}],
    name: [{type: String,default:[]}],
    email: {type: String, default: ""},
    password: {type: String, default: ""},
    website_url: {type: String, default: ""},

    social_ids: [{type: String, default: ""}],
    login_by: {type: String, default: ""},
    country_id: {type: schema.Types.ObjectId},
    city_id: {type: schema.Types.ObjectId},
    address: {type: String, default: ""},
    country_phone_code: {type: String, default: ""},
    app_version: {type: String, default: ""},
    phone: {type: String, default: ""},

    image_url: {type: String, default: ""},
    comments: {type: String, default: "New Register"},

    device_token: {type: String, default: ""},
    device_type: {type: String, default: ""},
    server_token: {type: String, default: ""},

    is_business: {type: Boolean, default: false},
    is_approved: {type: Boolean, default: true},
    is_email_verified: {type: Boolean, default: false},
    is_store_can_add_provider: {type: Boolean, default: false},
    is_phone_number_verified: {type: Boolean, default: false},

    is_document_uploaded: {type: Boolean, default: false},
    admin_profit_mode_on_franchise: {type: Number, default: 1},
    admin_profit_value_on_franchise: {type: Number, default: 0},
    wallet: {type: Number, default: 0},
    wallet_currency_code: {type: String, default: ""},
    languages_supported: {
        type: Array,
        default: [{
            "name": "English",
            "code": "en",
            "is_visible": true,
            "string_file_path": "./uploads/i18n/en.json"
        }]
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
franchise.plugin(autoIncrement.plugin, {model: 'franchise', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('franchise', franchise);