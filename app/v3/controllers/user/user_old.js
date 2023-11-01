require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
var utils = require('../../utils/utils');
var emails = require('../../controllers/email_sms/emails');
var wallet_history = require('../../controllers/user/wallet');
var mongoose = require('mongoose');
var Product = require('mongoose').model('product');
var User = require('mongoose').model('user');
var Country = require('mongoose').model('country');
var Provider = require('mongoose').model('provider');
var Store = require('mongoose').model('store');
var City = require('mongoose').model('city');
var Service = require('mongoose').model('service');
var Order = require('mongoose').model('order');
var Payment_gateway = require('mongoose').model('payment_gateway');
var Order_payment = require('mongoose').model('order_payment');
var Promo_code = require('mongoose').model('promo_code');
var Cart = require('mongoose').model('cart');
var Review = require('mongoose').model('review');
var Referral_code = require('mongoose').model('referral_code');
var Vehicle = require('mongoose').model('vehicle');
var Delivery = require('mongoose').model('delivery');
var Advertise = require('mongoose').model('advertise');
var Item = require('mongoose').model('item');
var Request = require('mongoose').model('request');
var geolib = require('geolib');
var console = require('../../utils/console');


// USER REGISTER API
exports.user_register = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [{name: 'email', type: 'string'}, {name: 'country_id', type: 'string'}, {name: 'phone', type: 'string'},
        {name: 'country_phone_code', type: 'string'}, {name: 'first_name', type: 'string'}, {name: 'last_name', type: 'string'}], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var social_id = request_data_body.social_id;
            var cart_unique_token = request_data_body.cart_unique_token;

            var social_id_array = [];

            if (social_id == undefined || social_id == null || social_id == "") {
                social_id = null;
            } else {
                social_id_array.push(social_id);
            }

            Country.findOne({_id: request_data_body.country_id}).then((country) => {
                if (country) {
                    User.findOne({social_ids: {$all: social_id_array}}).then((user_detail) => {

                        if (user_detail) {
                            response_data.json({success: false, error_code: USER_ERROR_CODE.USER_ALREADY_REGISTER_WITH_SOCIAL});

                        } else {
                            User.findOne({email: request_data_body.email}).then((user_detail) => {

                                if (user_detail) {
                                    if (social_id != null && user_detail.social_ids.indexOf(social_id) < 0) {
                                        user_detail.social_ids.push(social_id);
                                        user_detail.save();
                                        response_data.json({
                                            success: true,
                                            message: USER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                            minimum_phone_number_length: country.minimum_phone_number_length,
                                            maximum_phone_number_length: country.maximum_phone_number_length,
                                            user: user_detail

                                        });
                                    } else {
                                        response_data.json({
                                            success: false,
                                            error_code: USER_ERROR_CODE.EMAIL_ALREADY_REGISTRED
                                        });
                                    }
                                } else {
                                    User.findOne({phone: request_data_body.phone}).then((user_detail) => {
                                        if (user_detail) {

                                            if (social_id != null && user_detail.social_ids.indexOf(social_id) < 0) {
                                                user_detail.social_ids.push(social_id);
                                                user_detail.save();
                                                response_data.json({
                                                    success: true,
                                                    message: USER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                                    minimum_phone_number_length: country.minimum_phone_number_length,
                                                    maximum_phone_number_length: country.maximum_phone_number_length,
                                                    user: user_detail
                                                });

                                            } else {
                                                response_data.json({
                                                    success: false,
                                                    error_code: USER_ERROR_CODE.PHONE_NUMBER_ALREADY_REGISTRED
                                                });
                                            }

                                        } else {

                                            var first_name = utils.get_string_with_first_letter_upper_case(request_data_body.first_name);
                                            var last_name = utils.get_string_with_first_letter_upper_case(request_data_body.last_name);
                                            var city = utils.get_string_with_first_letter_upper_case(request_data_body.city);
                                            var server_token = utils.generateServerToken(32);

                                            var user_data = new User({
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
                                                country_id: request_data_body.country_id,
                                                city: city,
                                                device_token: request_data_body.device_token,
                                                device_type: request_data_body.device_type,
                                                app_version: request_data_body.app_version,
                                                is_email_verified: request_data_body.is_email_verified,
                                                is_phone_number_verified: request_data_body.is_phone_number_verified,
                                                server_token: server_token,
                                            });

                                            var image_file = request_data.files;
                                            if (image_file != undefined && image_file.length > 0) {
                                                var image_name = user_data._id + utils.generateServerToken(4);
                                                var url = utils.getStoreImageFolderPath(FOLDER_NAME.USER_PROFILES) + image_name + FILE_EXTENSION.USER;
                                                user_data.image_url = url;
                                                utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.USER, FOLDER_NAME.USER_PROFILES);

                                            }

                                            if (social_id == undefined || social_id == null || social_id == "") {
                                                user_data.password = utils.encryptPassword(request_data_body.password);
                                            }

                                            var referral_code = utils.generateReferralCode(ADMIN_DATA_ID.ADMIN, country.country_code, first_name, last_name);
                                            user_data.referral_code = referral_code;
                                            user_data.wallet_currency_code = country.currency_code;

                                            // Start Apply Referral //
                                            if (request_data_body.referral_code != "") {
                                                User.findOne({referral_code: request_data_body.referral_code}).then((user) => {
                                                    if (user) {

                                                        var referral_bonus_to_user = country.referral_bonus_to_user;
                                                        var referral_bonus_to_user_friend = country.referral_bonus_to_user_friend;
                                                        var user_refferal_count = user.total_referrals;
                                                        if (user_refferal_count < country.no_of_user_use_referral) {
                                                            user.total_referrals = +user.total_referrals + 1;

                                                            var wallet_information = { referral_code : referral_code , user_friend_id : user_data._id } ;
                                                            var total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.USER, user.unique_id, user._id, user.country_id, country.currency_code, country.currency_code,
                                                                1, referral_bonus_to_user, user.wallet, WALLET_STATUS_ID.ADD_WALLET_AMOUNT, WALLET_COMMENT_ID.ADDED_BY_REFERRAL, "Using Refferal : " + request_data_body.referral_code ,  wallet_information);


                                                            // Entry in wallet Table //
                                                            user.wallet = total_wallet_amount;
                                                            user.save();
                                                            user_data.is_referral = true;
                                                            user_data.referred_by = user._id;

                                                            // Entry in wallet Table //
                                                            wallet_information = { referral_code : referral_code , user_friend_id : user._id } ;
                                                            var new_total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.USER, user_data.unique_id, user_data._id, user_data.country_id, country.currency_code, country.currency_code,
                                                                1, referral_bonus_to_user_friend, user_data.wallet, WALLET_STATUS_ID.ADD_WALLET_AMOUNT, WALLET_COMMENT_ID.ADDED_BY_REFERRAL, "Using Refferal : " + request_data_body.referral_code , wallet_information);

                                                            user_data.wallet = new_total_wallet_amount;
                                                            user_data.save();

                                                            // Entry in referral_code Table //
                                                            var referral_code = new Referral_code({
                                                                user_type: ADMIN_DATA_ID.USER,
                                                                user_id: user._id,
                                                                user_unique_id: user.unique_id,
                                                                user_referral_code: user.referral_code,
                                                                referred_id: user_data._id,
                                                                referred_unique_id: user_data.unique_id,
                                                                country_id: user_data.country_id,
                                                                current_rate: 1,
                                                                referral_bonus_to_user_friend: referral_bonus_to_user_friend,
                                                                referral_bonus_to_user: referral_bonus_to_user
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
                                                });
                                            }
                                            // End Apply Referral //
                                            user_data.save().then(() => {
                                                    var country_id = country._id;
                                                    utils.insert_documets_for_new_users(user_data, null, ADMIN_DATA_ID.USER, country_id);

                                                    if (setting_detail.is_mail_notification) {
                                                        emails.sendUserRegisterEmail(request_data, user_data, user_data.first_name + " " + user_data.last_name);
                                                    }

                                                    Cart.findOne({cart_unique_token: cart_unique_token}).then((cart) => {
                                                        if (cart) {
                                                            cart.user_id = user_data._id;
                                                            cart.cart_unique_token = "";
                                                            cart.save();
                                                            user_data.cart_id = cart._id;
                                                            user_data.save();
                                                        }
                                                    });


                                                    response_data.json({
                                                        success: true,
                                                        message: USER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                                        minimum_phone_number_length: country.minimum_phone_number_length,
                                                        maximum_phone_number_length: country.maximum_phone_number_length,
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

//USER LOGIN API 
exports.user_login = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [{name: 'email', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var email = ((request_data_body.email).trim()).toLowerCase();
            var social_id = request_data_body.social_id;
            var cart_unique_token = request_data_body.cart_unique_token;

            var encrypted_password = request_data_body.password;
            if (social_id == undefined || social_id == null || social_id == "") {
                social_id = "";
            }
            if (encrypted_password == undefined || encrypted_password == null || encrypted_password == "") {
                encrypted_password = "";
            } else {
                encrypted_password = utils.encryptPassword(encrypted_password);
            }
            var query = {$or: [{'email': email}, {'phone': email}, {social_ids: {$all: [social_id]}}]};

            User.findOne(query).then((user_detail) => {
                if (social_id == undefined || social_id == null || social_id == "") {
                    social_id = null;
                }
                if ((social_id == null && email == "")) {
                    response_data.json({success: false, error_code: USER_ERROR_CODE.LOGIN_FAILED});
                } else if (user_detail) {

                    if (social_id == null && encrypted_password != "" && encrypted_password != user_detail.password) {
                        response_data.json({success: false, error_code: USER_ERROR_CODE.INVALID_PASSWORD});
                    } else if (social_id != null && user_detail.social_ids.indexOf(social_id) < 0) {
                        response_data.json({success: false, error_code: USER_ERROR_CODE.USER_NOT_REGISTER_WITH_SOCIAL});
                    } else {
                        Country.findOne({_id: user_detail.country_id}).then((country) => {
                            var server_token = utils.generateServerToken(32);
                            user_detail.server_token = server_token;
                            var device_token = "";
                            var device_type = "";
                            if (user_detail.device_token != "" && user_detail.device_token != request_data_body.device_token) {
                                device_token = user_detail.device_token;
                                device_type = user_detail.device_type;
                            }
                            user_detail.device_token = request_data_body.device_token;
                            user_detail.device_type = request_data_body.device_type;
                            user_detail.login_by = request_data_body.login_by;
                            user_detail.app_version = request_data_body.app_version;

                            user_detail.save().then(() => {

                                Cart.findOne({cart_unique_token: cart_unique_token}).then((cart) => {

                                    if (cart) {
                                        cart.user_id = user_detail._id;
                                        cart.user_type_id = user_detail._id;
                                        cart.cart_unique_token = "";
                                        cart.save();

                                        user_detail.cart_id = cart._id;
                                        user_detail.save();
                                    }
                                });


                                if (device_token != "") {
                                    utils.sendPushNotification(ADMIN_DATA_ID.USER, device_type, device_token, USER_PUSH_CODE.LOGIN_IN_OTHER_DEVICE, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                }
                                response_data.json({
                                    success: true,
                                    message: USER_MESSAGE_CODE.LOGIN_SUCCESSFULLY,
                                    minimum_phone_number_length: country.minimum_phone_number_length,
                                    maximum_phone_number_length: country.maximum_phone_number_length,
                                    user: user_detail
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
                } else {
                    response_data.json({success: false, error_code: USER_ERROR_CODE.NOT_A_REGISTERED});
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

// USER UPDATE PROFILE DETAILS
exports.user_update = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var user_id = request_data_body.user_id;
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

            User.findOne({_id: user_id}).then((user) => {
                if (user) {
                    if (request_data_body.server_token !== null && user.server_token !== request_data_body.server_token) {
                        response_data.json({success: false, error_code: USER_ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else if (social_id == null && old_password != "" && old_password != user.password) {
                        response_data.json({success: false, error_code: USER_ERROR_CODE.INVALID_PASSWORD});
                    } else if (social_id != null && user.social_ids.indexOf(social_id) < 0) {
                        response_data.json({success: false, error_code: USER_ERROR_CODE.USER_NOT_REGISTER_WITH_SOCIAL});
                    } else {
                        Country.findOne({_id: user.country_id}).then((country) => {
                            var new_email = request_data_body.email;
                            var new_phone = request_data_body.phone;

                            if (request_data_body.new_password != "") {
                                var new_password = utils.encryptPassword(request_data_body.new_password);
                                request_data_body.password = new_password;
                            }
                            request_data_body.social_ids = user.social_ids;
                            User.findOne({_id: {'$ne': user_id}, email: new_email}).then((user_details) => {

                                var is_update = false;
                                if (user_details) {
                                    if (setting_detail.is_user_mail_verification && (request_data_body.is_email_verified != null || request_data_body.is_email_verified != undefined)) {
                                        is_update = true;
                                        user_details.email = "notverified" + user_details.email;
                                        user_details.is_email_verified = false;
                                        user_details.save();
                                    }
                                } else {
                                    is_update = true;
                                }

                                if (is_update) {
                                    is_update = false;
                                    User.findOne({
                                        _id: {'$ne': user_id},
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
                                            var social_id_array = [];
                                            if (social_id != null) {
                                                social_id_array.push(social_id);
                                            }
                                            var user_update_query = {$or: [{'password': old_password}, {social_ids: {$all: social_id_array}}]};
                                            user_update_query = {$and: [{'_id': user_id}, user_update_query]};


                                            User.findOneAndUpdate(user_update_query, request_data_body, {new : true}).then((user_data) => {
                                                if (user_data) {
                                                    var image_file = request_data.files;
                                                    if (image_file != undefined && image_file.length > 0) {
                                                        utils.deleteImageFromFolder(user_data.image_url, FOLDER_NAME.USER_PROFILES);
                                                        var image_name = user_data._id + utils.generateServerToken(4);
                                                        var url = utils.getStoreImageFolderPath(FOLDER_NAME.USER_PROFILES) + image_name + FILE_EXTENSION.USER;
                                                        utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.USER, FOLDER_NAME.USER_PROFILES);
                                                        user_data.image_url = url;
                                                    }

                                                    var first_name = utils.get_string_with_first_letter_upper_case(request_data_body.first_name);
                                                    var last_name = utils.get_string_with_first_letter_upper_case(request_data_body.last_name);
                                                    user_data.first_name = first_name;
                                                    user_data.last_name = last_name;
                                                    if (request_data_body.is_phone_number_verified != undefined) {
                                                        user_data.is_phone_number_verified = request_data_body.is_phone_number_verified;
                                                    }
                                                    if (request_data_body.is_email_verified != undefined) {
                                                        user_data.is_email_verified = request_data_body.is_email_verified;
                                                    }

                                                    user_data.save().then(() => {
                                                            response_data.json({
                                                                success: true, message: USER_MESSAGE_CODE.UPDATE_SUCCESSFULLY,
                                                                minimum_phone_number_length: country.minimum_phone_number_length,
                                                                maximum_phone_number_length: country.maximum_phone_number_length,
                                                                user: user_data
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
                                    response_data.json({success: false, error_code: USER_ERROR_CODE.EMAIL_ALREADY_REGISTRED});
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
                    response_data.json({success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND});
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

            var request_data_body = request_data.body;
            User.findOne({_id: request_data_body.user_id}).then((user) => {
                if (user) {
                    if (request_data_body.server_token !== null && user.server_token != request_data_body.server_token) {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else {
                        Country.findOne({_id: user.country_id}).then((country) => {
                            user.app_version = request_data_body.app_version;
                            if (request_data_body.device_token != undefined) {
                                user.device_token = request_data_body.device_token;
                            }
                            user.save().then(() => {
                                    response_data.json({
                                        success: true,
                                        message: USER_MESSAGE_CODE.GET_DETAIL_SUCCESSFULLY,
                                        minimum_phone_number_length: country.minimum_phone_number_length,
                                        maximum_phone_number_length: country.maximum_phone_number_length,
                                        user: user
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
                    response_data.json({success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND});
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

    utils.check_request_params(request_data.body, [{name: 'device_token', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            User.findOne({_id: request_data_body.user_id}).then((user) => {
                if (user) {
                    if (request_data_body.server_token !== null && user.server_token !== request_data_body.server_token) {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
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
                    response_data.json({success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND});
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

            var request_data_body = request_data.body;
            User.findOne({_id: request_data_body.user_id}).then((user) => {
                if (user) {
                    if (request_data_body.server_token !== null && user.server_token !== request_data_body.server_token) {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});

                    } else {

                        if (request_data_body.is_phone_number_verified != undefined) {
                            user.is_phone_number_verified = request_data_body.is_phone_number_verified;
                            if (user.phone != request_data_body.phone) {
                                User.findOne({phone: request_data_body.phone}).then((user_phone_detail) => {
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
                                User.findOne({email: request_data_body.email}).then((user_email_detail) => {
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
                    response_data.json({success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND});
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

            var request_data_body = request_data.body;
            User.findOne({_id: request_data_body.user_id}).then((user) => {
                if (user) {
                    if (request_data_body.server_token !== null && user.server_token !== request_data_body.server_token) {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
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
                    response_data.json({success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND});
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

    utils.check_request_params(request_data.body, [{name: 'country', type: 'string'}, {name: 'latitude'},{name: 'longitude'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var country = request_data_body.country;
            var server_time = new Date();
            var country_code = request_data_body.country_code;
            var country_code_2 = request_data_body.country_code_2;

            Country.findOne({$and: [{$or: [{country_name: country}, {country_code: country_code}, {country_code_2: country_code_2}]}, {is_business: true}]}).then((country_data) => {

                if (!country_data){
                    response_data.json({success: false, error_code: COUNTRY_ERROR_CODE.BUSINESS_NOT_IN_YOUR_COUNTRY});
                }else {

                    var city_lat_long = [request_data_body.latitude, request_data_body.longitude];
                    var country_id = country_data._id;
                    City.find({country_id: country_id, is_business: true}).then((cityList) => {

                        var size = cityList.length;
                        var count = 0;
                        if (size == 0) {
                            response_data.json({success: false, error_code: CITY_ERROR_CODE.BUSINESS_NOT_IN_YOUR_CITY});
                        } else {
                            var finalCityId = null;
                            var finalDistance = 1000000;

                            cityList.forEach(function (city_detail) {
                                count++;
                                if (city_detail.is_use_radius) {
                                    var cityLatLong = city_detail.city_lat_long;
                                    var distanceFromSubAdminCity = utils.getDistanceFromTwoLocation(city_lat_long, cityLatLong);
                                    var cityRadius = city_detail.city_radius;

                                    if (distanceFromSubAdminCity < cityRadius) {
                                        if (distanceFromSubAdminCity < finalDistance) {
                                            finalDistance = distanceFromSubAdminCity;
                                            finalCityId = city_detail._id;
                                        }
                                    }

                                } else {
                                    var store_zone = false;
                                    if(city_detail.city_locations.length > 0){
                                        store_zone = geolib.isPointInPolygon(
                                        {latitude: city_lat_long[0], longitude: city_lat_long[1]},
                                        city_detail.city_locations);
                                    }
                                    if (store_zone) {
                                        finalCityId = city_detail._id;
                                        count = size;
                                    }
                                }


                                if (count == size) {
                                    if (finalCityId != null) {
                                        var city_id = finalCityId;

                                        var delivery_query = {
                                            $lookup: {
                                                from: "deliveries",
                                                localField: "deliveries_in_city",
                                                foreignField: "_id",
                                                as: "deliveries"
                                            }
                                        };

                                        var cityid_condition = {$match: {'_id': {$eq: city_id}}};

                                        City.aggregate([cityid_condition, delivery_query]).then((city) => {
                                            if (city.length == 0) {
                                                response_data.json({
                                                    success: false,
                                                    error_code: DELIVERY_ERROR_CODE.DELIVERY_DATA_NOT_FOUND_IN_YOUR_CITY
                                                });
                                            } else {
                                                if (city[0].is_business) {
                                                    var ads = [];
                                                    Delivery.find({
                                                        '_id': {$in: city[0].deliveries_in_city},
                                                        is_business: true
                                                    }).then((delivery) => {
                                                        if (delivery.length == 0) {
                                                            response_data.json({
                                                                success: false,
                                                                error_code: DELIVERY_ERROR_CODE.DELIVERY_DATA_NOT_FOUND_IN_YOUR_CITY
                                                            });
                                                        } else {
                                                            Advertise.find({
                                                                country_id: country_id,
                                                                $or: [{city_id: city[0]._id}, {city_id: mongoose.Types.ObjectId(ID_FOR_ALL.ALL_ID)}],
                                                                ads_for: ADS_TYPE.FOR_DELIVERY_LIST,
                                                                is_ads_approve_by_admin: true,
                                                                is_ads_visible: true
                                                            }).then((advertise) => {

                                                                if (city[0] && city[0].is_ads_visible && country_data && country_data.is_ads_visible) {
                                                                    ads = advertise;
                                                                }

                                                                response_data.json({
                                                                    success: true,
                                                                    message: DELIVERY_MESSAGE_CODE.DELIVERY_LIST_FOR_NEAREST_CITY_SUCCESSFULLY,
                                                                    city: city[0],
                                                                    deliveries: delivery,
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
                                                    }).sort({sequence_number: 1});
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

    utils.check_request_params(request_data.body, [{name: 'city_id', type: 'string'}, {name: 'store_delivery_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var Schema = mongoose.Types.ObjectId;
            var server_time = new Date();
            var city_id = request_data_body.city_id;
            var store_delivery_id = request_data_body.store_delivery_id;
            var ads = [];
            Advertise.find({
                $or: [{city_id: request_data_body.city_id}, {city_id: mongoose.Types.ObjectId(ID_FOR_ALL.ALL_ID)}],
                ads_for: ADS_TYPE.STORE_LIST,
                is_ads_visible: true
            }).then((advertise) => {

                City.findOne({_id: city_id}).then((city) => {
                    if (city) {
                        var city_lat_long = city.city_lat_long;

                        if(request_data_body.latitude && request_data_body.longitude){
                            city_lat_long = [request_data_body.latitude, request_data_body.longitude]
                        }

                        var distance = city.city_radius / UNIT.DEGREE_TO_KM;

                        Country.findOne({_id: city.country_id}).then((country) => {
                            if (city && city.is_ads_visible && country && country.is_ads_visible) {
                                ads = advertise;
                            }

                            var store_location_query = {$geoNear: {
                                    near: city_lat_long,
                                    distanceField: "distance",
                                    uniqueDocs: true,
                                    maxDistance: 100000000
                                }}

                            Store.aggregate([store_location_query, {
                                    $match: {
                                        $and: [
                                            {"is_approved": {"$eq": true}},
                                            {"is_business": {"$eq": true}},
                                            {"is_visible": {"$eq": true}},
                                            {"city_id": {$eq: Schema(city_id)}},
                                            {"store_delivery_id": {$eq: Schema(store_delivery_id)}}
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
                                    $group: {
                                        _id: '$_id',
                                        name: {$first: '$name'},
                                        image_url: {$first: '$image_url'},
                                        delivery_time: {$first: '$delivery_time'},
                                        delivery_time_max: {$first: '$delivery_time_max'},
                                        user_rate: {$first: '$user_rate'},
                                        user_rate_count: {$first: '$user_rate_count'},
                                        delivery_radius: {$first: '$delivery_radius'},
                                        is_provide_delivery_anywhere: {$first: '$is_provide_delivery_anywhere'},
                                        website_url: {$first: '$website_url'},
                                        slogan: {$first: '$slogan'},
                                        is_visible: {$first: '$is_visible'},
                                        is_store_busy: {$first: '$is_store_busy'},
                                        phone: {$first: '$phone'},
                                        item_tax: {$first: '$item_tax'},
                                        is_use_item_tax: {$first: '$is_use_item_tax'},
                                        country_phone_code: {$first: '$country_phone_code'},
                                        famous_products_tags: {$first: '$famous_products_tags'},
                                        store_time: {$first: '$store_time'},
                                        location: {$first: '$location'},
                                        address: {$first: '$address'},
                                        is_taking_schedule_order: {$first: '$is_taking_schedule_order'},
                                        is_order_cancellation_charge_apply: {$first: '$is_order_cancellation_charge_apply'},

                                        is_store_pay_delivery_fees: {$first: '$is_store_pay_delivery_fees'},
                                        branchio_url: {$first: '$branchio_url'},
                                        referral_code: {$first: '$referral_code'},
                                        price_rating: {$first: '$price_rating'},
                                        items: {$first: '$item_detail.name'}

                                    }
                                }]).then((stores) => {
                                if (stores.length == 0) {
                                    response_data.json({success: false, error_code: USER_ERROR_CODE.STORE_LIST_NOT_FOUND});
                                } else {

                                    response_data.json({
                                        success: true,
                                        message: USER_MESSAGE_CODE.GET_STORE_LIST_SUCCESSFULLY,
                                        server_time: server_time,
                                        ads: ads,
                                        stores: stores,
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

// GET STORE PRODUCT ITEM LIST
exports.user_get_store_product_item_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'store_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store_id = request_data_body.store_id;
            var server_time = new Date();
            var condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(store_id)}}};
            var condition1 = {"$match": {'is_visible_in_store': {$eq: true}}};

            Store.findOne({_id: store_id}).then((store) => {
                if (store) {
                    Country.findOne({_id: store.country_id}).then((country_data) => {
                        City.findOne({_id: store.city_id}).then((city_data) => {
                            Delivery.findOne({_id: store.store_delivery_id}).then((delivery_data) => {
                                var currency = country_data.currency_sign;
                                var maximum_phone_number_length = country_data.maximum_phone_number_length;
                                var minimum_phone_number_length = country_data.minimum_phone_number_length;
                                var timezone = city_data.timezone;
                                var sort = {"$sort": {}};
                                sort["$sort"]['unique_id'] = parseInt(-1);
                                Product.aggregate([condition, condition1, sort,
                                    {
                                        $lookup:
                                            {
                                                from: "items",
                                                localField: "_id",
                                                foreignField: "product_id",
                                                as: "items"
                                            }
                                    },
                                    {$unwind: "$items"},

                                    {$match: {$and: [{"items.is_visible_in_store": true}, {"items.is_item_in_stock": true}]}},
                                    {
                                        $group: {
                                            _id: {
                                                _id: '$_id', unique_id: "$unique_id", name: '$name',
                                                details: '$details', image_url: '$image_url',
                                                is_visible_in_store: '$is_visible_in_store',
                                                created_at: '$created_at',
                                                updated_at: '$updated_at'
                                            },
                                            items: {$push: "$items"}
                                        }
                                    }
                                ]).then((products) => {
                                    if (products.length == 0) {
                                        response_data.json({
                                            success: false, error_code: ITEM_ERROR_CODE.ITEM_NOT_FOUND,
                                            store: store
                                        });
                                    } else {
                                        var ads = [];
                                        Promo_code.find({
                                            created_id: store._id,
                                            is_approved: true,
                                            is_active: true
                                        }).then((promo_codes) => {


                                            Advertise.find({
                                                $or: [{city_id: store.city_id}, {city_id: mongoose.Types.ObjectId(ID_FOR_ALL.ALL_ID)}],
                                                ads_for: ADS_TYPE.FOR_INSIDE_STORE,
                                                is_ads_visible: true
                                            }).then((advertise) => {

                                                if (country_data && country_data.is_ads_visible && city_data && city_data.is_ads_visible) {
                                                    ads = advertise;
                                                }

                                                response_data.json({
                                                    success: true,
                                                    message: ITEM_MESSAGE_CODE.ITEM_LIST_SUCCESSFULLY,
                                                    currency: currency,
                                                    maximum_phone_number_length: maximum_phone_number_length,
                                                    minimum_phone_number_length: minimum_phone_number_length,
                                                    city_name: city_data.city_name,
                                                    server_time: server_time,
                                                    timezone: timezone,
                                                    delivery_name: delivery_data.delivery_name,
                                                    ads: ads,
                                                    store: store,
                                                    promo_codes: promo_codes,
                                                    products: products
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

//get_store_list_nearest_city
exports.get_store_list_nearest_city = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'country', type: 'string'}, {name: 'latitude'}, {name: 'longitude'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var country = request_data_body.country;
            var server_time = new Date();
            var country_code = request_data_body.country_code;
            var country_code_2 = request_data_body.country_code_2;

            if (request_data_body.country_code == undefined) {
                country_code = ""
            }

            if (request_data_body.country_code_2 == undefined) {
                country_code_2 = ""
            }

            Country.findOne({$and: [{$or: [{country_name: country}, {country_code: country_code}, {country_code_2: country_code_2}]}, {is_business: true}]}).then((country_data) => {

                if (!country_data)
                    response_data.json({success: false, error_code: COUNTRY_ERROR_CODE.BUSINESS_NOT_IN_YOUR_COUNTRY});

                else {

                    var city_lat_long = [request_data_body.latitude, request_data_body.longitude];
                    var country_id = country_data._id;

                    City.find({country_id: country_id, is_business: true}).then((cityList) => {

                        var size = cityList.length;
                        var count = 0;
                        if (size == 0) {
                            response_data.json({success: false, error_code: CITY_ERROR_CODE.BUSINESS_NOT_IN_YOUR_CITY});
                        } else {
                            var finalCityId = null;
                            var finalDistance = 1000000;

                            cityList.forEach(function (city_detail) {
                                count++;
                                var cityLatLong = city_detail.city_lat_long;
                                var distanceFromSubAdminCity = utils.getDistanceFromTwoLocation(city_lat_long, cityLatLong);
                                var cityRadius = city_detail.city_radius;

                                if (distanceFromSubAdminCity < cityRadius) {
                                    if (distanceFromSubAdminCity < finalDistance) {
                                        finalDistance = distanceFromSubAdminCity;
                                        finalCityId = city_detail._id;
                                    }
                                }

                                if (count == size) {
                                    if (finalCityId != null) {
                                        var city_id = finalCityId;

                                        var delivery_query = {
                                            $lookup: {
                                                from: "deliveries",
                                                localField: "deliveries_in_city",
                                                foreignField: "_id",
                                                as: "deliveries"
                                            }
                                        };

                                        var cityid_condition = {$match: {'_id': {$eq: city_id}}};

                                        City.aggregate([cityid_condition, delivery_query]).then((city) => {
                                            if (city.length == 0) {
                                                response_data.json({
                                                    success: false,
                                                    error_code: DELIVERY_ERROR_CODE.DELIVERY_DATA_NOT_FOUND_IN_YOUR_CITY
                                                });
                                            } else {
                                                if (city[0].is_business) {
                                                    var ads = [];

                                                    Store.find({
                                                        city_id: city[0]._id,
                                                        is_business: true,
                                                        is_approved: true,
                                                        store_delivery_id: request_data_body.store_delivery_id
                                                    }).then((stores) => {
                                                        if (stores.length == 0) {
                                                            response_data.json({
                                                                success: false,
                                                                error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND
                                                            });
                                                        } else {

                                                            Advertise.find({
                                                                country_id: country_id,
                                                                $or: [{city_id: city[0]._id}, {city_id: mongoose.Types.ObjectId(ID_FOR_ALL.ALL_ID)}],
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
                                                    }).sort({sequence_number: 1});


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
    utils.check_request_params(request_data.body, [{name: 'city_id', type: 'string'}, {name: 'store_delivery_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var Schema = mongoose.Types.ObjectId;
            var item_name = request_data_body.item_name;
            var city_id = request_data_body.city_id;
            var store_delivery_id = request_data_body.store_delivery_id;

            User.findOne({_id: request_data_body.user_id}).then((user_detail) => {
                if (user_detail) {
                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else {

                        var item_condition = {"$match": {'name': {$eq: item_name}}};

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
                                    $and: [{"store_detail.city_id": {$eq: Schema(city_id)}},
                                        {"store_detail.store_delivery_id": {$eq: Schema(store_delivery_id)}}]
                                }
                            },

                            {$unwind: "$store_detail"},

                            {
                                $group: {
                                    _id: '$name',
                                    stores: {$push: "$store_detail"}
                                }
                            }

                        ]).then((item) => {
                            if (item.length == 0) {
                                response_data.json({success: false, error_code: USER_ERROR_CODE.STORE_LIST_NOT_FOUND});
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
                    response_data.json({success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND});
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
    utils.check_request_params(request_data.body, [{name: 'provider_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            User.findOne({_id: request_data_body.user_id}).then((user_detail) => {
                if (user_detail) {
                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else {

                        Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {
                            var provider_location = [];
                            var bearing = 0;
                            var map_pin_image_url = "";

                            if (provider) {
                                provider_location = provider.location;
                                bearing = provider.bearing;

                                Vehicle.findOne({_id: provider.vehicle_id}).then((vehicle) => {
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
                            }else{
                                response_data.json({success: false})
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

                    response_data.json({success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND});
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

            var request_data_body = request_data.body;
            User.findOne({_id: request_data_body.user_id}).then((user_detail) => {
                if (user_detail) {

                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else {

                        var user_condition = {"$match": {'user_id': {$eq: mongoose.Types.ObjectId(request_data_body.user_id)}}};
                        var order_invoice_condition = {"$match": {'is_user_show_invoice': false}};

                        var order_status_condition = {
                            "$match": {
                                $and: [
                                    {order_status: {$ne: ORDER_STATE.STORE_REJECTED}},
                                    {order_status: {$ne: ORDER_STATE.CANCELED_BY_USER}},
                                    {order_status: {$ne: ORDER_STATE.STORE_CANCELLED}}

                                ]
                            }
                        };

                        Order.aggregate([user_condition, order_invoice_condition, order_status_condition,
                            {
                                $lookup:
                                    {
                                        from: "stores",
                                        localField: "store_id",
                                        foreignField: "_id",
                                        as: "store_detail"
                                    }
                            },
                            {
                                $unwind: "$store_detail"
                            }
                            ,
                            {
                                $lookup:
                                    {
                                        from: "cities",
                                        localField: "city_id",
                                        foreignField: "_id",
                                        as: "city_detail"
                                    }
                            },
                            {"$unwind": "$city_detail"},

                            {
                                $lookup:
                                    {
                                        from: "countries",
                                        localField: "city_detail.country_id",
                                        foreignField: "_id",
                                        as: "country_detail"
                                    }
                            },
                            {"$unwind": "$country_detail"},

                            {
                                $lookup:
                                    {
                                        from: "order_payments",
                                        localField: "order_payment_id",
                                        foreignField: "_id",
                                        as: "order_payment_detail"
                                    }
                            },
                            {
                                $unwind: "$order_payment_detail"
                            }
                            ,

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
                                $lookup:
                                    {
                                        from: "carts",
                                        localField: "cart_id",
                                        foreignField: "_id",
                                        as: "cart_detail"
                                    }
                            },
                            {
                                $unwind: "$cart_detail"
                            }
                            ,

                            {
                                $project: {
                                    "_id": "$_id",
                                    "unique_id": "$unique_id",
                                    "currency": "$country_detail.currency_sign",
                                    "request_unique_id": "$request_detail.unique_id",
                                    "request_id": "$request_detail._id",
                                    "delivery_status": "$request_detail.delivery_status",
                                    "estimated_time_for_delivery_in_min": "$request_detail.estimated_time_for_delivery_in_min",
                                    "total_time": "$order_payment_detail.total_time",
                                    "total_order_price": "$order_payment_detail.total_order_price",
                                    "confirmation_code_for_complete_delivery": "$confirmation_code_for_complete_delivery",
                                    "created_at": "$created_at",
                                    "order_status": "$order_status",
                                    "is_user_show_invoice": "$is_user_show_invoice",
                                    "pickup_addresses": "$cart_detail.pickup_addresses",
                                    "destination_addresses": "$cart_detail.destination_addresses",
                                    "store_name": "$store_detail.name",
                                    "store_image": "$store_detail.image_url",
                                    "store_country_phone_code": "$store_detail.country_phone_code",
                                    "store_phone": "$store_detail.phone",
                                    "order_details": "$cart_detail.order_details",
                                }
                            }
                        ]).then((orders) => {
                            if (orders.length == 0) {
                                response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
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
                    response_data.json({success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND});
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
    utils.check_request_params(request_data.body, [{name: 'order_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            User.findOne({_id: request_data_body.user_id}).then((user_detail) => {
                if (user_detail) {
                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else {

                        Order.findOne({_id: request_data_body.order_id}).then((order) => {

                            Store.findOne({_id: order.store_id}).then((store) => {
                                if (store) {
                                    var country_id = order.country_id;
                                    if (country_id == null && country_id == undefined) {
                                        country_id = store.country_id;
                                    }
                                    Country.findOne({_id: country_id}).then((country) => {
                                        var currency = country.currency_sign;

                                        Order_payment.findOne({_id: order.order_payment_id}).then((order_payment) => {
                                            if (order_payment) {

                                                var is_order_cancellation_charge_apply = store.is_order_cancellation_charge_apply;
                                                var order_cancellation_charge = 0;
                                                var order_status = order.order_status;

                                                if (is_order_cancellation_charge_apply) {
                                                    var order_cancellation_charge_for_above_order_price = store.order_cancellation_charge_for_above_order_price;
                                                    var order_cancellation_charge_type = store.order_cancellation_charge_type;
                                                    var order_cancellation_charge_value = store.order_cancellation_charge_value;
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

                                                Cart.findOne({_id: order.cart_id}).then((cart) => {

                                                    Request.findOne({_id: order.request_id}).then((request) => {
                                                        var request_id = null;
                                                        var request_unique_id = 0;
                                                        var delivery_status = 0;
                                                        var current_provider = null;
                                                        var destination_addresses = [];
                                                        var estimated_time_for_delivery_in_min = 0;

                                                        if (cart) {
                                                            destination_addresses = cart.destination_addresses;

                                                        }

                                                        if (request) {
                                                            request_id = request._id;
                                                            request_unique_id = request.unique_id;
                                                            delivery_status = request.delivery_status;
                                                            current_provider = request.current_provider;
                                                            estimated_time_for_delivery_in_min = request.estimated_time_for_delivery_in_min;

                                                        }

                                                        Provider.findOne({_id: current_provider}).then((provider) => {

                                                            var provider_id = null;
                                                            var provider_first_name = "";
                                                            var provider_last_name = "";
                                                            var provider_image = "";
                                                            var provider_country_phone_code = "";
                                                            var provider_phone = "";
                                                            var user_rate = 0;
                                                            if (provider) {
                                                                provider_id = provider._id;
                                                                provider_first_name = provider.first_name;
                                                                provider_last_name = provider.last_name;
                                                                provider_image = provider.image_url;
                                                                provider_country_phone_code = provider.country_phone_code;
                                                                provider_phone = provider.phone;
                                                                user_rate = provider.user_rate;
                                                            }

                                                            response_data.json({
                                                                success: true,
                                                                message: ORDER_MESSAGE_CODE.GET_ORDER_STATUS_SUCCESSFULLY,
                                                                unique_id: order.unique_id,
                                                                request_id: request_id,
                                                                request_unique_id: request_unique_id,
                                                                delivery_status: delivery_status,
                                                                order_status: order_status,
                                                                currency: currency,
                                                                estimated_time_for_delivery_in_min: estimated_time_for_delivery_in_min,
                                                                total_time: order_payment.total_time,
                                                                order_cancellation_charge: order_cancellation_charge,
                                                                is_confirmation_code_required_at_complete_delivery: setting_detail.is_confirmation_code_required_at_complete_delivery,
                                                                is_user_pick_up_order: order_payment.is_user_pick_up_order,
                                                                confirmation_code_for_complete_delivery: order.confirmation_code_for_complete_delivery,
                                                                destination_addresses: destination_addresses,
                                                                provider_id: provider_id,
                                                                provider_first_name: provider_first_name,
                                                                provider_last_name: provider_last_name,
                                                                provider_image: provider_image,
                                                                provider_country_phone_code: provider_country_phone_code,
                                                                provider_phone: provider_phone,
                                                                user_rate: user_rate

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
                    }
                } else {

                    response_data.json({success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND});
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

//GENRATE INVOICE
exports.get_order_cart_invoice = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'store_id', type: 'string'}, {name: 'total_time'}, {name: 'total_distance'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var cart_unique_token = request_data_body.cart_unique_token;
            var server_time = new Date();
            var order_type = Number(request_data_body.order_type);

            if(request_data_body.user_id==''){
                request_data_body.user_id= null;
            }

            User.findOne({_id: request_data_body.user_id}).then((user) => {
                if (order_type != ADMIN_DATA_ID.STORE && user && request_data_body.server_token !== null && user.server_token != request_data_body.server_token) {
                    response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                } else {

                    var cart_id = null;
                    var user_id = null;
                    var wallet_currency_code = '';
                    if (user) {
                        cart_id = user.cart_id;
                        user_id = user._id;
                        cart_unique_token = null;
                        wallet_currency_code = user.wallet_currency_code;
                    }
                    Cart.findOne({$or: [{_id: cart_id}, {cart_unique_token: cart_unique_token}]}).then((cart) => {
                        if (cart) {
                            var destination_location = cart.destination_addresses[0].location
                            Store.findOne({_id: request_data_body.store_id}).then((store) => {
                                if (store) {
                                    var store_location = store.location;
                                    var city_id = store.city_id;
                                    var country_id = store.country_id;

                                    Country.findOne({_id: country_id}).then((country) => {
                                        var is_distance_unit_mile = false;
                                        if (country) {
                                            var is_distance_unit_mile = country.is_distance_unit_mile;
                                            if(!user){
                                                wallet_currency_code = country.currency_code;
                                            }

                                        }

                                        if(wallet_currency_code == ''){
                                            wallet_currency_code = store.wallet_currency_code;
                                        }

                                        City.findOne({_id: city_id}).then((city_detail) => {
                                            if (city_detail) {
                                                var admin_profit_mode_on_delivery = city_detail.admin_profit_mode_on_delivery;
                                                var admin_profit_value_on_delivery = city_detail.admin_profit_value_on_delivery;

                                                utils.check_zone(city_id, city_detail.zone_business, store_location, destination_location, function (zone_response) {
                                                    Service.findOne({city_id: city_id}).then((service) => {
                                                        if (service) {
                                                            /* HERE USER PARAM */
                                                            var total_distance = request_data_body.total_distance;
                                                            var total_time = request_data_body.total_time;

                                                            var is_user_pick_up_order = false;

                                                            if (request_data_body.is_user_pick_up_order != undefined) {
                                                                is_user_pick_up_order = request_data_body.is_user_pick_up_order;

                                                            }

                                                            var total_item_count = request_data_body.total_item_count;

                                                            /* SERVICE DATA HERE */

                                                            var base_price = service.base_price;
                                                            var base_price_distance = service.base_price_distance;
                                                            var price_per_unit_distance = service.price_per_unit_distance;
                                                            var price_per_unit_time = service.price_per_unit_time;
                                                            var service_tax = service.service_tax;
                                                            var min_fare = service.min_fare;
                                                            var admin_profit_mode_on_store = store.admin_profit_mode_on_store;
                                                            var admin_profit_value_on_store = store.admin_profit_value_on_store;
                                                            // STORE DATA HERE //

                                                            var item_tax = store.item_tax;
                                                            // DELIVERY CALCULATION START //
                                                            var distance_price = 0;
                                                            var total_base_price = 0;
                                                            var total_distance_price = 0;
                                                            var total_time_price = 0;
                                                            var total_service_price = 0;
                                                            var total_admin_tax_price = 0;
                                                            var total_after_tax_price = 0;
                                                            var total_surge_price = 0;
                                                            var total_delivery_price_after_surge = 0;
                                                            var delivery_price = 0;
                                                            var total_delivery_price = 0;
                                                            var total_admin_profit_on_delivery = 0;
                                                            var total_provider_income = 0;
                                                            var promo_payment = 0;

                                                            total_time = total_time / 60;// convert to mins
                                                            total_time = utils.precisionRoundTwo(Number(total_time));

                                                            if (is_distance_unit_mile) {
                                                                total_distance = total_distance * 0.000621371;
                                                            } else {
                                                                total_distance = total_distance * 0.001;
                                                            }

                                                            if (!is_user_pick_up_order) {

                                                                total_base_price = base_price;
                                                                if (total_distance > base_price_distance) {
                                                                    distance_price = (total_distance - base_price_distance) * price_per_unit_distance;
                                                                }

                                                                total_base_price = utils.precisionRoundTwo(total_base_price);
                                                                distance_price = utils.precisionRoundTwo(distance_price);

                                                                total_distance_price = +total_base_price + +distance_price;
                                                                total_distance_price = utils.precisionRoundTwo(total_distance_price);



                                                                total_time_price = price_per_unit_time * total_time;
                                                                total_time_price = utils.precisionRoundTwo(Number(total_time_price));

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
                                                                } else {
                                                                    delivery_price = total_delivery_price_after_surge;
                                                                }

                                                                if (zone_response.success) {
                                                                    total_admin_tax_price = 0;
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


                                                            } else {
                                                                total_distance = 0;
                                                                total_time = 0;
                                                            }

                                                            // DELIVERY CALCULATION END //
                                                            // ORDER CALCULATION START //

                                                            var order_price = 0;
                                                            var total_store_tax_price = 0;
                                                            var total_order_price = 0;
                                                            var total_admin_profit_on_store = 0;
                                                            var total_store_income = 0;
                                                            var total_cart_price = 0;
                                                            var is_store_pay_delivery_fees = false;

                                                            total_cart_price = cart.total_cart_price;

                                                            if(store.is_use_item_tax){
                                                                total_store_tax_price = cart.total_item_tax;
                                                            }else{
                                                                total_store_tax_price = total_cart_price * item_tax * 0.01;
                                                            }

                                                            total_store_tax_price = utils.precisionRoundTwo(Number(total_store_tax_price));
                                                            cart.total_item_tax = total_store_tax_price;

                                                            // total_store_tax_price = total_cart_price * item_tax * 0.01;
                                                            // total_store_tax_price = utils.precisionRoundTwo(Number(total_store_tax_price));

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
                                                            total_delivery_price = delivery_price;
                                                            total_order_price = order_price;
                                                            // Store Pay Delivery Fees Condition
                                                            if (total_order_price > store.free_delivery_for_above_order_price && store.is_store_pay_delivery_fees == true) {
                                                                is_store_pay_delivery_fees = true;
                                                            }

                                                            var total = +total_delivery_price + +total_order_price;

                                                            total = utils.precisionRoundTwo(Number(total));
                                                            var user_pay_payment = total;

                                                            if (order_price < store.min_order_price) {
                                                                response_data.json({
                                                                    success: false,
                                                                    min_order_price: store.min_order_price,
                                                                    item_tax: item_tax,
                                                                    error_code: USER_ERROR_CODE.YOUR_ORDER_PRICE_LESS_THEN_STORE_MIN_ORDER_PRICE
                                                                });

                                                            } else {
                                                                cart.total_item_count = total_item_count;

                                                                Order_payment.findOne({_id: cart.order_payment_id}).then((order_payment) => {

                                                                    if (order_payment) {

                                                                        var promo_id = order_payment.promo_id;
                                                                        Promo_code.findOne({_id: promo_id}).then((promo_code) => {
                                                                            if (promo_code) {
                                                                                promo_code.used_promo_code = promo_code.used_promo_code - 1;
                                                                                promo_code.save();
                                                                                user.promo_count = user.promo_count - 1;
                                                                                user.save();
                                                                            }
                                                                        });

                                                                        order_payment.cart_id = cart._id;
                                                                        order_payment.order_id = null;
                                                                        order_payment.order_unique_id = 0;
                                                                        order_payment.store_id = store._id;
                                                                        order_payment.user_id = cart.user_id;
                                                                        order_payment.country_id = country_id;
                                                                        order_payment.city_id = city_id;
                                                                        order_payment.provider_id = null;
                                                                        order_payment.promo_id = null;
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
                                                                        order_payment.total_store_income = total_store_income;
                                                                        order_payment.total_distance = total_distance;
                                                                        order_payment.total_time = total_time;
                                                                        order_payment.is_distance_unit_mile = is_distance_unit_mile;
                                                                        order_payment.is_store_pay_delivery_fees = is_store_pay_delivery_fees;
                                                                        order_payment.total_service_price = total_service_price;
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
                                                                        order_payment.is_user_pick_up_order = is_user_pick_up_order;
                                                                        order_payment.save().then(() => {

                                                                                response_data.json({
                                                                                    success: true,
                                                                                    message: USER_MESSAGE_CODE.FARE_ESTIMATE_SUCCESSFULLY,
                                                                                    server_time: server_time,
                                                                                    timezone: city_detail.timezone,
                                                                                    order_payment: order_payment,
                                                                                    store: store
                                                                                });

                                                                        }, (error) => {
                                                                            console.log(error)
                                                                            response_data.json({
                                                                                success: false,
                                                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                            });
                                                                        });
                                                                    } else {
                                                                        /* ENTRY IN ORDER PAYMENT */
                                                                        var order_payment = new Order_payment({
                                                                            cart_id: cart._id,
                                                                            store_id: store._id,
                                                                            user_id: cart.user_id,
                                                                            country_id: country_id,
                                                                            city_id: city_id,
                                                                            currency_code: wallet_currency_code,
                                                                            order_currency_code: store.wallet_currency_code,
                                                                            current_rate: 1, // HERE current_rate MEANS ORDER TO ADMIN CONVERT RATE
                                                                            wallet_to_admin_current_rate: 1,
                                                                            wallet_to_order_current_rate: 1,
                                                                            total_distance: total_distance,
                                                                            total_time: total_time,
                                                                            service_tax: service_tax,
                                                                            item_tax: item_tax,
                                                                            total_service_price: total_service_price,
                                                                            total_admin_tax_price: total_admin_tax_price,
                                                                            total_delivery_price: total_delivery_price,
                                                                            is_store_pay_delivery_fees: is_store_pay_delivery_fees,
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
                                                                            is_distance_unit_mile: is_distance_unit_mile
                                                                        });

                                                                        order_payment.save().then(() => {

                                                                            cart.order_payment_id = order_payment._id;
                                                                            cart.save();
                                                                            response_data.json({
                                                                                success: true,
                                                                                message: USER_MESSAGE_CODE.FARE_ESTIMATE_SUCCESSFULLY,
                                                                                server_time: server_time,
                                                                                timezone: city_detail.timezone,
                                                                                order_payment: order_payment,
                                                                                store: store
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
                                                            }
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
                            response_data.json({success: false, error_code: USER_ERROR_CODE.GET_ORDER_CART_INVOICE_FAILED});
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

// PAY ORDER PAYMENT
exports.pay_order_payment = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'order_payment_id', type: 'string'}, {name: 'is_payment_mode_cash'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var is_payment_mode_cash = request_data_body.is_payment_mode_cash;
            var order_type = Number(request_data_body.order_type);

            User.findOne({_id: request_data_body.user_id}).then((user) => {
                if (user && order_type == ADMIN_DATA_ID.USER && request_data_body.server_token !== null && user.server_token !== request_data_body.server_token) {
                    response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                } else {
                    Order_payment.findOne({_id: request_data_body.order_payment_id}).then((order_payment) => {
                        if (order_payment) {
                            Store.findOne({_id: order_payment.store_id}).then((store) => {
                                Country.findOne({_id: store.country_id}).then((country) => {
                                    // ORDER CREATED COUNTRY // ORDER CHARGE IN THIS COUNTRY CURRENCY
                                    var country_current_rate = country.currency_rate;

                                    var wallet_currency_code = user.wallet_currency_code;
                                    var admin_currency_code = "";
                                    var order_currency_code = order_payment.order_currency_code;


                                    var wallet_to_admin_current_rate = 1;
                                    var wallet_to_order_current_rate = 1;
                                    var current_rate = 1;

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
                                            order_payment.save();

                                            var payment_id = request_data_body.payment_id;
                                            var user_id = request_data_body.user_id;
                                            var wallet_payment = 0;
                                            var total_after_wallet_payment = 0;
                                            var remaining_payment = 0;
                                            var user_wallet_amount = user.wallet;
                                            var total = order_payment.total;
                                            var is_store_pay_delivery_fees = order_payment.is_store_pay_delivery_fees;
                                            var user_pay_payment = order_payment.user_pay_payment;
                                            if (is_store_pay_delivery_fees) {
                                                user_pay_payment = user_pay_payment - order_payment.total_delivery_price;
                                            }

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

                                            if (!is_payment_mode_cash) {
                                                order_payment.payment_id = payment_id;

                                                if (order_payment.remaining_payment > 0) {
                                                    utils.pay_payment_for_selected_payment_gateway(0, user_id, payment_id, remaining_payment, order_currency_code, function (payment_paid) {

                                                        if (payment_paid) {
                                                            order_payment.is_payment_paid = true;
                                                            order_payment.cash_payment = 0;
                                                            order_payment.card_payment = order_payment.total_after_wallet_payment;
                                                            order_payment.remaining_payment = 0;
                                                        } else {
                                                            order_payment.is_payment_paid = false;
                                                            order_payment.cash_payment = 0;
                                                            order_payment.card_payment = order_payment.total_after_wallet_payment;
                                                        }

                                                        order_payment.save().then(() => {

                                                            if (!order_payment.is_payment_paid) {
                                                                response_data.json({
                                                                    success: false,
                                                                    error_code: USER_ERROR_CODE.YOUR_ORDER_PAYMENT_PENDING
                                                                });
                                                            } else {
                                                                if (wallet_payment > 0) {
                                                                    var wallet_information = { order_payment_id : order_payment._id };
                                                                    var total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.USER, user.unique_id, user._id, user.country_id
                                                                        , wallet_currency_code, order_currency_code, wallet_to_order_current_rate, wallet_payment, user.wallet,
                                                                        WALLET_STATUS_ID.REMOVE_WALLET_AMOUNT, WALLET_COMMENT_ID.ORDER_CHARGED, "Order Charged" , wallet_information );
                                                                    user.wallet = total_wallet_amount;
                                                                }
                                                                user.save();
                                                                response_data.json({
                                                                    success: true,
                                                                    message: USER_MESSAGE_CODE.ORDER_PAYMENT_SUCCESSFULLY,
                                                                    is_payment_paid: order_payment.is_payment_paid
                                                                });

                                                                if (setting_detail.is_mail_notification) {
                                                                    emails.sendUserOrderPaymentPaidEmail(request_data, user, order_currency_code + remaining_payment);

                                                                }
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

                                                    order_payment.is_payment_paid = true;
                                                    order_payment.card_payment = 0;
                                                    order_payment.save().then(() => {

                                                        if (wallet_payment > 0) {
                                                            var wallet_information = { order_payment_id : order_payment._id };
                                                            var total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.USER, user.unique_id, user._id, user.country_id
                                                                , wallet_currency_code, order_currency_code, wallet_to_order_current_rate, wallet_payment, user.wallet,
                                                                WALLET_STATUS_ID.REMOVE_WALLET_AMOUNT, WALLET_COMMENT_ID.ORDER_CHARGED, "Order Charged" , wallet_information);

                                                            user.wallet = total_wallet_amount;
                                                        }
                                                        user.save();
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


                                            } else {
                                                order_payment.is_payment_paid = true;
                                                order_payment.remaining_payment = 0;
                                                order_payment.card_payment = 0;
                                                order_payment.cash_payment = order_payment.total_after_wallet_payment;

                                                order_payment.save().then(() => {
                                                    if (wallet_payment > 0) {
                                                        var wallet_information = { order_payment_id : order_payment._id };
                                                        var total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.USER, user.unique_id, user._id, user.country_id
                                                            , wallet_currency_code, order_currency_code, wallet_to_order_current_rate, wallet_payment, user.wallet,
                                                            WALLET_STATUS_ID.REMOVE_WALLET_AMOUNT, WALLET_COMMENT_ID.ORDER_CHARGED, "Order Charged" , wallet_information);

                                                        user.wallet = total_wallet_amount;
                                                    }
                                                    user.save();
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

                        }else{
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

    utils.check_request_params(request_data.body, [{name: 'order_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            User.findOne({_id: request_data_body.user_id}).then((user_detail) => {
                if (user_detail) {
                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else {
                        Order.findOne({_id: request_data_body.order_id}).then((order_detail) => {
                            if (order_detail) {
                                var country_id = order_detail.country_id;

                                Store.findOne({_id: order_detail.store_id}).then((store_data) => {
                                    if (country_id == null && country_id == undefined) {
                                        country_id = store_data.country_id;
                                    }
                                    Country.findOne({_id: country_id}).then((country) => {
                                        var currency = "";
                                        if (country) {
                                            currency = country.currency_sign;
                                        }
                                        var current_provider = null;
                                        Request.findOne({_id: order_detail.request_id}).then((request_data) => {
                                            if (request_data) {
                                                current_provider = request_data.current_provider;
                                            }
                                            Provider.findOne({_id: current_provider}).then((provider_data) => {
                                                Order_payment.findOne({_id: order_detail.order_payment_id}).then((order_payment) => {
                                                    Payment_gateway.findOne({_id: order_payment.payment_id}).then((payment_gateway) => {

                                                        var provider_detail = {};
                                                        var store_detail = {};
                                                        var payment_gateway_name = "Cash";
                                                        if (order_payment.is_payment_mode_cash == false) {
                                                            payment_gateway_name = payment_gateway.name;
                                                        }

                                                        if (store_data) {
                                                            store_detail = {
                                                                name: store_data.name,
                                                                image_url: store_data.image_url,
                                                            }
                                                        }

                                                        if (provider_data) {
                                                            provider_detail = {
                                                                first_name: provider_data.first_name,
                                                                last_name: provider_data.last_name,
                                                                image_url: provider_data.image_url
                                                            }
                                                        }

                                                        var order_payment_query = {
                                                            $lookup:
                                                                {
                                                                    from: "order_payments",
                                                                    localField: "order_payment_id",
                                                                    foreignField: "_id",
                                                                    as: "order_payment_detail"
                                                                }
                                                        };
                                                        var array_to_json_order_payment = {$unwind: "$order_payment_detail"};

                                                        var cart_query = {
                                                            $lookup:
                                                                {
                                                                    from: "carts",
                                                                    localField: "cart_id",
                                                                    foreignField: "_id",
                                                                    as: "cart_detail"
                                                                }
                                                        };

                                                        var array_to_json_cart_query = {$unwind: "$cart_detail"};


                                                        var user_condition = {"$match": {'user_id': {$eq: mongoose.Types.ObjectId(request_data_body.user_id)}}};
                                                        var order_condition = {"$match": {'_id': {$eq: mongoose.Types.ObjectId(request_data_body.order_id)}}};

                                                        var order_status_condition = {
                                                            $match: {
                                                                $or: [{order_status: {$eq: ORDER_STATE.STORE_REJECTED}},
                                                                    {order_status: {$eq: ORDER_STATE.CANCELED_BY_USER}},
                                                                    {order_status: {$eq: ORDER_STATE.STORE_CANCELLED}},
                                                                    {order_status: {$eq: ORDER_STATE.ORDER_COMPLETED}}

                                                                ]
                                                            }
                                                        };

                                                        var order_status_id_condition = {
                                                            $match: {

                                                                $or: [{order_status_id: {$eq: ORDER_STATUS_ID.CANCELLED}},
                                                                    {order_status_id: {$eq: ORDER_STATUS_ID.REJECTED}},
                                                                    {order_status_id: {$eq: ORDER_STATUS_ID.COMPLETED}},
                                                                ]

                                                            }
                                                        };


                                                        Order.aggregate([order_condition, user_condition, order_status_condition, order_status_id_condition, order_payment_query, cart_query, array_to_json_order_payment, array_to_json_cart_query]).then((orders) => {
                                                            if (orders.length == 0) {
                                                                response_data.json({
                                                                    success: false,
                                                                    error_code: USER_ERROR_CODE.ORDER_DETAIL_NOT_FOUND
                                                                });
                                                            } else {
                                                                response_data.json({
                                                                    success: true,
                                                                    message: USER_MESSAGE_CODE.GET_USER_ORDER_DETAIL_SUCCESSFULLY,
                                                                    currency: currency,
                                                                    store_detail: store_detail,
                                                                    provider_detail: provider_detail,
                                                                    payment_gateway_name: payment_gateway_name,
                                                                    order_list: orders[0]
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
                                response_data.json({success: false, error_code: STORE_ERROR_CODE.ORDER_DETAIL_NOT_FOUND});
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

                    response_data.json({success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND});
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

    utils.check_request_params(request_data.body, [{name: 'start_date', type: 'string'}, {name: 'end_date', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            User.findOne({_id: request_data_body.user_id}).then((user_detail) => {
                if (user_detail) {
                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else {

                        var start_date = null, end_date = null;

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


                        var user_condition = {"$match": {'user_id': {$eq: mongoose.Types.ObjectId(request_data_body.user_id)}}};
                        var order_status_condition = {
                            "$match": {
                                $or: [{
                                    order_status: ORDER_STATE.ORDER_COMPLETED,
                                    is_user_show_invoice: true
                                }, {order_status: ORDER_STATE.STORE_CANCELLED}, {order_status: ORDER_STATE.CANCELED_BY_USER}, {order_status: ORDER_STATE.STORE_REJECTED}]
                            }
                        };

                        var filter = {"$match": {"completed_date_in_city_timezone": {$gte: start_date, $lt: end_date}}};

                        Order.aggregate([user_condition, order_status_condition, filter,
                            {
                                $lookup:
                                    {
                                        from: "stores",
                                        localField: "store_id",
                                        foreignField: "_id",
                                        as: "store_detail"
                                    }
                            },
                            {"$unwind": "$store_detail"},

                            {
                                $lookup:
                                    {
                                        from: "cities",
                                        localField: "city_id",
                                        foreignField: "_id",
                                        as: "city_detail"
                                    }
                            },
                            {"$unwind": "$city_detail"},

                            {
                                $lookup:
                                    {
                                        from: "countries",
                                        localField: "city_detail.country_id",
                                        foreignField: "_id",
                                        as: "country_detail"
                                    }
                            },
                            {"$unwind": "$country_detail"},
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
                                $lookup:
                                    {
                                        from: "order_payments",
                                        localField: "order_payment_id",
                                        foreignField: "_id",
                                        as: "order_payment_detail"
                                    }
                            },
                            {"$unwind": "$order_payment_detail"},
                            {
                                $project: {

                                    created_at: "$created_at",
                                    order_status: "$order_status",
                                    order_status_id: "$order_status_id",
                                    completed_at: "$completed_at",
                                    unique_id: "$unique_id",
                                    total: "$order_payment_detail.total",
                                    refund_amount: "$order_payment_detail.refund_amount",
                                    total_service_price: "$order_payment_detail.total_service_price",
                                    total_order_price: "$order_payment_detail.total_order_price",
                                    currency: "$country_detail.currency_sign",
                                    request_detail: {
                                        created_at: "$request_detail.created_at",
                                        request_unique_id: "$request_detail.unique_id",
                                        delivery_status: "$request_detail.delivery_status",
                                        delivery_status_manage_id: "$request_detail.delivery_status_manage_id",
                                    },
                                    store_detail: {name: "$store_detail.name", image_url: "$store_detail.image_url"}
                                }
                            },
                        ]).then((orders) => {

                            if (orders.length == 0) {
                                response_data.json({success: false, error_code: USER_ERROR_CODE.ORDER_HISTORY_NOT_FOUND});
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

                    response_data.json({success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND});
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
    utils.check_request_params(request_data.body, [{name: 'order_id', type: 'string'}, {name: 'user_rating_to_provider'}, {name: 'user_review_to_provider'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            User.findOne({_id: request_data_body.user_id}).then((user_detail) => {
                if (user_detail) {
                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else {

                        Order.findOne({_id: request_data_body.order_id}).then((order) => {
                            if (order) {
                                Review.findOne({order_id: order._id}).then((review) => {
                                    if (review) {
                                        var order_status = order.order_status;
                                        if (order_status == ORDER_STATE.ORDER_COMPLETED) {
                                            Request.findOne({_id: order.request_id}).then((request) => {

                                                Provider.findOne({_id: request.provider_id}).then((provider) => {
                                                    if (provider) {

                                                        var user_rating_to_provider = request_data_body.user_rating_to_provider;
                                                        review.user_rating_to_provider = user_rating_to_provider;
                                                        review.user_review_to_provider = request_data_body.user_review_to_provider;

                                                        var old_rate = provider.user_rate;
                                                        var old_rate_count = provider.user_rate_count;
                                                        var new_rate_counter = (old_rate_count + 1);
                                                        var new_rate = ((old_rate * old_rate_count) + user_rating_to_provider) / new_rate_counter;
                                                        new_rate = utils.precisionRoundTwo(Number(new_rate));
                                                        provider.user_rate = new_rate;
                                                        provider.user_rate_count = provider.user_rate_count + 1;
                                                        order.is_user_rated_to_provider = true;
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
                                            response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                                        }
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

                    response_data.json({success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND});
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
    utils.check_request_params(request_data.body, [{name: 'order_id', type: 'string'}, {name: 'user_rating_to_store'}, {name: 'user_review_to_store'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            User.findOne({_id: request_data_body.user_id}).then((user_detail) => {
                if (user_detail) {
                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else {
                        Order.findOne({_id: request_data_body.order_id}).then((order) => {

                            if (order) {
                                Review.findOne({order_id: order._id}).then((review) => {
                                    if (review) {
                                        var order_status = order.order_status;
                                        if (order_status == ORDER_STATE.ORDER_COMPLETED) {
                                            Store.findOne({_id: order.store_id}).then((store) => {
                                                if (store) {
                                                    var user_rating_to_store = request_data_body.user_rating_to_store;
                                                    review.user_rating_to_store = user_rating_to_store;
                                                    review.user_review_to_store = request_data_body.user_review_to_store;
                                                    var old_rate = store.user_rate;
                                                    var old_rate_count = store.user_rate_count;
                                                    var new_rate_counter = (old_rate_count + 1);
                                                    var new_rate = ((old_rate * old_rate_count) + user_rating_to_store) / new_rate_counter;
                                                    new_rate = utils.precisionRoundTwo(Number(new_rate));
                                                    store.user_rate = new_rate;
                                                    store.user_rate_count = store.user_rate_count + 1;
                                                    order.is_user_rated_to_store = true;
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
                                            response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                                        }
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
                    response_data.json({success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND});
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
    utils.check_request_params(request_data.body, [{name: 'order_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            User.findOne({_id: request_data_body.user_id}).then((user) => {
                if (user) {
                    if (request_data_body.server_token !== null && user.server_token !== request_data_body.server_token) {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else {

                        Order.findOne({_id: request_data_body.order_id}).then((order_detail) => {
                            if (order_detail) {
                                Country.findOne({_id: order_detail.country_id}).then((country) => {
                                    var currency = "";
                                    if (country) {
                                        currency = country.currency_sign;
                                    }

                                    Order_payment.findOne({_id: order_detail.order_payment_id}).then((order_payment_detail) => {
                                        if (order_payment_detail) {
                                            var current_provider = null;
                                            Request.findOne({_id: order_detail.request_id}).then((request) => {
                                                if (request) {
                                                    current_provider = request.current_provider;
                                                }
                                                Provider.findOne({_id: current_provider}).then((provider_data) => {

                                                    var provider_detail = {};
                                                    if (provider_data) {
                                                        provider_detail = provider_data;
                                                    }

                                                    Payment_gateway.findOne({_id: order_payment_detail.payment_id}).then((payment_gateway) => {
                                                        var payment_gateway_name = "Cash";
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
                                                            order_payment: order_payment_detail

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
                    }
                } else {
                    response_data.json({success: false, error_code: ERROR_CODE.DETAIL_NOT_FOUND});
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
    utils.check_request_params(request_data.body, [{name: 'store_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store_id = request_data_body.store_id;
            User.findOne({_id: request_data_body.user_id}).then((user_detail) => {
                if (user_detail) {

                    var favourite_stores = user_detail.favourite_stores;
                    var index = favourite_stores.indexOf(store_id);
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

    utils.check_request_params(request_data.body, [{name: 'store_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            User.findOne({_id: request_data_body.user_id}).then((user_detail) => {
                if (user_detail) {

                    var fav_store = request_data_body.store_id;
                    var fav_store_list_size = 0;
                    fav_store_list_size = fav_store.length;
                    var fav_store_array = [];
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

    utils.check_request_params(request_data.body, [{name: 'order_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            User.findOne({_id: request_data_body.user_id}).then((user_detail) => {
                if (user_detail) {
                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else {
                        var order_condition = {"$match": {'_id': {$eq: mongoose.Types.ObjectId(request_data_body.order_id)}}};


                        var store_query = {
                            $lookup:
                                {
                                    from: "stores",
                                    localField: "store_id",
                                    foreignField: "_id",
                                    as: "store_detail"
                                }
                        };
                        var array_to_json_store_detail = {$unwind: "$store_detail"};

                        var country_query = {
                            $lookup:
                                {
                                    from: "countries",
                                    localField: "store_detail.country_id",
                                    foreignField: "_id",
                                    as: "country_detail"
                                }
                        };

                        var array_to_json_country_query = {$unwind: "$country_detail"};

                        var order_payment_query = {
                            $lookup:
                                {
                                    from: "order_payments",
                                    localField: "order_payment_id",
                                    foreignField: "_id",
                                    as: "order_payment_detail"
                                }
                        };
                        var array_to_json_order_payment_query = {$unwind: "$order_payment_detail"};


                        var payment_gateway_query = {
                            $lookup:
                                {
                                    from: "payment_gateways",
                                    localField: "order_payment_detail.payment_id",
                                    foreignField: "_id",
                                    as: "payment_gateway_detail"
                                }
                        };
                        var cart_query = {
                            $lookup:
                                {
                                    from: "carts",
                                    localField: "cart_id",
                                    foreignField: "_id",
                                    as: "cart_detail"
                                }
                        };

                        var array_to_json_cart_query = {$unwind: "$cart_detail"};


                        var request_query = {
                            $lookup:
                                {
                                    from: "requests",
                                    localField: "request_id",
                                    foreignField: "_id",
                                    as: "request_detail"
                                }
                        };

                        var array_to_json_request_query = {
                            $unwind: {
                                path: "$request_detail",
                                preserveNullAndEmptyArrays: true
                            }
                        };

                        var provider_query = {
                            $lookup:
                                {
                                    from: "providers",
                                    localField: "request_detail.provider_id",
                                    foreignField: "_id",
                                    as: "provider_detail"
                                }
                        };


                        Order.aggregate([order_condition, order_payment_query, cart_query, request_query, store_query, array_to_json_store_detail, country_query, array_to_json_country_query, array_to_json_request_query, provider_query, array_to_json_cart_query, array_to_json_order_payment_query, payment_gateway_query

                        ]).then((order) => {

                            if (order.length === 0) {
                                response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0});
                            } else {

                                response_data.json({
                                    success: true,
                                    message: ORDER_MESSAGE_CODE.GET_ORDER_DATA_SUCCESSFULLY,
                                    is_confirmation_code_required_at_complete_delivery: setting_detail.is_confirmation_code_required_at_complete_delivery,
                                    order: order[0]
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

                    response_data.json({success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND});
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

            var request_data_body = request_data.body;
            User.findOne({_id: request_data_body.user_id}).then((user_detail) => {
                if (user_detail) {
                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else {
                        var store_id_condition = {"$match": {'_id': {$in: user_detail.favourite_stores}}};
                        var city_lookup = {
                            $lookup:
                                {
                                    from: "cities",
                                    localField: "city_id",
                                    foreignField: "_id",
                                    as: "city_detail"
                                }
                        };
                        var array_to_json_city_detail = {$unwind: "$city_detail"};

                        var country_lookup = {
                            $lookup:
                                {
                                    from: "countries",
                                    localField: "country_id",
                                    foreignField: "_id",
                                    as: "country_detail"
                                }
                        };
                        var array_to_json_country_detail = {$unwind: "$country_detail"};
                        var server_time = new Date();
                        Store.aggregate([store_id_condition, city_lookup, array_to_json_city_detail, country_lookup, array_to_json_country_detail]).then((stores) => {

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

                    response_data.json({success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND});
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
    utils.check_request_params(request_data.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Store.findOne({_id: request_data_body.store_id}).then((store) => {
                if (store) {
                    var store_review_list = [];
                    var remaining_review_list = [];

                    var store_condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
                    var review_condition = {"$match": {'user_rating_to_store': {$gt: 0}}};
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
                        {"$unwind": "$user_detail"},

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
                    ]).then((store_review) => {

                        if (store_review.length > 0) {
                            store_review_list = store_review;
                        }

                        Review.find({
                            user_id: request_data_body.user_id,
                            store_id: request_data_body.store_id,
                            user_rating_to_store: 0
                        }, {"order_unique_id": 1, "order_id": 1}).then((remaining_store_review) => {

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
    utils.check_request_params(request_data.body, [{name: 'review_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            User.findOne({_id: request_data_body.user_id}).then((user_detail) => {
                if (user_detail) {
                    if (request_data_body.server_token !== null && user_detail.server_token !== request_data_body.server_token) {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else {
                        Review.findOne({_id: request_data_body.review_id}).then((review_detail) => {

                            if (review_detail) {

                                var is_user_clicked_like_store_review = Boolean(request_data_body.is_user_clicked_like_store_review);
                                var is_user_clicked_dislike_store_review = Boolean(request_data_body.is_user_clicked_dislike_store_review);
                                var id_of_users_like_store_comment = review_detail.id_of_users_like_store_comment;
                                var id_of_users_dislike_store_comment = review_detail.id_of_users_dislike_store_comment;

                                if (is_user_clicked_like_store_review == true) {

                                    var index = id_of_users_like_store_comment.indexOf(request_data_body.user_id);
                                    if (index < 0) {
                                        id_of_users_like_store_comment.push(request_data_body.user_id);
                                        review_detail.id_of_users_like_store_comment = id_of_users_like_store_comment;

                                    }
                                } else {

                                    var index = id_of_users_like_store_comment.indexOf(request_data_body.user_id);
                                    if (index >= 0) {
                                        id_of_users_like_store_comment.splice(index, 1);
                                        review_detail.id_of_users_like_store_comment = id_of_users_like_store_comment;
                                    }
                                }
                                if (is_user_clicked_dislike_store_review == true) {

                                    var index = id_of_users_dislike_store_comment.indexOf(request_data_body.user_id);
                                    if (index < 0) {
                                        id_of_users_dislike_store_comment.push(request_data_body.user_id);
                                        review_detail.id_of_users_dislike_store_comment = id_of_users_dislike_store_comment;

                                    }
                                } else {
                                    var index = id_of_users_dislike_store_comment.indexOf(request_data_body.user_id);
                                    if (index >= 0) {
                                        id_of_users_dislike_store_comment.splice(index, 1);
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
                                response_data.json({success: false, error_code: USER_ERROR_CODE.STORE_REVIEW_DATA_NOT_FOUND});
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
                    response_data.json({success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND});
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