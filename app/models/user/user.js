var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var user = new schema({
    unique_id: Number,
    user_type: Number,
    admin_type: Number,
    country_unique_id: Number,
    cart_unique_id: Number,
    favourite_addresses: {type: Array, default: []},

    favourite_stores:  [{type: schema.Types.ObjectId}],
    cart_id:           {type: schema.Types.ObjectId},
    user_type_id:      {type: schema.Types.ObjectId},
    payment_intent_id: {type: String, default: ""},
    customer_id:       {type: String, default: ""},
    image_url:         {type: String, default: ""},
    comments:          {type: String, default: "New Register"},
    first_name:        {type: String, default: ""},
    last_name:         {type: String, default: ""},
    email:             {type: String, default: ""},
    otp:               {type: String, default: ""},
    password:          {type: String, default: ""},
    social_id:         {type: String, default: ""},
    social_ids:        [{type: String, default:""}],
    login_by:          {type: String, default: ""},
    country_phone_code:{type: String, default: ""},
    country_code:      {type: String, default: ""},
    app_version:       {type: String, default: ""},
    phone:             {type: String, default: ""},
    address:           {type: String, default: ""},
    country_id:        {type: schema.Types.ObjectId},
    city:              {type: String, default: ""},
    device_token:      {type: String, default: ""},
    device_type:       {type: String, default: ""},
    server_token:      {type: String, default: ""},
    orders:            [{type: schema.Types.ObjectId}],
    current_order:     {type: schema.Types.ObjectId},
    promo_count:       {type: Number, default: 0},
    location:          [{
                            type: Number,
                            index: '2dsphere'
                        }],
    referral_code:     {type: String, default: ""},
    is_referral:       {type: Boolean, default: false},
    referred_by:       {type: schema.Types.ObjectId},
    total_referrals:   {type: Number, default: 0},
    store_rate:        {type: Number, default: 0},
    store_rate_count:  {type: Number, default: 0},
    provider_rate:     {type: Number, default: 0},
    provider_rate_count:{type: Number, default: 0},
    wallet:            {type: Number, default: 0},
    wallet_currency_code:{type: String, default: ""},
    is_use_wallet:     {type: Boolean, default: false},
    is_approved:       {type: Boolean, default: true},
    is_email_verified: {type: Boolean, default: false},
    is_phone_number_verified: {type: Boolean, default: false},
    is_document_uploaded: {type: Boolean, default: false},
    is_user_type_approved: {type: Boolean, default: false},
    uid: {type: String, default: ''},
    firebase_token: {type: String, default: ''},
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

user.index({country_id: 1}, {background: true});
user.index({email: 1}, {background: true});
user.index({phone: 1}, {background: true});
user.index({social_ids: 1}, {background: true});
user.index({referral_code: 1}, {background: true});
user.index({referred_by: 1}, {background: true});
user.index({admin_type: 1}, {background: true});
user.index({country_id: 1, city_id: 1, device_type: 1, device_token: 1}, {background: true});
user.index({is_approved: 1}, {background: true});


user.plugin(autoIncrement.plugin, {model: 'user', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('user', user);