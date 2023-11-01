var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var main_category = new schema({
    unique_id: Number,
    main_category_name: {type: String, default: ""},
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

main_category.plugin(autoIncrement.plugin, {model: 'main_category', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('main_category', main_category);