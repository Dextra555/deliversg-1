require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var Vehicle = require('mongoose').model('vehicle');
var console = require('../utils/console');


//add_vehicle_data
exports.add_vehicle_data = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'vehicle_name', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var vehicle_name = (request_data_body.vehicle_name).trim();
            vehicle_name = vehicle_name.charAt(0).toUpperCase() + vehicle_name.slice(1);
            request_data_body.vehicle_name = vehicle_name;
            var vehicle_data = new Vehicle(request_data_body);
            var file_list_size = 0;
            var files_details = request_data.files;

            if (files_details != null || files_details != undefined || files_details != 'undefined') {
                file_list_size = files_details.length;

                var file_data;
                var file_id;
                for (i = 0; i < file_list_size; i++) {

                    file_data = files_details[i];
                    file_id = file_data.fieldname;


                    if (file_id == 'image_url') {
                        var image_name = vehicle_data._id + utils.generateServerToken(4);
                        var url = utils.getStoreImageFolderPath(FOLDER_NAME.SERVICE_TYPE_IMAGES) + image_name + FILE_EXTENSION.SERVICE;
                        vehicle_data.image_url = url;
                        utils.storeImageToFolder(files_details[i].path, image_name + FILE_EXTENSION.SERVICE, FOLDER_NAME.SERVICE_TYPE_IMAGES);
                        // vehicle_data.save();

                    } else if (file_id == 'map_pin_image_url') {
                        var image_name = vehicle_data._id + utils.generateServerToken(4);
                        var url = utils.getStoreImageFolderPath(FOLDER_NAME.SERVICE_TYPE_MAP_PIN_IMAGES) + image_name + FILE_EXTENSION.SERVICE;
                        vehicle_data.map_pin_image_url = url;
                        utils.storeImageToFolder(files_details[i].path, image_name + FILE_EXTENSION.SERVICE, FOLDER_NAME.SERVICE_TYPE_MAP_PIN_IMAGES);
                        // vehicle_data.save();
                    }
                }
            }

            vehicle_data.save().then(() => {
                    response_data.json({success: true, message: VEHICLE_MESSAGE_CODE.VEHICLE_DATA_ADD_SUCCESSFULLY});
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

// for view all vehicle
exports.vehicle_list = function (request_data, response_data) {
    Vehicle.find({}).then((vehicles) => {
        if (vehicles.length == 0) {
            response_data.json({success: false, error_code: VEHICLE_ERROR_CODE.VEHICLE_DATA_NOT_FOUND});
        } else {
            response_data.json({success: true,
                message: VEHICLE_MESSAGE_CODE.VEHICLE_LIST_SUCCESSFULLY,
                vehicles: vehicles
            });
        }
    });
};

// for view all vehicle
exports.vehicle_list_for_provider = function (request_data, response_data) {

    
    Vehicle.find({is_business: true}).then((vehicles) => {
        if (vehicles.length == 0) {
            response_data.json({success: false, error_code: VEHICLE_ERROR_CODE.VEHICLE_DATA_NOT_FOUND});
        } else {
            response_data.json({success: true,
                message: VEHICLE_MESSAGE_CODE.VEHICLE_LIST_SUCCESSFULLY,
                vehicles: vehicles
            });
        }
    });
};

//vehicle_toggle_change
exports.vehicle_toggle_change = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'vehicle_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var vehicle_id = request_data_body.vehicle_id;
            Vehicle.findOne({_id: vehicle_id}).then((vehicle) => {
                if (vehicle) {
                    vehicle.is_business = request_data_body.is_business;

                    vehicle.save().then(() => {

                            response_data.json({success: true,
                                message: ITEM_MESSAGE_CODE.STATE_CHANGE_SUCCESSFULLY
                            });
                        
                    });
                } else
                {
                    response_data.json({success: false, error_code: ITEM_ERROR_CODE.ITEM_NOT_FOUND});
                }

            });
        } else {
            response_data.json(response);
        }
    }, (error) => {
        console.log(error)
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    });
};

// update vehicle
exports.update_vehicle = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'vehicle_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var vehicle_id = request_data_body.vehicle_id;

            var vehicle_name = (request_data_body.vehicle_name).trim();
            vehicle_name = vehicle_name.charAt(0).toUpperCase() + vehicle_name.slice(1);
            request_data_body.vehicle_name = vehicle_name;

            Vehicle.findOneAndUpdate({_id: vehicle_id}, request_data_body, {new : true}).then((vehicle_data) => {

                if (vehicle_data)
                {
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

                                utils.deleteImageFromFolder(vehicle_data.image_url, FOLDER_NAME.SERVICE_TYPE_IMAGES);
                                var image_name = vehicle_data._id + utils.generateServerToken(4);
                                var url = utils.getStoreImageFolderPath(FOLDER_NAME.SERVICE_TYPE_IMAGES) + image_name + FILE_EXTENSION.SERVICE;
                                vehicle_data.image_url = url;
                                utils.storeImageToFolder(files_details[i].path, image_name + FILE_EXTENSION.SERVICE, FOLDER_NAME.SERVICE_TYPE_IMAGES);
                                vehicle_data.save();

                            } else if (file_id == 'map_pin_image_url') {
                                utils.deleteImageFromFolder(vehicle_data.map_pin_image_url, FOLDER_NAME.SERVICE_TYPE_MAP_PIN_IMAGES);
                                var image_name = vehicle_data._id + utils.generateServerToken(4);
                                var url = utils.getStoreImageFolderPath(FOLDER_NAME.SERVICE_TYPE_MAP_PIN_IMAGES) + image_name + FILE_EXTENSION.SERVICE;
                                vehicle_data.map_pin_image_url = url;
                                utils.storeImageToFolder(files_details[i].path, image_name + FILE_EXTENSION.SERVICE, FOLDER_NAME.SERVICE_TYPE_MAP_PIN_IMAGES);
                                vehicle_data.save();
                            }
                        }
                    }
                    response_data.json({success: true, message: VEHICLE_MESSAGE_CODE.UPDATE_SUCCESSFULLY});

                } else
                {
                    response_data.json({success: false, error_code: VEHICLE_ERROR_CODE.UPDATE_FAILED});
                }
            });
        } else {
            response_data.json(response);
        }
    }, (error) => {
        console.log(error)
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    });
};

// get_vehicle_detail
exports.get_vehicle_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'vehicle_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Vehicle.findOne({_id: request_data_body.vehicle_id}).then((vehicle) => {
                if (!vehicle) {
                    response_data.json({success: false, error_code: PRODUCT_ERROR_CODE.PRODUCT_DATA_NOT_FOUND});
                } else {
                    response_data.json({success: true,
                        message: PRODUCT_MESSAGE_CODE.PRODUCT_LIST_SUCCESSFULLY,
                        vehicle: vehicle
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