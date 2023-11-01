require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
var utils = require('../../utils/utils');
var console = require('../../utils/console');

var Vehicle = require('mongoose').model('vehicle');
var Service = require('mongoose').model('service');
var City = require('mongoose').model('city');
var Country = require('mongoose').model('country');

//// get vehicle list
exports.get_vehicle_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'city_id', type: 'string'}], function (response) {
        if (response.success) {

            var lookup = {
                $lookup:
                        {
                            from: "vehicles",
                            localField: "vehicle_id",
                            foreignField: "_id",
                            as: "vehicle_detail"
                        }
            };
            var unwind = {$unwind: "$vehicle_detail"};
            var mongoose = require('mongoose');
            var condition = {$match: {'city_id': {$eq: mongoose.Types.ObjectId(request_data.body.city_id)}}};
            var type_query = {$match: {}}
            var is_business = {}
            if(request_data.body.type_id){
                type_query = {$match: {type_id: mongoose.Types.ObjectId(request_data.body.type_id)}};
            } else {
                type_query = {$match: {type_id: null}};
            }

            if(request_data.body.is_business){
                is_business = { is_business: 1 };
            }

            Service.aggregate([condition, type_query, lookup, unwind]).then((services) => {

                Vehicle.find(is_business).then((vehicle) => {
                    if (vehicle.length == 0) {
                        response_data.json({success: false, error_code: VEHICLE_ERROR_CODE.VEHICLE_DATA_NOT_FOUND});
                    } else {

                        response_data.json({success: true,
                            message: VEHICLE_MESSAGE_CODE.VEHICLE_LIST_SUCCESSFULLY,
                            vehicles: vehicle, services: services
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



//// get_city_lists
exports.get_city_lists = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'country_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Country.findOne({_id: request_data_body.country_id}).then((country_data) => {

                if (country_data)
                {

                    var lookup = {
                        $lookup:
                                {
                                    from: "cities",
                                    localField: "city_id",
                                    foreignField: "_id",
                                    as: "city_detail"
                                }
                    };
                    var unwind = {$unwind: "$city_detail"};
                    var mongoose = require('mongoose');
                    var condition = {$match: {'country_id': {$eq: mongoose.Types.ObjectId(request_data.body.country_id)}}};
                    Service.aggregate([condition, lookup, unwind]).then((services) => {

                        City.find({country_id: request_data_body.country_id}).then((city) => {
                            if (city.length == 0) {
                                response_data.json({success: false, error_code: VEHICLE_ERROR_CODE.VEHICLE_DATA_NOT_FOUND});
                            } else {
                                response_data.json({success: true,
                                    message: VEHICLE_MESSAGE_CODE.VEHICLE_LIST_SUCCESSFULLY,
                                    cities: city,
                                    currency_sign: country_data.currency_sign,
                                    is_distance_unit_mile:country_data.is_distance_unit_mile,
                                    services: services
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
        } else {
            response_data.json(response);
        }
    });
};