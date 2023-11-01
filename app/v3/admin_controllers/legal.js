require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var Legal = require('mongoose').model('Legal')
var console = require('../utils/console');
const { response } = require('express');


exports.get_legal = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {
            Legal.findOne({}).then((legal) => {
                if (!legal) {
                    var init_legal = new Legal()
                    init_legal.save().then(() => {
                        response_data.json({
                            success: true,
                            message: LEGAL_MESSAGE_CODE.LIST_SUCCESSFULLY,
                            legal: init_legal
                        });
                    })
                } else {
                    response_data.json({
                        success: true,
                        message: LEGAL_MESSAGE_CODE.LIST_SUCCESSFULLY,
                        legal: legal
                    });
                }
            }, (error) => {
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

exports.update_legal = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Legal.findOneAndUpdate({}, request_data_body, { new: true }).then((legal_data) => {
                if (legal_data) {
                    response_data.json({ success: true, message: LEGAL_MESSAGE_CODE.UPDATE_SUCCESSFULLY });
                } else {
                    response_data.json({ success: false, error_code: LEGAL_ERROR_CODE.UPDATE_FAILED });
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