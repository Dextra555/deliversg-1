var config = require('./config'),
        mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var autoIncrement = require('mongoose-auto-increment');

module.exports = function () {
    /// for mongoose 4
    // var db = mongoose.connect(config.db, {useMongoClient: true});
    // autoIncrement.initialize(db);

    //// for mongoose 5
    // var db = mongoose.connect(config.db);
    // autoIncrement.initialize(mongoose.connection);

    var db;
    if(config.db){
        db = mongoose.connect(config.db,{
            useUnifiedTopology: true,
            useNewUrlParser: true
        });
        
    } else {
        let keyConfig = {
            "username": "ubuntu",
            // "host": "13.233.83.77", // live server db
            "host": "13.234.32.65",
            "port": 22,
            "dstHost": "127.0.0.1",
            "dstPort": 27017,
            "localHost": "127.0.0.1",
            "localPort": 27017,
            "keepAlive":true,
            // "keyPath": "/var/www/html/ssh/EDELIVERY_LIVE_DB.ppk",
            // "keyPath": "/home/mahek-elluminati/Desktop/credentials/OOS/SAAS_DB.ppk",
            // "keyPath": "/home/elluminati/Desktop/Edelivery Paystack/credential_db/SAAS_DB.ppk", 
            // "keyPath": "/home/savan-elluminati/Savan/Credentials/Edelivery Live Server/EDELIVERY LIVE INSTALLATION/EDELIVERY_LIVE_API/EDELIVERY_LIVE_PRIVATE.ppk", // live server db
            "keyPath": "/home/savan-elluminati/Savan/Products/Edelivery  angular 10/SAAS_DB.ppk", 
            // "keyPath": "/home/elluminati-sagar/Desktop/Sagar/Work/000_Credentials/Edelivery  angular 10/SAAS_DB.ppk", 
            // "keyPath": "/Users/elluminati/Downloads/SAAS_DB.ppk",        

        }
        const tunnel = require('tunnel-ssh');
        const fs = require('fs');
        var server = tunnel({ ...keyConfig, privateKey: fs.readFileSync(keyConfig.keyPath) }, function (error, server) {
            db = mongoose.connect('mongodb://localhost:27017/deliversg', {
            // db = mongoose.connect('mongodb://localhost:27000/EDeliveryProductCleanDB2', {
                // db = mongoose.connect('mongodb://localhost:27000/EDeliveryProduct', { //live server db
                useUnifiedTopology: true,
                useNewUrlParser: true
            })
        });

        server.on('error', function(err){
            console.error('Something bad happened:', err);
        });
    }
    autoIncrement.initialize(mongoose.connection);

    require('../app/models/admin/settings');
    require('../app/models/admin/delivery');
    require('../app/models/admin/vehicle');
    require('../app/models/admin/country');
    require('../app/models/admin/city');
    require('../app/models/admin/service');
    require('../app/models/admin/installation_setting');
    require('../app/models/admin/promo_code');
    require('../app/models/admin/otp');
    require('../app/models/admin/tax');
    require('../app/models/admin/document');
    require('../app/models/admin/payment_gateway');
    require('../app/models/admin/sms_gateway');
    require('../app/models/admin/admin');
    require('../app/models/admin/database_backup');
    require('../app/models/admin/wallet_history');
    require('../app/models/admin/delivery_type');
    require('../app/models/admin/document_uploaded_list');
    require('../app/models/admin/cityzone');
    require('../app/models/admin/zonevalue');
    require('../app/models/admin/wallet_request');
    require('../app/models/admin/image_setting');
    require('../app/models/admin/transfer_history');
    require('../app/models/admin/mass_notification');
    require('../app/models/user/user');
    require('../app/models/user/card');
    require('../app/models/user/order');
    require('../app/models/user/cart');
    require('../app/models/user/review');
    require('../app/models/user/order_payment');
    require('../app/models/user/referral_code');
    require('../app/models/provider/provider');
    require('../app/models/provider/bank_detail');
    require('../app/models/provider/provider_analytic_daily');
    require('../app/models/provider/provider_vehicle');
    require('../app/models/franchise/franchise');
    require('../app/models/store/store');
    require('../app/models/store/pages');
    require('../app/models/store/sub_store');
    require('../app/models/store/table_settings');
    require('../app/models/store/table_booking');
    require('../app/models/store/tables');
    require('../app/models/store/product');
    require('../app/models/store/product_group');
    require('../app/models/store/specification');
    require('../app/models/store/specification_group');
    require('../app/models/store/item');
    require('../app/models/store/store_analytic_daily');
    require('../app/models/store/advertise');
    require('../app/models/store/request');
    require('../app/models/email_sms/email');
    require('../app/models/email_sms/sms');
    require('../app/models/admin/legal');
    require('../app/models/admin/script_page');
    require('../app/models/admin/cancellation_reason');
    require('../app/models/admin/home_seo');
    require('../app/models/admin/info_seo');
    require('../app/models/admin/store_seo');
    require('../app/models/admin/sub_category');
    require('../app/models/admin/bad_weather');
    require('../app/models/admin/peak_hour');
    require('../app/models/admin/deliver_fee');
    require('../app/models/admin/pickup_offer');
 
    return db;
};