var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var cityzone = new schema({
    city_id: { type: schema.Types.ObjectId },
    unique_id: Number,
    title:String,
    color: String,
    index: Number,
    kmlzone:{
        type: Array,
        index1: '3d'
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

cityzone.index({city_id: 1, title: 1}, {background: true});

cityzone.plugin(autoIncrement.plugin, {model: 'cityzone', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('cityzone', cityzone);