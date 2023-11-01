require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
require('../../utils/console');
let utils = require('../../utils/utils');
let emails = require('../../controllers/email_sms/emails');
let promo_code_controller = require('../../controllers/user/promo_code');
let wallet_history = require('../../controllers/user/wallet');
let card_stripe = require('../../controllers/user/card');
let mongoose = require('mongoose');
let Product = require('mongoose').model('product');
let User = require('mongoose').model('user');
let Card = require('mongoose').model('card');
let Country = require('mongoose').model('country');
let Provider = require('mongoose').model('provider');
let Store = require('mongoose').model('store');
let City = require('mongoose').model('city');
let Service = require('mongoose').model('service');
let Order = require('mongoose').model('order');
let Payment_gateway = require('mongoose').model('payment_gateway');
let Order_payment = require('mongoose').model('order_payment');
let Promo_code = require('mongoose').model('promo_code');
let Cart = require('mongoose').model('cart');
var DeliverFee = require('mongoose').model('deliver_fee');
let Review = require('mongoose').model('review');
let Referral_code = require('mongoose').model('referral_code');
let Vehicle = require('mongoose').model('vehicle');
let Delivery = require('mongoose').model('delivery');
let PeakHour = require('mongoose').model('peak_hour');
let Advertise = require('mongoose').model('advertise');
let Item = require('mongoose').model('item');
let Request = require('mongoose').model('request');
let geolib = require('geolib');
let console = require('../../utils/console');
const { request } = require('express');
const admin = require('../../../models/admin/admin');
const { match } = require('assert');
const { Console } = require('console');
let ProductGroup = require('mongoose').model('ProductGroup');
let Cancellation_reason = require('mongoose').model('cancellation_reason');
const moment = require('moment');


//To schedule pickup time
exports.check_user_pickup = function (request_data, response_data) 
{
    utils.check_request_params(request_data.body, [{ name: 'order_payment_id', type: 'string' }, { name: 'is_user_pick_up_order' }], function (response) {
        if (response.success) 
        {
            var request_data_body = request_data.body;
            var order_payment_id = request_data_body.order_payment_id;
            var total_cart_price = request_data_body.total_cart_price;
            
            Order_payment.findOne({_id: order_payment_id}).then((payment_id_data) => {

                if (payment_id_data)
                {
                    Order_payment.findOneAndUpdate({_id: order_payment_id}, {is_user_pick_up_order: request_data_body.is_user_pick_up_order}, {new: true}).then((update_user_pickup) => {
                        if (update_user_pickup)
                        {
                            var is_user_pick_up_order = update_user_pickup.is_user_pick_up_order;

                            update_user_pickup.save();

                    if (is_user_pick_up_order === true)
                    {
                        var discount_price = request_data_body.discount_price;
                        var discount_value = total_cart_price*(discount_price/100);
                        var total_value = total_cart_price-discount_value;

                        console.log(total_value);

                        Order_payment.findOneAndUpdate({_id: order_payment_id}, { pickup_time: {from: request_data_body.from, to: request_data_body.to}, discount_price: discount_value, delivery_fee: Number(0), total: total_value, user_pay_payment: total_value, total_store_income: total_value}).then((update_payment) => 
                        {
                            if (update_payment)
                            {
                                update_payment.save();

                                Order_payment.findOne({_id: order_payment_id}).then((order_checkout) => {
                                    response_data.json({ success: true, message: USER_MESSAGE_CODE.FARE_ESTIMATE_SUCCESSFULLY, order_checkout: order_checkout});
                                });
                                    
                            }
                            else
                            {
                                response_data.json({
                                    success: false,
                                    error_code: USER_ERROR_CODE.GET_ORDER_CART_INVOICE_FAILED
                                });
                            }
                        }, 
                        (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    
                    }
                    else if (is_user_pick_up_order === false)
                    {
                        // var delivery_fee = request_data_body.delivery_fee;    

                        var final_delivery_fee = 0;
                        var total_cart_price_found = false;
                        
                        if(total_cart_price == null || total_cart_price == "" || total_cart_price == 0)
                        {
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        }
                        else
                        {
                            DeliverFee.find({}, function(err, posts)
                            {
                                if(err)
                                {
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                }
                                else 
                                {
                                    console.log(posts);
                                    var delivery_data = posts[0];
                                    var delivery_id = delivery_data._id;
                                    var delivery_fee = delivery_data.delivery_fee;
                    
                                    const between = (x, min, max) => {
                                        return x >= min && x <= max;
                                    }
                    
                                    var delivery_high = 0;
                                    
                                    delivery_fee.forEach(element => 
                                    {
                                        if(parseInt(element.fee)>delivery_high)
                                        {
                                            delivery_high = parseInt(element.fee);
                                        }
                                        if(total_cart_price >= parseInt(element.from) && total_cart_price <= parseInt(element.to))
                                        {
                                            total_cart_price_found = true;
                                            // console.log("Final delivery fee: "+element.fee)
                                            final_delivery_fee = parseInt(element.fee);
                                        }
                                    });
                                    if(!total_cart_price_found)
                                    {
                                        final_delivery_fee = 0;
                                    }
                                    console.log(final_delivery_fee);
                                
                           
                                var total_value = parseInt(total_cart_price) + final_delivery_fee;
                                console.log(total_value);

                                Order_payment.findOneAndUpdate({_id: order_payment_id}, {total_delivery_price: final_delivery_fee, total_service_price: final_delivery_fee, total: total_value, user_pay_payment: total_value, total_store_income: total_value, discount_price: 0, pickup_time: []}, {new: true} ).then((update_delivery_fee) => 
                                {
                                    if (update_delivery_fee)
                                    {
                                        var delivery_fee = update_delivery_fee.delivery_fee;

                                        update_delivery_fee.save();

                                        Order_payment.findOne({_id: order_payment_id}).then((order_checkout) => {
                                            response_data.json({ success: true, message: USER_MESSAGE_CODE.FARE_ESTIMATE_SUCCESSFULLY, order_checkout: order_checkout});
                                        });
                                    }
                                    else
                                    {
                                        response_data.json({
                                            success: false,
                                            error_code: USER_ERROR_CODE.GET_ORDER_CART_INVOICE_FAILED
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
                            });
                        }
                    }
                }
                    });
                }
                else
                {
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                }
            
            })
        }
        else 
        {
            response_data.json(response);
        }
    });
}


// USER REGISTER API
exports.user_register = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'email', type: 'string' }/*, { name: 'country_id', type: 'string' }*/, { name: 'phone', type: 'string' },
    { name: 'country_phone_code', type: 'string' }, { name: 'first_name', type: 'string' }], function (response) {
        if (response.success) {
            let request_data_body = request_data.body;
            console.log(request_data_body)
            let social_id = request_data_body.social_id;
            let cart_unique_token = request_data_body.cart_unique_token;
            if (request_data_body.is_email_verified == "true") {
                request_data_body.is_email_verified = true;
            }
            if (request_data_body.is_phone_number_verified == "true") {
                request_data_body.is_phone_number_verified = true;
            }
            if (request_data_body.is_email_verified == "false") {
                request_data_body.is_email_verified = false;
            }
            if (request_data_body.is_phone_number_verified == "false") {
                request_data_body.is_phone_number_verified = false;
            }
            let social_id_array = [];

            if (social_id == undefined || social_id == null || social_id == "") {
                social_id = null;
            } else {
                social_id_array.push(social_id);
            }

            Country.findOne({ country_code: request_data_body.country_code }).then((country) => {
                var country_id = null;
                if (country) {
                    country_id = country._id
                }
                User.findOne({ social_ids: { $all: social_id_array } }).then((user_detail) => {

                    if (user_detail) {
                        response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_ALREADY_REGISTER_WITH_SOCIAL });

                    } else {
                        User.findOne({ email: request_data_body.email }).then((user_detail) => {

                            if (user_detail) {
                                if (social_id != null && user_detail.social_ids.indexOf(social_id) < 0) {
                                    user_detail.social_ids.push(social_id);
                                    user_detail.save();
                                    return response_data.json({
                                        success: true,
                                        message: USER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                        /*minimum_phone_number_length: country.minimum_phone_number_length,
                                        maximum_phone_number_length: country.maximum_phone_number_length,*/
                                        user: user_detail

                                    });
                                } else {
                                    if(request_data_body.is_qr_code_scanned){
                                        return response_data.json({
                                            success: true,
                                            message: USER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                            user: user_detail
                                        });
                                    }
                                    return response_data.json({
                                        success: false,
                                        error_code: USER_ERROR_CODE.EMAIL_ALREADY_REGISTRED
                                    });
                                }
                            } else {
                                User.findOne({ phone: request_data_body.phone }).then((user_detail) => {
                                    if (user_detail) {

                                        if (social_id != null && user_detail.social_ids.indexOf(social_id) < 0) {
                                            user_detail.social_ids.push(social_id);
                                            user_detail.save();
                                            response_data.json({
                                                success: true,
                                                message: USER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                                /*minimum_phone_number_length: country.minimum_phone_number_length,
                                                maximum_phone_number_length: country.maximum_phone_number_length,*/
                                                user: user_detail
                                            });

                                        } else {
                                            if(request_data_body.is_qr_code_scanned){
                                                return response_data.json({
                                                    success: true,
                                                    message: USER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                                    user: user_detail
                                                });
                                            }
                                            return response_data.json({
                                                success: false,
                                                error_code: USER_ERROR_CODE.PHONE_NUMBER_ALREADY_REGISTRED
                                            });
                                        }

                                    } else {

                                        let first_name = utils.get_string_with_first_letter_upper_case(request_data_body.first_name);
                                        let last_name = utils.get_string_with_first_letter_upper_case(request_data_body.last_name);
                                        let city = utils.get_string_with_first_letter_upper_case(request_data_body.city);
                                        let server_token = utils.generateServerToken(32);

                                        let user_data = new User({
                                            user_type: ADMIN_DATA_ID.ADMIN,
                                            admin_type: ADMIN_DATA_ID.USER,
                                            user_type_id: null,
                                            first_name: first_name,
                                            last_name: last_name,
                                            email: ((request_data_body.email).trim()).toLowerCase(),
                                            password: request_data_body.password,
                                            social_ids: social_id_array,
                                            login_by: request_data_body.login_by,
                                            country_phone_code: request_data_body.country_phone_code,
                                            phone: request_data_body.phone,
                                            address: request_data_body.address,
                                            zipcode: request_data_body.zipcode,
                                            country_id: country_id,
                                            country_code: request_data_body.country_code,
                                            city: city,
                                            device_token: request_data_body.device_token,
                                            device_type: request_data_body.device_type,
                                            app_version: request_data_body.app_version,
                                            is_email_verified: request_data_body.is_email_verified,
                                            is_phone_number_verified: request_data_body.is_phone_number_verified,
                                            server_token: server_token,
                                        });

                                        let image_file = request_data.files;
                                        if (image_file != undefined && image_file.length > 0) {
                                            let image_name = user_data._id + utils.generateServerToken(4);
                                            let url = utils.getStoreImageFolderPath(FOLDER_NAME.USER_PROFILES) + image_name + FILE_EXTENSION.USER;
                                            user_data.image_url = url;
                                            utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.USER, FOLDER_NAME.USER_PROFILES);

                                        }

                                        if (social_id == undefined || social_id == null || social_id == "") {
                                            user_data.password = utils.encryptPassword(request_data_body.password);
                                        }

                                        let referral_code_string = utils.generateReferralCode(ADMIN_DATA_ID.ADMIN, request_data_body.currency, first_name, last_name);
                                        user_data.referral_code = referral_code_string;
                                        user_data.wallet_currency_code = request_data_body.currency;

                                        // Start Apply Referral //
                                        //if (request_data_body.referral_code != "") {
                                        User.findOne({ referral_code: request_data_body.referral_code }).then((user) => {
                                            if (user && country) {

                                                let referral_bonus_to_user = country.referral_bonus_to_user;
                                                let referral_bonus_to_user_friend = country.referral_bonus_to_user_friend;
                                                let user_refferal_count = user.total_referrals;
                                                if (user_refferal_count < country.no_of_user_use_referral) {
                                                    user.total_referrals = +user.total_referrals + 1;

                                                    let wallet_information = { referral_code: referral_code_string, user_friend_id: user_data._id };
                                                    let total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.USER, user.unique_id, user._id, user.country_id, country.currency_code, country.currency_code,
                                                        1, referral_bonus_to_user, user.wallet, WALLET_STATUS_ID.ADD_WALLET_AMOUNT, WALLET_COMMENT_ID.ADDED_BY_REFERRAL, "Using Refferal : " + request_data_body.referral_code, wallet_information);


                                                    // Entry in wallet Table //
                                                    user.wallet = total_wallet_amount;
                                                    user.save();
                                                    user_data.is_referral = true;
                                                    user_data.referred_by = user._id;

                                                    // Entry in wallet Table //
                                                    wallet_information = { referral_code: referral_code_string, user_friend_id: user._id };
                                                    let new_total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.USER, user_data.unique_id, user_data._id, user_data.country_id, country.currency_code, country.currency_code,
                                                        1, referral_bonus_to_user_friend, user_data.wallet, WALLET_STATUS_ID.ADD_WALLET_AMOUNT, WALLET_COMMENT_ID.ADDED_BY_REFERRAL, "Using Refferal : " + request_data_body.referral_code, wallet_information);

                                                    user_data.wallet = new_total_wallet_amount;
                                                    //user_data.save();

                                                    // Entry in referral_code Table //
                                                    let referral_code = new Referral_code({
                                                        user_type: ADMIN_DATA_ID.USER,
                                                        user_id: user._id,
                                                        user_unique_id: user.unique_id,
                                                        user_referral_code: user.referral_code,
                                                        referred_id: user_data._id,
                                                        referred_unique_id: user_data.unique_id,
                                                        country_id: user_data.country_id,
                                                        current_rate: 1,
                                                        referral_bonus_to_user_friend: referral_bonus_to_user_friend,
                                                        referral_bonus_to_user: referral_bonus_to_user,
                                                        currency_sign: country.currency_sign
                                                    });

                                                    utils.getCurrencyConvertRate(1, country.currency_code, setting_detail.admin_currency_code, function (response) {

                                                        if (response.success) {
                                                            referral_code.current_rate = response.current_rate;
                                                        } else {
                                                            referral_code.current_rate = 1;
                                                        }
                                                        referral_code.save();

                                                    });

                                                }
                                            }
                                            utils.insert_documets_for_new_users(user_data, null, ADMIN_DATA_ID.USER, country_id, function (document_response) {

                                                Cart.findOne({ cart_unique_token: cart_unique_token }).then((cart) => {
                                                    user_data.is_document_uploaded = document_response.is_document_uploaded;
                                                    if (cart) {
                                                        cart.user_id = user_data._id;
                                                        cart.cart_unique_token = "";
                                                        cart.save();
                                                        user_data.cart_id = cart._id;
                                                    }
                                                    user_data.save().then((user) => {
                                                        let admin = fireUser
                                                        // utils.create_user(user, ADMIN_DATA_ID.USER, response => {
                                                        //     if (response.success) {

                                                        // user.uid = response.user.uid
                                                        user.save().then(user_details => {
                                                            utils.create_user_token(user, ADMIN_DATA_ID.USER, response => {
                                                                user_details.firebase_token = response.user_token
                                                                user_details.save()
                                                                if (response.success) {
                                                                    if (setting_detail.is_mail_notification) {
                                                                        emails.sendUserRegisterEmail(request_data, user_data, user_data.first_name + " " + user_data.last_name);
                                                                    }
                                                                    response_data.json({
                                                                        success: true,
                                                                        message: USER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                                                        /*minimum_phone_number_length: country.minimum_phone_number_length,
                                                                        maximum_phone_number_length: country.maximum_phone_number_length,*/
                                                                        user: user_data,
                                                                        firebase_token: response.user_token
                                                                    });
                                                                } else {
                                                                    console.log(error)
                                                                    response_data.json({
                                                                        success: true,
                                                                        message: USER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                                                        /*minimum_phone_number_length: country.minimum_phone_number_length,
                                                                        maximum_phone_number_length: country.maximum_phone_number_length,*/
                                                                        user: user_data,
                                                                        firebase_token: ''
                                                                    });
                                                                }
                                                            })
                                                            //     }).catch(error => {
                                                            //         response_data.json({
                                                            //             success: false,
                                                            //             error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                            //         });
                                                            //     })
                                                            // } else {
                                                            //     response_data.json({
                                                            //         success: false,
                                                            //         error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                            //     });
                                                            // }
                                                        })

                                                    }, (error) => {
                                                        console.log(error)
                                                        response_data.json({
                                                            success: false,
                                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                        //}

                                        // End Apply Referral //

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

//USER LOGIN API 
exports.user_login = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [{ name: 'email', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let email = ((request_data_body.email).trim()).toLowerCase();
            let social_id = request_data_body.social_id;
            let cart_unique_token = request_data_body.cart_unique_token;
            if (!email) {
                email = null
            }
            let encrypted_password = request_data_body.password;
            if (social_id == undefined || social_id == null || social_id == "") {
                social_id = "";
            }
            if (encrypted_password == undefined || encrypted_password == null || encrypted_password == "") {
                encrypted_password = "";
            } else {
                encrypted_password = utils.encryptPassword(encrypted_password);
            }
            let query = { $or: [{ 'email': email }, { 'phone': email }, { social_ids: { $all: [social_id] } }] };

            if (encrypted_password || social_id) {
                User.findOne(query).then((user_detail) => {
                    if (social_id == undefined || social_id == null || social_id == "") {
                        social_id = null;
                    }
                    if ((social_id == null && email == "")) {
                        response_data.json({ success: false, error_code: USER_ERROR_CODE.LOGIN_FAILED });
                    } else if (user_detail) {
                        if (social_id == null && encrypted_password != "" && encrypted_password != user_detail.password) {
                            response_data.json({ success: false, error_code: USER_ERROR_CODE.INVALID_PASSWORD });
                        } else if (social_id != null && user_detail.social_ids.indexOf(social_id) < 0) {
                            response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_NOT_REGISTER_WITH_SOCIAL });
                        } else {
                            //Country.findOne({ country_code: user_detail.country_code }).then((country) => {
                            let server_token = utils.generateServerToken(32);
                            user_detail.server_token = server_token;
                            let device_token = "";
                            let device_type = "";
                            if (user_detail.device_token != "" && user_detail.device_token != request_data_body.device_token) {
                                device_token = user_detail.device_token;
                                device_type = user_detail.device_type;
                            }
                            user_detail.device_token = request_data_body.device_token;
                            user_detail.device_type = request_data_body.device_type;
                            user_detail.login_by = request_data_body.login_by;
                            user_detail.app_version = request_data_body.app_version;
                            user_detail.social_id = social_id;
                            // user_detail.save().then(user => {

                            Cart.findOne({ cart_unique_token: cart_unique_token }).then((cart) => {

                                if (cart) {
                                    cart.user_id = user_detail._id;
                                    cart.user_type_id = user_detail._id;
                                    cart.cart_unique_token = "";
                                    cart.save();

                                    user_detail.cart_id = cart._id;
                                    user_detail.save()
                                }
                            });

                            // if (user_detail.uid) {

                            utils.create_user_token(user_detail, ADMIN_DATA_ID.USER, response => {
                                if (response.success) {
                                    if (device_token != "") {
                                        utils.sendPushNotification(ADMIN_DATA_ID.USER, device_type, device_token, USER_PUSH_CODE.LOGIN_IN_OTHER_DEVICE, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                    }
                                    user_detail.firebase_token = response.user_token;
                                    user_detail.save().then(user => {
                                        response_data.json({
                                            success: true,
                                            message: USER_MESSAGE_CODE.LOGIN_SUCCESSFULLY,
                                            /*minimum_phone_number_length: country.minimum_phone_number_length,
                                            maximum_phone_number_length: country.maximum_phone_number_length,*/
                                            user: user_detail,
                                            firebase_token: response.user_token
                                        })
                                    }).catch(error => {
                                        console.log(error)
                                        response_data.json({
                                            success: false,
                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                        })
                                    })
                                } else {
                                    console.log('99')
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    })
                                }
                            })
                            // } else {
                            //     utils.create_user(user_detail, ADMIN_DATA_ID.USER, response => {
                            //         if (response.success) {
                            //             user_detail.uid = response.user.uid
                            //             utils.create_user_token(user_detail, ADMIN_DATA_ID.USER, response => {
                            //                 if (response.success) {
                            //                     if (device_token != "") {
                            //                         utils.sendPushNotification(ADMIN_DATA_ID.USER, device_type, device_token, USER_PUSH_CODE.LOGIN_IN_OTHER_DEVICE, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                            //                     }
                            //                     user_detail.firebase_token = response.user_token;
                            //                     user_detail.save().then(user => {
                            //                         response_data.json({
                            //                             success: true,
                            //                             message: USER_MESSAGE_CODE.LOGIN_SUCCESSFULLY,
                            //                             /*minimum_phone_number_length: country.minimum_phone_number_length,
                            //                             maximum_phone_number_length: country.maximum_phone_number_length,*/
                            //                             user: user_detail,
                            //                             firebase_token: response.user_token
                            //                         })
                            //                     }).catch(error => {
                            //                         console.log(error)
                            //                         response_data.json({
                            //                             success: false,
                            //                             error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            //                         })
                            //                     })
                            //                 } else {
                            //                     console.log('1')
                            //                     response_data.json({
                            //                         success: false,
                            //                         error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            //                     })
                            //                 }
                            //             })
                            //         } else {
                            //             console.log('2')
                            //             response_data.json({
                            //                 success: false,
                            //                 error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            //             })
                            //         }
                            //     })
                            // }

                            // }, (error) => {
                            //     console.log(error)
                            //     response_data.json({
                            //         success: false,
                            //         error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            //     });
                            // });
                            //});
                        }
                    } else {
                        response_data.json({ success: false, error_code: USER_ERROR_CODE.NOT_A_REGISTERED });
                    }
                }, (error) => {
                    console.log(error)
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                });
            } else {
                response_data.json({ success: false, error_code: USER_ERROR_CODE.LOGIN_FAILED });
            }
        } else {
            response_data.json(response);
        }
    });
};

// USER UPDATE PROFILE DETAILS
exports.user_update = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let user_id = request_data_body.user_id;
            let old_password = request_data_body.old_password;
            let social_id = request_data_body.social_id;
            let user_email_update = false

            if (social_id == undefined || social_id == null || social_id == 'null' || social_id == "") {
                social_id = null;
            }
            if (old_password == undefined || old_password == null || old_password == "") {
                old_password = "";
            } else {
                old_password = utils.encryptPassword(old_password);
            }
            User.findOne({ _id: user_id }).then((user) => {
                if (user) {
                    if (request_data_body.server_token !== null && user.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: USER_ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else if (social_id == null && old_password != "" && old_password != user.password) {
                        response_data.json({ success: false, error_code: USER_ERROR_CODE.INVALID_PASSWORD });
                    } else if (social_id != null && user.social_ids.indexOf(social_id) < 0) {
                        response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_NOT_REGISTER_WITH_SOCIAL });
                    } else {
                        //Country.findOne({ country_code: user.country_code }).then((country) => {
                        let new_email = request_data_body.email;
                        let new_phone = request_data_body.phone;
                        console.log(new_email)
                        console.log(user.email)
                        if (new_email !== user.email) {
                            user_email_update = true
                        }
                        console.log(new_email !== user.email)

                        if (request_data_body.new_password != "") {
                            let new_password = utils.encryptPassword(request_data_body.new_password);
                            request_data_body.password = new_password;
                        }
                        request_data_body.social_ids = user.social_ids;
                        User.findOne({ _id: { '$ne': user_id }, email: new_email }).then((user_details) => {
                            let is_update = false;
                            if (user_details) {
                                if (setting_detail.is_user_mail_verification && (request_data_body.is_email_verified != null || request_data_body.is_email_verified != undefined)) {
                                    is_update = true;
                                    user_details.email = "notverified" + user_details.email;
                                    user_details.is_email_verified = false;
                                    user_details.save();
                                } else if (user_email_update) {
                                    is_update = true
                                }
                            } else if (user_email_update) {
                                is_update = true
                            } else {
                                is_update = true;
                            }

                            if (is_update) {
                                is_update = false;
                                User.findOne({
                                    _id: { '$ne': user_id },
                                    phone: new_phone
                                }).then((user_phone_details) => {

                                    if (user_phone_details) {
                                        if (setting_detail.is_user_sms_verification && (request_data_body.is_phone_number_verified != null || request_data_body.is_phone_number_verified != undefined)) {

                                            is_update = true;
                                            user_phone_details.phone = "00" + user_phone_details.phone;
                                            user_phone_details.is_phone_number_verified = false;
                                            user_phone_details.save();

                                        }
                                    } else {
                                        is_update = true;
                                    }
                                    if (is_update == true) {
                                        let social_id_array = [];
                                        if (social_id != null) {
                                            social_id_array.push(social_id);
                                        }
                                        let user_update_query = { $or: [{ 'password': old_password }, { social_ids: { $all: social_id_array } }] };
                                        user_update_query = { $and: [{ '_id': user_id }, user_update_query] };

                                        User.findOneAndUpdate(user_update_query, request_data_body, { new: true }).then((user_data) => {
                                            if (user_data) {
                                                let image_file = request_data.files;
                                                if (image_file != undefined && image_file.length > 0) {
                                                    utils.deleteImageFromFolder(user_data.image_url, FOLDER_NAME.USER_PROFILES);
                                                    let image_name = user_data._id + utils.generateServerToken(4);
                                                    let url = utils.getStoreImageFolderPath(FOLDER_NAME.USER_PROFILES) + image_name + FILE_EXTENSION.USER;
                                                    utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.USER, FOLDER_NAME.USER_PROFILES);
                                                    user_data.image_url = url;
                                                }

                                                let first_name = utils.get_string_with_first_letter_upper_case(request_data_body.first_name);
                                                let last_name = utils.get_string_with_first_letter_upper_case(request_data_body.last_name);
                                                user_data.first_name = first_name;
                                                user_data.last_name = last_name;
                                                if (request_data_body.is_phone_number_verified != undefined) {
                                                    user_data.is_phone_number_verified = request_data_body.is_phone_number_verified;
                                                }
                                                if (request_data_body.is_email_verified != undefined) {
                                                    user_data.is_email_verified = request_data_body.is_email_verified;
                                                }

                                                user_data.save().then(user => {
                                                    if (user.uid != "" && user_email_update) {
                                                        let product_type;
                                                        if (SETTINGS_DETAILS === 1) {
                                                            product_type = 'live'
                                                        } else if (SETTINGS_DETAILS === 2) {
                                                            product_type = 'demo'
                                                        } else {
                                                            product_type = 'development'
                                                        }
                                                        fireUser.updateUser(user_data.uid, {
                                                            email: product_type + '_user_' + user_data.email
                                                        }).then(user => {
                                                            response_data.json({
                                                                success: true, message: USER_MESSAGE_CODE.UPDATE_SUCCESSFULLY,
                                                                //minimum_phone_number_length: country.minimum_phone_number_length,
                                                                //maximum_phone_number_length: country.maximum_phone_number_length,
                                                                user: user_data,
                                                                firebase_token: user_data.firebase_token
                                                            });

                                                        }).catch(error => {
                                                            console.log(error)
                                                            response_data.json({
                                                                success: false,
                                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                            });
                                                        })
                                                    } else {
                                                        response_data.json({
                                                            success: true, message: USER_MESSAGE_CODE.UPDATE_SUCCESSFULLY,
                                                            user: user_data,
                                                            firebase_token: user_data.firebase_token
                                                        })
                                                    }
                                                }, (error) => {
                                                    console.log(error)
                                                    response_data.json({
                                                        success: false,
                                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                    });
                                                });
                                            } else {
                                                response_data.json({
                                                    success: false,
                                                    error_code: USER_ERROR_CODE.UPDATE_FAILED
                                                });
                                            }
                                        });
                                    } else {
                                        response_data.json({
                                            success: false,
                                            error_code: USER_ERROR_CODE.PHONE_NUMBER_ALREADY_REGISTRED
                                        });
                                    }
                                });
                            } else {
                                response_data.json({ success: false, error_code: USER_ERROR_CODE.EMAIL_ALREADY_REGISTRED });
                            }
                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });

                        /*}, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });*/
                    }
                } else {
                    response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND });
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

// GET USER DETAILS 
exports.get_detail = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            User.findOne({ _id: request_data_body.user_id }).then((user) => {
                if (user) {
                    if (request_data_body.server_token !== null && user.server_token != request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {
                        //Country.findOne({ _id: user.country_id }).then((country) => {
                        user.app_version = request_data_body.app_version;
                        if (request_data_body.device_token != undefined) {
                            user.device_token = request_data_body.device_token;
                        }
                        user.save().then(() => {
                            response_data.json({
                                success: true,
                                message: USER_MESSAGE_CODE.GET_DETAIL_SUCCESSFULLY,
                                //minimum_phone_number_length: country.minimum_phone_number_length,
                                //maximum_phone_number_length: country.maximum_phone_number_length,
                                user: user,
                                firebase_token: user.firebase_token
                            });
                        }).catch(error => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });

                        })
                        /*}, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });*/
                    }

                } else {
                    response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND });
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

// UPDATE USER DEVICE TOKEN
exports.update_device_token = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [{ name: 'device_token', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            User.findOne({ _id: request_data_body.user_id }).then((user) => {
                if (user) {
                    if (request_data_body.server_token !== null && user.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {
                        user.device_token = request_data_body.device_token;
                        user.save().then(() => {
                            response_data.json({
                                success: true,
                                message: USER_MESSAGE_CODE.DEVICE_TOKEN_UPDATE_SUCCESSFULLY
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
                    response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND });
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

// AFTER EMAIL PHONE VERIFICATION CALL API
exports.user_otp_verification = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            User.findOne({ _id: request_data_body.user_id }).then((user) => {
                if (user) {
                    if (request_data_body.server_token !== null && user.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });

                    } else {

                        if (request_data_body.is_phone_number_verified != undefined) {
                            user.is_phone_number_verified = request_data_body.is_phone_number_verified;
                            if (user.phone != request_data_body.phone) {
                                User.findOne({ phone: request_data_body.phone }).then((user_phone_detail) => {
                                    if (user_phone_detail) {
                                        user_phone_detail.phone = utils.getNewPhoneNumberFromOldNumber(user_phone_detail.phone);
                                        user_phone_detail.is_phone_number_verified = false;
                                        user_phone_detail.save();
                                    }

                                });
                                user.phone = request_data_body.phone;
                            }
                        }
                        if (request_data_body.is_email_verified != undefined) {
                            user.is_email_verified = request_data_body.is_email_verified;
                            if (user.email != request_data_body.email) {
                                User.findOne({ email: request_data_body.email }).then((user_email_detail) => {
                                    if (user_email_detail) {
                                        user_email_detail.email = "notverified" + user_email_detail.email;
                                        user_email_detail.is_email_verified = false;
                                        user_email_detail.save();
                                    }
                                });
                                user.email = request_data_body.email;
                            }
                        }

                        user.save().then(() => {
                            response_data.json({
                                success: true,
                                message: USER_MESSAGE_CODE.OTP_VERIFICATION_SUCCESSFULLY
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
                    response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND });
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

// USER LOGOUT
exports.logout = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            User.findOne({ _id: request_data_body.user_id }).then((user) => {
                if (user) {
                    if (request_data_body.server_token !== null && user.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {
                        user.device_token = "";
                        user.server_token = "";
                        user.save().then(() => {
                            response_data.json({
                                success: true,
                                message: USER_MESSAGE_CODE.LOGOUT_SUCCESSFULLY
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
                    response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND });
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

// GET DELIVERY LIST OF CITY, pass CITY NAME - LAT LONG
exports.get_delivery_list_for_nearest_city = function (request_data, response_data) {
    // console.log('get_delivery_list_for_nearest_city')
    utils.check_request_params(request_data.body, [{ name: 'country', type: 'string' }, { name: 'latitude' }, { name: 'longitude' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let country = request_data_body.country;
            let server_time = new Date();
            let country_code = request_data_body.country_code;
            let country_code_2 = request_data_body.country_code_2;

            Country.findOne({ $and: [{ $or: [{ country_name: country }, { country_code: country_code }, { country_code_2: country_code_2 }] }, { is_business: true }] }).then((country_data) => {

                if (!country_data) {
                    response_data.json({ success: false, error_code: COUNTRY_ERROR_CODE.BUSINESS_NOT_IN_YOUR_COUNTRY });
                } else {

                    let city_lat_long = [request_data_body.latitude, request_data_body.longitude];
                    let country_id = country_data._id;
                    City.find({ country_id: country_id, is_business: true }).then((cityList) => {

                        let size = cityList.length;
                        let count = 0;
                        if (size == 0) {
                            response_data.json({ success: false, error_code: CITY_ERROR_CODE.BUSINESS_NOT_IN_YOUR_CITY });
                        } else {
                            let finalCityId = null;
                            let finalDistance = 1000000;

                            cityList.forEach(function (city_detail) {
                                count++;
                                if (city_detail.is_use_radius) {
                                    let cityLatLong = city_detail.city_lat_long;
                                    let distanceFromSubAdminCity = utils.getDistanceFromTwoLocation(city_lat_long, cityLatLong);
                                    let cityRadius = city_detail.city_radius;

                                    if (distanceFromSubAdminCity < cityRadius) {
                                        if (distanceFromSubAdminCity < finalDistance) {
                                            finalDistance = distanceFromSubAdminCity;
                                            finalCityId = city_detail._id;
                                        }
                                    }

                                } else {
                                    let store_zone = false;
                                    if (city_detail.city_locations && city_detail.city_locations.length > 0) {
                                        store_zone = geolib.isPointInPolygon(
                                            { latitude: city_lat_long[0], longitude: city_lat_long[1] },
                                            city_detail.city_locations);
                                    }
                                    if (store_zone) {
                                        finalCityId = city_detail._id;
                                        count = size;
                                    }
                                }


                                if (count == size) {
                                    if (finalCityId != null) {
                                        let city_id = finalCityId;

                                        let cityid_condition = { $match: { '_id': { $eq: city_id } } };

                                        City.aggregate([cityid_condition]).then((city) => {
                                            if (city.length == 0) {
                                                response_data.json({
                                                    success: false,
                                                    error_code: DELIVERY_ERROR_CODE.DELIVERY_DATA_NOT_FOUND_IN_YOUR_CITY
                                                });
                                            } else {
                                                if (city[0].is_business) {

                                                    if (!request_data_body.is_courier) {
                                                        let ads = [];
                                                        let condition = { "$match": { $and: [{ "_id": { $in: city[0].deliveries_in_city } }, { is_business: { $eq: true } }] } };

                                                        let project = {
                                                            $project:
                                                            {
                                                                delivery_name: { $ifNull: [{ $arrayElemAt: ["$delivery_name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$delivery_name", 0] }, ""] }] },
                                                                description: { $ifNull: [{ $arrayElemAt: ["$description", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$description", 0] }, ""] }] },
                                                                image_url: 1,
                                                                icon_url: 1,
                                                                map_pin_url: 1,
                                                                delivery_type: 1,
                                                                is_business: 1,
                                                                is_store_can_create_group: 1,
                                                                sequence_number: 1,
                                                                famous_products_tags: 1,
                                                                unique_id: 1,
                                                                is_provide_table_booking: 1
                                                            }
                                                        }
                                                        let array_to_json_famous_products_tags_detail = {
                                                            $unwind: {
                                                                path: "$famous_products_tags",
                                                                preserveNullAndEmptyArrays: true
                                                            }
                                                        };
                                                        let group = {
                                                            $group:
                                                            {
                                                                _id: '$_id',
                                                                is_provide_table_booking: { $first: '$is_provide_table_booking' },
                                                                delivery_name: { $first: '$delivery_name' },
                                                                description: { $first: '$description' },
                                                                image_url: { $first: '$image_url' },
                                                                icon_url: { $first: '$icon_url' },
                                                                map_pin_url: { $first: '$map_pin_url' },
                                                                delivery_type: { $first: '$delivery_type' },
                                                                is_business: { $first: '$is_business' },
                                                                is_store_can_create_group: { $first: '$is_store_can_create_group' },
                                                                sequence_number: { $first: '$sequence_number' },
                                                                famous_products_tags: { $addToSet: { $ifNull: [{ $arrayElemAt: ["$famous_products_tags", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$famous_products_tags", 0] }, "$famous_products_tags"] }] } },
                                                                unique_id: { $first: '$unique_id' }
                                                            }
                                                        }
                                                        let sort = { "$sort": {} };
                                                        sort["$sort"]['sequence_number'] = parseInt(1);
                                                        Delivery.aggregate([condition, sort, project, array_to_json_famous_products_tags_detail, group, sort], function (error, delivery) {
                                                            console.log(error);
                                                            if (delivery && delivery.length == 0) {
                                                                response_data.json({
                                                                    success: false,
                                                                    error_code: DELIVERY_ERROR_CODE.DELIVERY_DATA_NOT_FOUND_IN_YOUR_CITY
                                                                });
                                                            } else {

                                                                let condition = {
                                                                    $match: {
                                                                        $and: [{ country_id: { $eq: country_id } }, { ads_for: { $eq: ADS_TYPE.FOR_DELIVERY_LIST } },
                                                                        { is_ads_visible: { $eq: true } }, { is_ads_approve_by_admin: { $eq: true } }, { $or: [{ city_id: { $eq: city[0]._id } }, { city_id: { $eq: mongoose.Types.ObjectId(ID_FOR_ALL.ALL_ID) } }] }]
                                                                    }
                                                                }
                                                                let store_query = {
                                                                    $lookup:
                                                                    {
                                                                        from: "stores",
                                                                        localField: "store_id",
                                                                        foreignField: "_id",
                                                                        as: "store_detail"
                                                                    }
                                                                };
                                                                let array_to_json_store_detail = {
                                                                    $unwind: {
                                                                        path: "$store_detail",
                                                                        preserveNullAndEmptyArrays: true
                                                                    }
                                                                };

                                                                let store_condition = { $match: { $or: [{ 'is_ads_redirect_to_store': { $eq: false } }, { $and: [{ 'is_ads_redirect_to_store': { $eq: true } }, { 'store_detail.is_approved': { $eq: true } }, { 'store_detail.is_business': { $eq: true } }] }] } }

                                                                let project = {
                                                                    $project: {
                                                                        _id: '$_id',
                                                                        ads_detail: 1,
                                                                        store_id: 1,
                                                                        image_url: 1,
                                                                        is_ads_redirect_to_store: 1,
                                                                        is_ads_have_expiry_date: 1,
                                                                        image_for_banner: 1,
                                                                        image_for_mobile: 1,
                                                                        expiry_date: 1,
                                                                        "store_detail": {
                                                                            $cond: {
                                                                                if: { $ifNull: ["$store_detail", false] }, then: {
                                                                                    "_id": "store_detail._id",
                                                                                    "languages_supported": "$store_detail.languages_supported",
                                                                                    "is_use_item_tax": "$store_detail.is_use_item_tax",
                                                                                    "item_tax": "$store_detail.item_tax",
                                                                                    "is_provide_pickup_delivery": "$store_detail.is_provide_pickup_delivery",
                                                                                    "delivery_time_max": "$store_detail.delivery_time_max",
                                                                                    "delivery_radius": "$store_detail.delivery_radius",
                                                                                    "is_taking_schedule_order": "$store_detail.is_taking_schedule_order",
                                                                                    "is_store_busy": "$store_detail.is_store_busy",
                                                                                    "famous_products_tags": "$store_detail.famous_products_tags",
                                                                                    "currency": "$store_detail.currency",
                                                                                    "delivery_time": "$store_detail.delivery_time",
                                                                                    "price_rating": "$store_detail.price_rating",
                                                                                    "country_phone_code": "$store_detail.country_phone_code",
                                                                                    "user_rate": "$store_detail.user_rate",
                                                                                    "store_time": "$store_detail.store_time",
                                                                                    "email": "$store_detail.email",
                                                                                    "address": "$store_detail.address",
                                                                                    "image_url": "$store_detail.image_url",
                                                                                    "user_rate_count": "$store_detail.user_rate_count",
                                                                                    "website_url": "$store_detail.website_url",
                                                                                    "phone": "$store_detail.phone",
                                                                                    "_id": "$store_detail._id",
                                                                                    "slogan": "$store_detail.slogan",
                                                                                    "store_delivery_type_id": "$store_detail.store_delivery_id",
                                                                                    "location": "$store_detail.location",
                                                                                    "name": { $ifNull: [{ $arrayElemAt: ["$store_detail.name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$store_detail.name", 0] }, ""] }] }
                                                                                }, else: null
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                                Advertise.aggregate([condition, store_query, array_to_json_store_detail, store_condition, project], function (error, advertise) {
                                                                    console.log(error);
                                                                    if (city[0] && city[0].is_ads_visible && country_data && country_data.is_ads_visible) {
                                                                        ads = advertise;
                                                                    }

                                                                    let lang_code = request_data.headers.lang;
                                                                    // let index = delivery.length - 1

                                                                    response_data.json({
                                                                        success: true,
                                                                        message: DELIVERY_MESSAGE_CODE.DELIVERY_LIST_FOR_NEAREST_CITY_SUCCESSFULLY,
                                                                        city: city[0],
                                                                        deliveries: delivery,
                                                                        ads: ads,
                                                                        is_allow_contactless_delivery: false,
                                                                        is_allow_pickup_order_verification: false,
                                                                        city_data: request_data_body,
                                                                        currency_code: country_data.currency_code,
                                                                        is_distance_unit_mile: country_data.is_distance_unit_mile,
                                                                        country_id: country_data._id,
                                                                        currency_sign: country_data.currency_sign,
                                                                        server_time: server_time
                                                                    });


                                                                });
                                                            }
                                                        })
                                                    } else {

                                                        let lang_code = request_data.headers.lang;
                                                        let index = delivery.length - 1
                                                        delivery.forEach((delivery_data, delivery_data_index) => {
                                                            if (!delivery_data.delivery_name[lang_code] || delivery_data.delivery_name[lang_code] == '') {
                                                                delivery_data.delivery_name = delivery_data.delivery_name['en'];
                                                            } else {
                                                                delivery_data.delivery_name = delivery_data.delivery_name[lang_code];
                                                            }

                                                            if (delivery_data_index == index) {

                                                                response_data.json({
                                                                    success: true,
                                                                    message: DELIVERY_MESSAGE_CODE.DELIVERY_LIST_FOR_NEAREST_CITY_SUCCESSFULLY,
                                                                    city: city[0],
                                                                    is_allow_contactless_delivery: setting_detail.is_allow_contactless_delivery,
                                                                    is_allow_pickup_order_verification: setting_detail.is_allow_pickup_order_verification,
                                                                    city_data: request_data_body,
                                                                    currency_code: country_data.currency_code,
                                                                    currency_sign: country_data.currency_sign,
                                                                    country_id: country_data._id,
                                                                    server_time: server_time
                                                                });
                                                            }
                                                        })
                                                    }
                                                } else {
                                                    response_data.json({
                                                        success: false,
                                                        error_code: DELIVERY_ERROR_CODE.DELIVERY_DATA_NOT_FOUND_IN_YOUR_CITY
                                                    });
                                                }
                                            }
                                        }, (error) => {
                                            console.log(error)
                                            response_data.json({
                                                success: false,
                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                            });
                                        });

                                    } else {
                                        response_data.json({
                                            success: false,
                                            error_code: CITY_ERROR_CODE.BUSINESS_NOT_IN_YOUR_CITY
                                        });
                                    }
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
        } else {
            response_data.json(response);
        }
    });
};

// GET STORE LIST AFTER CLICK ON DELIVERIES
exports.get_store_list = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [{ name: 'city_id', type: 'string' }, { name: 'store_delivery_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let Schema = mongoose.Types.ObjectId;
            let server_time = new Date();
            let city_id = request_data_body.city_id;
            let store_delivery_id = request_data_body.store_delivery_id;
            let ads = [];
            let lookup = {
                $lookup: {
                    from: "stores",
                    localField: "store_id",
                    foreignField: "_id",
                    as: "store_detail"
                }
            };
            let unwind = {
                $unwind: {
                    path: "$store_detail",
                    preserveNullAndEmptyArrays: true
                }
            };
            let city_lookup = {
                $lookup: {
                    from: "cities",
                    localField: "city_id",
                    foreignField: "_id",
                    as: "city_detail"
                }
            }
            let city_condition = {
                "$match": {
                    $and: [
                        { $or: [{ city_id: { $eq: mongoose.Types.ObjectId(request_data_body.city_id) } }, { city_id: { $eq: mongoose.Types.ObjectId(ID_FOR_ALL.ALL_ID) } }] },
                        { country_id: { $eq: "$city_detail.country_id" } }
                    ]
                }
            };
            let project = {
                $project: {
                    _id: '$_id',
                    ads_detail: 1,
                    store_id: 1,
                    image_url: 1,
                    is_ads_redirect_to_store: 1,
                    is_ads_have_expiry_date: 1,
                    image_for_banner: 1,
                    image_for_mobile: 1,
                    expiry_date: 1,
                    "store_detail": {
                        $cond: {
                            if: { $ifNull: ["$store_detail", false] }, then: {
                                "_id": "store_detail._id",
                                "languages_supported": "$store_detail.languages_supported",
                                "is_use_item_tax": "$store_detail.is_use_item_tax",
                                "item_tax": "$store_detail.item_tax",
                                "is_provide_pickup_delivery": "$store_detail.is_provide_pickup_delivery",
                                "delivery_time_max": "$store_detail.delivery_time_max",
                                "delivery_radius": "$store_detail.delivery_radius",
                                "is_taking_schedule_order": "$store_detail.is_taking_schedule_order",
                                "is_store_busy": "$store_detail.is_store_busy",
                                "famous_products_tags": "$store_detail.famous_products_tags",
                                "currency": "$store_detail.currency",
                                "delivery_time": "$store_detail.delivery_time",
                                "price_rating": "$store_detail.price_rating",
                                "country_phone_code": "$store_detail.country_phone_code",
                                "user_rate": "$store_detail.user_rate",
                                "store_time": "$store_detail.store_time",
                                "email": "$store_detail.email",
                                "address": "$store_detail.address",
                                "image_url": "$store_detail.image_url",
                                "user_rate_count": "$store_detail.user_rate_count",
                                "website_url": "$store_detail.website_url",
                                "phone": "$store_detail.phone",
                                "_id": "$store_detail._id",
                                "slogan": "$store_detail.slogan",
                                "store_delivery_type_id": "$store_detail.store_delivery_id",
                                "location": "$store_detail.location",
                                "name": { $ifNull: [{ $arrayElemAt: ["$store_detail.name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$store_detail.name", 0] }, ""] }] }
                            }, else: null
                        }
                    }
                }
            }

            let page;
            let perPage;

            if (request_data_body.page && request_data_body.perPage) {
                page = Number(request_data_body.page)
                perPage = Number(request_data_body.perPage)
            }




            let ads_condition = { "$match": { $and: [{ "ads_for": { $eq: ADS_TYPE.STORE_LIST } }, { is_ads_visible: { $eq: true } }, { is_ads_approve_by_admin: { $eq: true } }] } };
            Advertise.aggregate([city_lookup, city_condition, ads_condition, lookup, unwind, project]).then((advertise) => {

                City.findOne({ _id: city_id }).then((city) => {

                    if (city) {
                        let city_lat_long = city.city_lat_long;

                        if (request_data_body.latitude && request_data_body.longitude) {
                            city_lat_long = [request_data_body.latitude, request_data_body.longitude]
                        }

                        let distance = city.city_radius / UNIT.DEGREE_TO_KM;

                        Country.findOne({ _id: city.country_id }).then((country) => {

                            if (city && city.is_ads_visible && country && country.is_ads_visible) {
                                ads = advertise;
                            }

                            let store_location_query = {
                                $geoNear: {
                                    near: city_lat_long,
                                    distanceField: "distance",
                                    uniqueDocs: true,
                                    maxDistance: 100000000
                                }
                            }

                            let store_aggregate = [store_location_query, {
                                $match: {
                                    $and: [
                                        { "is_approved": { "$eq": true } },
                                        { "is_business": { "$eq": true } },
                                        { "is_visible": { "$eq": true } },
                                        { "city_id": { $eq: Schema(city_id) } },
                                        { "store_delivery_id": { $eq: Schema(store_delivery_id) } }
                                    ]
                                }
                            },
                                {
                                    $lookup:
                                    {
                                        from: "items",
                                        localField: "_id",
                                        foreignField: "store_id",
                                        as: "item_detail"
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "table_settings",
                                        localField: "_id",
                                        foreignField: "store_id",
                                        as: "table_settings_details"
                                    }
                                },

                                {
                                    $unwind: {
                                        path: "$table_settings_details",
                                        preserveNullAndEmptyArrays: true
                                    }
                                },
                                {
                                    $group: {
                                        _id: '$_id',
                                        name: { $first: { $ifNull: [{ $arrayElemAt: ["$name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$name", 0] }, ""] }] } },
                                        image_url: { $first: '$image_url' },
                                        delivery_time: { $first: '$delivery_time' },
                                        delivery_time_max: { $first: '$delivery_time_max' },
                                        user_rate: { $first: '$user_rate' },
                                        user_rate_count: { $first: '$user_rate_count' },
                                        delivery_radius: { $first: '$delivery_radius' },
                                        is_provide_delivery_anywhere: { $first: '$is_provide_delivery_anywhere' },
                                        website_url: { $first: '$website_url' },
                                        slogan: { $first: '$slogan' },
                                        is_visible: { $first: '$is_visible' },
                                        is_store_busy: { $first: '$is_store_busy' },
                                        phone: { $first: '$phone' },
                                        item_tax: { $first: '$item_tax' },
                                        is_use_item_tax: { $first: '$is_use_item_tax' },
                                        country_phone_code: { $first: '$country_phone_code' },
                                        famous_products_tags: { $first: '$famous_products_tags' },
                                        store_time: { $first: '$store_time' },
                                        location: { $first: '$location' },
                                        address: { $first: '$address' },
                                        is_taking_schedule_order: { $first: '$is_taking_schedule_order' },
                                        is_order_cancellation_charge_apply: { $first: '$is_order_cancellation_charge_apply' },

                                        is_store_pay_delivery_fees: { $first: '$is_store_pay_delivery_fees' },
                                        branchio_url: { $first: '$branchio_url' },
                                        referral_code: { $first: '$referral_code' },
                                        price_rating: { $first: '$price_rating' },
                                        languages_supported: { $first: '$languages_supported' },
                                        items: { $first: '$item_detail.name' },
                                        distance: { $first: '$distance' },
                                        table_settings_details: { $first: "$table_settings_details" }
                                    }
                                },
                                { $unwind: "$items" },
                                {
                                    $project: {
                                        _id: 1,
                                        name: 1,
                                        image_url: 1,
                                        delivery_time: 1,
                                        delivery_time_max: 1,
                                        user_rate: 1,
                                        user_rate_count: 1,
                                        delivery_radius: 1,
                                        is_provide_delivery_anywhere: 1,
                                        website_url: 1,
                                        slogan: 1,
                                        is_visible: 1,
                                        is_store_busy: 1,
                                        phone: 1,
                                        item_tax: 1,
                                        is_use_item_tax: 1,
                                        country_phone_code: 1,
                                        famous_products_tags: 1,
                                        store_time: 1,
                                        location: 1,
                                        address: 1,
                                        is_taking_schedule_order: 1,
                                        is_order_cancellation_charge_apply: 1,

                                        is_store_pay_delivery_fees: 1,
                                        branchio_url: 1,
                                        referral_code: 1,
                                        languages_supported: 1,
                                        price_rating: 1,
                                        items: { $ifNull: [{ $arrayElemAt: ["$items", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$items", 0] }, ""] }] },
                                        distance: 1,
                                        table_settings_details: 1
                                    }
                                },
                                {
                                    $group: {
                                        _id: '$_id',
                                        name: { $first: '$name' },
                                        image_url: { $first: '$image_url' },
                                        delivery_time: { $first: '$delivery_time' },
                                        delivery_time_max: { $first: '$delivery_time_max' },
                                        user_rate: { $first: '$user_rate' },
                                        user_rate_count: { $first: '$user_rate_count' },
                                        delivery_radius: { $first: '$delivery_radius' },
                                        is_provide_delivery_anywhere: { $first: '$is_provide_delivery_anywhere' },
                                        website_url: { $first: '$website_url' },
                                        slogan: { $first: '$slogan' },
                                        is_visible: { $first: '$is_visible' },
                                        is_store_busy: { $first: '$is_store_busy' },
                                        phone: { $first: '$phone' },
                                        item_tax: { $first: '$item_tax' },
                                        is_use_item_tax: { $first: '$is_use_item_tax' },
                                        country_phone_code: { $first: '$country_phone_code' },
                                        famous_products_tags: { $first: '$famous_products_tags' },
                                        store_time: { $first: '$store_time' },
                                        location: { $first: '$location' },
                                        address: { $first: '$address' },
                                        is_taking_schedule_order: { $first: '$is_taking_schedule_order' },
                                        is_order_cancellation_charge_apply: { $first: '$is_order_cancellation_charge_apply' },

                                        is_store_pay_delivery_fees: { $first: '$is_store_pay_delivery_fees' },
                                        branchio_url: { $first: '$branchio_url' },
                                        referral_code: { $first: '$referral_code' },
                                        languages_supported: { $first: '$languages_supported' },
                                        price_rating: { $first: '$price_rating' },
                                        distance: { $first: '$distance' },
                                        items: { $addToSet: "$items" },
                                        is_table_reservation_with_order: { $first: "$table_settings_details.is_table_reservation_with_order" },
                                        is_table_reservation: { $first: "$table_settings_details.is_table_reservation" }
                                    }
                                },
                                {
                                    $sort: { distance: 1 }
                                },
                                {
                                    $group: {
                                        _id: null,
                                        count: { $sum: 1 },
                                        results: {
                                            $push: '$$ROOT'
                                        }
                                    }
                                }
                            ];

                            if (page && perPage) {
                                store_aggregate.push({
                                    $project: {
                                        _id: 0,
                                        count: 1,
                                        results: {
                                            $slice: ['$results', page ? (page - 1) * perPage : 0, perPage]
                                        }
                                    }
                                })
                            }


                            Store.aggregate(store_aggregate).then((stores) => {

                                if (stores.length == 0) {
                                    response_data.json({ success: false, error_code: USER_ERROR_CODE.STORE_LIST_NOT_FOUND });
                                } else {
                                    stores.forEach(function (store_detail) {
                                    });
                                    response_data.json({
                                        success: true,
                                        message: USER_MESSAGE_CODE.GET_STORE_LIST_SUCCESSFULLY,
                                        server_time: server_time,
                                        ads: ads,
                                        stores: stores[0],
                                        city_name: city.city_name
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

exports.get_delivery_store_list = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [{ name: 'city_id', type: 'string' }, { name: 'store_delivery_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let Schema = mongoose.Types.ObjectId;
            let server_time = new Date();
            let city_id = request_data_body.city_id;
            let store_delivery_id = request_data_body.store_delivery_id;
            let ads = [];
            City.findOne({ _id: request_data_body.city_id }).then((city) => {

                if (city) {

                    let lookup = {
                        $lookup: {
                            from: "stores",
                            localField: "store_id",
                            foreignField: "_id",
                            as: "store_detail"
                        }
                    };
                    let unwind = {
                        $unwind: {
                            path: "$store_detail",
                            preserveNullAndEmptyArrays: true
                        }
                    };
                    let city_condition = {
                        "$match": {
                            $and: [
                                { $or: [{ city_id: { $eq: mongoose.Types.ObjectId(request_data_body.city_id) } }, { city_id: { $eq: mongoose.Types.ObjectId(ID_FOR_ALL.ALL_ID) } }] },
                                { country_id: { $eq: mongoose.Types.ObjectId(city.country_id) } }
                            ]
                        }
                    };
                    let project = {
                        $project: {
                            _id: '$_id',
                            ads_detail: 1,
                            store_id: 1,
                            image_url: 1,
                            is_ads_redirect_to_store: 1,
                            is_ads_have_expiry_date: 1,
                            image_for_banner: 1,
                            image_for_mobile: 1,
                            expiry_date: 1,
                            "store_detail": {
                                $cond: {
                                    if: { $ifNull: ["$store_detail", false] }, then: {
                                        "_id": "store_detail._id",
                                        "languages_supported": "$store_detail.languages_supported",
                                        "is_use_item_tax": "$store_detail.is_use_item_tax",
                                        "is_tax_included": "$store_detail.is_tax_included",
                                        "item_tax": "$store_detail.item_tax",
                                        "is_provide_pickup_delivery": "$store_detail.is_provide_pickup_delivery",
                                        "delivery_time_max": "$store_detail.delivery_time_max",
                                        "delivery_radius": "$store_detail.delivery_radius",
                                        "is_taking_schedule_order": "$store_detail.is_taking_schedule_order",
                                        "is_store_busy": "$store_detail.is_store_busy",
                                        "famous_products_tags": "$store_detail.famous_products_tags",
                                        "currency": "$store_detail.currency",
                                        "delivery_time": "$store_detail.delivery_time",
                                        "price_rating": "$store_detail.price_rating",
                                        "country_phone_code": "$store_detail.country_phone_code",
                                        "user_rate": "$store_detail.user_rate",
                                        "store_time": "$store_detail.store_time",
                                        "store_delivery_time": "$store_detail.store_delivery_time",
                                        "email": "$store_detail.email",
                                        "address": "$store_detail.address",
                                        "image_url": "$store_detail.image_url",
                                        "user_rate_count": "$store_detail.user_rate_count",
                                        "website_url": "$store_detail.website_url",
                                        "phone": "$store_detail.phone",
                                        "_id": "$store_detail._id",
                                        "slogan": "$store_detail.slogan",
                                        "store_delivery_type_id": "$store_detail.store_delivery_id",
                                        "location": "$store_detail.location",
                                        "name": { $ifNull: [{ $arrayElemAt: ["$store_detail.name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$store_detail.name", 0] }, ""] }] }
                                    }, else: null
                                }
                            }
                        }
                    }

                    let page = 0;
                    let perPage;

                    if (request_data_body.per_page) {
                        page = Number(request_data_body.page)
                        perPage = Number(request_data_body.per_page)
                    }

                    let ads_condition = { "$match": { $and: [{ "ads_for": { $eq: ADS_TYPE.STORE_LIST } }, { is_ads_visible: { $eq: true } }, { is_ads_approve_by_admin: { $eq: true } }] } };
                    Advertise.aggregate([city_condition, ads_condition, lookup, unwind, project]).then((advertise) => {


                        let city_lat_long = city.city_lat_long;

                        if (request_data_body.latitude && request_data_body.longitude) {
                            city_lat_long = [request_data_body.latitude, request_data_body.longitude]
                        }

                        let distance = city.city_radius / UNIT.DEGREE_TO_KM;

                        Country.findOne({ _id: city.country_id }).then((country) => {

                            if (city && city.is_ads_visible && country && country.is_ads_visible) {
                                ads = advertise;
                            }

                            let store_location_query = {
                                $geoNear: {
                                    near: city_lat_long,
                                    distanceField: "distance",
                                    uniqueDocs: true,
                                    maxDistance: 100000000
                                }
                            }

                            let store_aggregate = [store_location_query, {
                                $match: {
                                    $and: [
                                        { "is_approved": { "$eq": true } },
                                        { "is_business": { "$eq": true } },
                                        { "is_visible": { "$eq": true } },
                                        { "city_id": { $eq: Schema(city_id) } },
                                        { "store_delivery_id": { $eq: Schema(store_delivery_id) } }
                                    ]
                                }
                            },
                                {
                                    $lookup:
                                    {
                                        from: "items",
                                        localField: "_id",
                                        foreignField: "store_id",
                                        as: "item_detail"
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "table_settings",
                                        localField: "_id",
                                        foreignField: "store_id",
                                        as: "table_settings_details"
                                    }
                                },
                                {
                                    $unwind: {
                                        path: "$table_settings_details",
                                        preserveNullAndEmptyArrays: true
                                    }
                                },
                                {
                                    $group: {
                                        _id: '$_id',
                                        name: { $first: { $ifNull: [{ $arrayElemAt: ["$name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$name", 0] }, ""] }] } },
                                        image_url: { $first: '$image_url' },
                                        delivery_time: { $first: '$delivery_time' },
                                        delivery_time_max: { $first: '$delivery_time_max' },
                                        user_rate: { $first: '$user_rate' },
                                        user_rate_count: { $first: '$user_rate_count' },
                                        delivery_radius: { $first: '$delivery_radius' },
                                        is_provide_delivery_anywhere: { $first: '$is_provide_delivery_anywhere' },
                                        is_provide_pickup_delivery: { $first: '$is_provide_pickup_delivery' },
                                        website_url: { $first: '$website_url' },
                                        slogan: { $first: '$slogan' },
                                        is_visible: { $first: '$is_visible' },
                                        is_store_busy: { $first: '$is_store_busy' },
                                        phone: { $first: '$phone' },
                                        item_tax: { $first: '$item_tax' },
                                        is_use_item_tax: { $first: '$is_use_item_tax' },
                                        country_phone_code: { $first: '$country_phone_code' },
                                        famous_products_tags: { $first: '$famous_products_tags' },
                                        store_time: { $first: '$store_time' },
                                        store_delivery_time: { $first: '$store_delivery_time' },
                                        location: { $first: '$location' },
                                        address: { $first: '$address' },
                                        is_taking_schedule_order: { $first: '$is_taking_schedule_order' },
                                        is_order_cancellation_charge_apply: { $first: '$is_order_cancellation_charge_apply' },
                                        is_store_pay_delivery_fees: { $first: '$is_store_pay_delivery_fees' },
                                        branchio_url: { $first: '$branchio_url' },
                                        referral_code: { $first: '$referral_code' },
                                        price_rating: { $first: '$price_rating' },
                                        languages_supported: { $first: '$languages_supported' },
                                        items: { $first: '$item_detail.name' },
                                        distance: { $first: '$distance' },
                                        table_settings_details: { $first: "$table_settings_details" }
                                    }
                                },
                                { $unwind: "$items" },
                                {
                                    $project: {
                                        _id: 1,
                                        name: 1,
                                        image_url: 1,
                                        delivery_time: 1,
                                        delivery_time_max: 1,
                                        user_rate: 1,
                                        user_rate_count: 1,
                                        delivery_radius: 1,
                                        is_provide_delivery_anywhere: 1,
                                        is_provide_pickup_delivery: 1,
                                        website_url: 1,
                                        slogan: 1,
                                        is_visible: 1,
                                        is_store_busy: 1,
                                        phone: 1,
                                        item_tax: 1,
                                        is_use_item_tax: 1,
                                        country_phone_code: 1,
                                        famous_products_tags: 1,
                                        store_time: 1,
                                        store_delivery_time: 1,
                                        location: 1,
                                        address: 1,
                                        is_taking_schedule_order: 1,
                                        is_order_cancellation_charge_apply: 1,
                                        is_store_pay_delivery_fees: 1,
                                        branchio_url: 1,
                                        referral_code: 1,
                                        languages_supported: 1,
                                        price_rating: 1,
                                        items: { $ifNull: [{ $arrayElemAt: ["$items", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$items", 0] }, ""] }] },
                                        distance: 1,
                                        table_settings_details: 1,
                                        is_table_reservation_with_order: { $ifNull: ["$table_settings_details.is_table_reservation_with_order", false] },
                                        is_table_reservation: { $ifNull: ["$table_settings_details.is_table_reservation", false] }
                                    }
                                },
                                {
                                    $group: {
                                        _id: '$_id',
                                        name: { $first: '$name' },
                                        image_url: { $first: '$image_url' },
                                        delivery_time: { $first: '$delivery_time' },
                                        delivery_time_max: { $first: '$delivery_time_max' },
                                        user_rate: { $first: '$user_rate' },
                                        user_rate_count: { $first: '$user_rate_count' },
                                        delivery_radius: { $first: '$delivery_radius' },
                                        is_provide_delivery_anywhere: { $first: '$is_provide_delivery_anywhere' },
                                        website_url: { $first: '$website_url' },
                                        slogan: { $first: '$slogan' },
                                        is_visible: { $first: '$is_visible' },
                                        is_store_busy: { $first: '$is_store_busy' },
                                        phone: { $first: '$phone' },
                                        item_tax: { $first: '$item_tax' },
                                        is_use_item_tax: { $first: '$is_use_item_tax' },
                                        country_phone_code: { $first: '$country_phone_code' },
                                        famous_products_tags: { $first: '$famous_products_tags' },
                                        store_time: { $first: '$store_time' },
                                        store_delivery_time: { $first: '$store_delivery_time' },
                                        location: { $first: '$location' },
                                        address: { $first: '$address' },
                                        is_taking_schedule_order: { $first: '$is_taking_schedule_order' },
                                        is_order_cancellation_charge_apply: { $first: '$is_order_cancellation_charge_apply' },
                                        is_provide_pickup_delivery: { $first: '$is_provide_pickup_delivery' },
                                        is_store_pay_delivery_fees: { $first: '$is_store_pay_delivery_fees' },
                                        branchio_url: { $first: '$branchio_url' },
                                        referral_code: { $first: '$referral_code' },
                                        languages_supported: { $first: '$languages_supported' },
                                        price_rating: { $first: '$price_rating' },
                                        distance: { $first: '$distance' },
                                        items: { $addToSet: "$items" },
                                        is_table_reservation_with_order: { $first: "$is_table_reservation_with_order" },
                                        is_table_reservation: { $first: "$is_table_reservation" }
                                    }
                                },
                                {
                                    $sort: { distance: 1 }
                                },
                                {
                                    $group: {
                                        _id: null,
                                        count: { $sum: 1 },
                                        results: {
                                            $push: '$$ROOT'
                                        }
                                    }
                                }
                            ];

                            if (perPage) {
                                store_aggregate.push({
                                    $project: {
                                        _id: 0,
                                        count: 1,
                                        results: {
                                            $slice: ['$results', page ? (page - 1) * perPage : 0, perPage]
                                        }
                                    }
                                })
                            }

                            Store.aggregate(store_aggregate).then((stores) => {

                                if (stores.length == 0) {
                                    response_data.json({ success: false, error_code: USER_ERROR_CODE.STORE_LIST_NOT_FOUND });
                                } else {
                                    response_data.json({
                                        success: true,
                                        message: USER_MESSAGE_CODE.GET_STORE_LIST_SUCCESSFULLY,
                                        server_time: server_time,
                                        ads: ads,
                                        currency_sign: country.currency_sign,
                                        stores: stores[0],
                                        city_name: city.city_name
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


                        // }, (error) => {
                        //     console.log(error)
                        //     response_data.json({
                        //         success: false,
                        //         error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        //     });
                        // });

                    }, (error) => {
                        console.log(error)
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        });
                    });
                }
            }, error => {
                console.log(error)
                response_data.json({
                    success: false,
                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                });
            })
        } else {
            response_data.json(response);
        }
    });
};

//To get store list using sub category id and city id
exports.get_subcategory_store_list = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [{ name: 'city_id', type: 'string' }, { name: 'sub_category_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let Schema = mongoose.Types.ObjectId;
            let server_time = new Date();
            let city_id = request_data_body.city_id;
            let sub_category_id = request_data_body.sub_category_id;
            let ads = [];
            City.findOne({ _id: request_data_body.city_id }).then((city) => {

                if (city) 
                {
                    let lookup = {
                        $lookup: {
                            from: "stores",
                            localField: "sub_category_id",
                            foreignField: "_id",
                            as: "store_detail"
                        }
                    };
                    let unwind = {
                        $unwind: {
                            path: "$store_detail",
                            preserveNullAndEmptyArrays: true
                        }
                    };
                    let city_condition = {
                        "$match": {
                            $and: [
                                { $or: [{ city_id: { $eq: mongoose.Types.ObjectId(request_data_body.city_id) } }, { city_id: { $eq: mongoose.Types.ObjectId(ID_FOR_ALL.ALL_ID) } }] },
                                { country_id: { $eq: mongoose.Types.ObjectId(city.country_id) } }
                            ]
                        }
                    };
                    let project = {
                        $project: {
                            _id: '$_id',
                            ads_detail: 1,
                            store_id: 1,
                            image_url: 1,
                            is_ads_redirect_to_store: 1,
                            is_ads_have_expiry_date: 1,
                            image_for_banner: 1,
                            image_for_mobile: 1,
                            expiry_date: 1,
                            "store_detail": {
                                $cond: {
                                    if: { $ifNull: ["$store_detail", false] }, then: {
                                        "_id": "store_detail._id",
                                        "languages_supported": "$store_detail.languages_supported",
                                        "is_use_item_tax": "$store_detail.is_use_item_tax",
                                        "is_tax_included": "$store_detail.is_tax_included",
                                        "item_tax": "$store_detail.item_tax",
                                        "is_provide_pickup_delivery": "$store_detail.is_provide_pickup_delivery",
                                        "delivery_time_max": "$store_detail.delivery_time_max",
                                        "delivery_radius": "$store_detail.delivery_radius",
                                        "is_taking_schedule_order": "$store_detail.is_taking_schedule_order",
                                        "is_store_busy": "$store_detail.is_store_busy",
                                        "famous_products_tags": "$store_detail.famous_products_tags",
                                        "currency": "$store_detail.currency",
                                        "delivery_time": "$store_detail.delivery_time",
                                        "price_rating": "$store_detail.price_rating",
                                        "country_phone_code": "$store_detail.country_phone_code",
                                        "user_rate": "$store_detail.user_rate",
                                        "store_time": "$store_detail.store_time",
                                        "store_delivery_time": "$store_detail.store_delivery_time",
                                        "email": "$store_detail.email",
                                        "address": "$store_detail.address",
                                        "image_url": "$store_detail.image_url",
                                        "user_rate_count": "$store_detail.user_rate_count",
                                        "website_url": "$store_detail.website_url",
                                        "phone": "$store_detail.phone",
                                        "_id": "$store_detail._id",
                                        "slogan": "$store_detail.slogan",
                                        "store_delivery_type_id": "$store_detail.sub_category_id",
                                        "location": "$store_detail.location",
                                        "name": { $ifNull: [{ $arrayElemAt: ["$store_detail.name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$store_detail.name", 0] }, ""] }] }
                                    }, else: null
                                }
                            }
                        }
                    }

                    let page = 0;
                    let perPage;

                    if (request_data_body.per_page) {
                        page = Number(request_data_body.page)
                        perPage = Number(request_data_body.per_page)
                    }

                    let ads_condition = { "$match": { $and: [{ "ads_for": { $eq: ADS_TYPE.STORE_LIST } }, { is_ads_visible: { $eq: true } }, { is_ads_approve_by_admin: { $eq: true } }] } };
                    Advertise.aggregate([city_condition, ads_condition, lookup, unwind, project]).then((advertise) => {


                        let city_lat_long = city.city_lat_long;

                        if (request_data_body.latitude && request_data_body.longitude) {
                            city_lat_long = [request_data_body.latitude, request_data_body.longitude]
                        }

                        let distance = city.city_radius / UNIT.DEGREE_TO_KM;

                        Country.findOne({ _id: city.country_id }).then((country) => {

                            if (city && city.is_ads_visible && country && country.is_ads_visible) {
                                ads = advertise;
                            }

                            let store_location_query = {
                                $geoNear: {
                                    near: city_lat_long,
                                    distanceField: "distance",
                                    uniqueDocs: true,
                                    maxDistance: 100000000
                                }
                            }

                            let store_aggregate = [store_location_query, {
                                $match: {
                                    $and: [
                                        { "is_approved": { "$eq": true } },
                                        { "is_business": { "$eq": true } },
                                        { "is_visible": { "$eq": true } },
                                        { "city_id": { $eq: Schema(city_id) } },
                                        { "sub_category_id": { $eq: Schema(sub_category_id) } }
                                    ]
                                }
                            },
                                {
                                    $lookup:
                                    {
                                        from: "items",
                                        localField: "_id",
                                        foreignField: "store_id",
                                        as: "item_detail"
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "table_settings",
                                        localField: "_id",
                                        foreignField: "store_id",
                                        as: "table_settings_details"
                                    }
                                },
                                {
                                    $unwind: {
                                        path: "$table_settings_details",
                                        preserveNullAndEmptyArrays: true
                                    }
                                },
                                {
                                    $group: {
                                        _id: '$_id',
                                        name: { $first: { $ifNull: [{ $arrayElemAt: ["$name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$name", 0] }, ""] }] } },
                                        image_url: { $first: '$image_url' },
                                        delivery_time: { $first: '$delivery_time' },
                                        delivery_time_max: { $first: '$delivery_time_max' },
                                        user_rate: { $first: '$user_rate' },
                                        user_rate_count: { $first: '$user_rate_count' },
                                        delivery_radius: { $first: '$delivery_radius' },
                                        is_provide_delivery_anywhere: { $first: '$is_provide_delivery_anywhere' },
                                        is_provide_pickup_delivery: { $first: '$is_provide_pickup_delivery' },
                                        website_url: { $first: '$website_url' },
                                        slogan: { $first: '$slogan' },
                                        is_visible: { $first: '$is_visible' },
                                        is_store_busy: { $first: '$is_store_busy' },
                                        phone: { $first: '$phone' },
                                        item_tax: { $first: '$item_tax' },
                                        is_use_item_tax: { $first: '$is_use_item_tax' },
                                        country_phone_code: { $first: '$country_phone_code' },
                                        famous_products_tags: { $first: '$famous_products_tags' },
                                        store_time: { $first: '$store_time' },
                                        store_delivery_time: { $first: '$store_delivery_time' },
                                        location: { $first: '$location' },
                                        address: { $first: '$address' },
                                        is_taking_schedule_order: { $first: '$is_taking_schedule_order' },
                                        is_order_cancellation_charge_apply: { $first: '$is_order_cancellation_charge_apply' },
                                        is_store_pay_delivery_fees: { $first: '$is_store_pay_delivery_fees' },
                                        branchio_url: { $first: '$branchio_url' },
                                        referral_code: { $first: '$referral_code' },
                                        price_rating: { $first: '$price_rating' },
                                        languages_supported: { $first: '$languages_supported' },
                                        items: { $first: '$item_detail.name' },
                                        distance: { $first: '$distance' },
                                        table_settings_details: { $first: "$table_settings_details" }
                                    }
                                },
                                { $unwind: "$items" },
                                {
                                    $project: {
                                        _id: 1,
                                        name: 1,
                                        image_url: 1,
                                        delivery_time: 1,
                                        delivery_time_max: 1,
                                        user_rate: 1,
                                        user_rate_count: 1,
                                        delivery_radius: 1,
                                        is_provide_delivery_anywhere: 1,
                                        is_provide_pickup_delivery: 1,
                                        website_url: 1,
                                        slogan: 1,
                                        is_visible: 1,
                                        is_store_busy: 1,
                                        phone: 1,
                                        item_tax: 1,
                                        is_use_item_tax: 1,
                                        country_phone_code: 1,
                                        famous_products_tags: 1,
                                        store_time: 1,
                                        store_delivery_time: 1,
                                        location: 1,
                                        address: 1,
                                        is_taking_schedule_order: 1,
                                        is_order_cancellation_charge_apply: 1,
                                        is_store_pay_delivery_fees: 1,
                                        branchio_url: 1,
                                        referral_code: 1,
                                        languages_supported: 1,
                                        price_rating: 1,
                                        items: { $ifNull: [{ $arrayElemAt: ["$items", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$items", 0] }, ""] }] },
                                        distance: 1,
                                        table_settings_details: 1,
                                        is_table_reservation_with_order: { $ifNull: ["$table_settings_details.is_table_reservation_with_order", false] },
                                        is_table_reservation: { $ifNull: ["$table_settings_details.is_table_reservation", false] }
                                    }
                                },
                                {
                                    $group: {
                                        _id: '$_id',
                                        name: { $first: '$name' },
                                        image_url: { $first: '$image_url' },
                                        delivery_time: { $first: '$delivery_time' },
                                        delivery_time_max: { $first: '$delivery_time_max' },
                                        user_rate: { $first: '$user_rate' },
                                        user_rate_count: { $first: '$user_rate_count' },
                                        delivery_radius: { $first: '$delivery_radius' },
                                        is_provide_delivery_anywhere: { $first: '$is_provide_delivery_anywhere' },
                                        website_url: { $first: '$website_url' },
                                        slogan: { $first: '$slogan' },
                                        is_visible: { $first: '$is_visible' },
                                        is_store_busy: { $first: '$is_store_busy' },
                                        phone: { $first: '$phone' },
                                        item_tax: { $first: '$item_tax' },
                                        is_use_item_tax: { $first: '$is_use_item_tax' },
                                        country_phone_code: { $first: '$country_phone_code' },
                                        famous_products_tags: { $first: '$famous_products_tags' },
                                        store_time: { $first: '$store_time' },
                                        store_delivery_time: { $first: '$store_delivery_time' },
                                        location: { $first: '$location' },
                                        address: { $first: '$address' },
                                        is_taking_schedule_order: { $first: '$is_taking_schedule_order' },
                                        is_order_cancellation_charge_apply: { $first: '$is_order_cancellation_charge_apply' },
                                        is_provide_pickup_delivery: { $first: '$is_provide_pickup_delivery' },
                                        is_store_pay_delivery_fees: { $first: '$is_store_pay_delivery_fees' },
                                        branchio_url: { $first: '$branchio_url' },
                                        referral_code: { $first: '$referral_code' },
                                        languages_supported: { $first: '$languages_supported' },
                                        price_rating: { $first: '$price_rating' },
                                        distance: { $first: '$distance' },
                                        items: { $addToSet: "$items" },
                                        is_table_reservation_with_order: { $first: "$is_table_reservation_with_order" },
                                        is_table_reservation: { $first: "$is_table_reservation" }
                                    }
                                },
                                {
                                    $sort: { distance: 1 }
                                },
                                {
                                    $group: {
                                        _id: null,
                                        count: { $sum: 1 },
                                        results: {
                                            $push: '$$ROOT'
                                        }
                                    }
                                }
                            ];

                            if (perPage) {
                                store_aggregate.push({
                                    $project: {
                                        _id: 0,
                                        count: 1,
                                        results: {
                                            $slice: ['$results', page ? (page - 1) * perPage : 0, perPage]
                                        }
                                    }
                                })
                            }

                            Store.aggregate(store_aggregate).then((stores) => {

                                if (stores.length == 0) {
                                    response_data.json({ success: false, error_code: USER_ERROR_CODE.STORE_LIST_NOT_FOUND });
                                } else {
                                    response_data.json({
                                        success: true,
                                        message: USER_MESSAGE_CODE.GET_STORE_LIST_SUCCESSFULLY,
                                        server_time: server_time,
                                        ads: ads,
                                        currency_sign: country.currency_sign,
                                        stores: stores[0],
                                        city_name: city.city_name
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


                        // }, (error) => {
                        //     console.log(error)
                        //     response_data.json({
                        //         success: false,
                        //         error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        //     });
                        // });

                    }, (error) => {
                        console.log(error)
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        });
                    });
                }
            }, error => {
                console.log(error)
                response_data.json({
                    success: false,
                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                });
            })
        } else {
            response_data.json(response);
        }
    });
};


//To get store list using sub category id and city id in angular website
exports.get_subcategory_store_list_web = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [{ name: 'city_id', type: 'string' }, { name: 'sub_category_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let Schema = mongoose.Types.ObjectId;
            let server_time = new Date();
            let city_id = request_data_body.city_id;
            let sub_category_id = request_data_body.sub_category_id;
            let ads = [];
            City.findOne({ _id: request_data_body.city_id }).then((city) => {

                if (city) 
                {
                    let lookup = {
                        $lookup: {
                            from: "stores",
                            localField: "sub_category_id",
                            foreignField: "_id",
                            as: "store_detail"
                        }
                    };
                    let unwind = {
                        $unwind: {
                            path: "$store_detail",
                            preserveNullAndEmptyArrays: true
                        }
                    };
                    let city_condition = {
                        "$match": {
                            $and: [
                                { $or: [{ city_id: { $eq: mongoose.Types.ObjectId(request_data_body.city_id) } }, { city_id: { $eq: mongoose.Types.ObjectId(ID_FOR_ALL.ALL_ID) } }] },
                                { country_id: { $eq: mongoose.Types.ObjectId(city.country_id) } }
                            ]
                        }
                    };
                    let project = {
                        $project: {
                            _id: '$_id',
                            ads_detail: 1,
                            store_id: 1,
                            image_url: 1,
                            is_ads_redirect_to_store: 1,
                            is_ads_have_expiry_date: 1,
                            image_for_banner: 1,
                            image_for_mobile: 1,
                            expiry_date: 1,
                            "store_detail": {
                                $cond: {
                                    if: { $ifNull: ["$store_detail", false] }, then: {
                                        "_id": "store_detail._id",
                                        "languages_supported": "$store_detail.languages_supported",
                                        "is_use_item_tax": "$store_detail.is_use_item_tax",
                                        "is_tax_included": "$store_detail.is_tax_included",
                                        "item_tax": "$store_detail.item_tax",
                                        "is_provide_pickup_delivery": "$store_detail.is_provide_pickup_delivery",
                                        "delivery_time_max": "$store_detail.delivery_time_max",
                                        "delivery_radius": "$store_detail.delivery_radius",
                                        "is_taking_schedule_order": "$store_detail.is_taking_schedule_order",
                                        "is_store_busy": "$store_detail.is_store_busy",
                                        "famous_products_tags": "$store_detail.famous_products_tags",
                                        "currency": "$store_detail.currency",
                                        "delivery_time": "$store_detail.delivery_time",
                                        "price_rating": "$store_detail.price_rating",
                                        "country_phone_code": "$store_detail.country_phone_code",
                                        "user_rate": "$store_detail.user_rate",
                                        "store_time": "$store_detail.store_time",
                                        "store_delivery_time": "$store_detail.store_delivery_time",
                                        "email": "$store_detail.email",
                                        "address": "$store_detail.address",
                                        "image_url": "$store_detail.image_url",
                                        "user_rate_count": "$store_detail.user_rate_count",
                                        "website_url": "$store_detail.website_url",
                                        "phone": "$store_detail.phone",
                                        "_id": "$store_detail._id",
                                        "slogan": "$store_detail.slogan",
                                        "store_delivery_type_id": "$store_detail.sub_category_id",
                                        "location": "$store_detail.location",
                                        "name": { $ifNull: [{ $arrayElemAt: ["$store_detail.name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$store_detail.name", 0] }, ""] }] }
                                    }, else: null
                                }
                            }
                        }
                    }

                    let page = 0;
                    let perPage;

                    if (request_data_body.per_page) {
                        page = Number(request_data_body.page)
                        perPage = Number(request_data_body.per_page)
                    }

                    let ads_condition = { "$match": { $and: [{ "ads_for": { $eq: ADS_TYPE.STORE_LIST } }, { is_ads_visible: { $eq: true } }, { is_ads_approve_by_admin: { $eq: true } }] } };
                    Advertise.aggregate([city_condition, ads_condition, lookup, unwind, project]).then((advertise) => {


                        let city_lat_long = city.city_lat_long;

                        if (request_data_body.latitude && request_data_body.longitude) {
                            city_lat_long = [request_data_body.latitude, request_data_body.longitude]
                        }

                        let distance = city.city_radius / UNIT.DEGREE_TO_KM;

                        Country.findOne({ _id: city.country_id }).then((country) => {

                            if (city && city.is_ads_visible && country && country.is_ads_visible) {
                                ads = advertise;
                            }

                            let store_location_query = {
                                $geoNear: {
                                    near: city_lat_long,
                                    distanceField: "distance",
                                    uniqueDocs: true,
                                    maxDistance: 100000000
                                }
                            }

                            let store_aggregate = [store_location_query, {
                                $match: {
                                    $and: [
                                        { "is_approved": { "$eq": true } },
                                        { "is_business": { "$eq": true } },
                                        { "is_visible": { "$eq": true } },
                                        { "city_id": { $eq: Schema(city_id) } },
                                        { "sub_category_id": { $eq: Schema(sub_category_id) } }
                                    ]
                                }
                            },
                                {
                                    $lookup:
                                    {
                                        from: "items",
                                        localField: "_id",
                                        foreignField: "store_id",
                                        as: "item_detail"
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "table_settings",
                                        localField: "_id",
                                        foreignField: "store_id",
                                        as: "table_settings_details"
                                    }
                                },
                                {
                                    $unwind: {
                                        path: "$table_settings_details",
                                        preserveNullAndEmptyArrays: true
                                    }
                                },
                                {
                                    $group: {
                                        _id: '$_id',
                                        name: { $first: { $ifNull: [{ $arrayElemAt: ["$name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$name", 0] }, ""] }] } },
                                        image_url: { $first: '$image_url' },
                                        delivery_time: { $first: '$delivery_time' },
                                        delivery_time_max: { $first: '$delivery_time_max' },
                                        user_rate: { $first: '$user_rate' },
                                        user_rate_count: { $first: '$user_rate_count' },
                                        delivery_radius: { $first: '$delivery_radius' },
                                        is_provide_delivery_anywhere: { $first: '$is_provide_delivery_anywhere' },
                                        is_provide_pickup_delivery: { $first: '$is_provide_pickup_delivery' },
                                        website_url: { $first: '$website_url' },
                                        slogan: { $first: '$slogan' },
                                        is_visible: { $first: '$is_visible' },
                                        is_store_busy: { $first: '$is_store_busy' },
                                        phone: { $first: '$phone' },
                                        item_tax: { $first: '$item_tax' },
                                        is_use_item_tax: { $first: '$is_use_item_tax' },
                                        country_phone_code: { $first: '$country_phone_code' },
                                        famous_products_tags: { $first: '$famous_products_tags' },
                                        store_time: { $first: '$store_time' },
                                        store_delivery_time: { $first: '$store_delivery_time' },
                                        location: { $first: '$location' },
                                        address: { $first: '$address' },
                                        is_taking_schedule_order: { $first: '$is_taking_schedule_order' },
                                        is_order_cancellation_charge_apply: { $first: '$is_order_cancellation_charge_apply' },
                                        is_store_pay_delivery_fees: { $first: '$is_store_pay_delivery_fees' },
                                        branchio_url: { $first: '$branchio_url' },
                                        referral_code: { $first: '$referral_code' },
                                        price_rating: { $first: '$price_rating' },
                                        languages_supported: { $first: '$languages_supported' },
                                        items: { $first: '$item_detail.name' },
                                        distance: { $first: '$distance' },
                                        table_settings_details: { $first: "$table_settings_details" }
                                    }
                                },
                                { $unwind: "$items" },
                                {
                                    $project: {
                                        _id: 1,
                                        name: 1,
                                        image_url: 1,
                                        delivery_time: 1,
                                        delivery_time_max: 1,
                                        user_rate: 1,
                                        user_rate_count: 1,
                                        delivery_radius: 1,
                                        is_provide_delivery_anywhere: 1,
                                        is_provide_pickup_delivery: 1,
                                        website_url: 1,
                                        slogan: 1,
                                        is_visible: 1,
                                        is_store_busy: 1,
                                        phone: 1,
                                        item_tax: 1,
                                        is_use_item_tax: 1,
                                        country_phone_code: 1,
                                        famous_products_tags: 1,
                                        store_time: 1,
                                        store_delivery_time: 1,
                                        location: 1,
                                        address: 1,
                                        is_taking_schedule_order: 1,
                                        is_order_cancellation_charge_apply: 1,
                                        is_store_pay_delivery_fees: 1,
                                        branchio_url: 1,
                                        referral_code: 1,
                                        languages_supported: 1,
                                        price_rating: 1,
                                        items: { $ifNull: [{ $arrayElemAt: ["$items", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$items", 0] }, ""] }] },
                                        distance: 1,
                                        table_settings_details: 1,
                                        is_table_reservation_with_order: { $ifNull: ["$table_settings_details.is_table_reservation_with_order", false] },
                                        is_table_reservation: { $ifNull: ["$table_settings_details.is_table_reservation", false] }
                                    }
                                },
                                {
                                    $group: {
                                        _id: '$_id',
                                        name: { $first: '$name' },
                                        image_url: { $first: '$image_url' },
                                        delivery_time: { $first: '$delivery_time' },
                                        delivery_time_max: { $first: '$delivery_time_max' },
                                        user_rate: { $first: '$user_rate' },
                                        user_rate_count: { $first: '$user_rate_count' },
                                        delivery_radius: { $first: '$delivery_radius' },
                                        is_provide_delivery_anywhere: { $first: '$is_provide_delivery_anywhere' },
                                        website_url: { $first: '$website_url' },
                                        slogan: { $first: '$slogan' },
                                        is_visible: { $first: '$is_visible' },
                                        is_store_busy: { $first: '$is_store_busy' },
                                        phone: { $first: '$phone' },
                                        item_tax: { $first: '$item_tax' },
                                        is_use_item_tax: { $first: '$is_use_item_tax' },
                                        country_phone_code: { $first: '$country_phone_code' },
                                        famous_products_tags: { $first: '$famous_products_tags' },
                                        store_time: { $first: '$store_time' },
                                        store_delivery_time: { $first: '$store_delivery_time' },
                                        location: { $first: '$location' },
                                        address: { $first: '$address' },
                                        is_taking_schedule_order: { $first: '$is_taking_schedule_order' },
                                        is_order_cancellation_charge_apply: { $first: '$is_order_cancellation_charge_apply' },
                                        is_provide_pickup_delivery: { $first: '$is_provide_pickup_delivery' },
                                        is_store_pay_delivery_fees: { $first: '$is_store_pay_delivery_fees' },
                                        branchio_url: { $first: '$branchio_url' },
                                        referral_code: { $first: '$referral_code' },
                                        languages_supported: { $first: '$languages_supported' },
                                        price_rating: { $first: '$price_rating' },
                                        distance: { $first: '$distance' },
                                        items: { $addToSet: "$items" },
                                        is_table_reservation_with_order: { $first: "$is_table_reservation_with_order" },
                                        is_table_reservation: { $first: "$is_table_reservation" }
                                    }
                                },
                                {
                                    $sort: { distance: 1 }
                                },
                                {
                                    $group: {
                                        _id: null,
                                        count: { $sum: 1 },
                                        results: {
                                            $push: '$$ROOT'
                                        }
                                    }
                                }
                            ];

                            if (perPage) {
                                store_aggregate.push({
                                    $project: {
                                        _id: 0,
                                        count: 1,
                                        results: {
                                            $slice: ['$results', page ? (page - 1) * perPage : 0, perPage]
                                        }
                                    }
                                })
                            } 

                            Store.aggregate(store_aggregate).then((stores) => {

                                if (stores.length == 0) {
                                    response_data.json({ success: false, error_code: USER_ERROR_CODE.STORE_LIST_NOT_FOUND, nostore:0});
                                } else {
                                    response_data.json({
                                        success: true,
                                        message: USER_MESSAGE_CODE.GET_STORE_LIST_SUCCESSFULLY,
                                        server_time: server_time,
                                        ads: ads,
                                        currency_sign: country.currency_sign,
                                        stores: stores[0],
                                        city_name: city.city_name,
					nostore:1
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


                        // }, (error) => {
                        //     console.log(error)
                        //     response_data.json({
                        //         success: false,
                        //         error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        //     });
                        // });

                    }, (error) => {
                        console.log(error)
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        });
                    });
                }
            }, error => {
                console.log(error)
                response_data.json({
                    success: false,
                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                });
            })
        } else {
            response_data.json(response);
        }
    });
};


// GET STORE PRODUCT ITEM LIST
exports.user_get_store_product_item_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'store_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let store_id = request_data_body.store_id;
            let server_time = new Date();
            let product_ids = [];
            let condition = { "$match": { 'store_id': { $eq: mongoose.Types.ObjectId(store_id) } } };
            let condition2 = {}
            if (request_data_body.product_ids) {
                let Schema = mongoose.Types.ObjectId;
                request_data_body.product_ids.forEach(function (data) {
                    product_ids.push(Schema(data));
                })
                condition2 = { "$match": { '_id': { $in: product_ids } } };
            } else {
                condition2 = { "$match": {} };
            }
            let condition1 = { "$match": { 'is_visible_in_store': { $eq: true } } };

            let query = {
                $match: {
                    _id: { $eq: mongoose.Types.ObjectId(store_id) }
                }
            }

            let tax_lookup = {
                $lookup: {
                    from: "taxes",
                    localField: "taxes",
                    foreignField: "_id",
                    as: "tax_details"
                }
            }

            let table_settings_lookup = {
                $lookup: {
                    from: "table_settings",
                    localField: "_id",
                    foreignField: "store_id",
                    as: "table_settings_details"
                }
            }

            let table_settings_unwind = {
                $unwind: {
                    path: "$table_settings_details",
                    preserveNullAndEmptyArrays: true
                }
            }

            Store.aggregate([query, tax_lookup, table_settings_lookup, table_settings_unwind]).then((store_detail) => {
                let store = store_detail[0]
                if (store) {
                    Country.findOne({ _id: store.country_id }).then((country_data) => {
                        City.findOne({ _id: store.city_id }).then((city_data) => {
                            Delivery.findOne({ _id: store.store_delivery_id }).then((delivery_data) => {
                                let currency = country_data.currency_sign;
                                let maximum_phone_number_length = country_data.maximum_phone_number_length;
                                let minimum_phone_number_length = country_data.minimum_phone_number_length;
                                let timezone = city_data.timezone;
                                let sort = { "$sort": {} };
                                sort["$sort"]['_id.sequence_number'] = parseInt(1);
                                Product.aggregate([condition2, condition, condition1,
                                    {
                                        $lookup:
                                        {
                                            from: "items",
                                            localField: "_id",
                                            foreignField: "product_id",
                                            as: "items"
                                        }
                                    },
                                    { $unwind: "$items" },
                                    {
                                        $lookup:
                                        {
                                            from: "taxes",
                                            localField: "items.item_taxes",
                                            foreignField: "_id",
                                            as: "tax_details"
                                        }
                                    },

                                    { $sort: { 'items.sequence_number': 1 } },
                                    { $match: { $and: [{ "items.is_visible_in_store": true }, { "items.is_item_in_stock": true }] } },
                                    {
                                        $group: {
                                            _id: {
                                                _id: '$_id', unique_id: "$unique_id", name: { $ifNull: [{ $arrayElemAt: ["$name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$name", 0] }, ""] }] },
                                                image_url: '$image_url',
                                                is_visible_in_store: '$is_visible_in_store',
                                                created_at: '$created_at',
                                                sequence_number: '$sequence_number',
                                                updated_at: '$updated_at'
                                            },
                                            items: {
                                                $push: {
                                                    name: { $ifNull: [{ $arrayElemAt: ["$items.name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$items.name", 0] }, ""] }] },
                                                    details: { $ifNull: [{ $arrayElemAt: ["$items.details", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$items.details", 0] }, ""] }] },
                                                    _id: '$items._id',
                                                    price: '$items.price',
                                                    offer_message_or_percentage: '$items.offer_message_or_percentage',
                                                    item_price_without_offer: '$items.item_price_without_offer',
                                                    total_quantity: '$items.total_quantity',
                                                    in_cart_quantity: '$items.in_cart_quantity',
                                                    total_added_quantity: '$items.total_added_quantity',
                                                    total_used_quantity: '$items.total_used_quantity',
                                                    sequence_number: '$items.sequence_number',
                                                    note_for_item: '$items.note_for_item',
                                                    unique_id_for_store_data: '$items.unique_id_for_store_data',
                                                    is_item_in_stock: '$items.is_item_in_stock',
                                                    is_most_popular: '$items.is_most_popular',
                                                    is_visible_in_store: '$items.is_visible_in_store',
                                                    tax: '$items.tax',
                                                    tax_details: "$tax_details",
                                                    specifications_unique_id_count: '$items.specifications_unique_id_count',
                                                    image_url: '$items.image_url',
                                                    store_id: '$items.store_id',
                                                    product_id: '$items.product_id',
                                                    created_at: '$items.created_at',
                                                    updated_at: '$items.updated_at',
                                                    unique_id: '$items.unique_id',
                                                    specifications: "$items.specifications"
                                                }
                                            },
                                            // "$items.specifications.name" : "$items.specifications.name"
                                        }
                                    }, sort
                                ]).then((products) => {

                                    let store_detail = JSON.parse(JSON.stringify(store))
                                    store_detail.name = store.name[Number(request_data.headers.lang)];
                                    if (!store_detail.name || store_detail.name == '') {
                                        store_detail.name = store.name[0];
                                    }
                                    if (!store_detail.name) {
                                        store_detail.name = "";
                                    }
                                    if (store_detail.table_settings_details) {
                                        store_detail.is_table_reservation = store_detail.table_settings_details.is_table_reservation;
                                        store_detail.is_table_reservation_with_order = store_detail.table_settings_details.is_table_reservation_with_order;
                                        store_detail.is_store_pay_delivery_fees = store_detail.table_settings_details.is_store_pay_delivery_fees
                                        delete store_detail.table_settings_details
                                    } else {
                                        store_detail.is_table_reservation = false;
                                        store_detail.is_table_reservation_with_order = false;
                                        store_detail.is_store_pay_delivery_fees = false
                                    }
                                    let delivery_detail = JSON.parse(JSON.stringify(delivery_data))
                                    store_detail.is_provide_table_booking = delivery_detail.is_provide_table_booking
                                    delivery_detail.delivery_name = delivery_data.delivery_name[Number(request_data.headers.lang)];
                                    if (!delivery_detail.delivery_name || delivery_detail.name == '') {
                                        delivery_detail.delivery_name = delivery_data.delivery_name[0];
                                    }
                                    if (!delivery_detail.delivery_name) {
                                        delivery_detail.delivery_name = "";
                                    }
                                    store_detail.is_country_business = country_data.is_business
                                    store_detail.is_city_business = city_data.is_business
                                    store_detail.is_delivery_business = delivery_data.is_business
                                    if (products.length == 0) {
                                        response_data.json({
                                            success: false, error_code: ITEM_ERROR_CODE.ITEM_NOT_FOUND,
                                            store: store_detail
                                        });
                                    } else {
                                        let ads = [];
                                        Promo_code.find({
                                            created_id: store._id,
                                            is_approved: true,
                                            is_active: true
                                        }).then((promo_codes) => {


                                            Advertise.find({
                                                $or: [{ city_id: store.city_id }, { city_id: mongoose.Types.ObjectId(ID_FOR_ALL.ALL_ID) }],
                                                ads_for: ADS_TYPE.FOR_INSIDE_STORE,
                                                is_ads_visible: true
                                            }).then((advertise) => {

                                                if (country_data && country_data.is_ads_visible && city_data && city_data.is_ads_visible) {
                                                    ads = advertise;
                                                }
                                                // let lang_code = request_data.headers.lang;
                                                // let productlength = products.length - 1;
                                                // products.forEach((product, productindex) => {
                                                //     let itemlength = product.items.length - 1;
                                                //     product.items.forEach((item, itemindex) => {
                                                //         if (!item.name[lang_code] || item.name[lang_code] == '') {
                                                //             item.name = item.name['en'];
                                                //         } else {
                                                //             item.name = item.name[lang_code];
                                                //         }
                                                //         if (!item.details[lang_code] || item.details[lang_code] == '') {
                                                //             item.details = item.details['en'];
                                                //         } else {
                                                //             item.details = item.details[lang_code];
                                                //         }
                                                //         item.specifications.forEach((sp_group, itemindex) => {
                                                //             if (!sp_group.name[lang_code] || sp_group.name[lang_code] == '') {
                                                //                 sp_group.name = sp_group.name['en'];
                                                //             } else {
                                                //                 sp_group.name = sp_group.name[lang_code];
                                                //             }
                                                //             sp_group.list.forEach((sp)=>{
                                                //                 if (!sp.name[lang_code] || sp.name[lang_code] == '') {
                                                //                     sp.name = sp.name['en'];
                                                //                 } else {
                                                //                     sp.name = sp.name[lang_code];
                                                //                 }
                                                //             }) 
                                                //         })
                                                //         if (productlength == productindex && itemlength == itemindex) {
                                                response_data.json({
                                                    success: true,
                                                    message: ITEM_MESSAGE_CODE.ITEM_LIST_SUCCESSFULLY,
                                                    currency: currency,
                                                    maximum_phone_number_length: maximum_phone_number_length,
                                                    minimum_phone_number_length: minimum_phone_number_length,
                                                    city_name: city_data.city_name,
                                                    server_time: server_time,
                                                    timezone: timezone,
                                                    delivery_name: delivery_detail.delivery_name,
                                                    ads: ads,
                                                    store: store_detail,
                                                    promo_codes: promo_codes,
                                                    products: products
                                                });
                                                // }
                                                //     })
                                                // })
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
                    }, (error) => {
                        console.log(error)
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        });
                    });

                } else {
                    response_data.json({ success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND });
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
exports.user_get_specification_list = function (request_data, response_data) {
    let request_data_body = request_data.body;


    Item.findOne({ _id: request_data_body.item_id }).then((item_detail) => {
        if (item_detail) {
            let specification_group = [];

            item_detail.specifications.forEach(function (spec_group, index1) {
                let spec_group_name = spec_group.name[Number(request_data.headers.lang)];
                if (!spec_group_name || spec_group_name == '') {
                    spec_group_name = spec_group.name[0];
                }
                if (!spec_group_name) {
                    spec_group_name = "";
                }
                specification_group.push({
                    "_id": spec_group._id,
                    "unique_id": spec_group.unique_id,
                    "is_required": spec_group.is_required,
                    "range": spec_group.range,
                    "max_range": spec_group.max_range,
                    "name": spec_group_name,
                    "type": spec_group.type,
                    "sequence_number": spec_group.sequence_number,
                    "list": [],
                    "user_can_add_specification_quantity": spec_group.user_can_add_specification_quantity || false,
                    "isParentAssociate": spec_group.isParentAssociate || false,
                    "isAssociated": spec_group.isAssociated || false,
                    "modifierId": spec_group.modifierId || null,
                    "modifierGroupId": spec_group.modifierGroupId || null,
                    "modifierName": spec_group.modifierName || null,
                    "modifierGroupName": spec_group.modifierGroupName || null
                });
                spec_group.list.forEach(function (spec, index) {
                    let spec_name = spec.name[Number(request_data.headers.lang)];
                    if (!spec_name || spec_name == '') {
                        spec_name = spec.name[0];
                    }
                    if (!spec_name) {
                        spec_name = "";
                    }
                    specification_group[index1].list.push({
                        "_id": spec._id,
                        "name": spec_name,
                        "unique_id": spec.unique_id,
                        "price": spec.price,
                        "is_default_selected": spec.is_default_selected,
                        "is_user_selected": spec.is_user_selected,
                        "sequence_number": spec.sequence_number,
                    });
                })
            })
            response_data.json({
                success: true,
                specification_group: specification_group
            });
        } else {
            response_data.json({
                success: false,
                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
            });
        }
    })

}
exports.get_product_group_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;

            let project = {
                $project: {
                    "_id": "$_id",
                    "name": { $ifNull: [{ $arrayElemAt: ["$name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$name", 0] }, ""] }] },
                    "image_url": "$image_url",
                    "sequence_number": "$sequence_number",
                    "product_ids": "$product_ids",
                    "store_id": "$store_id",
                }
            };
            let condition = { "$match": { 'store_id': { $eq: mongoose.Types.ObjectId(request_data_body.store_id) } } };
            let sort = { "$sort": {} };
            sort["$sort"]['sequence_number'] = parseInt(1);
            ProductGroup.aggregate([condition, project, sort]).then((product_groups) => {
                if (product_groups.length == 0) {
                    response_data.json({
                        success: false,
                        error_code: PRODUCT_ERROR_CODE.PRODUCT_DATA_NOT_FOUND
                    });
                } else {
                    response_data.json({
                        success: true,
                        message: PRODUCT_MESSAGE_CODE.PRODUCT_LIST_SUCCESSFULLY,
                        server_time: new Date(),
                        product_groups: product_groups
                    });
                }
            }, (error) => {
                console.log(error)
                response_data.json({
                    success: false,
                    error_code: ERROR_CODE.DETAIL_NOT_FOUND
                });
            });

        } else {
            response_data.json(response);
        }
    });
};
//get_store_list_nearest_city
exports.get_store_list_nearest_city = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'country', type: 'string' }, { name: 'latitude' }, { name: 'longitude' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let country = request_data_body.country;
            let server_time = new Date();
            let country_code = request_data_body.country_code;
            let country_code_2 = request_data_body.country_code_2;

            if (request_data_body.country_code == undefined) {
                country_code = ""
            }

            if (request_data_body.country_code_2 == undefined) {
                country_code_2 = ""
            }

            Country.findOne({ $and: [{ $or: [{ country_name: country }, { country_code: country_code }, { country_code_2: country_code_2 }] }, { is_business: true }] }).then((country_data) => {

                if (!country_data)
                    response_data.json({ success: false, error_code: COUNTRY_ERROR_CODE.BUSINESS_NOT_IN_YOUR_COUNTRY });

                else {

                    let city_lat_long = [request_data_body.latitude, request_data_body.longitude];
                    let country_id = country_data._id;

                    City.find({ country_id: country_id, is_business: true }).then((cityList) => {

                        let size = cityList.length;
                        let count = 0;
                        if (size == 0) {
                            response_data.json({ success: false, error_code: CITY_ERROR_CODE.BUSINESS_NOT_IN_YOUR_CITY });
                        } else {
                            let finalCityId = null;
                            let finalDistance = 1000000;

                            cityList.forEach(function (city_detail) {
                                count++;
                                let cityLatLong = city_detail.city_lat_long;
                                let distanceFromSubAdminCity = utils.getDistanceFromTwoLocation(city_lat_long, cityLatLong);
                                let cityRadius = city_detail.city_radius;

                                if (distanceFromSubAdminCity < cityRadius) {
                                    if (distanceFromSubAdminCity < finalDistance) {
                                        finalDistance = distanceFromSubAdminCity;
                                        finalCityId = city_detail._id;
                                    }
                                }

                                if (count == size) {
                                    if (finalCityId != null) {
                                        let city_id = finalCityId;

                                        let delivery_query = {
                                            $lookup: {
                                                from: "deliveries",
                                                localField: "deliveries_in_city",
                                                foreignField: "_id",
                                                as: "deliveries"
                                            }
                                        };

                                        let cityid_condition = { $match: { '_id': { $eq: city_id } } };
                                        let city_project = {
                                            $group: {
                                                "_id": "$_id",
                                                "city_code": { $first: "$city_code" },
                                                "city_name": { $first: "$city_name" },
                                                "is_cash_payment_mode": { $first: "$is_cash_payment_mode" },
                                                "is_other_payment_mode": { $first: "$is_other_payment_mode" },
                                                "is_promo_apply": { $first: "$is_promo_apply" },
                                                "city_locations": { $first: "$city_locations" },
                                                "is_use_radius": { $first: "$is_use_radius" },
                                                "zone_business": { $first: "$zone_business" },
                                                "is_ads_visible": { $first: "$is_ads_visible" },
                                                "is_business": { $first: "$is_business" },
                                                "payment_gateway": { $first: "$payment_gateway" },
                                                "city_radius": { $first: "$city_radius" },
                                                "deliveries_in_city": { $first: "$deliveries_in_city" },
                                                "timezone": { $first: "$timezone" },
                                                "is_check_provider_wallet_amount_for_received_cash_request": { $first: "$is_check_provider_wallet_amount_for_received_cash_request" },
                                                "provider_min_wallet_amount_for_received_cash_request": { $first: "$provider_min_wallet_amount_for_received_cash_request" },
                                                "is_provider_earning_add_in_wallet_on_cash_payment": { $first: "$is_provider_earning_add_in_wallet_on_cash_payment" },
                                                "is_store_earning_add_in_wallet_on_cash_payment": { $first: "$is_store_earning_add_in_wallet_on_cash_payment" },
                                                "is_provider_earning_add_in_wallet_on_other_payment": { $first: "$is_provider_earning_add_in_wallet_on_other_payment" },
                                                "is_store_earning_add_in_wallet_on_other_payment": { $first: "$is_store_earning_add_in_wallet_on_other_payment" },
                                                "daily_cron_date": { $first: "$daily_cron_date" },
                                                "country_id": { $first: "$country_id" },
                                                "city_lat_long": { $first: "$city_lat_long" },
                                                "created_at": { $first: "$created_at" },
                                                "updated_at": { $first: "$updated_at" },
                                                "unique_id": { $first: "$unique_id" },
                                                "deliveries": {
                                                    $push:
                                                    {
                                                        _id: '$deliveries._id',
                                                        delivery_name: { $ifNull: [{ $arrayElemAt: ["$deliveries.delivery_name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$deliveries.delivery_name", 0] }, ""] }] },
                                                        description: { $ifNull: [{ $arrayElemAt: ["$deliveries.description", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$deliveries.description", 0] }, ""] }] },
                                                        image_url: '$deliveries.image_url',
                                                        icon_url: '$deliveries.icon_url',
                                                        map_pin_url: '$deliveries.map_pin_url',
                                                        delivery_type: '$deliveries.delivery_type',
                                                        is_business: '$deliveries.is_business',
                                                        is_store_can_create_group: '$deliveries.is_store_can_create_group',
                                                        sequence_number: '$deliveries.sequence_number',
                                                        famous_products_tags: '$deliveries.famous_products_tags',
                                                    }
                                                }
                                            }
                                        };
                                        let unwind = { $unwind: "$deliveries" };
                                        City.aggregate([cityid_condition, delivery_query, unwind, city_project]).then((city) => {
                                            if (city.length == 0) {
                                                response_data.json({
                                                    success: false,
                                                    error_code: DELIVERY_ERROR_CODE.DELIVERY_DATA_NOT_FOUND_IN_YOUR_CITY
                                                });
                                            } else {
                                                if (city[0].is_business) {
                                                    let ads = [];
                                                    let condition = { "$match": { $and: [{ "city_id": { $eq: city[0]._id } }, { store_delivery_id: { $eq: mongoose.Types.ObjectId(request_data_body.store_delivery_id) } }, { is_approved: { $eq: true } }, { is_business: { $eq: true } }] } };

                                                    let project = {
                                                        $project:
                                                        {
                                                            name: { $ifNull: [{ $arrayElemAt: ["$name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$name", 0] }, ""] }] },
                                                            email: 1,
                                                            country_phone_code: 1,
                                                            phone: 1,
                                                            address: 1,
                                                            image_url: 1,
                                                            price_rating: 1,
                                                            is_store_busy: 1,
                                                            is_email_verified: 1,
                                                            is_phone_number_verified: 1,
                                                            is_document_uploaded: 1,
                                                            is_use_item_tax: 1,
                                                            item_tax: 1,
                                                            min_order_price: 1,
                                                            max_item_quantity_add_by_user: 1,
                                                            is_order_cancellation_charge_apply: 1,
                                                            order_cancellation_charge_for_above_order_price: 1,
                                                            order_cancellation_charge_type: 1,
                                                            order_cancellation_charge_value: 1,
                                                            is_taking_schedule_order: 1,
                                                            inform_schedule_order_before_min: 1,
                                                            schedule_order_create_after_minute: 1,
                                                            is_ask_estimated_time_for_ready_order: 1,
                                                            is_provide_pickup_delivery: 1,
                                                            is_provide_delivery_anywhere: 1,
                                                            delivery_radius: 1,
                                                            is_store_pay_delivery_fees: 1,
                                                            free_delivery_for_above_order_price: 1,
                                                            free_delivery_within_radius: 1,
                                                            delivery_time: 1,
                                                            delivery_time_max: 1,
                                                            user_rate: 1,
                                                            user_rate_count: 1,
                                                            provider_rate: 1,
                                                            languages_supported: 1,
                                                            provider_rate_count: 1,
                                                            website_url: 1,
                                                            slogan: 1,
                                                            offers: 1,
                                                            famous_products_tags: 1,
                                                            comments: 1,
                                                            referral_code: 1,
                                                            is_visible: 1,
                                                            wallet_currency_code: 1,
                                                            total_referrals: 1,
                                                            is_referral: 1,
                                                            device_token: 1,
                                                            device_type: 1,
                                                            server_token: 1,
                                                            login_by: 1,
                                                            app_version: 1,
                                                            _id: 1,
                                                            store_delivery_id: 1,
                                                            country_id: 1,
                                                            city_id: 1,
                                                            location: 1,
                                                            store_time: 1,
                                                        }
                                                    };
                                                    let table_settings_lookup = {
                                                        $lookup: {
                                                            from: "table_settings",
                                                            localField: "_id",
                                                            foreignField: "store_id",
                                                            as: "table_settings_details"
                                                        }
                                                    }

                                                    let table_settings_unwind = {
                                                        $unwind: {
                                                            path: "$table_settings_details",
                                                            preserveNullAndEmptyArrays: true
                                                        }
                                                    }
                                                    let sort = { "$sort": {} };
                                                    sort["$sort"]['sequence_number'] = parseInt(1);
                                                    Store.aggregate([condition, project, table_settings_lookup, table_settings_unwind, sort]).then((stores) => {
                                                        if (stores.length == 0) {
                                                            response_data.json({
                                                                success: false,
                                                                error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND
                                                            });
                                                        } else {

                                                            Advertise.find({
                                                                country_id: country_id,
                                                                $or: [{ city_id: city[0]._id }, { city_id: mongoose.Types.ObjectId(ID_FOR_ALL.ALL_ID) }],
                                                                ads_for: ADS_TYPE.STORE_LIST,
                                                                is_ads_visible: true
                                                            }).then((advertise) => {

                                                                if (city[0] && city[0].is_ads_visible && country_data && country_data.is_ads_visible) {
                                                                    ads = advertise;
                                                                }

                                                                response_data.json({
                                                                    success: true,
                                                                    message: DELIVERY_MESSAGE_CODE.DELIVERY_LIST_FOR_NEAREST_CITY_SUCCESSFULLY,
                                                                    city: city[0],
                                                                    stores: stores,
                                                                    ads: ads,
                                                                    city_data: request_data_body,
                                                                    currency_code: country_data.currency_code,
                                                                    currency_sign: country_data.currency_sign,
                                                                    server_time: server_time
                                                                });

                                                            }, (error) => {
                                                                console.log(error)
                                                                response_data.json({
                                                                    success: false,
                                                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                });
                                                            });

                                                        }
                                                    })


                                                } else {
                                                    response_data.json({
                                                        success: false,
                                                        error_code: DELIVERY_ERROR_CODE.DELIVERY_DATA_NOT_FOUND_IN_YOUR_CITY
                                                    });
                                                }
                                            }
                                        });

                                    } else {
                                        response_data.json({
                                            success: false,
                                            error_code: CITY_ERROR_CODE.BUSINESS_NOT_IN_YOUR_CITY
                                        });
                                    }
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
        } else {
            response_data.json(response);
        }
    });
};

// store_list_for_item
exports.store_list_for_item = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'city_id', type: 'string' }, { name: 'store_delivery_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let Schema = mongoose.Types.ObjectId;
            let item_name = request_data_body.item_name;
            let city_id = request_data_body.city_id;
            let store_delivery_id = request_data_body.store_delivery_id;

            User.findOne({ _id: request_data_body.user_id }).then((user_detail) => {
                if (user_detail) {
                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {

                        let item_condition = { "$match": { 'name': { $eq: item_name } } };

                        Item.aggregate([item_condition,
                            {
                                $lookup: {
                                    from: "stores",
                                    localField: "store_id",
                                    foreignField: "_id",
                                    as: "store_detail"
                                }
                            },

                            {
                                $match: {
                                    $and: [{ "store_detail.city_id": { $eq: Schema(city_id) } },
                                    { "store_detail.store_delivery_id": { $eq: Schema(store_delivery_id) } }]
                                }
                            },

                            { $unwind: "$store_detail" },

                            {
                                $group: {
                                    _id: '$name',
                                    stores: { $push: "$store_detail" }
                                }
                            }

                        ]).then((item) => {
                            if (item.length == 0) {
                                response_data.json({ success: false, error_code: USER_ERROR_CODE.STORE_LIST_NOT_FOUND });
                            } else {
                                response_data.json({
                                    success: true,
                                    message: USER_MESSAGE_CODE.GET_STORE_LIST_SUCCESSFULLY,
                                    item: item[0]
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

                } else {
                    response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND });
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

// GET PROVIDER LOCATION
exports.get_provider_location = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'provider_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            User.findOne({ _id: request_data_body.user_id }).then((user_detail) => {
                if (user_detail) {
                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {

                        Provider.findOne({ _id: request_data_body.provider_id }).then((provider) => {
                            let provider_location = [];
                            let bearing = 0;
                            let map_pin_image_url = "";

                            if (provider) {
                                provider_location = provider.location;
                                bearing = provider.bearing;

                                Vehicle.findOne({ _id: provider.vehicle_id }).then((vehicle) => {
                                    if (vehicle) {
                                        map_pin_image_url = vehicle.map_pin_image_url;
                                    }


                                    response_data.json({
                                        success: true,
                                        message: USER_MESSAGE_CODE.GET_PROVIDER_LOCATION_SUCCESSFULLY,
                                        provider_location: provider_location,
                                        bearing: bearing,
                                        map_pin_image_url: map_pin_image_url

                                    });
                                }, (error) => {
                                    console.log(error)
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });
                            } else {
                                response_data.json({ success: false })
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

                    response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND });
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

// GET RUNNING ORDER LIST
exports.get_orders = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            User.findOne({ _id: request_data_body.user_id }).then((user_detail) => {
                if (user_detail) {

                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {

                        let user_condition = { "$match": { 'user_id': { $eq: mongoose.Types.ObjectId(request_data_body.user_id) } } };
                        let order_invoice_condition = { "$match": { 'is_user_show_invoice': false } };

                        let order_status_condition = {
                            "$match": {
                                $and: [
                                    { order_status: { $ne: ORDER_STATE.STORE_REJECTED } },
                                    { order_status: { $ne: ORDER_STATE.CANCELED_BY_USER } },
                                    { order_status: { $ne: ORDER_STATE.STORE_CANCELLED } }
                                ]
                            }
                        };

                        order_status_condition = {
                            "$match": {
                                $or: [{ order_status_id: { $eq: ORDER_STATUS_ID.RUNNING } }, { order_status_id: { $eq: ORDER_STATUS_ID.COMPLETED } }, { order_status_id: { $eq: ORDER_STATUS_ID.IDEAL } }]
                            }
                        }

                        Order.aggregate([user_condition, order_invoice_condition, order_status_condition,

                            {
                                $lookup:
                                {
                                    from: "requests",
                                    localField: "request_id",
                                    foreignField: "_id",
                                    as: "request_detail"
                                }
                            },
                            {
                                $unwind: {
                                    path: "$request_detail",
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $lookup: {
                                    from: "stores",
                                    localField: "store_id",
                                    foreignField: "_id",
                                    as: "store_details"
                                }
                            },
                            {
                                $unwind: {
                                    path: "$store_details",
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $project: {
                                    "_id": "$_id",
                                    "unique_id": "$unique_id",
                                    "request_unique_id": "$request_detail.unique_id",
                                    "request_id": "$request_detail._id",
                                    "delivery_status": "$request_detail.delivery_status",
                                    "delivery_type": "$delivery_type",
                                    "total": "$total",
                                    "created_at": "$created_at",
                                    "image_url": "$image_url",
                                    "delivery_type": "$delivery_type",
                                    "order_status": "$order_status",
                                    "order_change": "$order_change",
                                    "store_name": { $ifNull: [{ $arrayElemAt: ["$store_detail.name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$store_detail.name", 0] }, ""] }] },
                                    "store_phone": { $ifNull: ["$store_detail.phone", ""] },
                                    "store_image_url": { $ifNull: ["$store_detail.image_url", ""] },
                                    "store_id": "$store_id",
                                    "cancellation_charge_apply_from": "$store_details.cancellation_charge_apply_from",
                                    "cancellation_charge_apply_till": "$store_details.cancellation_charge_apply_till",
                                    "destination_addresses": "$destination_addresses"
                                }
                            },
                            {
                                $sort: { "_id": -1 }
                            }
                        ]).then((orders) => {
                            if (orders.length == 0) {
                                response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
                            } else {
                                response_data.json({
                                    success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
                                    order_list: orders
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
                } else {
                    response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND });
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

// GET RUNNING ORDER STATUS
exports.get_order_status = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'order_id', type: 'string' }], function (response) {
        if (response.success) {

            let cancellation_charge_apply_till = 0
            let cancellation_charge_apply_from = 0
            let request_data_body = request_data.body;
            User.findOne({ _id: request_data_body.user_id }).then((user_detail) => {
                if (user_detail) {
                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {

                        Order.findOne({ _id: request_data_body.order_id }).then((order) => {

                            Store.findOne({ _id: order.store_id }).then((store) => {
                                // if (store) {
                                let country_id = order.country_id;

                                Country.findOne({ _id: country_id }).then((country) => {
                                    let currency = country.currency_sign;

                                    Order_payment.findOne({ _id: order.order_payment_id }).then((order_payment) => {
                                        if (order_payment) {

                                            let is_order_cancellation_charge_apply = false;
                                            let order_cancellation_charge = 0;
                                            let order_status = order.order_status;
                                            let order_status_details = order.date_time;
                                            if (store) {
                                                is_order_cancellation_charge_apply = store.is_order_cancellation_charge_apply;
                                                cancellation_charge_apply_till = store.cancellation_charge_apply_till
                                                cancellation_charge_apply_from = store.cancellation_charge_apply_from
                                            }

                                            if (is_order_cancellation_charge_apply) {
                                                let order_cancellation_charge_for_above_order_price = store.order_cancellation_charge_for_above_order_price;
                                                let order_cancellation_charge_type = store.order_cancellation_charge_type;
                                                let order_cancellation_charge_value = store.order_cancellation_charge_value;
                                                switch (order_cancellation_charge_type) {
                                                    case ORDER_CANCELLATION_CHARGE_TYPE.PERCENTAGE: /* 1 - percentage */
                                                        order_cancellation_charge_value = (order_payment.total_order_price) * order_cancellation_charge_value * 0.01;
                                                        break;
                                                    case ORDER_CANCELLATION_CHARGE_TYPE.ABSOLUTE: /* 2 - absolute */
                                                        order_cancellation_charge_value = order_cancellation_charge_value;
                                                        break;
                                                    default: /* 1- percentage */
                                                        order_cancellation_charge_value = (order_payment.total_order_price) * order_cancellation_charge_value * 0.01;
                                                        break;
                                                }
                                                order_cancellation_charge_value = utils.precisionRoundTwo(Number(order_cancellation_charge_value));
                                                if (order_status >= ORDER_STATE.ORDER_READY && order_payment.total_order_price > order_cancellation_charge_for_above_order_price) {
                                                    order_cancellation_charge = order_cancellation_charge_value;
                                                }
                                            }

                                            Cart.findOne({ _id: order.cart_id }).then((cart) => {

                                                Request.findOne({ _id: order.request_id }).then((request) => {
                                                    let request_id = null;
                                                    let request_unique_id = 0;
                                                    let delivery_status = 0;
                                                    let current_provider = null;
                                                    let destination_addresses = [];
                                                    let pickup_addresses = [];
                                                    let estimated_time_for_delivery_in_min = 0;
                                                    let delivery_status_details = [];

                                                    if (cart) {
                                                        destination_addresses = cart.destination_addresses;
                                                        pickup_addresses = cart.pickup_addresses;

                                                    }

                                                    if (request) {
                                                        request_id = request._id;
                                                        request_unique_id = request.unique_id;
                                                        delivery_status = request.delivery_status;
                                                        current_provider = request.current_provider;
                                                        estimated_time_for_delivery_in_min = request.estimated_time_for_delivery_in_min;
                                                        delivery_status_details = request.date_time;
                                                    }


                                                    let user_rate = 0;


                                                    response_data.json({
                                                        success: true,
                                                        message: ORDER_MESSAGE_CODE.GET_ORDER_STATUS_SUCCESSFULLY,
                                                        unique_id: order.unique_id,
                                                        request_id: request_id,
                                                        request_unique_id: request_unique_id,
                                                        delivery_status: delivery_status,
                                                        order_status: order_status,
                                                        order_status_details: order_status_details,
                                                        delivery_status_details: delivery_status_details,
                                                        currency: currency,
                                                        estimated_time_for_delivery_in_min: estimated_time_for_delivery_in_min,
                                                        total_time: order_payment.total_time,
                                                        order_change: order.order_change,
                                                        order_cancellation_charge: order_cancellation_charge,
                                                        is_confirmation_code_required_at_pickup_delivery: setting_detail.is_confirmation_code_required_at_pickup_delivery,
                                                        is_confirmation_code_required_at_complete_delivery: setting_detail.is_confirmation_code_required_at_complete_delivery,
                                                        is_user_pick_up_order: order_payment.is_user_pick_up_order,
                                                        confirmation_code_for_complete_delivery: order.confirmation_code_for_complete_delivery,
                                                        confirmation_code_for_pick_up_delivery: order.confirmation_code_for_pick_up_delivery,
                                                        delivery_type: order.delivery_type,
                                                        destination_addresses: destination_addresses,
                                                        pickup_addresses: pickup_addresses,
                                                        provider_id: current_provider,
                                                        provider_detail: order.provider_detail,
                                                        store_id: order.store_id,
                                                        user_rate: user_rate,
                                                        cancellation_charge_apply_from: cancellation_charge_apply_from,
                                                        cancellation_charge_apply_till: cancellation_charge_apply_till,
                                                        is_schedule_order: order.is_schedule_order

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
                                // }
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

                    response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND });
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

// //GENERATE INVOICE
// exports.get_order_cart_invoice = function (request_data, response_data) {

//     utils.check_request_params(request_data.body, [{ name: 'store_id', type: 'string' }, { name: 'total_time' }, { name: 'total_distance' }], function (response) {
//         if (response.success) {

//             let request_data_body = request_data.body;
//             let cart_unique_token = request_data_body.cart_unique_token;
//             let discount_price = request_data_body.discount_price;
//             let server_time = new Date();
//             let order_type = Number(request_data_body.order_type);

//             if (request_data_body.user_id == '') {
//                 request_data_body.user_id = null;
//             }

//             User.findOne({ _id: request_data_body.user_id }).then((user) => {
//                 if (order_type != ADMIN_DATA_ID.STORE && user && request_data_body.server_token !== null && user.server_token != request_data_body.server_token) {
//                     response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
//                 } else {

//                     let cart_id = null;
//                     let user_id = null;
//                     let wallet_currency_code = '';
//                     if (user) {
//                         cart_id = user.cart_id;
//                         user_id = user._id;
//                         cart_unique_token = null;
//                         wallet_currency_code = user.wallet_currency_code;
//                     }
//                     Cart.findOne({ $or: [{ _id: cart_id }, { cart_unique_token: cart_unique_token }] }).then((cart) => {
//                         if (cart) {
//                             if (cart.is_use_item_tax === request_data_body.is_use_item_tax && cart.is_tax_included === request_data_body.is_tax_included) {
//                                 cart.is_use_item_tax = request_data_body.is_use_item_tax
//                                 cart.is_tax_included = request_data_body.is_tax_included
//                                 cart.save()


//                                 let destination_location = cart.destination_addresses[0].location

//                                 let tax_lookup = {
//                                     $lookup: {
//                                         from: "taxes",
//                                         localField: "taxes",
//                                         foreignField: "_id",
//                                         as: "taxes_details"
//                                     }
//                                 }

//                                 let table_settings_lookup = {
//                                     $lookup: {
//                                         from: "table_settings",
//                                         localField: "_id",
//                                         foreignField: "store_id",
//                                         as: "table_setting_details"
//                                     }
//                                 }

//                                 let query = {
//                                     $match: { '_id': { $eq: mongoose.Types.ObjectId(request_data_body.store_id) } }
//                                 }

//                                 // Store.aggregate([{ _id: request_data_body.store_id }]).then((store) => {
//                                 Store.aggregate([query, table_settings_lookup, tax_lookup]).then((stores) => {
//                                     let store = stores[0]
//                                     if (store) {

//                                         let store_location = store.location;
//                                         let city_id = store.city_id;
//                                         let country_id = store.country_id;

//                                         Country.findOne({ _id: country_id }).then((country) => {
//                                             let is_distance_unit_mile = false;
//                                             if (country) {
//                                                 let is_distance_unit_mile = country.is_distance_unit_mile;
//                                                 if (!user) {
//                                                     wallet_currency_code = country.currency_code;
//                                                 }
//                                             }

//                                             if (wallet_currency_code == '') {
//                                                 wallet_currency_code = store.wallet_currency_code;
//                                             }

//                                             City.findOne({ _id: city_id }).then((city_detail) => {
//                                                 if (city_detail) {
//                                                     let store_zone = false;
//                                                     if (city_detail.city_locations && city_detail.city_locations.length > 0) {
//                                                         let store_zone = geolib.isPointInPolygon(
//                                                             { latitude: cart.destination_addresses[0].location[0], longitude: cart.destination_addresses[0].location[1] },
//                                                             city_detail.city_locations);
//                                                     }
//                                                     let radius = false;
//                                                     let distance = utils.getDistanceFromTwoLocation(city_detail.city_lat_long, cart.destination_addresses[0].location);
//                                                     if ((city_detail.is_use_radius && distance <= city_detail.city_radius) || store_zone) {
//                                                         distance = utils.getDistanceFromTwoLocation(store.location, cart.destination_addresses[0].location);
//                                                         if (store.is_provide_delivery_anywhere || (!store.is_provide_delivery_anywhere && distance < store.delivery_radius)) {
//                                                             radius = true;
//                                                         }
//                                                     }

//                                                     if (!request_data_body.is_user_pick_up_order && !radius && cart.delivery_type !== 3) {
//                                                         response_data.json({ success: false, error_code: CART_ERROR_CODE.YOUR_DELIVERY_ADDRESS_OUT_OF_STORE_AREA });
//                                                     } else {
//                                                         let delivery_price_used_type = ADMIN_DATA_ID.ADMIN;
//                                                         let delivery_price_used_type_id = null;
//                                                         let is_order_payment_status_set_by_store = false;
//                                                         if (store.is_store_can_add_provider || store.is_store_can_complete_order) {
//                                                             delivery_price_used_type = ADMIN_DATA_ID.STORE;
//                                                             delivery_price_used_type_id = store._id;
//                                                             is_order_payment_status_set_by_store = true
//                                                         }

//                                                         let delivery_type = DELIVERY_TYPE.STORE;

//                                                         let vehicleLookup = {
//                                                             $lookup: {
//                                                                 from: "vehicles",
//                                                                 foreignField: "_id",
//                                                                 localField: "vehicle_id",
//                                                                 as: "vehicleDetails"
//                                                             }
//                                                         }

//                                                         let vehicleUnwind = {
//                                                             $unwind: {
//                                                                 path: "$vehicleDetails",
//                                                                 preserveNullAndEmptyArrays: true
//                                                             }
//                                                         }

//                                                         let query = {};
//                                                         let vehicle_id
//                                                         if (request_data_body.vehicle_id) {
//                                                             vehicle_id = mongoose.Types.ObjectId(request_data_body.vehicle_id);
//                                                             console.log(vehicle_id)
//                                                             query = {
//                                                                 $match: {
//                                                                     $and: [{ city_id: city_id }, { delivery_type: delivery_type }, { vehicle_id: vehicle_id }, { type_id: delivery_price_used_type_id }, { is_business: true }]
//                                                                 }
//                                                             };
//                                                         } else {
//                                                             query = {
//                                                                 $match: {
//                                                                     $and: [{ city_id: city_id }, { delivery_type: delivery_type }, { type_id: delivery_price_used_type_id }, { is_business: true }]
//                                                                 }
//                                                             }
//                                                         }

//                                                         let vehicleCondition = {
//                                                             $match: {
//                                                                 "vehicleDetails.is_business": true
//                                                             }
//                                                         }
//                                                         Service.aggregate([query, vehicleLookup, vehicleUnwind, vehicleCondition]).then((service_list) => {
//                                                             console.log(service_list)
//                                                             let service = null;
//                                                             let default_service_index = service_list.findIndex((service) => service.is_default == true);
//                                                             if (default_service_index !== -1 && !vehicle_id) {
//                                                                 service = service_list[default_service_index];
//                                                             } else if (service_list.length > 0) {
//                                                                 service = service_list[0];
//                                                             }

//                                                             if (service) {
//                                                                 utils.check_zone(city_id, delivery_type, delivery_price_used_type_id, service.vehicle_id, city_detail.zone_business, store_location, destination_location, function (zone_response) {
//                                                                     /* HERE USER PARAM */

//                                                                     let service_taxes = service.service_taxes || [];
//                                                                     let total_distance = request_data_body.total_distance;
//                                                                     let total_time = request_data_body.total_time;

                                                                    


//                                                                     let is_user_pick_up_order = false;

//                                                                     if (request_data_body.is_user_pick_up_order != undefined) {
//                                                                         is_user_pick_up_order = request_data_body.is_user_pick_up_order;
//                                                                     }

//                                                                     let total_item_count = request_data_body.total_item_count;

//                                                                     /* SERVICE DATA HERE */
//                                                                     let base_price = 0;
//                                                                     let base_price_distance = 0;
//                                                                     let price_per_unit_distance = 0;
//                                                                     let price_per_unit_time = 0;
//                                                                     let service_tax = 0;
//                                                                     let min_fare = 0;
//                                                                     let is_min_fare_applied = false;
//                                                                     let admin_profit_mode_on_delivery = 0
//                                                                     let admin_profit_value_on_delivery = 0
//                                                                     console.log(service)
//                                                                     if (service) {
//                                                                         //if (service.admin_profit_mode_on_delivery) {
//                                                                         admin_profit_mode_on_delivery = service.admin_profit_mode_on_delivery;
//                                                                         admin_profit_value_on_delivery = service.admin_profit_value_on_delivery;
//                                                                         //}

//                                                                         base_price = service.base_price;
//                                                                         base_price_distance = service.base_price_distance;
//                                                                         price_per_unit_distance = service.price_per_unit_distance;
//                                                                         price_per_unit_time = service.price_per_unit_time;
//                                                                         service_tax = service.service_tax;
//                                                                         min_fare = service.min_fare;
//                                                                         // service.service_taxes.forEach(tax => {
//                                                                         //     service_tax = service_tax +tax
//                                                                         // })

//                                                                     }
//                                                                     let admin_profit_mode_on_store = store.admin_profit_mode_on_store;
//                                                                     let admin_profit_value_on_store = store.admin_profit_value_on_store;
//                                                                     // STORE DATA HERE //

//                                                                     let item_tax = store.item_tax;
//                                                                     // DELIVERY CALCULATION START //
//                                                                     let distance_price = 0;
//                                                                     let total_base_price = 0;
//                                                                     let total_distance_price = 0;
//                                                                     let total_time_price = 0;
//                                                                     let total_service_price = 0;
//                                                                     let total_admin_tax_price = 0;
//                                                                     let total_after_tax_price = 0;
//                                                                     let total_surge_price = 0;
//                                                                     let total_delivery_price_after_surge = 0;
//                                                                     let delivery_price = 0;
//                                                                     let total_delivery_price = 0;
//                                                                     let total_admin_profit_on_delivery = 0;
//                                                                     let total_provider_income = 0;
//                                                                     let promo_payment = 0;
//                                                                     let table_booking_fees = 0
//                                                                     let order_price = 0;
//                                                                     let total_store_tax_price = 0;
//                                                                     let total_order_price = 0;
//                                                                     let total_admin_profit_on_store = 0;
//                                                                     let total_store_income = 0;
//                                                                     let total_cart_price=0;
//                                                                     total_cart_price = cart.total_cart_price;
//                                                                     let is_store_pay_delivery_fees = false;
//                                                                     let total_taxes = [];
//                                                                     let total_value=0;
//                                                                     let discount_value = 0;

//                                                                     var final_delivery_fee = 0;
//                                                                     var peak_hour_fee = 0;
//                                                                     var total_cart_price_found = false;


//                                                                     total_time = total_time / 60;// convert to mins
//                                                                     total_time = utils.precisionRoundTwo(Number(total_time));

//                                                                     if (is_distance_unit_mile) {
//                                                                         total_distance = total_distance * 0.000621371;
//                                                                     } else {
//                                                                         total_distance = total_distance * 0.001;
//                                                                     }

//                                                                     console.log("Total Distance: "+ total_distance);

//                                                                     if (cart.delivery_type === DELIVERY_TYPE.TABLE && store.table_setting_details && store.table_setting_details[0].is_set_booking_fees && cart.booking_type !== 0) {
//                                                                         table_booking_fees = store.table_setting_details[0].booking_fees
//                                                                     }
//                                                                     console.log(table_booking_fees)
//                                                                     console.log(cart.delivery_type)

//                                                                     if (!is_user_pick_up_order) 
//                                                                     {
//                                                                         DeliverFee.find({}, function(err, posts)
//                                                                         {
//                                                                             if(!err)
//                                                                             {
//                                                                                 var delivery_data = posts[0];
//                                                                                 var delivery_id = delivery_data._id;
//                                                                                 var delivery_fee = delivery_data.delivery_fee;
                                                                
//                                                                                 const between = (x, min, max) => {
//                                                                                     return x >= min && x <= max;
//                                                                                 }
                                                                
//                                                                                 var delivery_high = 0;
                                                                                
//                                                                                 delivery_fee.forEach(element => {
//                                                                                     if(parseInt(element.fee)>delivery_high)
//                                                                                     {
//                                                                                         delivery_high = parseInt(element.fee);
//                                                                                     }
//                                                                                     if(total_cart_price >= parseInt(element.from) && total_cart_price <= parseInt(element.to))
//                                                                                     {
//                                                                                         total_cart_price_found = true;
//                                                                                         console.log("Final delivery fee: "+element.fee)
//                                                                                         final_delivery_fee = parseInt(element.fee);
//                                                                                     }
//                                                                                 });
//                                                                                 if(!total_cart_price_found)
//                                                                                 {
//                                                                                     final_delivery_fee = 0;
//                                                                                 }
//                                                                             }
//                                                                         });

//                                                                         const currentDateTime = moment();
//                                                                         console.log(currentDateTime);

//                                                                         PeakHour.find({peak_hour_status: true, from_time: { $lte: currentDateTime }, to_time: { $gte: currentDateTime } }, function(err, posts)
//                                                                         {
//                                                                             if(!err)
//                                                                             {
//                                                                                 if (posts)
//                                                                                 {
//                                                                                     var peak_hour_charge = 0;

//                                                                                     posts.forEach((peak_hour_charge) => {
//                                                                                         peak_hour_fee = parseInt(peak_hour_charge.peak_hour_fee);
//                                                                                     })
//                                                                                 }
//                                                                                 else
//                                                                                 {
//                                                                                     peak_hour_fee = 0;
//                                                                                 }
//                                                                                 console.log("Peak hour fee: "+peak_hour_fee);
//                                                                             }
//                                                                         });

//                                                                         if (service && service.is_use_distance_calculation) {
//                                                                             let delivery_price_setting = service.delivery_price_setting;
//                                                                             delivery_price_setting.forEach(function (delivery_setting_detail) {
//                                                                                 if (delivery_setting_detail.to_distance <= total_distance) {
//                                                                                     distance_price = distance_price + delivery_setting_detail.delivery_fee;
//                                                                                 }
//                                                                             });
//                                                                             total_distance_price = distance_price;
//                                                                             total_service_price = distance_price;
//                                                                             delivery_price = distance_price;
//                                                                             total_after_tax_price = distance_price;
//                                                                             total_delivery_price_after_surge = distance_price;
//                                                                         } else {
//                                                                             total_base_price = base_price;
//                                                                             if (total_distance > base_price_distance) {
//                                                                                 distance_price = (total_distance - base_price_distance) * price_per_unit_distance;
//                                                                             }

//                                                                             total_base_price = utils.precisionRoundTwo(total_base_price);
//                                                                             distance_price = utils.precisionRoundTwo(distance_price);
//                                                                             total_time_price = price_per_unit_time * total_time;
//                                                                             total_time_price = utils.precisionRoundTwo(Number(total_time_price));

//                                                                             total_distance_price = +total_base_price + +distance_price;
//                                                                             total_distance_price = utils.precisionRoundTwo(total_distance_price);

//                                                                             total_service_price = +total_distance_price + +total_time_price;
//                                                                             total_service_price = utils.precisionRoundTwo(Number(total_service_price));

//                                                                             total_admin_tax_price = service_tax * total_service_price * 0.01;
//                                                                             total_admin_tax_price = utils.precisionRoundTwo(Number(total_admin_tax_price));

//                                                                             total_after_tax_price = +total_service_price + +total_admin_tax_price;
//                                                                             total_after_tax_price = utils.precisionRoundTwo(Number(total_after_tax_price));

//                                                                             total_delivery_price_after_surge = +total_after_tax_price + +total_surge_price;
//                                                                             total_delivery_price_after_surge = utils.precisionRoundTwo(Number(total_delivery_price_after_surge));

//                                                                             if (total_delivery_price_after_surge <= min_fare) {
//                                                                                 delivery_price = min_fare;
//                                                                                 is_min_fare_applied = true;
//                                                                             } else {
//                                                                                 delivery_price = total_delivery_price_after_surge;
//                                                                             }
//                                                                         }



//                                                                         if (zone_response.success) {
//                                                                             total_admin_tax_price = 0;
//                                                                             total_base_price = 0;
//                                                                             total_distance_price = 0;
//                                                                             total_time_price = 0;
//                                                                             total_service_price = zone_response.zone_price;
//                                                                             delivery_price = zone_response.zone_price;
//                                                                             total_after_tax_price = total_service_price;
//                                                                             total_delivery_price_after_surge = total_service_price;
//                                                                         }

//                                                                         switch (admin_profit_mode_on_delivery) {
//                                                                             case ADMIN_PROFIT_ON_DELIVERY_ID.PERCENTAGE: /* 1- percentage */
//                                                                                 total_admin_profit_on_delivery = delivery_price * admin_profit_value_on_delivery * 0.01;
//                                                                                 break;
//                                                                             case ADMIN_PROFIT_ON_DELIVERY_ID.PER_DELVIERY: /* 2- absolute per delivery */
//                                                                                 total_admin_profit_on_delivery = admin_profit_value_on_delivery;
//                                                                                 break;
//                                                                             default: /* percentage */
//                                                                                 total_admin_profit_on_delivery = delivery_price * admin_profit_value_on_delivery * 0.01;
//                                                                                 break;
//                                                                         }

//                                                                         total_admin_profit_on_delivery = utils.precisionRoundTwo(Number(total_admin_profit_on_delivery));
//                                                                         total_provider_income = delivery_price - total_admin_profit_on_delivery;
//                                                                         total_provider_income = utils.precisionRoundTwo(Number(total_provider_income));


//                                                                     } else {
//                                                                         // var discount_price = request_data_body.discount_price;
//                                                                         discount_value = total_cart_price*(discount_price/100);
//                                                                         total_value = total_cart_price-discount_value;
                                                
//                                                                         console.log('total',total_value);
//                                                                         total_order_price=total_value;
                                                                        
                                                                    
//                                                                         total_distance = 0;
//                                                                         total_time = 0;
//                                                                         final_delivery_fee = 0;
//                                                                     }

//                                                                     // DELIVERY CALCULATION END //
//                                                                     // ORDER CALCULATION START //

                                                                  

//                                                                     if (request_data_body.total_cart_price) {
//                                                                         total_cart_price = request_data_body.total_cart_price;
//                                                                     }

//                                                                     if (store.is_use_item_tax) {
//                                                                         total_store_tax_price = cart.total_item_tax;
//                                                                     } else {
//                                                                         let total_tax = 0
//                                                                         store.taxes_details.forEach(tax => {
//                                                                             total_tax = total_tax + tax.tax
//                                                                         })
//                                                                         if (!store.is_tax_included) {
//                                                                             console.log('excluded');
//                                                                             // total_store_tax_price = request_data_body.total_cart_amout_without_tax - (100*request_data_body.total_cart_amout_without_tax) / (100+total_tax);
//                                                                             let total_cart_amout_without_tax = request_data_body.total_cart_amout_without_tax ? Number(request_data_body.total_cart_amout_without_tax) : 0;
//                                                                             total_store_tax_price = total_cart_amout_without_tax * total_tax * 0.01;
//                                                                             total_cart_price = request_data_body.total_cart_price;
//                                                                             // total_cart_price = request_data_body.total_cart_price - total_store_tax_price;
//                                                                         } else {
//                                                                             console.log('included');
//                                                                             total_store_tax_price = request_data_body.total_cart_amout_without_tax - (100 * request_data_body.total_cart_amout_without_tax) / (100 + total_tax);
//                                                                             // total_cart_price = request_data_body.total_cart_price - total_store_tax_price;
//                                                                         }
//                                                                     }
//                                                                     total_store_tax_price = utils.precisionRoundTwo(Number(total_store_tax_price));
//                                                                     cart.total_item_tax = total_store_tax_price;

//                                                                     // total_store_tax_price = total_cart_price * item_tax * 0.01;
//                                                                     // total_store_tax_price = utils.precisionRoundTwo(Number(total_store_tax_price));

//                                                                     // if (store.is_tax_included){
//                                                                     // order calculation to give table booking fees admin earnings
//                                                                     if (cart.delivery_type === DELIVERY_TYPE.TABLE){
//                                                                         order_price = +total_cart_price + +total_store_tax_price + +table_booking_fees;
//                                                                     } else {
//                                                                         order_price = +total_cart_price + +total_store_tax_price;
//                                                                     }
//                                                                     console.log('---------order price---------------')
//                                                                     console.log(order_price)
//                                                                     // } else {
//                                                                     //     order_price = total_cart_price;
//                                                                     // }
//                                                                     order_price = utils.precisionRoundTwo(Number(order_price));

//                                                                     switch (admin_profit_mode_on_store) {
//                                                                         case ADMIN_PROFIT_ON_ORDER_ID.PERCENTAGE: /* percentage */
//                                                                             total_admin_profit_on_store = order_price * admin_profit_value_on_store * 0.01;
//                                                                             break;
//                                                                         case ADMIN_PROFIT_ON_ORDER_ID.PER_ORDER: /* absolute per order */
//                                                                             total_admin_profit_on_store = admin_profit_value_on_store;
//                                                                             break;
//                                                                         case ADMIN_PROFIT_ON_ORDER_ID.PER_ITEMS: /* absolute value per items */
//                                                                             total_admin_profit_on_store = admin_profit_value_on_store * total_item_count;
//                                                                             break;
//                                                                         default: /* percentage */
//                                                                             total_admin_profit_on_store = order_price * admin_profit_value_on_store * 0.01;
//                                                                             break;
//                                                                     }

//                                                                     total_admin_profit_on_store = utils.precisionRoundTwo(Number(total_admin_profit_on_store));
//                                                                     total_store_income = order_price - total_admin_profit_on_store;
//                                                                     // commented first if condition to avoid addition of double table booking fees
//                                                                     // if (cart.delivery_type === DELIVERY_TYPE.TABLE) {
//                                                                     //     total_store_income = total_store_income + table_booking_fees
//                                                                     // }
//                                                                     // if(delivery_price_used_type == ADMIN_DATA_ID.STORE){
//                                                                     //     total_store_income = total_store_income + total_provider_income;
//                                                                     //     total_provider_income = 0;
//                                                                     // }
//                                                                     total_store_income = utils.precisionRoundTwo(Number(total_store_income));
//                                                                     /* ORDER CALCULATION END */

//                                                                     /* FINAL INVOICE CALCULATION START */
//                                                                     let tip_amount = 0;
//                                                                     let distance_from_store = utils.getDistanceFromTwoLocation(destination_location, store_location);

//                                                                     if (total_order_price > store.free_delivery_for_above_order_price && distance_from_store < store.free_delivery_within_radius && store.is_store_pay_delivery_fees) {
//                                                                         total_delivery_price = 0
//                                                                     } else {
//                                                                         total_delivery_price = delivery_price;
//                                                                     }
//                                                                     total_order_price = order_price;
//                                                                     if (!request_data_body.tip_amount) {
//                                                                         request_data_body.tip_amount = 0;
//                                                                     }
//                                                                     if (setting_detail.tip_type == 1) {
//                                                                         tip_amount = (request_data_body.tip_amount * total_order_price) / 100;
//                                                                         tip_amount = utils.precisionRoundTwo(Number(tip_amount));
//                                                                     } else {
//                                                                         tip_amount = request_data_body.tip_amount;
//                                                                     }

                                                                    

//                                                                     total_provider_income = total_provider_income + +tip_amount;
//                                                                     let total = +total_delivery_price + +total_order_price + +tip_amount;

//                                                                     //table booking fees removed to avoid double table booking fees
//                                                                     // total = total + table_booking_fees
//                                                                     total = utils.precisionRoundTwo(Number(total));
//                                                                     let user_pay_payment = total;
//                                                                     // Store Pay Delivery Fees Condition

                                                                    
//                                                                     if (total_order_price > store.free_delivery_for_above_order_price && distance_from_store < store.free_delivery_within_radius && store.is_store_pay_delivery_fees == true) {
//                                                                         is_store_pay_delivery_fees = true;
//                                                                         user_pay_payment = order_price + +tip_amount;
//                                                                     }

//                                                                     if (order_price < store.min_order_price) {
//                                                                         return response_data.json({
//                                                                             success: false,
//                                                                             min_order_price: store.min_order_price,
//                                                                             item_tax: item_tax,
//                                                                             error_code: USER_ERROR_CODE.YOUR_ORDER_PRICE_LESS_THEN_STORE_MIN_ORDER_PRICE
//                                                                         });

//                                                                     } else {
//                                                                         cart.total_item_count = total_item_count;

//                                                                         Vehicle.findOne({ _id: service.vehicle_id }).then((vehicle_data) => {
//                                                                             if (!vehicle_data) {
//                                                                                 vehicle_data = [];
//                                                                             } else {
//                                                                                 vehicle_data = [vehicle_data];
//                                                                             }

//                                                                             Order_payment.findOne({ _id: cart.order_payment_id }).then((order_payment) => {
//                                                                                 let store_detail = JSON.parse(JSON.stringify(store))
//                                                                                 store_detail.name = store.name[Number(request_data.headers.lang)];
//                                                                                 if (!store_detail.name || store_detail.name == '') {
//                                                                                     store_detail.name = store.name[0];
//                                                                                 }
//                                                                                 if (!store_detail.name) {
//                                                                                     store_detail.name = "";
//                                                                                 }
//                                                                                 if (order_payment) {

//                                                                                     let promo_id = order_payment.promo_id;
//                                                                                     Promo_code.findOne({ _id: promo_id }).then((promo_code) => {
//                                                                                         if (promo_code) {
//                                                                                             promo_code.used_promo_code = promo_code.used_promo_code - 1;
//                                                                                             promo_code.save();
//                                                                                             user.promo_count = user.promo_count - 1;
//                                                                                             user.save();
//                                                                                         }
//                                                                                     });
//                                                                                     if(service_taxes && service_taxes.length > 0){
//                                                                                         service_taxes.forEach(tax => {
//                                                                                             tax.tax_paid = tax.tax * total_service_price * 0.01;
//                                                                                         })
//                                                                                     }

//                                                                                     order_payment.cart_id = cart._id;
//                                                                                     order_payment.is_min_fare_applied = is_min_fare_applied;
//                                                                                     order_payment.order_id = null;
//                                                                                     order_payment.order_unique_id = 0;
//                                                                                     order_payment.store_id = store._id;
//                                                                                     order_payment.user_id = cart.user_id;
//                                                                                     order_payment.country_id = country_id;
//                                                                                     order_payment.city_id = city_id;
//                                                                                     order_payment.taxes = request_data_body.tax_details
//                                                                                     order_payment.provider_id = null;
//                                                                                     order_payment.promo_id = null;
//                                                                                     order_payment.delivery_price_used_type = delivery_price_used_type;
//                                                                                     order_payment.delivery_price_used_type_id = delivery_price_used_type_id;
//                                                                                     order_payment.currency_code = wallet_currency_code;
//                                                                                     order_payment.admin_currency_code = "";
//                                                                                     order_payment.order_currency_code = store.wallet_currency_code;
//                                                                                     order_payment.current_rate = 1;
//                                                                                     order_payment.admin_profit_mode_on_delivery = admin_profit_mode_on_delivery;
//                                                                                     order_payment.admin_profit_value_on_delivery = admin_profit_value_on_delivery;
//                                                                                     order_payment.total_admin_profit_on_delivery = total_admin_profit_on_delivery;
//                                                                                     order_payment.total_provider_income = total_provider_income;
//                                                                                     order_payment.admin_profit_mode_on_store = admin_profit_mode_on_store;
//                                                                                     order_payment.admin_profit_value_on_store = admin_profit_value_on_store;
//                                                                                     order_payment.total_admin_profit_on_store = total_admin_profit_on_store;
//                                                                                     order_payment.total_store_income = store.surcharge
//                                                                                     +total_store_income-discount_value;
//                                                                                     order_payment.total_distance = total_distance;
//                                                                                     order_payment.tip_amount = tip_amount;
//                                                                                     order_payment.tip_value = request_data_body.tip_amount;
//                                                                                     order_payment.total_time = total_time;
//                                                                                     order_payment.is_distance_unit_mile = is_distance_unit_mile;
//                                                                                     order_payment.is_store_pay_delivery_fees = is_store_pay_delivery_fees;
//                                                                                     order_payment.total_service_price = store.surcharge+peak_hour_fee+total_service_price-final_delivery_fee;
//                                                                                     order_payment.total_admin_tax_price = total_admin_tax_price;
//                                                                                     order_payment.peak_hour_fee = peak_hour_fee;
//                                                                                     order_payment.total_after_tax_price = total_after_tax_price;
//                                                                                     order_payment.total_surge_price = total_surge_price;
//                                                                                     order_payment.total_delivery_price_after_surge = total_delivery_price_after_surge;
//                                                                                     order_payment.total_cart_price = total_cart_price;
//                                                                                     order_payment.total_delivery_price = store.surcharge+peak_hour_fee+total_delivery_price-final_delivery_fee;
//                                                                                     order_payment.total_item_count = total_item_count;
//                                                                                     order_payment.service_tax = service_tax;
//                                                                                     order_payment.item_tax = item_tax;
//                                                                                     order_payment.total_store_tax_price = total_store_tax_price;
//                                                                                     order_payment.total_order_price = total_order_price-discount_value;
//                                                                                     order_payment.promo_payment = 0;
//                                                                                     order_payment.user_pay_payment = store.surcharge+peak_hour_fee+user_pay_payment-discount_value-final_delivery_fee;
//                                                                                     order_payment.total = store.surcharge+peak_hour_fee+total-discount_value-final_delivery_fee;
//                                                                                     order_payment.wallet_payment = 0;
//                                                                                     order_payment.total_after_wallet_payment = 0;
//                                                                                     order_payment.cash_payment = 0;
//                                                                                     order_payment.card_payment = 0;
//                                                                                     order_payment.remaining_payment = 0;
//                                                                                     order_payment.delivered_at = null;
//                                                                                     order_payment.is_order_payment_status_set_by_store = is_order_payment_status_set_by_store;
//                                                                                     order_payment.is_user_pick_up_order = is_user_pick_up_order;
//                                                                                     order_payment.booking_fees = table_booking_fees;
//                                                                                     order_payment.delivery_fee = final_delivery_fee;
//                                                                                     order_payment.pickup_time = request_data_body.pickup_time;
//                                                                                     order_payment.discount_price = discount_value;
//                                                                                     order_payment.service_taxes = service_taxes
//                                                                                     order_payment.save().then(() => {
//                                                                                         response_data.json({
//                                                                                             success: true,
//                                                                                             message: USER_MESSAGE_CODE.FARE_ESTIMATE_SUCCESSFULLY,
//                                                                                             server_time: server_time,
//                                                                                             is_allow_contactless_delivery: setting_detail.is_allow_contactless_delivery,
//                                                                                             is_allow_pickup_order_verification: setting_detail.is_allow_pickup_order_verification,
//                                                                                             is_allow_user_to_give_tip: setting_detail.is_allow_user_to_give_tip,
//                                                                                             tip_type: setting_detail.tip_type,
//                                                                                             timezone: city_detail.timezone,
//                                                                                             order_payment: order_payment,
//                                                                                             store: store_detail,
//                                                                                             vehicles: vehicle_data,
//                                                                                             is_use_item_tax: cart.is_use_item_tax,
//                                                                                             is_tax_included: cart.is_tax_included,
//                                                                                             is_use_item_tax: cart.is_use_item_tax,
//                                                                                             booking_fees: order_payment.booking_fees
//                                                                                         });
//                                                                                         cart.save()
//                                                                                     }, (error) => {
//                                                                                         console.log(error)
//                                                                                         response_data.json({
//                                                                                             success: false,
//                                                                                             error_code: ERROR_CODE.SOMETHING_WENT_WRONG
//                                                                                         });
//                                                                                     });
//                                                                                 } else {
//                                                                                     if (service_taxes && service_taxes.length > 0) {
//                                                                                         service_taxes.forEach(tax => {
//                                                                                             tax.tax_paid = tax.tax * total_service_price * 0.01;
//                                                                                         })
//                                                                                     }

//                                                                                     /* ENTRY IN ORDER PAYMENT */
//                                                                                     let order_payment = new Order_payment({
//                                                                                         cart_id: cart._id,
//                                                                                         store_id: store._id,
//                                                                                         user_id: cart.user_id,
//                                                                                         country_id: country_id,
//                                                                                         city_id: city_id,
//                                                                                         delivery_price_used_type: delivery_price_used_type,
//                                                                                         delivery_price_used_type_id: delivery_price_used_type_id,
//                                                                                         currency_code: wallet_currency_code,
//                                                                                         order_currency_code: store.wallet_currency_code,
//                                                                                         current_rate: 1, // HERE current_rate MEANS ORDER TO ADMIN CONVERT RATE
//                                                                                         wallet_to_admin_current_rate: 1,
//                                                                                         wallet_to_order_current_rate: 1,
//                                                                                         total_distance: total_distance,
//                                                                                         total_time: total_time,
//                                                                                         taxes: request_data_body.tax_details,
//                                                                                         service_tax: service_tax,
//                                                                                         is_min_fare_applied: is_min_fare_applied,
//                                                                                         item_tax: item_tax,
//                                                                                         total_service_price: total_service_price,
//                                                                                         total_admin_tax_price: total_admin_tax_price,
//                                                                                         total_delivery_price: total_delivery_price,
//                                                                                         tip_amount: tip_amount,
//                                                                                         tip_value: request_data_body.tip_amount,
//                                                                                         is_store_pay_delivery_fees: is_store_pay_delivery_fees,
//                                                                                         total_item_count: total_item_count,
//                                                                                         total_cart_price: total_cart_price,
                                                                                       
//                                                                                         total_store_tax_price: total_store_tax_price,
//                                                                                         user_pay_payment:user_pay_payment,
//                                                                                         total_order_price: total_order_price,
//                                                                                         promo_payment: promo_payment,
//                                                                                         total: total,
//                                                                                         admin_profit_mode_on_store: admin_profit_mode_on_store,
//                                                                                         admin_profit_value_on_store: admin_profit_value_on_store,
//                                                                                         total_admin_profit_on_store: total_admin_profit_on_store,
//                                                                                         total_store_income: total_store_income,
//                                                                                         admin_profit_mode_on_delivery: admin_profit_mode_on_delivery,
//                                                                                         admin_profit_value_on_delivery: admin_profit_value_on_delivery,
//                                                                                         total_admin_profit_on_delivery: total_admin_profit_on_delivery,
//                                                                                         total_provider_income: total_provider_income,
//                                                                                         is_user_pick_up_order: is_user_pick_up_order,
//                                                                                         is_order_payment_status_set_by_store: is_order_payment_status_set_by_store,
//                                                                                         is_distance_unit_mile: is_distance_unit_mile,
//                                                                                         booking_fees: table_booking_fees,
//                                                                                         service_taxes
//                                                                                     });

//                                                                                     order_payment.save().then(() => {

//                                                                                         cart.order_payment_id = order_payment._id;
//                                                                                         cart.save();
//                                                                                         response_data.json({
//                                                                                             success: true,
//                                                                                             message: USER_MESSAGE_CODE.FARE_ESTIMATE_SUCCESSFULLY,
//                                                                                             server_time: server_time,
//                                                                                             timezone: city_detail.timezone,
//                                                                                             is_allow_contactless_delivery: setting_detail.is_allow_contactless_delivery,
//                                                                                             is_allow_pickup_order_verification: setting_detail.is_allow_pickup_order_verification,
//                                                                                             is_allow_user_to_give_tip: setting_detail.is_allow_user_to_give_tip,
//                                                                                             order_payment: order_payment,
//                                                                                             tip_type: setting_detail.tip_type,
//                                                                                             store: store_detail,
//                                                                                             vehicles: vehicle_data,
//                                                                                             is_use_item_tax: cart.is_use_item_tax,
//                                                                                             is_tax_included: cart.is_tax_included,
//                                                                                             is_use_item_tax: cart.is_use_item_tax
//                                                                                         });
//                                                                                     }, (error) => {
//                                                                                         console.log(error)
//                                                                                         response_data.json({
//                                                                                             success: false,
//                                                                                             error_code: ERROR_CODE.SOMETHING_WENT_WRONG
//                                                                                         });
//                                                                                     });
//                                                                                 }


//                                                                             });
//                                                                         })
//                                                                     }
//                                                                 });
//                                                             } else {
//                                                                 response_data.json({
//                                                                     success: false,
//                                                                     error_code: USER_ERROR_CODE.DELIVERY_SERVICE_NOT_AVAILABLE_IN_YOUR_CITY
//                                                                 });
//                                                             }
//                                                         }, (error) => {
//                                                             console.log(error)
//                                                             response_data.json({
//                                                                 success: false,
//                                                                 error_code: ERROR_CODE.SOMETHING_WENT_WRONG
//                                                             });
//                                                         });
//                                                     }

//                                                 }
//                                             }, (error) => {
//                                                 console.log(error)
//                                                 response_data.json({
//                                                     success: false,
//                                                     error_code: ERROR_CODE.SOMETHING_WENT_WRONG
//                                                 });
//                                             });
//                                         }, (error) => {
//                                             console.log(error)
//                                             response_data.json({
//                                                 success: false,
//                                                 error_code: ERROR_CODE.SOMETHING_WENT_WRONG
//                                             });
//                                         });
//                                     } else {
//                                         response_data.json({ success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND });
//                                     }

//                                 }, (error) => {
//                                     console.log(error)
//                                     response_data.json({
//                                         success: false,
//                                         error_code: ERROR_CODE.SOMETHING_WENT_WRONG
//                                     });
//                                 });
//                             } else {
//                                 response_data.json({ success: false, error_code: CART_ERROR_CODE.CART_ITEM_TAX_MISS_MATCH });
//                             }
//                         } else {
//                             response_data.json({ success: false, error_code: USER_ERROR_CODE.GET_ORDER_CART_INVOICE_FAILED });
//                         }
//                     }, (error) => {
//                         console.log(error)
//                         response_data.json({
//                             success: false,
//                             error_code: ERROR_CODE.SOMETHING_WENT_WRONG
//                         });
//                     });

//                 }
//             }, (error) => {
//                 console.log(error)
//                 response_data.json({
//                     success: false,
//                     error_code: ERROR_CODE.SOMETHING_WENT_WRONG
//                 });
//             });
//         } else {
//             response_data.json(response);
//         }
//     });
// };


//GENERATE INVOICE
exports.get_order_cart_invoice = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [{ name: 'store_id', type: 'string' }, { name: 'total_time' }, { name: 'total_distance' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let cart_unique_token = request_data_body.cart_unique_token;
            let discount_price = request_data_body.discount_price;
            let server_time = new Date();
            let order_type = Number(request_data_body.order_type);

            if (request_data_body.user_id == '') {
                request_data_body.user_id = null;
            }

            User.findOne({ _id: request_data_body.user_id }).then((user) => {
                if (order_type != ADMIN_DATA_ID.STORE && user && request_data_body.server_token !== null && user.server_token != request_data_body.server_token) {
                    response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                } else {

                    let cart_id = null;
                    let user_id = null;
                    let wallet_currency_code = '';
                    if (user) {
                        cart_id = user.cart_id;
                        user_id = user._id;
                        cart_unique_token = null;
                        wallet_currency_code = user.wallet_currency_code;
                    }
                    Cart.findOne({ $or: [{ _id: cart_id }, { cart_unique_token: cart_unique_token }] }).then((cart) => {
                        if (cart) {
                            if (cart.is_use_item_tax === request_data_body.is_use_item_tax && cart.is_tax_included === request_data_body.is_tax_included) {
                                cart.is_use_item_tax = request_data_body.is_use_item_tax
                                cart.is_tax_included = request_data_body.is_tax_included
                                cart.save()


                                let destination_location = cart.destination_addresses[0].location

                                let tax_lookup = {
                                    $lookup: {
                                        from: "taxes",
                                        localField: "taxes",
                                        foreignField: "_id",
                                        as: "taxes_details"
                                    }
                                }

                                let table_settings_lookup = {
                                    $lookup: {
                                        from: "table_settings",
                                        localField: "_id",
                                        foreignField: "store_id",
                                        as: "table_setting_details"
                                    }
                                }

                                let query = {
                                    $match: { '_id': { $eq: mongoose.Types.ObjectId(request_data_body.store_id) } }
                                }

                                // Store.aggregate([{ _id: request_data_body.store_id }]).then((store) => {
                                Store.aggregate([query, table_settings_lookup, tax_lookup]).then((stores) => {
                                    let store = stores[0]
                                    if (store) {

                                        let store_location = store.location;
                                        let city_id = store.city_id;
                                        let country_id = store.country_id;

                                        Country.findOne({ _id: country_id }).then((country) => {
                                            let is_distance_unit_mile = false;
                                            if (country) {
                                                let is_distance_unit_mile = country.is_distance_unit_mile;
                                                if (!user) {
                                                    wallet_currency_code = country.currency_code;
                                                }
                                            }

                                            if (wallet_currency_code == '') {
                                                wallet_currency_code = store.wallet_currency_code;
                                            }

                                            City.findOne({ _id: city_id }).then((city_detail) => {
                                                if (city_detail) {
                                                    let store_zone = false;
                                                    if (city_detail.city_locations && city_detail.city_locations.length > 0) {
                                                        let store_zone = geolib.isPointInPolygon(
                                                            { latitude: cart.destination_addresses[0].location[0], longitude: cart.destination_addresses[0].location[1] },
                                                            city_detail.city_locations);
                                                    }
                                                    let radius = false;
                                                    let distance = utils.getDistanceFromTwoLocation(city_detail.city_lat_long, cart.destination_addresses[0].location);
                                                    if ((city_detail.is_use_radius && distance <= city_detail.city_radius) || store_zone) {
                                                        distance = utils.getDistanceFromTwoLocation(store.location, cart.destination_addresses[0].location);
                                                        if (store.is_provide_delivery_anywhere || (!store.is_provide_delivery_anywhere && distance < store.delivery_radius)) {
                                                            radius = true;
                                                        }
                                                    }

                                                    if (!request_data_body.is_user_pick_up_order && !radius && cart.delivery_type !== 3) {
                                                        response_data.json({ success: false, error_code: CART_ERROR_CODE.YOUR_DELIVERY_ADDRESS_OUT_OF_STORE_AREA });
                                                    } else {
                                                        let delivery_price_used_type = ADMIN_DATA_ID.ADMIN;
                                                        let delivery_price_used_type_id = null;
                                                        let is_order_payment_status_set_by_store = false;
                                                        if (store.is_store_can_add_provider || store.is_store_can_complete_order) {
                                                            delivery_price_used_type = ADMIN_DATA_ID.STORE;
                                                            delivery_price_used_type_id = store._id;
                                                            is_order_payment_status_set_by_store = true
                                                        }

                                                        let delivery_type = DELIVERY_TYPE.STORE;

                                                        let vehicleLookup = {
                                                            $lookup: {
                                                                from: "vehicles",
                                                                foreignField: "_id",
                                                                localField: "vehicle_id",
                                                                as: "vehicleDetails"
                                                            }
                                                        }

                                                        let vehicleUnwind = {
                                                            $unwind: {
                                                                path: "$vehicleDetails",
                                                                preserveNullAndEmptyArrays: true
                                                            }
                                                        }

                                                        let query = {};
                                                        let vehicle_id
                                                        if (request_data_body.vehicle_id) {
                                                            vehicle_id = mongoose.Types.ObjectId(request_data_body.vehicle_id);
                                                            console.log(vehicle_id)
                                                            query = {
                                                                $match: {
                                                                    $and: [{ city_id: city_id }, { delivery_type: delivery_type }, { vehicle_id: vehicle_id }, { type_id: delivery_price_used_type_id }, { is_business: true }]
                                                                }
                                                            };
                                                        } else {
                                                            query = {
                                                                $match: {
                                                                    $and: [{ city_id: city_id }, { delivery_type: delivery_type }, { type_id: delivery_price_used_type_id }, { is_business: true }]
                                                                }
                                                            }
                                                        }

                                                        let vehicleCondition = {
                                                            $match: {
                                                                "vehicleDetails.is_business": true
                                                            }
                                                        }
                                                        Service.aggregate([query, vehicleLookup, vehicleUnwind, vehicleCondition]).then((service_list) => {
                                                            console.log(service_list)
                                                            let service = null;
                                                            let default_service_index = service_list.findIndex((service) => service.is_default == true);
                                                            if (default_service_index !== -1 && !vehicle_id) {
                                                                service = service_list[default_service_index];
                                                            } else if (service_list.length > 0) {
                                                                service = service_list[0];
                                                            }

                                                            if (service) {
                                                                utils.check_zone(city_id, delivery_type, delivery_price_used_type_id, service.vehicle_id, city_detail.zone_business, store_location, destination_location, function (zone_response) {
                                                                    /* HERE USER PARAM */

                                                                    let service_taxes = service.service_taxes || [];
                                                                    let total_distance = request_data_body.total_distance;
                                                                    let total_time = request_data_body.total_time;

                                                                    


                                                                    let is_user_pick_up_order = false;

                                                                    if (request_data_body.is_user_pick_up_order != undefined) {
                                                                        is_user_pick_up_order = request_data_body.is_user_pick_up_order;
                                                                    }

                                                                    let total_item_count = request_data_body.total_item_count;

                                                                    /* SERVICE DATA HERE */
                                                                    let base_price = 0;
                                                                    let base_price_distance = 0;
                                                                    let price_per_unit_distance = 0;
                                                                    let price_per_unit_time = 0;
                                                                    let service_tax = 0;
                                                                    let min_fare = 0;
                                                                    let is_min_fare_applied = false;
                                                                    let admin_profit_mode_on_delivery = 0
                                                                    let admin_profit_value_on_delivery = 0
                                                                    console.log(service)
                                                                    if (service) {
                                                                        //if (service.admin_profit_mode_on_delivery) {
                                                                        admin_profit_mode_on_delivery = service.admin_profit_mode_on_delivery;
                                                                        admin_profit_value_on_delivery = service.admin_profit_value_on_delivery;
                                                                        //}

                                                                        base_price = service.base_price;
                                                                        base_price_distance = service.base_price_distance;
                                                                        price_per_unit_distance = service.price_per_unit_distance;
                                                                        price_per_unit_time = service.price_per_unit_time;
                                                                        service_tax = service.service_tax;
                                                                        min_fare = service.min_fare;
                                                                        // service.service_taxes.forEach(tax => {
                                                                        //     service_tax = service_tax +tax
                                                                        // })

                                                                    }
                                                                    let admin_profit_mode_on_store = store.admin_profit_mode_on_store;
                                                                    let admin_profit_value_on_store = store.admin_profit_value_on_store;
                                                                    // STORE DATA HERE //

                                                                    let item_tax = store.item_tax;
                                                                    // DELIVERY CALCULATION START //
                                                                    let distance_price = 0;
                                                                    let total_base_price = 0;
                                                                    let total_distance_price = 0;
                                                                    let total_time_price = 0;
                                                                    let total_service_price = 0;
                                                                    let total_admin_tax_price = 0;
                                                                    let total_after_tax_price = 0;
                                                                    let total_surge_price = 0;
                                                                    let total_delivery_price_after_surge = 0;
                                                                    let delivery_price = 0;
                                                                    let total_delivery_price = 0;
                                                                    let total_admin_profit_on_delivery = 0;
                                                                    let total_provider_income = 0;
                                                                    let promo_payment = 0;
                                                                    let table_booking_fees = 0
                                                                    let order_price = 0;
                                                                    let total_store_tax_price = 0;
                                                                    let total_order_price = 0;
                                                                    let total_admin_profit_on_store = 0;
                                                                    let total_store_income = 0;
                                                                    let total_cart_price=0;
                                                                    total_cart_price = cart.total_cart_price;
                                                                    let is_store_pay_delivery_fees = false;
                                                                    let total_taxes = [];
                                                                    let total_value=0;
                                                                    let discount_value = 0;

                                                                    var final_delivery_fee = 0;
                                                                    var peak_hour_fee = 0;
                                                                    var total_cart_price_found = false;

                                                                    var is_schedule_order = request_data_body.is_schedule_order;
                                                                    var schedule_order_start_at = null;
                                                                    var schedule_order_start_at2 = null;

                                                                    


                                                                    total_time = total_time / 60;// convert to mins
                                                                    total_time = utils.precisionRoundTwo(Number(total_time));

                                                                    if (is_distance_unit_mile) {
                                                                        total_distance = total_distance * 0.000621371;
                                                                    } else {
                                                                        total_distance = total_distance * 0.001;
                                                                    }

                                                                    console.log("Total Distance: "+ total_distance);

                                                                    if (cart.delivery_type === DELIVERY_TYPE.TABLE && store.table_setting_details && store.table_setting_details[0].is_set_booking_fees && cart.booking_type !== 0) {
                                                                        table_booking_fees = store.table_setting_details[0].booking_fees
                                                                    }
                                                                    console.log(table_booking_fees)
                                                                    console.log(cart.delivery_type)

                                                                    
                                                                    if (is_schedule_order == true && request_data_body.order_start_at2 != null)
                                                                    {
                                                                        schedule_order_start_at = moment.utc(Number(request_data_body.order_start_at)).format();

                                                                        if (request_data_body.order_start_at2) 
                                                                        {
                                                                            schedule_order_start_at2 = moment.utc(Number(request_data_body.order_start_at2)).format();
                                                                        

                                                                            DeliverFee.find({}, function(err, posts)
                                                                            {
                                                                                if(!err)
                                                                                {
                                                                                    var delivery_data = posts[0];
                                                                                    var delivery_id = delivery_data._id;
                                                                                    var delivery_fee = delivery_data.delivery_fee;
                                                                    
                                                                                    const between = (x, min, max) => {
                                                                                        return x >= min && x <= max;
                                                                                    }
                                                                    
                                                                                    var delivery_high = 0;
                                                                                    
                                                                                    delivery_fee.forEach(element => {
                                                                                        if(parseInt(element.fee)>delivery_high)
                                                                                        {
                                                                                            delivery_high = parseInt(element.fee);
                                                                                        }
                                                                                        if(total_cart_price >= parseInt(element.from) && total_cart_price <= parseInt(element.to))
                                                                                        {
                                                                                            total_cart_price_found = true;
                                                                                            console.log("Final delivery fee: "+element.fee)
                                                                                            final_delivery_fee = parseInt(element.fee);
                                                                                        }
                                                                                    });
                                                                                    if(!total_cart_price_found)
                                                                                    {
                                                                                        final_delivery_fee = 0;
                                                                                    }
                                                                                }
                                                                            });

                                                                            const currentDateTime = moment();
                                                                            console.log(currentDateTime);

                                                                            PeakHour.find({peak_hour_status: true, from_time: { $lte: schedule_order_start_at2 }, to_time: { $gte: schedule_order_start_at2 } }, function(err, posts)
                                                                            {
                                                                                if(!err)
                                                                                {
                                                                                    if (posts)
                                                                                    {
                                                                                        var peak_hour_charge = 0;

                                                                                        posts.forEach((peak_hour_charge) => {
                                                                                            peak_hour_fee = parseInt(peak_hour_charge.peak_hour_fee);
                                                                                        })
                                                                                    }
                                                                                    else
                                                                                    {
                                                                                        peak_hour_fee = 0;
                                                                                    }
                                                                                    console.log("Peak hour fee: "+peak_hour_fee);
                                                                                }
                                                                            });

                                                                            if (service && service.is_use_distance_calculation) {
                                                                                let delivery_price_setting = service.delivery_price_setting;
                                                                                delivery_price_setting.forEach(function (delivery_setting_detail) {
                                                                                    if (delivery_setting_detail.to_distance <= total_distance) {
                                                                                        distance_price = distance_price + delivery_setting_detail.delivery_fee;
                                                                                    }
                                                                                });
                                                                                total_distance_price = distance_price;
                                                                                total_service_price = distance_price;
                                                                                delivery_price = distance_price;
                                                                                total_after_tax_price = distance_price;
                                                                                total_delivery_price_after_surge = distance_price;
                                                                            } else {
                                                                                total_base_price = base_price;
                                                                                if (total_distance > base_price_distance) {
                                                                                    distance_price = (total_distance - base_price_distance) * price_per_unit_distance;
                                                                                }

                                                                                total_base_price = utils.precisionRoundTwo(total_base_price);
                                                                                distance_price = utils.precisionRoundTwo(distance_price);
                                                                                total_time_price = price_per_unit_time * total_time;
                                                                                total_time_price = utils.precisionRoundTwo(Number(total_time_price));

                                                                                total_distance_price = +total_base_price + +distance_price;
                                                                                total_distance_price = utils.precisionRoundTwo(total_distance_price);

                                                                                total_service_price = +total_distance_price + +total_time_price;
                                                                                total_service_price = utils.precisionRoundTwo(Number(total_service_price));

                                                                                total_admin_tax_price = service_tax * total_service_price * 0.01;
                                                                                total_admin_tax_price = utils.precisionRoundTwo(Number(total_admin_tax_price));

                                                                                total_after_tax_price = +total_service_price + +total_admin_tax_price;
                                                                                total_after_tax_price = utils.precisionRoundTwo(Number(total_after_tax_price));

                                                                                total_delivery_price_after_surge = +total_after_tax_price + +total_surge_price;
                                                                                total_delivery_price_after_surge = utils.precisionRoundTwo(Number(total_delivery_price_after_surge));

                                                                                if (total_delivery_price_after_surge <= min_fare) {
                                                                                    delivery_price = min_fare;
                                                                                    is_min_fare_applied = true;
                                                                                } else {
                                                                                    delivery_price = total_delivery_price_after_surge;
                                                                                }
                                                                            }

                                                                            if (zone_response.success) {
                                                                                total_admin_tax_price = 0;
                                                                                total_base_price = 0;
                                                                                total_distance_price = 0;
                                                                                total_time_price = 0;
                                                                                total_service_price = zone_response.zone_price;
                                                                                delivery_price = zone_response.zone_price;
                                                                                total_after_tax_price = total_service_price;
                                                                                total_delivery_price_after_surge = total_service_price;
                                                                            }

                                                                            switch (admin_profit_mode_on_delivery) {
                                                                                case ADMIN_PROFIT_ON_DELIVERY_ID.PERCENTAGE: /* 1- percentage */
                                                                                    total_admin_profit_on_delivery = delivery_price * admin_profit_value_on_delivery * 0.01;
                                                                                    break;
                                                                                case ADMIN_PROFIT_ON_DELIVERY_ID.PER_DELVIERY: /* 2- absolute per delivery */
                                                                                    total_admin_profit_on_delivery = admin_profit_value_on_delivery;
                                                                                    break;
                                                                                default: /* percentage */
                                                                                    total_admin_profit_on_delivery = delivery_price * admin_profit_value_on_delivery * 0.01;
                                                                                    break;
                                                                            }

                                                                            total_admin_profit_on_delivery = utils.precisionRoundTwo(Number(total_admin_profit_on_delivery));
                                                                            total_provider_income = delivery_price - total_admin_profit_on_delivery;
                                                                            total_provider_income = utils.precisionRoundTwo(Number(total_provider_income));
                                                                        }
                                                                    }
                                                                    else if (!is_user_pick_up_order) 
                                                                    {
                                                                        DeliverFee.find({}, function(err, posts)
                                                                        {
                                                                            if(!err)
                                                                            {
                                                                                var delivery_data = posts[0];
                                                                                var delivery_id = delivery_data._id;
                                                                                var delivery_fee = delivery_data.delivery_fee;
                                                                
                                                                                const between = (x, min, max) => {
                                                                                    return x >= min && x <= max;
                                                                                }
                                                                
                                                                                var delivery_high = 0;
                                                                                
                                                                                delivery_fee.forEach(element => {
                                                                                    if(parseInt(element.fee)>delivery_high)
                                                                                    {
                                                                                        delivery_high = parseInt(element.fee);
                                                                                    }
                                                                                    if(total_cart_price >= parseInt(element.from) && total_cart_price <= parseInt(element.to))
                                                                                    {
                                                                                        total_cart_price_found = true;
                                                                                        console.log("Final delivery fee: "+element.fee)
                                                                                        final_delivery_fee = parseInt(element.fee);
                                                                                    }
                                                                                });
                                                                                if(!total_cart_price_found)
                                                                                {
                                                                                    final_delivery_fee = 0;
                                                                                }
                                                                            }
                                                                        });

                                                                        const currentDateTime = moment();
                                                                        console.log(currentDateTime);

                                                                        PeakHour.find({peak_hour_status: true, from_time: { $lte: currentDateTime }, to_time: { $gte: currentDateTime } }, function(err, posts)
                                                                        {
                                                                            if(!err)
                                                                            {
                                                                                if (posts)
                                                                                {
                                                                                    var peak_hour_charge = 0;

                                                                                    posts.forEach((peak_hour_charge) => {
                                                                                        peak_hour_fee = parseInt(peak_hour_charge.peak_hour_fee);
                                                                                    })
                                                                                }
                                                                                else
                                                                                {
                                                                                    peak_hour_fee = 0;
                                                                                }
                                                                                console.log("Peak hour fee: "+peak_hour_fee);
                                                                            }
                                                                        });

                                                                        if (service && service.is_use_distance_calculation) {
                                                                            let delivery_price_setting = service.delivery_price_setting;
                                                                            delivery_price_setting.forEach(function (delivery_setting_detail) {
                                                                                if (delivery_setting_detail.to_distance <= total_distance) {
                                                                                    distance_price = distance_price + delivery_setting_detail.delivery_fee;
                                                                                }
                                                                            });
                                                                            total_distance_price = distance_price;
                                                                            total_service_price = distance_price;
                                                                            delivery_price = distance_price;
                                                                            total_after_tax_price = distance_price;
                                                                            total_delivery_price_after_surge = distance_price;
                                                                        } else {
                                                                            total_base_price = base_price;
                                                                            if (total_distance > base_price_distance) {
                                                                                distance_price = (total_distance - base_price_distance) * price_per_unit_distance;
                                                                            }

                                                                            total_base_price = utils.precisionRoundTwo(total_base_price);
                                                                            distance_price = utils.precisionRoundTwo(distance_price);
                                                                            total_time_price = price_per_unit_time * total_time;
                                                                            total_time_price = utils.precisionRoundTwo(Number(total_time_price));

                                                                            total_distance_price = +total_base_price + +distance_price;
                                                                            total_distance_price = utils.precisionRoundTwo(total_distance_price);

                                                                            total_service_price = +total_distance_price + +total_time_price;
                                                                            total_service_price = utils.precisionRoundTwo(Number(total_service_price));

                                                                            total_admin_tax_price = service_tax * total_service_price * 0.01;
                                                                            total_admin_tax_price = utils.precisionRoundTwo(Number(total_admin_tax_price));

                                                                            total_after_tax_price = +total_service_price + +total_admin_tax_price;
                                                                            total_after_tax_price = utils.precisionRoundTwo(Number(total_after_tax_price));

                                                                            total_delivery_price_after_surge = +total_after_tax_price + +total_surge_price;
                                                                            total_delivery_price_after_surge = utils.precisionRoundTwo(Number(total_delivery_price_after_surge));

                                                                            if (total_delivery_price_after_surge <= min_fare) {
                                                                                delivery_price = min_fare;
                                                                                is_min_fare_applied = true;
                                                                            } else {
                                                                                delivery_price = total_delivery_price_after_surge;
                                                                            }
                                                                        }



                                                                        if (zone_response.success) {
                                                                            total_admin_tax_price = 0;
                                                                            total_base_price = 0;
                                                                            total_distance_price = 0;
                                                                            total_time_price = 0;
                                                                            total_service_price = zone_response.zone_price;
                                                                            delivery_price = zone_response.zone_price;
                                                                            total_after_tax_price = total_service_price;
                                                                            total_delivery_price_after_surge = total_service_price;
                                                                        }

                                                                        switch (admin_profit_mode_on_delivery) {
                                                                            case ADMIN_PROFIT_ON_DELIVERY_ID.PERCENTAGE: /* 1- percentage */
                                                                                total_admin_profit_on_delivery = delivery_price * admin_profit_value_on_delivery * 0.01;
                                                                                break;
                                                                            case ADMIN_PROFIT_ON_DELIVERY_ID.PER_DELVIERY: /* 2- absolute per delivery */
                                                                                total_admin_profit_on_delivery = admin_profit_value_on_delivery;
                                                                                break;
                                                                            default: /* percentage */
                                                                                total_admin_profit_on_delivery = delivery_price * admin_profit_value_on_delivery * 0.01;
                                                                                break;
                                                                        }

                                                                        total_admin_profit_on_delivery = utils.precisionRoundTwo(Number(total_admin_profit_on_delivery));
                                                                        total_provider_income = delivery_price - total_admin_profit_on_delivery;
                                                                        total_provider_income = utils.precisionRoundTwo(Number(total_provider_income));
                                                                    }
                                                                    else 
                                                                    {
                                                                        // var discount_price = request_data_body.discount_price;
                                                                        discount_value = total_cart_price*(discount_price/100);
                                                                        total_value = total_cart_price-discount_value;
                                                
                                                                        console.log('total',total_value);
                                                                        total_order_price=total_value;
                                                                        
                                                                    
                                                                        total_distance = 0;
                                                                        total_time = 0;
                                                                        final_delivery_fee = 0;
                                                                    }

                                                                    // DELIVERY CALCULATION END //
                                                                    // ORDER CALCULATION START //

                                                                  

                                                                    if (request_data_body.total_cart_price) {
                                                                        total_cart_price = request_data_body.total_cart_price;
                                                                    }

                                                                    if (store.is_use_item_tax) {
                                                                        total_store_tax_price = cart.total_item_tax;
                                                                    } else {
                                                                        let total_tax = 0
                                                                        store.taxes_details.forEach(tax => {
                                                                            total_tax = total_tax + tax.tax
                                                                        })
                                                                        if (!store.is_tax_included) {
                                                                            console.log('excluded');
                                                                            // total_store_tax_price = request_data_body.total_cart_amout_without_tax - (100*request_data_body.total_cart_amout_without_tax) / (100+total_tax);
                                                                            let total_cart_amout_without_tax = request_data_body.total_cart_amout_without_tax ? Number(request_data_body.total_cart_amout_without_tax) : 0;
                                                                            total_store_tax_price = total_cart_amout_without_tax * total_tax * 0.01;
                                                                            total_cart_price = request_data_body.total_cart_price;
                                                                            // total_cart_price = request_data_body.total_cart_price - total_store_tax_price;
                                                                        } else {
                                                                            console.log('included');
                                                                            total_store_tax_price = request_data_body.total_cart_amout_without_tax - (100 * request_data_body.total_cart_amout_without_tax) / (100 + total_tax);
                                                                            // total_cart_price = request_data_body.total_cart_price - total_store_tax_price;
                                                                        }
                                                                    }
                                                                    total_store_tax_price = utils.precisionRoundTwo(Number(total_store_tax_price));
                                                                    cart.total_item_tax = total_store_tax_price;

                                                                    // total_store_tax_price = total_cart_price * item_tax * 0.01;
                                                                    // total_store_tax_price = utils.precisionRoundTwo(Number(total_store_tax_price));

                                                                    // if (store.is_tax_included){
                                                                    // order calculation to give table booking fees admin earnings
                                                                    if (cart.delivery_type === DELIVERY_TYPE.TABLE){
                                                                        order_price = +total_cart_price + +total_store_tax_price + +table_booking_fees;
                                                                    } else {
                                                                        order_price = +total_cart_price + +total_store_tax_price;
                                                                    }
                                                                    console.log('---------order price---------------')
                                                                    console.log(order_price)
                                                                    // } else {
                                                                    //     order_price = total_cart_price;
                                                                    // }
                                                                    order_price = utils.precisionRoundTwo(Number(order_price));

                                                                    switch (admin_profit_mode_on_store) {
                                                                        case ADMIN_PROFIT_ON_ORDER_ID.PERCENTAGE: /* percentage */
                                                                            total_admin_profit_on_store = order_price * admin_profit_value_on_store * 0.01;
                                                                            break;
                                                                        case ADMIN_PROFIT_ON_ORDER_ID.PER_ORDER: /* absolute per order */
                                                                            total_admin_profit_on_store = admin_profit_value_on_store;
                                                                            break;
                                                                        case ADMIN_PROFIT_ON_ORDER_ID.PER_ITEMS: /* absolute value per items */
                                                                            total_admin_profit_on_store = admin_profit_value_on_store * total_item_count;
                                                                            break;
                                                                        default: /* percentage */
                                                                            total_admin_profit_on_store = order_price * admin_profit_value_on_store * 0.01;
                                                                            break;
                                                                    }

                                                                    total_admin_profit_on_store = utils.precisionRoundTwo(Number(total_admin_profit_on_store));
                                                                    total_store_income = order_price - total_admin_profit_on_store;
                                                                    // commented first if condition to avoid addition of double table booking fees
                                                                    // if (cart.delivery_type === DELIVERY_TYPE.TABLE) {
                                                                    //     total_store_income = total_store_income + table_booking_fees
                                                                    // }
                                                                    // if(delivery_price_used_type == ADMIN_DATA_ID.STORE){
                                                                    //     total_store_income = total_store_income + total_provider_income;
                                                                    //     total_provider_income = 0;
                                                                    // }
                                                                    total_store_income = utils.precisionRoundTwo(Number(total_store_income));
                                                                    /* ORDER CALCULATION END */

                                                                    /* FINAL INVOICE CALCULATION START */
                                                                    let tip_amount = 0;
                                                                    let distance_from_store = utils.getDistanceFromTwoLocation(destination_location, store_location);

                                                                    if (total_order_price > store.free_delivery_for_above_order_price && distance_from_store < store.free_delivery_within_radius && store.is_store_pay_delivery_fees) {
                                                                        total_delivery_price = 0
                                                                    } else {
                                                                        total_delivery_price = delivery_price;
                                                                    }
                                                                    total_order_price = order_price;
                                                                    if (!request_data_body.tip_amount) {
                                                                        request_data_body.tip_amount = 0;
                                                                    }
                                                                    if (setting_detail.tip_type == 1) {
                                                                        tip_amount = (request_data_body.tip_amount * total_order_price) / 100;
                                                                        tip_amount = utils.precisionRoundTwo(Number(tip_amount));
                                                                    } else {
                                                                        tip_amount = request_data_body.tip_amount;
                                                                    }

                                                                    

                                                                    total_provider_income = total_provider_income + +tip_amount;
                                                                    let total = +total_delivery_price + +total_order_price + +tip_amount;

                                                                    //table booking fees removed to avoid double table booking fees
                                                                    // total = total + table_booking_fees
                                                                    total = utils.precisionRoundTwo(Number(total));
                                                                    let user_pay_payment = total;
                                                                    // Store Pay Delivery Fees Condition

                                                                    
                                                                    if (total_order_price > store.free_delivery_for_above_order_price && distance_from_store < store.free_delivery_within_radius && store.is_store_pay_delivery_fees == true) {
                                                                        is_store_pay_delivery_fees = true;
                                                                        user_pay_payment = order_price + +tip_amount;
                                                                    }

                                                                    if (order_price < store.min_order_price) {
                                                                        return response_data.json({
                                                                            success: false,
                                                                            min_order_price: store.min_order_price,
                                                                            item_tax: item_tax,
                                                                            error_code: USER_ERROR_CODE.YOUR_ORDER_PRICE_LESS_THEN_STORE_MIN_ORDER_PRICE
                                                                        });

                                                                    } else {
                                                                        cart.total_item_count = total_item_count;

                                                                        Vehicle.findOne({ _id: service.vehicle_id }).then((vehicle_data) => {
                                                                            if (!vehicle_data) {
                                                                                vehicle_data = [];
                                                                            } else {
                                                                                vehicle_data = [vehicle_data];
                                                                            }

                                                                            Order_payment.findOne({ _id: cart.order_payment_id }).then((order_payment) => {
                                                                                let store_detail = JSON.parse(JSON.stringify(store))
                                                                                store_detail.name = store.name[Number(request_data.headers.lang)];
                                                                                if (!store_detail.name || store_detail.name == '') {
                                                                                    store_detail.name = store.name[0];
                                                                                }
                                                                                if (!store_detail.name) {
                                                                                    store_detail.name = "";
                                                                                }
                                                                                if (order_payment) {

                                                                                    let promo_id = order_payment.promo_id;
                                                                                    Promo_code.findOne({ _id: promo_id }).then((promo_code) => {
                                                                                        if (promo_code) {
                                                                                            promo_code.used_promo_code = promo_code.used_promo_code - 1;
                                                                                            promo_code.save();
                                                                                            user.promo_count = user.promo_count - 1;
                                                                                            user.save();
                                                                                        }
                                                                                    });
                                                                                    if(service_taxes && service_taxes.length > 0){
                                                                                        service_taxes.forEach(tax => {
                                                                                            tax.tax_paid = tax.tax * total_service_price * 0.01;
                                                                                        })
                                                                                    }

                                                                                    order_payment.cart_id = cart._id;
                                                                                    order_payment.is_min_fare_applied = is_min_fare_applied;
                                                                                    order_payment.order_id = null;
                                                                                    order_payment.order_unique_id = 0;
                                                                                    order_payment.store_id = store._id;
                                                                                    order_payment.user_id = cart.user_id;
                                                                                    order_payment.country_id = country_id;
                                                                                    order_payment.city_id = city_id;
                                                                                    order_payment.taxes = request_data_body.tax_details
                                                                                    order_payment.provider_id = null;
                                                                                    order_payment.promo_id = null;
                                                                                    order_payment.delivery_price_used_type = delivery_price_used_type;
                                                                                    order_payment.delivery_price_used_type_id = delivery_price_used_type_id;
                                                                                    order_payment.currency_code = wallet_currency_code;
                                                                                    order_payment.admin_currency_code = "";
                                                                                    order_payment.order_currency_code = store.wallet_currency_code;
                                                                                    order_payment.current_rate = 1;
                                                                                    order_payment.admin_profit_mode_on_delivery = admin_profit_mode_on_delivery;
                                                                                    order_payment.admin_profit_value_on_delivery = admin_profit_value_on_delivery;
                                                                                    order_payment.total_admin_profit_on_delivery = total_admin_profit_on_delivery;
                                                                                    order_payment.total_provider_income = total_provider_income;
                                                                                    order_payment.admin_profit_mode_on_store = admin_profit_mode_on_store;
                                                                                    order_payment.admin_profit_value_on_store = admin_profit_value_on_store;
                                                                                    order_payment.total_admin_profit_on_store = total_admin_profit_on_store;
                                                                                    order_payment.total_store_income = store.surcharge
                                                                                    +total_store_income-discount_value;
                                                                                    order_payment.total_distance = total_distance;
                                                                                    order_payment.tip_amount = tip_amount;
                                                                                    order_payment.tip_value = request_data_body.tip_amount;
                                                                                    order_payment.total_time = total_time;
                                                                                    order_payment.is_distance_unit_mile = is_distance_unit_mile;
                                                                                    order_payment.is_store_pay_delivery_fees = is_store_pay_delivery_fees;
                                                                                    order_payment.total_service_price = store.surcharge+peak_hour_fee+total_service_price-final_delivery_fee;
                                                                                    order_payment.total_admin_tax_price = total_admin_tax_price;
                                                                                    order_payment.peak_hour_fee = peak_hour_fee;
                                                                                    order_payment.total_after_tax_price = total_after_tax_price;
                                                                                    order_payment.total_surge_price = total_surge_price;
                                                                                    order_payment.total_delivery_price_after_surge = total_delivery_price_after_surge;
                                                                                    order_payment.total_cart_price = total_cart_price;
                                                                                    order_payment.total_delivery_price = store.surcharge+peak_hour_fee
                                                                                    +total_delivery_price-final_delivery_fee;
                                                                                    order_payment.total_item_count = total_item_count;
                                                                                    order_payment.service_tax = service_tax;
                                                                                    order_payment.item_tax = item_tax;
                                                                                    order_payment.total_store_tax_price = total_store_tax_price;
                                                                                    order_payment.total_order_price = total_order_price-discount_value;
                                                                                    order_payment.promo_payment = 0;
                                                                                    order_payment.user_pay_payment = store.surcharge+peak_hour_fee+user_pay_payment-discount_value-final_delivery_fee;
                                                                                    order_payment.total = store.surcharge+peak_hour_fee+total-discount_value-final_delivery_fee;
                                                                                    order_payment.wallet_payment = 0;
                                                                                    order_payment.total_after_wallet_payment = 0;
                                                                                    order_payment.cash_payment = 0;
                                                                                    order_payment.card_payment = 0;
                                                                                    order_payment.remaining_payment = 0;
                                                                                    order_payment.delivered_at = null;
                                                                                    order_payment.is_order_payment_status_set_by_store = is_order_payment_status_set_by_store;
                                                                                    order_payment.is_user_pick_up_order = is_user_pick_up_order;
                                                                                    order_payment.booking_fees = table_booking_fees;
                                                                                    order_payment.delivery_fee = final_delivery_fee;
                                                                                    order_payment.pickup_time = request_data_body.pickup_time;
                                                                                    order_payment.discount_price = discount_value;
                                                                                    order_payment.service_taxes = service_taxes
                                                                                    order_payment.save().then(() => {
                                                                                        response_data.json({
                                                                                            success: true,
                                                                                            message: USER_MESSAGE_CODE.FARE_ESTIMATE_SUCCESSFULLY,
                                                                                            server_time: server_time,
                                                                                            is_allow_contactless_delivery: setting_detail.is_allow_contactless_delivery,
                                                                                            is_allow_pickup_order_verification: setting_detail.is_allow_pickup_order_verification,
                                                                                            is_allow_user_to_give_tip: setting_detail.is_allow_user_to_give_tip,
                                                                                            tip_type: setting_detail.tip_type,
                                                                                            timezone: city_detail.timezone,
                                                                                            order_payment: order_payment,
                                                                                            store: store_detail,
                                                                                            vehicles: vehicle_data,
                                                                                            is_use_item_tax: cart.is_use_item_tax,
                                                                                            is_tax_included: cart.is_tax_included,
                                                                                            is_use_item_tax: cart.is_use_item_tax,
                                                                                            booking_fees: order_payment.booking_fees
                                                                                        });
                                                                                        cart.save()
                                                                                    }, (error) => {
                                                                                        console.log(error)
                                                                                        response_data.json({
                                                                                            success: false,
                                                                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                                        });
                                                                                    });
                                                                                } else {
                                                                                    if (service_taxes && service_taxes.length > 0) {
                                                                                        service_taxes.forEach(tax => {
                                                                                            tax.tax_paid = tax.tax * total_service_price * 0.01;
                                                                                        })
                                                                                    }

                                                                                    /* ENTRY IN ORDER PAYMENT */
                                                                                    let order_payment = new Order_payment({
                                                                                        cart_id: cart._id,
                                                                                        store_id: store._id,
                                                                                        user_id: cart.user_id,
                                                                                        country_id: country_id,
                                                                                        city_id: city_id,
                                                                                        delivery_price_used_type: delivery_price_used_type,
                                                                                        delivery_price_used_type_id: delivery_price_used_type_id,
                                                                                        currency_code: wallet_currency_code,
                                                                                        order_currency_code: store.wallet_currency_code,
                                                                                        current_rate: 1, // HERE current_rate MEANS ORDER TO ADMIN CONVERT RATE
                                                                                        wallet_to_admin_current_rate: 1,
                                                                                        wallet_to_order_current_rate: 1,
                                                                                        total_distance: total_distance,
                                                                                        total_time: total_time,
                                                                                        taxes: request_data_body.tax_details,
                                                                                        service_tax: service_tax,
                                                                                        is_min_fare_applied: is_min_fare_applied,
                                                                                        item_tax: item_tax,
                                                                                        total_service_price: total_service_price,
                                                                                        total_admin_tax_price: total_admin_tax_price,
                                                                                        total_delivery_price: total_delivery_price,
                                                                                        tip_amount: tip_amount,
                                                                                        tip_value: request_data_body.tip_amount,
                                                                                        is_store_pay_delivery_fees: is_store_pay_delivery_fees,
                                                                                        total_item_count: total_item_count,
                                                                                        total_cart_price: total_cart_price,
                                                                                       
                                                                                        total_store_tax_price: total_store_tax_price,
                                                                                        user_pay_payment:user_pay_payment,
                                                                                        total_order_price: total_order_price,
                                                                                        promo_payment: promo_payment,
                                                                                        total: total,
                                                                                        admin_profit_mode_on_store: admin_profit_mode_on_store,
                                                                                        admin_profit_value_on_store: admin_profit_value_on_store,
                                                                                        total_admin_profit_on_store: total_admin_profit_on_store,
                                                                                        total_store_income: total_store_income,
                                                                                        admin_profit_mode_on_delivery: admin_profit_mode_on_delivery,
                                                                                        admin_profit_value_on_delivery: admin_profit_value_on_delivery,
                                                                                        total_admin_profit_on_delivery: total_admin_profit_on_delivery,
                                                                                        total_provider_income: total_provider_income,
                                                                                        is_user_pick_up_order: is_user_pick_up_order,
                                                                                        is_order_payment_status_set_by_store: is_order_payment_status_set_by_store,
                                                                                        is_distance_unit_mile: is_distance_unit_mile,
                                                                                        booking_fees: table_booking_fees,
                                                                                        service_taxes
                                                                                    });

                                                                                    order_payment.save().then(() => {

                                                                                        cart.order_payment_id = order_payment._id;
                                                                                        cart.save();
                                                                                        response_data.json({
                                                                                            success: true,
                                                                                            message: USER_MESSAGE_CODE.FARE_ESTIMATE_SUCCESSFULLY,
                                                                                            server_time: server_time,
                                                                                            timezone: city_detail.timezone,
                                                                                            is_allow_contactless_delivery: setting_detail.is_allow_contactless_delivery,
                                                                                            is_allow_pickup_order_verification: setting_detail.is_allow_pickup_order_verification,
                                                                                            is_allow_user_to_give_tip: setting_detail.is_allow_user_to_give_tip,
                                                                                            order_payment: order_payment,
                                                                                            tip_type: setting_detail.tip_type,
                                                                                            store: store_detail,
                                                                                            vehicles: vehicle_data,
                                                                                            is_use_item_tax: cart.is_use_item_tax,
                                                                                            is_tax_included: cart.is_tax_included,
                                                                                            is_use_item_tax: cart.is_use_item_tax
                                                                                        });
                                                                                    }, (error) => {
                                                                                        console.log(error)
                                                                                        response_data.json({
                                                                                            success: false,
                                                                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                                        });
                                                                                    });
                                                                                }


                                                                            });
                                                                        })
                                                                    }
                                                                });
                                                            } else {
                                                                response_data.json({
                                                                    success: false,
                                                                    error_code: USER_ERROR_CODE.DELIVERY_SERVICE_NOT_AVAILABLE_IN_YOUR_CITY
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
                                        response_data.json({ success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND });
                                    }

                                }, (error) => {
                                    console.log(error)
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });
                            } else {
                                response_data.json({ success: false, error_code: CART_ERROR_CODE.CART_ITEM_TAX_MISS_MATCH });
                            }
                        } else {
                            response_data.json({ success: false, error_code: USER_ERROR_CODE.GET_ORDER_CART_INVOICE_FAILED });
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
        } else {
            response_data.json(response);
        }
    });
};


exports.get_courier_order_invoice = function (request_data, response_data) {
    // console.log('courier order invoice')
    utils.check_request_params(request_data.body, [{ name: 'total_time' }, { name: 'total_distance' }], function (response) {
        //  console.log('tested')
        if (response.success) {

            let request_data_body = request_data.body;
            let cart_unique_token = request_data_body.cart_unique_token;
            let server_time = new Date();

            if (request_data_body.user_id == '') {
                request_data_body.user_id = null;
            }

            User.findOne({ _id: request_data_body.user_id }).then((user) => {
                // console.log('1')
                // console.log(user)
                // if(user){
                if (user && request_data_body.server_token !== null && user.server_token != request_data_body.server_token) {
                    response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                } else {

                    if (user) {
                        cart_id = user.cart_id;
                        user_id = user._id;
                        cart_unique_token = null;
                        wallet_currency_code = user.wallet_currency_code;
                    }
                    Cart.findOne({ $or: [{ _id: cart_id }, { cart_unique_token: cart_unique_token }] }).then((cart) => {
                        // console.log('2')

                        if (cart) {
                            let destination_location = cart.destination_addresses[cart.destination_addresses.length - 1].location
                            let pickup_location = cart.pickup_addresses[0].location;
                            let city_id = request_data_body.city_id;
                            let country_id = request_data_body.country_id;
                            let delivery_type = DELIVERY_TYPE.COURIER;

                            Country.findOne({ _id: country_id }).then((country) => {
                                // console.log('3')

                                let is_distance_unit_mile = false;
                                if (country) {
                                    let is_distance_unit_mile = country.is_distance_unit_mile;
                                    if (!user) {
                                        wallet_currency_code = country.currency_code;
                                    }
                                }

                                City.findOne({ _id: city_id }).then((city_detail) => {
                                    // console.log('4')

                                    if (city_detail) {

                                        let delivery_price_used_type = ADMIN_DATA_ID.ADMIN;
                                        let delivery_price_used_type_id = null;
                                        let is_order_payment_status_set_by_store = false;


                                        let query = {   };
                                        let vehicle_id;
                                        if (request_data_body.vehicle_id) {
                                            vehicle_id = request_data_body.vehicle_id;
                                            query = { city_id: city_id, delivery_type: delivery_type, vehicle_id: vehicle_id, type_id: delivery_price_used_type_id };
                                        } else {
                                            query = { city_id: city_id, delivery_type: delivery_type, type_id: delivery_price_used_type_id }
                                        }

                                        Service.find(query).then((service_list) => {
                                            // console.log('5')

                                            let service = null;
                                            let default_service_index = service_list.findIndex((service) => service.is_default == true);
                                            if (default_service_index !== -1 && !vehicle_id) {
                                                service = service_list[default_service_index];
                                            } else if (service_list.length > 0) {
                                                service = service_list[0];
                                            }

                                            if (service) {
                                            // console.log('6')    

                                                utils.check_zone(city_id, delivery_type, delivery_price_used_type_id, service.vehicle_id, city_detail.zone_business, pickup_location, destination_location, function (zone_response) {
                                                    /* HERE USER PARAM */

                                                    let total_distance = request_data_body.total_distance;
                                                    let total_time = request_data_body.total_time;


                                                    let is_user_pick_up_order = false;


                                                    let total_item_count = 1;

                                                    /* SERVICE DATA HERE */
                                                    let base_price = 0;
                                                    let base_price_distance = 0;
                                                    let price_per_unit_distance = 0;
                                                    let price_per_unit_time = 0;
                                                    let service_tax = 0;
                                                    let min_fare = 0;
                                                    let is_min_fare_applied = false;
                                                    let admin_profit_mode_on_delivery = 1
                                                    let admin_profit_value_on_delivery = 0

                                                    if (service) {
                                                        //if (service.admin_profit_mode_on_delivery) {
                                                        admin_profit_mode_on_delivery = service.admin_profit_mode_on_delivery;
                                                        admin_profit_value_on_delivery = service.admin_profit_value_on_delivery;
                                                        //}

                                                        base_price = service.base_price;
                                                        base_price_distance = service.base_price_distance;
                                                        price_per_unit_distance = service.price_per_unit_distance;
                                                        price_per_unit_time = service.price_per_unit_time;
                                                        service_tax = service.service_tax;
                                                        min_fare = service.min_fare;

                                                    }
                                                    let admin_profit_mode_on_store = 0;
                                                    let admin_profit_value_on_store = 0;
                                                    // STORE DATA HERE //

                                                    let item_tax = 0;
                                                    // DELIVERY CALCULATION START //
                                                    let distance_price = 0;
                                                    let total_base_price = 0;
                                                    let total_distance_price = 0;
                                                    let total_time_price = 0;
                                                    let total_service_price = 0;
                                                    let total_sur_charge = 0;
                                                    let total_admin_tax_price = 0;
                                                    let total_after_tax_price = 0;
                                                    let total_surge_price = 0;
                                                    let total_delivery_price_after_surge = 0;
                                                    let delivery_price = 0;
                                                    let total_delivery_price = 0;
                                                    let total_admin_profit_on_delivery = 0;
                                                    let total_provider_income = 0;
                                                    let promo_payment = 0;

                                                    total_time = total_time / 60;// convert to mins
                                                    total_time = utils.precisionRoundTwo(Number(total_time));

                                                    if (is_distance_unit_mile) {
                                                        total_distance = total_distance * 0.000621371;
                                                    } else {
                                                        total_distance = total_distance * 0.001;
                                                    }

                                                    if (!is_user_pick_up_order) {
                                                        console.log("cart.destination_addresses.length")
                                                        console.log(cart.destination_addresses.length)
                                                        total_sur_charge = service.price_per_stop * cart.destination_addresses.length;
                                                        total_sur_charge = utils.precisionRoundTwo(Number(total_sur_charge));

                                                        if (service && service.is_use_distance_calculation) {
                                                            let delivery_price_setting = service.delivery_price_setting;
                                                            delivery_price_setting.forEach(function (delivery_setting_detail) {
                                                                if (delivery_setting_detail.to_distance >= total_distance) {
                                                                    distance_price = distance_price + delivery_setting_detail.delivery_fee;
                                                                }
                                                            });
                                                            total_distance_price = distance_price;
                                                            total_service_price = distance_price;
                                                            delivery_price = distance_price;
                                                            total_after_tax_price = distance_price + +total_sur_charge;
                                                            total_delivery_price_after_surge = distance_price;
                                                        } else {
                                                            total_base_price = base_price;
                                                            if (total_distance > base_price_distance) {
                                                                distance_price = (total_distance - base_price_distance) * price_per_unit_distance;
                                                            }

                                                            total_base_price = utils.precisionRoundTwo(total_base_price);
                                                            distance_price = utils.precisionRoundTwo(distance_price);
                                                            total_time_price = price_per_unit_time * total_time;
                                                            total_time_price = utils.precisionRoundTwo(Number(total_time_price));

                                                            total_distance_price = +total_base_price + +distance_price;
                                                            total_distance_price = utils.precisionRoundTwo(total_distance_price);

                                                            total_service_price = +total_distance_price + +total_time_price;
                                                            total_service_price = utils.precisionRoundTwo(Number(total_service_price));

                                                            total_admin_tax_price = service_tax * total_service_price * 0.01;
                                                            total_admin_tax_price = utils.precisionRoundTwo(Number(total_admin_tax_price));

                                                            total_after_tax_price = +total_service_price + +total_admin_tax_price + +total_sur_charge;
                                                            total_after_tax_price = utils.precisionRoundTwo(Number(total_after_tax_price));

                                                            total_delivery_price_after_surge = +total_after_tax_price + +total_surge_price;
                                                            total_delivery_price_after_surge = utils.precisionRoundTwo(Number(total_delivery_price_after_surge));

                                                            if (total_delivery_price_after_surge <= min_fare) {
                                                                delivery_price = min_fare;
                                                                is_min_fare_applied = true;
                                                            } else {
                                                                delivery_price = total_delivery_price_after_surge;
                                                            }
                                                        }



                                                        if (zone_response.success) {
                                                            total_admin_tax_price = 0;
                                                            total_base_price = 0;
                                                            total_distance_price = 0;
                                                            total_time_price = 0;
                                                            total_service_price = zone_response.zone_price;
                                                            delivery_price = zone_response.zone_price;
                                                            total_after_tax_price = total_service_price;
                                                            total_delivery_price_after_surge = total_service_price;
                                                        }

                                                        switch (admin_profit_mode_on_delivery) {
                                                            case ADMIN_PROFIT_ON_DELIVERY_ID.PERCENTAGE: /* 1- percentage */
                                                                total_admin_profit_on_delivery = delivery_price * admin_profit_value_on_delivery * 0.01;
                                                                break;
                                                            case ADMIN_PROFIT_ON_DELIVERY_ID.PER_DELVIERY: /* 2- absolute per delivery */
                                                                total_admin_profit_on_delivery = admin_profit_value_on_delivery;
                                                                break;
                                                            default: /* percentage */
                                                                total_admin_profit_on_delivery = delivery_price * admin_profit_value_on_delivery * 0.01;
                                                                break;
                                                        }

                                                        total_admin_profit_on_delivery = utils.precisionRoundTwo(Number(total_admin_profit_on_delivery + +total_sur_charge));
                                                        total_provider_income = delivery_price - total_admin_profit_on_delivery;
                                                        total_provider_income = utils.precisionRoundTwo(Number(total_provider_income));


                                                    } else {
                                                        total_distance = 0;
                                                        total_time = 0;
                                                    }

                                                    // DELIVERY CALCULATION END //
                                                    // ORDER CALCULATION START //

                                                    let order_price = 0;
                                                    let total_store_tax_price = 0;
                                                    let total_order_price = 0;
                                                    let total_admin_profit_on_store = 0;
                                                    let total_store_income = 0;
                                                    let total_cart_price = 0;
                                                    let is_store_pay_delivery_fees = false;

                                                    total_cart_price = 0;
 
                                                    cart.total_item_tax = total_store_tax_price;

                                                    order_price = +total_cart_price + +total_store_tax_price;
                                                    order_price = utils.precisionRoundTwo(Number(order_price));


                                                    /* FINAL INVOICE CALCULATION START */
                                                    total_delivery_price = delivery_price;
                                                    total_order_price = order_price;
                                                    let tip_amount = 0
                                                    if (!request_data_body.tip_amount) {
                                                        request_data_body.tip_amount = 0;
                                                    }
                                                    if (setting_detail.tip_type == 1) {
                                                        tip_amount = (request_data_body.tip_amount * total_order_price) / 100;
                                                        tip_amount = utils.precisionRoundTwo(Number(tip_amount));
                                                    } else {
                                                        tip_amount = request_data_body.tip_amount;
                                                    }
                                                    total_provider_income = total_provider_income + +tip_amount;
                                                    let total = +total_delivery_price + +total_order_price + +tip_amount;
                                                    total = utils.precisionRoundTwo(Number(total));
                                                    let user_pay_payment = total;


                                                    cart.total_item_count = total_item_count;

                                                    Vehicle.findOne({ _id: service.vehicle_id }).then((vehicle_data) => {
                                                        if (!vehicle_data) {
                                                            vehicle_data = [];
                                                        } else {
                                                            vehicle_data = [vehicle_data];
                                                        }

                                                        Order_payment.findOne({ _id: cart.order_payment_id }).then((order_payment) => {

                                                            if (order_payment) {
                                                                // console.log('order payment')

                                                                let promo_id = order_payment.promo_id;
                                                                Promo_code.findOne({ _id: promo_id }).then((promo_code) => {
                                                                    if (promo_code) {
                                                                        promo_code.used_promo_code = promo_code.used_promo_code - 1;
                                                                        promo_code.save();
                                                                        user.promo_count = user.promo_count - 1;
                                                                        user.save();
                                                                    }
                                                                });

                                                                order_payment.cart_id = cart._id;
                                                                order_payment.is_min_fare_applied = is_min_fare_applied;
                                                                order_payment.order_id = null;
                                                                order_payment.order_unique_id = 0;
                                                                order_payment.store_id = null;
                                                                order_payment.user_id = cart.user_id;
                                                                order_payment.country_id = country_id;
                                                                order_payment.city_id = city_id;
                                                                order_payment.provider_id = null;
                                                                order_payment.promo_id = null;
                                                                order_payment.delivery_price_used_type = delivery_price_used_type;
                                                                order_payment.delivery_price_used_type_id = delivery_price_used_type_id;
                                                                order_payment.tip_amount = tip_amount;
                                                                order_payment.tip_value = request_data_body.tip_amount;
                                                                order_payment.currency_code = wallet_currency_code;
                                                                order_payment.admin_currency_code = "";
                                                                order_payment.order_currency_code = user.wallet_currency_code;
                                                                order_payment.current_rate = 1;
                                                                order_payment.admin_profit_mode_on_delivery = admin_profit_mode_on_delivery;
                                                                order_payment.admin_profit_value_on_delivery = admin_profit_value_on_delivery;
                                                                order_payment.total_admin_profit_on_delivery = total_admin_profit_on_delivery;
                                                                order_payment.total_provider_income = total_provider_income;
                                                                order_payment.admin_profit_mode_on_store = admin_profit_mode_on_store;
                                                                order_payment.admin_profit_value_on_store = admin_profit_value_on_store;
                                                                order_payment.total_admin_profit_on_store = total_admin_profit_on_store;
                                                                order_payment.total_store_income = total_store_income;
                                                                order_payment.total_distance = total_distance;
                                                                order_payment.total_time = total_time;
                                                                order_payment.is_distance_unit_mile = is_distance_unit_mile;
                                                                order_payment.is_store_pay_delivery_fees = is_store_pay_delivery_fees;
                                                                order_payment.total_service_price = total_service_price;
                                                                order_payment.total_sur_charge = total_sur_charge;
                                                                order_payment.total_admin_tax_price = total_admin_tax_price;
                                                                order_payment.total_after_tax_price = total_after_tax_price;
                                                                order_payment.total_surge_price = total_surge_price;
                                                                order_payment.total_delivery_price_after_surge = total_delivery_price_after_surge;
                                                                order_payment.total_cart_price = total_cart_price;
                                                                order_payment.total_delivery_price = total_delivery_price;
                                                                order_payment.total_item_count = total_item_count;
                                                                order_payment.service_tax = service_tax;
                                                                order_payment.item_tax = item_tax;
                                                                order_payment.total_store_tax_price = total_store_tax_price;
                                                                order_payment.total_order_price = total_order_price;
                                                                order_payment.promo_payment = 0;
                                                                order_payment.user_pay_payment = user_pay_payment;
                                                                order_payment.total = total;
                                                                order_payment.wallet_payment = 0;
                                                                order_payment.total_after_wallet_payment = 0;
                                                                order_payment.cash_payment = 0;
                                                                order_payment.card_payment = 0;
                                                                order_payment.remaining_payment = 0;
                                                                order_payment.delivered_at = null;
                                                                order_payment.is_order_payment_status_set_by_store = is_order_payment_status_set_by_store;
                                                                order_payment.is_user_pick_up_order = is_user_pick_up_order;
                                                                order_payment.save().then(() => {
                                                                    response_data.json({
                                                                        success: true,
                                                                        message: USER_MESSAGE_CODE.FARE_ESTIMATE_SUCCESSFULLY,
                                                                        server_time: server_time,
                                                                        currency: country.currency_sign,
                                                                        is_allow_contactless_delivery: setting_detail.is_allow_contactless_delivery,
                                                                        is_allow_user_to_give_tip: setting_detail.is_allow_user_to_give_tip,
                                                                        is_allow_pickup_order_verification: setting_detail.is_allow_pickup_order_verification,
                                                                        timezone: city_detail.timezone,
                                                                        tip_type: setting_detail.tip_type,
                                                                        order_payment: order_payment,
                                                                        vehicles: vehicle_data
                                                                    });

                                                                }, (error) => {
                                                                    console.log(error)
                                                                    response_data.json({
                                                                        success: false,
                                                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                    });
                                                                });
                                                            } else {
                                                                // console.log('new order payment')
                                                                /* ENTRY IN ORDER PAYMENT */
                                                                let order_payment = new Order_payment({
                                                                    cart_id: cart._id,
                                                                    store_id: null,
                                                                    user_id: cart.user_id,
                                                                    country_id: country_id,
                                                                    is_min_fare_applied: is_min_fare_applied,
                                                                    city_id: city_id,
                                                                    delivery_price_used_type: delivery_price_used_type,
                                                                    delivery_price_used_type_id: delivery_price_used_type_id,
                                                                    currency_code: wallet_currency_code,
                                                                    order_currency_code: user.wallet_currency_code,
                                                                    current_rate: 1, // HERE current_rate MEANS ORDER TO ADMIN CONVERT RATE
                                                                    wallet_to_admin_current_rate: 1,
                                                                    wallet_to_order_current_rate: 1,
                                                                    total_distance: total_distance,
                                                                    total_time: total_time,
                                                                    service_tax: service_tax,
                                                                    item_tax: item_tax,
                                                                    total_service_price: total_service_price,
                                                                    total_sur_charge: total_sur_charge,
                                                                    total_admin_tax_price: total_admin_tax_price,
                                                                    total_delivery_price: total_delivery_price,
                                                                    is_store_pay_delivery_fees: is_store_pay_delivery_fees,
                                                                    tip_amount: tip_amount,
                                                                    tip_value: request_data_body.tip_amount,
                                                                    total_item_count: total_item_count,
                                                                    total_cart_price: total_cart_price,
                                                                    total_store_tax_price: total_store_tax_price,
                                                                    user_pay_payment: user_pay_payment,
                                                                    total_order_price: total_order_price,
                                                                    promo_payment: promo_payment,
                                                                    total: total,
                                                                    admin_profit_mode_on_store: admin_profit_mode_on_store,
                                                                    admin_profit_value_on_store: admin_profit_value_on_store,
                                                                    total_admin_profit_on_store: total_admin_profit_on_store,
                                                                    total_store_income: total_store_income,
                                                                    admin_profit_mode_on_delivery: admin_profit_mode_on_delivery,
                                                                    admin_profit_value_on_delivery: admin_profit_value_on_delivery,
                                                                    total_admin_profit_on_delivery: total_admin_profit_on_delivery,
                                                                    total_provider_income: total_provider_income,
                                                                    is_user_pick_up_order: is_user_pick_up_order,
                                                                    is_order_payment_status_set_by_store: is_order_payment_status_set_by_store,
                                                                    is_distance_unit_mile: is_distance_unit_mile
                                                                });

                                                                order_payment.save().then(() => {

                                                                    cart.order_payment_id = order_payment._id;
                                                                    cart.save();
                                                                    response_data.json({
                                                                        success: true,
                                                                        message: USER_MESSAGE_CODE.FARE_ESTIMATE_SUCCESSFULLY,
                                                                        server_time: server_time,
                                                                        currency: country.currency_sign,
                                                                        is_allow_contactless_delivery: setting_detail.is_allow_contactless_delivery,
                                                                        is_allow_user_to_give_tip: setting_detail.is_allow_user_to_give_tip,
                                                                        is_allow_pickup_order_verification: setting_detail.is_allow_pickup_order_verification,
                                                                        timezone: city_detail.timezone,
                                                                        tip_type: setting_detail.tip_type,
                                                                        order_payment: order_payment,
                                                                        vehicles: vehicle_data
                                                                    });
                                                                }, (error) => {
                                                                    console.log(error)
                                                                    response_data.json({
                                                                        success: false,
                                                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                    });
                                                                });
                                                            }


                                                        });
                                                    })
                                                });
                                            } else {
                                                response_data.json({
                                                    success: false,
                                                    error_code: USER_ERROR_CODE.DELIVERY_SERVICE_NOT_AVAILABLE_IN_YOUR_CITY
                                                });
                                            }
                                        }, (error) => {
                                            console.log(error)
                                            response_data.json({
                                                success: false,
                                                error_code: USER_ERROR_CODE.DELIVERY_SERVICE_NOT_AVAILABLE_IN_YOUR_CITY
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
                            //     } else {
                            //         response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND});
                            //     }

                            // }, (error) => {
                            //     console.log(error)
                            //     response_data.json({
                            //         success: false,
                            //         error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            //     });
                            // });
                        } else {
                            response_data.json({ success: false, error_code: USER_ERROR_CODE.GET_ORDER_CART_INVOICE_FAILED });
                        }
                    }, (error) => {

                        console.log(error)
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        });
                    });

                }
                // } else {
                //     response_data.json({
                //         success: false,
                //         error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND
                //     });
                // }
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

// PAY ORDER PAYMENT
exports.pay_order_payment = function (request_data, response_data) {
    console.log("Request Data : "+request_data.body)
    utils.check_request_params(request_data.body, [{ name: 'order_payment_id', type: 'string' }, { name: 'is_payment_mode_cash' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let is_payment_mode_cash = request_data_body.is_payment_mode_cash;
            let order_type = Number(request_data_body.order_type);

            User.findOne({ _id: request_data_body.user_id }).then((user) => {
                if (user) {
                    if (order_type == ADMIN_DATA_ID.USER && request_data_body.server_token !== null && user.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {
                        if (user.wallet < 0) {
                            response_data.json({ success: false, error_code: USER_ERROR_CODE.YOUR_WALLET_AMOUNT_NEGATIVE });
                        } else {
                            Order_payment.findOne({ _id: request_data_body.order_payment_id }).then((order_payment) => {

                                if (order_payment) {
                                    Store.findOne({ _id: order_payment.store_id }).then((store) => {

                                        if ((store && store.is_approved && store.is_business) || request_data_body.store_delivery_id) {
                                            let query = {}
                                            if (store) {
                                                query = { _id: store.store_delivery_id }
                                            } else {
                                                query = { _id: request_data_body.store_delivery_id }
                                            }
                                            Delivery.findOne(query, function (error, delivery_type) {
                                                if (delivery_type && delivery_type.is_business) {
                                                    Country.findOne({ _id: order_payment.country_id }).then((country) => {



                                                        // ORDER CREATED COUNTRY // ORDER CHARGE IN THIS COUNTRY CURRENCY
                                                        if (country && country.is_business) {
                                                            let country_current_rate = country.currency_rate;

                                                            let wallet_currency_code = user.wallet_currency_code;
                                                            let admin_currency_code = "";
                                                            let order_currency_code = order_payment.order_currency_code;


                                                            let wallet_to_admin_current_rate = 1;
                                                            let wallet_to_order_current_rate = 1;
                                                            let current_rate = 1;

                                                            if (setting_detail) {
                                                                admin_currency_code = setting_detail.admin_currency_code;
                                                            } else {
                                                                admin_currency_code = wallet_currency_code;
                                                            }

                                                            utils.getCurrencyConvertRate(1, wallet_currency_code, order_currency_code, function (response) {
                                                                if (response.success) {
                                                                    wallet_to_order_current_rate = response.current_rate;
                                                                } else {
                                                                    wallet_to_order_current_rate = country_current_rate;
                                                                }

                                                                order_payment.wallet_to_order_current_rate = wallet_to_order_current_rate;

                                                                utils.getCurrencyConvertRate(1, order_currency_code, admin_currency_code, function (response) {

                                                                    if (response.success) {
                                                                        current_rate = response.current_rate;
                                                                    } else {
                                                                        current_rate = country_current_rate;
                                                                    }


                                                                    order_payment.current_rate = current_rate;

                                                                    if (wallet_currency_code == admin_currency_code) {
                                                                        wallet_to_admin_current_rate = 1;
                                                                    } else {
                                                                        wallet_to_admin_current_rate = order_payment.wallet_to_order_current_rate * order_payment.current_rate;
                                                                    }


                                                                    order_payment.wallet_to_admin_current_rate = wallet_to_admin_current_rate;

                                                                    order_payment.admin_currency_code = admin_currency_code;
                                                                    order_payment.is_payment_mode_cash = is_payment_mode_cash;


                                                                    let payment_id = request_data_body.payment_id;
                                                                    let user_id = request_data_body.user_id;
                                                                    let wallet_payment = 0;
                                                                    let total_after_wallet_payment = 0;
                                                                    let remaining_payment = 0;
                                                                    let user_wallet_amount = user.wallet;
                                                                    let total = order_payment.total;
                                                                    let is_store_pay_delivery_fees = order_payment.is_store_pay_delivery_fees;
                                                                    let user_pay_payment = order_payment.user_pay_payment;
                                                                    // if (is_store_pay_delivery_fees) {
                                                                    //     user_pay_payment = user_pay_payment - order_payment.total_delivery_price;
                                                                    // }
                                                                    if (user.is_use_wallet && user_wallet_amount > 0) {
                                                                        user_wallet_amount = user_wallet_amount * wallet_to_order_current_rate;
                                                                        if (user_wallet_amount >= user_pay_payment) {
                                                                            wallet_payment = user_pay_payment;
                                                                            order_payment.is_paid_from_wallet = true;
                                                                        } else {
                                                                            wallet_payment = user_wallet_amount;
                                                                        }
                                                                        order_payment.wallet_payment = wallet_payment;
                                                                        user_wallet_amount = user_wallet_amount - wallet_payment;

                                                                    } else {
                                                                        order_payment.wallet_payment = 0;
                                                                    }


                                                                    total_after_wallet_payment = user_pay_payment - wallet_payment;
                                                                    total_after_wallet_payment = utils.precisionRoundTwo(total_after_wallet_payment);
                                                                    order_payment.total_after_wallet_payment = total_after_wallet_payment;

                                                                    remaining_payment = total_after_wallet_payment;
                                                                    order_payment.remaining_payment = remaining_payment;

                                                                    console.log("Payment : "+order_payment.remaining_payment)

                                                                    if (!is_payment_mode_cash) {
                                                                        Payment_gateway.findOne({ _id: request_data_body.payment_id }).then(payment_method => {
                                                                            console.log(payment_method)
                                                                            order_payment.payment_id = payment_id;

                                                                            if (order_payment.remaining_payment > 0) {
                                                                                if (payment_method.name == 'Stripe') {
                                                                                    card_stripe.get_stripe_payment_intent({
                                                                                        payment_id: payment_id,
                                                                                        amount: order_payment.remaining_payment,
                                                                                        payment_method: request_data.body.payment_method,
                                                                                        user_id: user._id,
                                                                                        order_payment_id: order_payment._id,
                                                                                        token: request_data_body.token
                                                                                    }, function (payment_paid) {
                                                                                        if (payment_paid.success) {
                                                                                            order_payment.payment_intent_id = payment_paid.payment_intent_id;
                                                                                            order_payment.capture_amount = order_payment.remaining_payment;
                                                                                        }
                                                                                        /*if (order_payment.is_payment_paid) {
                                                                                            order_payment.is_payment_paid = true;
                                                                                            order_payment.cash_payment = 0;
                                                                                            order_payment.card_payment = order_payment.total_after_wallet_payment;
                                                                                            order_payment.remaining_payment = 0;
                                                                                        } else {
                                                                                            order_payment.is_payment_paid = false;
                                                                                            order_payment.cash_payment = 0;
                                                                                            order_payment.card_payment = order_payment.total_after_wallet_payment;
                                                                                        }*/

                                                                                        order_payment.save().then(() => {
                                                                                            console.log(payment_paid)
                                                                                            console.log('-----------payment paid------')
                                                                                            if (payment_paid.success) {
                                                                                                response_data.json({
                                                                                                    success: true,
                                                                                                    message: USER_MESSAGE_CODE.ORDER_PAYMENT_SUCCESSFULLY,
                                                                                                    is_payment_paid: order_payment.is_payment_paid,
                                                                                                    payment_method: payment_paid.payment_method,
                                                                                                    payment_intent_id: payment_paid.payment_intent_id,
                                                                                                    client_secret: payment_paid.client_secret,
                                                                                                });
                                                                                            } else {
                                                                                                console.log('--------error-----------')
                                                                                                response_data.json({
                                                                                                    success: false,
                                                                                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                                                });
                                                                                            }
                                                                                            //response_data.json(payment_paid);
                                                                                            /*if (!order_payment.is_payment_paid) {
                                                                                                response_data.json({
                                                                                                    success: false,
                                                                                                    error_code: USER_ERROR_CODE.YOUR_ORDER_PAYMENT_PENDING
                                                                                                });
                                                                                            } else {
                                                                                                if (wallet_payment > 0) {
                                                                                                    let wallet_information = { order_payment_id : order_payment._id };
                                                                                                    let total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.USER, user.unique_id, user._id, user.country_id
                                                                                                        , wallet_currency_code, order_currency_code, wallet_to_order_current_rate, wallet_payment, user.wallet,
                                                                                                        WALLET_STATUS_ID.REMOVE_WALLET_AMOUNT, WALLET_COMMENT_ID.ORDER_CHARGED, "Order Charged" , wallet_information );
                                                                                                    user.wallet = total_wallet_amount;
                                                                                                }
                                                                                                user.save();
                                                                                                response_data.json({
                                                                                                    success: true,
                                                                                                    message: USER_MESSAGE_CODE.ORDER_PAYMENT_SUCCESSFULLY,
                                                                                                    is_payment_mode_cash: is_payment_mode_cash,
                                                                                                    is_payment_paid: order_payment.is_payment_paid
                                                                                                });
        
                                                                                                if (setting_detail.is_mail_notification) {
                                                                                                    emails.sendUserOrderPaymentPaidEmail(request_data, user, order_currency_code + remaining_payment);
        
                                                                                                }
                                                                                            }*/

                                                                                        }, (error) => {
                                                                                            console.log(error)
                                                                                            response_data.json({
                                                                                                success: false,
                                                                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                                            });
                                                                                        });
                                                                                    });
                                                                                } else if (payment_method.name == 'Paystack') {
                                                                                    Card.findOne({ user_id: request_data_body.user_id, is_default: true }).then((card_detail) => {
                                                                                        if (card_detail) {
                                                                                            const params = JSON.stringify({
                                                                                                "email": user.email,
                                                                                                "amount": Math.round((order_payment.remaining_payment * 100)),
                                                                                                // currency : wallet_currency_code,
                                                                                                authorization_code: card_detail.payment_token
                                                                                            })
                                                                                            // console.log(params)
                                                                                            const options = {
                                                                                                hostname: 'api.paystack.co',
                                                                                                port: 443,
                                                                                                path: '/charge',
                                                                                                method: 'POST',
                                                                                                headers: {
                                                                                                    Authorization: 'Bearer ' + payment_method.payment_key,
                                                                                                    'Content-Type': 'application/json'
                                                                                                }
                                                                                            }
                                                                                            const https = require('https')
                                                                                            const request = https.request(options, res_data => {
                                                                                                let data = ''
                                                                                                res_data.on('data', (chunk) => {
                                                                                                    // console.log(chunk)
                                                                                                    data += chunk
                                                                                                });
                                                                                                res_data.on('end', () => {
                                                                                                    // console.log(data)
                                                                                                    let payment_response = JSON.parse(data);
                                                                                                    console.log(payment_response)
                                                                                                    if (payment_response.status) {
                                                                                                        if (payment_response.data.status == 'success') {
                                                                                                            order_payment.payment_intent_id = payment_response.data.reference;
                                                                                                            order_payment.capture_amount = order_payment.remaining_payment;
                                                                                                            order_payment.is_payment_paid = true;
                                                                                                            order_payment.cash_payment = 0;
                                                                                                            order_payment.card_payment = order_payment.remaining_payment;
                                                                                                            let remaining_payment = order_payment.remaining_payment;
                                                                                                            order_payment.remaining_payment = 0;
                                                                                                            order_payment.save().then(() => {
                                                                                                                if (setting_detail.is_mail_notification) {
                                                                                                                    emails.sendUserOrderPaymentPaidEmail(request_data, user, order_payment.order_currency_code + remaining_payment);
                                                                                                                }
                                                                                                                response_data.json({
                                                                                                                    success: true, message: USER_MESSAGE_CODE.ORDER_PAYMENT_SUCCESSFULLY,
                                                                                                                    is_payment_paid: order_payment.is_payment_paid, data: payment_response
                                                                                                                });
                                                                                                            })
                                                                                                        } else if (payment_response.data.status == 'open_url') {
                                                                                                            let json_response = { success: false, error_message: 'Please Try Another Card', url: payment_response.data.url }
                                                                                                            response_data.json(json_response)
                                                                                                        } else {
                                                                                                            order_payment.payment_intent_id = payment_response.data.reference;
                                                                                                            order_payment.capture_amount = order_payment.remaining_payment;
                                                                                                            order_payment.is_payment_paid = false
                                                                                                            order_payment.save().then(() => {
                                                                                                                let json_response = { success: false, reference: payment_response.data.reference, required_param: payment_response.data.status, data: payment_response }
                                                                                                                response_data.json(json_response)
                                                                                                            })
                                                                                                        }
                                                                                                    } else {
                                                                                                        if (payment_response.data) {
                                                                                                            response_data.json({ success: false, error_code: payment_response.data.message })
                                                                                                        } else {
                                                                                                            response_data.json({ success: false, error_message: payment_response.message })
                                                                                                        }
                                                                                                    }
                                                                                                })
                                                                                            }).on('error', error => {
                                                                                                console.error(error)
                                                                                            })
                                                                                            request.write(params)
                                                                                            request.end()


                                                                                        } else {
                                                                                            response_data.json({ success: false, error_code: CARD_ERROR_CODE.CARD_DATA_NOT_FOUND });
                                                                                        }
                                                                                    })

                                                                                }
                                                                            } else {

                                                                                order_payment.is_payment_paid = true;
                                                                                order_payment.card_payment = 0;
                                                                                order_payment.save().then(() => {

                                                                                    /*if (wallet_payment > 0) {
                                                                                        let wallet_information = { order_payment_id : order_payment._id };
                                                                                        let total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.USER, user.unique_id, user._id, user.country_id
                                                                                            , wallet_currency_code, order_currency_code, wallet_to_order_current_rate, wallet_payment, user.wallet,
                                                                                            WALLET_STATUS_ID.REMOVE_WALLET_AMOUNT, WALLET_COMMENT_ID.ORDER_CHARGED, "Order Charged" , wallet_information);
    
                                                                                        user.wallet = total_wallet_amount;
                                                                                    }
                                                                                    user.save();*/
                                                                                    if (setting_detail.is_mail_notification) {
                                                                                        emails.sendUserOrderPaymentPaidEmail(request_data, user, order_currency_code + order_payment.total);

                                                                                    }
                                                                                    response_data.json({
                                                                                        success: true,
                                                                                        message: USER_MESSAGE_CODE.ORDER_PAYMENT_SUCCESSFULLY,
                                                                                        is_payment_paid: order_payment.is_payment_paid
                                                                                    });

                                                                                }, (error) => {
                                                                                    console.log(error)

                                                                                    response_data.json({
                                                                                        success: false,
                                                                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                                    });

                                                                                });
                                                                            }
                                                                        })

                                                                    } else {
                                                                        order_payment.is_payment_paid = true;
                                                                        order_payment.remaining_payment = 0;
                                                                        order_payment.card_payment = 0;
                                                                        order_payment.cash_payment = order_payment.total_after_wallet_payment;

                                                                        order_payment.save().then(() => {   
                                                                            /*if (wallet_payment > 0) {
                                                                                let wallet_information = { order_payment_id : order_payment._id };
                                                                                let total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.USER, user.unique_id, user._id, user.country_id
                                                                                    , wallet_currency_code, order_currency_code, wallet_to_order_current_rate, wallet_payment, user.wallet,
                                                                                    WALLET_STATUS_ID.REMOVE_WALLET_AMOUNT, WALLET_COMMENT_ID.ORDER_CHARGED, "Order Charged" , wallet_information);
 
                                                                                user.wallet = total_wallet_amount;
                                                                            }
                                                                            user.save();*/
                                                                            if (order_type == ADMIN_DATA_ID.USER) {
                                                                                if (setting_detail.is_mail_notification) {
                                                                                    emails.sendUserOrderPaymentPaidEmail(request_data, user, order_currency_code + order_payment.total_after_wallet_payment);
                                                                                }
                                                                            }
                                                                            response_data.json({
                                                                                success: true,
                                                                                message: USER_MESSAGE_CODE.ORDER_PAYMENT_SUCCESSFULLY,
                                                                                is_payment_paid: order_payment.is_payment_paid
                                                                            });

                                                                        }, (error) => {
                                                                            console.log(error)

                                                                            response_data.json({
                                                                                success: false,
                                                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                            });
                                                                        });
                                                                    }

                                                                });
                                                            });
                                                        } else {
                                                            response_data.json({
                                                                success: false,
                                                                error_code: COUNTRY_ERROR_CODE.BUSINESS_NOT_IN_YOUR_COUNTRY
                                                            });
                                                        }

                                                    }, (error) => {
                                                        response_data.json({
                                                            success: false,
                                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                        });
                                                    });
                                                } else {
                                                    response_data.json({
                                                        success: false,
                                                        error_code: USER_ERROR_CODE.DELIVERY_SERVICE_NOT_AVAILABLE_IN_YOUR_CITY
                                                    });
                                                }
                                            });
                                        } else {
                                            response_data.json({
                                                success: false,
                                                error_code: STORE_ERROR_CODE.STORE_BUSINESS_OFF
                                            });
                                        }
                                    });

                                } else {
                                    response_data.json({
                                        success: false,
                                        error_code: USER_ERROR_CODE.CHECK_PAYMENT_FAILED
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
                    }
                } else {
                    response_data.json({
                        success: false,
                        error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND
                    });
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

// USER HISTORY DETAILS
exports.order_history_detail = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [{ name: 'order_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            User.findOne({ _id: request_data_body.user_id }).then((user_detail) => {
                if (user_detail) {
                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {

                        let user_condition = { "$match": { 'user_id': { $eq: mongoose.Types.ObjectId(request_data_body.user_id) } } };
                        let order_condition = { "$match": { '_id': { $eq: mongoose.Types.ObjectId(request_data_body.order_id) } } };

                        let order_status_condition = {
                            $match: {
                                $or: [{ order_status: { $eq: ORDER_STATE.STORE_REJECTED } },
                                { order_status: { $eq: ORDER_STATE.CANCELED_BY_USER } },
                                { order_status: { $eq: ORDER_STATE.STORE_CANCELLED } },
                                { order_status: { $eq: ORDER_STATE.ORDER_COMPLETED } }
                                ]
                            }
                        };

                        let order_status_id_condition = {
                            $match: {
                                $or: [{ order_status_id: { $eq: ORDER_STATUS_ID.CANCELLED } },
                                { order_status_id: { $eq: ORDER_STATUS_ID.REJECTED } },
                                { order_status_id: { $eq: ORDER_STATUS_ID.COMPLETED } },
                                ]

                            }
                        };

                        let review_query = {
                            $lookup:
                            {
                                from: "reviews",
                                localField: "_id",
                                foreignField: "order_id",
                                as: "reviews_detail"
                            }
                        };


                        Order.aggregate([order_condition, user_condition, order_status_condition, order_status_id_condition,]).then((orders) => {
                            if (orders.length != 0) {
                                let order_detail = orders[0];
                                let country_id = order_detail.country_id;

                                Store.findOne({ _id: order_detail.store_id }).then((store_data) => {

                                    Country.findOne({ _id: country_id }).then((country) => {
                                        let currency = "";
                                        if (country) {
                                            currency = country.currency_sign;
                                        }
                                        let current_provider = null;
                                        let date_time = [];
                                        Request.findOne({ _id: order_detail.request_id }).then((request_detail) => {
                                            if (request_detail) {
                                                current_provider = request_detail.current_provider;
                                                date_time = request_detail.date_time;
                                            }
                                            Provider.findOne({ _id: current_provider }).then((provider_data) => {
                                                Order_payment.findOne({ _id: order_detail.order_payment_id }).then((order_payment) => {
                                                    Cart.findOne({ _id: order_detail.cart_id }).then((cart_detail) => {
                                                        let provider_detail = {};
                                                        let store_detail = {};
                                                        let payment_gateway_name = "Cash";
                                                        if (order_payment.is_payment_mode_cash == false) {
                                                            payment_gateway_name = "Card";
                                                        }
                                                        Review.findOne({ order_id: orders[0]._id }).then(review_data => {
                                                            if (review_data) {
                                                                orders[0].user_rating_to_store = review_data.user_rating_to_store
                                                                orders[0].user_rating_to_provider = review_data.user_rating_to_provider
                                                            }


                                                            if (store_data) {
                                                                let store = JSON.parse(JSON.stringify(store_data))
                                                                store.name = store_data.name[Number(request_data.headers.lang)];
                                                                if (!store.name || store.name == '') {
                                                                    store.name = store_data.name[0];
                                                                }
                                                                if (!store.name) {
                                                                    store.name = "";
                                                                }
                                                                store_detail = {
                                                                    name: store.name,
                                                                    image_url: store_data.image_url,
                                                                    languages_supported: store_data.languages_supported,
                                                                    is_tax_included: store_data.is_tax_included,
                                                                    is_use_item_tax: store_data.is_use_item_tax
                                                                }
                                                            }

                                                            if (provider_data) {
                                                                provider_detail = {
                                                                    first_name: provider_data.first_name,
                                                                    last_name: provider_data.last_name,
                                                                    image_url: provider_data.image_url
                                                                }
                                                            }
                                                            response_data.json({
                                                                success: true,
                                                                message: USER_MESSAGE_CODE.GET_USER_ORDER_DETAIL_SUCCESSFULLY,
                                                                currency: currency,
                                                                order_payment: order_payment,
                                                                cart_detail: cart_detail,
                                                                store_detail: store_detail,
                                                                provider_detail: provider_detail,
                                                                payment_gateway_name: payment_gateway_name,
                                                                date_time: date_time,
                                                                request_detail: request_detail,
                                                                order_list: orders[0]
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
                                response_data.json({ success: false, error_code: STORE_ERROR_CODE.ORDER_DETAIL_NOT_FOUND });
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

                    response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND });
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

// USER HISTORY LIST
exports.order_history = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [{ name: 'start_date', type: 'string' }, { name: 'end_date', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            User.findOne({ _id: request_data_body.user_id }).then((user_detail) => {
                if (user_detail) {
                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {

                        let start_date = null, end_date = null;

                        if (request_data_body.start_date == '') {
                            start_date = new Date(0);
                        } else {
                            start_date = request_data_body.start_date;
                        }

                        if (request_data_body.end_date == '') {
                            end_date = new Date();
                        } else {
                            end_date = request_data_body.end_date;
                        }

                        start_date = new Date(start_date);
                        start_date = start_date.setHours(0, 0, 0, 0);
                        start_date = new Date(start_date);

                        end_date = new Date(end_date);
                        end_date = end_date.setHours(23, 59, 59, 999);
                        end_date = new Date(end_date);


                        let user_condition = { "$match": { 'user_id': { $eq: mongoose.Types.ObjectId(request_data_body.user_id) } } };
                        let order_status_condition = {
                            "$match": {
                                $or: [{
                                    order_status: ORDER_STATE.ORDER_COMPLETED,
                                    is_user_show_invoice: true
                                }, { order_status: ORDER_STATE.STORE_CANCELLED }, { order_status: ORDER_STATE.CANCELED_BY_USER }, { order_status: ORDER_STATE.STORE_REJECTED }]
                            }
                        };

                        let filter = { "$match": { "completed_date_in_city_timezone": { $gte: start_date, $lt: end_date } } };

                        let sort = { $sort: { unique_id: -1 } }
                        Order.aggregate([user_condition, order_status_condition, filter,

                            {
                                $project: {

                                    created_at: "$created_at",
                                    order_status: "$order_status",
                                    order_status_id: "$order_status_id",
                                    completed_at: "$completed_at",
                                    unique_id: "$unique_id",
                                    request_id: "$request_id",
                                    total: "$total",
                                    delivery_type: '$delivery_type',
                                    image_url: '$image_url',
                                    store_detail: { name: { $ifNull: [{ $arrayElemAt: ["$store_detail.name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$store_detail.name", 0] }, ""] }] }, phone: { $cond: ["$store_detail", "$store_detail.phone", ''] }, image_url: { $cond: ["$store_detail", "$store_detail.image_url", ''] } },
                                    destination_addresses: "$destination_addresses"

                                }
                            },
                            sort
                        ]).then((orders) => {

                            if (orders.length == 0) {
                                response_data.json({ success: false, error_code: USER_ERROR_CODE.ORDER_HISTORY_NOT_FOUND });
                            } else {
                                response_data.json({
                                    success: true,
                                    message: USER_MESSAGE_CODE.ORDER_HISTORY_SUCCESSFULLY,
                                    order_list: orders
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
                } else {

                    response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND });
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

//USER RATE TO PROVIDER 
exports.user_rating_to_provider = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'order_id', type: 'string' }, { name: 'user_rating_to_provider' }, { name: 'user_review_to_provider' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            User.findOne({ _id: request_data_body.user_id }).then((user_detail) => {
                if (user_detail) {
                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {

                        Order.findOne({ _id: request_data_body.order_id }).then((order) => {
                            if (order) {
                                Review.findOne({ order_id: order._id }).then((review) => {
                                    if (review) {
                                        let order_status = order.order_status;
                                        if (order_status == ORDER_STATE.ORDER_COMPLETED) {
                                            Request.findOne({ _id: order.request_id }).then((request) => {

                                                Provider.findOne({ _id: request.provider_id }).then((provider) => {
                                                    if (provider) {

                                                        let user_rating_to_provider = request_data_body.user_rating_to_provider;
                                                        review.user_rating_to_provider = user_rating_to_provider;
                                                        review.user_review_to_provider = request_data_body.user_review_to_provider;

                                                        let old_rate = provider.user_rate;
                                                        let old_rate_count = provider.user_rate_count;
                                                        let new_rate_counter = (old_rate_count + 1);
                                                        let new_rate = ((old_rate * old_rate_count) + user_rating_to_provider) / new_rate_counter;
                                                        new_rate = utils.precisionRoundTwo(Number(new_rate));
                                                        provider.user_rate = new_rate;
                                                        provider.user_rate_count = provider.user_rate_count + 1;
                                                        order.is_user_rated_to_provider = true;
                                                        order.is_user_show_invoice = true;
                                                        order.save().then(() => {
                                                            provider.save();
                                                            review.save();
                                                            response_data.json({
                                                                success: true,
                                                                message: USER_MESSAGE_CODE.GIVE_RATING_TO_PROVIDER_SUCCESSFULLY

                                                            });

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
                                            response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
                                        }
                                    } else {
                                        response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
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
                } else {

                    response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND });
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

// USER RATE TO STORE
exports.user_rating_to_store = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'order_id', type: 'string' }, { name: 'user_rating_to_store' }, { name: 'user_review_to_store' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            User.findOne({ _id: request_data_body.user_id }).then((user_detail) => {
                if (user_detail) {
                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {
                        Order.findOne({ _id: request_data_body.order_id }).then((order) => {

                            if (order) {
                                Review.findOne({ order_id: order._id }).then((review) => {
                                    if (review) {
                                        let order_status = order.order_status;
                                        if (order_status == ORDER_STATE.ORDER_COMPLETED) {
                                            Store.findOne({ _id: order.store_id }).then((store) => {
                                                if (store) {
                                                    let user_rating_to_store = request_data_body.user_rating_to_store;
                                                    review.user_rating_to_store = user_rating_to_store;
                                                    review.user_review_to_store = request_data_body.user_review_to_store;
                                                    let old_rate = store.user_rate;
                                                    let old_rate_count = store.user_rate_count;
                                                    let new_rate_counter = (old_rate_count + 1);
                                                    let new_rate = ((old_rate * old_rate_count) + user_rating_to_store) / new_rate_counter;
                                                    new_rate = utils.precisionRoundTwo(Number(new_rate));
                                                    store.user_rate = new_rate;
                                                    store.user_rate_count = store.user_rate_count + 1;
                                                    order.is_user_rated_to_store = true;
                                                    order.is_user_show_invoice = true;
                                                    order.save().then(() => {
                                                        store.save();
                                                        review.save();
                                                        response_data.json({
                                                            success: true,
                                                            message: USER_MESSAGE_CODE.GIVE_RATING_TO_STORE_SUCCESSFULLY

                                                        });
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
                                        } else {
                                            response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
                                        }
                                    } else {
                                        response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
                                    }

                                }, (error) => {
                                    console.log(error)
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });
                            } else {
                                response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
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
                    response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND });
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

// GET INVOICE
exports.get_invoice = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'order_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            User.findOne({ _id: request_data_body.user_id }).then((user) => {
                if (user) {
                    if (request_data_body.server_token !== null && user.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {

                        Order.findOne({ _id: request_data_body.order_id }).then((order_detail) => {
                            if (order_detail) {
                                Cart.findById(order_detail.cart_id).then(cart_details => {
                                    let is_use_item_tax = cart_details.is_use_item_tax
                                    let is_tax_included = cart_details.is_tax_included
                                    Country.findOne({ _id: order_detail.country_id }).then((country) => {
                                        let currency = "";
                                        if (country) {
                                            currency = country.currency_sign;
                                        }

                                        Order_payment.findOne({ _id: order_detail.order_payment_id }).then((order_payment_detail) => {
                                            if (order_payment_detail) {
                                                let current_provider = null;
                                                Request.findOne({ _id: order_detail.request_id }).then((request) => {
                                                    if (request) {
                                                        current_provider = request.current_provider;
                                                    }
                                                    Provider.findOne({ _id: current_provider }).then((provider_data) => {

                                                        let provider_detail = {};
                                                        if (provider_data) {
                                                            provider_detail = provider_data;
                                                        }

                                                        Payment_gateway.findOne({ _id: order_payment_detail.payment_id }).then((payment_gateway) => {
                                                            let payment_gateway_name = "Cash";
                                                            if (!order_payment_detail.is_payment_mode_cash) {
                                                                payment_gateway_name = payment_gateway.name;
                                                            }

                                                            response_data.json({
                                                                success: true,
                                                                message: USER_MESSAGE_CODE.GET_INVOICE_SUCCESSFULLY,
                                                                payment_gateway_name: payment_gateway_name,
                                                                currency: currency,
                                                                provider_detail: provider_detail,
                                                                order_detail: order_detail,
                                                                order_payment: order_payment_detail,
                                                                is_tax_included,
                                                                is_use_item_tax
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
                                                response_data.json({
                                                    success: false,
                                                    error_code: USER_ERROR_CODE.INVOICE_NOT_FOUND
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
                                })

                            } else {
                                response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
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
                    response_data.json({ success: false, error_code: ERROR_CODE.DETAIL_NOT_FOUND });
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

// Add_favourite_store
exports.add_favourite_store = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'store_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let store_id = request_data_body.store_id;
            User.findOne({ _id: request_data_body.user_id }).then((user_detail) => {
                if (user_detail) {

                    let favourite_stores = user_detail.favourite_stores;
                    let index = favourite_stores.indexOf(store_id);
                    if (index >= 0) {
                        favourite_stores.splice(index, 1);
                        user_detail.favourite_stores = favourite_stores;
                    }

                    favourite_stores.push(store_id);
                    user_detail.favourite_stores = favourite_stores;
                    user_detail.save().then(() => {

                        response_data.json({
                            success: true,
                            message: USER_MESSAGE_CODE.ADD_FAVOURITE_STORE_SUCCESSFULLY,
                            favourite_stores: user_detail.favourite_stores
                        });

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
        } else {
            response_data.json(response);
        }
    });
};

// Remove_favourite_store
exports.remove_favourite_store = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [{ name: 'store_id' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            User.findOne({ _id: request_data_body.user_id }).then((user_detail) => {
                if (user_detail) {

                    let fav_store = request_data_body.store_id;
                    let fav_store_list_size = 0;
                    fav_store_list_size = fav_store.length;
                    let fav_store_array = [];
                    for (i = 0; i < fav_store_list_size; i++) {
                        fav_store_array = user_detail.favourite_stores;
                        fav_store_array.splice(fav_store_array.indexOf(fav_store[i]), 1);
                        user_detail.favourite_stores = fav_store_array;
                    }

                    user_detail.save().then(() => {
                        response_data.json({
                            success: true, message: USER_MESSAGE_CODE.DELETE_FAVOURITE_STORE_SUCCESSFULLY,
                            favourite_stores: user_detail.favourite_stores
                        });
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
        } else {
            response_data.json(response);
        }
    });
};

// user get_order_detail
exports.get_order_detail = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [{ name: 'order_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            User.findOne({ _id: request_data_body.user_id }).then((user_detail) => {
                if (user_detail) {
                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {
                        let order_condition = { "$match": { '_id': { $eq: mongoose.Types.ObjectId(request_data_body.order_id) } } };


                        let store_query = {
                            $lookup:
                            {
                                from: "stores",
                                localField: "store_id",
                                foreignField: "_id",
                                as: "store_detail"
                            }
                        };
                        let array_to_json_store_detail = {
                            $unwind: {
                                path: "$store_detail",
                                preserveNullAndEmptyArrays: true
                            }
                        };

                        let store_tax_details = {
                            $lookup: {
                                from: "taxes",
                                localField: "store_detail.taxes",
                                foreignField: "_id",
                                as: "store_detail.store_tax_details"
                            }
                        }

                        let array_to_json_store_tax_detail = {
                            $unwind: {
                                path: "$store_detail.store_tax_details",
                                preserveNullAndEmptyArrays: true
                            }
                        };

                        let country_query = {
                            $lookup:
                            {
                                from: "countries",
                                localField: "order_payment_detail.country_id",
                                foreignField: "_id",
                                as: "country_detail"
                            }
                        };

                        let array_to_json_country_query = { $unwind: "$country_detail" };

                        let order_payment_query = {
                            $lookup:
                            {
                                from: "order_payments",
                                localField: "order_payment_id",
                                foreignField: "_id",
                                as: "order_payment_detail"
                            }
                        };
                        let array_to_json_order_payment_query = { $unwind: "$order_payment_detail" };


                        let payment_gateway_query = {
                            $lookup:
                            {
                                from: "payment_gateways",
                                localField: "order_payment_detail.payment_id",
                                foreignField: "_id",
                                as: "payment_gateway_detail"
                            }
                        };
                        let cart_query = {
                            $lookup:
                            {
                                from: "carts",
                                localField: "cart_id",
                                foreignField: "_id",
                                as: "cart_detail"
                            }
                        };

                        let array_to_json_cart_query = { $unwind: "$cart_detail" };


                        let request_query = {
                            $lookup:
                            {
                                from: "requests",
                                localField: "request_id",
                                foreignField: "_id",
                                as: "request_detail"
                            }
                        };

                        let array_to_json_request_query = {
                            $unwind: {
                                path: "$request_detail",
                                preserveNullAndEmptyArrays: true
                            }
                        };

                        let provider_query = {
                            $lookup:
                            {
                                from: "providers",
                                localField: "request_detail.provider_id",
                                foreignField: "_id",
                                as: "provider_detail"
                            }
                        };

                        let review_query = {
                            $lookup:
                            {
                                from: "reviews",
                                localField: "_id",
                                foreignField: "order_id",
                                as: "reviews_detail"
                            }
                        };

                        let table_booking_lookup = {
                            $lookup: {
                                from: "table_settings",
                                localField: "store_id",
                                foreignField: "store_id",
                                as: "table_settings_details"
                            }
                        }

                        let table_booking_unwind = {
                            $unwind: {
                                path: "$table_settings_details",
                                preserveNullAndEmptyArrays: true
                            }
                        }

                        let aggregate = [order_condition, order_payment_query, cart_query, request_query, store_query, array_to_json_store_detail, store_tax_details, array_to_json_request_query, provider_query, array_to_json_cart_query, array_to_json_order_payment_query, country_query, array_to_json_country_query, payment_gateway_query, review_query, table_booking_lookup, table_booking_unwind];
                        Order.aggregate(aggregate).then((order) => {

                            if (order.length === 0) {
                                response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0 });
                            } else {

                                let data = JSON.parse(JSON.stringify(order[0]));
                                data.total_order_price = data.order_payment_detail.total_order_price
                                if (order[0].store_detail.name) {
                                    data.store_detail.name = order[0].store_detail.name[Number(request_data.headers.lang)] ? order[0].store_detail.name[Number(request_data.headers.lang)] : order[0].store_detail.name[0];
                                    if (data.store_detail.name) {
                                        data.store_detail.name = order[0].store_detail.name[0]
                                    }
                                } else {
                                    order[0].store_detail = null
                                }
                                response_data.json({
                                    success: true,
                                    message: ORDER_MESSAGE_CODE.GET_ORDER_DATA_SUCCESSFULLY,
                                    is_confirmation_code_required_at_complete_delivery: setting_detail.is_confirmation_code_required_at_complete_delivery,
                                    order: data,
                                    server_time: new Date().toUTCString()
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
                } else {

                    response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND });
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

////get_favourite_store_list
exports.get_favourite_store_list = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            User.findOne({ _id: request_data_body.user_id }).then((user_detail) => {
                if (user_detail) {
                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {
                        let store_id_condition = { "$match": { '_id': { $in: user_detail.favourite_stores } } };
                        let store_approve_condition = { "$match": { 'is_approved': { $eq: true } } };
                        let city_lookup = {
                            $lookup:
                            {
                                from: "cities",
                                localField: "city_id",
                                foreignField: "_id",
                                as: "city_detail"
                            }
                        };
                        let array_to_json_city_detail = { $unwind: "$city_detail" };

                        let country_lookup = {
                            $lookup:
                            {
                                from: "countries",
                                localField: "country_id",
                                foreignField: "_id",
                                as: "country_detail"
                            }
                        };
                        // let array_to_json_country_detail = { $unwind: "$country_detail" };
                        let delivery_lookup = {
                            $lookup: {
                                from: "deliveries",
                                localField: "store_delivery_id",
                                foreignField: "_id",
                                as: "delivery_detail"
                            }
                        };
                        let table_settings_lookup = {
                            $lookup: {
                                from: "table_settings",
                                localField: "_id",
                                foreignField: "store_id",
                                as: "table_settings_details"
                            }
                        }

                        let table_settings_unwind = {
                            $unwind: {
                                path: "$table_settings_details",
                                preserveNullAndEmptyArrays: true
                            }
                        }
                        let array_to_json_delivery_detail = { $unwind: "$delivery_detail" };
                        let array_to_json_country_detail = { $unwind: "$country_detail" };
                        let server_time = new Date();
                        let project = {
                            $project: {
                                name: { $ifNull: [{ $arrayElemAt: ["$name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$name", 0] }, ""] }] },
                                _id: "$_id",
                                country_phone_code: "$country_phone_code",
                                phone: "$phone",
                                address: "$address",
                                image_url: "$image_url",
                                is_business: "$is_business",
                                min_order_price: "$min_order_price",
                                is_use_item_tax: "$is_use_item_tax",
                                item_tax: "$item_tax",
                                store_time: "$store_time",
                                is_visible: "$is_visible",
                                provider_rate_count: "$provider_rate_count",
                                provider_rate: "$provider_rate",
                                user_rate_count: "$user_rate_count",
                                user_rate: "$user_rate",
                                delivery_time: "$delivery_time",
                                is_provide_pickup_delivery: "$is_provide_pickup_delivery",
                                is_provide_delivery_anywhere: "$is_provide_delivery_anywhere",
                                delivery_time_max: "$delivery_time_max",
                                is_store_busy: "$is_store_busy",
                                famous_products_tags: "$famous_products_tags",
                                currency: "$currency",
                                price_rating: "$price_rating",
                                website_url: "$website_url",
                                location: "$location",
                                slogan: "$slogan",
                                languages_supported: "$languages_supported",
                                is_taking_schedule_order: "$is_taking_schedule_order",
                                free_delivery_within_radius: "$free_delivery_within_radius",
                                free_delivery_for_above_order_price: "$free_delivery_for_above_order_price",
                                is_store_pay_delivery_fees: "$is_store_pay_delivery_fees",
                                delivery_radius: "$delivery_radius",
                                is_store_can_create_group: "$delivery_detail.is_store_can_create_group",
                                city_detail: 1,
                                country_detail: 1,
                            }
                        }
                        Store.aggregate([store_id_condition, store_approve_condition, city_lookup, array_to_json_city_detail, country_lookup, array_to_json_country_detail, delivery_lookup, array_to_json_delivery_detail, table_settings_lookup, table_settings_unwind, project]).then((stores) => {

                            if (stores.length == 0) {
                                response_data.json({
                                    success: false,
                                    error_code: USER_ERROR_CODE.FAVOURITE_STORE_LIST_NOT_FOUND
                                });
                            } else {
                                response_data.json({
                                    success: true,
                                    message: USER_MESSAGE_CODE.GET_FAVOURITE_STORE_LIST_SUCCESSFULLY, server_time: server_time,
                                    favourite_stores: stores
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
                } else {

                    response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND });
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

//user_get_store_review_list
exports.user_get_store_review_list = function (request_data, response_data) {
    console.log('v3')
    utils.check_request_params(request_data.body, [{ name: 'store_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            Store.findOne({ _id: request_data_body.store_id }).then((store) => {
                if (store) {
                    let store_review_list = [];
                    let remaining_review_list = [];

                    let store_condition = { "$match": { 'store_id': { $eq: mongoose.Types.ObjectId(request_data_body.store_id) } } };
                    let review_condition = { "$match": { 'user_rating_to_store': { $gt: 0 } } };
                    Review.aggregate([store_condition, review_condition,
                        {
                            $lookup:
                            {
                                from: "users",
                                localField: "user_id",
                                foreignField: "_id",
                                as: "user_detail"
                            }
                        },
                        { "$unwind": "$user_detail" },

                        {
                            $project: {
                                id_of_users_like_store_comment: "$id_of_users_like_store_comment",
                                id_of_users_dislike_store_comment: "$id_of_users_dislike_store_comment",
                                user_rating_to_store: "$user_rating_to_store",
                                user_review_to_store: "$user_review_to_store",
                                created_at: "$created_at",
                                order_unique_id: "$order_unique_id",
                                user_detail: {
                                    first_name: "$user_detail.first_name",
                                    last_name: "$user_detail.last_name",
                                    image_url: "$user_detail.image_url"
                                }
                            }
                        },
                        {
                            $sort: { _id: -1 }
                        }
                    ]).then((store_review) => {

                        if (store_review.length > 0) {
                            store_review_list = store_review;
                        }

                        Review.find({
                            user_id: request_data_body.user_id,
                            store_id: request_data_body.store_id,
                            user_rating_to_store: 0
                        }, { "order_unique_id": 1, "order_id": 1 }).then((remaining_store_review) => {

                            if (remaining_store_review.length > 0) {
                                remaining_review_list = remaining_store_review;
                            }
                            response_data.json({
                                success: true,
                                message: USER_MESSAGE_CODE.GET_STORE_REVIEW_LIST_SUCCESSFULLY,
                                store_avg_review: store.user_rate,
                                store_review_list: store_review_list,
                                remaining_review_list: remaining_review_list

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

// user_like_dislike_store_review
exports.user_like_dislike_store_review = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'review_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            User.findOne({ _id: request_data_body.user_id }).then((user_detail) => {
                if (user_detail) {
                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {
                        Review.findOne({ _id: request_data_body.review_id }).then((review_detail) => {

                            if (review_detail) {

                                let is_user_clicked_like_store_review = Boolean(request_data_body.is_user_clicked_like_store_review);
                                let is_user_clicked_dislike_store_review = Boolean(request_data_body.is_user_clicked_dislike_store_review);
                                let id_of_users_like_store_comment = review_detail.id_of_users_like_store_comment;
                                let id_of_users_dislike_store_comment = review_detail.id_of_users_dislike_store_comment;

                                if (is_user_clicked_like_store_review == true) {

                                    let index = id_of_users_like_store_comment.indexOf(request_data_body.user_id);
                                    if (index < 0) {
                                        id_of_users_like_store_comment.push(request_data_body.user_id);
                                        review_detail.number_of_users_like_store_comment = review_detail.number_of_users_like_store_comment + 1
                                        review_detail.id_of_users_like_store_comment = id_of_users_like_store_comment;

                                    }
                                } else {

                                    let index = id_of_users_like_store_comment.indexOf(request_data_body.user_id);
                                    if (index >= 0) {
                                        id_of_users_like_store_comment.splice(index, 1);
                                        review_detail.number_of_users_like_store_comment = review_detail.number_of_users_like_store_comment - 1
                                        review_detail.id_of_users_like_store_comment = id_of_users_like_store_comment;
                                    }
                                }
                                if (is_user_clicked_dislike_store_review == true) {

                                    let index = id_of_users_dislike_store_comment.indexOf(request_data_body.user_id);
                                    if (index < 0) {
                                        id_of_users_dislike_store_comment.push(request_data_body.user_id);
                                        review_detail.number_of_users_dislike_store_comment = review_detail.number_of_users_dislike_store_comment + 1
                                        review_detail.id_of_users_dislike_store_comment = id_of_users_dislike_store_comment;

                                    }
                                } else {
                                    let index = id_of_users_dislike_store_comment.indexOf(request_data_body.user_id);
                                    if (index >= 0) {
                                        id_of_users_dislike_store_comment.splice(index, 1);
                                        review_detail.number_of_users_dislike_store_comment = review_detail.number_of_users_dislike_store_comment - 1
                                        review_detail.id_of_users_dislike_store_comment = id_of_users_dislike_store_comment;
                                    }
                                }

                                review_detail.save().then(() => {
                                    response_data.json({
                                        success: true,
                                        message: USER_MESSAGE_CODE.REVIEW_COMMENT_SUCCESSFULLY

                                    });
                                }, (error) => {
                                    console.log(error)
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });

                            } else {
                                response_data.json({ success: false, error_code: USER_ERROR_CODE.STORE_REVIEW_DATA_NOT_FOUND });
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
                    response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND });
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
exports.user_update_order = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'order_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let total_store_tax_price = 0;
            let total_cart_price = 0;
            User.findOne({ _id: request_data_body.user_id }).then((user) => {
                if (user) {
                    if (request_data_body.server_token !== null && user.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });

                    } else {
                        let query = {
                            $match: {
                                _id: { $eq: mongoose.Types.ObjectId(request_data_body.store_id) }
                            }
                        }
                        let tax_lookup = {
                            $lookup: {
                                from: "taxes",
                                localField: "taxes",
                                foreignField: "_id",
                                as: "tax_details"
                            }
                        }
                        Store.aggregate([query, tax_lookup]).then((store_details) => {
                            let store = store_details[0]
                            Order.findOne({ _id: request_data_body.order_id, store_id: request_data_body.store_id }).then((order) => {

                                if (order) {
                                    Cart.findOne({ _id: order.cart_id }).then((cart_detail) => {
                                        if (cart_detail) {
                                            cart_detail.is_tax_included = request_data_body.is_tax_included
                                            cart_detail.is_use_item_tax = request_data_body.is_use_item_tax
                                            cart_detail.save()

                                            cart_detail.order_details = request_data_body.order_details;
                                            cart_detail.total_item_count = request_data_body.total_item_count;
                                            total_cart_price = request_data_body.total_cart_price;

                                            if (store.is_use_item_tax) {
                                                if (request_data_body.total_item_tax) {
                                                    total_store_tax_price = request_data_body.total_item_tax;
                                                }
                                            } else {
                                                if (total_cart_price) {
                                                    //total_store_tax_price = total_cart_price * store.item_tax * 0.01; 

                                                    store.tax_details.forEach(tax => {
                                                        total_store_tax_price = total_store_tax_price + (total_cart_price * tax.tax * 0.01);
                                                    })
                                                } else {
                                                    total_cart_price = 0;
                                                }
                                            }
                                            total_store_tax_price = utils.precisionRoundTwo(Number(total_store_tax_price));

                                            cart_detail.total_cart_price = total_cart_price;
                                            cart_detail.total_item_tax = total_store_tax_price;
                                            cart_detail.save();


                                            Order_payment.findOne({ _id: order.order_payment_id }).then((order_payment) => {
                                                if (order_payment) {

                                                    let total_item_count = request_data_body.total_item_count;
                                                    let order_price = 0;
                                                    let total_order_price = 0;
                                                    let total_admin_profit_on_store = 0;
                                                    let total_store_income = 0;

                                                    let total = 0;
                                                    let item_tax = store.item_tax;
                                                    let admin_profit_mode_on_store = store.admin_profit_mode_on_store;
                                                    let admin_profit_value_on_store = store.admin_profit_value_on_store;


                                                    let is_store_pay_delivery_fees = false;
                                                    let is_payment_mode_cash = order_payment.is_payment_mode_cash;


                                                    order_price = +total_cart_price + +total_store_tax_price;
                                                    order_price = utils.precisionRoundTwo(Number(order_price));

                                                    switch (admin_profit_mode_on_store) {
                                                        case ADMIN_PROFIT_ON_ORDER_ID.PERCENTAGE: /* percentage */
                                                            total_admin_profit_on_store = order_price * admin_profit_value_on_store * 0.01;
                                                            break;
                                                        case ADMIN_PROFIT_ON_ORDER_ID.PER_ORDER: /* absolute per order */
                                                            total_admin_profit_on_store = admin_profit_value_on_store;
                                                            break;
                                                        case ADMIN_PROFIT_ON_ORDER_ID.PER_ITEMS: /* absolute value per items */
                                                            total_admin_profit_on_store = admin_profit_value_on_store * total_item_count;
                                                            break;
                                                        default: /* percentage */
                                                            total_admin_profit_on_store = order_price * admin_profit_value_on_store * 0.01;
                                                            break;
                                                    }

                                                    total_admin_profit_on_store = utils.precisionRoundTwo(Number(total_admin_profit_on_store));
                                                    total_store_income = order_price - total_admin_profit_on_store;
                                                    total_store_income = utils.precisionRoundTwo(Number(total_store_income));
                                                    /* ORDER CALCULATION END */

                                                    /* FINAL INVOICE CALCULATION START */
                                                    total_delivery_price = order_payment.total_delivery_price;
                                                    total_order_price = order_price;
                                                    let tip_amount = 0
                                                    if (!order_payment.tip_value) {
                                                        order_payment.tip_value = 0;
                                                    }
                                                    if (setting_detail.tip_type == 1) {
                                                        tip_amount = (order_payment.tip_value * total_order_price) / 100;
                                                        tip_amount = utils.precisionRoundTwo(Number(tip_amount));
                                                    } else {
                                                        tip_amount = order_payment.tip_value;
                                                    }
                                                    order_payment.total_provider_income = (order_payment.total_delivery_price - order_payment.total_admin_profit_on_delivery) + +tip_amount;
                                                    order_payment.tip_amount = tip_amount;

                                                    // Store Pay Delivery Fees Condition
                                                    if (total_order_price > store.free_delivery_for_above_order_price && store.is_store_pay_delivery_fees == true) {
                                                        is_store_pay_delivery_fees = true;
                                                    }

                                                    if (is_store_pay_delivery_fees) {
                                                        total = total_order_price + +tip_amount;
                                                    } else {
                                                        total = +total_delivery_price + +total_order_price + +tip_amount;
                                                    }

                                                    total = utils.precisionRoundTwo(Number(total));
                                                    //order_payment.total_after_wallet_payment = total;
                                                    if (order.order_type != ADMIN_DATA_ID.STORE) {
                                                        order.order_change = false;
                                                        order.user_order_change = true;
                                                        order.total = total;
                                                        order.save();
                                                    }

                                                    remaining_payment = total;
                                                    order_payment.remaining_payment = remaining_payment;

                                                    let store_have_service_payment = 0;
                                                    let store_have_order_payment = 0;
                                                    let total_store_have_payment = 0;
                                                    let pay_to_store = 0;
                                                    let total_provider_income = order_payment.total_provider_income;

                                                    if (is_store_pay_delivery_fees) {
                                                        store_have_service_payment = total_delivery_price;
                                                        store_have_service_payment = utils.precisionRoundTwo(Number(store_have_service_payment));
                                                    }

                                                    if (is_payment_mode_cash && !order_payment.is_order_price_paid_by_store) {
                                                        store_have_order_payment = total_order_price;
                                                        store_have_order_payment = utils.precisionRoundTwo(Number(store_have_order_payment));
                                                    }

                                                    total_store_have_payment = +store_have_service_payment + +store_have_order_payment;
                                                    total_store_have_payment = utils.precisionRoundTwo(Number(total_store_have_payment));
                                                    let other_promo_payment_loyalty = order_payment.other_promo_payment_loyalty;
                                                    //pay_to_store = total_store_income - total_store_have_payment - other_promo_payment_loyalty;
                                                    //pay_to_store = utils.precisionRoundTwo(Number(pay_to_store));
                                                    let provider_have_cash_payment = 0;
                                                    let provider_paid_order_payment = 0;
                                                    let total_provider_have_payment = 0;
                                                    let pay_to_provider = 0;
                                                    let user_pay_payment = total;

                                                    if (is_payment_mode_cash) {
                                                        provider_have_cash_payment = total;

                                                    }
                                                    if (is_payment_mode_cash && !order_payment.is_order_price_paid_by_store) {
                                                        provider_paid_order_payment = total_order_price;
                                                        provider_paid_order_payment = utils.precisionRoundTwo(Number(provider_paid_order_payment));
                                                        user_pay_payment = total_order_price + +tip_amount;
                                                    }

                                                    total_provider_have_payment = provider_have_cash_payment - provider_paid_order_payment;
                                                    total_provider_have_payment = utils.precisionRoundTwo(Number(total_provider_have_payment));
                                                    pay_to_provider = total_provider_income - total_provider_have_payment;
                                                    pay_to_provider = utils.precisionRoundTwo(Number(pay_to_provider));

                                                    order_payment.item_tax = item_tax;
                                                    order_payment.taxes = request_data_body.tax_details
                                                    //order_payment.pay_to_store = pay_to_store;
                                                    order_payment.pay_to_provider = pay_to_provider;
                                                    order_payment.total = total;
                                                    order_payment.total_delivery_price = total_delivery_price;
                                                    order_payment.total_order_price = total_order_price;
                                                    order_payment.total_cart_price = total_cart_price;

                                                    promo_code_controller.edit_order_apply_promo_code({
                                                        user_id: order.user_id,
                                                        store: store,
                                                        order_payment: order_payment,
                                                        promo_id: order_payment.promo_id,
                                                        order_payment_id: order_payment._id,
                                                    }, function (return_data) {
                                                        if (return_data.success == true) {
                                                            user_pay_payment = user_pay_payment - return_data.promo_payment;
                                                            order_payment.remaining_payment = order_payment.remaining_payment - return_data.promo_payment;
                                                            order_payment.is_promo_for_delivery_service = return_data.is_promo_for_delivery_service;
                                                            order_payment.other_promo_payment_loyalty = return_data.other_promo_payment_loyalty;
                                                            order_payment.promo_payment = return_data.promo_payment;
                                                        } else {

                                                            order_payment.is_promo_for_delivery_service = true;
                                                            order_payment.other_promo_payment_loyalty = 0;
                                                            order_payment.promo_payment = 0;

                                                        }
                                                        if (is_payment_mode_cash == false) {
                                                            if ((user_pay_payment - order_payment.capture_amount) > 0) {
                                                                let wallet_amount = user_pay_payment - order_payment.capture_amount;
                                                                order_payment.wallet_payment = wallet_amount;
                                                            }
                                                            if ((user_pay_payment - order_payment.capture_amount) <= 0) {
                                                                if (order_payment.capture_amount >= user_pay_payment) {
                                                                    order_payment.wallet_payment = 0;
                                                                } else {
                                                                    let wallet_amount = order_payment.capture_amount - user_pay_payment;
                                                                    order_payment.wallet_payment = order_payment.wallet_payment - wallet_amount;
                                                                }
                                                            }
                                                        } else {
                                                            if (user_pay_payment < order_payment.wallet_payment) {
                                                                order_payment.wallet_payment = user_pay_payment;
                                                            }
                                                        }
                                                        //user_pay_payment = user_pay_payment - order_payment.wallet_payment;
                                                        let total_after_wallet_payment = user_pay_payment - order_payment.wallet_payment;
                                                        total_after_wallet_payment = utils.precisionRoundTwo(total_after_wallet_payment);
                                                        order_payment.total_after_wallet_payment = total_after_wallet_payment;


                                                        order_payment.user_pay_payment = user_pay_payment;

                                                        if (is_payment_mode_cash) {
                                                            order_payment.cash_payment = total_after_wallet_payment;
                                                        } else {
                                                            order_payment.card_payment = total_after_wallet_payment;
                                                        }
                                                        order_payment.is_store_pay_delivery_fees = is_store_pay_delivery_fees;
                                                        order_payment.total_store_income = total_store_income;
                                                        order_payment.total_admin_profit_on_store = total_admin_profit_on_store;


                                                        order_payment.total_store_tax_price = total_store_tax_price;
                                                        order_payment.total_item_count = total_item_count;

                                                        let order_data = {
                                                            order_id: order._id,
                                                            unique_id: order.unique_id,
                                                            user_name: user.name,
                                                            user_image: user.image_url
                                                        }
                                                        utils.sendPushNotificationWithPushData(ADMIN_DATA_ID.STORE, store.device_type, store.device_token, STORE_PUSH_CODE.USER_ORDER_CHANGE, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, order_data, "");

                                                        order_payment.save(function (error) {

                                                            response_data.json({
                                                                success: true,
                                                                message: STORE_MESSAGE_CODE.STORE_ORDER_UPDATE_SUCCESSFULLY
                                                            });

                                                        }, (error) => {
                                                            console.log(error)
                                                            response_data.json({
                                                                success: false,
                                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                            });
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
                                        } else {
                                            response_data.json({ success: false, error_code: CART_ERROR_CODE.CART_NOT_FOUND });
                                        }
                                    }, (error) => {
                                        console.log(error)
                                        response_data.json({
                                            success: false,
                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                        });
                                    });
                                } else {
                                    response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
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
                    }
                } else {
                    response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND });
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
exports.read_chat = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: "order_id" }], function (response) {
        if (response.success) {
            request_data_body = request_data.body;

            let ref = fireDB.ref(request_data_body.order_id).child(request_data_body.chat_type);

            if (!request_data_body.sender_type) {
                request_data_body.sender_type = 1;
            }
            ref.once("value", function (snapshot) {
                if (snapshot) {
                    let chat_object = snapshot.val()
                    if (chat_object != null) {
                        let keys = Object.keys(chat_object)
                        keys.forEach((element, index) => {
                            if (chat_object[element].sender_type != request_data_body.sender_type && chat_object[element].is_read == false) {
                                ref.child(element).child("is_read").set(true)
                            }
                        });
                    }
                    response_data.json({ success: true, data: snapshot.val() });
                }
            });
        } else {
            response_data.json(response);
        }
    });
};
exports.send_chat = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: "order_id" }], function (response) {
        if (response.success) {
            request_data_body = request_data.body;
            let ref = fireDB.ref(request_data_body.order_id).child(request_data_body.chat_type);
            let key = ref.push().getKey()

            // chat_type
            // 12 (admin user)
            // 13 (admin provider)
            // 14 (admin store)
            // 23 (user provider)
            // 24 (user store)
            // 34 (provider store)

            //sender_type
            // 1 - admin 
            // 2 - user 
            // 3 - provider 
            // 4 - store

            ref.child(key).set({
                "id": key,
                "message": request_data_body.message,
                "chat_type": request_data_body.chat_type,
                "sender_type": request_data_body.sender_type,
                "receiver_id": request_data_body.receiver_id,
                "time": new Date().toISOString(),
                "is_read": false,
                "is_notify": false
            }, function (error) {
                if (error) {
                    response_data.json({ success: false })
                } else {
                    response_data.json({ success: true })
                }
            });
        } else {
            response_data.json(response);
        }
    });
};


exports.store_search = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [{ name: 'city_id' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let city_id = request_data_body.city_id


            let data = request_data_body.search_text.replace(/^\s+|\s+$/g, '');
            data = data.replace(/ +(?= )/g, '');
            data = new RegExp(data, "gi");

            let store_aggregate = [
                // {
                //     $match: { $text: { $search: request_data_body.search_text,$caseSensitive: false }, } 
                // },
                {
                    $match: {
                        $and: [
                            { "name": data },
                            { "is_approved": { "$eq": true } },
                            { "is_business": { "$eq": true } },
                            { "is_visible": { "$eq": true } },
                            { "city_id": { "$eq": mongoose.Types.ObjectId(city_id) } },
                        ]
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        image_url: 1
                    }
                }
            ];

            Store.aggregate(store_aggregate).then((stores) => {
                if (stores.length == 0) {
                    response_data.json({ success: false, error_code: USER_ERROR_CODE.STORE_LIST_NOT_FOUND });
                } else {
                    response_data.json({
                        success: true,
                        message: USER_MESSAGE_CODE.GET_STORE_LIST_SUCCESSFULLY,
                        stores: stores
                    });
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

exports.register_user_without_credentials = async function (request_data, response_data) {
    try {
        let request_data_body = request_data.body
        if (request_data_body.email) {
            await exports.user_register(request_data, response_data)
        } else {
            let store = await Store.findById(request_data_body.store_id)
            let user_first_name = request_data_body.first_name.trim()
            let user_last_name = request_data_body.last_name.trim()
            if (!store) {
                return response_data.json({
                    success: false,
                    error_code: STORE_ERROR_CODE.STORE_NOT_FOUND
                })
            }
            let newUser = new User({
                user_type: ADMIN_DATA_ID.ADMIN,
                admin_type: ADMIN_DATA_ID.USER,
                user_type_id: null,
                first_name: user_first_name,
                last_name: user_last_name,
                wallet_currency_code: store.wallet_currency_code,
                country_id: store.country_id,
            })

            let user;
            let user_detail = await User.find({ first_name: user_first_name, last_name: user_last_name })
            if (user_detail.length === 0) {
                user = await newUser.save()
            } else {
                user = user_detail[0]
            }
            if (!user) {
                return response_data.json({
                    success: false,
                    error_code: USER_ERROR_CODE.USER_NOT_FOUND
                })
            }
            let cart = await Cart.findOne({ cart_unique_token: request_data_body.cart_unique_token })
            if (!cart) {
                return response_data.json({
                    success: false,
                    error_code: CART_ERROR_CODE.CART_NOT_FOUND
                })
            }
            console.log(user)
            cart.user_id = user._id
            user.cart_id = cart._id
            await cart.save()
            await user.save().then(() => {
                response_data.json({
                    success: true, user,
                    message: USER_MESSAGE_CODE.REGISTER_SUCCESSFULLY
                })
            }).catch(error => {
                console.log(error)
                response_data.json({
                    success: false,
                    error_code: USER_ERROR_CODE.REGISTRATION_FAILED
                })
            })
        }
    } catch (error) {
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        })
    }
}


exports.get_favoutire_addresses = async function (request_data, response_data) {
    let request_data_body = request_data.body;

    let user = await User.findOne({ _id: request_data_body.id });
    if (user) {
        if (request_data_body.server_token !== null && user.server_token !== request_data_body.server_token) {
            response_data.json({
                success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN
            });
        } else {
            response_data.json({
                success: true, favourite_addresses: user.favourite_addresses
            })
        }
    }
    else {
        response_data.json({
            success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND
        });
    }
};

exports.add_favourite_address = async function (request_data, response_data) {
    let request_data_body = request_data.body;

    let user = await User.findOne({ _id: request_data_body.user_id });
    if (user) {
        if (request_data_body.server_token !== null && user.server_token !== request_data_body.server_token) {
            response_data.json({
                success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN
            });
        } else {
            let Schema = mongoose.Types.ObjectId;
            let x = new Schema();
            let favourite_adress = {
                _id: x,
                latitude: request_data_body.latitude,
                longitude: request_data_body.longitude,
                address: request_data_body.address,
                address_name: request_data_body.address_name,
                street: request_data_body.street,
                flat_no: request_data_body.flat_no,
                landmark: request_data_body.landmark,
                country: request_data_body.country,
                country_code: request_data_body.country_code
            }

            user.favourite_addresses.push(favourite_adress)
            await user.save()
            response_data.json({
                success: true, favourite_addresses: user.favourite_addresses
            })
        }
    }
    else {
        response_data.json({
            success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND
        });
    }
};

exports.update_favourite_address = async function (request_data, response_data) {
    let request_data_body = request_data.body;
    console.log('-------------user favorite address-----------')
    console.log(request_data_body)
    let user = await User.findOne({ _id: request_data_body.user_id });
    if (!user) {
        return response_data.json({
            success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND
        });
    }
    if (request_data_body.server_token !== null && user.server_token !== request_data_body.server_token) {
        return response_data.json({
            success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN
        });
    } else {
        let index = user.favourite_addresses.findIndex((x) => x._id == request_data_body.address_id);
        console.log(user.favourite_addresses[index])
        if (index === -1) {
            return response_data.json({
                success: false, favourite_addresses: user.favourite_addresses
            })
        }
        user.favourite_addresses[index].latitude = request_data_body.latitude;
        user.favourite_addresses[index].longitude = request_data_body.longitude;
        user.favourite_addresses[index].address = request_data_body.address;
        user.favourite_addresses[index].address_name = request_data_body.address_name;
        user.favourite_addresses[index].street = request_data_body.street;
        user.favourite_addresses[index].flat_no = request_data_body.flat_no;
        user.favourite_addresses[index].landmark = request_data_body.landmark;
        user.favourite_addresses[index].country = request_data_body.country;
        user.favourite_addresses[index].country_code = request_data_body.country_cod;
        user.markModified('favourite_addresses')
        console.log(user.favourite_addresses[index])
        await user.save()
        return response_data.json({
            success: true, favourite_addresses: user.favourite_addresses
        })

    }
};

exports.delete_favourite_address = async function (request_data, response_data) {
    let request_data_body = request_data.body;

    let user = await User.findOne({ _id: request_data_body.user_id });
    if (user) {
        if (request_data_body.server_token !== null && user.server_token !== request_data_body.server_token) {
            response_data.json({
                success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN
            });
        } else {
            // request_data_body.address_ids.forEach(function (address_id) {
            let index = user.favourite_addresses.findIndex((x) => x._id == request_data_body.address_id);
            if (index !== -1) {
                user.favourite_addresses.splice(index, 1)
            }
            // })

            user.markModified('favourite_addresses')
            await user.save()
            response_data.json({
                success: true, favourite_addresses: user.favourite_addresses
            })
        }
    }
    else {
        response_data.json({
            success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND
        });
    }
};

exports.get_user_cancellation_reasons = function (request_data, response_data) {
    Cancellation_reason.aggregate([{$match: {user_type: ADMIN_DATA_ID.USER}},{$group: {_id: null, reason_list: {$push: { $ifNull: [{ $arrayElemAt: ["$reason", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$reason", 0] }, ""] }] }}}}]).then((reasons)=>{
        if(reasons.length > 0 && reasons[0].reason_list.length > 0){
            response_data.json({ success: true, reasons: reasons[0].reason_list })
        } else {
            response_data.json({ success: true, reasons: [] })
        }
    })
};


