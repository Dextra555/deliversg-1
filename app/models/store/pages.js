var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var pages = new schema({
    unique_id: Number,
    
    store_id: {type: schema.Types.ObjectId},
    title: [{type: String, default: ""}],
    is_visible: {type: Boolean, default: true},
    html_data: [{type: String, default: ""}],
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


pages.plugin(autoIncrement.plugin, {model: 'pages', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('pages', pages);