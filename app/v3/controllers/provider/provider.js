require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
var console = require('../../utils/console');
var promo_code_controller = require('../../controllers/user/promo_code');
var mongoose = require('mongoose');
var Schema = mongoose.Types.ObjectId;
var utils = require('../../utils/utils');
var emails = require('../../controllers/email_sms/emails');
var wallet_history = require('../../controllers/user/wallet');
var Cart = require('mongoose').model('cart');
var Provider = require('mongoose').model('provider');
var Country = require('mongoose').model('country');
var Order = require('mongoose').model('order');
var Order_payment = require('mongoose').model('order_payment');
var User = require('mongoose').model('user');
var Store = require('mongoose').model('store');
var City = require('mongoose').model('city');
var Review = require('mongoose').model('review');
var Payment_gateway = require('mongoose').model('payment_gateway');
var Referral_code = require('mongoose').model('referral_code');
var Vehicle = require('mongoose').model('vehicle');
var Provider_vehicle = require('mongoose').model('provider_vehicle');
var Request = require('mongoose').model('request');
var Cancellation_reason = require('mongoose').model('cancellation_reason');

// PROVIDER REGISTER API
exports.provider_register = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'country_id'}, {name: 'phone', type: 'string'}, {name: 'email', type: 'string'},
    {name: 'country_phone_code', type: 'string'}, {name: 'city_id'}, {name: 'first_name', type: 'string'}], function (response) {
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
            Country.findOne({_id: request_data_body.country_id}).then((country) => {
                if (country) {
                    Provider.findOne({social_ids: {$all: social_id_array}}).then((provider_detail) => {

                        if (provider_detail) {
                            response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_ALREADY_REGISTER_WITH_SOCIAL});
                        } else {
                            Provider.findOne({email: request_data_body.email}).then((provider_detail) => {
                                if (provider_detail) {
                                    if (social_id != null && provider_detail.social_ids.indexOf(social_id) < 0)
                                    {

                                        provider_detail.social_ids.push(social_id);
                                        provider_detail.save().then(provider => {
                                            // utils.create_user(provider, ADMIN_DATA_ID.PROVIDER, (response) => {
                                            //     provider.uid = response.user_token
                                            //     if(response.success){
                                                    utils.create_user_token(provider, ADMIN_DATA_ID.PROVIDER, response => {
                                                        if(response.success){
                                                            provider.firebase_token = response.user_token
                                                            provider.save()
                                                            response_data.json({
                                                                success: true,
                                                                message: PROVIDER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                                                minimum_phone_number_length: country.minimum_phone_number_length,
                                                                maximum_phone_number_length: country.maximum_phone_number_length,
                                                                provider: provider_detail,
                                                                firebase_token: response.user_token
                                                            });
                                                        } else {
                                                            response_data.json({
                                                                success: false,
                                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                            })
                                                        }
                                                    })
    
                                            //     } else {
                                            //         response_data.json({
                                            //             success: false,
                                            //             error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                            //         })
                                            //     }
                                            // })
                                        });

                                    } else
                                    {
                                        response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.EMAIL_ALREADY_REGISTRED});
                                    }
                                } else {

                                    Provider.findOne({phone: request_data_body.phone}).then((provider_detail) => {
                                        if (provider_detail) {
                                            if (social_id != null && provider_detail.social_ids.indexOf(social_id) < 0)
                                            {
                                                provider_detail.social_ids.push(social_id);
                                                provider_detail.save();
                                                response_data.json({
                                                    success: true,
                                                    message: PROVIDER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                                    minimum_phone_number_length: country.minimum_phone_number_length,
                                                    maximum_phone_number_length: country.maximum_phone_number_length,
                                                    provider: provider_detail

                                                });

                                            } else
                                            {
                                                response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PHONE_NUMBER_ALREADY_REGISTRED});
                                            }
                                        } else {

                                            var first_name = utils.get_string_with_first_letter_upper_case(request_data_body.first_name);
                                            var last_name = utils.get_string_with_first_letter_upper_case(request_data_body.last_name);

                                            //var referral_code = utils.generateReferralCode(first_name, last_name);
                                            var server_token = utils.generateServerToken(32);

                                            if(!request_data_body.provider_type){
                                                request_data_body.provider_type = ADMIN_DATA_ID.ADMIN;
                                                request_data_body.provider_type_id = null;
                                            }
                                            var provider_data = new Provider({
                                                admin_type: ADMIN_DATA_ID.PROVIDER,
                                                first_name: first_name,
                                                last_name: last_name,
                                                provider_type: request_data_body.provider_type,
                                                provider_type_id: request_data_body.provider_type_id,
                                                email: ((request_data_body.email).trim()).toLowerCase(),
                                                password: request_data_body.password,
                                                social_ids: social_id_array,
                                                login_by: request_data_body.login_by,
                                                country_phone_code: request_data_body.country_phone_code,
                                                phone: request_data_body.phone,
                                                address: request_data_body.address,
                                                zipcode: request_data_body.zipcode,
                                                country_id: request_data_body.country_id,
                                                city_id: request_data_body.city_id,
                                                app_version: request_data_body.app_version,
                                                device_token: request_data_body.device_token,
                                                device_type: request_data_body.device_type,
                                                server_token: server_token,
                                                is_email_verified: request_data_body.is_email_verified,
                                                is_phone_number_verified: request_data_body.is_phone_number_verified

                                            })

                                            var image_file = request_data.files;
                                            if (image_file != undefined && image_file.length > 0) {
                                                var image_name = provider_data._id + utils.generateServerToken(4);
                                                var url = utils.getStoreImageFolderPath(FOLDER_NAME.PROVIDER_PROFILES) + image_name + FILE_EXTENSION.PROVIDER;
                                                provider_data.image_url = url;
                                                utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.PROVIDER, FOLDER_NAME.PROVIDER_PROFILES);
                                            }

                                            if (social_id == undefined || social_id == null || social_id == "")
                                            {
                                                provider_data.password = utils.encryptPassword(request_data_body.password);
                                            }
                                            var referral_code = utils.generateReferralCode(ADMIN_DATA_ID.ADMIN, country.country_code, first_name, last_name);
                                            provider_data.referral_code = referral_code;
                                            if (country) {
                                                var wallet_currency_code = country.currency_code;
                                                var wallet_to_admin_current_rate = 1;
                                                var referral_bonus_to_provider = country.referral_bonus_to_provider;
                                                var referral_bonus_to_provider_friend = country.referral_bonus_to_provider_friend;

                                                provider_data.wallet_currency_code = wallet_currency_code;
                                                utils.insert_documets_for_new_users(provider_data, null, ADMIN_DATA_ID.PROVIDER, country._id, function(document_response){
                                                    provider_data.is_document_uploaded = document_response.is_document_uploaded;
                                                    provider_data.save().then((provider_details) => {


                                                        //////////// apply referal //
                                                        if (request_data_body.referral_code != "") {

                                                            Provider.findOne({referral_code: request_data_body.referral_code}).then((provider) => {

                                                                if (provider) {

                                                                    var provider_refferal_count = provider.total_referrals;

                                                                    if (provider_refferal_count < country.no_of_provider_use_referral) {
                                                                        provider.total_referrals = +provider.total_referrals + 1;

                                                                        // Entry in wallet Table //
                                                                        var total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.PROVIDER, provider.unique_id, provider._id, provider.country_id, wallet_currency_code, wallet_currency_code,
                                                                            1, referral_bonus_to_provider, provider.wallet, WALLET_STATUS_ID.ADD_WALLET_AMOUNT, WALLET_COMMENT_ID.ADDED_BY_REFERRAL, "Using Refferal : " + request_data_body.referral_code);

                                                                        provider.wallet = total_wallet_amount;
                                                                        provider.save();

                                                                        provider_data.is_referral = true;
                                                                        provider_data.referred_by = provider._id;

                                                                        // Entry in wallet Table //
                                                                        var new_total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.PROVIDER, provider_data.unique_id, provider_data._id, provider_data.country_id, wallet_currency_code, wallet_currency_code,
                                                                            1, referral_bonus_to_provider_friend, provider_data.wallet, WALLET_STATUS_ID.ADD_WALLET_AMOUNT, WALLET_COMMENT_ID.ADDED_BY_REFERRAL, "Using Refferal : " + request_data_body.referral_code);


                                                                        provider_data.wallet = new_total_wallet_amount;
                                                                        
                                                                        Provider.findOneAndUpdate({_id:provider_data._id}, provider_data, {new : true}).then((provider_data) => {
                                                                            
                                                                        })

                                                                        var referral_code = new Referral_code({
                                                                            user_type: ADMIN_DATA_ID.PROVIDER,
                                                                            user_id: provider._id,
                                                                            user_unique_id: provider.unique_id,
                                                                            user_referral_code: provider.referral_code,
                                                                            referred_id: provider_data._id,
                                                                            referred_unique_id: provider_data.unique_id,
                                                                            country_id: provider_data.country_id,
                                                                            current_rate: 1,
                                                                            referral_bonus_to_user_friend: referral_bonus_to_provider_friend,
                                                                            referral_bonus_to_user: referral_bonus_to_provider,
                                                                            currency_sign:country.currency_sign

                                                                        });
                                                                        utils.getCurrencyConvertRate(1, wallet_currency_code, setting_detail.admin_currency_code, function (response) {

                                                                            if (response.success)
                                                                            {
                                                                                wallet_to_admin_current_rate = response.current_rate;
                                                                            } else
                                                                            {
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
                                                        if (setting_detail.is_mail_notification) {
                                                            emails.sendProviderRegisterEmail(request_data, provider_data, provider_data.first_name + " " + provider_data.last_name);

                                                        }
                                                        utils.create_user(provider_details, ADMIN_DATA_ID.PROVIDER, response => {
                                                            console.log(response.success)
                                                            if(response.success){
                                                                console.log(response.user.uid)
                                                                provider_details.uid = response.user.uid
                                                                provider_details.save().then((provider) => {
                                                                    console.log(provider)
                                                                    utils.create_user_token(provider, ADMIN_DATA_ID.PROVIDER, response => {
                                                                        if (response.success) {
                                                                            provider.firebase_token = response.user_token
                                                                            provider.save().then(provider_details => {
                                                                                response_data.json({
                                                                                    success: true,
                                                                                    message: PROVIDER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                                                                    minimum_phone_number_length: country.minimum_phone_number_length,
                                                                                    maximum_phone_number_length: country.maximum_phone_number_length,
                                                                                    currency_sign: country.currency_sign,
                                                                                    provider: provider_details,
                                                                                    firebase_token: provider_details.firebase_token
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
                                                                                success: false,
                                                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                            });
                                                                        }
                                                                    })
                                                                }).catch(error => {
                                                                    console.log(error)
                                                                    response_data.json({
                                                                        success: false,
                                                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                    });
                                                                })
                                                            } else {
                                                                response_data.json({
                                                                    success: false,
                                                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                });
                                                            }
                                                        })
                                                    }, (error) => {
                                                        console.log(error);
                                                        response_data.json({
                                                            success: false,
                                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                        });
                                                    });
                                                });
                                            }

                                        }
                                    }, (error) => {
                                        console.log(error);
                                        response_data.json({
                                            success: false,
                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                        });
                                    });
                                }
                            }, (error) => {
                                console.log(error);
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });
                        }
                    }, (error) => {
                        console.log(error);
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        });
                    });
                }
            }, (error) => {
                console.log(error);
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

// PROVIDER LOGIN
exports.provider_login = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'email', type: 'string'}], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var email = ((request_data_body.email).trim()).toLowerCase();
            var social_id = request_data_body.social_id;
            var encrypted_password = request_data_body.password;

            if (social_id == undefined || social_id == null || social_id == "") {
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

            Provider.findOne(query).then((provider_detail) => {
                if (social_id == undefined || social_id == null || social_id == "") {
                    social_id = null;
                }

                if ((social_id == null && email == "")) {

                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.LOGIN_FAILED});

                } else if (provider_detail) {

                    if (social_id == null && encrypted_password != "" && encrypted_password != provider_detail.password) {

                        response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.INVALID_PASSWORD});

                    } else if (social_id != null && provider_detail.social_ids.indexOf(social_id) < 0) {

                        response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.USER_NOT_REGISTER_WITH_SOCIAL});

                    } else {

                        Country.findOne({_id: provider_detail.country_id}).then((country) => {
                            var server_token = utils.generateServerToken(32);
                            provider_detail.server_token = server_token;


                            var device_token = "";
                            var device_type = "";

                            if (provider_detail.device_token != "" && provider_detail.device_token != request_data_body.device_token) {
                                device_token = provider_detail.device_token;
                                device_type = provider_detail.device_type;
                            }

                            provider_detail.device_token = request_data_body.device_token;
                            provider_detail.device_type = request_data_body.device_type;
                            provider_detail.login_by = request_data_body.login_by;
                            provider_detail.app_version = request_data_body.app_version;

                            provider_detail.save().then((provider) => {
                                
                                if (device_token != "") {
                                    utils.sendPushNotification(ADMIN_DATA_ID.PROVIDER, device_type, device_token, PROVIDER_PUSH_CODE.LOGIN_IN_OTHER_DEVICE, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                }
                                utils.create_user_token(provider, ADMIN_DATA_ID.PROVIDER, response => {
                                    if(response.success){
                                        provider.firebase_token = response.user_token
                                        provider.save().then(() => {
                                            response_data.json({
                                                success: true,
                                                message: PROVIDER_MESSAGE_CODE.LOGIN_SUCCESSFULLY,
                                                minimum_phone_number_length: country.minimum_phone_number_length,
                                                maximum_phone_number_length: country.maximum_phone_number_length,
                                                currency_sign: country.currency_sign,
                                                provider: provider_detail,
                                                firebase_token: response.user_token
                                            });
                                        })
                                    }
                                })
                            }, (error) => {
                                console.log(error);
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });
                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }

                } else {

                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.NOT_A_REGISTERED});
                }
            }, (error) => {
                console.log(error);
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

// API CALL WHEN ANY PROVIDER UPDATE PROFILE
exports.provider_update = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'email', type: 'string'}, {name: 'phone', type: 'string'}], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var provider_id = request_data_body.provider_id;
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

            Provider.findOne({_id: provider_id}).then((provider) => {

                if (provider) {
                    if (request_data_body.server_token !== null && provider.server_token !== request_data_body.server_token) {

                        response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.INVALID_SERVER_TOKEN});

                    } else if (social_id == null && old_password != "" && old_password != provider.password) {

                        response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.INVALID_PASSWORD});

                    } else if (social_id != null && provider.social_ids.indexOf(social_id) < 0) {

                        response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_NOT_REGISTER_WITH_SOCIAL});

                    } else
                    {

                        Country.findOne({_id: provider.country_id}).then((country) => {

                            var new_email = request_data_body.email;
                            var new_phone = request_data_body.phone;

                            if (request_data_body.new_password != "")
                            {
                                var new_password = utils.encryptPassword(request_data_body.new_password);
                                request_data_body.password = new_password;
                            }

                            request_data_body.social_ids = provider.social_ids;

                            // checking new email address, register or not
                            Provider.findOne({_id: {'$ne': provider_id}, email: new_email}).then((provider_details) => {


                                var is_update = false;
                                if (provider_details) {
                                    if (setting_detail.is_provider_mail_verification && (request_data_body.is_email_verified != null || request_data_body.is_email_verified != undefined)) {
                                        is_update = true;
                                        provider_details.email = "notverified" + provider_details.email;
                                        provider_details.is_email_verified = false;
                                        //provider_details.save();
                                    } else {
                                        is_update = false;
                                    }
                                } else {
                                    is_update = true;
                                }

                                if (is_update)
                                {
                                    is_update = false;

                                    Provider.findOne({_id: {'$ne': provider_id}, phone: new_phone}).then((provider_phone_details) => {

                                        if (provider_phone_details) {
                                            if (setting_detail.is_provider_sms_verification && (request_data_body.is_phone_number_verified != null || request_data_body.is_phone_number_verified != undefined)) {
                                                is_update = true;
                                                provider_phone_details.phone = utils.getNewPhoneNumberFromOldNumber(provider_phone_details.phone);
                                                provider_phone_details.is_phone_number_verified = false;
                                                //provider_phone_details.save();

                                            }
                                        } else {
                                            is_update = true;
                                        }

                                        if (is_update)
                                        {
                                            var social_id_array = [];
                                            if (social_id != null) {
                                                social_id_array.push(social_id);
                                            }

                                            var provider_update_query = {$and: [{'_id': provider_id}, {$or: [{'password': old_password}, {social_ids: {$all: social_id_array}}]}]};

                                            Provider.findOneAndUpdate(provider_update_query, request_data_body, {new : true}).then((provider_data) => {

                                                if (provider_data)
                                                {
                                                    Country.findOne({_id: provider_data.country_id}).then((country) => {

                                                        var image_file = request_data.files;

                                                        if (image_file != undefined && image_file.length > 0) {

                                                            utils.deleteImageFromFolder(provider_data.image_url, FOLDER_NAME.PROVIDER_PROFILES);
                                                            var image_name = provider_data._id + utils.generateServerToken(4);
                                                            var url = utils.getStoreImageFolderPath(FOLDER_NAME.PROVIDER_PROFILES) + image_name + FILE_EXTENSION.PROVIDER;
                                                            utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.PROVIDER, FOLDER_NAME.PROVIDER_PROFILES);
                                                            provider_data.image_url = url;
                                                        }



                                                        var first_name = utils.get_string_with_first_letter_upper_case(request_data_body.first_name);
                                                        var last_name = utils.get_string_with_first_letter_upper_case(request_data_body.last_name);

                                                        provider_data.first_name = first_name;
                                                        provider_data.last_name = last_name;

                                                        if (request_data_body.is_phone_number_verified != undefined)
                                                        {
                                                            provider_data.is_phone_number_verified = request_data_body.is_phone_number_verified;
                                                        }
                                                        if (request_data_body.is_email_verified != undefined)
                                                        {
                                                            provider_data.is_email_verified = request_data_body.is_email_verified;
                                                        }

                                                        provider_data.save().then(provider => {
                                                            if(provider.uid != ""){
                                                                let product_type;
                                                                if (SETTINGS_DETAILS === 1) {
                                                                    product_type = 'live'
                                                                } else if (SETTINGS_DETAILS === 2) {
                                                                    product_type = 'demo'
                                                                } else {
                                                                    product_type = 'development'
                                                                }
                                                                fireUser.updateUser(provider_data.uid, {
                                                                    email: product_type + '_provider_' + provider_data.email
                                                                }).then(() => {
                                                                    return response_data.json({
                                                                        success: true,
                                                                        message: PROVIDER_MESSAGE_CODE.UPDATE_SUCCESSFULLY,
                                                                        minimum_phone_number_length: country.minimum_phone_number_length,
                                                                        maximum_phone_number_length: country.maximum_phone_number_length,
                                                                        provider: provider_data
        
                                                                    });
                                                                }).catch((error) => {
                                                                    console.log(error)
                                                                    return response_data.json({
                                                                        success: false,
                                                                        error_code: PROVIDER_ERROR_CODE.UPDATE_FAILED
                                                                    })
                                                                })
                                                            } else {
                                                                return response_data.json({
                                                                    success: true,
                                                                    message: PROVIDER_MESSAGE_CODE.UPDATE_SUCCESSFULLY,
                                                                    minimum_phone_number_length: country.minimum_phone_number_length,
                                                                    maximum_phone_number_length: country.maximum_phone_number_length,
                                                                    provider: provider_data
                                                                })
                                                            }
                                                        }, (error) => {
                                                            console.log(error);
                                                            return response_data.json({
                                                                success: false,
                                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                            });
                                                        });
                                                    }, (error) => {
                                                        console.log(error);
                                                        return response_data.json({
                                                            success: false,
                                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                        });
                                                    });
                                                } else
                                                {

                                                   return response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.UPDATE_FAILED});
                                                }
                                            }, (error) => {
                                                console.log(error);
                                                return response_data.json({
                                                    success: false,
                                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                });
                                            });
                                        } else
                                        {
                                            response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PHONE_NUMBER_ALREADY_REGISTRED});
                                        }
                                    }, (error) => {
                                        console.log(error);
                                        response_data.json({
                                            success: false,
                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                        });
                                    });
                                } else {
                                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.EMAIL_ALREADY_REGISTRED});
                                }
                            });
                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }
                } else
                {
                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
                }
            }, (error) => {
                console.log(error);
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
exports.provider_otp_verification = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {

                if (provider) {

                    if (request_data_body.server_token !== null && provider.server_token !== request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});

                    } else
                    {

                        if (request_data_body.is_phone_number_verified != undefined) {

                            provider.is_phone_number_verified = request_data_body.is_phone_number_verified;

                            if (provider.phone != request_data_body.phone)
                            {
                                Provider.findOne({phone: request_data_body.phone}).then((provider_phone_detail) => {
                                    if (provider_phone_detail)
                                    {
                                        provider_phone_detail.phone = utils.getNewPhoneNumberFromOldNumber(provider_phone_detail.phone);
                                        provider_phone_detail.is_phone_number_verified = false;
                                        //provider_phone_detail.save();
                                    }
                                }, (error) => {
                                    console.log(error);
                                });
                            }
                            provider.phone = request_data_body.phone;

                        }

                        if (request_data_body.is_email_verified != undefined)
                        {
                            provider.is_email_verified = request_data_body.is_email_verified;

                            if (provider.email != request_data_body.email)
                            {
                                Provider.findOne({email: request_data_body.email}).then((provider_email_detail) => {
                                    if (provider_email_detail)
                                    {
                                        provider_email_detail.email = "notverified" + provider_email_detail.email;
                                        provider_email_detail.is_email_verified = false;
                                        //provider_email_detail.save();
                                    }
                                }, (error) => {
                                    console.log(error);

                                });
                            }

                            provider.email = request_data_body.email;
                        }

                        provider.save().then(() => {
                                response_data.json({
                                    success: true,
                                    message: PROVIDER_MESSAGE_CODE.OTP_VERIFICATION_SUCCESSFULLY
                                });
                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }
                } else
                {
                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
                }
            }, (error) => {
                console.log(error);
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
            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {
                if (provider) {
                    if (provider.server_token != request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        provider.device_token = request_data_body.device_token;
                        provider.save().then(() => {
                            response_data.json({
                                success: true,
                                message: PROVIDER_MESSAGE_CODE.DEVICE_TOKEN_UPDATE_SUCCESSFULLY
                            });
                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }

                } else
                {
                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
                }
            }, (error) => {
                console.log(error);
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

// GET PROVIDER DETAILS
exports.get_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {
                if (provider) {
                    if (request_data_body.server_token !== null && provider.server_token != request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        Country.findOne({_id: provider.country_id}).then((country) => {
                            provider.app_version = request_data_body.app_version;
                            if (request_data_body.device_token != undefined) {
                                provider.device_token = request_data_body.device_token;
                            } else {
                                provider.device_token = provider.device_token;
                            }
                            provider.save().then((provider) => {
                                Vehicle.findOne({_id: provider.vehicle_id}).then((vehicle) => {
                                    var vehicle_detail = {}
                                    if (vehicle) {
                                        vehicle_detail = vehicle;
                                    }
                                    var is_document_uploaded = true;

                                    if (provider.vehicle_ids.length == 0)
                                    {
                                        is_document_uploaded = false;
                                        response_data.json({
                                            success: true,
                                            message: PROVIDER_MESSAGE_CODE.GET_DETAIL_SUCCESSFULLY,
                                            is_vehicle_document_uploaded: is_document_uploaded,
                                            minimum_phone_number_length: country.minimum_phone_number_length,
                                            maximum_phone_number_length: country.maximum_phone_number_length,
                                            currency_sign: country.currency_sign,
                                            vehicle_detail: vehicle_detail,
                                            provider: provider
                                        });

                                    } else
                                    {

                                        Provider_vehicle.find({_id: {$in: provider.vehicle_ids}, is_document_uploaded: false}).then((provider_vehicle) => {

                                            if (provider_vehicle.length > 0)
                                            {
                                                is_document_uploaded = false;
                                            }

                                            response_data.json({
                                                success: true,
                                                message: PROVIDER_MESSAGE_CODE.GET_DETAIL_SUCCESSFULLY,
                                                is_vehicle_document_uploaded: is_document_uploaded,
                                                minimum_phone_number_length: country.minimum_phone_number_length,
                                                maximum_phone_number_length: country.maximum_phone_number_length,
                                                currency_sign: country.currency_sign,
                                                vehicle_detail: vehicle_detail,
                                                provider: provider
                                            });
                                        }, (error) => {
                                            console.log(error);
                                            response_data.json({
                                                success: false,
                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                            });
                                        });
                                    }
                                }, (error) => {
                                    console.log(error);
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });
                            }, (error) => {
                                console.log(error);
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });
                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }

                } else
                {
                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
                }
            }, (error) => {
                console.log(error);
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

// PROVIDER LOGOUT , IN THIS API WE WILL SAVE PROVIDE LOGOUT TIME in PROVIDER ANALYTICS
exports.logout = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {
                if (provider) {
                    if (request_data_body.server_token !== null && provider.server_token != request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        City.findOne({_id: provider.city_id}).then((city) => {

                            var city_timezone = city.timezone;

                            if (provider.is_online) {
                                utils.insert_daily_provider_analytics(city_timezone, provider._id, 0, true, null, provider.is_active_for_job, null);
                            }

                            provider.device_token = "";
                            provider.server_token = "";
                            provider.is_online = false;
                            provider.is_active_for_job = false;
                            provider.save().then(() => {
                                response_data.json({
                                    success: true,
                                    message: PROVIDER_MESSAGE_CODE.LOGOUT_SUCCESSFULLY
                                });
                            }, (error) => {
                                console.log(error);
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });
                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }

                } else
                {
                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
                }
            }, (error) => {
                console.log(error);
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

// CHANGE PROVIDER ONLINE AND ACTIVE FOR JOB STATUS
exports.change_status = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'is_online'}, {name: 'is_active_for_job'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {
                if (provider) {

                    if (request_data_body.server_token !== null && provider.server_token != request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        City.findOne({_id: provider.city_id}).then((city) => {
                            var city_timezone = city.timezone;
                            var date_now = new Date();
                            var is_online = Boolean(request_data_body.is_online);
                            var is_active_for_job = Boolean(request_data_body.is_active_for_job);
                            var provider_time_diff_in_sec_online_time = 0;
                            var provider_time_diff_in_sec_active_job_time = 0;

                            var is_active_time = false;
                            var is_online_time = false;
                            var start_time = null;
                            var start_active_time = null;
                            if (provider.is_online != is_online)
                            {
                                is_online_time = true;

                                if (is_online)
                                {
                                    provider.start_online_time = date_now;

                                } else {
                                    provider_time_diff_in_sec_online_time = utils.getTimeDifferenceInSecond(date_now, provider.start_online_time);

                                    start_time = provider.start_online_time;
                                    provider.start_online_time = null;
                                }

                                provider.is_online = is_online;
                                provider.total_online_time = +provider.total_online_time + +provider_time_diff_in_sec_online_time;

                            }

                            if (provider.is_active_for_job != is_active_for_job)
                            {
                                is_active_time = true;

                                if (is_active_for_job)
                                {
                                    provider.start_active_job_time = date_now;

                                } else {
                                    provider_time_diff_in_sec_active_job_time = utils.getTimeDifferenceInSecond(date_now, provider.start_active_job_time);

                                    start_active_time = provider.start_active_job_time;
                                    provider.start_active_job_time = null;
                                }
                                provider.is_active_for_job = is_active_for_job;
                                provider.total_active_job_time = +provider.total_active_job_time + +provider_time_diff_in_sec_active_job_time;
                            }
                            provider.save().then(() => {
                                    utils.insert_daily_provider_analytics(city_timezone, provider._id, 0, is_online_time, start_time, is_active_time, start_active_time);
                                    response_data.json({success: true, message: PROVIDER_MESSAGE_CODE.STATUS_CHANGED_SUCCESSFULLY, is_online: provider.is_online,
                                        is_active_for_job: provider.is_active_for_job});
                            }, (error) => {
                                console.log(error);
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });

                            });
                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }

                } else
                {
                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
                }
            }, (error) => {
                console.log(error);
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

// GET PENDING PROVIDER ORDERS (REMAINING TO ACCEPT)
exports.get_requests = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider_detail) => {

                if (provider_detail) {

                    if (request_data_body.server_token !== null && provider_detail.server_token !== request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {

                        var provider_condition = { $match: {$or: [ {'current_provider': {$eq: Schema(request_data_body.provider_id) }} , {'provider_id': {$eq: Schema(request_data_body.provider_id) }} ] } };
                        var delivery_status_condition = {"$match": {'delivery_status': {$eq: ORDER_STATE.WAITING_FOR_DELIVERY_MAN}}};
                        var delivery_status_manage_id_condition = {"$match": {'delivery_status_manage_id': {$eq: ORDER_STATUS_ID.RUNNING}}};

                        Request.aggregate([provider_condition, delivery_status_condition, delivery_status_manage_id_condition,

                            {"$unwind": "$orders"},
                            {
                                $lookup:
                                    {
                                        from: "orders",
                                        localField: "orders.order_id",
                                        foreignField: "_id",
                                        as: "order_detail"
                                    }
                            },
                            {"$unwind": "$order_detail"},
                            {
                                "$match": {'order_detail.order_status_id': {$eq: ORDER_STATUS_ID.RUNNING}}
                            },
                            {
                                $group: {
                                    _id: '$_id',
                                    requests: {
                                        $push: {
                                            _id: '$_id', unique_id: '$unique_id',
                                            order_id: "$order_detail._id",
                                            is_allow_contactless_delivery: "$order_detail.is_allow_contactless_delivery",
                                            order_unique_id: "$order_detail.unique_id",
                                            created_at: "$created_at",
                                            delivery_status: "$delivery_status",
                                            estimated_time_for_delivery_in_min: "$estimated_time_for_delivery_in_min",
                                            estimated_time_for_ready_order: "$order_detail.estimated_time_for_ready_order",
                                            is_provider_show_invoice: "$order_detail.is_provider_show_invoice",
                                            pickup_addresses: "$pickup_addresses",
                                            destination_addresses: "$destination_addresses",
                                            store_name: { $ifNull: [{ $arrayElemAt: ["$order_detail.store_detail.name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$store_detail.name", 0] }, ""] }] },
                                            image_url: '$order_detail.image_url',
                                            store_image_url: { $ifNull: ["$order_detail.store_detail.image_url", ""] },
                                            delivery_type: '$order_detail.delivery_type',
                                            is_bring_change: '$order_detail.is_bring_change'
                                        }
                                    }
                                }
                            }
                        ]).then((requests) => {

                            if (requests.length == 0) {
                                response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                            } else {

                                response_data.json({success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_FOR_PROVIDER_SUCCESSFULLY,
                                    request_list: requests
                                });
                            }
                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }
                } else
                {
                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
                }
            }, (error) => {
                console.log(error);
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

// GET ACCEPTED REQUEST LIST
exports.get_active_requests = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider_detail) => {
                if (provider_detail) {

                    if (request_data_body.server_token !== null && provider_detail.server_token !== request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        var provider_condition = {"$match": {'provider_id': Schema(request_data_body.provider_id) }};
                        var order_condition =
                            {
                                $match: {$or: [{$and: [{"order_detail.is_provider_show_invoice": {$eq: false}}, {'order_detail.order_status_id': {$eq: ORDER_STATUS_ID.COMPLETED}}]}, {'order_detail.order_status_id': {$eq: ORDER_STATUS_ID.RUNNING}}]}
                            }


                        var sort = {"$sort": {}};
                        sort["$sort"]['updated_at'] = parseInt(-1);

                        Request.aggregate([provider_condition, sort,
                            {"$unwind": "$orders"},
                            {
                                $lookup:
                                    {
                                        from: "orders",
                                        localField: "orders.order_id",
                                        foreignField: "_id",
                                        as: "order_detail"
                                    }
                            },
                            {"$unwind": "$order_detail"},
                            {
                                $lookup:
                                    {
                                        from: "stores",
                                        localField: "store_detail._id",
                                        foreignField: "_id",
                                        as: "store_details"
                                    }
                            },
                            // {"$unwind": "$store_details"},
                            {
                                $unwind: 
                                {
                                    path: "$store_details",
                                    preserveNullAndEmptyArrays: true
                                }
                            },

                            order_condition,
                            
                            {
                                $group: {
                                    _id: '$_id',
                                    requests: {
                                        $push: {
                                            _id: '$_id',
                                            unique_id: '$unique_id',
                                            order_id: "$order_detail._id",
                                            is_allow_contactless_delivery: "$order_detail.is_allow_contactless_delivery",
                                            order_unique_id: "$order_detail.unique_id",
                                            created_at: "$created_at",
                                            delivery_status: "$delivery_status",
                                            estimated_time_for_delivery_in_min: "$estimated_time_for_delivery_in_min",
                                            estimated_time_for_ready_order: "$order_detail.estimated_time_for_ready_order",
                                            is_provider_show_invoice: "$order_detail.is_provider_show_invoice",
                                            pickup_addresses: "$pickup_addresses",
                                            destination_addresses: "$destination_addresses",
                                            // store_name: "$store_detail.name",
                                            store_name: { $ifNull: [{ $arrayElemAt: ["$store_details.name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$store_details.name", 0] }, ""] }] },
                                            user_detail: "$order_detail.user_detail",
                                            store_image_url: { $ifNull: ["$store_detail.image_url", ""] },
                                            delivery_type: '$order_detail.delivery_type',
                                            is_bring_change: "$order_detail.is_bring_change"
                                        }
                                    }
                                }
                            }
                        ]).then((requests) => {
                            if (requests.length == 0) {

                                response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                            } else {

                                response_data.json({success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_FOR_PROVIDER_SUCCESSFULLY,
                                    request_list: requests
                                });
                            }
                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: 2223
                            });
                        });
                    }
                } else
                {
                    response_data.json({success: false, error_code: 2222});
                }
            }, (error) => {
                console.log(error);
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

// GET ORDER STATUS in DETAILS
exports.get_order_status = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'order_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider_detail) => {
                if (provider_detail) {
                    if (request_data_body.server_token !== null && provider_detail.server_token !== request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        Order.findOne({_id: request_data_body.order_id, current_provider: request_data_body.provider_id}).then((order) => {

                            if (order) {

                                var start_time = order.delivery_send_at;
                                var end_time = new Date(Date.now());
                                var time_diff_sec = utils.getTimeDifferenceInSecond(end_time, start_time);

                                var time_left_to_responds_trip = setting_detail.provider_timeout - time_diff_sec;
                                if (time_left_to_responds_trip <= 0)
                                {
                                    time_left_to_responds_trip = 0;
                                    // REMOVE THIS ORDER FROM CURRENT ORDER AND ORDERS LIST FROM PROVIDERS
                                }

                                var total_distance = 0;
                                var total_time = 0;
                                var total_provider_income = 0;

                                User.findOne({_id: order.user_id}).then((user_detail) => {
                                    Store.findOne({_id: order.store_id}).then((store_detail) => {
                                        Order_payment.findOne({order_id: request_data_body.order_id}).then((order_payment) => {

                                            if (order_payment) {
                                                total_distance = order_payment.total_distance;
                                                total_time = order_payment.total_time;
                                                total_provider_income = order_payment.total_provider_income;
                                            }
                                            var order_detail = {};
                                            var store_detail = JSON.parse(JSON.stringify(store_detail))
                                            store_detail.name = String(store.name[Number(request_data.headers.lang)]);
                                            var store_name = '';
                                            var store_image = '';
                                            if(store_detail){
                                                store_name = store_detail.name;
                                                store_image = store_detail.image_url;
                                            }

                                            if (order.estimated_time_for_ready_order != undefined)
                                            {

                                                order_detail = {
                                                    time_left_to_responds_trip: time_left_to_responds_trip,
                                                    _id: order._id,
                                                    unique_id: order.unique_id,
                                                    currency: order.currency,
                                                    total_provider_income: total_provider_income,
                                                    estimated_time_for_ready_order: order.estimated_time_for_ready_order,
                                                    is_confirmation_code_required_at_pickup_delivery: setting_detail.is_confirmation_code_required_at_pickup_delivery,
                                                    is_confirmation_code_required_at_complete_delivery: setting_detail.is_confirmation_code_required_at_complete_delivery,
                                                    confirmation_code_for_complete_delivery: order.confirmation_code_for_complete_delivery,
                                                    confirmation_code_for_pick_up_delivery: order.confirmation_code_for_pick_up_delivery,
                                                    order_status: order.order_status,
                                                    note_for_deliveryman: order.note_for_deliveryman,
                                                    order_status_id: order.order_status_id,
                                                    source_address: order.source_address,
                                                    destination_address: order.destination_address,
                                                    source_location: order.source_location,
                                                    destination_location: order.destination_location,
                                                    total_distance: total_distance,
                                                    total_time: total_time,
                                                    store_id: store_detail._id,
                                                    store_name: store_name,
                                                    store_image: store_image,
                                                    delivery_type: order.delivery_type,
                                                    image_url: order.image_url

                                                }
                                            } else
                                            {
                                                order_detail = {
                                                    time_left_to_responds_trip: time_left_to_responds_trip,
                                                    _id: order._id,
                                                    unique_id: order.unique_id,
                                                    currency: order.currency,
                                                    total_provider_income: total_provider_income,
                                                    is_confirmation_code_required_at_pickup_delivery: setting_detail.is_confirmation_code_required_at_pickup_delivery,
                                                    is_confirmation_code_required_at_complete_delivery: setting_detail.is_confirmation_code_required_at_complete_delivery,
                                                    confirmation_code_for_complete_delivery: order.confirmation_code_for_complete_delivery,
                                                    confirmation_code_for_pick_up_delivery: order.confirmation_code_for_pick_up_delivery,
                                                    order_status: order.order_status,
                                                    note_for_deliveryman: order.note_for_deliveryman,
                                                    order_status_id: order.order_status_id,
                                                    source_address: order.source_address,
                                                    destination_address: order.destination_address,
                                                    source_location: order.source_location,
                                                    destination_location: order.destination_location,
                                                    total_distance: total_distance,
                                                    store_id: store_detail._id,
                                                    total_time: total_time,
                                                    store_name: store_name,
                                                    store_image: store_image,
                                                    delivery_type: order.delivery_type,
                                                    image_url: order.image_url

                                                }
                                            }

                                            response_data.json({success: true,
                                                message: ORDER_MESSAGE_CODE.GET_ORDER_DATA_SUCCESSFULLY,
                                                order: order_detail, user_detail: user_detail
                                            });

                                        }, (error) => {
                                            console.log(error);
                                            response_data.json({
                                                success: false,
                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                            });
                                        });
                                    }, (error) => {
                                        console.log(error);
                                        response_data.json({
                                            success: false,
                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                        });
                                    });
                                }, (error) => {
                                    console.log(error);
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });

                            } else {
                                response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                            }
                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }
                } else
                {
                    response_data.json({success: false, error_code: PRODUCT_ERROR_CODE.PRODUCT_DATA_NOT_FOUND});
                }
            }, (error) => {
                console.log(error);
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

// get_request_status in DETAILS
exports.get_request_status = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'request_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider_detail) => {
                if (provider_detail) {

                    if (request_data_body.server_token !== null && provider_detail.server_token !== request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        Request.findOne({_id: request_data_body.request_id, current_provider: request_data_body.provider_id}).then((request) => {

                            if (request) {
                                Order.findOne({_id: request.orders[0].order_id}).then((order_detail) => {
                                    if (order_detail) {
                                        Cart.findOne({_id: order_detail.cart_id}).then((cart) => {
                                            var order_details = [];

                                            if (cart) {
                                                order_details = cart.order_details
                                            }

                                            var start_time = null;
                                            var index = request.date_time.findIndex((x) => x.status == ORDER_STATE.WAITING_FOR_DELIVERY_MAN);
                                            if (index >= 0) {
                                                start_time = request.date_time[index].date;
                                            }

                                            var end_time = new Date(Date.now());

                                            var time_diff_sec = utils.getTimeDifferenceInSecond(end_time, start_time);

                                            var time_left_to_responds_trip = setting_detail.provider_timeout - time_diff_sec;

                                            if (time_left_to_responds_trip <= 0)
                                            {
                                                time_left_to_responds_trip = 0;
                                                // REMOVE THIS ORDER FROM CURRENT ORDER AND ORDERS LIST FROM PROVIDERS
                                            }

                                            var total_distance = 0;
                                            var total_time = 0;
                                            var total_provider_income = 0;

                                            User.findOne({_id: request.user_id}).then((user_detail) => {
                                                Store.findOne({_id: order_detail.store_id}).then((store_detail) => {
                                                    var country_id = order_detail.country_id;
                                                    Country.findOne({_id: country_id}).then((country_detail) => {
                                                        var currency = country_detail.currency_sign;
                                                        Order_payment.findOne({order_id: order_detail._id}).then((order_payment) => {

                                                            if (order_payment) {
                                                                total_distance = order_payment.total_distance;
                                                                total_time = order_payment.total_time;
                                                                total_provider_income = order_payment.total_provider_income;
                                                            }
                                                            var request_detail = {};

                                                            var store_name = '';
                                                            var store_image = '';
                                                            var store_country_phone_code = '';
                                                            var store_phone = '';

                                                            if(store_detail){
                                                                
                                                                store_name = store_detail.name[Number(request_data.headers.lang)];
                                                                console.log();
                                                                if(!store_name || store_name == ''){
                                                                    store_name = store_detail.name[0];
                                                                }
                                                                if(!store_detail.name){
                                                                    store_name = "";
                                                                }
                                                                store_image = store_detail.image_url;
                                                                store_country_phone_code = store_detail.country_phone_code;
                                                                store_phone = store_detail.phone;
                                                            }

                                                            if (order_detail.estimated_time_for_ready_order != undefined)
                                                            {

                                                                request_detail = {
                                                                    time_left_to_responds_trip: time_left_to_responds_trip,
                                                                    order_id: order_detail._id,
                                                                    order_unique_id: order_detail.unique_id,
                                                                    is_allow_contactless_delivery: order_detail.is_allow_contactless_delivery,
                                                                    is_allow_pickup_order_verification: order_detail.is_allow_pickup_order_verification,
                                                                    _id: request._id,
                                                                    destination_index: request.destination_index,
                                                                    unique_id: request.unique_id,
                                                                    currency: currency,
                                                                    total_provider_income: total_provider_income,
                                                                    estimated_time_for_ready_order: order_detail.estimated_time_for_ready_order,
                                                                    is_confirmation_code_required_at_pickup_delivery: setting_detail.is_confirmation_code_required_at_pickup_delivery,
                                                                    is_confirmation_code_required_at_complete_delivery: setting_detail.is_confirmation_code_required_at_complete_delivery,
                                                                    confirmation_code_for_complete_delivery: request.confirmation_code_for_complete_delivery,
                                                                    confirmation_code_for_pick_up_delivery: request.confirmation_code_for_pick_up_delivery,
                                                                    delivery_status: request.delivery_status,

                                                                    delivery_status_manage_id: request.delivery_status_manage_id,
                                                                    pickup_addresses: request.pickup_addresses,
                                                                    destination_addresses: request.destination_addresses,
                                                                    total_distance: total_distance,
                                                                    total_time: total_time,
                                                                    store_id: order_detail.store_id,
                                                                    store_name: store_name,
                                                                    store_image: store_image,
                                                                    store_phone: store_phone,
                                                                    store_country_phone_code: store_country_phone_code,
                                                                    order_details: order_details,
                                                                    delivery_type: order_detail.delivery_type,
                                                                    image_url: order_detail.image_url

                                                                }
                                                            } else
                                                            {
                                                                request_detail = {
                                                                    time_left_to_responds_trip: time_left_to_responds_trip,
                                                                    order_id: order_detail._id,
                                                                    order_unique_id: order_detail.unique_id,
                                                                    estimated_time_for_delivery_in_min: request.estimated_time_for_delivery_in_min,
                                                                    is_allow_contactless_delivery: order_detail.is_allow_contactless_delivery,
                                                                    is_allow_pickup_order_verification: setting_detail.is_allow_pickup_order_verification,
                                                                    _id: request._id,
                                                                    destination_index: request.destination_index,
                                                                    unique_id: request.unique_id,

                                                                    currency: currency,
                                                                    total_provider_income: total_provider_income,

                                                                    is_confirmation_code_required_at_pickup_delivery: setting_detail.is_confirmation_code_required_at_pickup_delivery,
                                                                    is_confirmation_code_required_at_complete_delivery: setting_detail.is_confirmation_code_required_at_complete_delivery,
                                                                    confirmation_code_for_complete_delivery: request.confirmation_code_for_complete_delivery,
                                                                    confirmation_code_for_pick_up_delivery: request.confirmation_code_for_pick_up_delivery,
                                                                    delivery_status: request.delivery_status,

                                                                    delivery_status_manage_id: request.delivery_status_manage_id,
                                                                    pickup_addresses: request.pickup_addresses,
                                                                    destination_addresses: request.destination_addresses,

                                                                    total_distance: total_distance,
                                                                    total_time: total_time,
                                                                    store_id: order_detail.store_id,
                                                                    store_name: store_name,
                                                                    store_image: store_image,
                                                                    store_phone: store_phone,
                                                                    store_country_phone_code: store_country_phone_code,

                                                                    order_details: order_details,
                                                                    delivery_type: order_detail.delivery_type,
                                                                    image_url: order_detail.image_url


                                                                }
                                                            }

                                                            response_data.json({success: true,
                                                                message: ORDER_MESSAGE_CODE.GET_ORDER_DATA_SUCCESSFULLY,
                                                                request: request_detail, user_detail: user_detail, 
                                                                is_distance_unit_mile: order_payment.is_distance_unit_mile
                                                            });
                                                        }, (error) => {
                                                            console.log(error);
                                                            response_data.json({
                                                                success: false,
                                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                            });
                                                        });
                                                    }, (error) => {
                                                        console.log(error);
                                                        response_data.json({
                                                            success: false,
                                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                        });
                                                    });
                                                }, (error) => {
                                                    console.log(error);
                                                    response_data.json({
                                                        success: false,
                                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                    });
                                                });
                                            }, (error) => {
                                                console.log(error);
                                                response_data.json({
                                                    success: false,
                                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                });

                                            });
                                        });
                                    } else
                                    {
                                        response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                                    }
                                }, (error) => {
                                    console.log(error);
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });
                            } else {
                                response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                            }
                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }
                } else
                {
                    response_data.json({success: false, error_code: PRODUCT_ERROR_CODE.PRODUCT_DATA_NOT_FOUND});
                }
            }, (error) => {
                console.log(error);
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

// UPDATE LOCATION IN RUNNING DELIVERIES
exports.update_location = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {
                if (provider) {
                    if (request_data_body.server_token !== null && provider.server_token != request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        var now = new Date(Date.now());
                        provider.previous_location = provider.location;
                        provider.location = [request_data_body.latitude, request_data_body.longitude];
                        provider.bearing = request_data_body.bearing;
                        provider.location_updated_time = now;
                        provider.save().then(() => {
                            response_data.json({success: true, message: PROVIDER_MESSAGE_CODE.LOCATION_UPDATE_SUCCESSFULLY,
                                    location: provider.location,
                                    bearing: provider.bearing});
                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }
                } else
                {
                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
                }
            }, (error) => {
                console.log(error);
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

// PROVIDER HISTORY DETAILS
exports.request_history_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'request_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {

                if (provider) {
                    if (request_data_body.server_token !== null && provider.server_token != request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        var array_to_json_order_payment = {$unwind: "$order_payment_detail"};
                        var provider_condition = {"$match": {'provider_id': {$eq: mongoose.Types.ObjectId(request_data_body.provider_id)}}};
                        var request_condition = {"$match": {'_id': {$eq: mongoose.Types.ObjectId(request_data_body.request_id)}}};
                        var delivery_status_condition = {"$match": {'delivery_status': {$eq: ORDER_STATE.ORDER_COMPLETED}}};
                        var delivery_status_manage_id_condition = {"$match": {'delivery_status_manage_id': {$eq: ORDER_STATUS_ID.COMPLETED}}};

                        Request.aggregate([request_condition, provider_condition, delivery_status_condition, delivery_status_manage_id_condition]).then((requests) => {
                        
                            if (requests.length > 0) {
                                var request = requests[0];
                                Order.findOne({_id: request.orders[0].order_id}).then((order_detail) => {

                                    if (order_detail)
                                    {
                                        var country_id = order_detail.country_id;

                                        Store.findOne({_id: order_detail.store_id}).then((store_data) => {
                                            Cart.findOne({_id: order_detail.cart_id}).then((cart_data) => {

                                                User.findOne({_id: request.user_id}).then((user_data) => {

                                                    Order_payment.findOne({_id: order_detail.order_payment_id}).then((order_payment) => {
                                                        // var provider_rating_to_user = 0
                                                        // var provider_rating_to_store = 0
                                                        // var store_rating_to_provider = 0
                                                        // var store_rating_to_user = 0
                                                        // var user_rating_to_provider = 0
                                                        // var user_rating_to_store = 0
                                                        Review.findOne({order_id: request.orders[0].order_id}).then(review_details => {
                                                            if(review_details){
                                                                provider_rating_to_user = review_details.provider_rating_to_user,
                                                                provider_rating_to_store = review_details.provider_rating_to_store,
                                                                store_rating_to_provider = review_details.store_rating_to_provider,
                                                                store_rating_to_user = review_details.store_rating_to_user,
                                                                user_rating_to_provider = review_details.user_rating_to_provider,
                                                                user_rating_to_store = review_details.user_rating_to_store
                                                            }else{
                                                                provider_rating_to_user = 0,
                                                                provider_rating_to_store = 0,
                                                                store_rating_to_provider = 0,
                                                                store_rating_to_user = 0,
                                                                user_rating_to_provider = 0,
                                                                user_rating_to_store = 0
                                                            }
                                                        
                                                            var payment_gateway_name = "Cash";
                                                            if (order_payment && !order_payment.is_payment_mode_cash) {
                                                                payment_gateway_name = "Card";
                                                            }

                                                            var store_detail = {}
                                                            if(store_data){
                                                                var store_detail = JSON.parse(JSON.stringify(store_data))
                                                                store_detail.name = store_data.name[Number(request_data.headers.lang)];
                                                                if(!store_detail.name || store_detail.name == ''){
                                                                    store_detail.name = store_data.name[0];
                                                                }
                                                                if(!store_detail.name){
                                                                    store_detail.name = "";
                                                                }
                                                                store_detail = {
                                                                    name: store_detail.name,
                                                                    image_url: store_data.image_url,
                                                                }
                                                            }

                                                            var user_detail = {
                                                                first_name: user_data.first_name,
                                                                last_name: user_data.last_name,
                                                                image_url: user_data.image_url,
                                                            }

                                                                    response_data.json({success: true,
                                                                        message: PROVIDER_MESSAGE_CODE.GET_PROVIDER_ORDER_DETAIL_SUCCESSFULLY,
                                                                       
                                                                        order_payment: order_payment,
                                                                        store_detail: store_detail,
                                                                        user_detail: user_detail,
                                                                        cart_data: cart_data,
                                                                        order_detail: order_detail,
                                                                        payment_gateway_name: payment_gateway_name,
                                                                        request: requests[0],provider_rating_to_user,
                                                                        provider_rating_to_store,
                                                                        store_rating_to_provider,
                                                                        store_rating_to_user,
                                                                        user_rating_to_provider,
                                                                        user_rating_to_store});
                                                                    })               
                                                                
                                                    }, (error) => {
                                                        console.log(error);
                                                        response_data.json({
                                                            success: false,
                                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                        });
                                                    });

                                                }, (error) => {
                                                    console.log(error);
                                                    response_data.json({
                                                        success: false,
                                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                    });
                                                });
                                            }, (error) => {
                                                console.log(error);
                                                response_data.json({
                                                    success: false,
                                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                });
                                            });
                                        }, (error) => {
                                            console.log(error);
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
                                    console.log(error);
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });
                            }
                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }
                } else
                {
                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
                }
            }, (error) => {
                console.log(error);
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

// PROVIDER HISTORY LIST
exports.request_history = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'start_date', type: 'string'}, {name: 'end_date', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {
                if (provider) {
                    if (request_data_body.server_token !== null && provider.server_token != request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {

                        var start_date, end_date;

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

                        var provider_condition = {"$match": {'provider_id': {$eq: mongoose.Types.ObjectId(request_data_body.provider_id)}}};

                        var delivery_status_condition = {"$match": {$or: [{delivery_status: ORDER_STATE.ORDER_COMPLETED}, {delivery_status: ORDER_STATE.STORE_CANCELLED}, {delivery_status: ORDER_STATE.DELIVERY_MAN_CANCELLED}]}};
                        var delivery_status_manage_id_condition = {"$match": {$or: [{delivery_status_manage_id: ORDER_STATUS_ID.COMPLETED}, {delivery_status_manage_id: ORDER_STATUS_ID.CANCELLED}]}};

                        var filter = {"$match": {"completed_date_in_city_timezone": {$gte: start_date, $lt: end_date}}};
                        Request.aggregate([filter, provider_condition, delivery_status_condition, delivery_status_manage_id_condition, 
                            
                            {$unwind: "$orders"},
                            {
                                $lookup:
                                    {
                                        from: "orders",
                                        localField: "orders.order_id",
                                        foreignField: "_id",
                                        as: "order_detail"
                                    }
                            },
                            {$unwind: "$order_detail"},

                            {$project: {created_at: "$created_at",
                                    delivery_status: "$delivery_status",
                                    completed_at: "$completed_at",
                                    unique_id: "$unique_id",
                                    delivery_type: '$order_detail.delivery_type',
                                    total: "$order_detail.total",
                                    user_detail: "$order_detail.user_detail"
                                }},
                        ]).then((requests) => {
                            if (requests.length == 0) {
                                response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.ORDER_HISTORY_NOT_FOUND});
                            } else
                            {
                                response_data.json({success: true,
                                    message: PROVIDER_MESSAGE_CODE.ORDER_HISTORY_SUCCESSFULLY,
                                    request_list: requests});
                            }
                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });



                    }
                } else
                {
                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
                }
            }, (error) => {
                console.log(error);
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

// provider_rating_to_user
exports.provider_rating_to_user = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'request_id', type: 'string'}, {name: 'provider_review_to_user'}, {name: 'provider_rating_to_user'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {
                if (provider) {
                    if (request_data_body.server_token !== null && provider.server_token != request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {

                        Request.findOne({_id: request_data_body.request_id}).then((request) => {
                            if (request)
                            {
                                Order.findOne({_id: request.orders[0].order_id}).then((order) => {
                                    if (order) {
                                        Review.findOne({order_id: order._id}).then((review) => {
                                            if (review) {
                                                var provider_rating_to_user = request_data_body.provider_rating_to_user;

                                                review.provider_rating_to_user = provider_rating_to_user;
                                                review.provider_review_to_user = request_data_body.provider_review_to_user;


                                                var delivery_status = request.delivery_status;
                                                if (delivery_status == ORDER_STATE.ORDER_COMPLETED) {

                                                    User.findOne({_id: order.user_id}).then((user) => {
                                                        if (user)
                                                        {
                                                            var old_rate = user.provider_rate;
                                                            var old_rate_count = user.provider_rate_count;
                                                            var new_rate_counter = (old_rate_count + 1);

                                                            var new_rate = ((old_rate * old_rate_count) + provider_rating_to_user) / new_rate_counter;
                                                            new_rate = utils.precisionRoundTwo(Number(new_rate));
                                                            user.provider_rate = new_rate;
                                                            user.provider_rate_count = user.provider_rate_count + 1;
                                                            order.is_provider_rated_to_user = true;
                                                            order.save().then(() => {
                                                                user.save();
                                                                review.save();
                                                                response_data.json({success: true,
                                                                    message: PROVIDER_MESSAGE_CODE.GIVE_RATING_TO_USER_SUCCESSFULLY

                                                                });
                                                            }, (error) => {
                                                                console.log(error);
                                                                response_data.json({
                                                                    success: false,
                                                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                });
                                                            });
                                                        }
                                                    }, (error) => {
                                                        console.log(error);
                                                        response_data.json({
                                                            success: false,
                                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                        });
                                                    });
                                                } else {

                                                    response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                                                }

                                            } else
                                            {
                                                response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});

                                            }
                                        }, (error) => {
                                            console.log(error);
                                            response_data.json({
                                                success: false,
                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                            });
                                        });
                                    }
                                }, (error) => {
                                    console.log(error);
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });
                            } else {

                                response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                            }
                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }
                } else
                {
                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
                }
            }, (error) => {
                console.log(error);
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

// provider_rating_to_user
exports.provider_rating_to_store = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'request_id', type: 'string'}, {name: 'provider_review_to_store'}, {name: 'provider_rating_to_store'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {
                if (provider) {
                    if (request_data_body.server_token !== null && provider.server_token != request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        Request.findOne({_id: request_data_body.request_id}).then((request) => {
                            if (request)
                            {
                                Order.findOne({_id: request.orders[0].order_id}).then((order) => {
                                    if (order) {
                                        Review.findOne({order_id: order._id}).then((review) => {

                                            if (review) {
                                                var provider_rating_to_store = request_data_body.provider_rating_to_store;

                                                review.provider_rating_to_store = provider_rating_to_store;
                                                review.provider_review_to_store = request_data_body.provider_review_to_store;


                                                var delivery_status = request.delivery_status;

                                                if (delivery_status == ORDER_STATE.ORDER_COMPLETED) {


                                                    Store.findOne({_id: order.store_id}).then((store) => {
                                                        if (store)
                                                        {
                                                            var old_rate = store.provider_rate;
                                                            var old_rate_count = store.provider_rate_count;
                                                            var new_rate_counter = (old_rate_count + 1);
                                                            var new_rate = ((old_rate * old_rate_count) + provider_rating_to_store) / new_rate_counter;
                                                            new_rate = utils.precisionRoundTwo(Number(new_rate));
                                                            store.provider_rate = new_rate;
                                                            store.provider_rate_count = store.provider_rate_count + 1;
                                                            order.is_provider_rated_to_store = true;
                                                            order.save().then(() => {
                                                                    store.save();
                                                                    review.save();
                                                                    response_data.json({success: true,
                                                                        message: PROVIDER_MESSAGE_CODE.GIVE_RATING_TO_STORE_SUCCESSFULLY

                                                                    });
                                                            }, (error) => {
                                                                console.log(error);
                                                                response_data.json({
                                                                    success: false,
                                                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                });
                                                            });
                                                        }
                                                    }, (error) => {
                                                        console.log(error);
                                                        response_data.json({
                                                            success: false,
                                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                        });
                                                    });
                                                } else {

                                                    response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                                                }

                                            } else
                                            {
                                                response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});

                                            }
                                        }, (error) => {
                                            console.log(error);
                                            response_data.json({
                                                success: false,
                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                            });
                                        });

                                    }
                                }, (error) => {
                                    console.log(error);
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });

                            }
                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        })
                    }
                } else
                {
                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
                }
            }, (error) => {
                console.log(error);
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

//get_request_count
exports.get_request_count = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {
                if (provider) {
                    if (request_data_body.server_token !== null && provider.server_token != request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        Request.aggregate([{$match: {$or: [{'current_provider': {$eq: Schema(request_data_body.provider_id) }}, {'provider_id': {$eq: Schema(request_data_body.provider_id) }}]}},

                            {"$unwind": "$orders"},
                            {
                                $lookup:
                                    {
                                        from: "orders",
                                        localField: "orders.order_id",
                                        foreignField: "_id",
                                        as: "order_detail"
                                    }
                            },
                            {"$unwind": "$order_detail"},
                            {
                                $match: {$or: [{$and: [{"order_detail.is_provider_show_invoice": {$eq: false}}, {'order_detail.order_status_id': {$eq: 10}}]}, {'order_detail.order_status_id': {$eq: 1}}]}
                            }]).then((requests) => {

                            if (requests.length == 0) {

                                response_data.json({success: true,
                                    message: PROVIDER_MESSAGE_CODE.GET_REQUEST_COUNT_SUCCESSFULLY,
                                    request_count: 0

                                });
                            } else {
                                response_data.json({success: true,
                                    message: PROVIDER_MESSAGE_CODE.GET_REQUEST_COUNT_SUCCESSFULLY,
                                    request_count: requests.length
                                });
                            }
                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }
                } else
                {
                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
                }
            }, (error) => {
                console.log(error);
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

exports.get_provider_cancellation_reasons = function (request_data, response_data) {
    Cancellation_reason.aggregate([{$match: {user_type: ADMIN_DATA_ID.PROVIDER}},{$group: {_id: null, reason_list: {$push: { $ifNull: [{ $arrayElemAt: ["$reason", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$reason", 0] }, ""] }] }}}}]).then((reasons)=>{
        if(reasons.length > 0 && reasons[0].reason_list.length > 0){
            response_data.json({ success: true, reasons: reasons[0].reason_list })
        }else{
            response_data.json({ success: true, reasons: [] })
        }
    })
}