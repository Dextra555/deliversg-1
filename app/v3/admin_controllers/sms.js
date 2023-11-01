require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var console = require('../utils/console');

var SMS = require('mongoose').model('sms_detail');
var Sms_gateway = require('mongoose').model('sms_gateway');

// sms_list
exports.sms_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {
            SMS.find({}).then((sms_details) => {
                if (sms_details.length == 0) {
                    response_data.json({success: false, error_code: SMS_ERROR_CODE.SMS_DETAIL_NOT_FOUND});
                } else {
                    response_data.json({success: true,
                        message: SMS_MESSAGE_CODE.GET_SMS_LIST_SUCCESSFULLY,
                        sms_details: sms_details
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

// get_sms_detail
exports.get_sms_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            SMS.findOne({_id: request_data_body.sms_id}).then((sms_detail) => {
                if (!sms_detail) {
                    response_data.json({success: false, error_code: SMS_ERROR_CODE.SMS_DETAIL_NOT_FOUND});
                } else {
                    response_data.json({success: true,
                        message: SMS_MESSAGE_CODE.GET_SMS_DETAIL_SUCCESSFULLY,
                        sms_detail: sms_detail
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

// update_sms
exports.update_sms = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var sms_id = request_data_body.sms_id;
            SMS.findOneAndUpdate({_id: sms_id}, request_data_body, {new : true}).then((sms_data) => {
                if (sms_data)
                {
                    response_data.json({
                        success: true,
                        message: SMS_MESSAGE_CODE.SMS_UPDATE_SUCCESSFULLY

                    });
                } else
                {
                    response_data.json({success: false, error_code: SMS_ERROR_CODE.SMS_DETAIL_NOT_FOUND});
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


// get_sms_gateway_detail
exports.get_sms_gateway_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Sms_gateway.findOne({}).then((sms_gateway_detail) => {
                if (!sms_gateway_detail) {
                    response_data.json({success: false, error_code: SMS_ERROR_CODE.SMS_DETAIL_NOT_FOUND});
                } else {
                    response_data.json({success: true,
                        message: SMS_MESSAGE_CODE.GET_SMS_DETAIL_SUCCESSFULLY,
                        sms_gateway_detail: sms_gateway_detail
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

//  update_sms_configuration get mail for whole App.
exports.update_sms_configuration = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Sms_gateway.findOne({}).then((sms_gateway_detail) => {
                sms_gateway_detail.sms_auth_id = request_data_body.sms_auth_id;
                sms_gateway_detail.sms_auth_token = request_data_body.sms_auth_token;
                sms_gateway_detail.sms_number = request_data_body.sms_number;
                sms_gateway_detail.save(function (error) {
                    response_data.json({success: true, message: SMS_MESSAGE_CODE.SMS_CONFIG_UPDATE_SUCCESSFULLY});
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