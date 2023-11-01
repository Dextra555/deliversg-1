require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
require('../utils/push_code');
var utils = require('../utils/utils');
var emails = require('../controllers/email_sms/emails');
var SMS = require('../controllers/email_sms/sms');
var Store = require('mongoose').model('store');
var Deliveries = require('mongoose').model('delivery');
var console = require('../utils/console');


// for view all store_list
exports.store_list_for_map = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var city_query = {
                $lookup:
                    {
                        from: "cities",
                        localField: "city_id",
                        foreignField: "_id",
                        as: "city_detail"
                    }
            };

            var delivery_lookup = {
                $lookup: {
                    from: "deliveries",
                    localField: "store_delivery_id",
                    foreignField: "_id",
                    as: "delivery_details"
                }
            }
            var array_to_json_city_detail = {$unwind: "$city_detail"};
            var array_to_json_delivery_detail = {$unwind: "$delivery_details"};
            var server_time = new Date();
            var approve_condition = {$match: {is_approved: {$eq: true}}}
            Store.aggregate([approve_condition, city_query, array_to_json_city_detail, delivery_lookup, array_to_json_delivery_detail]).then((stores) => {
                Deliveries.find({}).then(deliveries => {
                    if (stores.length == 0) {
                        response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND});
                    } else {
                        response_data.json({success: true,
                            message: STORE_MESSAGE_CODE.STORE_LIST_SUCCESSFULLY,
                            stores: stores,
                            server_time: server_time,
                            deliveries
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
        } else {
            response_data.json(response);
        }
    });
};