require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
var moment = require('moment');
var utils = require('../../utils/utils');
var emails = require('../../controllers/email_sms/emails');
var my_request = require('../../controllers/franchise/request');
var mongoose = require('mongoose');
var pad = require('pad-left');
var SMS = require('../../controllers/email_sms/sms');
var wallet_history = require('../../controllers/user/wallet');
var Franchise = require('mongoose').model('franchise');
var Store = require('mongoose').model('store');
var Country = require('mongoose').model('country');
var City = require('mongoose').model('city');
var Cart = require('mongoose').model('cart');
var Provider = require('mongoose').model('provider');
var User = require('mongoose').model('user');
var Order = require('mongoose').model('order');
var Vehicle = require('mongoose').model('vehicle');
var Payment_gateway = require('mongoose').model('payment_gateway');
var promo_code_controller = require('../../controllers/user/promo_code');
var Order_payment = require('mongoose').model('order_payment');
var Review = require('mongoose').model('review');
var Referral_code = require('mongoose').model('referral_code');
var Request = require('mongoose').model('request');
var Installation_setting = require('mongoose').model('installation_setting');
var SubStore = require('mongoose').model('SubStore');
var Delivery = require('mongoose').model('delivery');
var Promo_code = require('mongoose').model('promo_code');
var Pages = require('mongoose').model('pages');
var geolib = require('geolib');

var console = require('../../utils/console');

var Service = require('mongoose').model('service');
// store register api 

exports.store_register = function (request_data, response_data) {
    
    utils.check_request_params(request_data.body, [{name: 'city_id', type: 'string'}, {name: 'country_id', type: 'string'},
        {name: 'email', type: 'string'}, {name: 'store_delivery_id', type: 'string'}, {name: 'phone', type: 'string'}, {name: 'country_phone_code', type: 'string'}
        , {name: 'latitude'}, {name: 'longitude'}], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var social_id = request_data_body.social_id;
            var social_id_array = [];

            if (social_id == undefined || social_id == null || social_id == "")
            {
                social_id = null;
            } else
            {
                social_id_array.push(social_id);
            }
            
            
            Installation_setting.findOne({}).then((installation_setting) => {

                Country.findOne({_id: request_data_body.country_id}).then((country) => {
                    if (country) {
                        City.findOne({_id: request_data_body.city_id}).then((city) => {
                            if (city) {
                                var timezone = city.timezone;
                                Franchise.findOne({social_ids: {$all: social_id_array}}).then((store_data) => {
                                    if (store_data) {
                                        response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_ALREADY_REGISTER_WITH_SOCIAL});
                                    } else {
                                        Franchise.findOne({email: request_data_body.email}).then((store_data) => {

                                            if (store_data) {
                                                if (social_id != null && store_data.social_ids.indexOf(social_id) < 0)
                                                {
                                                    Delivery.findOne({_id: store_data.store_delivery_id}).then((delivery_data) => {
                                                        store_data.social_ids.push(social_id);
                                                        store_data.save();
                                                        response_data.json({
                                                            success: true,
                                                            message: STORE_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                                            timezone: timezone,
                                                            currency: country.currency_sign,
                                                            country_detail: country,
                                                            is_store_can_create_group:delivery_data.is_store_can_create_group,
                                                            is_store_can_edit_order:delivery_data.is_store_can_edit_order,
                                                            minimum_phone_number_length: country.minimum_phone_number_length,
                                                            maximum_phone_number_length: country.maximum_phone_number_length,
                                                            store: store_data
                                                        });
                                                    });
                                                } else
                                                {

                                                    response_data.json({success: false, error_code: STORE_ERROR_CODE.EMAIL_ALREADY_REGISTRED});
                                                }
                                            } else {

                                                Franchise.findOne({phone: request_data_body.phone}).then((store_data) => {

                                                    if (store_data) {
                                                        if (social_id != null && store_data.social_ids.indexOf(social_id) < 0)
                                                        {
                                                            Delivery.findOne({_id: store_data.store_delivery_id}).then((delivery_data) => {
                                                                store_data.social_ids.push(social_id);
                                                                store_data.save();
                                                                response_data.json({
                                                                    success: true,
                                                                    message: STORE_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                                                    timezone: timezone,
                                                                    currency: country.currency_sign,
                                                                    country_detail: country,
                                                                    is_store_can_create_group:delivery_data.is_store_can_create_group,
                                                                    is_store_can_edit_order:delivery_data.is_store_can_edit_order,
                                                                    minimum_phone_number_length: country.minimum_phone_number_length,
                                                                    maximum_phone_number_length: country.maximum_phone_number_length,
                                                                    store: store_data
                                                                });
                                                            });
                                                        } else
                                                        {

                                                            response_data.json({success: false, error_code: STORE_ERROR_CODE.PHONE_NUMBER_ALREADY_REGISTRED});

                                                        }



                                                    } else {
                                                        var name = (request_data_body.name).trim();
                                                        name = name.charAt(0).toUpperCase() + name.slice(1);


                                                        var server_token = utils.generateServerToken(32);


                                                        var store_data = new Franchise({
                                                            store_type: ADMIN_DATA_ID.ADMIN,
                                                            admin_type: ADMIN_DATA_ID.FRANCHISE,
                                                            store_type_id: null,
                                                            store_delivery_id: request_data_body.store_delivery_id,
                                                            name: name,
                                                            email: ((request_data_body.email).trim()).toLowerCase(),
                                                            password: request_data_body.password,
                                                            country_phone_code: request_data_body.country_phone_code,
                                                            website_url: request_data_body.website_url,
                                                            slogan: request_data_body.slogan,
                                                            country_id: request_data_body.country_id,
                                                            city_id: request_data_body.city_id,
                                                            phone: request_data_body.phone,
                                                            address: request_data_body.address,
                                                            famous_for: request_data_body.famous_for,
                                                            app_version: request_data_body.app_version,
                                                            image_url: "",
                                                            device_token: request_data_body.device_token,
                                                            device_type: request_data_body.device_type,
                                                            server_token: server_token,
                                                            is_email_verified: request_data_body.is_email_verified,
                                                            is_phone_number_verified: request_data_body.is_phone_number_verified,
                                                            is_business: request_data_body.is_business,
                                                            is_approved: request_data_body.is_approved,
                                                            offer: request_data_body.offer,
                                                            price_rating: 1,
                                                            social_ids: social_id_array,
                                                            login_by: request_data_body.login_by,
                                                            free_delivery_for_above_order_price: request_data_body.free_delivery_for_above_order_price,
                                                            location: [request_data_body.latitude, request_data_body.longitude]
                                                        });

                                                        var image_file = request_data.files;

                                                        if (image_file != undefined && image_file.length > 0) {
                                                            var image_name = store_data._id + utils.generateServerToken(4);
                                                            var url = utils.getStoreImageFolderPath(FOLDER_NAME.STORE_PROFILES) + image_name + FILE_EXTENSION.STORE;

                                                            store_data.image_url = url;
                                                            utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.STORE, FOLDER_NAME.STORE_PROFILES);

                                                        }

                                                        if (social_id == undefined || social_id == null || social_id == "")
                                                        {
                                                            store_data.password = utils.encryptPassword(request_data_body.password);
                                                        }


                                                        var timezone = city.timezone;

                                                        if (country && setting_detail) {

                                                            var referral_code = utils.generateReferralCode(ADMIN_DATA_ID.ADMIN, country.country_code, name, name);
                                                            store_data.referral_code = referral_code;

                                                            var wallet_currency_code = country.currency_code;

                                                            var wallet_to_admin_current_rate = 1;

                                                            var referral_bonus_to_store = country.referral_bonus_to_store;
                                                            var referral_bonus_to_store_friend = country.referral_bonus_to_store_friend;

                                                            store_data.wallet_currency_code = wallet_currency_code;

                                                            var country_id = country._id;

                                                            store_data.save().then(() => {

                                                                    
                                                                            if (setting_detail.is_mail_notification) {
                                                                                //sendStoreRegisterEmail
                                                                                emails.sendStoreRegisterEmail(request_data, store_data, store_data.name);
                                                                            }
                                                                            Delivery.findOne({_id: store_data.store_delivery_id}).then((delivery_data) => {
                                                                                response_data.json({
                                                                                    success: true,
                                                                                    message: STORE_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                                                                    timezone: timezone,
                                                                                    country_detail: country,
                                                                                    currency: country.currency_sign,
                                                                                    is_store_can_create_group:delivery_data.is_store_can_create_group,
                                                                                    is_store_can_edit_order:delivery_data.is_store_can_edit_order,
                                                                                    minimum_phone_number_length: country.minimum_phone_number_length,
                                                                                    maximum_phone_number_length: country.maximum_phone_number_length,
                                                                                    store: store_data
                                                                                });
                                                                            });
                                                                   
                                                            }, (error) => {
                                                                console.log(error)
                                                                response_data.json({
                                                                    success: false,
                                                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                });
                                                            });
                                                        }
                                                    }
                                                });
                                            }

                                        });
                                    }

                                }, (error) => {
                                    console.log(error)
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });
                            }

                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }

                }, (error) => {
                    console.log(error)
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                });

            }, (error) => {
                console.log(error)
                response_data.json({
                    success: false,
                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                });
            });
        } else {
            response_data.json(response);
        }
    });
};

exports.store_login = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'email', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var email = ((request_data_body.email).trim()).toLowerCase();
            var social_id = request_data_body.social_id;
            var encrypted_password = request_data_body.password;

            if (social_id == undefined || social_id == null || social_id == "")
            {
                social_id = "";
            }
            if(!email){
                email = null;
            }

            if (encrypted_password == undefined || encrypted_password == null || encrypted_password == "") {
                encrypted_password = "";
            } else {
                encrypted_password = utils.encryptPassword(encrypted_password);
            }

            var query = {$or: [{'email': email}, {'phone': email}, {social_ids: {$all: [social_id]}}]};

            if(encrypted_password || social_id){
                Franchise.findOne(query).then((store_detail) => {

                    if (social_id == undefined || social_id == null || social_id == "") {
                        social_id = null;
                    }

                    if ((social_id == null && email == "")) {

                        response_data.json({success: false, error_code: STORE_ERROR_CODE.LOGIN_FAILED});

                    } else if (store_detail) {
                        if (social_id == null && encrypted_password != "" && encrypted_password != store_detail.password) {

                            response_data.json({success: false, error_code: STORE_ERROR_CODE.INVALID_PASSWORD});

                        } else if (social_id != null && store_detail.social_ids.indexOf(social_id) < 0) {

                            response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_NOT_REGISTER_WITH_SOCIAL});

                        } else {
                            Country.findOne({_id: store_detail.country_id}).then((country) => {

                                City.findOne({_id: store_detail.city_id}).then((city) => {
                                    Store.find({_id: {$in:store_detail.store_ids}}).then((stores) => {

                                        var timezone = city.timezone;

                                        var device_token = "";
                                        var device_type = "";
                                        if (store_detail.device_token != "" && store_detail.device_token != request_data_body.device_token) {
                                            device_token = store_detail.device_token;
                                            device_type = store_detail.device_type;
                                        }

                                        if (request_data_body.device_type == DEVICE_TYPE.ANDROID || request_data_body.device_type == DEVICE_TYPE.IOS)
                                        {
                                            store_detail.device_token = request_data_body.device_token;

                                        } else
                                        {
                                            Order.update({store_notify: 0, store_id: store_detail._id}, {store_notify: 1}, {multi: true}, function (error, order) {
                                            });
                                        }

                                        store_detail.device_type = request_data_body.device_type;
                                        var server_token = utils.generateServerToken(32);
                                        store_detail.server_token = server_token;
                                        store_detail.login_by = request_data_body.login_by;
                                        store_detail.app_version = request_data_body.app_version;
                                        store_detail.save().then(() => {
                                            if (device_token != "") {
                                                utils.sendPushNotification(ADMIN_DATA_ID.STORE, device_type, device_token, STORE_PUSH_CODE.LOGIN_IN_OTHER_DEVICE, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                            }
                                                                    /*var store_data = JSON.parse(JSON.stringify(store_detail))
                                                                    store_data.name = store_detail.name[Number(request_data.headers.lang)];
                                                                    if(!store_data.name || store_data.name == ''){
                                                                        store_data.name = store_detail.name[0];
                                                                    }
                                                                    if(!store_data.name){
                                                                        store_data.name = "";
                                                                    }*/
                                            Delivery.findOne({_id: store_detail.store_delivery_id}).then((delivery_data) => {
                                                response_data.json({
                                                    success: true,
                                                    message: STORE_MESSAGE_CODE.LOGIN_SUCCESSFULLY,
                                                    timezone: timezone,
                                                    country_detail: country, 
                                                    currency: country.currency_sign,
                                                    minimum_phone_number_length: country.minimum_phone_number_length,
                                                    maximum_phone_number_length: country.maximum_phone_number_length,
                                                    is_store_can_create_group:delivery_data.is_store_can_create_group,
                                                    stores:stores,
                                                    is_store_can_edit_order:delivery_data.is_store_can_edit_order,
                                                    store: store_detail 

                                                });
                                            });

                                        }, (error) => {
                                            console.log(error)
                                            response_data.json({
                                                success: false,
                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                            });
                                        });
                                    });
                                });

                            }, (error) => {
                                console.log(error)
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });
                        }

                    } else {
                        response_data.json({success: false, error_code: STORE_ERROR_CODE.NOT_A_REGISTERED});
                    }

                }, (error) => {
                    console.log(error)
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                });
            } else {
                response_data.json({success: false, error_code: STORE_ERROR_CODE.LOGIN_FAILED});
            }
        } else {
            response_data.json(response);
        }
    });
};

//store_update
exports.store_update = function (request_data, response_data) {
    
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var store_id = request_data_body.store_id;
            var old_password = request_data_body.old_password;
            var social_id = request_data_body.social_id;
            if(request_data_body.name){
                if(typeof request_data_body.name == "string"){
                    request_data_body.name = JSON.parse(request_data_body.name);
                }
                var name = [];
                request_data_body.name.forEach(function(data){
                    if(data =="" || data =="null"){
                        name.push(null);
                    }else{
                        name.push(data);
                    }
                })
                request_data_body.name = name;
            }
            if (social_id == undefined || social_id == null || social_id == "") {
                social_id = null;
            }

            if (old_password == undefined && old_password == null && old_password == "") {
                old_password = "";
            } else {
                old_password = utils.encryptPassword(old_password);
            }
            var store = response.franchise;
           

                    if (request_data_body.type !== ADMIN_DATA_ID.ADMIN && social_id == null && old_password != "" && old_password != store.password) {

                        response_data.json({success: false, error_code: STORE_ERROR_CODE.INVALID_PASSWORD});

                    } else if (request_data_body.type !== ADMIN_DATA_ID.ADMIN && social_id != null && store.social_ids.indexOf(social_id) < 0) {

                        response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_NOT_REGISTER_WITH_SOCIAL});

                    } else
                    {
                        Country.findOne({_id: store.country_id}).then((country) => {
                            City.findOne({_id: store.city_id}).then((city) => {

                                var timezone = city.timezone;
                                var new_email = request_data_body.email;
                                var new_phone = request_data_body.phone;
                                if (request_data_body.new_password != "" && request_data_body.new_password != undefined) {
                                    var new_password = utils.encryptPassword(request_data_body.new_password);
                                    request_data_body.password = new_password;
                                }

                                if (request_data_body.latitude != undefined && request_data_body.longitude != undefined) {
                                    request_data_body.location = [request_data_body.latitude, request_data_body.longitude];
                                }

                                request_data_body.social_ids = store.social_ids;

                                Franchise.findOne({_id: {'$ne': store_id}, email: new_email}).then((store_details) => {

                                    var is_update = false;
                                    if (store_details) {
                                        
                                    } else {
                                        is_update = true;
                                    }

                                    if (is_update == true)
                                    {
                                        is_update = false;
                                        Franchise.findOne({_id: {'$ne': store_id}, phone: new_phone}).then((store_phone_details) => {
                                            if (store_phone_details) {
                                                
                                            } else {
                                                is_update = true;
                                            }
                                            if (is_update == true)
                                            {
                                                var social_id_array = [];
                                                if (social_id != null) {
                                                    social_id_array.push(social_id);
                                                }
                                                store_update_query = {'_id': store_id};
                                                delete request_data_body.unique_id;
                                                var image_file = request_data.files;
                                                        if (image_file != undefined && image_file.length > 0) {
                                                            utils.deleteImageFromFolder(store.image_url, FOLDER_NAME.STORE_PROFILES);
                                                            var image_name = store._id + utils.generateServerToken(4);
                                                            var url = utils.getStoreImageFolderPath(FOLDER_NAME.STORE_PROFILES) + image_name + FILE_EXTENSION.STORE;
                                                            utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.STORE, FOLDER_NAME.STORE_PROFILES);
                                                            request_data_body.image_url = url;
                                                        }
                                                
                                                Franchise.findOneAndUpdate(store_update_query, request_data_body, {new : true}).then((store_data) => {

                                                    if (store_data)
                                                    {
                                                        


                                                        /*if (request_data_body.is_phone_number_verified != undefined) {
                                                            store_data.is_phone_number_verified = request_data_body.is_phone_number_verified;
                                                        } else if (request_data_body.is_email_verified != undefined)
                                                        {
                                                            store_data.is_email_verified = request_data_body.is_email_verified;
                                                        } else if (request_data_body.is_phone_number_verified != undefined && request_data_body.is_email_verified != undefined)
                                                        {
                                                            store_data.is_phone_number_verified = request_data_body.is_phone_number_verified;
                                                            store_data.is_email_verified = request_data_body.is_email_verified;
                                                        }
                                                        store_data.save();*/

                                                        Delivery.findOne({_id: store_data.store_delivery_id}).then((delivery_data) => {
                                                            response_data.json({
                                                                success: true,
                                                                message: STORE_MESSAGE_CODE.UPDATE_SUCCESSFULLY,
                                                                timezone: timezone,
                                                                country_detail: country,
                                                                currency: country.currency_sign,
                                                                minimum_phone_number_length: country.minimum_phone_number_length,
                                                                maximum_phone_number_length: country.maximum_phone_number_length,
                                                                is_store_can_create_group:delivery_data.is_store_can_create_group,
                                                                is_store_can_edit_order:delivery_data.is_store_can_edit_order,
                                                                store: store_data

                                                            });
                                                        });

                                                    } else
                                                    {
                                                        response_data.json({success: false, error_code: STORE_ERROR_CODE.UPDATE_FAILED});
                                                    }
                                                }, (error) => {
                                                    console.log(error)
                                                    response_data.json({
                                                        success: false,
                                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                    });
                                                });
                                            } else
                                            {
                                                response_data.json({success: false, error_code: STORE_ERROR_CODE.PHONE_NUMBER_ALREADY_REGISTRED});
                                            }

                                        }, (error) => {
                                            console.log(error)
                                            response_data.json({
                                                success: false,
                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                            });
                                        });
                                    } else {
                                        response_data.json({success: false, error_code: STORE_ERROR_CODE.EMAIL_ALREADY_REGISTRED});
                                    }
                                });

                            }, (error) => {
                                console.log(error)
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });

                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }
                
        } else {
            response_data.json(response);
        }
    });
};

/// store_otp_verification
exports.store_otp_verification = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store = response.franchise;
                    
                        if (request_data_body.is_phone_number_verified != undefined) {
                            store.is_phone_number_verified = request_data_body.is_phone_number_verified;
                            if (store.phone != request_data_body.phone)
                            {
                                Franchise.findOne({phone: request_data_body.phone}).then((store_phone_detail) => {
                                    if (store_phone_detail)
                                    {
                                        store_phone_detail.phone = "00" + store_phone_detail.phone;
                                        store_phone_detail.save();
                                    }

                                });

                            }
                            store.phone = request_data_body.phone;
                           
                        } else if (request_data_body.is_email_verified != undefined)
                        {
                            store.is_email_verified = request_data_body.is_email_verified;
                            if (store.email != request_data_body.email)
                            {
                                Franchise.findOne({email: request_data_body.email}).then((store_email_detail) => {
                                    if (store_email_detail)
                                    {
                                        store_email_detail.email = "notverified" + store_email_detail.email;
                                        store_email_detail.save();
                                    }

                                });

                            }

                            store.email = request_data_body.email;
                           
                        } else if (request_data_body.is_phone_number_verified != undefined && request_data_body.is_email_verified != undefined)
                        {

                            store.is_phone_number_verified = request_data_body.is_phone_number_verified;
                            if (store.phone != request_data_body.phone)
                            {
                                Franchise.findOne({phone: request_data_body.phone}).then((store_phone_detail) => {
                                    if (store_phone_detail)
                                    {
                                        store_phone_detail.phone = "00" + store_phone_detail.phone;
                                        store_phone_detail.save();
                                    }

                                });

                            }
                            store.is_email_verified = request_data_body.is_email_verified;
                            if (store.phone != request_data_body.phone)
                            {
                                Franchise.findOne({email: request_data_body.email}).then((store_email_detail) => {
                                    if (store_email_detail)
                                    {
                                        store_email_detail.email = "notverified" + store_email_detail.email;
                                        store_email_detail.save();
                                    }

                                });

                            }
                            store.phone = request_data_body.phone;
                            store.email = request_data_body.email;
                           
                        }

                        store.save().then(() => {
                            response_data.json({
                                success: true,
                                message: STORE_MESSAGE_CODE.OTP_VERIFICATION_SUCCESSFULLY
                            });
                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    

                
        } else {
            response_data.json(response);
        }
    });
};

// store get_detail
exports.get_detail = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store = response.franchise;
                        
                            Country.findOne({_id: store.country_id}).then((country) => {
                                City.findOne({_id: store.city_id}).then((city) => {

                                    var timezone = city.timezone;
                                    store.app_version = request_data_body.app_version;
                                    if (request_data_body.device_token != undefined) {
                                        store.device_token = request_data_body.device_token;
                                    }


                                    store.save().then(() => {
                                        Delivery.findOne({_id: store.store_delivery_id}).then((delivery_data) => {
                                            response_data.json({
                                                success: true,
                                                message: STORE_MESSAGE_CODE.GET_DETAIL_SUCCESSFULLY,
                                                timezone: timezone,
                                                currency: country.currency_sign,
                                                is_store_can_create_group:delivery_data.is_store_can_create_group,
                                                is_store_can_edit_order:delivery_data.is_store_can_edit_order,
                                                minimum_phone_number_length: country.minimum_phone_number_length,
                                                maximum_phone_number_length: country.maximum_phone_number_length,
                                                sub_store: response.sub_store,
                                                store: store
                                            });
                                        });

                                    }, (error) => {
                                        console.log(error)
                                        response_data.json({
                                            success: false,
                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                        });
                                    });
                                });

                            }, (error) => {
                                console.log(error)
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });
                        
                
        } else {
            response_data.json(response);
        }
    });
};

// update device token 
exports.update_device_token = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'device_token', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Franchise.findOne({_id: request_data_body.store_id}).then((store) => {
                if (store)
                {
                    if (request_data_body.server_token !== null && store.server_token !== request_data_body.server_token) {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        store.device_token = request_data_body.device_token;
                        store.save().then(() => {
                                response_data.json({
                                    success: true,
                                    message: STORE_MESSAGE_CODE.DEVICE_TOKEN_UPDATE_SUCCESSFULLY
                                });
                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }
                } else
                {
                    response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND});
                }

            }, (error) => {
                console.log(error)
                response_data.json({
                    success: false,
                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                });
            });
        } else {
            response_data.json(response);
        }
    });
};

// logout api 
exports.logout = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Franchise.findOne({_id: request_data_body.store_id}).then((store) => {
                if (store)
                {
                    if (request_data_body.server_token !== null && store.server_token !== request_data_body.server_token) {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});

                    } else
                    {
                        store.device_token = "";
                        store.server_token = "";
                        store.save().then(() => {
                            response_data.json({
                                success: true,
                                message: STORE_MESSAGE_CODE.LOGOUT_SUCCESSFULLY
                            });

                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }
                } else
                {
                    response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND});
                }

            }, (error) => {
                console.log(error)
                response_data.json({
                    success: false,
                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                });
            });
        } else {
            response_data.json(response);
        }
    });
};

//get_store_data
exports.get_franchise_data = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store = response.franchise;
                    
                        var country_query = {
                            $lookup:
                                    {
                                        from: "countries",
                                        localField: "country_id",
                                        foreignField: "_id",
                                        as: "country_details"
                                    }
                        };

                        var array_to_json = {$unwind: "$country_details"};
                        var city_query = {
                            $lookup:
                                    {
                                        from: "cities",
                                        localField: "city_id",
                                        foreignField: "_id",
                                        as: "city_details"}
                        };

                        var array_to_json1 = {$unwind: "$city_details"};
                        var delivery_query = {$lookup:
                                    {
                                        from: "deliveries",
                                        localField: "store_delivery_id",
                                        foreignField: "_id", as: "delivery_details"}
                        };
                        var array_to_json2 = {$unwind: "$delivery_details"};
                        var condition = {"$match": {'_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};

                        Franchise.aggregate([condition, country_query, city_query, delivery_query, array_to_json, array_to_json1, array_to_json2]).then((store_detail) => {

                            if (store_detail.length != 0) {

                                var store_condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
                                var group = {
                                    $group: {
                                        _id: null,
                                        total_orders: {$sum: 1},
                                        accepted_orders: {$sum: {$cond: [{$and: [{$gte: ["$order_status", ORDER_STATE.STORE_ACCEPTED]}, {$gte: ["$order_status", ORDER_STATE.STORE_ACCEPTED]}]}, 1, 0]}},
                                        completed_orders: {$sum: {$cond: [{$eq: ["$order_status_id", ORDER_STATUS_ID.COMPLETED]}, 1, 0]}},
                                        cancelled_orders: {$sum: {$cond: [{$eq: ["$order_status_id", ORDER_STATUS_ID.CANCELLED]}, 1, 0]}}
                                    }
                                }
                                Order.aggregate([store_condition, group]).then((order_detail) => {

                                    if (order_detail.length == 0) {
                                        response_data.json({success: true,
                                            message: STORE_MESSAGE_CODE.STORE_DATA_SUCCESSFULLY,
                                            store_detail: store_detail[0],
                                            order_detail: {
                                                total_orders: 0,
                                                accepted_orders: 0,
                                                completed_orders: 0,
                                                cancelled_orders: 0,
                                                completed_order_percentage: 0
                                            }
                                        });
                                    } else {
                                        var completed_order_percentage = order_detail[0].completed_orders * 100 / order_detail[0].total_orders;
                                        order_detail[0].completed_order_percentage = completed_order_percentage;
                                        response_data.json({success: true,
                                            message: STORE_MESSAGE_CODE.STORE_DATA_SUCCESSFULLY,
                                            store_detail: store_detail[0],
                                            order_detail: order_detail[0]
                                        });
                                    }
                                });
                            } else
                            {
                                response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND});
                            }

                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    
                
        } else {
            response_data.json(response);
        }
    });
};

//update store time
exports.update_store_time = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store_id = request_data_body.store_id;
            var old_password = request_data_body.old_password;
            var social_id = request_data_body.social_id;

            if (social_id == undefined || social_id == null || social_id == "") {
                social_id = null;
            }

            if (old_password == undefined || old_password == null || old_password == "") {
                old_password = "";
            } else {
                old_password = utils.encryptPassword(old_password);
            }

            var store = response.franchise;
                    if (social_id == null && old_password != "" && old_password != store.password) {

                        response_data.json({success: false, error_code: STORE_ERROR_CODE.INVALID_PASSWORD});

                    } else if (social_id != null && store.social_ids.indexOf(social_id) < 0) {

                        response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_NOT_REGISTER_WITH_SOCIAL});

                    } else
                    {

                        // request_data_body.store_time.sort(sortStoreTime);
                        Franchise.findOneAndUpdate({_id: store_id}, request_data_body, {new : true}).then((store_data) => {

                            if (store_data)
                            {
                                response_data.json({
                                    success: true,
                                    message: STORE_MESSAGE_CODE.UPDATE_SUCCESSFULLY,
                                    store: store_data

                                });
                            } else
                            {
                                response_data.json({success: false, error_code: STORE_ERROR_CODE.UPDATE_FAILED});
                            }

                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });

                    }
                
        } else {
            response_data.json(response);
        }
    });
};


exports.get_country_phone_number_length = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'country_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Country.findOne({_id: request_data_body.country_id}).then((country) => {
                if (country)
                {
                    response_data.json({
                        success: true,
                        message: USER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                        minimum_phone_number_length: country.minimum_phone_number_length,
                        maximum_phone_number_length: country.maximum_phone_number_length
                    });
                } else
                {
                    response_data.json({success: false, error_code: USER_ERROR_CODE.REGISTRATION_FAILED});

                }
            }, (error) => {
                console.log(error)
                response_data.json({
                    success: false,
                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                });
            });
        } else {
            response_data.json(response);
        }
    });
};
exports.get_order_detail = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'order_id', type: 'string'}], function (response) {
        
        if (response.success) {

            var request_data_body = request_data.body;
                        Order.findOne({_id: request_data_body.order_id}).then((order) => {
                            if (order) {
                                Store.findOne({_id: order.store_id}).then((store_detail) => {
                              
                                    User.findOne({_id: order.user_id}).then((user_detail) => {
                                        Country.findOne({_id: store_detail.country_id}).then((country_detail) => {
                                            var currency = country_detail.currency_sign;
                                            Cart.findOne({_id: order.cart_id}).then((cart) => {
                                                if (cart) {

                                                    Order_payment.findOne({_id: order.order_payment_id, order_id: order._id}).then((order_payment) => {
                                                        if(order.request_id){
                                                            Request.findOne({_id:order.request_id},function(err,request_detail){
                                                                Provider.findOne({_id:request_detail.current_provider},function(err,provider){
                                                                    var provider_details = null;
                                                                    if(provider){
                                                                        provider_details = {
                                                                            name: provider.first_name+' '+provider.last_name,
                                                                            email: provider.email,
                                                                            image_url: provider.image_url,
                                                                            location: provider.location,
                                                                            phone: provider.country_phone_code+provider.phone,
                                                                        };
                                                                    }
                                                                    var order_datail = {
                                                                        order_payment_detail: order_payment,
                                                                        order: order,
                                                                        request_detail: request_detail,
                                                                        cart_detail: cart,
                                                                        user_id: order.user_id,                                                          
                                                                        is_confirmation_code_required_at_pickup_delivery: setting_detail.is_confirmation_code_required_at_pickup_delivery,
                                                                        is_confirmation_code_required_at_complete_delivery: setting_detail.is_confirmation_code_required_at_complete_delivery,
                                                                        currency: currency,
                                                                        user_image_url: user_detail.image_url,
                                                                        provider_detail: provider_details,
                                                                       
                                                                    }
                                                                    response_data.json({success: true,
                                                                        message: ORDER_MESSAGE_CODE.GET_ORDER_STATUS_SUCCESSFULLY,
                                                                        order: order_datail
                                                                    });
                                                                })
                                                            })
                                                        }else{
                                                            var order_datail = {
                                                                order_payment_detail: order_payment,
                                                                order: order,
                                                                cart_detail: cart,
                                                                user_id: order.user_id,                                                          
                                                                is_confirmation_code_required_at_pickup_delivery: setting_detail.is_confirmation_code_required_at_pickup_delivery,
                                                                is_confirmation_code_required_at_complete_delivery: setting_detail.is_confirmation_code_required_at_complete_delivery,
                                                                currency: currency,
                                                                user_image_url: user_detail.image_url,
                                                                provider_detail: null,
                                                                request_detail: null,
                                                               
                                                            }
                                                            response_data.json({success: true,
                                                                message: ORDER_MESSAGE_CODE.GET_ORDER_STATUS_SUCCESSFULLY,
                                                                order: order_datail
                                                            });
                                                        }    

                                                    }, (error) => {
                                                        console.log(error)
                                                        response_data.json({
                                                            success: false,
                                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                        });
                                                    });
                                                }

                                            }, (error) => {
                                                console.log(error)
                                                response_data.json({
                                                    success: false,
                                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                });
                                            });

                                        }, (error) => {
                                            console.log(error)
                                            response_data.json({
                                                success: false,
                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                            });
                                        });
                                    }, (error) => {
                                            console.log(error)
                                            response_data.json({
                                                success: false,
                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                            });
                                        });
                                });
                            } else {

                                response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                            }

                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    
                
        } else {
            response_data.json(response);
        }
    });
};
exports.franchise_cancel_request = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'request_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store_detail = response.store;
                    
                        Request.findOne({_id: request_data_body.request_id, delivery_status_manage_id: ORDER_STATUS_ID.RUNNING }).then((request) => {
                            if (request) {
                                Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {

                                    if (provider) {
                                        var requests = provider.requests;

                                        var index = requests.indexOf(request._id);
                                        if (index >= 0) {
                                            requests.splice(index, 1);
                                            provider.requests = requests;
                                        }

                                        var current_request = provider.current_request;
                                        var current_request_index = current_request.indexOf(request._id);
                                        if (current_request_index >= 0) {
                                            current_request.splice(current_request_index, 1);
                                            provider.current_request = current_request;
                                        }

                                        provider.save();

                                        var device_type = provider.device_type;
                                        var device_token = provider.device_token;

                                        utils.sendPushNotification(ADMIN_DATA_ID.PROVIDER, device_type, device_token, PROVIDER_PUSH_CODE.STORE_CANCELLED_REQUEST, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);


                                        request.current_provider = null;
                                        request.provider_id = null;
                                        request.delivery_status = ORDER_STATE.STORE_CANCELLED_REQUEST;
                                        request.delivery_status_manage_id = ORDER_STATUS_ID.CANCELLED;
                                        request.delivery_status_by = null;
                                        request.providers_id_that_rejected_order_request = [];

                                        var index = request.date_time.findIndex((x) => x.status == ORDER_STATE.STORE_CANCELLED_REQUEST);

                                        if (index == -1) {
                                            request.date_time.push({status: ORDER_STATE.STORE_CANCELLED_REQUEST, date: new Date()});
                                        } else {
                                            request.date_time[index].date = new Date();
                                        }

                                        request.save();

                                        response_data.json({success: true,
                                            message: STORE_MESSAGE_CODE.CANCEL_REQUEST_SUCESSFULLY,
                                            delivery_status: request.delivery_status
                                        });
                                    } else
                                    {
                                        response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
                                    }

                                }, (error) => {
                                    console.log(error)
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });
                            } else {
                                response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                            }

                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    
                
        } else {
            response_data.json(response);
        }
    });
};

exports.franchise_complete_order = function (request_data, response_data) {

    console.log('franchise_complete_order')
    utils.check_unique_details(request_data, [{name: 'order_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var order_id = request_data_body.order_id;
            var store  = response.store;

                        City.findOne({_id: store.city_id}).then((city) => {

                            var is_store_earning_add_in_wallet_on_cash_payment_for_city = city.is_store_earning_add_in_wallet_on_cash_payment;

                            var is_store_earning_add_in_wallet_on_other_payment_for_city = city.is_store_earning_add_in_wallet_on_other_payment;

                            var city_timezone = city.timezone;
                            var now = new Date();
                            var today_start_date_time = utils.get_date_now_at_city(now, city_timezone);
                            var tag_date = moment(today_start_date_time).format(DATE_FORMATE.DDMMYYYY);
                            Order.findOne({_id: order_id, store_id: request_data_body.store_id, order_status_id: ORDER_STATUS_ID.RUNNING}).then((order) => {
                                Store.findOne({_id: order.store_id}).then((store) => {
                                    if (order) {
                                        User.findOne({_id: order.user_id}).then((user) => {
                                            var now = new Date();
                                            var user_device_type = user.device_type;
                                            var user_device_token = user.device_token;

                                            order.order_status_id = ORDER_STATUS_ID.COMPLETED;
                                            order.order_status_by = request_data_body.store_id;
                                            order.order_status = ORDER_STATE.ORDER_COMPLETED;
                                            order.completed_at = now;

                                            order.completed_date_tag = tag_date;
                                            order.completed_date_in_city_timezone = today_start_date_time;


                                            var index = order.date_time.findIndex((x) => x.status == ORDER_STATE.ORDER_COMPLETED);
                                            if (index == -1) {
                                                order.date_time.push({status: ORDER_STATE.ORDER_COMPLETED, date: new Date()});
                                            } else {
                                                order.date_time[index].date = new Date();
                                            }

                                            order.save();

                                            Order_payment.findOne({_id: order.order_payment_id}).then((order_payment) => {
                                                if (order_payment) {

                                                    // Entry in Store_analytic_daily Table
                                                    utils.insert_daily_store_analytics(tag_date, order.store_id, ORDER_STATE.ORDER_COMPLETED, order_payment.total_item_count, false);



                                                    var payment_gateway_name = "Cash";
                                                    var is_payment_mode_cash = order_payment.is_payment_mode_cash;


                                                    var store_have_service_payment = 0;
                                                    var store_have_order_payment = 0;
                                                    var total_store_have_payment = 0;
                                                    var pay_to_store = 0;

                                                    if (order_payment.is_store_pay_delivery_fees) {
                                                        store_have_service_payment = order_payment.total_delivery_price;
                                                        store_have_service_payment = utils.precisionRoundTwo(store_have_service_payment);
                                                    }

                                                    if (is_payment_mode_cash && !order_payment.is_order_price_paid_by_store) {
                                                        store_have_order_payment = order_payment.total_order_price;
                                                        store_have_order_payment = utils.precisionRoundTwo(store_have_order_payment);
                                                    }

                                                    order_payment.total_store_income = order_payment.total_store_income + order_payment.total_provider_income;
                                                    order_payment.total_provider_income = 0;

                                                    total_store_have_payment = +store_have_service_payment + +store_have_order_payment;
                                                    total_store_have_payment = utils.precisionRoundTwo(total_store_have_payment);
                                                    var other_promo_payment_loyalty = order_payment.other_promo_payment_loyalty;

                                                    pay_to_store = order_payment.total_store_income - other_promo_payment_loyalty;
                                                    console.log("pay_to_store: "+pay_to_store)
                                                    // if(order_payment.is_user_pick_up_order){
                                                    //     pay_to_store = order_payment.total_store_income - total_store_have_payment;
                                                    // } else {
                                                        if (is_payment_mode_cash) {
                                                            pay_to_store = pay_to_store - order_payment.cash_payment;
                                                        } else {
                                                            pay_to_store = pay_to_store - total_store_have_payment;
                                                        }
                                                    // }
                                                    console.log("pay_to_store: "+pay_to_store)
                                                    pay_to_store = utils.precisionRoundTwo(pay_to_store);

                                                    order_payment.pay_to_store = pay_to_store;

                                                    Payment_gateway.findOne({_id: order_payment.payment_id}).then((payment_gateway) => {

                                                        if (!is_payment_mode_cash) {
                                                            payment_gateway_name = payment_gateway.name;
                                                        }

                                                        if ((setting_detail.is_store_earning_add_in_wallet_on_cash_payment && order_payment.is_payment_mode_cash && is_store_earning_add_in_wallet_on_cash_payment_for_city) || (setting_detail.is_store_earning_add_in_wallet_on_other_payment && !order_payment.is_payment_mode_cash && is_store_earning_add_in_wallet_on_other_payment_for_city))
                                                        {
                                                            if (pay_to_store<0) {

                                                                var store_total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.STORE, store.unique_id, store._id, store.country_id,
                                                                        store.wallet_currency_code, order_payment.order_currency_code,
                                                                        1, Math.abs(pay_to_store), store.wallet, WALLET_STATUS_ID.REMOVE_WALLET_AMOUNT, WALLET_COMMENT_ID.SET_ORDER_PROFIT, "Profit Of This Order : " + order.unique_id);

                                                                store.wallet = store_total_wallet_amount;
                                                            } else
                                                            {
                                                                var store_total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.STORE, store.unique_id, store._id, store.country_id,
                                                                        store.wallet_currency_code, order_payment.order_currency_code,
                                                                        1, pay_to_store, store.wallet, WALLET_STATUS_ID.ADD_WALLET_AMOUNT, WALLET_COMMENT_ID.SET_ORDER_PROFIT, "Profit Of This Order : " + order.unique_id);

                                                                store.wallet = store_total_wallet_amount;
                                                            }

                                                            store.save();
                                                            order_payment.is_store_income_set_in_wallet = true;
                                                            order_payment.store_income_set_in_wallet = Math.abs(pay_to_store);
                                                        }



                                                        // mail to user order Completed.
                                                        if (setting_detail.is_mail_notification) {
                                                            emails.sendUserOrderCompleteEmail(request_data, user);
                                                        }

                                                        order_payment.delivered_at = now;
                                                        order_payment.completed_date_tag = tag_date;
                                                        order_payment.completed_date_in_city_timezone = today_start_date_time;

                                                        order_payment.save();

                                                        // Entry In Review Table //
                                                        var reviews = new Review({
                                                            user_rating_to_provider: 0,
                                                            user_review_to_provider: "",
                                                            user_rating_to_store: 0,
                                                            user_review_to_store: "",
                                                            provider_rating_to_user: 0,
                                                            provider_review_to_user: "",
                                                            provider_rating_to_store: 0,
                                                            provider_review_to_store: "",
                                                            store_rating_to_provider: 0,
                                                            store_review_to_provider: "",
                                                            store_rating_to_user: 0,
                                                            store_review_to_user: "",
                                                            order_id: order._id,
                                                            order_unique_id: order.unique_id,
                                                            user_id: order.user_id,
                                                            store_id: order.store_id,
                                                            provider_id: null,
                                                            number_of_users_like_store_comment: 0,
                                                            number_of_users_dislike_store_comment: 0,
                                                            id_of_users_like_store_comment: [],
                                                            id_of_users_dislike_store_comment: []

                                                        });
                                                        reviews.save();
                                                        var store_data = JSON.parse(JSON.stringify(store))
                                                        store_data.name = store.name[Number(request_data.headers.lang)];
                                                        if(!store_data.name || store_data.name == ''){
                                                            store_data.name = store.name[0];
                                                        }
                                                        if(!store_data.name){
                                                            store_data.name = "";
                                                        }
                                                        var order_data = {
                                                            order_id: order._id,
                                                            unique_id: order.unique_id,
                                                            store_name: store_data.name,
                                                            store_image: store.image_url
                                                        }

                                                        utils.sendPushNotificationWithPushData(ADMIN_DATA_ID.USER, user_device_type, user_device_token, USER_PUSH_CODE.DELIVERY_MAN_COMPLETE_ORDER, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, order_data, "");



                                                        response_data.json({
                                                            success: true,
                                                            message: ORDER_MESSAGE_CODE.ORDER_COMPLETED_SUCCESSFULLY,
                                                            order_id: order._id,
                                                            order_status: order.order_status,
                                                            currency: order.currency,
                                                            payment_gateway_name: payment_gateway_name,
                                                            order_payment: order_payment
                                                        });

                                                    });
                                                } else {
                                                    response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_COMPLETE_FAILED});
                                                }

                                            }, (error) => {
                                                console.log(error)
                                                response_data.json({
                                                    success: false,
                                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                });
                                            });
                                        });
                                    }
                                });

                            }, (error) => {
                                console.log(error)
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });
                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    
                
        } else {
            response_data.json(response);
        }
    });
};
exports.order_history_detail = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'order_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store  = response.store;
                    
                        var store_condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
                        var order_condition = {"$match": {'_id': {$eq: mongoose.Types.ObjectId(request_data_body.order_id)}}};
                        
                        var order_status_condition = {$match: {
                            $or: [{order_status: {$eq: ORDER_STATE.STORE_REJECTED}},
                                {order_status: {$eq: ORDER_STATE.CANCELED_BY_USER}},
                                {order_status: {$eq: ORDER_STATE.STORE_CANCELLED}},
                                {order_status: {$eq: ORDER_STATE.ORDER_COMPLETED}}

                            ]}
                        };

                        var order_status_id_condition = {$match: {

                            $or: [{order_status_id: {$eq: ORDER_STATUS_ID.CANCELLED}},
                                {order_status_id: {$eq: ORDER_STATUS_ID.REJECTED}},
                                {order_status_id: {$eq: ORDER_STATUS_ID.COMPLETED}},
                            ]

                            }
                        };
                        Order.aggregate([order_condition/*, store_condition*/, order_status_condition, order_status_id_condition]).then((orders) => {
                        //Order.findOne({_id: request_data_body.order_id}).then((order_detail) => {
                            if (orders.length != 0) 
                            {
                                var order_detail = orders[0];
                                var country_id = order_detail.country_id;
                                if (order_detail.country_id == null && order_detail.country_id == undefined) {
                                    country_id = store.country_id;
                                }

                                Country.findOne({_id: country_id}).then((country) => {
                                    var currency = "";
                                    if (country)
                                    {
                                        currency = country.currency_sign;
                                    }
                                    User.findOne({_id: order_detail.user_id}).then((user_data) => {
                                        var current_provider = null;
                                        Request.findOne({_id: order_detail.request_id}).then((request_data) => {
                                            if (request_data) {
                                                current_provider = request_data.current_provider;
                                            }
                                            Provider.findOne({_id: current_provider}).then((provider_data) => {
                                                Order_payment.findOne({_id: order_detail.order_payment_id}).then((order_payment) => {
                                                    Cart.findOne({_id: order_detail.cart_id}).then((cart) => {
                                                    
                                                        var payment_gateway_name = "Cash";
                                                        if (order_payment.is_payment_mode_cash == false) {
                                                            payment_gateway_name = "Card";
                                                        }

                                                        var provider_detail = {};
                                                        var user_detail = {};

                                                        if (user_data) {
                                                            user_detail = {
                                                                first_name: user_data.first_name,
                                                                last_name: user_data.last_name,
                                                                image_url: user_data.image_url,
                                                            }
                                                        }

                                                        if (provider_data) {
                                                            provider_detail = {
                                                                first_name: provider_data.first_name,
                                                                last_name: provider_data.last_name,
                                                                image_url: provider_data.image_url
                                                            }
                                                        }

                                                        orders[0].cart_detail = cart;
                                                        orders[0].order_payment_detail = order_payment;
                                                        orders[0].request_detail = request_data;
                                                        Review.findOne({_id: order_detail.cart_id}).then((review) => {
                                                                if(review){
                                                                    orders[0].review_detail = review;
                                                                }
                                                                response_data.json({success: true,
                                                                    message: STORE_MESSAGE_CODE.GET_STORE_ORDER_DETAIL_SUCCESSFULLY,
                                                                    currency: currency,
                                                                    user_detail: user_detail,
                                                                    provider_detail: provider_detail,
                                                                    payment_gateway_name: payment_gateway_name,
                                                                    order_list: orders[0]});
                                                        })
                                                            
                                                    }, (error) => {
                                                        console.log(error)
                                                        response_data.json({
                                                            success: false,
                                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                        });
                                                    });
                                                }, (error) => {
                                                    console.log(error)
                                                    response_data.json({
                                                        success: false,
                                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                    });
                                                });

                                            }, (error) => {
                                                console.log(error)
                                                response_data.json({
                                                    success: false,
                                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                });
                                            });
                                        }, (error) => {
                                            console.log(error)
                                            response_data.json({
                                                success: false,
                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                            });
                                        });

                                    }, (error) => {
                                        console.log(error)
                                        response_data.json({
                                            success: false,
                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                        });
                                    });
                                }, (error) => {
                                    console.log(error)
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });

                            } else
                            {
                                response_data.json({success: false, error_code: STORE_ERROR_CODE.ORDER_DETAIL_NOT_FOUND});
                            }

                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    
                
        } else {
            response_data.json(response);
        }
    });
};
exports.logout = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Franchise.findOne({_id: request_data.headers.franchiseid}).then((franchise) => {
                if (franchise)
                {
                    if (request_data.headers.token !== null && franchise.server_token !== request_data.headers.token) {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});

                    } else
                    {
                        franchise.device_token = "";
                        franchise.server_token = "";
                        franchise.save().then(() => {
                            response_data.json({
                                success: true,
                                message: STORE_MESSAGE_CODE.LOGOUT_SUCCESSFULLY
                            });

                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }
                } else
                {
                    response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND});
                }

            }, (error) => {
                console.log(error)
                response_data.json({
                    success: false,
                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                });
            });
        } else {
            response_data.json(response);
        }
    });
};