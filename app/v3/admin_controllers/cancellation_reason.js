require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var Cancellation_reason = require('mongoose').model('cancellation_reason');
var Country = require('mongoose').model('country');
var mongoose = require('mongoose');
var console = require('../utils/console');


//add_cancellation_reason
exports.add_cancellation_reason = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;

            if (request_data_body.reason) {
                if (typeof request_data_body.namreasone == "string") {
                    request_data_body.reason = JSON.parse(request_data_body.reason);
                }

                var reason = [];
                request_data_body.reason.forEach(function (data) {
                    if (data == "" || data == "null") {
                        reason.push(null);
                    } else {
                        reason.push(data);
                    }
                })
                request_data_body.reason = reason;
            }


            var cancellation_reason = new Cancellation_reason(request_data_body);

            cancellation_reason.save().then(() => {
                response_data.json({success: true, message: ADS_MESSAGE_CODE.ADS_ADD_SUCCESSFULLY});
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


/// cancellation_reason_list
exports.cancellation_reason_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var project = {
                $project:{
                    "_id":1,
                    "user_type": 1,
                    "reason": 1,
                    "unique_id": 1,
                }
            }

            Cancellation_reason.aggregate([
                {$match: {user_type: request_data_body.user_type}},
                project]).then((cancellation_reasons) => {
                if (cancellation_reasons.length == 0) {
                    response_data.json({success: false, error_code: ITEM_ERROR_CODE.ITEM_NOT_FOUND});
                } else {
                    response_data.json({
                        success: true,
                        message: ITEM_MESSAGE_CODE.ITEM_LIST_SUCCESSFULLY,
                        cancellation_reasons: cancellation_reasons
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


// delete_reason
exports.delete_cancellation_reason = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Cancellation_reason.remove({_id: request_data_body.reason_id}).then(() => {
                response_data.json({
                    success: true,
                    message: ADS_MESSAGE_CODE.ADS_DELETE_SUCCESSFULLY
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


// update_reason
exports.update_cancellation_reason = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            delete request_data_body.ads_type;
            Cancellation_reason.findOneAndUpdate({_id: request_data_body.reason_id}, request_data_body, {new: true}).then((cancellation_reason) => {
                if (cancellation_reason) {
                    response_data.json({success: true, message: ADS_MESSAGE_CODE.ADS_UPDATE_SUCCESSFULLY});
                } else {
                    response_data.json({success: false, error_code: DELIVERY_ERROR_CODE.UPDATE_FAILED});
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

//get_cancellation_reason
exports.get_cancellation_reason = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var cancellation_reason_condition = {"$match": {'_id': {$eq: mongoose.Types.ObjectId(request_data_body.reason_id)}}};

            Cancellation_reason.aggregate([cancellation_reason_condition]).then((cancellation_reason) => {
                if (cancellation_reason.length == 0) {
                    response_data.json({success: false, error_code: SERVICE_ERROR_CODE.SERVICE_DATA_NOT_FOUND});
                } else {
                    response_data.json({
                        success: true,
                        message: PRODUCT_MESSAGE_CODE.PRODUCT_LIST_SUCCESSFULLY,
                        cancellation_reason: cancellation_reason[0]
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