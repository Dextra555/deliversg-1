var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var schema = mongoose.Schema;
var script_page = new schema({
    unique_id: Number,
    title: {type: String, default: ""},
    htmlData: {type: String, default: ""},
    src: {type: String, default: ""},
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
script_page.plugin(autoIncrement.plugin, {model: 'script_page', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('script_page',script_page);