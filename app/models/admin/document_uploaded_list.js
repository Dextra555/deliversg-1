var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var document_uploaded_list = new schema({
    unique_id: Number,
    document_id: {type: schema.Types.ObjectId},
    user_id: {type: schema.Types.ObjectId},
    unique_code: {type: String, default: ""},
    document_for: {type: Number, default: 8},
    image_url: {type: String, default: ""}, 
    is_document_expired:{type: Boolean, default: false},
    user_type_id: {type: schema.Types.ObjectId,default: null},  
    expiration_notification_sent_count: {type: Number, default: 0}, 
    //is_mandatory: {type: Boolean, default: false},
    //document_name:{type: String, default: ""},
    //is_unique_code: {type: Boolean, default: false},
    //is_expired_date: {type: Boolean, default: false},
    
    expired_date: {
        type: Date
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

document_uploaded_list.index({user_id: 1, document_for: 1, user_type_id: 1}, {background: true});

document_uploaded_list.plugin(autoIncrement.plugin, {model: 'document_uploaded_list', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('document_uploaded_list', document_uploaded_list);