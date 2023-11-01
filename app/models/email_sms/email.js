var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var email_detail = new schema({
    unique_id: Number,
    template_unique_id:Number,
    email_unique_title: String,
    email_title: String,
    email_content: String,
    email_admin_info: String,
    is_send: {type: Boolean, default: false}
});

email_detail.index({unique_id: 1}, {background: true});

email_detail.plugin(autoIncrement.plugin, {model: 'email_detail', field: 'unique_id' , startAt: 1,incrementBy: 1});
module.exports = mongoose.model('email_detail', email_detail);
