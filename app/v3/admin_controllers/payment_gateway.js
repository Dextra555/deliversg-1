require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var Payment_gateway = require('mongoose').model('payment_gateway');
var console = require('../utils/console');


// add_payment_gateway_data
exports.add_payment_gateway_data = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var name = (request_data_body.name).trim();
            name = name.charAt(0).toUpperCase() + name.slice(1);
            request_data_body.name = name;
            var payment_gateway = new Payment_gateway(request_data_body);
            payment_gateway.save().then(() => {
                    response_data.json({success: true, message: PAYMENT_GATEWAY_MESSAGE_CODE.PAYMENT_GATEWAY_DATA_ADD_SUCCESSFULLY});
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

// payment gateway list
exports.payment_gateway_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            Payment_gateway.find({}).then((payment_gateway) => {
                if (payment_gateway.length == 0) {
                    response_data.json({success: false, error_code: PAYMENT_GATEWAY_ERROR_CODE.PAYMENT_GATWAY_DATA_NOT_FOUND});
                } else {
                    response_data.json({success: true,
                        message: PAYMENT_GATEWAY_MESSAGE_CODE.LIST_SUCCESSFULLY,
                        payment_gateway: payment_gateway
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


// get payment_gateway
exports.get_payment_gateway_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Payment_gateway.findOne({_id: request_data_body.payment_gateway_id}).then((payment_gateway_detail) => {
                if (!payment_gateway_detail) {
                    response_data.json({success: false, error_code: PAYMENT_GATEWAY_ERROR_CODE.PAYMENT_GATWAY_DATA_NOT_FOUND});
                } else {
                    response_data.json({success: true,
                        message: PAYMENT_GATEWAY_MESSAGE_CODE.LIST_SUCCESSFULLY,
                        payment_gateway_detail: payment_gateway_detail
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

exports.update_payment_gateway_keys = function(request_data, response_data) {
    Payment_gateway.findOneAndUpdate({_id: request_data._id}, {payment_key_id: request_data.body.public, payment_key: request_data.body.secret}).then(() => {
        response_data.json({
            success: true
        })
    })
}


// update_payment_gateway
exports.update_payment_gateway = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var payment_gateway_id = request_data_body.payment_gateway_id;
            Payment_gateway.findOneAndUpdate({_id: payment_gateway_id}, request_data_body, {new : true}).then((payment_gateway_data) => {

                if (payment_gateway_data)
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

