'use strict';
require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
let moment = require('moment');
let utils = require('../../utils/utils');
let emails = require('../../controllers/email_sms/emails');
let my_request = require('../../controllers/store/request');
let mongoose = require('mongoose');
let pad = require('pad-left');
let SMS = require('../../controllers/email_sms/sms');
let wallet_history = require('../../controllers/user/wallet');
let Store = require('mongoose').model('store');
let Franchise = require('mongoose').model('franchise');
let Country = require('mongoose').model('country');
let City = require('mongoose').model('city');
let Cart = require('mongoose').model('cart');
let Provider = require('mongoose').model('provider');
let User = require('mongoose').model('user');
let Order = require('mongoose').model('order');
let Vehicle = require('mongoose').model('vehicle');
let Payment_gateway = require('mongoose').model('payment_gateway');
let promo_code_controller = require('../../controllers/user/promo_code');
let Order_payment = require('mongoose').model('order_payment');
let Review = require('mongoose').model('review');
let Referral_code = require('mongoose').model('referral_code');
let Request = require('mongoose').model('request');
let Installation_setting = require('mongoose').model('installation_setting');
let SubStore = require('mongoose').model('SubStore');
let SubCategory = require('mongoose').model('sub_category');
let Delivery = require('mongoose').model('delivery');
let Documents = require('mongoose').model('document')
let Promo_code = require('mongoose').model('promo_code');
let Pages = require('mongoose').model('pages');
let geolib = require('geolib');
let Otp = require('mongoose').model('Otp');
let Table_Settings = require('mongoose').model('table_settings')
var Cancellation_reason = require('mongoose').model('cancellation_reason');

let console = require('../../utils/console');
const { response } = require('express');

let Service = require('mongoose').model('service');
// store register api 

exports.store_register = function (request_data, response_data) {

    let admin = fireUser
    utils.check_request_params(request_data.body, [{ name: 'city_id', type: 'string' }, { name: 'country_id', type: 'string' },
    { name: 'email', type: 'string' }, { name: 'store_delivery_id', type: 'string' }, { name: 'phone', type: 'string' }, { name: 'country_phone_code', type: 'string' }
        , { name: 'latitude' }, { name: 'longitude' }], function (response) {
            if (response.success) {
                utils.verify_captcha(request_data.body.captcha_token, request_data.body.device_type, 2, function (response) {
                    if (response.success) {

                        let request_data_body = request_data.body;
                        let social_id = request_data_body.social_id;
                        let social_id_array = [];
                        let is_document_uploaded = false

                        if (social_id == undefined || social_id == null || social_id == "") {
                            social_id = null;
                        } else {
                            social_id_array.push(social_id);
                        }

                        var subCategory_id = {"$match": {'sub_category_id': {$eq: null}}};
                        if(request_data_body.sub_category_id != undefined)
                        {
                            subCategory_id = {"$match": {'sub_category_id': {$eq: mongoose.Types.ObjectId(request_data_body.sub_category_id)}}};
                        }

                        if (request_data_body.slogan === '' || request_data_body.slogan === 'null' || request_data_body.slogan === null) {
                            request_data_body.slogan = ""
                        }

                        Installation_setting.findOne({}).then((installation_setting) => {

                            Country.findOne({ _id: request_data_body.country_id }).then((country) => {
                                if (country) {
                                    City.findOne({ _id: request_data_body.city_id }).then((city) => {
                                        if (city) {
                                            let timezone = city.timezone;
                                            Store.findOne({ social_ids: { $all: social_id_array } }).then((store_data) => {
                                                if (store_data) {
                                                    response_data.json({ success: false, error_code: STORE_ERROR_CODE.STORE_ALREADY_REGISTER_WITH_SOCIAL });
                                                } else {
                                                    Store.findOne({ email: request_data_body.email }).then((store_data) => {
                                                        if (store_data) {
                                                            if (social_id != null && store_data.social_ids.indexOf(social_id) < 0) {
                                                                Delivery.findOne({ _id: store_data.store_delivery_id }).then((delivery_data) => {
                                                                    store_data.social_ids.push(social_id);
                                                                    store_data.save();
                                                                    response_data.json({
                                                                        success: true,
                                                                        message: STORE_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                                                        timezone: timezone, country_detail: country,
                                                                        currency: country.currency_sign,
                                                                        is_store_can_create_group: delivery_data.is_store_can_create_group,
                                                                        is_store_can_edit_order: delivery_data.is_store_can_edit_order,
                                                                        minimum_phone_number_length: country.minimum_phone_number_length,
                                                                        maximum_phone_number_length: country.maximum_phone_number_length,
                                                                        store: store_data
                                                                    });
                                                                });
                                                            } else {

                                                                response_data.json({ success: false, error_code: STORE_ERROR_CODE.EMAIL_ALREADY_REGISTRED });
                                                            }
                                                        } else {

                                                            Store.findOne({ phone: request_data_body.phone }).then((store_data1) => {
                                                                Documents.find({ country_id: country._id, document_for: ADMIN_DATA_ID.STORE }).then(documents => {
                                                                    console.log('-----------------document----------------')

                                                                    if (documents && documents.length === 0) {
                                                                        is_document_uploaded = true
                                                                    }

                                                                    if (store_data1) { 
                                                                        if (social_id != null && store_data1.social_ids.indexOf(social_id) < 0) {
                                                                            Delivery.findOne({ _id: store_data1.store_delivery_id }).then((delivery_data) => {
                                                                                store_data1.social_ids.push(social_id);
                                                                                store_data1.save();
                                                                                response_data.json({
                                                                                    success: true,
                                                                                    message: STORE_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                                                                    timezone: timezone, country_detail: country,
                                                                                    currency: country.currency_sign,
                                                                                    is_store_can_create_group: delivery_data.is_store_can_create_group,
                                                                                    is_store_can_edit_order: delivery_data.is_store_can_edit_order,
                                                                                    minimum_phone_number_length: country.minimum_phone_number_length,
                                                                                    maximum_phone_number_length: country.maximum_phone_number_length,
                                                                                    store: store_data1
                                                                                });
                                                                            });
                                                                        } else {

                                                                            response_data.json({ success: false, error_code: STORE_ERROR_CODE.PHONE_NUMBER_ALREADY_REGISTRED });

                                                                        }



                                                                    } else {
                                                                        let name = (request_data_body.name).trim();
                                                                        name = name.charAt(0).toUpperCase() + name.slice(1);


                                                                        let server_token = utils.generateServerToken(32);


                                                                        let store_data = new Store({
                                                                            store_type: ADMIN_DATA_ID.ADMIN,
                                                                            admin_type: ADMIN_DATA_ID.STORE,
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
                                                                            is_document_uploaded,
                                                                            social_ids: social_id_array,
                                                                            login_by: request_data_body.login_by,
                                                                            free_delivery_for_above_order_price: request_data_body.free_delivery_for_above_order_price,
                                                                            location: [request_data_body.latitude, request_data_body.longitude]
                                                                        });
                                                                        if (request_data_body.franchise_id) {
                                                                            store_data.franchise_id = request_data_body.franchise_id;
                                                                        }
                                                                        let image_file = request_data.files;

                                                                        if (image_file != undefined && image_file.length > 0) {
                                                                            let image_name = store_data._id + utils.generateServerToken(4);
                                                                            let url = utils.getStoreImageFolderPath(FOLDER_NAME.STORE_PROFILES) + image_name + FILE_EXTENSION.STORE;

                                                                            store_data.image_url = url;
                                                                            utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.STORE, FOLDER_NAME.STORE_PROFILES);

                                                                        }

                                                                        if (social_id == undefined || social_id == null || social_id == "") {
                                                                            store_data.password = utils.encryptPassword(request_data_body.password);
                                                                        }


                                                                        let timezone = city.timezone;

                                                                        if (country && setting_detail) {

                                                                            let referral_code = utils.generateReferralCode(ADMIN_DATA_ID.ADMIN, country.country_code, name, name);
                                                                            store_data.referral_code = referral_code;

                                                                            let wallet_currency_code = country.currency_code;

                                                                            let wallet_to_admin_current_rate = 1;

                                                                            let referral_bonus_to_store = country.referral_bonus_to_store;
                                                                            let referral_bonus_to_store_friend = country.referral_bonus_to_store_friend;

                                                                            store_data.wallet_currency_code = wallet_currency_code;

                                                                            let country_id = country._id;

                                                                            store_data.save().then((store) => {

                                                                                new Table_Settings({
                                                                                    store_id: store._id
                                                                                }).save().then(settings => {
                                                                                    console.log(settings)
                                                                                }).catch(error => {
                                                                                    console.log(error)
                                                                                })

                                                                                if (request_data_body.franchise_id) {
                                                                                    Franchise.findOne({ _id: request_data_body.franchise_id }, function (err, franchise_detail) {
                                                                                        franchise_detail.store_ids.push(store_data._id);
                                                                                        franchise_detail.markModified('store_ids');
                                                                                        franchise_detail.save();
                                                                                    })
                                                                                }
                                                                                let url = 'https://api.branch.io/v1/url/';


                                                                                let request = require('request');
                                                                                let BRANCH_KEY = installation_setting.branch_io_key;
                                                                                request({
                                                                                    uri: url,
                                                                                    method: "POST",
                                                                                    form: {
                                                                                        branch_key: BRANCH_KEY,
                                                                                        stage: "'" + store_data._id + "'"
                                                                                    }
                                                                                }, function (error, response, body) {
                                                                                    if (!error && body) {
                                                                                        let json = JSON.parse(body);
                                                                                        store_data.branchio_url = json.url;
                                                                                    }
                                                                                    utils.insert_documets_for_new_users(store_data, null, ADMIN_DATA_ID.STORE, country_id, function (document_response) {
                                                                                        store_data.is_document_uploaded = document_response.is_document_uploaded;
                                                                                        if (request_data_body.referral_code && request_data_body.referral_code != "") {

                                                                                            Store.findOne({ referral_code: request_data_body.referral_code }, function (error, store) {

                                                                                                if (store) {
                                                                                                    let store_refferal_count = store.total_referrals;
                                                                                                    if (store_refferal_count < country.no_of_store_use_referral) {
                                                                                                        store.total_referrals = +store.total_referrals + 1;

                                                                                                        // Entry in wallet Table //
                                                                                                        let total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.STORE, store.unique_id, store._id, store.country_id, wallet_currency_code, wallet_currency_code,
                                                                                                            1, referral_bonus_to_store, store.wallet, WALLET_STATUS_ID.ADD_WALLET_AMOUNT, WALLET_COMMENT_ID.ADDED_BY_REFERRAL, "Using Refferal : " + request_data_body.referral_code);


                                                                                                        store.wallet = total_wallet_amount;
                                                                                                        store.save();

                                                                                                        store_data.is_referral = true;
                                                                                                        store_data.referred_by = store._id;

                                                                                                        // Entry in wallet Table //

                                                                                                        let new_total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.STORE, store_data.unique_id, store_data._id, store_data.country_id, wallet_currency_code, wallet_currency_code,
                                                                                                            1, referral_bonus_to_store_friend, store_data.wallet, WALLET_STATUS_ID.ADD_WALLET_AMOUNT, WALLET_COMMENT_ID.ADDED_BY_REFERRAL, "Using Refferal : " + request_data_body.referral_code);

                                                                                                        store_data.wallet = new_total_wallet_amount;

                                                                                                        store_data.save();


                                                                                                        // Entry in referral_code Table //
                                                                                                        let referral_code = new Referral_code({
                                                                                                            user_type: ADMIN_DATA_ID.STORE,
                                                                                                            user_id: store._id,
                                                                                                            user_unique_id: store.unique_id,
                                                                                                            user_referral_code: store.referral_code,
                                                                                                            referred_id: store_data._id,
                                                                                                            referred_unique_id: store_data.unique_id,
                                                                                                            country_id: store_data.country_id,
                                                                                                            current_rate: 1,
                                                                                                            referral_bonus_to_user_friend: referral_bonus_to_store_friend,
                                                                                                            referral_bonus_to_user: referral_bonus_to_store,
                                                                                                            currency_sign:country.currency_sign

                                                                                                        });
                                                                                                        utils.getCurrencyConvertRate(1, wallet_currency_code, setting_detail.admin_currency_code, function (response) {

                                                                                                            if (response.success) {
                                                                                                                wallet_to_admin_current_rate = response.current_rate;
                                                                                                            } else {
                                                                                                                wallet_to_admin_current_rate = 1;
                                                                                                            }

                                                                                                            wallet_to_admin_current_rate = wallet_to_admin_current_rate;
                                                                                                            referral_code.current_rate = wallet_to_admin_current_rate;
                                                                                                            referral_code.save();
                                                                                                        });
                                                                                                    }

                                                                                                }
                                                                                            });

                                                                                        }
                                                                                        // store_data.save();
                                                                                        if (setting_detail.is_mail_notification) {
                                                                                            //sendStoreRegisterEmail
                                                                                            emails.sendStoreRegisterEmail(request_data, store_data, store_data.name);
                                                                                        }
                                                                                        // utils.create_user(store_data, ADMIN_DATA_ID.STORE, response => {
                                                                                        //     if (response.success) {
                                                                                        //         store_data.uid = response.user.uid

                                                                                        //         store_data.save().then(store => {
                                                                                        utils.create_user_token(store, ADMIN_DATA_ID.STORE, response => {
                                                                                            if (response.success) {
                                                                                                store.firebase_token = response.user_token
                                                                                            } else {
                                                                                                store.firebase_token = ""
                                                                                            }
                                                                                            store.save().then(result => {
                                                                                                Delivery.findOne({ _id: store_data.store_delivery_id }).then((delivery_data) => {
                                                                                                    response_data.json({
                                                                                                        success: true,
                                                                                                        message: STORE_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                                                                                        timezone: timezone,
                                                                                                        country_detail: country,
                                                                                                        currency: country.currency_sign,
                                                                                                        is_store_can_create_group: delivery_data.is_store_can_create_group,
                                                                                                        is_store_can_edit_order: delivery_data.is_store_can_edit_order,
                                                                                                        minimum_phone_number_length: country.minimum_phone_number_length,
                                                                                                        maximum_phone_number_length: country.maximum_phone_number_length,
                                                                                                        store: store_data,
                                                                                                        firebase_token: response.user_token
                                                                                                    });
                                                                                                });
                                                                                            }).catch(error => {
                                                                                                console.log(error)
                                                                                                response_data.json({
                                                                                                    success: false,
                                                                                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                                                })
                                                                                            })
                                                                                        })
                                                                                            //     }).catch(error => {
                                                                                            //         response_data.json({
                                                                                            //             success: false,
                                                                                            //             error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                                            //         })
                                                                                            //     })
                                                                                            // } else {
                                                                                            //     response_data.json({
                                                                                            //         success: false,
                                                                                            //         error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                                            //     })
                                                                                            // }
                                                                                        // })
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
                                                                })
                                                            }, (error)=>{
                                                                console.log(error)
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
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.INVALID_CAPTCHA
                        })
                    }
                })
            } else {
                response_data.json(response);
            }
        });
};

exports.get_store_detail = function (request_data, response_data) {
    let request_data_body = request_data.body;
    let query
    if (request_data_body.store_id) {
        query = { '_id': request_data_body.store_id };
    } else {
        query = { 'domain_name': request_data_body.domain_name };
    }
    let server_time = new Date();
    Store.findOne(query).then((store_detail) => {
        if (store_detail) {
            Country.findOne({ _id: store_detail.country_id }).then((country) => {
                City.findOne({ _id: store_detail.city_id }).then((city) => {
                    // Promo_code.find(
                    //     { $and: [
                    //     { $or:[{created_id: store_detail._id},{created_by:ADMIN_DATA_ID.ADMIN},] },
                    //     {country_id:mongoose.Types.ObjectId(country._id)},{ is_approved: true },
                    //     {is_active: true}, 
                    //     { $or: [
                    //         { is_promo_have_date: false }, 
                    //         { $and: [
                    //             { is_promo_have_date: true }, 
                    //             { promo_start_date: { $lt: server_time } }, 
                    //             { promo_expire_date: { $gt: server_time } }
                    //         ] }
                    //     ] }
                    // ] })
                    let country_filter = {
                        $match: {
                            country_id: store_detail.country_id
                        }
                    }
                    let promo_filter = {
                        $match: {
                            $or: [
                                {
                                    $and: [
                                        { promo_for: 0 },
                                        { promo_apply_on: { $in: [mongoose.Types.ObjectId(store_detail.store_delivery_id)] } }
                                    ]
                                },
                                {
                                    $and: [
                                        { promo_for: 2 },
                                        { promo_apply_on: { $in: [mongoose.Types.ObjectId(store_detail._id)] } }
                                    ]
                                },
                                {
                                    $and: [
                                        { promo_for: { $ne: 0 } },
                                        { promo_for: { $ne: 2 } }
                                    ]
                                }
                            ]
                        }
                    }

                    let active_filter = {
                        $match: {
                            $and: [
                                {
                                    $or: [
                                        {
                                            is_promo_have_date: false
                                        },
                                        {
                                            $and: [
                                                { is_promo_have_date: true },
                                                {
                                                    promo_start_date: {
                                                        $lt: server_time
                                                    }
                                                },
                                                {
                                                    promo_expire_date: {
                                                        $gt: server_time
                                                    }
                                                },
                                            ]
                                        }
                                    ]
                                },
                                {
                                    is_approved: true
                                },
                                {
                                    is_active: true
                                }
                            ]
                        }
                    }
                    Promo_code.aggregate([country_filter, promo_filter, active_filter]).then((promo_codes) => {
                        Pages.find({ store_id: store_detail._id }, { _id: 1, title: 1 }, function (err, pages) {
                            response_data.json({
                                success: true,
                                message: SETTING_MESSAGE_CODE.SETTING_UPDATE_SUCCESSFULLY,
                                store_detail: store_detail,
                                server_time: server_time,
                                pages: pages,
                                timezone: city.timezone,
                                country_code: country.country_code,
                                currency_sign: country.currency_sign,
                                is_distance_unit_mile: country.is_distance_unit_mile,
                                promo_codes: promo_codes
                            });
                        });
                    })
                })
            })
        } else {
            response_data.json({ success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND });
        }
    });
}


exports.get_store_promo = function (request_data, response_data) {
    let request_data_body = request_data.body;
    let query = { '_id': request_data_body.store_id };

    let server_time = new Date();
    Store.findOne(query).then((store_detail) => {
        if (store_detail) {
            Country.findOne({ _id: store_detail.country_id }).then((country) => {
                City.findOne({ _id: store_detail.city_id }).then((city) => {

                    let user_id = null;
                    if(request_data.headers.userid){
                        user_id = request_data.headers.userid;
                    }

                    let promo_filter = {
                        $match: {
                            $or: [
                                {
                                    $and: [
                                        { country_id: { $eq: mongoose.Types.ObjectId(store_detail.country_id) } },
                                        {
                                            $or: [{
                                                city_id: { $eq: mongoose.Types.ObjectId(store_detail.city_id) }
                                            }, {
                                                city_id: { $eq: mongoose.Types.ObjectId('000000000000000000000000') }
                                            }]
                                        },
                                        { promo_for: 0 },
                                        { promo_apply_on: { $in: [mongoose.Types.ObjectId(store_detail.store_delivery_id)] } }
                                    ]
                                },
                                {
                                    $and: [
                                        { country_id: { $eq: mongoose.Types.ObjectId(store_detail.country_id) } },
                                        {
                                            $or: [{
                                                city_id: { $eq: mongoose.Types.ObjectId(store_detail.city_id) }
                                            }, {
                                                city_id: { $eq: mongoose.Types.ObjectId('000000000000000000000000') }
                                            }]
                                        },
                                        { promo_for: 7 },
                                        { promo_apply_on: { $in: [mongoose.Types.ObjectId(user_id)] } }
                                    ]
                                },
                                {
                                    $and: [
                                        { country_id: { $eq: mongoose.Types.ObjectId(store_detail.country_id) } },
                                        {
                                            $or: [{
                                                city_id: { $eq: mongoose.Types.ObjectId(store_detail.city_id) }
                                            }, {
                                                city_id: { $eq: mongoose.Types.ObjectId('000000000000000000000000') }
                                            }]
                                        },
                                        { promo_for: 2 },
                                        { promo_apply_on: { $in: [mongoose.Types.ObjectId(store_detail._id)] } }
                                    ]
                                },
                                {
                                    $and: [
                                        {country_id: {$eq:mongoose.Types.ObjectId(store_detail.country_id)}}, 
                                        {$or: [{city_id: {$eq:mongoose.Types.ObjectId(store_detail.city_id)}},{city_id: {$eq:mongoose.Types.ObjectId(ID_FOR_ALL.ALL_ID)}}]}, 
                                        {promo_for: {$ne: 0}},
                                        {promo_for: {$ne: 2}},
                                        {promo_for: {$ne: 7}}
                                    ]
                                }
                            ]
                        }
                    }

                    let active_filter = {
                        $match: {
                            $and: [
                                {
                                    $or: [
                                        {
                                            is_promo_have_date: false
                                        },
                                        {
                                            $and: [
                                                { is_promo_have_date: true },
                                                {
                                                    promo_start_date: {
                                                        $lt: server_time
                                                    }
                                                },
                                                {
                                                    promo_expire_date: {
                                                        $gt: server_time
                                                    }
                                                },
                                            ]
                                        }
                                    ]
                                },
                                {
                                    is_approved: true
                                },
                                {
                                    is_active: true
                                }
                            ]
                        }
                    }

                    let project = {
                        $project: {
                            promo_for: 1,
                            promo_apply_on: 1,
                            promo_code_name: 1,
                            promo_details: 1,
                            is_approved: 1,
                            is_active: 1,
                            image_url: 1,
                            promo_start_date: 1,
                            promo_expire_date: 1
                        }
                    }

                    Promo_code.aggregate([promo_filter, active_filter]).then((promo_codes) => {
                        response_data.json({
                            success: true,
                            message: SETTING_MESSAGE_CODE.SETTING_UPDATE_SUCCESSFULLY,
                            // store_detail: store_detail,
                            // server_time: server_time,
                            // pages: pages,
                            // timezone:city.timezone,
                            // country_code: country.country_code,
                            // currency_sign: country.currency_sign,
                            // is_distance_unit_mile: country.is_distance_unit_mile,
                            promo_codes: promo_codes
                        });
                    })
                })
            })
        } else {
            response_data.json({ success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND });
        }
    });
}

exports.update_page = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {
            let request_data_body = request_data.body;
            let store = response.store;
            Pages.findOne({ _id: request_data_body.page_id }, function (err, page_detail) {
                page_detail.title = request_data_body.title;
                page_detail.is_visible = request_data_body.is_visible;
                page_detail.html_data = request_data_body.html_data;
                page_detail.save(function (err) {
                    response_data.json({
                        success: true
                    });
                })
            });
        } else {
            response_data.json(response);
        }
    });
};

exports.add_page = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {
            let request_data_body = request_data.body;
            let store = response.store;
            let page = new Pages({
                title: request_data_body.title,
                store_id: store._id
            });
            page.save(function (err) {
                response_data.json({
                    success: true
                });
            })
        } else {
            response_data.json(response);
        }
    });
};

exports.pages = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {
            let request_data_body = request_data.body;
            let store = response.store;
            Pages.find({ store_id: store._id }, function (err, pages) {
                response_data.json({
                    success: true,
                    pages: pages,
                });
            })
        } else {
            response_data.json(response);
        }
    });
}

exports.add_sub_store = function (request_data, response_data) 
{
    utils.check_unique_details(request_data, [{ name: 'email', type: 'string' }], function (response) 
    {
        if (response.success) 
        {
            let request_data_body = request_data.body;
            request_data_body.email = ((request_data_body.email).trim()).toLowerCase();
            let store = response.store;
            let password = request_data_body.password


            let query = { $or: [{ 'email': request_data_body.email }, { 'phone': request_data_body.phone }] };
            SubStore.findOne(query, function (err, sub_store) 
            {
                if (sub_store) 
                {
                    if (sub_store.email == request_data_body.email) {
                        return response_data.json({ success: false, error_code: STORE_ERROR_CODE.EMAIL_ALREADY_REGISTRED });
                    } else {
                       return  response_data.json({ success: false, error_code: STORE_ERROR_CODE.PHONE_NUMBER_ALREADY_REGISTRED });
                    }
                } 
                else 
                {
                    delete request_data_body._id;
                    request_data_body.is_approved = true;
                    request_data_body.main_store_id = store._id;
                    request_data_body.password = utils.encryptPassword(request_data_body.password);

                    let sub_store = new SubStore(request_data_body);
                    sub_store.save(function (err, store) {
                        console.log(store)
                        if (!err) {
                            emails.subStoreRegistered(request_data, store, password)
                            return response_data.json({
                                success: true,
                                sub_store: sub_store,
                            });
                        }
                        return response_data.json({
                            success: false,
                            error_code: STORE_ERROR_CODE.SUB_STORE_ADD_FAILED
                        })
                    });
                }
            })
        } else {
            return response_data.json(response);
        }
    });
}

exports.update_sub_store = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{ name: 'email', type: 'string' }], function (response) {
        if (response.success) {
            let request_data_body = request_data.body;
            let store = response.store;
            request_data_body.email = ((request_data_body.email).trim()).toLowerCase();

            if (request_data_body.password == '') {
                delete request_data_body.password;
            } else {
                request_data_body.password = utils.encryptPassword(request_data_body.password);
            }
            SubStore.findOneAndUpdate({ _id: request_data_body._id }, request_data_body, { new: true }, function (err, sub_store) {
                if (sub_store) {
                    response_data.json({
                        success: true,
                        sub_store: sub_store,
                        message: STORE_MESSAGE_CODE.SUB_STORE_UPDATED,
                    });
                } else {
                    response_data.json({
                        success: false
                    });
                }
            })


        } else {
            response_data.json(response);
        }
    });
}

exports.sub_store_list = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {
            let request_data_body = request_data.body;
            let store = response.store;
            SubStore.find({ main_store_id: store._id }, function (err, sub_stores) {
                response_data.json({
                    success: true,
                    sub_stores: sub_stores,
                });
            })

        } else {
            response_data.json(response);
        }
    });
}
// store login
exports.sub_store_login = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'email', type: 'string' }], function (response) {
        if (response.success) {
            utils.verify_captcha(request_data.body.captcha_token, request_data.body.device_type, 2, function (response) {
                if (response.success) {
                    let request_data_body = request_data.body;
                    let email = ((request_data_body.email).trim()).toLowerCase();
                    let encrypted_password = request_data_body.password;
                    encrypted_password = utils.encryptPassword(encrypted_password);
                    let query = { $or: [{ 'email': email }, { 'phone': email }] };
                    SubStore.findOne(query).then((sub_store_detail) => {
                        if (sub_store_detail) {
                            if (encrypted_password != sub_store_detail.password) {
                                response_data.json({ success: false, error_code: STORE_ERROR_CODE.INVALID_PASSWORD });
                            } else {
                                Store.findOne({ _id: sub_store_detail.main_store_id }, function (err, store_detail) {
                                    Country.findOne({ _id: store_detail.country_id }).then((country) => {

                                        City.findOne({ _id: store_detail.city_id }).then((city) => {
                                            sub_store_detail.device_type = request_data_body.device_type;
                                            let server_token = utils.generateServerToken(32);
                                            sub_store_detail.server_token = server_token;
                                            sub_store_detail.device_token = request_data_body.device_token;
                                            sub_store_detail.save(function (err) {
                                                let timezone = city.timezone;
                                                Delivery.findOne({ _id: store_detail.store_delivery_id }).then((delivery_data) => {
                                                    response_data.json({
                                                        success: true,
                                                        message: STORE_MESSAGE_CODE.LOGIN_SUCCESSFULLY,
                                                        timezone: timezone,
                                                        currency: country.currency_sign,
                                                        country_detail: country,
                                                        minimum_phone_number_length: country.minimum_phone_number_length,
                                                        maximum_phone_number_length: country.maximum_phone_number_length,
                                                        is_store_can_create_group: delivery_data.is_store_can_create_group,
                                                        is_store_can_edit_order: delivery_data.is_store_can_edit_order,
                                                        sub_store: sub_store_detail,
                                                        store: store_detail
                                                    });
                                                });
                                            })
                                        });
                                    });
                                })
                            }
                        } else {
                            response_data.json({ success: false, error_code: STORE_ERROR_CODE.NOT_A_REGISTERED });
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
                        error_code: ERROR_CODE.INVALID_CAPTCHA
                    });
                }
            })
        } else {
            response_data.json(response);
        }
    });
}
exports.store_login = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'email', type: 'string' }], function (response) {
        if (response.success) {

            utils.verify_captcha(request_data.body.captcha_token, request_data.body.device_type, 2, function (response) {
                if (response.success) {
                    let request_data_body = request_data.body;
                    console.log(request_data_body);
                    let email = ((request_data_body.email).trim()).toLowerCase();
                    let social_id = request_data_body.social_id;
                    let encrypted_password = request_data_body.password;
                    let query;

                    if (social_id == undefined || social_id == null || social_id == "") {
                        social_id = "";
                    }
                    if (!email) {
                        email = null;
                    }

                    if (encrypted_password == undefined || encrypted_password == null || encrypted_password == "") {
                        encrypted_password = "";
                    } else {
                        encrypted_password = utils.encryptPassword(encrypted_password);
                    }
                    
                    if(request_data_body.is_store_login_by_email == false && request_data_body.is_store_login_by_phone == true)
                    {
                       query = { $or: [{ 'phone': email }, { social_ids: { $all: [social_id] } }] };

                    }
                    else if(request_data_body.is_store_login_by_email == true && request_data_body.is_store_login_by_phone == false)
                    {
                         query = { $or: [{ 'email': email }, { social_ids: { $all: [social_id] } }] };

                    }
                    else
                    { 
                       query = { $or: [{ 'email': email }, { 'phone': email }, { social_ids: { $all: [social_id] } }] };
                    }

                    if (encrypted_password || social_id) {
                        Store.findOne(query).then((store_detail) => {

                            if (social_id == undefined || social_id == null || social_id == "") {
                                social_id = null;
                            }

                            if ((social_id == null && email == "")) {

                                response_data.json({ success: false, error_code: STORE_ERROR_CODE.LOGIN_FAILED });

                            } else if (store_detail) {
                                if (social_id == null && encrypted_password != "" && encrypted_password != store_detail.password) {

                                    response_data.json({ success: false, error_code: STORE_ERROR_CODE.INVALID_PASSWORD });

                                } else if (social_id != null && store_detail.social_ids.indexOf(social_id) < 0) {

                                    response_data.json({ success: false, error_code: STORE_ERROR_CODE.STORE_NOT_REGISTER_WITH_SOCIAL });

                                } else {
                                    Country.findOne({ _id: store_detail.country_id }).then((country) => {

                                        City.findOne({ _id: store_detail.city_id }).then((city) => {

                                            let timezone = city.timezone;

                                            let device_token = "";
                                            let device_type = "";
                                            if (store_detail.device_token != "" && store_detail.device_token != request_data_body.device_token) {
                                                device_token = store_detail.device_token;
                                                device_type = store_detail.device_type;
                                            }

                                            if (request_data_body.device_type == DEVICE_TYPE.WEB || request_data_body.device_type == DEVICE_TYPE.ANDROID || request_data_body.device_type == DEVICE_TYPE.IOS) {
                                                store_detail.device_token = request_data_body.device_token;

                                            } else {
                                                Order.update({ store_notify: 0, store_id: store_detail._id }, { store_notify: 1 }, { multi: true }, function (error, order) {
                                                });
                                            }

                                            store_detail.device_type = request_data_body.device_type;
                                            let server_token = utils.generateServerToken(32);
                                            store_detail.server_token = server_token;
                                            store_detail.login_by = request_data_body.login_by;
                                            store_detail.app_version = request_data_body.app_version;
                                            store_detail.save().then((store) => {
                                                if (device_token != "") {
                                                    utils.sendPushNotification(ADMIN_DATA_ID.STORE, device_type, device_token, STORE_PUSH_CODE.LOGIN_IN_OTHER_DEVICE, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                                }
                                                // if (store_detail.uid) {
                                                    utils.create_user_token(store_detail, ADMIN_DATA_ID.STORE, response => {
                                                        // if (response.success) {
                                                            Delivery.findOne({ _id: store_detail.store_delivery_id }).then((delivery_data) => {
                                                                store_detail.firebase_token = response.user_token;
                                                                store_detail.save().then(store => {
                                                                    response_data.json({
                                                                        success: true,
                                                                        message: STORE_MESSAGE_CODE.LOGIN_SUCCESSFULLY,
                                                                        timezone: timezone,
                                                                        country_detail: country,
                                                                        currency: country.currency_sign,
                                                                        minimum_phone_number_length: country.minimum_phone_number_length,
                                                                        maximum_phone_number_length: country.maximum_phone_number_length,
                                                                        is_store_can_create_group: delivery_data.is_store_can_create_group,
                                                                        is_store_can_edit_order: delivery_data.is_store_can_edit_order,
                                                                        is_provide_table_booking: delivery_data.is_provide_table_booking,
                                                                        store: store_detail,
                                                                        is_upload_store_documents: setting_detail.is_upload_store_documents,
                                                                        firebase_token: response.user_token
                                                                    });
                                                                }).catch(error => {
                                                                    console.log(error)
                                                                    response_data.json({
                                                                        success: false,
                                                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                    })
                                                                })
                                                            });
                                                        // } else {
                                                        //     response_data.json({
                                                        //         success: false,
                                                        //         error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                        //     })
                                                        // }
                                                    })
                                                // } else {
                                                //     utils.create_user(store, ADMIN_DATA_ID.STORE, response => {
                                                //         console.log('user token created')
                                                //         if (response.success) {
                                                //             store.uid = response.user.uid

                                                //             store.save().then(store => {
                                                //                 utils.create_user_token(store, ADMIN_DATA_ID.STORE, response => {
                                                //                     if (response.success) {
                                                //                         store.firebase_token = response_data.user_token
                                                //                         store.save()
                                                //                         Delivery.findOne({ _id: store_detail.store_delivery_id }).then((delivery_data) => {
                                                //                             response_data.json({
                                                //                                 success: true,
                                                //                                 message: STORE_MESSAGE_CODE.LOGIN_SUCCESSFULLY,
                                                //                                 timezone: timezone,
                                                //                                 country_detail: country,
                                                //                                 currency: country.currency_sign,
                                                //                                 minimum_phone_number_length: country.minimum_phone_number_length,
                                                //                                 maximum_phone_number_length: country.maximum_phone_number_length,
                                                //                                 is_store_can_create_group: delivery_data.is_store_can_create_group,
                                                //                                 is_store_can_edit_order: delivery_data.is_store_can_edit_order,
                                                //                                 is_provide_table_booking: delivery_data.is_provide_table_booking,
                                                //                                 store: store_detail,
                                                //                                 is_upload_store_documents: setting_detail.is_upload_store_documents,
                                                //                                 firebase_token: response.user.user_token
                                                //                             });
                                                //                         });
                                                //                     } else {
                                                //                         response_data.json({
                                                //                             success: false,
                                                //                             error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                //                         })
                                                //                     }
                                                //                 })
                                                //             }).catch(error => {
                                                //                 response_data.json({
                                                //                     success: false,
                                                //                     error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                //                 })
                                                //             })
                                                //         } else {
                                                //             response_data.json({
                                                //                 success: false,
                                                //                 error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                //             })
                                                //         }

                                                //     })
                                                // }

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
                                }

                            } else {
                                response_data.json({ success: false, error_code: STORE_ERROR_CODE.NOT_A_REGISTERED });
                            }

                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    } else {
                        response_data.json({ success: false, error_code: STORE_ERROR_CODE.LOGIN_FAILED });
                    }
                } else {
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.INVALID_CAPTCHA
                    });
                }
            })
        } else {
            response_data.json(response);
        }
    });
};

//store_update
exports.store_update = function (request_data, response_data) {

    let admin = fireUser
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {
            let request_data_body = request_data.body;
            let store_id = request_data_body.store_id;
            let old_password = request_data_body.old_password;
            let social_id = request_data_body.social_id;
            if (request_data_body.name) {
                if (typeof request_data_body.name == "string") {
                    request_data_body.name = JSON.parse(request_data_body.name);
                }
                let name = [];
                request_data_body.name.forEach(function (data) {
                    if (data == "" || data == "null") {
                        name.push(null);
                    } else {
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
            let store = response.store;


            if (request_data_body.type !== ADMIN_DATA_ID.ADMIN && social_id == null && old_password != "" && old_password != store.password) {

                response_data.json({ success: false, error_code: STORE_ERROR_CODE.INVALID_PASSWORD });

            } else if (request_data_body.type !== ADMIN_DATA_ID.ADMIN && social_id != null && store.social_ids.indexOf(social_id) < 0) {

                response_data.json({ success: false, error_code: STORE_ERROR_CODE.STORE_NOT_REGISTER_WITH_SOCIAL });

            } else {
                Country.findOne({ _id: store.country_id }).then((country) => {
                    City.findOne({ _id: store.city_id }).then((city) => {

                        let timezone = city.timezone;
                        let new_email = request_data_body.email;
                        let new_phone = request_data_body.phone;
                        if (request_data_body.new_password != "" && request_data_body.new_password != undefined) {
                            let new_password = utils.encryptPassword(request_data_body.new_password);
                            request_data_body.password = new_password;
                        }

                        if (request_data_body.latitude != undefined && request_data_body.longitude != undefined) {
                            request_data_body.location = [request_data_body.latitude, request_data_body.longitude];
                        }

                        request_data_body.social_ids = store.social_ids;

                        Store.findOne({ _id: { '$ne': store_id }, email: new_email }).then((store_details) => {

                            let is_update = false;
                            if (store_details) {

                            } else {
                                is_update = true;
                            }

                            if (is_update == true) {
                                is_update = false;
                                Store.findOne({ _id: { '$ne': store_id }, phone: new_phone }).then((store_phone_details) => {
                                    if (store_phone_details) {

                                    } else {
                                        is_update = true;
                                    }
                                    if (is_update == true) {
                                        let social_id_array = [];
                                        if (social_id != null) {
                                            social_id_array.push(social_id);
                                        }
                                        let store_update_query = { '_id': store_id };
                                        delete request_data_body.unique_id;
                                        let image_file = request_data.files;
                                        if (image_file != undefined && image_file.length > 0) {
                                            utils.deleteImageFromFolder(store.image_url, FOLDER_NAME.STORE_PROFILES);
                                            let image_name = store._id + utils.generateServerToken(4);
                                            let url = utils.getStoreImageFolderPath(FOLDER_NAME.STORE_PROFILES) + image_name + FILE_EXTENSION.STORE;
                                            utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.STORE, FOLDER_NAME.STORE_PROFILES);
                                            request_data_body.image_url = url;
                                        }
                                        Store.findOneAndUpdate(store_update_query, request_data_body, { new: true }).then((store_data) => {
                                            if (store_data) {



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

                                                Delivery.findOne({ _id: store_data.store_delivery_id }).then((delivery_data) => {
                                                    Store.aggregate([
                                                        {
                                                            $match: {
                                                                _id: { $eq: store_data._id }
                                                            }
                                                        },
                                                        {
                                                            $lookup: {
                                                                from: "countries",
                                                                localField: "country_id",
                                                                foreignField: "_id",
                                                                as: "country_details"
                                                            }
                                                        },
                                                        {
                                                            $lookup: {
                                                                from: "taxes",
                                                                localField: "country_details.taxes",
                                                                foreignField: "_id",
                                                                as: "tax_details"
                                                            }
                                                        },
                                                        {
                                                            $lookup: {
                                                                from: "taxes",
                                                                localField: "taxes",
                                                                foreignField: "_id",
                                                                as: "store_taxes_details"
                                                            }
                                                        }
                                                    ]).then(store => {
                                                        let new_store_email = request_data_body.email;
                                                        if (store[0].email != new_store_email && new_store_email != undefined) {
                                                            if(store[0].uid != ""){
                                                                let product_type;
                                                                if (SETTINGS_DETAILS === 1) {
                                                                    product_type = 'live'
                                                                } else if (SETTINGS_DETAILS === 2) {
                                                                    product_type = 'demo'
                                                                } else {
                                                                    product_type = 'development'
                                                                }
                                                                fireUser.updateUser(store[0].uid, {
                                                                    email: product_type + '_store_' + store[0].email
                                                                }).then(stores => {
                                                                    response_data.json({
                                                                        success: true,
                                                                        message: STORE_MESSAGE_CODE.UPDATE_SUCCESSFULLY,
                                                                        timezone: timezone,
                                                                        currency: country.currency_sign,
                                                                        country_detail: country,
                                                                        minimum_phone_number_length: country.minimum_phone_number_length,
                                                                        maximum_phone_number_length: country.maximum_phone_number_length,
                                                                        is_store_can_create_group: delivery_data.is_store_can_create_group,
                                                                        is_store_can_edit_order: delivery_data.is_store_can_edit_order,
                                                                        store: store[0]
                                                                    });
                                                                }).catch(error => {
                                                                    console.log(error)
                                                                    response_data.json({
                                                                        success: false,
                                                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                    })
                                                                })
                                                            } else {
                                                                response_data.json({
                                                                    success: true,
                                                                    message: STORE_MESSAGE_CODE.UPDATE_SUCCESSFULLY,
                                                                    timezone: timezone,
                                                                    currency: country.currency_sign,
                                                                    minimum_phone_number_length: country.minimum_phone_number_length,
                                                                    maximum_phone_number_length: country.maximum_phone_number_length,
                                                                    is_store_can_create_group: delivery_data.is_store_can_create_group,
                                                                    is_store_can_edit_order: delivery_data.is_store_can_edit_order,
                                                                    store: store[0]
                                                                })
                                                            }
                                                        } else {
                                                            response_data.json({
                                                                success: true,
                                                                message: STORE_MESSAGE_CODE.UPDATE_SUCCESSFULLY,
                                                                timezone: timezone,
                                                                currency: country.currency_sign,
                                                                country_detail: country,
                                                                minimum_phone_number_length: country.minimum_phone_number_length,
                                                                maximum_phone_number_length: country.maximum_phone_number_length,
                                                                is_store_can_create_group: delivery_data.is_store_can_create_group,
                                                                is_store_can_edit_order: delivery_data.is_store_can_edit_order,
                                                                store: store[0]
                                                            });
                                                        }
                                                    })
                                                });

                                            } else {
                                                response_data.json({ success: false, error_code: STORE_ERROR_CODE.UPDATE_FAILED });
                                            }
                                        }, (error) => {
                                            console.log(error)
                                            response_data.json({
                                                success: false,
                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                            });
                                        });
                                    } else {
                                        response_data.json({ success: false, error_code: STORE_ERROR_CODE.PHONE_NUMBER_ALREADY_REGISTRED });
                                    }

                                }, (error) => {
                                    console.log(error)
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });
                            } else {
                                response_data.json({ success: false, error_code: STORE_ERROR_CODE.EMAIL_ALREADY_REGISTRED });
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


exports.store_generate_otp = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {

        if (response.success) {

            let request_data_body = request_data.body;
            //let type = Number(request_data_body.type); //7 = User  8 = Provider  2 = Store
            let email = request_data_body.email;
            let phone = request_data_body.phone;
            let country_phone_code = request_data_body.country_phone_code;
            let store_id = request_data_body.store_id;

            let phone_with_code = country_phone_code + phone;
            let error_code = 0;
            let otp_for_email = "";
            let otp_for_sms = "";

            Store.findOne({ email: email }).then((store_email_data) => {
                Store.findOne({ phone: phone }).then((store_phone_data) => {

                    setting_detail.is_store_mail_verification = true
                    setting_detail.is_store_sms_verification = true

                    if ((store_email_data !== null || store_phone_data !== null) && store_id === undefined) {
                        error_code = STORE_ERROR_CODE.EMAIL_ALREADY_REGISTRED;
                    }

                    if (setting_detail.is_store_mail_verification && email != undefined) {
                        if (store_email_data && store_email_data.is_email_verified == true) {
                            error_code = STORE_ERROR_CODE.EMAIL_ALREADY_VERIFIED;
                        } else {
                            otp_for_email = utils.generateOtp(6);
                        }
                    }

                    if (setting_detail.is_store_sms_verification && phone != undefined) {
                        if (store_phone_data && store_phone_data.is_phone_number_verified == true) {
                            if (error_code == 0) {
                                error_code = STORE_ERROR_CODE.PHONE_NUMBER_ALREADY_REGISTRED;
                            } else {
                                error_code = STORE_ERROR_CODE.EMAIL_AND_PHONE_ALREADY_REGISTERED;
                            }
                        } else {
                            otp_for_sms = utils.generateOtp(6);
                        }
                    }

                    let filter = { $or: [] }
                    if (request_data_body.phone && request_data_body.phone !== "" && request_data_body.phone !== null) {
                        filter.$or.push({ phone: request_data_body.phone })
                    }
                    if (request_data_body.email && request_data_body.email !== "" && request_data_body.email !== null) {
                        filter.$or.push({ email: request_data_body.email })
                    }

                    if (filter.$or.length === 0) {
                        filter = {};
                    }

                    if (error_code == 0) {
                        let query = { ...filter, user_type: 2 };
                        Otp.findOne(query).then((otp) => {
                            if (!otp) {
                                otp = new Otp;
                                otp.try_count = 1;
                            }
                            otp.email = email;
                            otp.phone = phone;
                            otp.email_otp = otp_for_email;
                            otp.country_phone_code = country_phone_code;
                            otp.otp = otp_for_sms;

                            otp.ip = request_data.headers['x-forwarded-for'];
                            otp.expire_at = Number(new Date()) + 65000;
                            otp.user_type = 2;
                            otp.save(function (err, sotp) {
                                if (email != undefined) {
                                    // mail store OTP verification
                                    if (setting_detail.is_mail_notification) {

                                        emails.emailForOTPVerification(request_data, email, otp_for_email, EMAIL_UNIQUE_ID.STORE_OTP_VERIFICATION, null);

                                    }
                                }
                                if (phone != undefined) {
                                    // sms store OTP verification
                                    if (setting_detail.is_sms_notification) {
                                        SMS.sendSmsForOTPVerificationAndForgotPassword(phone_with_code, SMS_UNIQUE_ID.STORE_OTP, otp_for_sms, null);
                                    }
                                }
                                if (error_code == 0) {
                                    let otp_id = sotp ? sotp._id : null;
                                    response_data.json({ success: true, message: STORE_MESSAGE_CODE.GET_OTP_SUCCESSFULLY, otp_id: otp_id });
                                }
                            });
                        })

                    } else {
                        response_data.json({ success: false, error_code: error_code });
                    }
                });
            });
        } else {
            response_data.json(response);
        }
    });
}

/// store_otp_verification
exports.store_otp_verification = function (request_data, response_data) {
    utils.verify_captcha(request_data.body.captcha_token, request_data.body.device_type, 3, function (response) {
        if (response.success) {
            let request_data_body = request_data.body;
            let store_id = request_data_body.store_id;
            let otp_id = request_data_body.otp_id;
            let email_otp = request_data_body.email_otp;
            let sms_otp = request_data_body.sms_otp;

            let is_email_verify = false;
            let is_sms_verify = false;

            Otp.findById(otp_id).then(otp_data => {
                if (otp_data) {
                    if (email_otp && email_otp === otp_data.email_otp) {
                        is_email_verify = true;
                    }
                    if (sms_otp && sms_otp === otp_data.otp) {
                        is_sms_verify = true;
                    }

                    let json = {
                        success: false,
                    }

                    if (email_otp && sms_otp) {
                        json['success'] = is_email_verify && is_sms_verify;
                    } else if (email_otp) {
                        json['success'] = is_email_verify;
                    } else if (sms_otp) {
                        json['success'] = is_sms_verify;
                    }

                    if (!json.success) {
                        json['error_code'] = STORE_ERROR_CODE.OTP_VERIFICATION_FAILED
                    } else {
                        json['message'] = STORE_MESSAGE_CODE.OTP_VERIFICATION_SUCCESSFULLY
                    }

                    if (store_id) {
                        Store.findById(store_id).then(store_data => {
                            if (store_data) {
                                if (email_otp && sms_otp) {
                                    store_data.is_email_verified = is_email_verify;
                                    store_data.is_phone_number_verified = is_sms_verify;
                                } else if (email_otp) {
                                    store_data.is_email_verified = is_email_verify;
                                } else if (sms_otp) {
                                    store_data.is_phone_number_verified = is_sms_verify;
                                }
                                store_data.save();
                                response_data.json(json);
                            } else {
                                response_data.json(json);
                            }
                        })
                    } else {
                        response_data.json(json);
                    }
                } else {
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                }
            })
        } else {
            response_data.json({
                success: false,
                error_code: ERROR_CODE.INVALID_CAPTCHA
            })
        }
    })
}

// store get_detail
exports.get_detail = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let store = response.store;

            Country.findOne({ _id: store.country_id }).then((country) => {
                City.findOne({ _id: store.city_id }).then((city) => {

                    let timezone = city.timezone;
                    store.app_version = request_data_body.app_version;
                    if (request_data_body.device_token != undefined) {
                        store.device_token = request_data_body.device_token;
                    }


                    store.save().then(() => {
                        let query = {
                            $match: {
                                _id: { $eq: store._id }
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
                        Store.aggregate([query, tax_lookup, table_settings_lookup, table_settings_unwind]).then(store_details => {
                            Delivery.findOne({ _id: store.store_delivery_id }).then((delivery_data) => {
                                response_data.json({
                                    success: true,
                                    message: STORE_MESSAGE_CODE.GET_DETAIL_SUCCESSFULLY,
                                    timezone: timezone,
                                    currency: country.currency_sign,
                                    country_code: country.country_code,
                                    is_store_can_create_group: delivery_data.is_store_can_create_group,
                                    is_store_can_edit_order: delivery_data.is_store_can_edit_order,
                                    minimum_phone_number_length: country.minimum_phone_number_length,
                                    maximum_phone_number_length: country.maximum_phone_number_length,
                                    sub_store: response.sub_store,
                                    store: store_details[0]
                                });
                            });
                        })
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
    utils.check_request_params(request_data.body, [{ name: 'device_token', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            Store.findOne({ _id: request_data_body.store_id }).then((store) => {
                if (store) {
                    if (request_data_body.server_token !== null && store.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {
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

// logout api 
exports.logout = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            Store.findOne({ _id: request_data_body.store_id }).then((store) => {
                if (store) {
                    if (request_data_body.server_token !== null && store.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });

                    } else {
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

// store get order_list
exports.order_list = function (request_data, response_data) {

    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let store_detail = response.store;

            Country.findOne({ _id: store_detail.country_id }).then((country_detail) => {
                if (country_detail) {
                    let currency = country_detail.currency_sign;

                    let sort = { "$sort": {} };
                    sort["$sort"]['order_unique_id'] = parseInt(-1);
                    let store_condition = { "$match": { 'store_id': { $eq: mongoose.Types.ObjectId(request_data_body.store_id) } } };
                    //let order_status_condition = {$match: {$and: [{order_status: {$lte: ORDER_STATE.ORDER_READY}}, {order_status: {$ne: ORDER_STATE.STORE_REJECTED}}]}};

                    let order_status_condition = {
                        $match: {
                            $and: [
                                { order_status: { $ne: ORDER_STATE.STORE_REJECTED } },
                                { order_status: { $ne: ORDER_STATE.STORE_CANCELLED } },
                                { order_status: { $ne: ORDER_STATE.CANCELED_BY_USER } },
                                { order_status: { $ne: ORDER_STATE.ORDER_COMPLETED } },
                                {
                                    $or: [{ order_status: { $lt: ORDER_STATE.ORDER_READY } },
                                    { request_id: null }]
                                }]
                        }
                    }
                    let project = {
                        $project: {
                            order_status: "$order_status",
                            order_change: "$order_change",
                            order_type: "$order_type",
                            is_schedule_order: "$is_schedule_order",
                            is_user_pick_up_order: "$is_user_pick_up_order",
                            user_detail: "$user_detail",
                            order_unique_id: "$unique_id",
                            timezone: "$timezone",
                            total: "$total",
                            delivery_type: "$delivery_type",
                            is_payment_mode_cash: "$is_payment_mode_cash",
                            schedule_order_start_at: "$schedule_order_start_at",
                            schedule_order_start_at2: "$schedule_order_start_at2"
                        }
                    }
                    //let request_id_condition = {"$match": {'request_id': null}};
                    Order.aggregate([store_condition, order_status_condition, project, sort]).then((orders) => {
                        if (orders.length == 0) {
                            response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
                        } else {
                            let lookup = {
                                $lookup:
                                {
                                    from: "vehicles",
                                    localField: "vehicle_id",
                                    foreignField: "_id",
                                    as: "vehicle_detail"
                                }
                            };
                            let unwind = { $unwind: "$vehicle_detail" };
                            let group = {
                                $group: {
                                    _id: null,
                                    vehicles: {
                                        $push: {
                                            $cond: {
                                                if: { $eq: ["$admin_type", ADMIN_DATA_ID.STORE] },
                                                then: '$vehicle_detail',
                                                else: null,
                                            }
                                        }
                                    },
                                    admin_vehicles: {
                                        $push: {
                                            $cond: {
                                                if: { $eq: ["$admin_type", ADMIN_DATA_ID.ADMIN] },
                                                then: '$vehicle_detail',
                                                else: null,
                                            }
                                        }
                                    },
                                }
                            }
                            let condition = { $match: { 'city_id': { $eq: store_detail.city_id } } };
                            let type_condition = { $match: { $or: [{ 'type_id': { $eq: store_detail._id } }, { 'type_id': { $eq: null } }] } };
                            let condition1 = { $match: { 'is_business': { $eq: true } } };
                            let vehicle_condition = { $match: { 'vehicle_detail.is_business': { $eq: true } } };
                            let delivery_type_query = { $match: { delivery_type: { $eq: 1 } } };

                            Service.aggregate([condition, type_condition, condition1, delivery_type_query, lookup, unwind, vehicle_condition, group]).then((services) => {
                                if (services.length > 0) {
                                    services[0].admin_vehicles = services[0].admin_vehicles.filter(v => v != null);
                                    services[0].vehicles = services[0].vehicles.filter(v => v != null);
                                    response_data.json({
                                        success: true,
                                        message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
                                        currency: currency,
                                        orders: orders, admin_vehicles: services[0].admin_vehicles, vehicles: services[0].vehicles
                                    });
                                } else {
                                    response_data.json({
                                        success: true,
                                        message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
                                        currency: currency,
                                        orders: orders, admin_vehicles: [], vehicles: []
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
            });


        } else {
            response_data.json(response);
        }
    });
};

//get_store_data
exports.get_store_data = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'store_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let store = response.store;

            let country_query = {
                $lookup:
                {
                    from: "countries",
                    localField: "country_id",
                    foreignField: "_id",
                    as: "country_details"
                }
            };

            let array_to_json = { $unwind: "$country_details" };

            let tax_lookup = {
                $lookup: {
                    from: "taxes",
                    localField: "country_details.taxes",
                    foreignField: "_id",
                    as: "tax_details"
                }
                
            }

            let unwind_tax_lookup = {
                $unwind: {
                    path: "$tax_details",
                    preserveNullAndEmptyArrays: true
                }
            }

            let store_tax_lookup = {
                $lookup: {
                    from: "taxes",
                    localField: "taxes",
                    foreignField: "_id",
                    as: "store_taxes_details"
                }
            }

            let unwind_store_tax_lookup = {
                $unwind: {
                    path: "$store_taxes_details",
                    preserveNullAndEmptyArrays: true
                }
            }

            let city_query = {
                $lookup:
                {
                    from: "cities",
                    localField: "city_id",
                    foreignField: "_id",
                    as: "city_details"
                }
            };
            let payment_query = {
                $lookup:
                {
                    from: "payment_gateways",
                    localField: "city_details.payment_gateway",
                    foreignField: "_id",
                    as: "payment_details"
                }
            };
            let array_to_json3 = { $unwind: {path: "$payment_details", preserveNullAndEmptyArrays: true} };

            let array_to_json1 = { $unwind: "$city_details" };
            let delivery_query = {
                $lookup:
                {
                    from: "deliveries",
                    localField: "store_delivery_id",
                    foreignField: "_id", as: "delivery_details"
                }
            };
            let array_to_json2 = { $unwind: "$delivery_details" };
            let condition = { "$match": { '_id': { $eq: mongoose.Types.ObjectId(request_data_body.store_id) } } };

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

            // Store.aggregate([condition, country_query, city_query, delivery_query, array_to_json, tax_lookup, unwind_tax_lookup, store_tax_lookup, unwind_store_tax_lookup, array_to_json1, array_to_json2, payment_query, array_to_json3, table_settings_lookup, table_settings_unwind]).then((store_detail) => {
            Store.aggregate([condition, country_query, city_query, delivery_query, array_to_json, tax_lookup, store_tax_lookup, array_to_json1, array_to_json2, payment_query, array_to_json3, table_settings_lookup, table_settings_unwind]).then((store_detail) => {
                if (store_detail.length != 0) {

                    let store_condition = { "$match": { 'store_id': { $eq: mongoose.Types.ObjectId(request_data_body.store_id) } } };
                    let group = {
                        $group: {
                            _id: null,
                            total_orders: { $sum: 1 },
                            accepted_orders: { $sum: { $cond: [{ $and: [{ $gte: ["$order_status", ORDER_STATE.STORE_ACCEPTED] }, { $gte: ["$order_status", ORDER_STATE.STORE_ACCEPTED] }] }, 1, 0] } },
                            completed_orders: { $sum: { $cond: [{ $eq: ["$order_status_id", ORDER_STATUS_ID.COMPLETED] }, 1, 0] } },
                            cancelled_orders: { $sum: { $cond: [{ $eq: ["$order_status_id", ORDER_STATUS_ID.CANCELLED] }, 1, 0] } }
                        }
                    }
                    Order.aggregate([store_condition, group]).then((order_detail) => {

                        if (order_detail.length == 0) {
                            response_data.json({
                                success: true,
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
                            let completed_order_percentage = order_detail[0].completed_orders * 100 / order_detail[0].total_orders;
                            order_detail[0].completed_order_percentage = completed_order_percentage;
                            response_data.json({
                                success: true,
                                message: STORE_MESSAGE_CODE.STORE_DATA_SUCCESSFULLY,
                                store_detail: store_detail[0],
                                order_detail: order_detail[0]
                            });
                        }
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

//update store time
exports.update_store_time = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let store_id = request_data_body.store_id;
            let old_password = request_data_body.old_password;
            let social_id = request_data_body.social_id;

            if (social_id == undefined || social_id == null || social_id == "") {
                social_id = null;
            }

            if (old_password == undefined || old_password == null || old_password == "") {
                old_password = "";
            } else {
                old_password = utils.encryptPassword(old_password);
            }

            let store = response.store;
            if (social_id == null && old_password != "" && old_password != store.password) {

                response_data.json({ success: false, error_code: STORE_ERROR_CODE.INVALID_PASSWORD });

            } else if (social_id != null && store.social_ids.indexOf(social_id) < 0) {

                response_data.json({ success: false, error_code: STORE_ERROR_CODE.STORE_NOT_REGISTER_WITH_SOCIAL });

            } else {
                Country.findOne({ _id: store.country_id }).then((country) => {
                    // request_data_body.store_time.sort(sortStoreTime);
                    Store.findOneAndUpdate({ _id: store_id }, request_data_body, { new: true }).then((store_data) => {

                        if (store_data) {
                            response_data.json({
                                success: true,
                                country_detail: country,
                                message: STORE_MESSAGE_CODE.UPDATE_SUCCESSFULLY,
                                store: store_data

                            });
                        } else {
                            response_data.json({ success: false, error_code: STORE_ERROR_CODE.UPDATE_FAILED });
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

        } else {
            response_data.json(response);
        }
    });
};


// order_history
exports.order_history = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{ name: 'start_date', type: 'string' }, { name: 'end_date', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let store = response.store;

            let city_id = store.city_id;
            City.findOne({ _id: city_id }).then((city) => {
                if (city) {
                    let city_timezone = city.timezone;

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


                    let store_condition = { "$match": { 'store_id': { $eq: mongoose.Types.ObjectId(request_data_body.store_id) } } };
                    let order_status_condition = {
                        "$match": {
                            $or: [{
                                order_status: ORDER_STATE.ORDER_COMPLETED
                            }, { order_status: ORDER_STATE.STORE_CANCELLED }, { order_status: ORDER_STATE.CANCELED_BY_USER }, { order_status: ORDER_STATE.STORE_REJECTED }]
                        }
                    };

                    let filter = { "$match": { "completed_date_in_city_timezone": { $gte: start_date, $lt: end_date } } };

                    Order.aggregate([store_condition, filter, order_status_condition,

                        {
                            $project: {
                                created_at: "$created_at",
                                completed_at: "$completed_at",
                                order_status: "$order_status",
                                total: "$total",
                                user_detail: "$user_detail",
                                unique_id: "$unique_id"
                            }
                        }
                    ]).then((orders) => {

                        if (orders.length == 0) {
                            response_data.json({ success: false, error_code: STORE_ERROR_CODE.ORDER_HISTORY_NOT_FOUND });
                        } else {
                            response_data.json({
                                success: true,
                                message: STORE_MESSAGE_CODE.ORDER_HISTORY_SUCCESSFULLY,
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
// store order_history_detail
exports.order_history_detail = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{ name: 'order_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let store = response.store;

            let store_condition = { "$match": { 'store_id': { $eq: mongoose.Types.ObjectId(request_data_body.store_id) } } };
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
            Order.aggregate([order_condition, store_condition, order_status_condition, order_status_id_condition]).then((orders) => {
                //Order.findOne({_id: request_data_body.order_id}).then((order_detail) => {
                if (orders.length != 0) {
                    let order_detail = orders[0];
                    let country_id = order_detail.country_id;
                    if (order_detail.country_id == null && order_detail.country_id == undefined) {
                        country_id = store.country_id;
                    }

                    Country.findOne({ _id: country_id }).then((country) => {
                        let currency = "";
                        if (country) {
                            currency = country.currency_sign;
                        }
                        User.findOne({ _id: order_detail.user_id }).then((user_data) => {
                            let current_provider = null;
                            Request.findOne({ _id: order_detail.request_id }).then((request_data) => {
                                if (request_data) {
                                    current_provider = request_data.current_provider;
                                }
                                Provider.findOne({ _id: current_provider }).then((provider_data) => {
                                    Order_payment.findOne({ _id: order_detail.order_payment_id }).then((order_payment) => {
                                        Cart.findOne({ _id: order_detail.cart_id }).then((cart) => {

                                            let payment_gateway_name = "Cash";
                                            if (order_payment.is_payment_mode_cash == false) {
                                                payment_gateway_name = "Card";
                                            }

                                            let provider_detail = {};
                                            let user_detail = {};

                                            if (user_data) {
                                                user_detail = {
                                                    first_name: user_data.first_name,
                                                    last_name: user_data.last_name,
                                                    email: user_data.email,
                                                    image_url: user_data.image_url,
                                                }
                                            }

                                            if (provider_data) {
                                                provider_detail = {
                                                    first_name: provider_data.first_name,
                                                    last_name: provider_data.last_name,
                                                    email: user_data.email,
                                                    image_url: provider_data.image_url
                                                }
                                            }

                                            orders[0].cart_detail = cart;
                                            orders[0].order_payment_detail = order_payment;
                                            orders[0].request_detail = request_data;
                                            Review.findOne({ order_id: order_detail._id }).then((review) => {
                                                if (review) {
                                                    orders[0].review_detail = review;
                                                }
                                                response_data.json({
                                                    success: true,
                                                    message: STORE_MESSAGE_CODE.GET_STORE_ORDER_DETAIL_SUCCESSFULLY,
                                                    currency: currency,
                                                    user_detail: user_detail,
                                                    provider_detail: provider_detail,
                                                    payment_gateway_name: payment_gateway_name,
                                                    order_list: orders[0]
                                                });
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


        } else {
            response_data.json(response);
        }
    });
};

// store order_payment_status_set_on_cash_on_delivery
exports.order_payment_status_set_on_cash_on_delivery = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{ name: 'order_payment_id', type: 'string' }, { name: 'is_order_price_paid_by_store' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let store = response.store;

            Order_payment.findOne({ _id: request_data_body.order_payment_id, store_id: request_data_body.store_id }).then((order_payment) => {
                if (order_payment) {
                    if (order_payment.is_payment_mode_cash == true) {

                        order_payment.is_order_price_paid_by_store = request_data_body.is_order_price_paid_by_store;
                        order_payment.is_order_payment_status_set_by_store = true;

                        let store_have_service_payment = 0;
                        let store_have_order_payment = 0;
                        let total_store_have_payment = 0;
                        let pay_to_store = 0;

                        if (store.is_store_pay_delivery_fees && order_payment.total_order_price >= store.free_delivery_for_above_order_price) {
                            store_have_service_payment = order_payment.total_delivery_price;
                            store_have_service_payment = utils.precisionRoundTwo(store_have_service_payment);
                        }

                        if (order_payment.is_order_price_paid_by_store == false) {
                            store_have_order_payment = order_payment.total_order_price;
                            store_have_order_payment = utils.precisionRoundTwo(store_have_order_payment);
                        }
                        let other_promo_payment_loyalty = order_payment.other_promo_payment_loyalty;
                        total_store_have_payment = +store_have_service_payment + +store_have_order_payment;
                        pay_to_store = order_payment.total_store_income - total_store_have_payment - other_promo_payment_loyalty;

                        let provider_have_cash_payment = order_payment.cash_payment;
                        let provider_paid_order_payment = 0;
                        let total_provider_have_payment = 0;
                        let pay_to_provider = 0;

                        if (request_data_body.is_order_price_paid_by_store == false) {

                            provider_paid_order_payment = order_payment.total_order_price;
                        } else {
                            provider_paid_order_payment = 0;
                        }

                        total_provider_have_payment = provider_have_cash_payment - provider_paid_order_payment;
                        pay_to_provider = order_payment.total_provider_income - total_provider_have_payment;

                        order_payment.pay_to_store = pay_to_store;

                        order_payment.pay_to_provider = pay_to_provider;

                        order_payment.save().then(() => {
                            response_data.json({
                                success: true,
                                message: STORE_MESSAGE_CODE.PAY_BY_CASH_ON_DELIVERY_SUCCESSFULLY

                            });
                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    } else {
                        response_data.json({ success: false, error_code: STORE_ERROR_CODE.PAY_BY_CASH_ON_DELIVERY_FAILED });

                    }
                } else {
                    response_data.json({ success: false, error_code: STORE_ERROR_CODE.PAY_BY_CASH_ON_DELIVERY_FAILED });
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

/// check_order_status
exports.get_order_detail = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{ name: 'order_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let store_detail = response.store;

            Order.findOne({ _id: request_data_body.order_id, store_id: request_data_body.store_id }).then((order) => {
                if (order) {
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
                    Store.aggregate([query, tax_lookup]).then(store => {
                        if (store.length > 0) {
                            User.findOne({ _id: order.user_id }).then((user_detail) => {
                                Country.findOne({ _id: store_detail.country_id }).then((country_detail) => {
                                    let currency = country_detail.currency_sign;
                                    Cart.findOne({ _id: order.cart_id, store_id: request_data_body.store_id }).then((cart) => {
                                        if (cart) {
                                            cart.total_item_tax = Math.round(cart.total_item_tax)
                                            Order_payment.findOne({ _id: order.order_payment_id, order_id: order._id }).then((order_payment) => {
                                                if (order.request_id) {
                                                    Request.findOne({ _id: order.request_id }, function (err, request_detail) {
                                                        Provider.findOne({ _id: request_detail.current_provider }, function (err, provider) {
                                                            let provider_details = null;
                                                            if (provider) {
                                                                provider_details = {
                                                                    name: provider.first_name + ' ' + provider.last_name,
                                                                    email: provider.email,
                                                                    image_url: provider.image_url,
                                                                    location: provider.location,
                                                                    phone: provider.country_phone_code + provider.phone,
                                                                };
                                                            }
                                                            let order_datail = {
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
                                                                store_tax_details: store[0].tax_details,
                                                                is_tax_included: store[0].is_tax_included,
                                                                is_use_item_tax: store[0].is_use_item_tax
                                                            }
                                                            response_data.json({
                                                                success: true,
                                                                message: ORDER_MESSAGE_CODE.GET_ORDER_STATUS_SUCCESSFULLY,
                                                                order: order_datail
                                                            });
                                                        })
                                                    })
                                                } else {
                                                    let order_datail = {
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
                                                        store_tax_details: store[0].tax_details,
                                                        is_tax_included: store[0].is_tax_included,
                                                        is_use_item_tax: store[0].is_use_item_tax
                                                    }
                                                    response_data.json({
                                                        success: true,
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
                                        } else {
                                            response_data.json({
                                                success: false, error_code: CART_ERROR_CODE.CART_NOT_FOUND
                                            })
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


        } else {
            response_data.json(response);
        }
    });
};

// store_rating_to_user
exports.store_rating_to_user = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{ name: 'order_id', type: 'string' }, { name: 'store_review_to_user' }, { name: 'store_rating_to_user' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let store_detail = response.store;

            Order.findOne({ _id: request_data_body.order_id }).then((order) => {
                if (order) {
                    Review.findOne({ order_id: order._id }).then((review) => {

                        if (review) {
                            let store_rating_to_user = request_data_body.store_rating_to_user;
                            review.store_rating_to_user = store_rating_to_user;
                            review.store_review_to_user = request_data_body.store_review_to_user;


                            let order_status = order.order_status;
                            if (order_status == ORDER_STATE.ORDER_COMPLETED) {
                                User.findOne({ _id: order.user_id }).then((user) => {
                                    if (user) {
                                        let old_rate = user.store_rate;
                                        let old_rate_count = user.store_rate_count;
                                        let new_rate_counter = (old_rate_count + 1);
                                        let new_rate = ((old_rate * old_rate_count) + store_rating_to_user) / new_rate_counter;
                                        new_rate = utils.precisionRoundTwo(Number(new_rate));
                                        user.store_rate = new_rate;
                                        user.store_rate_count = user.store_rate_count + 1;
                                        user.save();
                                        review.save();
                                        order.is_store_rated_to_user = true;
                                        order.save().then(() => {
                                            response_data.json({
                                                success: true,
                                                message: STORE_MESSAGE_CODE.GIVE_RATING_TO_USER_SUCCESSFULLY

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

// store_rating_to_provider
exports.store_rating_to_provider = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{ name: 'order_id', type: 'string' }, { name: 'store_review_to_provider' }, { name: 'store_rating_to_provider' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let store_detail = response.store;

            Order.findOne({ _id: request_data_body.order_id }).then((order) => {
                if (order) {
                    Review.findOne({ order_id: order._id }).then((review) => {

                        if (review) {
                            let store_rating_to_provider = request_data_body.store_rating_to_provider;
                            review.store_rating_to_provider = store_rating_to_provider;
                            review.store_review_to_provider = request_data_body.store_review_to_provider;

                            let order_status = order.order_status;
                            if (order_status == ORDER_STATE.ORDER_COMPLETED) {
                                Request.findOne({ _id: order.request_id }).then((request) => {

                                    Provider.findOne({ _id: request.provider_id }).then((provider) => {
                                        if (provider) {
                                            let old_rate = provider.store_rate;
                                            let old_rate_count = provider.store_rate_count;
                                            let new_rate_counter = (old_rate_count + 1);
                                            let new_rate = ((old_rate * old_rate_count) + store_rating_to_provider) / new_rate_counter;
                                            new_rate = utils.precisionRoundTwo(Number(new_rate));
                                            provider.store_rate = new_rate;
                                            provider.store_rate_count = provider.store_rate_count + 1;
                                            provider.save();
                                            review.save();
                                            order.is_store_rated_to_provider = true;
                                            order.save().then(() => {

                                                response_data.json({
                                                    success: true,
                                                    message: STORE_MESSAGE_CODE.GIVE_RATING_TO_PROVIDER_SUCCESSFULLY

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


        } else {
            response_data.json(response);
        }
    });
};

///// store cancel request
exports.store_cancel_request = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{ name: 'request_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let store_detail = response.store;

            Request.findOne({ _id: request_data_body.request_id, delivery_status_manage_id: ORDER_STATUS_ID.RUNNING }).then((request) => {
                if (request) {
                    Provider.findOne({ _id: request_data_body.provider_id }).then((provider) => {

                        if (provider) {
                            // let requests = provider.requests;

                            // provider.requests = provider.requests - 1

                            // let index = requests.indexOf(request._id);
                            // if (index >= 0) {
                            //     requests.splice(index, 1);
                            //     provider.requests = requests;
                            // }

                            let current_request = provider.current_request;
                            let current_request_index = current_request.indexOf(request._id);
                            if (current_request_index >= 0) {
                                current_request.splice(current_request_index, 1);
                                provider.current_request = current_request;
                            }

                            provider.save();

                            let device_type = provider.device_type;
                            let device_token = provider.device_token;

                            utils.sendPushNotification(ADMIN_DATA_ID.PROVIDER, device_type, device_token, PROVIDER_PUSH_CODE.STORE_CANCELLED_REQUEST, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);

                            if (request_data_body.type && request_data_body.type === 1) {
                                request.cancel_reasons.push('Admin Cancelled')
                            }
                            request.current_provider = null;
                            request.provider_id = null;
                            request.delivery_status = ORDER_STATE.STORE_CANCELLED_REQUEST;
                            request.delivery_status_manage_id = ORDER_STATUS_ID.CANCELLED;
                            request.delivery_status_by = null;
                            request.providers_id_that_rejected_order_request = [];

                            let index = request.date_time.findIndex((x) => x.status == ORDER_STATE.STORE_CANCELLED_REQUEST);

                            if (index == -1) {
                                request.date_time.push({ status: ORDER_STATE.STORE_CANCELLED_REQUEST, date: new Date() });
                            } else {
                                request.date_time[index].date = new Date();
                            }

                            request.save();

                            if (request_data_body.type && request_data_body.type === 1) {
                                Order.findOne({ _id: request.orders.order_id })
                                    .then(order => {
                                        order.cancel_reason = "Admin Cancelled"
                                    })
                            }

                            response_data.json({
                                success: true,
                                message: STORE_MESSAGE_CODE.CANCEL_REQUEST_SUCESSFULLY,
                                delivery_status: request.delivery_status
                            });
                        } else {
                            response_data.json({ success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND });
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


        } else {
            response_data.json(response);
        }
    });
};

// store get_user
exports.get_user = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{ name: 'email', type: 'string' }, { name: 'phone', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let store_detail = response.store;


            let email = ((request_data_body.email).trim()).toLowerCase();
            let phone = request_data_body.phone;
            let country_id = request_data_body.country_id;
            let query = { $or: [{ 'email': email }, { 'phone': phone }] };
            User.findOne(query).then((user_detail) => {
                let query = { $or: [{ '_id': detail.country_id }, { 'country_code': detail.country_code }] };
                Country.findOne(query).then((country_detail) => {
                    if (country_detail) {
                        let minimum_phone_number_length = country_detail.minimum_phone_number_length;
                        let maximum_phone_number_length = country_detail.maximum_phone_number_length;
                        let country_phone_code = country_detail.country_phone_code;
                        let wallet_currency_code = country_detail.currency_code;

                        if (user_detail) {
                            response_data.json({
                                success: true,
                                message: USER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                minimum_phone_number_length: minimum_phone_number_length,
                                maximum_phone_number_length: maximum_phone_number_length,
                                user: user_detail
                            });
                        } else {
                            let server_token = utils.generateServerToken(32);
                            let password = "123456";
                            password = utils.encryptPassword(password);

                            let first_name = (request_data_body.first_name).trim();
                            if (first_name != "" && first_name != undefined && first_name != null) {
                                first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
                            } else {
                                first_name = "";
                            }

                            let last_name = (request_data_body.last_name).trim();
                            if (last_name != "" && last_name != undefined && last_name != null) {
                                last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);
                            } else {
                                last_name = "";
                            }

                            let user_data = new User({
                                user_type: ADMIN_DATA_ID.STORE,
                                admin_type: ADMIN_DATA_ID.USER,
                                user_type_id: null,
                                image_url: "",
                                first_name: first_name,
                                last_name: last_name,
                                email: ((request_data_body.email).trim()).toLowerCase(),
                                password: password,
                                social_id: "",
                                login_by: "",
                                country_phone_code: country_phone_code,
                                phone: phone,
                                address: "",

                                country_id: country_id,
                                city: "",
                                device_token: "",
                                device_type: "",
                                app_version: "",
                                is_email_verified: false,
                                is_phone_number_verified: false,
                                server_token: server_token,
                                orders: [],
                                current_order: null,
                                promo_count: 0,
                                referral_code: "",
                                is_referral: false,
                                referred_by: null,
                                total_referrals: 0,
                                store_rate: 0,
                                store_rate_count: 0,
                                provider_rate: 0,
                                provider_rate_count: 0,
                                wallet: 0,
                                wallet_currency_code: wallet_currency_code,
                                is_use_wallet: false,
                                is_approved: true,
                                location: [],
                                is_document_uploaded: false,
                                is_user_type_approved: false,
                                favourite_stores: []

                            });

                            user_data.save().then(() => {
                                utils.insert_documets_for_new_users(user_data, null, ADMIN_DATA_ID.USER, country_id);
                                if (setting_detail.is_mail_notification) {
                                    emails.sendUserRegisterEmail(request_data, user_data, user_data.first_name + " " + user_data.last_name);

                                }

                                response_data.json({
                                    success: true,
                                    message: USER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                    minimum_phone_number_length: minimum_phone_number_length,
                                    maximum_phone_number_length: maximum_phone_number_length,
                                    user: user_data

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


exports.get_country_phone_number_length = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{ name: 'country_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            Country.findOne({ _id: request_data_body.country_id }).then((country) => {
                if (country) {
                    response_data.json({
                        success: true,
                        message: USER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                        minimum_phone_number_length: country.minimum_phone_number_length,
                        maximum_phone_number_length: country.maximum_phone_number_length
                    });
                } else {
                    response_data.json({ success: false, error_code: USER_ERROR_CODE.REGISTRATION_FAILED });

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

//store complete_order
exports.store_complete_order = function (request_data, response_data) {

    console.log('store_complete_order')
    utils.check_unique_details(request_data, [{ name: 'order_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let order_id = request_data_body.order_id;
            let store = response.store;

            City.findOne({ _id: store.city_id }).then((city) => {

                let is_store_earning_add_in_wallet_on_cash_payment_for_city = city.is_store_earning_add_in_wallet_on_cash_payment;

                let is_store_earning_add_in_wallet_on_other_payment_for_city = city.is_store_earning_add_in_wallet_on_other_payment;

                let city_timezone = city.timezone;
                let now = new Date();
                let today_start_date_time = utils.get_date_now_at_city(now, city_timezone);
                let tag_date = moment(today_start_date_time).format(DATE_FORMATE.DDMMYYYY);
                Order.findOne({ _id: order_id, store_id: request_data_body.store_id, order_status_id: ORDER_STATUS_ID.RUNNING }).then((order) => {
                    if (order) {
                        User.findOne({ _id: order.user_id }).then((user) => {
                            let now = new Date();
                            let user_device_type = user.device_type;
                            let user_device_token = user.device_token;

                            order.order_status_id = ORDER_STATUS_ID.COMPLETED;
                            order.order_status_by = request_data_body.store_id;
                            order.order_status = ORDER_STATE.ORDER_COMPLETED;
                            order.completed_at = now;

                            order.completed_date_tag = tag_date;
                            order.completed_date_in_city_timezone = today_start_date_time;


                            let index = order.date_time.findIndex((x) => x.status == ORDER_STATE.ORDER_COMPLETED);
                            if (index == -1) {
                                order.date_time.push({ status: ORDER_STATE.ORDER_COMPLETED, date: new Date() });
                            } else {
                                order.date_time[index].date = new Date();
                            }

                            order.save();

                            Order_payment.findOne({ _id: order.order_payment_id }).then((order_payment) => {
                                if (order_payment) {

                                    // Entry in Store_analytic_daily Table
                                    utils.insert_daily_store_analytics(tag_date, order.store_id, ORDER_STATE.ORDER_COMPLETED, order_payment.total_item_count, false);



                                    let payment_gateway_name = "Cash";
                                    let is_payment_mode_cash = order_payment.is_payment_mode_cash;


                                    let store_have_service_payment = 0;
                                    let store_have_order_payment = 0;
                                    let total_store_have_payment = 0;
                                    let pay_to_store = 0;

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
                                    let other_promo_payment_loyalty = order_payment.other_promo_payment_loyalty;

                                    pay_to_store = order_payment.total_store_income - other_promo_payment_loyalty;
                                    // if(order_payment.is_user_pick_up_order){
                                    //     pay_to_store = order_payment.total_store_income - total_store_have_payment;
                                    // } else {
                                    if (is_payment_mode_cash) {
                                        pay_to_store = pay_to_store - order_payment.cash_payment;
                                    } else {
                                        pay_to_store = pay_to_store - total_store_have_payment;
                                    }
                                    // }
                                    pay_to_store = utils.precisionRoundTwo(pay_to_store);

                                    order_payment.pay_to_store = pay_to_store;

                                    Payment_gateway.findOne({ _id: order_payment.payment_id }).then((payment_gateway) => {

                                        if (!is_payment_mode_cash) {
                                            payment_gateway_name = payment_gateway.name;
                                        }

                                        if ((setting_detail.is_store_earning_add_in_wallet_on_cash_payment && order_payment.is_payment_mode_cash && is_store_earning_add_in_wallet_on_cash_payment_for_city) || (setting_detail.is_store_earning_add_in_wallet_on_other_payment && !order_payment.is_payment_mode_cash && is_store_earning_add_in_wallet_on_other_payment_for_city)) {
                                            if (pay_to_store < 0) {

                                                let store_total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.STORE, store.unique_id, store._id, store.country_id,
                                                    store.wallet_currency_code, order_payment.order_currency_code,
                                                    1, Math.abs(pay_to_store), store.wallet, WALLET_STATUS_ID.REMOVE_WALLET_AMOUNT, WALLET_COMMENT_ID.SET_ORDER_PROFIT, "Profit Of This Order : " + order.unique_id);

                                                store.wallet = store_total_wallet_amount;
                                            } else {
                                                let store_total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.STORE, store.unique_id, store._id, store.country_id,
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
                                        let reviews = new Review({
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
                                        let store_data = JSON.parse(JSON.stringify(store))
                                        store_data.name = store.name[Number(request_data.headers.lang)];
                                        if (!store_data.name || store_data.name == '') {
                                            store_data.name = store.name[0];
                                        }
                                        if (!store_data.name) {
                                            store_data.name = "";
                                        }
                                        let order_data = {
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
                                    response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_COMPLETE_FAILED });
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


exports.store_change_delivery_address = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{ name: 'latitude' }, { name: 'longitude' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let store = response.store;
            let city_id = store.city_id;
            City.findOne({ _id: city_id }).then((city) => {
                let latlong = [request_data_body.latitude, request_data_body.longitude];

                let cityLatLong = city.city_lat_long;
                let distanceFromSubAdminCity = utils.getDistanceFromTwoLocation(latlong, cityLatLong);
                let cityRadius = city.city_radius;
                if (city.is_use_radius) {
                    if (distanceFromSubAdminCity < cityRadius) {
                        response_data.json({
                            success: true, message: CART_MESSAGE_CODE.DESTINATION_CHANGE_SUCCESSFULLY
                        });

                    } else {
                        response_data.json({ success: false, error_code: CART_ERROR_CODE.CHANGE_DELIVERY_ADDRESS_FAILED });
                    }
                } else {
                    let store_zone = false;
                    if (city.city_locations.length > 0) {
                        store_zone = geolib.isPointInPolygon(
                            { latitude: latlong[0], longitude: latlong[1] },
                            city.city_locations);
                    }
                    if (store_zone) {
                        response_data.json({
                            success: true, message: CART_MESSAGE_CODE.DESTINATION_CHANGE_SUCCESSFULLY
                        });
                    } else {
                        response_data.json({ success: false, error_code: CART_ERROR_CODE.CHANGE_DELIVERY_ADDRESS_FAILED });

                    }
                }
            });


        } else {
            response_data.json(response);
        }
    });
};

/// store_create_order without ITEM
exports.store_create_order = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{ name: 'cart_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let order_type = Number(request_data_body.order_type);
            let store = response.store;

            Cart.findOne({ _id: request_data_body.cart_id }).then((cart) => {

                if (cart) {
                    Order_payment.findOne({ _id: cart.order_payment_id }).then((order_payment) => {
                        if (order_payment) {

                            User.findOne({ _id: cart.user_id }).then((user) => {

                                let user_id = null;
                                let user_unique_id = 0;
                                if (user) {
                                    user_id = user._id;
                                    user_unique_id = user.unique_id;
                                }
                                Country.findOne({ _id: store.country_id }).then((country) => {
                                    City.findOne({ _id: store.city_id }).then((city) => {
                                        let now = new Date();
                                        let city_timezone = "";
                                        let country_id = store.country_id;
                                        let city_id = store.city_id;

                                        if (city) {
                                            city_timezone = city.timezone;
                                            city_id = city._id;
                                        }
                                        if (country) {
                                            country_id = country._id;
                                        }

                                        let distance = setting_detail.default_search_radius / UNIT.DEGREE_TO_KM;

                                        let order = new Order({
                                            store_id: store._id,
                                            cart_id: cart._id,
                                            request_id: null,
                                            order_payment_id: cart.order_payment_id,
                                            country_id: country_id,
                                            city_id: city_id,
                                            timezone: city_timezone,
                                            user_id: user_id,
                                            order_type: order_type,
                                            order_type_id: store._id,
                                            order_status_id: ORDER_STATUS_ID.RUNNING,
                                            order_status: ORDER_STATE.ORDER_READY,
                                            order_status_manage_id: ORDER_STATUS_ID.COMPLETED,
                                            order_status_by: null,
                                            is_schedule_order_informed_to_store: false,
                                            estimated_time_for_ready_order: null,
                                            confirmation_code_for_pick_up_delivery: utils.generateUniqueCode(6),
                                            confirmation_code_for_complete_delivery: utils.generateUniqueCode(6),
                                            store_notify: 0,
                                            cancel_reason: "",
                                            total: order_payment.total,
                                            is_store_rated_to_provider: false,
                                            is_store_rated_to_user: false,
                                            is_bring_change: request_data_body.is_bring_change,

                                            is_provider_rated_to_store: false,
                                            is_provider_rated_to_user: false,
                                            user_detail: {
                                                _id: user._id,
                                                image_url: user.image_url,
                                                email: user.email,
                                                name: user.first_name + ' ' + user.last_name,
                                                phone: user.country_phone_code + user.phone
                                            },
                                            store_detail: {
                                                _id: store._id,
                                                image_url: store.image_url,
                                                email: store.email,
                                                name: store.name,
                                                phone: store.country_phone_code + store.phone
                                            },

                                            is_user_rated_to_provider: false,
                                            is_user_rated_to_store: false,
                                            is_user_show_invoice: false,
                                            is_provider_show_invoice: false,
                                            is_schedule_order: false,
                                            schedule_order_start_at: null,
                                            schedule_order_server_start_at: null,
                                            completed_at: null
                                        });

                                        order.save().then(() => {
                                            user.cart_id = null;
                                            user.save();
                                            let orders_array = {
                                                order_id: order._id,
                                                order_unique_id: order.unique_id,
                                                order_payment_id: order.order_payment_id,
                                                cart_id: order.cart_id
                                            }

                                            let request = new Request({
                                                country_id: country_id,
                                                city_id: city_id,
                                                timezone: city_timezone,
                                                vehicle_id: request_data_body.vehicle_id,
                                                orders: orders_array,
                                                user_id: user_id,
                                                user_unique_id: user_unique_id,
                                                request_type: 2,
                                                request_type_id: store._id,
                                                estimated_time_for_delivery_in_min: 0,

                                                provider_type: 0,
                                                provider_type_id: null,
                                                provider_id: null,
                                                provider_unique_id: 0,
                                                delivery_status: ORDER_STATE.WAITING_FOR_DELIVERY_MAN,
                                                delivery_status_manage_id: ORDER_STATUS_ID.RUNNING,
                                                delivery_status_by: null,
                                                current_provider: null,
                                                user_detail: order.user_detail,
                                                store_detail: order.store_detail,

                                                providers_id_that_rejected_order_request: [],
                                                confirmation_code_for_pick_up_delivery: order.confirmation_code_for_pick_up_delivery,
                                                confirmation_code_for_complete_delivery: order.confirmation_code_for_complete_delivery,

                                                is_forced_assigned: false,
                                                provider_location: [],
                                                provider_previous_location: [],
                                                pickup_addresses: cart.pickup_addresses,
                                                destination_addresses: cart.destination_addresses,
                                                cancel_reasons: [],
                                                completed_at: null

                                            });

                                            request.save().then(() => {
                                                order_payment.order_id = order._id;
                                                order_payment.order_unique_id = order.unique_id;
                                                order_payment.save();
                                                response_data.json({
                                                    success: true,
                                                    message: ORDER_MESSAGE_CODE.ORDER_CREATE_SUCCESSFULLY
                                                });
                                                my_request.findNearestProvider(request, null);

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
                                error_code: ORDER_ERROR_CODE.REQUEST_FAILED
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
            });


        } else {
            response_data.json(response);
        }
    });
};

/// store update_order
exports.store_update_order = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{ name: 'order_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let total_store_tax_price = 0;
            let total_cart_price = 0;
            let store = response.store;
            Order.findOne({ _id: request_data_body.order_id, store_id: request_data_body.store_id }).then((order) => {

                if (order) {
                    Cart.findOne({ _id: order.cart_id }).then((cart_detail) => {
                        // if(request_data_body.is_tax_included && request_data_body.is_use_item_tax){
                        // }

                        if (cart_detail) {
                            cart_detail.is_tax_included = request_data_body.is_tax_included
                            cart_detail.is_use_item_tax = request_data_body.is_use_item_tax
                            // cart_detail.save()
                            let query = {
                                $match: {
                                    _id: { $eq: store._id }
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
                            Store.aggregate([query, tax_lookup]).then(store_details => {

                                cart_detail.order_details = request_data_body.order_details;
                                cart_detail.total_item_count = request_data_body.total_item_count;
                                total_cart_price = request_data_body.total_cart_price;

                                if (store.is_use_item_tax) {
                                    if (request_data_body.total_item_tax) {
                                        total_store_tax_price = request_data_body.total_item_tax;
                                    }
                                } else {
                                    if (total_cart_price) {
                                        total_store_tax_price = 0
                                        // total_store_tax_price =total_cart_price * store.item_tax * 0.01;
                                        store_details[0].tax_details.forEach(tax => {
                                            total_store_tax_price = total_store_tax_price + (total_cart_price * tax.tax * 0.01);
                                        })
                                    } else {
                                        total_cart_price = 0;
                                    }
                                }
                                total_store_tax_price = utils.precisionRoundTwo(Number(total_store_tax_price));

                                cart_detail.total_cart_price = total_cart_price;
                                cart_detail.total_item_tax = total_store_tax_price;
                                console.log('-------order_details---------')
                                cart_detail.save();


                                Order_payment.findOne({ _id: order.order_payment_id }).then((order_payment) => {
                                    if (order_payment) {

                                        let total_item_count = request_data_body.total_item_count;
                                        let order_price = 0;
                                        let total_order_price = 0;
                                        let total_delivery_price = 0;
                                        let total_admin_profit_on_store = 0;
                                        let total_store_income = 0;
                                        let tip_amount = 0;
                                        let remaining_payment = 0;
                                        
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

                                        if (!order_payment.tip_value) {
                                            order_payment.tip_value = 0;
                                        }
                                        if (setting_detail.tip_type == 1) {
                                            tip_amount = (order_payment.tip_value * total_order_price) / 100;
                                            tip_amount = utils.precisionRoundTwo(Number(tip_amount));
                                        } else {
                                            tip_amount = order_payment.tip_value;
                                        }
                                        order_payment.tip_amount = tip_amount;
                                        order_payment.total_provider_income = (order_payment.total_delivery_price - order_payment.total_admin_profit_on_delivery) + +tip_amount;
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
                                            order.order_change = true;
                                            order.user_order_change = false;
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
                                            order_payment.taxes = request_data_body.tax_details

                                            order_payment.total_store_tax_price = total_store_tax_price;
                                            order_payment.total_item_count = total_item_count;
                                            User.findOne({ _id: order.user_id }).then((user_data) => {
                                                let store_data = JSON.parse(JSON.stringify(store))
                                                store_data.name = store.name[Number(request_data.headers.lang)];
                                                if (!store_data.name || store_data.name == '') {
                                                    store_data.name = store.name[0];
                                                }
                                                if (!store_data.name) {
                                                    store_data.name = "";
                                                }
                                                let order_data = {
                                                    order_id: order._id,
                                                    unique_id: order.unique_id,
                                                    store_name: store_data.name,
                                                    store_image: store.image_url
                                                }
                                                utils.sendPushNotificationWithPushData(ADMIN_DATA_ID.USER, user_data.device_type, user_data.device_token, USER_PUSH_CODE.STORE_ORDER_CHANGE, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, order_data, "");
                                            })
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
                                        })
                                    }

                                }, (error) => {
                                    console.log(error)
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });
                            })
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


        } else {
            response_data.json(response);
        }
    });
};

// check_request_status
exports.check_request_status = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{ name: 'order_id', type: 'string' }, { name: 'request_id', type: 'string' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let store_detail = response.store;

            Request.findOne({ _id: request_data_body.request_id }).then((request) => {
                if (request) {
                    Order.findOne({ _id: request_data_body.order_id, store_id: request_data_body.store_id }).then((order) => {
                        if (order) {
                            let country_id = order.country_id;
                            if (country_id == null && country_id == undefined) {
                                country_id = store_detail.country_id;
                            }
                            Country.findOne({ _id: country_id }).then((country_detail) => {
                                let currency = country_detail.currency_sign;
                                Cart.findOne({ _id: order.cart_id, store_id: request_data_body.store_id }).then((cart) => {
                                    if (cart) {
                                        Order_payment.findOne({ _id: order.order_payment_id, order_id: order._id }).then((order_payment) => {
                                            if (order_payment) {

                                                let vehicle_detail = {};
                                                let provider_detail = {};

                                                let bearing = 0;
                                                let image_url = "";
                                                let first_name = "";
                                                let last_name = "";
                                                let phone = "";
                                                let user_rate = 0;
                                                let country_phone_code = "";
                                                let location = [];


                                                let unique_id = 0;
                                                let vehicle_name = "";
                                                let description = "";
                                                let vehicle_image_url = "";
                                                let map_pin_image_url = "";
                                                let is_business = false;

                                                let request_datail = {
                                                    _id: request._id,
                                                    unique_id: request.unique_id,
                                                    order_id: order._id,
                                                    order_unique_id: order.unique_id,
                                                    order_payment_id: order.order_payment_id,
                                                    user_id: request.user_id,
                                                    provider_id: request.provider_id,
                                                    current_provider: request.current_provider,
                                                    is_user_pick_up_order: order_payment.is_user_pick_up_order,
                                                    is_confirmation_code_required_at_pickup_delivery: setting_detail.is_confirmation_code_required_at_pickup_delivery,
                                                    is_confirmation_code_required_at_complete_delivery: setting_detail.is_confirmation_code_required_at_complete_delivery,
                                                    confirmation_code_for_complete_delivery: request.confirmation_code_for_complete_delivery,
                                                    confirmation_code_for_pick_up_delivery: request.confirmation_code_for_pick_up_delivery,
                                                    pickup_addresses: cart.pickup_addresses,
                                                    destination_addresses: cart.destination_addresses,
                                                    currency: currency,
                                                    delivery_status: request.delivery_status,
                                                    total_order_price: order_payment.total_order_price,
                                                    created_at: request.created_at



                                                }
                                                Provider.findOne({ _id: request.current_provider }).then((provider) => {
                                                    if (provider) {
                                                        Vehicle.findOne({ _id: provider.vehicle_id }).then((vehicle) => {
                                                            if (provider) {
                                                                bearing = provider.bearing;
                                                                image_url = provider.image_url;
                                                                first_name = provider.first_name;
                                                                last_name = provider.last_name;
                                                                phone = provider.phone;
                                                                country_phone_code = provider.country_phone_code;
                                                                user_rate = provider.user_rate;
                                                                location = provider.location;
                                                                bearing = provider.bearing;
                                                            }

                                                            if (vehicle) {
                                                                unique_id = vehicle.unique_id;
                                                                vehicle_name = vehicle.vehicle_name;
                                                                description = vehicle.description;
                                                                vehicle_image_url = vehicle.image_url;
                                                                map_pin_image_url = vehicle.map_pin_image_url;
                                                                is_business = vehicle.is_business;

                                                            }

                                                            let provider_detail = {
                                                                image_url: image_url, first_name: first_name,
                                                                last_name: last_name,
                                                                phone: phone,
                                                                country_phone_code: country_phone_code,
                                                                user_rate: user_rate,
                                                                provider_location: location,
                                                                bearing: bearing
                                                            }

                                                            let vehicle_detail = {
                                                                unique_id: unique_id,
                                                                vehicle_name: vehicle_name,
                                                                description: description,
                                                                image_url: vehicle_image_url,
                                                                map_pin_image_url: map_pin_image_url,
                                                                is_business: is_business
                                                            }


                                                            response_data.json({
                                                                success: true,
                                                                message: ORDER_MESSAGE_CODE.GET_REQUEST_STATUS_SUCCESSFULLY,
                                                                request: request_datail,
                                                                provider_detail: provider_detail,
                                                                vehicle_detail: vehicle_detail

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
                                                            success: true,
                                                            message: ORDER_MESSAGE_CODE.GET_REQUEST_STATUS_SUCCESSFULLY,
                                                            request: request_datail,
                                                            provider_detail: provider_detail,
                                                            vehicle_detail: vehicle_detail
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
            response_data.json(response);
        }
    });
};

exports.get_reviews_list = function (request_data, response_data) {

    let request_data_body = request_data.body;
    let order_query = {
        $lookup: {
            from: "orders",
            localField: "order_id",
            foreignField: "_id",
            as: "order_detail"
        }
    };
    let array_to_json_order_detail = { $unwind: "$order_detail" };

    let condition = { "$match": { 'store_id': { $eq: mongoose.Types.ObjectId(request_data_body.store_id) } } };

    let delivery_type_filter = { $match: {} };
    let search_by_filter = { $match: {} };
    let rating_by_filter = { $match: {} };

    let search_by = request_data_body.query.search_by || null;
    let search_value = request_data_body.query.search_value || null;

    let deliveryman_min_rating = request_data_body.query.deliveryman_min_rating;
    let deliveryman_max_rating = request_data_body.query.deliveryman_max_rating;
    let order_min_rating = request_data_body.query.order_min_rating;
    let order_max_rating = request_data_body.query.order_max_rating;

    let filter = { "$match": {} };

    if (request_data_body.start_date && request_data_body.end_date) {
        let start_date = new Date(request_data_body.start_date);
        let end_date = new Date(request_data_body.end_date);
        start_date = start_date.setHours(0, 0, 0, 0);
        start_date = new Date(start_date);
        end_date = end_date.setHours(23, 59, 59, 999);
        end_date = new Date(end_date);

        let timeZone = "Asia/Calcutta";

        if (request_data_body.timezone && request_data_body.timezone !== "") {
            timeZone = request_data_body.timezone;
        }
        start_date = utils.get_date_in_citytimezone(start_date, timeZone)
        end_date = utils.get_date_in_citytimezone(end_date, timeZone)

        filter = { "$match": { "order_detail.completed_at": { $gte: start_date, $lt: end_date } } };

    }



    if (search_by !== null) {
        search_by_filter = { $match: { $or: [] } };
        switch (search_by) {
            case 'user':
                search_by_filter.$match.$or.push({ "order_detail.user_detail.name": { '$regex': search_value, '$options': 'i' } })
                break;
            case 'deliveryman':
                search_by_filter.$match.$or.push({ "order_detail.provider_detail.name": { '$regex': search_value, '$options': 'i' } })
                break;
            case 'order':
                search_by_filter.$match.$or.push({ "order_detail.unique_id": Number(search_value) })
                break;
            default:
                break;
        }
    }

    rating_by_filter = { $match: { $and: [] } }
    if (order_max_rating === 0 && deliveryman_max_rating === 0) {
        rating_by_filter = { $match: {} }
    }

    if (order_max_rating !== 0) {
        rating_by_filter.$match['$and'].push({ user_rating_to_store: { $lte: order_max_rating, $gte: order_min_rating } })
    }
    if (deliveryman_max_rating !== 0) {
        rating_by_filter.$match['$and'].push({ user_rating_to_provider: { $lte: deliveryman_max_rating, $gte: deliveryman_min_rating } })
    }

    if (request_data_body.query.delivery_types && request_data_body.query.delivery_types.length) {

        delivery_type_filter = { $match: { $or: [] } };

        request_data_body.query.delivery_types.forEach(_delivery_type => {
            switch (_delivery_type.name) {
                case 'pickup':
                    delivery_type_filter.$match.$or.push({ "order_detail.is_user_pick_up_order": true })
                    break;
                case 'delivery':
                    delivery_type_filter.$match.$or.push({ "order_detail.is_user_pick_up_order": false })
                    break;
                case 'schedule':
                    delivery_type_filter.$match.$or.push({ "order_detail.is_schedule_order": true })
                    break;
                case 'now':
                    delivery_type_filter.$match.$or.push({ "order_detail.is_schedule_order": false })
                    break;
                default:
                    break;
            }

        })
    }

    let project = {
        $project: {
            user_rating_to_store: "$user_rating_to_store",
            user_review_to_store: "$user_review_to_store",
            provider_review_to_store: "$provider_review_to_store",
            provider_rating_to_store: "$provider_rating_to_store",
            user_name: "$order_detail.user_detail.name",
            provider_name: "$order_detail.provider_detail.name",
            total: "$order_detail.total",
            is_user_pick_up_order: "$order_detail.is_user_pick_up_order",
            is_schedule_order: "$order_detail.is_schedule_order",
            is_payment_mode_cash: "$order_detail.is_payment_mode_cash",
            is_paid_from_wallet: "$order_detail.is_paid_from_wallet",
            unique_id: "$order_detail.unique_id",
            completed_at: "$order_detail.completed_at",
            number_of_users_like_store_comment: 1,
            number_of_users_dislike_store_comment: 1,
            id_of_users_dislike_store_comment: 1,
            id_of_users_like_store_comment: 1
        }
    }

    const aggregate = [condition, order_query, array_to_json_order_detail, filter, delivery_type_filter, search_by_filter, rating_by_filter, project]

    Review.aggregate(aggregate).then((reviews) => {
        response_data.json({
            success: true,
            message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
            reviews: reviews
        });
    }, (error) => {
        console.log(error);
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    });
}

exports.check_store_location = function (request_data, response_data) {
    City.findById(request_data.body.city_id).then(city => {
        let distance = utils.getDistanceFromTwoLocation(city.city_lat_long, [request_data.body.latitude, request_data.body.longitude]);
        let store_zone = false;
        if (!city.is_use_radius && city.city_locations.length > 0) {
            store_zone = geolib.isPointInPolygon(
                { latitude: request_data.body.latitude, longitude: request_data.body.longitude },
                city.city_locations);
        }
        if ((city.is_use_radius && distance <= city.city_radius) || store_zone) {
            response_data.json({ success: true })
        } else {
            response_data.json({ success: false, error_code: STORE_ERROR_CODE.STORE_LOCATION_OUTSIDE_CITY_RANGE });
        }
    })
}

exports.get_store_cancellation_reasons = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {
            Cancellation_reason.aggregate([{$match: {user_type: ADMIN_DATA_ID.STORE}},{$group: {_id: null, reason_list: {$push: { $ifNull: [{ $arrayElemAt: ["$reason", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$reason", 0] }, ""] }] }}}}]).then((reasons)=>{
                if(reasons.length > 0 && reasons[0].reason_list.length > 0){
                    response_data.json({ success: true, reasons: reasons[0].reason_list })
                }else{
                    response_data.json({ success: true, reasons: [] })
                }
            })
        } else {
            response_data.json(response);
        }
    });
}

exports.get_store_review_data = async function (request_data, response_data) {
    utils.check_unique_details(request_data, [{ name: 'store_id', type: 'string' }], function (response) {
        if (!response.success) {
            return response_data.json(response)
        }
    })
    try {
        let request_data_body = request_data.body
        let store = await Store.findOne({ _id: request_data_body.store_id })
        if (!store) {
            return response_data.json({ success: false, error_code: ERROR_CODE.SOMETHING_WENT_WRONG })
        }

        let store_review_list = [];
        let store_condition = { "$match": { 'store_id': { $eq: mongoose.Types.ObjectId(request_data_body.store_id) } } }
        let review_condition = { "$match": { 'user_rating_to_store': { $gt: 0 } } }
        let user_lookup = {
            $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user_detail"
            }
        }
        let user_unwind = { $unwind: "$user_detail" }
        let review_project = {
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
        }
        let review_sort = { $sort: { _id: -1 } }
        let store_review = await Review.aggregate([store_condition, review_condition, user_lookup, user_unwind, review_project, review_sort])
        if (store_review.length > 0) {
            store_review_list = store_review;
        }


        let rating_project = {
            $project: {
                user_rating_to_store: 1,
                store_id: 1
            }
        };
        let rating_project2 = { $project: { user_rating_to_store: { $ceil: "$user_rating_to_store" } } };
        let rating_group = {
            $group: {
                _id: "$user_rating_to_store",
                rate: { $sum: 1 }
            }
        };
        let rating = await Review.aggregate([rating_project, store_condition, review_condition, rating_project2, rating_group])
        let store_rating = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        };
        let store_rating_per = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        };
        let rating_data_count = 0;
        rating.forEach(data => {
            rating_data_count += data.rate;
        });
        rating.forEach(data => {
            store_rating_per[data._id] = Number(((data.rate / rating_data_count) * 100).toFixed(0))
            store_rating[data._id] = Number((data.rate).toFixed(0))
        })

        return response_data.json({
            success: true,
            message: USER_MESSAGE_CODE.GET_STORE_REVIEW_LIST_SUCCESSFULLY,
            store_review_list,
            store_rating,
            store_rating_per
        });
    } catch (e) {
        console.log(e)
        return response_data.json({ success: false, error_code: ERROR_CODE.SOMETHING_WENT_WRONG })
    }
}