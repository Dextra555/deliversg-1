require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
var utils = require('../../utils/utils');
var console = require('../../utils/console');

var City = require('mongoose').model('city');
var Delivery = require('mongoose').model('delivery');
var User = require('mongoose').model('user');
var Country = require('mongoose').model('country');

//// get delivery list
exports.get_delivery_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            Delivery.find({is_business: true}).sort({sequence_number:1}).then((delivery) => {
                if (delivery.length == 0) {
                    response_data.json({success: false, error_code: DELIVERY_ERROR_CODE.DELIVERY_DATA_NOT_FOUND});
                } else {
                    response_data.json({success: true,
                        message: DELIVERY_MESSAGE_CODE.DELIVERY_LIST_SUCCESSFULLY,
                        deliveries: delivery
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





//// get delivery list for city
exports.get_delivery_list_for_city = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'city_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            City.findOne({_id: request_data_body.city_id}).then((city_detail) => {
                if (city_detail)
                {
                    Delivery.find({'_id': {$in: city_detail.deliveries_in_city},is_business:true, delivery_type: 1}).sort({sequence_number:1}).then((deliveries) => {
                        if (deliveries.length == 0) {
                            response_data.json({success: false, error_code: DELIVERY_ERROR_CODE.DELIVERY_DATA_NOT_FOUND});
                        } else
                        {
                            response_data.json({success: true,
                                message: DELIVERY_MESSAGE_CODE.DELIVERY_LIST_FOR_CITY_SUCCESSFULLY,
                                deliveries: deliveries});
                        }

                    });
                }
                else
                {
                    response_data.json({success: false, error_code: CITY_ERROR_CODE.CITY_DETAILS_NOT_FOUND});
                }
            });
        } else {
            response_data.json(response);
        }
    });
};






