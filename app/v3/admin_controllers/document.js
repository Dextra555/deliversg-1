require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var Document = require('mongoose').model('document');
var User = require('mongoose').model('user');
var Provider = require('mongoose').model('provider');
var Store = require('mongoose').model('store');
var mongoose = require('mongoose');
var Document_uploaded_list = require('mongoose').model('document_uploaded_list');
var Provider_vehicle = require('mongoose').model('provider_vehicle');
var console = require('../utils/console');
const { query } = require('express');


//add_document_data
exports.add_document_data = async function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'document_name', type: 'string' }, { name: 'document_for' }], function (response) {
        if (!response.success) {
            return response_data.json(response);
        }
    })
    try {
        let request_data_body = request_data.body;
        let document_name = (request_data_body.document_name).trim();
        document_name = document_name.charAt(0).toUpperCase() + document_name.slice(1);

        request_data_body.document_name = document_name;
        let document_for = Number(request_data_body.document_for);
        switch (document_for) {
            case ADMIN_DATA_ID.USER:
                request_data_body.document_for = document_for;
                break;
            case ADMIN_DATA_ID.PROVIDER:
                request_data_body.document_for = document_for;
                break;
            case ADMIN_DATA_ID.STORE:
                request_data_body.document_for = document_for;
                break;
            case ADMIN_DATA_ID.PROVIDER_VEHICLE:
                request_data_body.document_for = document_for;
                break;
            default:
                break;
        }
        let document = new Document(request_data_body);
        let documentCount = 1;
        let document_count = await Document_uploaded_list.findOne({}).lean().select({ unique_id: 1 }).sort({ unique_id: -1 });
        if (document_count) {
            documentCount = document_count.unique_id + 1;
        }
        switch (document_for) {
            case ADMIN_DATA_ID.USER:
                let users = await User.find({ country_id: document.country_id }).select({ _id: 1 }).lean();
                let users_documents = [];
                users.forEach((user, index) => {
                    users_documents.push({
                        unique_id: documentCount + index,
                        user_id: user._id,
                        document_id: document._id,
                        document_for: document.document_for,
                        unique_code: "",
                        expired_date: null,
                        image_url: ""
                    });
                });
                await Document_uploaded_list.insertMany(users_documents);
                if (document.is_mandatory == true) {
                    await User.updateMany({ country_id: document.country_id }, { is_document_uploaded: false }, { multi: true }).then((data) => { })
                }
                break;
            case ADMIN_DATA_ID.PROVIDER:
                let providers = await Provider.find({ country_id: document.country_id }).select({ _id: 1 }).lean();
                let providers_documents = [];
                providers.forEach((provider, index) => {
                    providers_documents.push({
                        unique_id: documentCount + index,
                        user_id: provider._id,
                        document_id: document._id,
                        document_for: document.document_for,
                        unique_code: "",
                        expired_date: null,
                        image_url: ""
                    });
                });
                await Document_uploaded_list.insertMany(providers_documents);
                if (document.is_mandatory == true) {
                    Provider.updateMany({ country_id: document.country_id }, { is_document_uploaded: false }, { multi: true }).then((data) => { })
                }
                break;
            case ADMIN_DATA_ID.STORE:
                let stores = await Store.find({ country_id: document.country_id }).select({ _id: 1 }).lean();
                let stores_documents = [];
                stores.forEach((store, index) => {
                    stores_documents.push({
                        unique_id: documentCount + index,
                        user_id: store._id,
                        document_id: document._id,
                        document_for: document.document_for,
                        unique_code: "",
                        expired_date: null,
                        image_url: ""
                    });
                });
                await Document_uploaded_list.insertMany(stores_documents);
                if (document.is_mandatory == true) {
                    Store.updateMany({ country_id: document.country_id }, { is_document_uploaded: false }, { multi: true }).then((data) => { })
                }
                break;

            case ADMIN_DATA_ID.PROVIDER_VEHICLE:
                let provider_vehicles = await Provider_vehicle.find({ country_id: document.country_id }).select({ _id: 1 }).lean();
                let provider_vehicles_documents = [];
                provider_vehicles.forEach((provider_vehicle, index) => {
                    provider_vehicles_documents.push({
                        unique_id: documentCount + index,
                        user_id: provider_vehicle._id,
                        document_id: document._id,
                        document_for: document.document_for,
                        unique_code: "",
                        expired_date: null,
                        image_url: ""
                    });
                });
                await Document_uploaded_list.insertMany(provider_vehicles_documents);
                if (document.is_mandatory == true) {
                    Provider_vehicle.updateMany({ country_id: document.country_id }, { is_document_uploaded: false }, { multi: true }).then((data) => { })
                }
                break;

            default:
                break;
        }

        await document.save();
        return response_data.json({ success: true, message: DOCUMENT_MESSAGE_CODE.DOCUMENT_ADD_SUCCESSFULLY });
    } catch (e) {
        console.log(e)
        return response_data.json({ success: false, error_code: ERROR_CODE.SOMETHING_WENT_WRONG });
    }
};


// document_list
exports.document_list = function (request_data, response_data) {
    
    utils.check_request_params(request_data.body, [{ name: 'page' }], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var country_query = {
                $lookup:
                {
                    from: "countries",
                    localField: "country_id",
                    foreignField: "_id",
                    as: "country_details"
                }
            };
            var array_to_json = { $unwind: "$country_details" };
            // var number_of_rec = SEARCH_SORT.NO_OF_RECORD_PER_PAGE;
            // var page = request_data_body.page;
            // var sort_field = request_data_body.sort_field;
            // var sort_document = request_data_body.sort_document;
            // var search_field = request_data_body.search_field;
            // var search_value = request_data_body.search_value;
            // search_value = search_value.replace(/^\s+|\s+$/g, '');
            // search_value = search_value.replace(/ +(?= )/g, '');

            // if (search_field === "document_name")
            // {
            //     var query1 = {};
            //     var query2 = {};
            //     var query3 = {};
            //     var query4 = {};
            //     var query5 = {};
            //     var query6 = {};

            //     var full_name = search_value.split(' ');
            //     if (typeof full_name[0] === 'undefined' || typeof full_name[1] === 'undefined') {

            //         query1[search_field] = {$regex: new RegExp(search_value, 'i')};
            //         query2['document_name'] = {$regex: new RegExp(search_value, 'i')};
            //         var search = {"$match": {$or: [query1, query2]}};
            //     } else {

            //         query1[search_field] = {$regex: new RegExp(search_value, 'i')};
            //         query2['country_details.country_name'] = {$regex: new RegExp(search_value, 'i')};
            //         query3[search_field] = {$regex: new RegExp(full_name[0], 'i')};
            //         query4['country_details.country_name'] = {$regex: new RegExp(full_name[0], 'i')};
            //         query5[search_field] = {$regex: new RegExp(full_name[1], 'i')};
            //         query6['country_details.country_name'] = {$regex: new RegExp(full_name[1], 'i')};
            //         var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            //     }
            // } else
            // {
            //     var query = {};
            //     query[search_field] = {$regex: new RegExp(search_value, 'i')};
            //     var search = {"$match": query};
            // }

            // var sort = {"$sort": {}};
            // sort["$sort"][sort_field] = parseInt(sort_document);
            // var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
            // var skip = {};
            // skip["$skip"] = (page * number_of_rec) - number_of_rec;
            // var limit = {};
            // limit["$limit"] = number_of_rec;
            // var country_filter = { $match: {}}

            // if (Object.keys(request_data_body.query).length) {
            //     if(request_data_body.query.country.id != ''){
            //         search = {
            //             $match: { 
            //                 country_id: mongoose.Types.ObjectId(request_data_body.query.country.id) 
            //             }
            //         }
            //     }
            // }

            // var filterLists = request_data_body.query || [];
            // var filter = {$match: {}}
            // if(filterLists && filterLists.length>0){
            //     filter = {$match: {$and: []}}
            //     filterLists.forEach(function(filter_data){
            //         filter['$match']['$and'].push({'document_for': filter_data.for});
            //     })
            // }

            // Document.aggregate([country_query, array_to_json, search, count]).then((documents) => {
            Document.aggregate([country_query, array_to_json]).then((documents) => {
                if (documents.length == 0) {
                    response_data.json({ success: false, error_code: DOCUMENT_ERROR_CODE.DOCUMENT_NOT_FOUND, pages: 0 });
                } else {
                    // var pages = Math.ceil(documents[0].total / number_of_rec);
                        // Document.aggregate([country_query, array_to_json, sort, search, skip, limit]).then((documents) => {
                        if (documents.length == 0) {
                            response_data.json({ success: false, error_code: DOCUMENT_ERROR_CODE.DOCUMENT_NOT_FOUND });
                        } else {
                            response_data.json({
                                success: true,
                                message: DOCUMENT_MESSAGE_CODE.DOCUMENT_LIST_SUCCESSFULLY,
                                documents: documents
                            });
                        }
                    }
                    // , (error) => {
                    //     console.log(error);
                    //     response_data.json({
                    //         success: false,
                    //         error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    //     });
                    // });
                // }
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

// update document
exports.update_document = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'document_id', type: 'string' }, { name: 'document_for' }], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var document_id = request_data_body.document_id;

            var document_name = (request_data_body.document_name).trim();
            document_name = document_name.charAt(0).toUpperCase() + document_name.slice(1);
            request_data_body.document_name = document_name;
            var document_for = Number(request_data_body.document_for);

            Document.findOneAndUpdate({ _id: document_id }, request_data_body, { new: true }).then((document_data) => {
                if (document_data) {
                    switch (document_for) {
                        case ADMIN_DATA_ID.USER:
                            User.find({ country_id: document_data.country_id }).then((users) => {

                                users.forEach(function (user) {
                                    if (document_data.is_mandatory == true) {

                                        user.is_document_uploaded = false;
                                        user.save();

                                    } else {

                                        user.is_document_uploaded = true;
                                        user.save();
                                    }
                                });

                            });
                            break;
                        case ADMIN_DATA_ID.PROVIDER:
                            Provider.find({ country_id: document_data.country_id }).then((providers) => {
                                providers.forEach(function (provider) {

                                    if (document_data.is_mandatory == true) {
                                        provider.is_document_uploaded = false;
                                        provider.save();
                                    } else {

                                        provider.is_document_uploaded = true;
                                        provider.save();
                                    }
                                });
                            });
                            break;
                        case ADMIN_DATA_ID.STORE:
                            Store.find({ country_id: document_data.country_id }).then((stores) => {
                                stores.forEach(function (store) {

                                    if (document_data.is_mandatory == true) {
                                        store.is_document_uploaded = false;
                                        store.save();
                                    } else {

                                        store.is_document_uploaded = true;
                                        store.save();
                                    }
                                });
                            });
                            break;

                        case ADMIN_DATA_ID.PROVIDER:
                            Provider_vehicle.find({ country_id: document_data.country_id }).then((provider_vehicles) => {
                                provider_vehicles.forEach(function (provider_vehicle) {

                                    if (document_data.is_mandatory == true) {
                                        provider_vehicle.is_document_uploaded = false;
                                        provider_vehicle.save();
                                    } else {

                                        provider_vehicle.is_document_uploaded = true;
                                        provider_vehicle.save();
                                    }
                                });
                            });
                            break;

                        default:
                            break;
                    }


                    response_data.json({ success: true, message: DOCUMENT_MESSAGE_CODE.UPDATE_SUCCESSFULLY });

                } else {
                    response_data.json({ success: false, error_code: DOCUMENT_ERROR_CODE.UPDATE_FAILED });

                }

            });
        } else {
            response_data.json(response);
        }
    });
};

// get_document_detail
exports.get_document_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'document_id', type: 'string' }], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var document_condition = { "$match": { '_id': { $eq: mongoose.Types.ObjectId(request_data_body.document_id) } } };
            var country_query = {
                $lookup:
                {
                    from: "countries",
                    localField: "country_id",
                    foreignField: "_id",
                    as: "country_details"
                }
            };
            var array_to_json1 = { $unwind: "$country_details" };

            Document.aggregate([document_condition, country_query, array_to_json1]).then((document) => {
                if (document.length == 0) {
                    response_data.json({ success: false, error_code: SERVICE_ERROR_CODE.SERVICE_DATA_NOT_FOUND });
                } else {
                    response_data.json({
                        success: true,
                        message: PRODUCT_MESSAGE_CODE.PRODUCT_LIST_SUCCESSFULLY,
                        document: document[0]
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

/// admin upload document image
exports.upload_document = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'document_id', type: 'string' }, { name: 'id', type: 'string' }, { name: 'unique_code', type: 'string' },
        /*{name: 'expired_date', type: 'string'}*/], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var type = Number(request_data_body.type);
            var Table;
            Document_uploaded_list.findOne({ _id: request_data_body.document_id, user_id: request_data_body.id }).then((document) => {
                if (document) {
                    var image_file = request_data.files;
                 
                    switch (type) {
                        case ADMIN_DATA_ID.USER:
                            if (image_file != undefined && image_file.length > 0) {
                                utils.deleteImageFromFolder(document.image_url, FOLDER_NAME.USER_DOCUMENTS);
                                var image_name = document._id + utils.generateServerToken(4);
                                var url = utils.getStoreImageFolderPath(FOLDER_NAME.USER_DOCUMENTS) + image_name + FILE_EXTENSION.USER;

                                document.image_url = url;
                                utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.USER, FOLDER_NAME.USER_DOCUMENTS);
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
                                var url = utils.getStoreImageFolderPath(FOLDER_NAME.PROVIDER_DOCUMENTS) + image_name + FILE_EXTENSION.PROVIDER;

                                document.image_url = url;
                                utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.PROVIDER, FOLDER_NAME.PROVIDER_DOCUMENTS);
                            }
                            document.unique_code = request_data_body.unique_code;
                            document.expired_date = request_data_body.expired_date;
                            document.save();
                            Table = Provider;
                            break;
                        case ADMIN_DATA_ID.PROVIDER_VEHICLE:
                            if (image_file != undefined && image_file.length > 0) {
                                utils.deleteImageFromFolder(document.image_url, FOLDER_NAME.PROVIDER_VEHICLE_DOCUMENTS);
                                var image_name = document._id + utils.generateServerToken(4);
                                var url = utils.getStoreImageFolderPath(FOLDER_NAME.PROVIDER_VEHICLE_DOCUMENTS) + image_name + FILE_EXTENSION.PROVIDER;

                                document.image_url = url;
                                utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.PROVIDER, FOLDER_NAME.PROVIDER_VEHICLE_DOCUMENTS);
                            }
                            document.unique_code = request_data_body.unique_code;
                            document.expired_date = request_data_body.expired_date;
                            document.save();
                            Table = Provider_vehicle;
                            break;
                        case ADMIN_DATA_ID.STORE:
                            if (image_file != undefined && image_file.length > 0) {
                                utils.deleteImageFromFolder(document.image_url, FOLDER_NAME.STORE_DOCUMENTS);
                                var image_name = document._id + utils.generateServerToken(4);
                                var url = utils.getStoreImageFolderPath(FOLDER_NAME.STORE_DOCUMENTS) + image_name + FILE_EXTENSION.STORE;

                                document.image_url = url;
                                utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.STORE, FOLDER_NAME.STORE_DOCUMENTS);
                            }
                            document.unique_code = request_data_body.unique_code;
                            document.expired_date = request_data_body.expired_date;
                            document.save();
                            Table = Store;
                            break;
                        default:
                            break;
                    }

                    Table.findOne({ _id: request_data_body.id }).then((detail) => {
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

                            var array_to_json_document_query = { $unwind: "$document_details" };
                            var condition = { "$match": { 'user_id': { $eq: mongoose.Types.ObjectId(request_data_body.id) } } };
                            var image_condition = { "$match": { 'image_url': { $eq: "" } } };
                            var redact = { "$redact": { "$cond": [{ "$eq": ["$document_details.is_mandatory", true] }, "$$KEEP", "$$PRUNE"] } };
                            Document_uploaded_list.aggregate([condition, image_condition, document_query, array_to_json_document_query, redact]).then((documents) => {
                                if (documents.length == 0) {

                                    Document.findOne({ _id: document.document_id }).then((document_details) => {

                                        detail.is_document_uploaded = true;
                                        detail.save();
                                        response_data.json({
                                            success: true, message: DOCUMENT_MESSAGE_CODE.DOCUMENT_IMAGE_UPLOAD_SUCCESSFULLY,
                                            unique_code: document.unique_code,
                                            image_url: document.image_url,
                                            expired_date: document.expired_date,
                                            is_document_uploaded: detail.is_document_uploaded
                                        });
                                    }, (error) => {
                                        console.log(error);
                                        response_data.json({
                                            success: false,
                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                        });
                                    });

                                } else {

                                    Document.findOne({ _id: document.document_id }).then((document_details) => {

                                        detail.is_document_uploaded = false;
                                        detail.save();
                                        response_data.json({
                                            success: true, message: DOCUMENT_MESSAGE_CODE.DOCUMENT_IMAGE_UPLOAD_SUCCESSFULLY,
                                            unique_code: document.unique_code,
                                            image_url: document.image_url,
                                            expired_date: document.expired_date,
                                            is_document_uploaded: detail.is_document_uploaded
                                        });
                                    }, (error) => {
                                        console.log(error);
                                        response_data.json({
                                            success: false,
                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                        });
                                    });

                                }
                            });

                        } else {

                            response_data.json({ success: false, error_code: ERROR_CODE.DETAIL_NOT_FOUND });

                        }

                    }, (error) => {
                        console.log(error);
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        });
                    });

                } else {
                    response_data.json({ success: false, error_code: DOCUMENT_ERROR_CODE.DOCUMENT_LIST_NOT_FOUND });

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