var mongoose = require('mongoose');
var schema = mongoose.Schema;
var otp = new schema({
    phone: {type: String, default: ""},
    email: {type: String, default: ""},
    country_phone_code: {type: String, default: ""},
    email_otp: {type: String, default: ""},
    otp: {type: String, default: ""},
    ip: {type: String, default: ""},
    try_count: {type: Number, default: 0},
    expire_at: {type: Number, default: 0},
    user_type: {type: Number, default: 0},
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

module.exports = mongoose.model('Otp',otp);