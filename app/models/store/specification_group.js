var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var specification_group = new schema({
    unique_id: Number,
    store_id: {type: schema.Types.ObjectId},
    main_specification_group_id: {type: schema.Types.ObjectId, default: null},
    franchise_id: {type: schema.Types.ObjectId, default: null},
    name:[{type: String,default:[]}],
    sequence_number: {type: Number, default: 0},
    unique_id_for_store_data: {type: Number, default: 0},
    user_can_add_specification_quantity: { type: Boolean, default: false },
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

specification_group.index({product_id: 1}, {background: true});
specification_group.index({store_id: 1, name: 1}, {background: true});
specification_group.index({store_id: 1, unique_id_for_store_data: 1}, {background: true});
specification_group.index({product_id: 1}, {background: true});
specification_group.index({_id: 1, store_id: 1}, {background: true});

 
specification_group.plugin(autoIncrement.plugin, {model: 'specification_group', field: 'unique_id' , startAt: 1,incrementBy: 1});

module.exports = mongoose.model('specification_group', specification_group);