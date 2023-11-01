require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var Email = require('mongoose').model('email_detail');
var Setting = require('mongoose').model('setting');
var console = require('../utils/console');


// email_list
exports.email_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            Email.find({}).then((email_details) => {
                if (email_details.length == 0) {
                    response_data.json({success: false, error_code: EMAIL_ERROR_CODE.EMAIL_DETAIL_NOT_FOUND});
                } else {
                    response_data.json({success: true,
                        message: EMAIL_MESSAGE_CODE.GET_EMAIL_LIST_SUCCESSFULLY,
                        email_details: email_details
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

// get_email_detail
exports.get_email_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Email.findOne({_id: request_data_body.email_id}).then((email_detail) => {
                if (!email_detail) {
                    response_data.json({success: false, error_code: EMAIL_ERROR_CODE.EMAIL_DETAIL_NOT_FOUND});
                } else {
                    response_data.json({success: true,
                        message: EMAIL_MESSAGE_CODE.GET_EMAIL_DETAIL_SUCCESSFULLY,
                        email_detail: email_detail
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

// update_email
exports.update_email = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var email_id = request_data_body.email_id;
            Email.findOneAndUpdate({_id: email_id}, request_data_body, {new : true}).then((email_data) => {

                if (email_data)
                {
                    response_data.json({
                        success: true,
                        message: EMAIL_MESSAGE_CODE.EMAIL_UPDATE_SUCCESSFULLY

                    });
                } else
                {
                    response_data.json({success: false, error_code: EMAIL_ERROR_CODE.EMAIL_DETAIL_NOT_FOUND});
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


// email configuration get mail for whole App.
exports.update_email_configuration = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Setting.findOne({}).then((setting) => {
                setting.email = request_data_body.email;
                setting.password = request_data_body.password;
                setting.domain = request_data_body.domain;
                setting.smtp_port = request_data_body.smtp_port;
                setting.smtp_host = request_data_body.smtp_host;
                setting.save().then(() => {
                    setting_detail = setting;

                    Email.update({}, { $set: { email_admin_info: request_data_body.email_admin_info } }, { multi: true }).then((res)=>{
                        response_data.json({success: true, message: EMAIL_MESSAGE_CODE.EMAIL_CONFIG_UPDATE_SUCCESSFULLY});                        
                    })
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