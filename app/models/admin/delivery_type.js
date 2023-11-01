var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

var delivery_type = new schema({
    name: {type: String, default: ""},
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
})


 
delivery_type.plugin(autoIncrement.plugin, {model: 'delivery_type', field: 'unique_id' , startAt: 1,incrementBy: 1});
module.exports = mongoose.model('delivery_type', delivery_type);