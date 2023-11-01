var mongoose = require('mongoose');
var schema = mongoose.Schema;
var legal = new schema({
    user_privacy: {type: String, default: ""},
    provider_privacy: {type: String, default: ""},
    store_privacy: {type: String, default: ""},
    user_terms: {type: String, default: ""},
    provider_terms: {type: String, default: ""},
    store_terms: {type: String, default: ""},
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

module.exports = mongoose.model('Legal', legal);