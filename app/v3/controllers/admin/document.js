require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
var utils = require('../../utils/utils');
var console = require('../../utils/console');


var City = require('mongoose').model('city');
var Delivery = require('mongoose').model('delivery');
var User = require('mongoose').model('user');
var Country = require('mongoose').model('country');
var mongoose = require('mongoose');
var Provider = require('mongoose').model('provider');
var User = require('mongoose').model('user');
var Store = require('mongoose').model('store');
var Document_uploaded_list = require('mongoose').model('document_uploaded_list');
var Document = require('mongoose').model('document');
var Provider_vehicle = require('mongoose').model('provider_vehicle');

// get document list
exports.get_document_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
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
                    if (type != ADMIN_DATA_ID.PROVIDER_VEHICLE &&  request_data_body.server_token !== null && detail.server_token !== request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {

                        var document_query = {
                            $lookup:
                                    {
                                        from: "documents",
                                        localField: "document_id",
                                        foreignField: "_id",
                                        as: "document_details"
                                    }
                        };

                        var array_to_json_document_query = {$unwind: "$document_details"};

                        var document_visible_condition = {"$match": {'document_details.is_show': true}};

                        var condition = {"$match": {'user_id': {$eq: mongoose.Types.ObjectId(request_data_body.id)}}};
                        var type_condition = {"$match": {'document_for': {$eq: Number(request_data_body.type)}}};
                        Document_uploaded_list.aggregate([document_query, array_to_json_document_query,type_condition,condition, document_visible_condition]).then((documents) => {
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

                    }
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

/// upload document image
exports.upload_document = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'document_id', type: 'string'}, {name: 'id', type: 'string'}
        ], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var type = Number(request_data_body.type);
            var Table;
            Document_uploaded_list.findOne({_id: request_data_body.document_id, user_id: request_data_body.id}).then((document) => {
                if (document)
                {
                    var image_file = request_data.files;
                    switch (type) {
                        case ADMIN_DATA_ID.USER:
                            if (image_file != undefined && image_file.length > 0) {
                                utils.deleteImageFromFolder(document.image_url, FOLDER_NAME.USER_DOCUMENTS);
                                var image_name = document._id + utils.generateServerToken(4);
                                var url = utils.getStoreImageFolderPath(FOLDER_NAME.USER_DOCUMENTS) + image_name + FILE_EXTENSION.DOCUMENT;

                                document.image_url = url;
                                utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.DOCUMENT, FOLDER_NAME.USER_DOCUMENTS);

                            }

                            document.unique_code = request_data_body.unique_code;
                            document.expired_date = request_data_body.expired_date;
                            document.save();
                            Table = User;
                            break;
                        case ADMIN_DATA_ID.PROVIDER:
                            if (image_file != undefined && image_file.length > 0) {
                                utils.deleteImageFromFolder(document.image_url, FOLDER_NAME.PROVIDER_DOCUMENTS);
                                var image_name = document._id + utils.generateServerToken(4);
                                var url = utils.getStoreImageFolderPath(FOLDER_NAME.PROVIDER_DOCUMENTS) + image_name + FILE_EXTENSION.DOCUMENT;

                                document.image_url = url;
                                utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.DOCUMENT, FOLDER_NAME.PROVIDER_DOCUMENTS);

                            }
                            // if(document.unique_code && document.unique_code != ''){
                            //     document.unique_code = request_data_body.unique_code;
                            // } 
                            // if(document.expired_date && document.expired_date != ''){
                            //     document.expired_date = request_data_body.expired_date;
                            // }
                            document.unique_code = request_data_body.unique_code;
                            document.expired_date = request_data_body.expired_date;
                            document.save();
                            Table = Provider;
                            break;
                        case ADMIN_DATA_ID.STORE:
                            if (image_file != undefined && image_file.length > 0) {
                                utils.deleteImageFromFolder(document.image_url, FOLDER_NAME.STORE_DOCUMENTS);
                                var image_name = document._id + utils.generateServerToken(4);
                                var url = utils.getStoreImageFolderPath(FOLDER_NAME.STORE_DOCUMENTS) + image_name + FILE_EXTENSION.DOCUMENT;
                                document.image_url = url;
                                utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.DOCUMENT, FOLDER_NAME.STORE_DOCUMENTS);

                            }
                            document.unique_code = request_data_body.unique_code;
                            document.expired_date = request_data_body.expired_date;
                            document.save();
                            Table = Store;
                            break;

                        case ADMIN_DATA_ID.PROVIDER_VEHICLE:
                            if (image_file != undefined && image_file.length > 0) {
                                utils.deleteImageFromFolder(document.image_url, FOLDER_NAME.PROVIDER_VEHICLE_DOCUMENTS);
                                var image_name = document._id + utils.generateServerToken(4);
                                var url = utils.getStoreImageFolderPath(FOLDER_NAME.PROVIDER_VEHICLE_DOCUMENTS) + image_name + FILE_EXTENSION.DOCUMENT;

                                document.image_url = url;
                                utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.DOCUMENT, FOLDER_NAME.PROVIDER_VEHICLE_DOCUMENTS);

                            }
                            document.unique_code = request_data_body.unique_code;
                            document.expired_date = request_data_body.expired_date;
                            document.save();
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

                            var array_to_json_document_query = {$unwind: "$document_details"};

                            var condition = {"$match": {'user_id': {$eq: mongoose.Types.ObjectId(request_data_body.id)}}};

                            var vehicle_document_condition = {"$match": {'user_type_id': {$eq: null}}};

                             if(request_data_body.user_type_id != undefined)
                             {
                              vehicle_document_condition = {"$match": {'user_type_id': {$eq: mongoose.Types.ObjectId(request_data_body.user_type_id)}}};

                             }
                            var image_condition = {"$match": {'image_url': {$eq: ""}}};

                            var redact = {"$redact": {"$cond": [{"$eq": ["$document_details.is_mandatory", true]}, "$$KEEP", "$$PRUNE"]}};
                                    Document_uploaded_list.aggregate([condition,vehicle_document_condition, image_condition, document_query, array_to_json_document_query, redact]).then((documents) => {

                                        if (documents.length == 0) {

                                            Document.findOne({_id: document.document_id}).then((document_details) => {

                                                detail.is_document_uploaded = true;
                                                detail.save();
                                                response_data.json({success: true, message: DOCUMENT_MESSAGE_CODE.DOCUMENT_IMAGE_UPLOAD_SUCCESSFULLY,
                                                    unique_code:document.unique_code,
                                                    image_url: document.image_url,
                                                    expired_date: document.expired_date,
                                                    is_document_uploaded: detail.is_document_uploaded});
                                            }, (error) => {
                                                console.log(error);
                                                response_data.json({
                                                    success: false,
                                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                });
                                            });

                                        } else {


                                            Document.findOne({_id: document.document_id}).then((document_details) => {

                                                detail.is_document_uploaded = false;
                                                detail.save();
                                                response_data.json({success: true, message: DOCUMENT_MESSAGE_CODE.DOCUMENT_IMAGE_UPLOAD_SUCCESSFULLY,
                                                    unique_code:document.unique_code,
                                                    image_url: document.image_url,
                                                    expired_date: document.expired_date,
                                                    is_document_uploaded: detail.is_document_uploaded});
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

                        } else
                        {

                            response_data.json({success: false, error_code: ERROR_CODE.DETAIL_NOT_FOUND});

                        }
                    });

                } else
                {
                    response_data.json({success: false, error_code: DOCUMENT_ERROR_CODE.DOCUMENT_LIST_NOT_FOUND});

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