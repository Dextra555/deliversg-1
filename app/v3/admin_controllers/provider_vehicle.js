require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
require('../utils/push_code');
var mongoose = require('mongoose');
var Provider = require('mongoose').model('provider');
var Document_uploaded_list = require('mongoose').model('document_uploaded_list');
var Provider_vehicle = require('mongoose').model('provider_vehicle');
var utils = require('../utils/utils');
var console = require('../utils/console');
var Country = require('mongoose').model('country');
var Service = require('mongoose').model('service');

//provider_vehicle_list
exports.provider_vehicle_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'provider_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {
                if (provider)
                {
                    var provider_id_condition = {"$match": {'provider_id': {$eq: mongoose.Types.ObjectId(request_data_body.provider_id)}}};
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
                    var document_query = {
                        $lookup:
                            {
                                from: "document_uploaded_lists",
                                localField: "_id",
                                foreignField: "user_id",
                                as: "document_list"
                            }
                    };

                    var document_unwind = { $unwind: {
                            path: "$document_list",
                            preserveNullAndEmptyArrays: true
                        }
                    };

                    var document_query1 = {
                        $lookup:
                            {
                                from: "documents",
                                localField: "document_list.document_id",
                                foreignField: "_id",
                                as: "document_list.document_details"
                            }
                    };
                    var document_unwind1 = { $unwind: {
                            path: "$document_list.document_details",
                            preserveNullAndEmptyArrays: true
                        }
                    };

                    var group = {
                        $group: {
                            _id: '$_id',
                            admin_vehicle_id: {$first: '$admin_vehicle_id'},
                            provider_id: {$first: '$provider_id'},
                            is_approved: {$first: '$is_approved'},
                            vehicle_color: {$first: '$vehicle_color'},
                            vehicle_plate_no: {$first: '$vehicle_plate_no'},
                            vehicle_name: {$first: '$vehicle_name'},
                            vehicle_model: {$first: '$vehicle_model'},
                            vehicle_year: {$first: '$vehicle_year'},
                            provider_unique_id: {$first: '$provider_unique_id'},
                            vehicle_detail: {$first: '$vehicle_detail'},
                            document_list: {$push:'$document_list'}
                        }
                    }

                    Provider_vehicle.aggregate([provider_id_condition, provider_vehicle_array_condition, document_query, document_unwind, document_query1 , document_unwind1, vehicle_query, group]).then((provider_vehicles) => {

                        if (provider_vehicles.length == 0) {
                            response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_VEHICLE_LIST_NOT_FOUND});
                        } else
                        {
                            provider_vehicles.forEach(function(vehicle_detail){
                                vehicle_detail.document_list.forEach(function(document_detail, index){
                                    if(!document_detail.document_details){
                                        vehicle_detail.document_list.splice(index, 1)
                                    }
                                })
                            })

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
                            var condition = {$match: {'city_id': {$eq: provider.city_id}}};
                            var condition1 = {$match: {'vehicle_detail.is_business': {$eq: true}}};
                            var type_query = {$match: {'type_id': provider.provider_type_id}}
                            var group = {$group: {
                                _id: null,
                                    vehicles: {$push: {
                                        _id: '$vehicle_detail._id',
                                        vehicle_name: '$vehicle_detail.vehicle_name',
                                        delivery_type: '$delivery_type'
                                    }}
                                }
                            }
                            Service.aggregate([condition, type_query, lookup, unwind, condition1, group]).then((services) => {

                                var vehicles = [];
                                if(services.length>0){
                                    vehicles = services[0].vehicles;
                                }
                                response_data.json({success: true,
                                    message: PROVIDER_MESSAGE_CODE.PROVIDER_VEHICLE_LIST_SUCCESSFULLY,
                                    provider_vehicles: provider_vehicles,
                                    vehicles: vehicles
                                });
                            });

                            setTimeout(function(){
                                
                            },1000)

                        }
                    }, (error) => {
                        console.log(error);
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
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
        } else {
            response_data.json(response);
        }
    });
};

exports.add_vehicle = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'vehicle_name', type: 'string'}, {name: 'vehicle_model', type: 'string'}, {name: 'vehicle_year'},
        {name: 'vehicle_color', type: 'string'}, {name: 'vehicle_plate_no', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {
                if (provider)
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
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                } else
                {
                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
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


// provider_vehicle_approve_decline
exports.provider_vehicle_approve_decline = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'vehicle_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider_vehicle.findOne({_id: request_data_body.vehicle_id}).then((provider_vehicle_detail) => {
                if (provider_vehicle_detail) {
                    provider_vehicle_detail.is_approved = request_data_body.is_approved;
                    provider_vehicle_detail.save();
                    Provider.findOne({_id: provider_vehicle_detail.provider_id}).then((provider_data)=>{
                        if(provider_vehicle_detail.is_approved){
                            if(provider_data && !provider_data.selected_vehicle_id){
                                provider_data.selected_vehicle_id = provider_vehicle_detail._id;
                                provider_data.vehicle_id = provider_vehicle_detail.admin_vehicle_id;
                                provider_data.save();
                            }
                        } else {
                            if(provider_data && (provider_data.selected_vehicle_id).toString() == (provider_vehicle_detail._id).toString()){
                                provider_data.selected_vehicle_id = null;
                                provider_data.vehicle_id = null;
                                provider_data.save();
                            }
                        }
                    });
                    response_data.json({success: true,
                        message: CARD_MESSAGE_CODE.CARD_DELETE_SUCCESSFULLY
                    });

                } else {
                    response_data.json({success: false, error_code: CARD_ERROR_CODE.CARD_DELETE_FAILED});
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


//provider_vehicle_update
exports.provider_vehicle_update = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'admin_vehicle_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            // request_data_body.vehicle_id = request_data_body.admin_vehicle_id;
            Provider_vehicle.findOneAndUpdate({_id: request_data_body._id}, request_data_body, {new : true}).then((provider_vehicle) => {
                if (provider_vehicle)
                {
                    Provider.findOne({_id: provider_vehicle.provider_id}).then((provider_data)=>{

                        if(provider_vehicle.is_approved){
                            if(provider_data && !provider_data.selected_vehicle_id){
                                provider_data.selected_vehicle_id = provider_vehicle._id;
                            }

                            if(provider_data && (provider_data.selected_vehicle_id).toString() == (provider_vehicle._id).toString()){
                                provider_data.vehicle_id = request_data_body.admin_vehicle_id;
                                provider_data.save();
                            }
                        } else {
                            if(provider_data && (provider_data.selected_vehicle_id).toString() == (provider_vehicle._id).toString()){
                                provider_data.selected_vehicle_id = null;
                                provider_data.vehicle_id = null;
                                provider_data.save();
                            }
                        }
                    })
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
        } else {
            response_data.json(response);
        }
    });
};



// get_provider_vehicle_document_list
exports.get_provider_vehicle_document_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'type'}, {name: 'id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var type = Number(request_data_body.type);
            var Table;
            switch (type) {
                case ADMIN_DATA_ID.USER:
                    Table = User;
                    break;
                case ADMIN_DATA_ID.PROVIDER:
                    Table = Provider;
                    break;
                case ADMIN_DATA_ID.STORE:
                    Table = Store;
                    break;
                case ADMIN_DATA_ID.PROVIDER_VEHICLE:
                    Table = Provider_vehicle;
                    break;
                default:
                    break;
            }
            Table.findOne({_id: request_data_body.id}).then((detail) => {
                if (detail) {

                    var document_query = {
                        $lookup:
                            {
                                from: "documents",
                                localField: "document_id",
                                foreignField: "_id",
                                as: "document_details"
                            }
                    };

                    var user_condition = {"$match": {'user_id': {$eq: mongoose.Types.ObjectId(request_data_body.id)}}};
                    var document_type_condition = {"$match": {'document_for': {$eq: type}}};

                    var user_type_id_condition = {"$match": {'user_type_id': {$eq: null}}};

                    if (request_data_body.user_type_id != undefined)
                    {
                        user_type_id_condition = {"$match": {'user_type_id': {$eq: mongoose.Types.ObjectId(request_data_body.user_type_id)}}};
                    }
                    var array_to_json_document_query = {$unwind: "$document_details"};

                    Document_uploaded_list.aggregate([user_condition, user_type_id_condition, document_type_condition, document_query, array_to_json_document_query]).then((documents) => {
                        if (documents.length == 0) {
                            response_data.json({success: false, error_code: DOCUMENT_ERROR_CODE.DOCUMENT_NOT_FOUND
                            });
                        } else {
                            response_data.json({success: true,
                                message: DOCUMENT_MESSAGE_CODE.DOCUMENT_LIST_SUCCESSFULLY,
                                documents: documents,
                                is_document_uploaded: detail.is_document_uploaded

                            });
                        }
                    }, (error) => {
                        console.log(error);
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        });
                    });

                } else
                {

                    response_data.json({success: false, error_code: ERROR_CODE.DETAIL_NOT_FOUND});
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

exports.get_provider_vehicle_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'provider_vehicle_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var vehicle_id_condition = {"$match": {'_id': {$eq: mongoose.Types.ObjectId(request_data_body.provider_vehicle_id)}}};
            var vehicle_query = {
                $lookup:
                    {
                        from: "vehicles",
                        localField: "admin_vehicle_id",
                        foreignField: "_id",
                        as: "vehicle_detail"
                    }
            };


            Provider_vehicle.aggregate([vehicle_id_condition, vehicle_query]).then((provider_vehicles) => {

                if (provider_vehicles.length == 0) {
                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_VEHICLE_LIST_NOT_FOUND});
                } else
                {
                    response_data.json({success: true,
                        message: PROVIDER_MESSAGE_CODE.PROVIDER_VEHICLE_LIST_SUCCESSFULLY,
                        provider_vehicle_detail: provider_vehicles[0]

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
}
