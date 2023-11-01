var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var table = new schema({
    unique_id: Number,
    store_id: {type: schema.Types.ObjectId},
    is_user_can_book: {
        type:Boolean,
        default:false
    },
    is_bussiness: {
        type:Boolean,
        default:false
    },
    table_no: {
        type:Number,
        default:0
    },
    table_code: {
        type:String,
        default:""
    },
    table_min_person:{
        type:Number,
        default:0
    }, 
    table_max_person:{
        type:Number,
        default:0
    },
    table_qrcode:{
        type:String,
        default:""
    },      
    table_token: {
        type: String,
        default: ""
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

table.plugin(autoIncrement.plugin, {model: 'table', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('table', table);