process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var mongoose = require('mongoose');
mongoose = require('../config/mongoose')
db = mongoose()

var Admin = require('mongoose').model('admin');
var admin_data = require('./admins.json')
Admin.findOne().then(detail => {
    if (!detail) {
        var admin = new Admin(admin_data)
        admin.save()
    }
})

var Delivery_type = require('mongoose').model('delivery_type')
var delivery_type_data = require('./delivery_types.json')
Delivery_type.findOne().then(detail => {
    if (!detail) {
        var delivery_type = new Delivery_type(delivery_type_data)
        delivery_type.save()
    }
})

var Email = require('mongoose').model('email_detail');
var emaildata = require('./email_details.json')
Email.findOne().then(detail => {
    if (!detail) {
        Email.create(emaildata, function (err, jellybean, snickers) { })
    }
})

var mongoose = require('mongoose');
var image_id = new mongoose.Types.ObjectId("5a0c337bfd7b2b0b434fa801");
var Image_setting = require('mongoose').model('image_setting');
var image_setting_data = require('./image_settings.json')
Image_setting.findOne().then(detail => {
    if (!detail) {
        var image_setting = new Image_setting({ _id: image_id, ...image_setting_data })
        image_setting.save()
    }
})

var Installation_setting = require('mongoose').model('installation_setting');
var installation_setting_data = require('./installation_settings.json')
Installation_setting.findOne().then(detail => {
    if (!detail) {
        var installation_setting = new Installation_setting(installation_setting_data)
        installation_setting.save()
    }
})

var payment_type_id = new mongoose.Types.ObjectId("586f7db95847c8704f537bd5");
var Payment_gateway = require('mongoose').model('payment_gateway');
var payment_gateway_data = require('./payment_gateways.json')
Payment_gateway.findOne().then(detail => {
    if (!detail) {
        var payment_gateway = new Payment_gateway({ _id: payment_type_id, ...payment_gateway_data })
        payment_gateway.save()
    }
})


var sms_gateway_id = new mongoose.Types.ObjectId("58760b3c2427bcc6ca779e46");
var Sms_gateway = require('mongoose').model('sms_gateway');
var sms_gateway_detail = require('./sms_gateways.json')
Sms_gateway.findOne().then(detail => {
    if (!detail) {
        var sms_detail = new Sms_gateway({ _id: sms_gateway_id, ...sms_gateway_detail })
        sms_detail.save()
    }
})

var setting_id = new mongoose.Types.ObjectId("58760b3c2427bcc6ca779e35");
var sms_gateway_id = new mongoose.Types.ObjectId("58760b3c2427bcc6ca779e46");
var Setting = require('mongoose').model('setting');
var setting_json = require('./settings.json')
Setting.findOne().then(detail => {
    if (!detail) {
        var setting = new Setting({ _id: setting_id, sms_gateway_id, ...setting_json })
        setting.save()
    }
})

var SMS_Detail = require('mongoose').model('sms_detail');
var SMS_Detail_data = require('./sms_details.json')
SMS_Detail.findOne().then(detail => {
    if (!detail) {
        SMS_Detail.create(SMS_Detail_data, function (err, jellybean, snickers) { })
    }
})