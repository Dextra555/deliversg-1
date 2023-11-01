var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

var product_group = new schema({
    unique_id: Number,
    name:[{type: String,default:[]}],
    image_url:{type: String, default: ""},
    store_id: {type: schema.Types.ObjectId},
    sequence_number: {type: Number, default: 0},
    main_product_group_id: {type: schema.Types.ObjectId, default: null},
    franchise_id: {type: schema.Types.ObjectId, default: null},
    product_ids: [{type: schema.Types.ObjectId,default:[]}],
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

product_group.index({store_id: 1}, {background: true});

product_group.plugin(autoIncrement.plugin, {model: 'ProductGroup', field: 'unique_id' , startAt: 1,incrementBy: 1});
module.exports = mongoose.model('ProductGroup', product_group);