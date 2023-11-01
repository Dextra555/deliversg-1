require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
var utils = require('../../utils/utils');
var mongoose = require('mongoose');
var Delivery = require('mongoose').model('delivery');
var Store = require('mongoose').model('store');
// var Delivery_type = require('../../../models/admin/delivery_type');
var console = require('../../utils/console');


// Add type of Delivery
exports.add_delivery_data = function (request_data, response_data) {
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

                            } else if (file_id == 'icon_url') {
                                var image_name = delivery_data._id + utils.generateServerToken(4);
                                var url = utils.getStoreImageFolderPath(FOLDER_NAME.DELIVERY_ICON_IMAGES) + image_name + FILE_EXTENSION.DELIVERY;
                                delivery_data.icon_url = url;
                                utils.storeImageToFolder(files_details[i].path, image_name + FILE_EXTENSION.DELIVERY, FOLDER_NAME.DELIVERY_ICON_IMAGES);
                            } else if (file_id == 'map_pin_url') {
                                var image_name = delivery_data._id + utils.generateServerToken(4);
                                var url = utils.getStoreImageFolderPath(FOLDER_NAME.DELIVERY_MAP_PIN_IMAGES) + image_name + FILE_EXTENSION.DELIVERY;
                                delivery_data.map_pin_url = url;
                                utils.storeImageToFolder(files_details[i].path, image_name + FILE_EXTENSION.DELIVERY, FOLDER_NAME.DELIVERY_MAP_PIN_IMAGES);
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


