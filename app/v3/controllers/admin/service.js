require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
var utils = require('../../utils/utils');
var Store = require('mongoose').model('store');
var Service = require('mongoose').model('service');
var mongoose = require('mongoose');
var console = require('../../utils/console');



//// get_service_list
exports.get_service_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'store_id', type: 'string'},{name: 'city_id', type: 'string'},{name: 'server_token', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Store.findOne({_id: request_data_body.store_id}).then((store) => {
                if (store) {
                    if (request_data_body.server_token !== null && store.server_token !== request_data_body.server_token) {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        var server_time = new Date();

                        var city_type_to_type_query = {
                            $lookup:
                                    {
                                        from: "vehicles",
                                        localField: "vehicle_id",
                                        foreignField: "_id",
                                        as: "vehicle_details"
                                    }
                        };
                        var array_to_json = {$unwind: "$vehicle_details"};

                        var cityid_condition = {$match: {'city_id': {$eq: mongoose.Types.ObjectId(request_data_body.city_id)}}};
                        Service.aggregate([cityid_condition, city_type_to_type_query, array_to_json]).then((service) => {

                            if (service.length != 0) {
                                response_data.json({success: true,
                                    message: SERVICE_MESSAGE_CODE.SERVICE_LIST_SUCCESSFULLY,
                                    server_time: server_time,
                                    service: service});
                            } else
                            {
                                response_data.json({success: false, error_code: SERVICE_ERROR_CODE.SERVICE_DATA_NOT_FOUND});
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

                    response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND});
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