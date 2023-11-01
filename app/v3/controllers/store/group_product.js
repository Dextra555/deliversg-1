require('../../utils/message_code');
require('../../utils/error_code');
var console = require('../../utils/console');

require('../../utils/constants');
var utils = require('../../utils/utils');
var mongoose = require('mongoose');
var ProductGroup = require('mongoose').model('ProductGroup');
var Product = require('mongoose').model('product');
var Store = require('mongoose').model('store');
var Item = require('mongoose').model('item');
var mongoose = require('mongoose');
var Schema = mongoose.Types.ObjectId;

exports.add_product_group_data = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
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
            if(request_data_body.product_ids && request_data_body.product_ids!=""){
                request_data_body.product_ids = request_data_body.product_ids.split(",");
            }
			
            var store_detail = response.store;
                        ProductGroup.findOne({
                            store_id: request_data_body.store_id,
                            name: request_data_body.name
                        }).then((product_group_data) => {
                            if (product_group_data) {
                                response_data.json({
                                    success: false,
                                    error_code: PRODUCT_ERROR_CODE.PRODUCT_GROUP_ALREADY_EXIST
                                });
                            } else {

                                ProductGroup.findOne({store_id: request_data_body.store_id}).sort({sequence_number:-1}).then((product_group)=>{

                                    if(product_group)
                                    {
                                        var product_sequence_number = product_group.sequence_number + 1;
                                        request_data_body["sequence_number"] = product_sequence_number;
                                    }

                                    var product_group = new ProductGroup(request_data_body);
                                    var image_file = request_data.files;
                                    if (image_file != undefined && image_file.length > 0) {
                                        var image_name = product_group._id + utils.generateServerToken(4);
                                        var url = utils.getStoreImageFolderPath(FOLDER_NAME.STORE_PRODUCTS_GROUP) + image_name + FILE_EXTENSION.PROVIDERGROUP;

                                        product_group.image_url = url;
                                        utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.PROVIDERGROUP, FOLDER_NAME.STORE_PRODUCTS_GROUP);

                                    }
                                    request_data_body.product_ids.forEach(function(data){
                                        data = Schema(data);
                                    })
                                    product_group.product_ids = request_data_body.product_ids;
                                    product_group.save().then(() => {
                                        response_data.json({
                                            success: true, message: PRODUCT_MESSAGE_CODE.PRODUCT_GROUP_ADD_SUCCESSFULLY,
                                            product_group: product_group
                                        });
                                    }, (error) => {
                                        console.log(error)
                                        response_data.json({
                                            success: false,
                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                        });
                                    });

                                })                    
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
}


//get_product_list
exports.get_product_group_list = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store_detail = response.store;
			
                        var condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
                        var sort = { "$sort": {} };
                        sort["$sort"]['sequence_number'] = parseInt(1);
                        ProductGroup.aggregate([condition,sort]).then((product_groups) => {
                            if (product_groups.length == 0) {
                                response_data.json({
                                    success: false,
                                    error_code: PRODUCT_ERROR_CODE.PRODUCT_GROUP_DATA_NOT_FOUND
                                });
                            } else {
                                response_data.json({
                                    success: true,
                                    message: PRODUCT_MESSAGE_CODE.PRODUCT_GROUP_LIST_SUCCESSFULLY,
                                    product_groups: product_groups
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


//get_product_data
exports.get_group_list_of_group = function (request_data, response_data) {
    var request_data_body = request_data.body;
    Product.find({store_id: request_data_body.store_id},{name:1,_id:1},function(err,product_array){
        if (product_array.length == 0) {
            response_data.json({
                success: true,
                //message: PRODUCT_MESSAGE_CODE.PRODUCT_GROUP_LIST_SUCCESSFULLY,
                product_array: []
            });
        } else {
            var country_lookup = {
                $lookup: {
                    from: "countries",
                    localField: "country_id",
                    foreignField: "_id",
                    as: "country_details"
                }
            }

            var store_tax_lookup = {
                $lookup: {
                    from: "taxes",
                    localField: "country_details.taxes",
                    foreignField: "_id",
                    as: "store_taxes"
                }
            }

            var query = {
                $match: {
                    _id: {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}
                }
            }

            Store.aggregate([query, country_lookup, store_tax_lookup]).then(store => {
                console.log(store)
                response_data.json({
                    success: true,
                    //message: PRODUCT_MESSAGE_CODE.PRODUCT_GROUP_LIST_SUCCESSFULLY,
                    product_array: product_array,
                    taxes: store[0].store_taxes
                });
            })
        }
                                    
    }).sort({sequence_number:1})
};

exports.get_product_group_data = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'product_group_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store_detail = response.store;
                        var condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
                        var product_condition = {$match: {'_id': {$eq: mongoose.Types.ObjectId(request_data_body.product_group_id)}}};
                        var sort = { "$sort": {} };
                        sort["$sort"]['sequence_number'] = parseInt(1);


                        ProductGroup.aggregate([condition,product_condition,sort]).then((product_groups) => {
                            
                            if (product_groups.length == 0) {
                                response_data.json({
                                    success: false,
                                    error_code: PRODUCT_ERROR_CODE.PRODUCT_GROUP_DATA_NOT_FOUND
                                });
                            } else {

                                var store_condition = {$match: {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};

                                        response_data.json({
                                            success: true,
                                            message: PRODUCT_MESSAGE_CODE.PRODUCT_GROUP_LIST_SUCCESSFULLY,
                                            product_group: product_groups[0]
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


exports.delete_product_group = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'product_group_id', type: 'string'}], function (response) {
        if (response.success) {
                var request_data_body = request_data.body;
                     
                                    ProductGroup.findOne({_id: request_data_body.product_group_id,store_id:request_data_body.store_id}).then((product_group_data) => {

                                        if (product_group_data) {
                                            utils.deleteImageFromFolder(product_group_data.image_url, FOLDER_NAME.STORE_PRODUCTS_GROUP);
                                                product_group_data.remove();
                                                response_data.json({
                                                    success: true, message: PRODUCT_MESSAGE_CODE.PRODUCT_GROUP_UPDATE_SUCCESSFULLY,
                                                    product_group: product_group_data
                                                });
                                        } else {
                                            response_data.json({
                                                success: false,
                                                error_code: PRODUCT_ERROR_CODE.PRODUCT_GROUP_UPDATE_FAILED
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
}
// update product_group
exports.update_product_group = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'product_group_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
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
            if(request_data_body.product_ids && request_data_body.product_ids!=""){
                request_data_body.product_ids = request_data_body.product_ids.split(",");
            }
            request_data_body.product_ids.forEach(function(data){
                data = Schema(data);
            })
            var product_group_id = request_data_body.product_group_id;
			
                        ProductGroup.findOne({
                            _id: {$ne: request_data_body.product_group_id},
                            store_id: request_data_body.store_id,
                            name: request_data_body.name
                        }).then((product_detail) => {
                            if (product_detail) {
                                response_data.json({
                                    success: false,
                                    error_code: PRODUCT_ERROR_CODE.PRODUCT_GROUP_ALREADY_EXIST
                                });
                            } else {

                                ProductGroup.findOneAndUpdate({_id: product_group_id}, request_data_body, {new: true}).then((product_group_data) => {

                                    if (product_group_data) {
                                        var image_file = request_data.files;
                                        if (image_file != undefined && image_file.length > 0) {
                                            utils.deleteImageFromFolder(product_group_data.image_url, FOLDER_NAME.STORE_PRODUCTS_GROUP);
                                            var image_name = product_group_data._id + utils.generateServerToken(4);
                                            var url = utils.getStoreImageFolderPath(FOLDER_NAME.STORE_PRODUCTS_GROUP) + image_name + FILE_EXTENSION.PROVIDERGROUP;
                                            utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.PROVIDERGROUP, FOLDER_NAME.STORE_PRODUCTS_GROUP);
                                            product_group_data.image_url = url;
                                            product_group_data.save();
                                        }
                                        response_data.json({
                                            success: true, message: PRODUCT_MESSAGE_CODE.PRODUCT_GROUP_UPDATE_SUCCESSFULLY,
                                            product_group: product_group_data
                                        });

                                    } else {
                                        response_data.json({
                                            success: false,
                                            error_code: PRODUCT_ERROR_CODE.PRODUCT_GROUP_UPDATE_FAILED
                                        });
                                    }
                                }, (error) => {
                                    console.log(error)
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
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