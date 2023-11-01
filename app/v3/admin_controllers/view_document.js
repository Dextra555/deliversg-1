require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var console = require('../utils/console');

var User = require('mongoose').model('user');
var Provider = require('mongoose').model('provider');
var Store = require('mongoose').model('store');
var mongoose = require('mongoose');
var Document_uploaded_list = require('mongoose').model('document_uploaded_list');
var Provider_vehicle = require('mongoose').model('provider_vehicle');


// view_document_list
exports.view_document_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'type'},{name: 'id', type: 'string'}], function (response) {
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

                    var project = {
                        $project: {
                            document_name: '$document_details.document_name',
                            document_for: '$document_details.document_for',
                            is_unique_code: '$document_details.is_unique_code',
                            is_expired_date: '$document_details.is_expired_date',
                            is_mandatory: '$document_details.is_mandatory',
                            is_show: '$document_details.is_show',
                            image_url: 1,
                            is_document_expired: 1,
                            unique_code: 1,
                            expired_date: 1
                        }
                    }

                    Document_uploaded_list.aggregate([user_condition, user_type_id_condition, document_type_condition, document_query, array_to_json_document_query, project]).then((documents) => {
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