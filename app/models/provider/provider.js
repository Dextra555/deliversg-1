var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var provider = new schema({
    unique_id: Number,
    provider_type: Number,
    admin_type: Number,
    country_unique_id: Number,
    city_unique_id: Number,
    customer_id: {type: String, default: ""},
    vehicle_ids: [{type: schema.Types.ObjectId}],
    selected_vehicle_id: {type: schema.Types.ObjectId},
    vehicle_id: {type: schema.Types.ObjectId},
    service_id: [{type: schema.Types.ObjectId}],
    bank_id: {type: String, default: ''},
    account_id: {type: String, default: ''},
    last_transfer_date: {type: Date},
    provider_type_id: {type: schema.Types.ObjectId, default: null},
    image_url: {type: String, default: ""},
    comments: {type: String, default: "New Register"},
    first_name: {type: String, default: ""},
    last_name: {type: String, default: ""},
    email: {type: String, default: ""},
    otp: {type: String, default: ""},
    password: {type: String, default: ""},
    social_id: {type: String, default: ""},
    social_ids: [{type: String}],
    login_by: {type: String, default: ""},
    app_version: {type: String, default: ""},
    country_phone_code: {type: String, default: ""},
    phone: {type: String, default: ""},
    address: {type: String, default: ""},
    payment_intent_id: {type: String, default: ""},

    country_id: {type: schema.Types.ObjectId},
    city_id: {type: schema.Types.ObjectId},

    vehicle_model: {type: String, default: ""},
    vehicle_number: {type: String, default: ""},
    device_token: {type: String, default: ""},
    device_type: {type: String, default: ""},
    server_token: {type: String, default: ""},

    user_rate: {type: Number, default: 0},
    user_rate_count: {type: Number, default: 0},
    store_rate: {type: Number, default: 0},
    store_rate_count: {type: Number, default: 0},

    referral_code: {type: String, default: ""},
    wallet: {type: Number, default: 0},
    wallet_currency_code: {type: String, default: ""},

    // 26 MAY //
    selected_bank_id:{type: schema.Types.ObjectId},
    //
    referred_by: {type: schema.Types.ObjectId},
    total_referrals: {type: Number, default: 0},

    requests: [{type: schema.Types.ObjectId}],
    current_request: [{type: schema.Types.ObjectId}],
    total_requests: {type: Number, default: 0},
    total_accepted_requests: {type: Number, default: 0},
    total_rejected_requests: {type: Number, default: 0},
    total_cancelled_requests: {type: Number, default: 0},
    total_completed_requests: {type: Number, default: 0},
    total_online_time: {type: Number, default: 0},
    total_active_job_time: {type: Number, default: 0},

    start_online_time: {
        type: Date
    },
    start_active_job_time: {
        type: Date
    },

    is_approved: {type: Boolean, default: false},
    is_active_for_job: {type: Boolean, default: false},
    is_online: {type: Boolean, default: false},
    is_in_delivery: {type: Boolean, default: false},
    is_email_verified: {type: Boolean, default: false},
    is_phone_number_verified: {type: Boolean, default: false},
    is_document_uploaded: {type: Boolean, default: false},
    is_provider_type_approved: {type: Boolean, default: false},
    uid: {type: String, default: ''},
    firebase_token: {type: String, default: ''},
    location: {
        type: [Number],
        index: '2d'
    },
    previous_location: {
        type: [Number],
        index: '2d'
    },
    bearing: Number,
    location_updated_time: {
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

provider.index({country_id: 1}, {background: true});
provider.index({city_id: 1}, {background: true});
provider.index({email: 1}, {background: true});
provider.index({phone: 1}, {background: true});
provider.index({social_ids: 1}, {background: true});
provider.index({referral_code: 1}, {background: true});
provider.index({current_request: 1}, {background: true});
provider.index({requests: 1}, {background: true});
provider.index({referred_by: 1}, {background: true});
provider.index({admin_type: 1}, {background: true});
provider.index({is_online: 1, city_id: 1}, {background: true});
provider.index({provider_type: 1, city_id: 1, last_transferred_date: 1, account_id: 1, bank_id: 1}, {background: true});

provider.index({is_online: 1, is_approved: 1, provider_type_id: 1}, {background: true});
provider.index({country_id: 1, city_id: 1, device_type: 1, device_token: 1}, {background: true});


provider.plugin(autoIncrement.plugin, {model: 'provider', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('provider', provider);