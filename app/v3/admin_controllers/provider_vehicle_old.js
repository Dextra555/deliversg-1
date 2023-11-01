require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
require('../utils/push_code');
var mongoose = require('mongoose');
var Provider = require('mongoose').model('provider');
var Document_uploaded_list = require('mongoose').model('document_uploaded_list');
var Provider_vehicle = require('mongoose').model('provider_vehicle');



//provider_vehicle_list
exports.provider_vehicle_list = function (request_data, response_data) {
    var request_data_body = request_data.body;

    Provider.findOne({_id: request_data_body.provider_id}, function (error, provider) {
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
           


            Provider_vehicle.aggregate([provider_id_condition, provider_vehicle_array_condition, vehicle_query], function (error, provider_vehicles) {

                if (error || provider_vehicles.length == 0) {
                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_VEHICLE_LIST_NOT_FOUND});
                } else
                {
                    response_data.json({success: true,
                        message: PROVIDER_MESSAGE_CODE.PROVIDER_VEHICLE_LIST_SUCCESSFULLY,
                        provider_vehicles: provider_vehicles

                    });
                }
            });


        }
    });
};


// provider_vehicle_approve_decline
exports.provider_vehicle_approve_decline = function (request_data, response_data) {
    var request_data_body = request_data.body;
    
    Provider_vehicle.findOne({_id: request_data_body.vehicle_id}, function (error, provider_vehicle_detail) {
        if (provider_vehicle_detail) {
            provider_vehicle_detail.is_approved = request_data_body.is_approved;
            provider_vehicle_detail.save();
            response_data.json({success: true,
                message: CARD_MESSAGE_CODE.CARD_DELETE_SUCCESSFULLY
            });

        } else {
            response_data.json({success: false, error_code: CARD_ERROR_CODE.CARD_DELETE_FAILED});
        }
    });
};


//provider_vehicle_update
exports.provider_vehicle_update = function (request_data, response_data) {
    var request_data_body = request_data.body;
    request_data_body.vehicle_id = request_data_body.admin_vehicle_id;
    
    Provider_vehicle.findOneAndUpdate({_id: request_data_body.provider_vehicle_id}, request_data_body, {new : true}, function (error, provider_vehicle) {

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

    });



};



// get_provider_vehicle_document_list
exports.get_provider_vehicle_document_list = function (request_data, response_data) {
    var request_data_body = request_data.body;
    var type = Number(request_data_body.type);


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
    Table.findOne({_id: request_data_body.id}, function (error, detail) {
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

            Document_uploaded_list.aggregate([user_condition, user_type_id_condition, document_type_condition, document_query, array_to_json_document_query], function (error, documents) {
                if (error || documents.length == 0) {
                    response_data.json({success: false, error_code: DOCUMENT_ERROR_CODE.DOCUMENT_NOT_FOUND
                    });
                } else {
                    response_data.json({success: true,
                        message: DOCUMENT_MESSAGE_CODE.DOCUMENT_LIST_SUCCESSFULLY,
                        documents: documents,
                        is_document_uploaded: detail.is_document_uploaded

                    });
                }
            });

        } else
        {

            response_data.json({success: false, error_code: ERROR_CODE.DETAIL_NOT_FOUND});
        }
    });
};




exports.get_provider_vehicle_detail = function (request_data, response_data) {
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


    Provider_vehicle.aggregate([vehicle_id_condition, vehicle_query], function (error, provider_vehicles) {

        if (error || provider_vehicles.length == 0) {
            response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_VEHICLE_LIST_NOT_FOUND});
        } else
        {
            response_data.json({success: true,
                message: PROVIDER_MESSAGE_CODE.PROVIDER_VEHICLE_LIST_SUCCESSFULLY,
                provider_vehicle_detail: provider_vehicles[0]

            });
        }
    });


}
