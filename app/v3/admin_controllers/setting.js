require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');

var Installation_setting = require('mongoose').model('installation_setting');
var Setting = require('mongoose').model('setting');
var Image_setting = require('mongoose').model('image_setting');

var console = require('../utils/console');


// update_google_key_setting
exports.update_google_key_setting = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Installation_setting.findOne({}).then((installtion_setting) => {

                installtion_setting.android_user_app_gcm_key = (request_data_body.android_user_app_gcm_key).trim();
                installtion_setting.android_provider_app_gcm_key = (request_data_body.android_provider_app_gcm_key).trim();
                installtion_setting.android_store_app_gcm_key = (request_data_body.android_store_app_gcm_key).trim();
                installtion_setting.android_user_app_google_key = (request_data_body.android_user_app_google_key).trim();
                installtion_setting.android_provider_app_google_key = (request_data_body.android_provider_app_google_key).trim();
                installtion_setting.android_store_app_google_key = (request_data_body.android_store_app_google_key).trim();
                installtion_setting.ios_user_app_google_key = (request_data_body.ios_user_app_google_key).trim();
                installtion_setting.ios_provider_app_google_key = (request_data_body.ios_provider_app_google_key).trim();
                installtion_setting.ios_store_app_google_key = (request_data_body.ios_store_app_google_key).trim();
                installtion_setting.admin_panel_google_key = (request_data_body.admin_panel_google_key).trim();
                installtion_setting.store_panel_google_key = (request_data_body.store_panel_google_key).trim();
                installtion_setting.branch_io_key = (request_data_body.branch_io_key).trim();

                installtion_setting.save().then(() => {
                    response_data.json({ success: true, message: SETTING_MESSAGE_CODE.SETTING_UPDATE_SUCCESSFULLY });
                }, (error) => {
                    console.log(error);
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                });
            });
        } else {
            response_data.json(response);
        }
    });
};



// update_ios_push_notification_setting
exports.update_ios_push_notification_setting = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Installation_setting.findOne({}).then((installtion_setting) => {
                installtion_setting.user_certificate_mode = request_data_body.user_certificate_mode;
                installtion_setting.provider_certificate_mode = request_data_body.provider_certificate_mode;
                installtion_setting.store_certificate_mode = request_data_body.store_certificate_mode;
                installtion_setting.provider_bundle_id = request_data_body.provider_bundle_id;
                installtion_setting.user_bundle_id = request_data_body.user_bundle_id;
                installtion_setting.store_bundle_id = request_data_body.store_bundle_id;
                installtion_setting.key_id = request_data_body.key_id;
                installtion_setting.team_id = request_data_body.team_id;
                installtion_setting.ios_push_certificate_path = request_data_body.ios_push_certificate_path;

                installtion_setting.save().then(() => {
                    response_data.json({ success: true, message: SETTING_MESSAGE_CODE.SETTING_UPDATE_SUCCESSFULLY });
                }, (error) => {
                    console.log(error);
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                });

            });


            var file_list_size = 0;
            var files_details = request_data.files;

            if (files_details != null || files_details != 'undefined') {
                file_list_size = files_details.length;

                var file_data;
                var file_id;
                var file_name = "";

                for (i = 0; i < file_list_size; i++) {

                    file_data = files_details[i];
                    file_id = file_data.fieldname;
                    file_name = '';

                    if (file_id == 'ios_user_cert_file') {
                        file_name = IOS_PUSH_FILE_NAME.IOS_USER_CERT_FILE_NAME;
                    } else if (file_id == 'ios_user_key_file') {
                        file_name = IOS_PUSH_FILE_NAME.IOS_USER_KEY_FILE_NAME;
                    } else if (file_id == 'ios_provider_cert_file') {
                        file_name = IOS_PUSH_FILE_NAME.IOS_PROVIDER_CERT_FILE_NAME;
                    } else if (file_id == 'ios_provider_key_file') {
                        file_name = IOS_PUSH_FILE_NAME.IOS_PROVIDER_KEY_FILE_NAME;
                    } else if (file_id == 'ios_store_cert_file') {
                        file_name = IOS_PUSH_FILE_NAME.IOS_STORE_CERT_FILE_NAME;
                    } else if (file_id == 'ios_store_key_file') {
                        file_name = IOS_PUSH_FILE_NAME.IOS_STORE_KEY_FILE_NAME;
                    } else if (file_id == 'push_p8_file') {
                        file_name = IOS_PUSH_FILE_NAME.IOS_CERT_FILE_NAME;
                    }

                    if (file_name != '') {
                        utils.saveIosCertiFromBrowser(file_data.path, file_name, 1);
                    }
                }
            }
        } else {
            response_data.json(response);
        }
    });
};


// update_app_version_setting
exports.update_app_version_setting = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Installation_setting.findOne({}).then((installtion_setting) => {

                installtion_setting.android_user_app_version_code = request_data_body.android_user_app_version_code;
                installtion_setting.is_android_user_app_force_update = request_data_body.is_android_user_app_force_update;
                installtion_setting.android_provider_app_version_code = request_data_body.android_provider_app_version_code;
                installtion_setting.is_android_provider_app_force_update = request_data_body.is_android_provider_app_force_update;
                installtion_setting.android_store_app_version_code = request_data_body.android_store_app_version_code;
                installtion_setting.is_android_store_app_force_update = request_data_body.is_android_store_app_force_update;

                installtion_setting.ios_user_app_version_code = request_data_body.ios_user_app_version_code;
                installtion_setting.is_ios_user_app_force_update = request_data_body.is_ios_user_app_force_update;
                installtion_setting.ios_provider_app_version_code = request_data_body.ios_provider_app_version_code;
                installtion_setting.is_ios_provider_app_force_update = request_data_body.is_ios_provider_app_force_update;
                installtion_setting.ios_store_app_version_code = request_data_body.ios_store_app_version_code;

                installtion_setting.is_ios_store_app_force_update = request_data_body.is_ios_store_app_force_update;
                installtion_setting.is_android_user_app_open_update_dialog = request_data_body.is_android_user_app_open_update_dialog;
                installtion_setting.is_android_provider_app_open_update_dialog = request_data_body.is_android_provider_app_open_update_dialog;
                installtion_setting.is_android_store_app_open_update_dialog = request_data_body.is_android_store_app_open_update_dialog;
                installtion_setting.is_ios_user_app_open_update_dialog = request_data_body.is_ios_user_app_open_update_dialog;
                installtion_setting.is_ios_store_app_open_update_dialog = request_data_body.is_ios_store_app_open_update_dialog;
                installtion_setting.is_ios_provider_app_open_update_dialog = request_data_body.is_ios_provider_app_open_update_dialog;

                installtion_setting.save().then(() => {
                    response_data.json({ success: true, message: SETTING_MESSAGE_CODE.SETTING_UPDATE_SUCCESSFULLY });
                }, (error) => {
                    console.log(error);
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                });
            });
        } else {
            response_data.json(response);
        }
    });
};

// update_switch_setting
exports.update_switch_setting = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Setting.findOne({}).then((setting) => {

                setting.is_sms_notification = request_data_body.is_sms_notification;
                setting.is_mail_notification = request_data_body.is_mail_notification;
                setting.is_push_notification = request_data_body.is_push_notification;


                setting.is_confirmation_code_required_at_pickup_delivery = request_data_body.is_confirmation_code_required_at_pickup_delivery;
                setting.is_confirmation_code_required_at_complete_delivery = request_data_body.is_confirmation_code_required_at_complete_delivery;


                setting.is_referral_to_user = request_data_body.is_referral_to_user;
                setting.is_allow_contactless_delivery = request_data_body.is_allow_contactless_delivery;
                setting.is_allow_user_to_give_tip = request_data_body.is_allow_user_to_give_tip;
                setting.tip_type = request_data_body.tip_type;
                setting.is_allow_pickup_order_verification = request_data_body.is_allow_pickup_order_verification;
                setting.is_referral_to_provider = request_data_body.is_referral_to_provider;
                setting.is_referral_to_store = request_data_body.is_referral_to_store;

                setting.is_show_optional_field_in_user_register = request_data_body.is_show_optional_field_in_user_register;
                setting.is_show_optional_field_in_provider_register = request_data_body.is_show_optional_field_in_provider_register;
                setting.is_show_optional_field_in_store_register = request_data_body.is_show_optional_field_in_store_register;


                setting.is_upload_user_documents = request_data_body.is_upload_user_documents;
                setting.is_upload_provider_documents = request_data_body.is_upload_provider_documents;
                setting.is_upload_store_documents = request_data_body.is_upload_store_documents;

                setting.is_user_mail_verification = request_data_body.is_user_mail_verification;
                setting.is_user_sms_verification = request_data_body.is_user_sms_verification;
                setting.is_provider_mail_verification = request_data_body.is_provider_mail_verification;
                setting.is_provider_sms_verification = request_data_body.is_provider_sms_verification;


                setting.is_store_mail_verification = request_data_body.is_store_mail_verification;
                setting.is_store_sms_verification = request_data_body.is_store_sms_verification;
                setting.is_user_profile_picture_required = request_data_body.is_user_profile_picture_required;
                setting.is_provider_profile_picture_required = request_data_body.is_provider_profile_picture_required;

                setting.is_store_profile_picture_required = request_data_body.is_store_profile_picture_required;
                setting.is_user_login_by_email = request_data_body.is_user_login_by_email;
                setting.is_user_login_by_phone = request_data_body.is_user_login_by_phone;
                setting.is_user_login_by_social = request_data_body.is_user_login_by_social;

                setting.is_provider_login_by_email = request_data_body.is_provider_login_by_email;
                setting.is_provider_login_by_phone = request_data_body.is_provider_login_by_phone;
                setting.is_provider_login_by_social = request_data_body.is_provider_login_by_social;

                setting.is_store_login_by_email = request_data_body.is_store_login_by_email;
                setting.is_store_login_by_phone = request_data_body.is_store_login_by_phone;
                setting.is_store_login_by_social = request_data_body.is_store_login_by_social;

                setting.is_provider_earning_add_in_wallet_on_cash_payment = request_data_body.is_provider_earning_add_in_wallet_on_cash_payment;
                setting.is_store_earning_add_in_wallet_on_cash_payment = request_data_body.is_store_earning_add_in_wallet_on_cash_payment;
                setting.is_provider_earning_add_in_wallet_on_other_payment = request_data_body.is_provider_earning_add_in_wallet_on_other_payment;
                setting.is_store_earning_add_in_wallet_on_other_payment = request_data_body.is_store_earning_add_in_wallet_on_other_payment;


                setting.save().then(() => {
                    setting_detail = setting;
                    response_data.json({
                        success: true, message: SETTING_MESSAGE_CODE.SETTING_UPDATE_SUCCESSFULLY
                    });
                }, (error) => {
                    console.log(error);
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                });
            });
        } else {
            response_data.json(response);
        }
    });
};
exports.update_firebase_setting = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Setting.findOne({}).then((setting) => {

                setting.type = request_data_body.type;
                setting.project_id = request_data_body.project_id;
                setting.private_key_id = request_data_body.private_key_id;


                setting.private_key = request_data_body.private_key;
                setting.client_email = request_data_body.client_email;


                setting.client_id = request_data_body.client_id;
                setting.auth_uri = request_data_body.auth_uri;
                setting.token_uri = request_data_body.token_uri;
                setting.auth_provider_x509_cert_url = request_data_body.auth_provider_x509_cert_url;
                setting.client_x509_cert_url = request_data_body.client_x509_cert_url;
                setting.databaseURL = request_data_body.databaseURL;
                setting.save().then(() => {
                    setting_detail = setting;

                    /*var admin = require("firebase-admin");

                    //var serviceAccount = require("./app/utils/service_account.json");
                    var serviceAccount = {
                        "type": setting_detail.type,
                        "project_id": setting_detail.project_id,
                        "private_key_id": setting_detail.private_key_id,
                        "private_key": setting_detail.private_key,
                        "client_email": setting_detail.client_email,
                        "client_id": setting_detail.client_id,
                        "auth_uri": setting_detail.auth_uri,
                        "token_uri": setting_detail.token_uri,
                        "auth_provider_x509_cert_url": setting_detail.auth_provider_x509_cert_url,
                        "client_x509_cert_url": setting_detail.client_x509_cert_url
                    };

                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount),
                        databaseURL: setting_detail.databaseURL
                    });

                    fireDB = admin.database();*/
                    response_data.json({
                        success: true, message: SETTING_MESSAGE_CODE.SETTING_UPDATE_SUCCESSFULLY
                    });
                }, (error) => {
                    console.log(error);
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                });
            });
        } else {
            response_data.json(response);
        }
    });
};


// update_admin_setting
exports.update_admin_setting = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Setting.findOne({}).then((setting) => {
                setting.admin_name = request_data_body.admin_name;
                setting.admin_email = request_data_body.admin_email;
                setting.admin_phone_number = request_data_body.admin_phone_number;
                setting.admin_contact_email = request_data_body.admin_contact_email;
                setting.admin_contact_phone_number = request_data_body.admin_contact_phone_number;
                setting.admin_country = request_data_body.admin_country;
                setting.admin_currency_code = request_data_body.admin_currency_code;
                setting.admin_currency = request_data_body.admin_currency;
                if(request_data_body.lang){
                    setting.lang = request_data_body.lang;
                }
                setting.admin_panel_timezone = request_data_body.admin_panel_timezone;
                setting.provider_timeout = request_data_body.provider_timeout;
                setting.app_name = request_data_body.app_name;
                setting.default_search_radius = request_data_body.default_search_radius;
                setting.is_use_captcha = request_data_body.is_use_captcha

                setting.save().then(() => {
                    setting_detail = setting;
                    response_data.json({
                        success: true,
                        message: SETTING_MESSAGE_CODE.SETTING_UPDATE_SUCCESSFULLY,
                        setting: setting
                    });
                }, (error) => {
                    console.log(error);
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                });
            });
        } else {
            response_data.json(response);
        }
    });
};

////// upload_logo_images
exports.upload_logo_images = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var file_list_size = 0;
            var files_details = request_data.files;

            if (files_details != undefined && files_details.length > 0) {

                file_list_size = files_details.length;

                var file_data;
                var file_id;
                var file_name = "";

                for (i = 0; i < file_list_size; i++) {

                    file_data = files_details[i];
                    file_id = file_data.fieldname;
                    file_name = '';
                    if (file_id == 'logo_image') {
                        file_name = IMAGE_FILE_NAME.LOGO_IMAGE_NAME;
                    } else if (file_id == 'title_image') {
                        file_name = IMAGE_FILE_NAME.TITLE_IMAGE_NAME;
                    } else if (file_id == 'mail_title_image') {
                        file_name = IMAGE_FILE_NAME.MAIL_TITLE_IMAGE_NAME;
                    } else if (file_id == 'mail_logo_image') {
                        file_name = IMAGE_FILE_NAME.MAIL_LOGO_IMAGE_NAME;
                    } else if (file_id == 'store_logo_image') {
                        file_name = IMAGE_FILE_NAME.STORE_LOGO_IMAGE_NAME;
                    } else if (file_id == 'user_logo_image') {
                        file_name = IMAGE_FILE_NAME.USER_LOGO_IMAGE_NAME;
                    }
                    if (file_name != '' && (file_name != IMAGE_FILE_NAME.MAIL_TITLE_IMAGE_NAME && file_name != IMAGE_FILE_NAME.MAIL_LOGO_IMAGE_NAME)) {
                        utils.storeImageToFolderForLogo(files_details[i].path, file_name, FOLDER_NAME.WEB_IMAGES);
                    }
                    if (file_name != '' && (file_name == IMAGE_FILE_NAME.MAIL_TITLE_IMAGE_NAME || file_name == IMAGE_FILE_NAME.MAIL_LOGO_IMAGE_NAME)) {
                        utils.storeImageToFolderForLogo(files_details[i].path, file_name, FOLDER_NAME.EMAIL_IMAGES);
                    }
                    if(file_list_size.length-1 == i){
                        response_data.json({ success: true, message: SETTING_MESSAGE_CODE.SETTING_UPDATE_SUCCESSFULLY });
                    }
                }
            }
            response_data.json({ success: true, message: SETTING_MESSAGE_CODE.SETTING_UPDATE_SUCCESSFULLY });
        } else {
            response_data.json(response);
        }
    });
};

// update_image_setting
exports.update_image_setting = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            
            Image_setting.findOne({}).then((image_setting_data) => {

                image_setting_data.image_type = request_data_body.image_type;
                image_setting_data.icon_image_type = request_data_body.icon_image_type;
                image_setting_data.map_pin_image_type = request_data_body.map_pin_image_type;

                image_setting_data.delivery_image_ratio = request_data_body.image_ratio;
                image_setting_data.product_image_ratio = request_data_body.image_ratio;
                image_setting_data.item_image_ratio = request_data_body.image_ratio;
                image_setting_data.vehicle_image_ratio = request_data_body.image_ratio;
                image_setting_data.delivery_map_pin_ratio = request_data_body.map_pin_ratio;
                image_setting_data.vehicle_map_pin_ratio = request_data_body.map_pin_ratio;
                image_setting_data.delivery_icon_ratio = request_data_body.icon_ratio;
                image_setting_data.delivery_icon_minimum_size = request_data_body.icon_minimum_size;
                image_setting_data.delivery_icon_maximum_size = request_data_body.icon_maximum_size;

                image_setting_data.ads_fullscreen_image_ratio = request_data_body.image_min_height / request_data_body.image_min_width;
                image_setting_data.ads_banner_image_ratio = request_data_body.image_ratio;


                image_setting_data.delivery_image_min_width = request_data_body.image_min_width;
                image_setting_data.vehicle_image_min_width = request_data_body.image_min_width;
                image_setting_data.item_image_min_width = request_data_body.image_min_width;
                image_setting_data.product_image_min_width = request_data_body.image_min_width;

                image_setting_data.delivery_image_max_width = request_data_body.image_max_width;
                image_setting_data.vehicle_image_max_width = request_data_body.image_max_width;
                image_setting_data.item_image_max_width = request_data_body.image_max_width;
                image_setting_data.product_image_max_width = request_data_body.image_max_width;

                image_setting_data.delivery_image_min_height = request_data_body.image_min_height;
                image_setting_data.vehicle_image_min_height = request_data_body.image_min_height;
                image_setting_data.item_image_min_height = request_data_body.image_min_height;
                image_setting_data.product_image_min_height = request_data_body.image_min_height;

                image_setting_data.delivery_image_max_height = request_data_body.image_max_height;
                image_setting_data.vehicle_image_max_height = request_data_body.image_max_height;
                image_setting_data.item_image_max_height = request_data_body.image_max_height;
                image_setting_data.product_image_max_height = request_data_body.image_max_height;

                image_setting_data.delivery_map_pin_min_width = request_data_body.map_pin_min_width;
                image_setting_data.vehicle_map_pin_min_width = request_data_body.map_pin_min_width;
                image_setting_data.delivery_map_pin_max_width = request_data_body.map_pin_max_width;
                image_setting_data.vehicle_map_pin_max_width = request_data_body.map_pin_max_width;


                image_setting_data.delivery_map_pin_min_height = request_data_body.map_pin_min_height;
                image_setting_data.vehicle_map_pin_min_height = request_data_body.map_pin_min_height;
                image_setting_data.delivery_map_pin_max_height = request_data_body.map_pin_max_height;
                image_setting_data.vehicle_map_pin_max_height = request_data_body.map_pin_max_height;

                image_setting_data.ads_fullscreen_image_min_width = request_data_body.image_min_height;
                image_setting_data.ads_fullscreen_image_max_width = request_data_body.image_max_height;
                image_setting_data.ads_fullscreen_image_max_height = request_data_body.image_max_width;
                image_setting_data.ads_fullscreen_image_min_height = request_data_body.image_min_width;

                image_setting_data.ads_banner_image_min_width = request_data_body.image_min_width;
                image_setting_data.ads_banner_image_max_width = request_data_body.image_max_width;



                image_setting_data.ads_banner_image_min_height = request_data_body.image_min_height;
                image_setting_data.ads_banner_image_max_height = request_data_body.image_max_height;

                image_setting_data.save().then(() => {
                    response_data.json({
                        success: true,
                        message: SETTING_MESSAGE_CODE.SETTING_UPDATE_SUCCESSFULLY,
                        image_setting_data: image_setting_data
                    });
                }, (error) => {
                    console.log(error);
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                });
            });
        } else {
            response_data.json(response);
        }
    });
};

//get_image_setting_detail
exports.get_image_setting_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Image_setting.findOne({}).then((image_setting_data) => {
                response_data.json({
                    success: true,
                    message: SETTING_MESSAGE_CODE.SETTING_UPDATE_SUCCESSFULLY,
                    image_setting_data: image_setting_data
                });
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


add_new_language = function (request_data, response_data) {
    /*utils.check_request_params(request_data.body, [], async (response) => {
        if (response.success) {*/
            var request_data_body = request_data.body;
            Setting.findOne({}).then((setting) => {
                setting.admin_base_url = request_data_body.admin_base_url;
                setting.store_base_url = request_data_body.store_base_url;
                setting.user_base_url = request_data_body.user_base_url;
                var store_string_file = JSON.stringify(JSON.parse(request_data_body.store_string_file), null, 4);
                var user_string_file = JSON.stringify(JSON.parse(request_data_body.user_string_file), null, 4);
                const fs = require('fs');
                var request = require('request');
                if(request_data_body.admin_string_file){
                    var admin_string_file = JSON.stringify(JSON.parse(request_data_body.admin_string_file), null, 4);
                    var admin_url = setting.admin_base_url+'admin/update_language_file';
                        request({
                            uri: admin_url,
                            method: "POST",
                            formData: {
                                language: request_data_body.code,
                                string_file:admin_string_file
                            }
                        }, function (error, response, body) {
                            console.log(error)
                        })
                }
                if(request_data_body.store_string_file){
                    var store_url = setting.store_base_url+'admin/update_language_file';
                        request({
                            uri: store_url,
                            method: "POST",
                            formData: {
                                language: request_data_body.code,
                                string_file:store_string_file
                            }
                        }, function (error, response, body) {

                        })
                }
                if(request_data_body.user_string_file){
                    var user_url = setting.user_base_url+'admin/update_language_file';
                        request({
                            uri: user_url,
                            method: "POST",
                            formData: {
                                language: request_data_body.code,
                                string_file:user_string_file
                            }
                        }, function (error, response, body) {

                        })
                }
                        var languages = setting.lang;
                    var index = languages.findIndex((x) => x.code == request_data_body.code);
                        var language = {
                            name: request_data_body.name,
                            code: request_data_body.code,
                            is_lang_rtl: request_data_body.is_lang_rtl,
                            string_file_path: './src/assets/i18n/'
                        }
                    if(index == -1){
                        setting.lang.push(language);
                    }else{
                        languages[index] = language;
                        setting.lang = languages;
                    }
                    
                    
                    setting.save().then(() => {
                        response_data.json({
                            success: true,
                            message: SETTING_MESSAGE_CODE.LANGUAGE_ADDED_SUCCESSFULLY,
                            setting: setting
                        });
                    }, (error) => {
                        console.log(error);
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        });
                    });                
            })
        /*}
    })*/
}

module.exports.add_new_language = add_new_language

exports.get_languages = function (request_data, response_data) {
    Setting.findOne({}).then((setting) => {
        // response_data.json({
        //     success: true,
        //     lang: setting.lang
        // });
        response_data.json({
            success: true,
            lang: setting.lang,
            user_base_url: setting.user_base_url,
            store_base_url: setting.store_base_url,
            admin_base_url: setting.admin_base_url,
            is_use_captcha: setting.is_use_captcha
        });
    }, (error) => {
        console.log(error);
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    });
}


checklanguageexist = (lang, code) => {
    return new Promise((resolve, reject) => {
        lang_already_exist = false;
        lang.forEach((language, index) => {
            if (language.code == code) {
                lang_already_exist = true;
            }
        })
        resolve(lang_already_exist);
    })
}

exports.update_admin_setting_new = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            console.log(request_data_body)
            Setting.findOneAndUpdate({}, request_data_body).then((setting) => {
                if (setting)
                {
                    Setting.findOne({}).then((setting) => {
                        if (setting)
                        {
                            setting_detail = setting;
                            response_data.json({
                                success: true, message: SETTING_MESSAGE_CODE.SETTING_UPDATE_SUCCESSFULLY
                            });
                        }
                    })
                } else
                {
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                }
            })
        } else {
            response_data.json(response);
        }
    });
    // utils.check_request_params(request_data.body, [], function (response) {
    //     if (response.success) {

    //         var request_data_body = request_data.body;
    //         Setting.findOneAndUpdate({}, request_data_body).then((setting) => {
    //             if (setting)
    //             {
    //                 setting_detail = setting;
    //                 response_data.json({
    //                     success: true, message: SETTING_MESSAGE_CODE.SETTING_UPDATE_SUCCESSFULLY
    //                 });
    //             } else
    //             {
    //                 response_data.json({
    //                     success: false,
    //                     error_code: ERROR_CODE.SOMETHING_WENT_WRONG
    //                 });
    //             }
    //         })
    //     } else {
    //         response_data.json(response);
    //     }
    // });
};

exports.update_installation_setting = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Installation_setting.findOneAndUpdate({}, request_data_body).then((installation_setting) => {
                if (installation_setting)
                {
                    response_data.json({ success: true, message: SETTING_MESSAGE_CODE.SETTING_UPDATE_SUCCESSFULLY });
                } else
                {
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                }
            })
        } else {
            response_data.json(response);
        }
    });
};

// update_ios_push_notification_setting
exports.update_push_notification_setting = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Installation_setting.findOneAndUpdate({}, request_data_body).then((installation_setting) => {
                if (installation_setting)
                {
                    response_data.json({ success: true, message: SETTING_MESSAGE_CODE.SETTING_UPDATE_SUCCESSFULLY });
                } else
                {
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                }
            })

            var file_list_size = 0;
            var files_details = request_data.files;

            if (files_details != null || files_details != 'undefined') {
                file_list_size = files_details.length;

                var file_data;
                var file_id;
                var file_name = "";

                for (i = 0; i < file_list_size; i++) {

                    file_data = files_details[i];
                    file_id = file_data.fieldname;
                    file_name = '';

                    if (file_id == 'ios_user_cert_file') {
                        file_name = IOS_PUSH_FILE_NAME.IOS_USER_CERT_FILE_NAME;
                    } else if (file_id == 'ios_user_key_file') {
                        file_name = IOS_PUSH_FILE_NAME.IOS_USER_KEY_FILE_NAME;
                    } else if (file_id == 'ios_provider_cert_file') {
                        file_name = IOS_PUSH_FILE_NAME.IOS_PROVIDER_CERT_FILE_NAME;
                    } else if (file_id == 'ios_provider_key_file') {
                        file_name = IOS_PUSH_FILE_NAME.IOS_PROVIDER_KEY_FILE_NAME;
                    } else if (file_id == 'ios_store_cert_file') {
                        file_name = IOS_PUSH_FILE_NAME.IOS_STORE_CERT_FILE_NAME;
                    } else if (file_id == 'ios_store_key_file') {
                        file_name = IOS_PUSH_FILE_NAME.IOS_STORE_KEY_FILE_NAME;
                    } else if (file_id == 'push_p8_file') {
                        file_name = IOS_PUSH_FILE_NAME.IOS_CERT_FILE_NAME;
                    }

                    if (file_name != '') {
                        utils.saveIosCertiFromBrowser(file_data.path, file_name, 1);
                    }
                }
            }
        } else {
            response_data.json(response);
        }
    });
};


exports.update_base_urls = async function (request_data, response_data) {
    try{
        let settings = await Setting.updateOne({user_base_url: 'https://webappedeliverynew.appemporio.net/', admin_base_url: 'https://adminedeliverynew.appemporio.net/', store_base_url: 'https://storenew.appemporio.net/'})
        if(settings){
            response_data.json({success: true})
        } else {
            response_data.json({success: false})
        }
    } catch {
        response_data.json({success: false})
    }

}