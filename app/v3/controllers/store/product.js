require('../../utils/message_code');
require('../../utils/error_code');
var console = require('../../utils/console');

require('../../utils/constants');
var utils = require('../../utils/utils');
var mongoose = require('mongoose');
var Product = require('mongoose').model('product');
var Store = require('mongoose').model('store');
var Item = require('mongoose').model('item');


exports.add_product = function (request_data, response_data) {
    console.log(request_data.body)
    console.log(request_data.header)
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
            if(typeof request_data_body.sequence_number == "string"){
                request_data_body.sequence_number = Number(request_data_body.sequence_number);
            }
            
                        Product.findOne({
                            store_id: request_data_body.store_id,
                            name: request_data_body.name
                        }).then((product_data) => {
                            if (product_data) {
                                response_data.json({
                                    success: false,
                                    error_code: PRODUCT_ERROR_CODE.PRODUCT_ALREADY_EXIST
                                });
                            } else {

                                Product.findOne({store_id: request_data_body.store_id}).sort({sequence_number:-1}).then((product)=>{

                                    if (product && request_data_body.sequence_number == null) {
                                        var product_sequence_number = product.sequence_number + 1;
                                        request_data_body["sequence_number"] = product_sequence_number;
                                    }
                                    if (request_data_body.sequence_number == null) {
                                        request_data_body["sequence_number"] = 0;
                                    }

                                    var product = new Product(request_data_body);
                                    var image_file = request_data.files;
                                    if (image_file != undefined && image_file.length > 0) {
                                        var image_name = product._id + utils.generateServerToken(4);
                                        var url = utils.getStoreImageFolderPath(FOLDER_NAME.STORE_PRODUCTS) + image_name + FILE_EXTENSION.PRODUCT;

                                        product.image_url = url;
                                        utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.PRODUCT, FOLDER_NAME.STORE_PRODUCTS);

                                    }
                                    product.save().then(() => {
                                        if(request_data_body.product_copy){
                                            Item.find({store_id: request_data_body.store_id, product_id: request_data_body.product_copy}, function (error, items) {

                                                if (items.length > 0) {
                                                   
                                                    items.forEach(function (item) {

                                                        utils.copy_items(request_data_body.store_id, product._id, item, item.specifications);

                                                    });
                                                    setTimeout(function () {
                                                        response_data.json({
                                                            success: true, message: PRODUCT_MESSAGE_CODE.PRODUCT_ADD_SUCCESSFULLY,
                                                            product: product
                                                        });   
                                                    },2000);
                                                }
                                            });
                                        }else{
                                            response_data.json({
                                                success: true, message: PRODUCT_MESSAGE_CODE.PRODUCT_ADD_SUCCESSFULLY,
                                                product: product
                                            });                                            
                                        }
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


exports.get_subcategory_list = function(request_data,response_data){
    try{
        var request_data_body = request_data.body;

        var condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
        var project = {
            $project:{
            //   name: { $ifNull: [{$arrayElemAt: [ "$name", 1 ]}, { $ifNull: [{$arrayElemAt: [ "$name", 0 ]}, ""] }] },
              name:1,
              _id:1,
              unique_id:1
            }
          }
        var sort = { "$sort": {} };
        sort["$sort"]['sequence_number'] = parseInt(1);

        Product.aggregate([condition, project,sort]).then((products) => {
            var taxes = []

            var query = {
                $match: {'_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}
            }

            var country_lookup = {
                $lookup: {
                    from: "countries",
                    localField: "country_id",
                    foreignField: "_id",
                    as: "country_details"
                }
            }

            var tax_lookup = {
                $lookup: {
                    from: "taxes",
                    localField: "country_details.taxes",
                    foreignField: "_id",
                    as: "taxes_details"
                }
            }
            Store.aggregate([query, country_lookup, tax_lookup]).then(store => {
                
                if(store[0].taxes_details.length > 0){
                    taxes = store[0].taxes_details
                }
                response_data.json({
                    success: true,
                    message: PRODUCT_MESSAGE_CODE.PRODUCT_LIST_SUCCESSFULLY,
                    products: products,
                    taxes
            })
            });
        }, (error) => {
            
            response_data.json({
                success: false,
                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
            });
        })

    }catch(err){
        response_data.json({
            success:false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        })
    }
}

//get_product_list
exports.get_product_list = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
           

                        var product_array = {
                            $lookup:
                                {
                                    from: "specification_groups",
                                    localField: "_id",
                                    foreignField: "product_id",
                                    as: "specifications_details"
                                }
                        };


                        var condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
                        var sort = { "$sort": {} };
                        sort["$sort"]['sequence_number'] = parseInt(1);
                        Product.aggregate([condition, product_array, sort]).then((products) => {
                            if (products.length == 0) {
                                response_data.json({
                                    success: false,
                                    error_code: PRODUCT_ERROR_CODE.PRODUCT_DATA_NOT_FOUND
                                });
                            } else {

                                var store_condition = {$match: {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};

                                Item.aggregate([store_condition, {
                                    $project: {
                                        a: '$name',
                                        b: '$product_id'
                                    }
                                }, {$unwind: '$a', $unwind: '$b'},
                                    {
                                        $group: {
                                            _id: 'a',
                                            item_name: {$addToSet: {item_name: '$a', product_id: '$b'}}
                                        }
                                    }, sort]).then((item_array) => {
                                    if (item_array.length == 0) {
                                        response_data.json({
                                            success: true,
                                            message: PRODUCT_MESSAGE_CODE.PRODUCT_LIST_SUCCESSFULLY,
                                            products: products,
                                            item_array: []
                                        });
                                    } else {
                                        response_data.json({
                                            success: true,
                                            message: PRODUCT_MESSAGE_CODE.PRODUCT_LIST_SUCCESSFULLY,
                                            products: products,
                                            item_array: item_array[0].item_name
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


//get_product_data
exports.get_product_data = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'product_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            

                        Product.findOne({_id: request_data_body.product_id}).then((product) => {
                            if (!product) {
                                response_data.json({
                                    success: false,
                                    error_code: PRODUCT_ERROR_CODE.PRODUCT_DATA_NOT_FOUND
                                });
                            } else {

                                var store_condition = {$match: {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
                                var product_condition = {$match: {'_id': {$ne: mongoose.Types.ObjectId(request_data_body.product_id)}}};
                                var sort = { "$sort": {} };
                                sort["$sort"]['sequence_number'] = parseInt(1);
                                Product.aggregate([store_condition, product_condition, {$project: {a: '$name'}}, {$unwind: '$a'},
                                    {$group: {_id: 'a', product_name: {$addToSet: '$a'}}},sort]).then((product_array) => {

                                    if (product_array.length == 0) {
                                        response_data.json({
                                            success: true,
                                            message: PRODUCT_MESSAGE_CODE.PRODUCT_LIST_SUCCESSFULLY,
                                            product: product,
                                            product_array: []
                                        });
                                    } else {
                                        response_data.json({
                                            success: true,
                                            message: PRODUCT_MESSAGE_CODE.PRODUCT_LIST_SUCCESSFULLY,
                                            product: product,
                                            product_array: product_array[0].product_name
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


// update product
exports.update_product = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'product_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var product_id = request_data_body.product_id;
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
            if(typeof request_data_body.sequence_number == "string"){
                request_data_body.sequence_number = Number(request_data_body.sequence_number);
            }
            

                        Product.findOne({
                            _id: {$ne: request_data_body.product_id},
                            store_id: request_data_body.store_id,
                            name: request_data_body.name
                        }).then((product_detail) => {
                            if (product_detail) {
                                response_data.json({
                                    success: false,
                                    error_code: PRODUCT_ERROR_CODE.PRODUCT_ALREADY_EXIST
                                });
                            } else {

                                Product.findOneAndUpdate({_id: product_id}, request_data_body, {new: true}).then((product_data) => {

                                    if (product_data) {
                                        var image_file = request_data.files;
                                        if (image_file != undefined && image_file.length > 0) {
                                            utils.deleteImageFromFolder(product_data.image_url, FOLDER_NAME.STORE_PRODUCTS);
                                            var image_name = product_data._id + utils.generateServerToken(4);
                                            var url = utils.getStoreImageFolderPath(FOLDER_NAME.STORE_PRODUCTS) + image_name + FILE_EXTENSION.PRODUCT;
                                            utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.PRODUCT, FOLDER_NAME.STORE_PRODUCTS);
                                            product_data.image_url = url;
                                            product_data.save();
                                        }

                                        response_data.json({
                                            success: true, message: PRODUCT_MESSAGE_CODE.UPDATE_SUCCESSFULLY,
                                            product: product_data
                                        });

                                    } else {
                                        response_data.json({
                                            success: false,
                                            error_code: PRODUCT_ERROR_CODE.UPDATE_FAILED
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

// get product item detail
exports.get_product_item_detail = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'product_id', type: 'string'}, {name: 'item_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Product.findOne({
                _id: request_data_body.product_id,
                store_id: request_data_body.store_id
            }).then((product_detail) => {
                if (product_detail) {

                    Item.findOne({
                        _id: request_data_body.item_id,
                        product_id: product_detail._id,
                        store_id: product_detail.store_id
                    }).then((item_detail) => {
                        response_data.json({
                            success: true, message: PRODUCT_MESSAGE_CODE.GET_PRODUCT_ITEM_LIST,
                            product: product_detail,
                            item: item_detail
                        });
                    }, (error) => {
                        console.log(error)
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        });
                    });

                } else {
                    response_data.json({success: false, error_code: PRODUCT_ERROR_CODE.ITEM_LIST_NOT_FOUND});
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















