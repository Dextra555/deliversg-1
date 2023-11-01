var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var bad_weather = new schema({
    unique_id: Number,
    bad_weather_status: {type: Boolean, default: false},
    delay_time: {type: Number},
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

bad_weather.plugin(autoIncrement.plugin, {model: 'bad_weather', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('bad_weather', bad_weather);