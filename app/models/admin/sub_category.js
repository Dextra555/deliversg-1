var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var sub_category = new schema({
    unique_id: Number,
    store_delivery_id: {type: schema.Types.ObjectId},
    sub_category_name: {type: String},
    sub_category_image: {type: String, default: null},
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

sub_category.plugin(autoIncrement.plugin, {model: 'sub_category', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('sub_category', sub_category);