var mongoose = require('mongoose');
var schema = mongoose.Schema;
var tax = new schema({
    tax_name: {type: Array, default: []},
    tax: {type: Number, default: 0},
    is_tax_visible: {type: Boolean, default: false},
    country_id: {type: schema.Types.ObjectId}

}, {
    strict: true
});
tax.index({country_id: 1}, {background: true});

module.exports = mongoose.model('tax',tax);