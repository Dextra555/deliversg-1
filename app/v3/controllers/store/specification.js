require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
var utils = require('../../utils/utils');
var Specification = require('mongoose').model('specification');
var Store = require('mongoose').model('store');
var console = require('../../utils/console');


// add specification api 
exports.add_specification = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{ name: 'specification_group_id', type: 'string' }], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
			var store_detail = response.store;
	
                        if (request_data_body.specification_group_id != undefined) {

                            var specification_name_array = request_data_body.specification_name;
                            var size = specification_name_array.length;
                            var specification;
                            for (var i = 0; i < size; i++) {
                                request_data_body.name = specification_name_array[i].name;
                                request_data_body.sequence_number = specification_name_array[i].sequence_number;
                                if(request_data_body.name){
                                    if(typeof request_data_body.name == "string"){
                                        request_data_body.name = JSON.parse(request_data_body.name);
                                    }
                                        var name = [];
                                        request_data_body.name.forEach(function(data){
                                            if(data =="" || data =="null"){
                                                name.push(null);
                                            }else{
                                                name.push(data);
                                            }
                                        })
                                        request_data_body.name = name;
                                }
                                
                                if(typeof request_data_body.sequence_number == "string" || typeof request_data_body.sequence_number == "number"){
                                    request_data_body.sequence_number = Number(request_data_body.sequence_number);
                                }


                                request_data_body.price = Number(specification_name_array[i].price);
                                
                                specification = new Specification(request_data_body);

                                if (i == (size - 1)) {
                                    specification.save().then(() => {
                                        Specification.find({ specification_group_id: request_data_body.specification_group_id }).then((specifications) => {
                                            response_data.json({
                                                success: true, message: SPECIFICATION_MESSAGE_CODE.SPECIFICATION_ADD_SUCCESSFULLY
                                                , specifications: specifications
                                            });
                                        });
                                    });
                                } else {
                                    specification.save();
                                }
                            }

                        } else {
                            response_data.json({ success: false, error_code: SPECIFICATION_ERROR_CODE.SPECIFICATION_DATA_ADD_FAILED });

                        }

        } else {
            response_data.json(response);
        }
    });
};

//// get specification list
exports.get_specification_list = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store_detail = response.store;
                   
                        Specification.find({}).sort({sequence_number:1}).then((specifications) => {
                            if (specifications.length == 0) {
                                response_data.json({ success: false, error_code: SPECIFICATION_ERROR_CODE.SPECIFICATION_DATA_NOT_FOUND });
                            } else {
                                response_data.json({
                                    success: true,
                                    message: SPECIFICATION_MESSAGE_CODE.SPECIFICATION_LIST_SUCCESSFULLY,
                                    specifications: specifications
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

// delete specification
exports.delete_specification = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{ name: 'specification_group_id', type: 'string' }], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store_detail = response.store;
                    
                        var specification_id_array = request_data_body.specification_id;

                        Specification.remove({ _id: { $in: specification_id_array }, store_id: request_data_body.store_id, specification_group_id: request_data_body.specification_group_id }, function (error) {

                            Specification.find({ store_id: request_data_body.store_id, specification_group_id: request_data_body.specification_group_id }).sort({sequence_number:1}).then((specification) => {
                                response_data.json({
                                    success: true,
                                    message: SPECIFICATION_MESSAGE_CODE.SPECIFICATION_DELETE_SUCCESSFULLY,
                                    specifications: specification

                                });
                            }, (error) => {
                                console.log(error);
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });

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

exports.update_specification_name = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
		
        if (response.success) {
            var body = request_data.body;
            if(body.name){
                if(typeof body.name == "string"){
                    body.name = JSON.parse(body.name);
                }
                var name = [];
                body.name.forEach(function(data){
                    if(data =="" || data =="null"){
                        name.push(null);
                    }else{
                        name.push(data);
                    }
                })
                body.name = name;
            }
            if(typeof body.sequence_number == "string"){
                body.sequence_number = Number(body.sequence_number);
            }
                Specification.updateOne({ _id: body.sp_id }, { name: body.name ,sequence_number: body.sequence_number,price: Number(body.specification_price)}).then((specification_group) => {
                    response_data.json({
                        success: true,
                        message: STORE_MESSAGE_CODE.SPECIFICATIONS_UPDATED_SUCCESSFULLY
                    })
                })
           
        } else {
            response_data.json(response);
        }
    })
}













