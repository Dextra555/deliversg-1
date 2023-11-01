require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
var console = require('../../utils/console');

var utils = require('../../utils/utils');
var Provider = require('mongoose').model('provider');
var Country = require('mongoose').model('country');
var Provider_vehicle = require('mongoose').model('provider_vehicle');

/* add_vehicle */
exports.add_vehicle = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'vehicle_name', type: 'string'}, {name: 'vehicle_model', type: 'string'}, {name: 'vehicle_year'},
        {name: 'vehicle_color', type: 'string'}, {name: 'vehicle_plate_no', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {
                if (provider)
                {
                    if (request_data_body.server_token !== null && provider.server_token != request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        var provider_vehicle = new Provider_vehicle({
                            country_id: provider.country_id,
                            vehicle_id: null,
                            service_id: null,
                            admin_service_id: null,
                            admin_vehicle_id: null,
                            provider_id: provider._id,
                            provider_unique_id: provider.unique_id,
                            vehicle_year: request_data_body.vehicle_year,
                            vehicle_model: request_data_body.vehicle_model,
                            vehicle_name: request_data_body.vehicle_name,
                            vehicle_plate_no: request_data_body.vehicle_plate_no,
                            vehicle_color: request_data_body.vehicle_color,
                            is_approved: false,
                            is_document_uploaded: false

                        });
                        Country.findOne({_id: provider.country_id}).then((country) => {
                            if (country) {
                                var country_id = country._id;
                                
                                utils.insert_documets_for_new_users(provider_vehicle, provider._id, ADMIN_DATA_ID.PROVIDER_VEHICLE, country_id, function(document_response){
                                    provider_vehicle.is_document_uploaded = document_response.is_document_uploaded;
                                    provider.vehicle_ids.push(provider_vehicle._id);
                                    provider_vehicle.save().then(() => {
                                        provider.save();
                                        response_data.json({success: true,
                                            message: PROVIDER_MESSAGE_CODE.PROVIDER_VEHICLE_ADD_SUCCESSFULLY,
                                            provider_vehicle: provider_vehicle

                                        });
                                    }, (error) => {
                                        console.log(error);
                                        response_data.json({
                                            success: false,
                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                        });
                                    });
                                });
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
                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
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


/* update_vehicle_detail */
exports.update_vehicle_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'vehicle_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
          
            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {
                if (provider)
                {
                    if (request_data_body.server_token !== null && provider.server_token != request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        Provider_vehicle.findOneAndUpdate({_id: request_data_body.vehicle_id, provider_id: request_data_body.provider_id}, request_data_body, {new : true}).then((provider_vehicle) => {
                            if (provider_vehicle)
                            {
                                response_data.json({
                                    success: true,
                                    message: PROVIDER_MESSAGE_CODE.PROVIDER_VEHICLE_UPDATE_SUCCESSFULLY,
                                    provider_vehicle: provider_vehicle
                                });
                            } else
                            {
                                response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_VEHICLE_UPDATE_FAILED});
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
                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
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



/* get_vehicle_list */
exports.get_vehicle_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var provider_id = request_data_body.provider_id;
            Provider.findOne({_id: provider_id}).then((provider) => {
                if (provider)
                {
                    if (request_data_body.server_token !== null && provider.server_token != request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {

                        var provider_id_condition = {"$match": {'provider_id': {$eq: provider._id}}};
                        var provider_vehicle_array_condition = {"$match": {'_id': {$in: provider.vehicle_ids}}};
                        var vehicle_query = {
                            $lookup:
                                    {
                                        from: "vehicles",
                                        localField: "admin_vehicle_id",
                                        foreignField: "_id",
                                        as: "vehicle_detail"
                                    }
                        };

                        Provider_vehicle.aggregate([provider_id_condition, provider_vehicle_array_condition, vehicle_query]).then((provider_vehicles) => {

                            if (provider_vehicles.length == 0) {
                                response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_VEHICLE_LIST_NOT_FOUND});
                            } else
                            {
                                response_data.json({success: true,
                                    message: PROVIDER_MESSAGE_CODE.PROVIDER_VEHICLE_LIST_SUCCESSFULLY,
                                    provider_vehicles: provider_vehicles});
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
                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
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


/* select_vehicle */
exports.select_vehicle = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'vehicle_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {
                if (provider)
                {
                    if (request_data_body.server_token !== null && provider.server_token != request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        Provider_vehicle.findOne({_id: request_data_body.vehicle_id}).then((provider_vehicle) => {

                            if (provider_vehicle)
                            {
                                provider.vehicle_id = provider_vehicle.admin_vehicle_id;
                                provider.service_id = provider_vehicle.service_id;
                                provider.selected_vehicle_id = request_data_body.vehicle_id;

                                provider.save();
                                response_data.json({
                                    success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
                                    provider: provider
                                });
                            } else
                            {
                                response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
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
                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
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