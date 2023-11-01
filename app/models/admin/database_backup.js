var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var database_backup = new schema({
    unique_id: Number,
    start_date: { type: Date },
    end_date: { type: Date },
    is_deleted_from_db: { type: Boolean, default: false },
    file_name: {type: String, default: ''},
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

database_backup.plugin(autoIncrement.plugin, {model: 'database_backup', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('database_backup', database_backup);