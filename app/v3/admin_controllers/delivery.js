require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var mongoose = require('mongoose');
var Delivery = require('mongoose').model('delivery');
var Store = require('mongoose').model('store');
var Delivery_type = require('mongoose').model('delivery_type');
var console = require('../utils/console');

// add_delivery_data
exports.add_delivery_data = function (request_data, response_data) {
    // console.log(request_data)
    utils.check_request_params(request_data.body, [{ name: 'delivery_name'}], function (response) {
        
        if (response.success) {

            var request_data_body = request_data.body;
            var delivery_name = JSON.parse(request_data_body.delivery_name)
            
            request_data_body.delivery_name = delivery_name;
                
            var description = JSON.parse(request_data_body.description)
            request_data_body.description = description;
            request_data_body.delivery_name.forEach(function(data){
                if (data == "" || data == "null") {
                    data = null;
                }
            })
            Delivery.findOne({delivery_name:request_data_body.delivery_name[0]},function(err,duplicate_delivery){
                if(duplicate_delivery){
                        response_data.json({
                            success: false,
                            error_code: DELIVERY_ERROR_CODE.DELIVERY_ALREADY_FOUND
                        });
                }else{
                    request_data_body.description.forEach(function(data){
                		if(data =="" || data =="null"){
                                    data = null;
                                  
                		}
                    })
                    var sequence_number = Number(request_data_body.sequence_number);
                    request_data_body.sequence_number = sequence_number;
                    if (request_data_body.famous_products_tags) {
                        request_data_body.famous_products_tags = JSON.parse(request_data_body.famous_products_tags);
                    } else {
                        request_data_body.famous_products_tags = []
                    }
                    request_data_body.famous_products_tags.forEach(function(data1){
        		    data1.forEach(function(data){
                            if(data =="" || data =="null"){
                                data = null;
                            }
                        })
                    })


                    var delivery_data = new Delivery(request_data_body);
                    var file_list_size = 0;
                    var files_details = request_data.files;

                    if (files_details != null || files_details != 'undefined') {
                        file_list_size = files_details.length;
                        var file_data;
                        var file_id;

                        for (i = 0; i < file_list_size; i++) {
                            file_data = files_details[i];
                            file_id = file_data.fieldname;
                            if (file_id == 'image_url') {
                                var image_name = delivery_data._id + utils.generateServerToken(4);
                                var url = utils.getStoreImageFolderPath(FOLDER_NAME.DELIVERY_TYPE_IMAGES) + image_name + FILE_EXTENSION.DELIVERY;
                                delivery_data.image_url = url;
                                utils.storeImageToFolder(files_details[i].path, image_name + FILE_EXTENSION.DELIVERY, FOLDER_NAME.DELIVERY_TYPE_IMAGES);
                                // delivery_data.save();

                            } else if (file_id == 'icon_url') {
                                var image_name = delivery_data._id + utils.generateServerToken(4);
                                var url = utils.getStoreImageFolderPath(FOLDER_NAME.DELIVERY_ICON_IMAGES) + image_name + FILE_EXTENSION.DELIVERY;
                                delivery_data.icon_url = url;
                                utils.storeImageToFolder(files_details[i].path, image_name + FILE_EXTENSION.DELIVERY, FOLDER_NAME.DELIVERY_ICON_IMAGES);
                                // delivery_data.save();
                            } else if (file_id == 'map_pin_url') {
                                var image_name = delivery_data._id + utils.generateServerToken(4);
                                var url = utils.getStoreImageFolderPath(FOLDER_NAME.DELIVERY_MAP_PIN_IMAGES) + image_name + FILE_EXTENSION.DELIVERY;
                                delivery_data.map_pin_url = url;
                                utils.storeImageToFolder(files_details[i].path, image_name + FILE_EXTENSION.DELIVERY, FOLDER_NAME.DELIVERY_MAP_PIN_IMAGES);
                                // delivery_data.save();
                            }
                        }
                    }

                    delivery_data.save().then(() => {
                        response_data.json({ success: true, message: DELIVERY_MESSAGE_CODE.DELIVERY_DATA_ADD_SUCCESSFULLY });
                    }, (error) => {
                        console.log(error)
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        });
                    });

                }
            });
        } else {
            response_data.json(response);

        }
    });
};

// delivery_toggle_change
exports.delivery_toggle_change = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'delivery_id', type: 'string' }], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var delivery_id = request_data_body.delivery_id;
            Delivery.findOne({ _id: delivery_id }).then((delivery) => {
                if (delivery) {
                    delivery.is_business = request_data_body.is_business;
                    delivery.save().then(() => {

                        response_data.json({
                            success: true,
                            message: ITEM_MESSAGE_CODE.STATE_CHANGE_SUCCESSFULLY
                        });

                    });
                } else {
                    response_data.json({ success: false, error_code: ITEM_ERROR_CODE.ITEM_NOT_FOUND });
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

// get_delivery_type
exports.get_delivery_type = function (request_data, response_data) {
    Delivery_type.find({}).then((delivery_type) => {
        if (delivery_type.length == 0) {
            response_data.json({ success: false, error_code: DELIVERY_ERROR_CODE.DELIVERY_DATA_NOT_FOUND });
        } else {
            response_data.json({
                success: true,
                delivery_type: delivery_type
            });
        }
    }, (error) => {
        console.log(error)
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    });
};





/// for view all delivery
exports.delivery_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {
            console.log('v3 delivery list')

            var delivery_array = {
                $lookup:
                {
                    from: "delivery_types",
                    localField: "delivery_type_id",
                    foreignField: "_id",
                    as: "delivery_types_details"
                }
            };
            var array_to_json = { $unwind: "$delivery_types_details" };
            var sort = { $sort: { sequence_number: 1 } };

            Delivery.aggregate([sort]).then((deliveries) => {
                if (deliveries.length == 0) {
                    response_data.json({
                        success: false, error_code: DELIVERY_ERROR_CODE.DELIVERY_DATA_NOT_FOUND
                    });
                } else {
                    response_data.json({
                        success: true,
                        message: DELIVERY_MESSAGE_CODE.DELIVERY_LIST_SUCCESSFULLY,
                        deliveries: deliveries

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


// update delivery
exports.update_delivery = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'delivery_id', type: 'string' }], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var delivery_id = request_data_body.delivery_id;
            var delivery_name = JSON.parse(request_data_body.delivery_name);
            request_data_body.description = JSON.parse(request_data_body.description);
            //delivery_name = delivery_name.charAt(0).toUpperCase() + delivery_name.slice(1);
            request_data_body.delivery_name = delivery_name;
            request_data_body.delivery_name.forEach(function(data){
        		if(data =="" || data =="null"){
                            data = null;
        		}
            })
            request_data_body.description.forEach(function(data){
        		if(data =="" || data =="null"){
                            data = null;
        		}
            })

            if (request_data_body.is_provide_table_booking) {
                request_data_body.is_provide_table_booking = request_data_body.is_provide_table_booking;
            } else {
                request_data_body.is_provide_table_booking = false;
            }

            if (request_data_body.famous_products_tags) {
                request_data_body.famous_products_tags = JSON.parse(request_data_body.famous_products_tags);
            } else {
                request_data_body.famous_products_tags = [];
            }
            request_data_body.famous_products_tags.forEach(function(data1){
		        data1.forEach(function(data){
                    if(data =="" || data =="null"){
                        data = null;
                    }
                })
            })
            var deleted_product_tag_array = [];
            if (request_data_body.deleted_product_tag_array) {
                deleted_product_tag_array = request_data_body.deleted_product_tag_array.split(',');
            }
            Delivery.findOne({_id: {$ne: delivery_id},delivery_name:request_data_body.delivery_name[0]},function(err,duplicate_delivery){
                if(duplicate_delivery){
                        response_data.json({
                            success: false,
                            error_code: DELIVERY_ERROR_CODE.DELIVERY_ALREADY_FOUND
                        });
                }else{
                    Store.find({ store_delivery_id: delivery_id }, function (error, store_list) {
                        store_list.forEach(function (store_data) {
                            deleted_product_tag_array.forEach(function (deleted_tag) {
                                var tag_index = store_data.famous_products_tags.indexOf(deleted_tag);
                                if (tag_index != -1) {
                                    store_data.famous_products_tags.splice(tag_index, 1);
                                    store_data.markModified('famous_products_tags');
                                    store_data.save();
                                }
                            });
                        })
                    })
                    Delivery.findOneAndUpdate({ _id: delivery_id }, request_data_body, { new: true }).then((delivery_data) => {

                        if (delivery_data) {

                            var file_list_size = 0;
                            var files_details = request_data.files;

                            if (files_details != null || files_details != 'undefined') {
                                file_list_size = files_details.length;

                                var file_data;
                                var file_id;

                                for (i = 0; i < file_list_size; i++) {
                                    file_data = files_details[i];
                                    file_id = file_data.fieldname;
                                    if (file_id == 'image_url') {
                                        utils.deleteImageFromFolder(delivery_data.image_url, FOLDER_NAME.DELIVERY_TYPE_IMAGES);
                                        var image_name = delivery_data._id + utils.generateServerToken(4);
                                        var url = utils.getStoreImageFolderPath(FOLDER_NAME.DELIVERY_TYPE_IMAGES) + image_name + FILE_EXTENSION.DELIVERY;
                                        delivery_data.image_url = url;
                                        utils.storeImageToFolder(files_details[i].path, image_name + FILE_EXTENSION.DELIVERY, FOLDER_NAME.DELIVERY_TYPE_IMAGES);
                                        // delivery_data.save();
                                    } else if (file_id == 'icon_url') {
                                        utils.deleteImageFromFolder(delivery_data.icon_url, FOLDER_NAME.DELIVERY_ICON_IMAGES);
                                        var image_name = delivery_data._id + utils.generateServerToken(4);
                                        var url = utils.getStoreImageFolderPath(FOLDER_NAME.DELIVERY_ICON_IMAGES) + image_name + FILE_EXTENSION.DELIVERY;
                                        delivery_data.icon_url = url;
                                        utils.storeImageToFolder(files_details[i].path, image_name + FILE_EXTENSION.DELIVERY, FOLDER_NAME.DELIVERY_ICON_IMAGES);
                                        // delivery_data.save();
                                    } else if (file_id == 'map_pin_url') {
                                        utils.deleteImageFromFolder(delivery_data.map_pin_url, FOLDER_NAME.DELIVERY_MAP_PIN_IMAGES);
                                        var image_name = delivery_data._id + utils.generateServerToken(4);
                                        var url = utils.getStoreImageFolderPath(FOLDER_NAME.DELIVERY_MAP_PIN_IMAGES) + image_name + FILE_EXTENSION.DELIVERY;
                                        delivery_data.map_pin_url = url;
                                        utils.storeImageToFolder(files_details[i].path, image_name + FILE_EXTENSION.DELIVERY, FOLDER_NAME.DELIVERY_MAP_PIN_IMAGES);
                                        // delivery_data.save();
                                    }
                                }
                            }
                            delivery_data.save().then(() => {
                                response_data.json({ success: true, message: DELIVERY_MESSAGE_CODE.UPDATE_SUCCESSFULLY });
                            })


                        } else {
                            response_data.json({ success: false, error_code: DELIVERY_ERROR_CODE.UPDATE_FAILED });
                        }
                    }, (error) => {
                        console.log(error);
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        });
                    });
                }
            })
        } else {
            response_data.json(response);
        }
    });
};


// get_delivery_detail
exports.get_delivery_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'delivery_id', type: 'string' }], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var delivery_condition = { "$match": { '_id': { $eq: mongoose.Types.ObjectId(request_data_body.delivery_id) } } };
            var delivery_type_query = {
                $lookup:
                {
                    from: "delivery_types",
                    localField: "delivery_type_id",
                    foreignField: "_id",
                    as: "delivery_type_details"
                }
            };
            var array_to_json = { $unwind: "$delivery_type_details" };

            Delivery.aggregate([delivery_condition]).then((delivery) => {
                if (delivery.length == 0) {
                    response_data.json({ success: false, error_code: SERVICE_ERROR_CODE.SERVICE_DATA_NOT_FOUND });
                } else {
                    response_data.json({
                        success: true,
                        message: PRODUCT_MESSAGE_CODE.PRODUCT_LIST_SUCCESSFULLY,
                        delivery: delivery[0]
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
