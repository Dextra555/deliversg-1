require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
require('../utils/push_code');
var utils = require('../utils/utils');
var emails = require('../controllers/email_sms/emails');
var SMS = require('../controllers/email_sms/sms');
var Setting = require('mongoose').model('setting');
var Email = require('mongoose').model('email_detail');
var Store = require('mongoose').model('store');
var Order = require('mongoose').model('order');
var mongoose = require('mongoose');
var Product = require('mongoose').model('product');
var City = require('mongoose').model('city');
var Item = require('mongoose').model('item');
var Review = require('mongoose').model('review');
var SubCategory = require('mongoose').model('sub_category');
var console = require('../utils/console');


//To insert surcharge fee
exports.add_store_surcharge = function (request_data, response_data) 
{
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) 
        {
            var request_data_body = request_data.body;

            Store.findOne({_id: request_data_body.store_id}).then((storeId) =>
            {
                if (storeId) 
                {
                    Store.findOneAndUpdate({ _id: request_data_body.store_id }, request_data_body, { new: true }).then((store_update) => {

                        if (store_update)
                        {
                            store_update.save().then(result => {
                                response_data.json({ success: true, message: STORE_MESSAGE_CODE.UPDATE_SUCCESSFULLY });
                            })
                        }
                        else
                        {
                            response_data.json({ success: false, error_code: STORE_ERROR_CODE.UPDATE_FAILED });
                        }
                    }) 
                }
                else    
                {
                    return response_data.json({ success: false, error_code: STORE_ERROR_CODE.MISMATCH_STORE_ID });
                }
            }) 
        } 
        else 
        {
            response_data.json(response);
        }
    }, 
    (error) => {
        console.log(error);
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    });
};

//To delete surcharge fee
exports.delete_store_surcharge = function (request_data, response_data) 
{
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) 
        {
            var request_data_body = request_data.body;

            Store.findById({_id: request_data_body.store_id}).then((store_update) =>
            {
                if (store_update)
                {
                    store_update.surcharge = 0;
                    
                    store_update.save().then(result => {
                        response_data.json({ success: true, message: STORE_MESSAGE_CODE.UPDATE_SUCCESSFULLY });
                    })
                }
                else
                {
                    return response_data.json({ success: false, error_code: STORE_ERROR_CODE.MISMATCH_STORE_ID });
                }
                
            }) 
        } 
        else 
        {
            response_data.json(response);
        }
    }, 
    (error) => {
        console.log(error);
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    });
};

//To get all store's surcharge fee
exports.get_all_store_surcharge = function (request_data, response_data) 
{
    Store.find({ surcharge: { $gt: 0 } }, {_id: 1, name: 1, surcharge: 1}).then((storeData) =>
    {
        if (storeData) 
        {
            response_data.json({ success: true, message: STORE_MESSAGE_CODE.STORE_LIST_SUCCESSFULLY, storeSurcharge: storeData });         
        }
        else    
        {
            return response_data.json({ success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND });
        }
    })      
};

//To get store's surcharge fee
exports.get_store_surcharge = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'store_id', type: 'string' }], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var store_id = request_data_body.store_id;

            if (store_id == null) {
                response_data.json({ success: false, error_code: STORE_ERROR_CODE.MISMATCH_STORE_ID });
            } else {
                Store.findOne({ _id: store_id, surcharge: { $gt: 0 } }, { _id: 1, name: 1, surcharge: 1 }).then((storeData) => {
                    if (!storeData) {
                        return response_data.json({ success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND });
                    } else {
                        response_data.json({ success: true, message: STORE_MESSAGE_CODE.STORE_LIST_SUCCESSFULLY, storeSurcharge: storeData });
                    }
                }).catch((error) => {
                    console.log(error);
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                });
            }
        } else {
            response_data.json(response);
        }
    }, (error) => {
        console.log(error);
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    });
};



//To fetch sub categories based category
exports.filter_sub_categories = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'store_delivery_id', type: 'string' }], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var sub_category_query = {
                $lookup:
                        {
                            from: "deliveries",
                            localField: "store_delivery_id",
                            foreignField: "_id",
                            as: "subcategory"
                        },    
            };

            var project = {
                $project: {
                            _id: 1,
                            store_delivery_id: 1,
                            sub_category_name: 1,
                            sub_category_image: 1
                        }
            }
            
            // var condition = { "$match": { 'store_delivery_id': { $eq: Schema(store_delivery_id) } } };

            var array_to_json_sub_category_query = {$unwind: "$subcategory"};
            

            SubCategory.aggregate([{$match: {store_delivery_id: mongoose.Types.ObjectId(request_data_body.store_delivery_id)}}, sub_category_query, array_to_json_sub_category_query, project]).then((SubCategories) => {
                if (SubCategories.length == 0) {
                    response_data.json({success: false, error_code: SUB_CATEGORY_ERROR_CODE.SUB_CATEGORY_DETAILS_NOT_FOUND
                    });
                } else {
                    response_data.json({success: true,
                        message: SUB_CATEGORY_MESSAGE_CODE.GET_SUB_CATEGORY_SUCCESSFULLY,
                        SubCategories: SubCategories

                    });
                }
            }, (error) => {
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


// store_list_search_sort
exports.store_list_search_sort = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var city_query = {
                $lookup:
                        {
                            from: "cities",
                            localField: "city_id",
                            foreignField: "_id",
                            as: "city_details"
                        }
            };
            var array_to_json_city_query = {$unwind: "$city_details"};

            var country_query = {
                $lookup:
                    {
                        from: "countries",
                        localField: "country_id",
                        foreignField: "_id",
                        as: "country_details"
                    }
            };
            var array_to_json = {$unwind: "$country_details"};

            var delivery_query = {
                $lookup:
                        {
                            from: "deliveries",
                            localField: "store_delivery_id",
                            foreignField: "_id",
                            as: "delivery_details"
                        }
            };
            var array_to_json_delivery_query = {$unwind: "$delivery_details"};

            var subcategory_query = {
                $lookup:
                        {
                            from: "sub_categories",
                            localField: "sub_category_id",
                            foreignField: "_id",
                            as: "subCategoriesName"
                        }
            };
            var array_to_json_subcategory_query = {$unwind: "$subCategoriesName"};

            var number_of_rec = Number(request_data_body.number_of_rec);
            var page = request_data_body.page;
            var sort_field = request_data_body.sort_field;
            var sort_store = request_data_body.sort_store;
            var search_field = request_data_body.search_field;
            var search_value = request_data_body.search_value;
            search_value = search_value.replace(/^\s+|\s+$/g, '');
            search_value = search_value.replace(/ +(?= )/g, '');
            var store_page_type = request_data_body.store_page_type;


            if(search_field == 'unique_id'){
                var query = {};
                query[search_field] = {$eq: Number(search_value)};
                var search = {"$match": query};
            } else
            {
                var query = {};
                query[search_field] = {$regex: new RegExp(search_value, 'i')};
                var search = {"$match": query};
            }

            var sort = {"$sort": {}};
            sort["$sort"]['unique_id'] = parseInt(-1);
            var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;


            var condition1 = {$match: {}};

            if (request_data_body.store_ids) {
                var store_ids =[];
                request_data_body.store_ids.forEach(function(store_id){
                    store_ids.push(mongoose.Types.ObjectId(store_id));
                })
                var condition1 = {$match: {'_id':{$in:store_ids}}};
            }

            // var delivery_type_condition = {$match: {}};
            // if (request_data_body.delivery_type_filter && request_data_body.delivery_type_filter.length>0) {
            //     var delivery_type_filter =[];
            //     request_data_body.delivery_type_filter.forEach(function(store_id){
            //         delivery_type_filter.push(mongoose.Types.ObjectId(store_id));
            //     })
            //     delivery_type_condition = {$match: {'store_delivery_id':{$in:delivery_type_filter}}};
            // }

            var delivery_type_condition = {$match: {}};
            if (request_data_body.delivery_type_filter && request_data_body.delivery_type_filter.length>0) {
                var delivery_type_filter =[];
                request_data_body.delivery_type_filter.forEach(function(store_id){
                    delivery_type_filter.push(mongoose.Types.ObjectId(store_id));
                })
                delivery_type_condition = {$match: {'sub_category_id':{$in:delivery_type_filter}}};
            }

            var condition = {$match: {}};
            if (store_page_type == 1) {
                condition = {$match: {'is_approved': {$eq: true}, 'is_business': {$eq: true}}};
            } else if (store_page_type == 2) {
                condition = {$match: {'is_approved': {$eq: false}}};
            } else if (store_page_type == 3) {
                condition = {$match: {'is_business': {$eq: false}, 'is_approved': {$eq: true}}};
            }

            var project = {
                $project: {
                    unique_id: 1,
                    name: 1,
                    phone: 1,
                    country_phone_code: 1,
                    email: 1, 
                    image_url: 1,
                    wallet: 1,
                    address: 1,
                    website_url: 1,
                    wallet_currency_code: 1,
                    country_details: {country_name: 1},
                    city_name: '$city_details.city_name',
                    delivery_type_name: '$delivery_details.delivery_name',
                    sub_category_name: '$subCategoriesName.sub_category_name',
                    is_email_verified: 1,
                    is_phone_number_verified: 1,
                    is_table_reservation: "$table_settings_details.is_table_reservation",
                    is_table_reservation_with_order: "$table_settings_details.is_table_reservation_with_order"
                }
            }

            var table_settings_lookup = {
                $lookup: {
                    from: "table_settings",
                    localField: "_id",
                    foreignField: "store_id",
                    as: "table_settings_details"
                }
            }

            var table_settings_unwind = {
                $unwind: {
                    path: "$table_settings_details",
                    preserveNullAndEmptyArrays: true
                }
            }


            var start = (page * number_of_rec) - number_of_rec;
            var end = number_of_rec;
            var count = {$group: {_id: null, count: {$sum: 1}, result: {$push: "$$ROOT"}}};
            var project1 = {$project: {count: 1, data: { $slice: ['$result', start, end] } }}

            var filterLists = request_data_body.filterLists || [];
            var filter = {$match: {}}
            if(filterLists && filterLists.length>0){
                filter = {$match: {$or: []}}
                filterLists.forEach(function(filter_data){
                    switch(filter_data.value){
                        case 'is_wallet_negative':
                            filter['$match']['$or'].push({'wallet': {$lt: 0}});
                            break;
                        case 'is_document_expired':
                            filter['$match']['$or'].push({'is_document_expired': true});
                            break;
                        case 'is_document_uploaded':
                            filter['$match']['$or'].push({'is_document_uploaded': true});
                            break;
                        case 'is_email_verified':
                            filter['$match']['$or'].push({'is_email_verified': true});
                            break;
                        case 'is_phone_verified':
                            filter['$match']['$or'].push({'is_phone_verified': true});
                            break;
                    }
                })
            }

            if (page) {

                Store.aggregate([condition1, condition, filter, delivery_type_condition, city_query, country_query, array_to_json, array_to_json_city_query, delivery_query, array_to_json_delivery_query
                            , subcategory_query, array_to_json_subcategory_query, table_settings_lookup, table_settings_unwind, search ,  project, sort, count, project1
                ]).then((stores) => {
                    if (stores.length == 0) {
                        response_data.json({success: true, stores: [], count: 0});
                    } else
                    {

                        response_data.json({success: true,
                            message: STORE_MESSAGE_CODE.STORE_LIST_SUCCESSFULLY,
                            stores: stores[0].data,
                            count: stores[0].count
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
                Store.aggregate([condition1, condition, filter, delivery_type_condition, city_query, country_query, array_to_json, array_to_json_city_query, delivery_query, array_to_json_delivery_query
                    , subcategory_query, array_to_json_subcategory_query, table_settings_lookup, table_settings_unwind, search , project, sort]).then((stores) => {
                        if (stores.length == 0) {
                            response_data.json({success: true, stores: [], count: 0});
                        } else
                        {
    
                            response_data.json({success: true,
                                message: STORE_MESSAGE_CODE.STORE_LIST_SUCCESSFULLY,
                                stores: stores
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
                
        } else {
            response_data.json(response);
        }
    });
};


exports.get_store_data = function (request_data, response_data) {
  
    utils.check_request_params(request_data.body, [{name: 'store_id', type: 'string'}], function (response) {
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

            var array_to_json = {$unwind: "$country_details"};

            var city_query = {
                $lookup:
                        {
                            from: "cities",
                            localField: "city_id",
                            foreignField: "_id",
                            as: "city_details"
                        }
            };

            var array_to_json1 = {$unwind: "$city_details"};

            var delivery_query = {
                $lookup:
                        {
                            from: "deliveries",
                            localField: "store_delivery_id",
                            foreignField: "_id",
                            as: "delivery_details"
                        }
            };

            var referred_query = {
                $lookup:
                        {
                            from: "stores",
                            localField: "referred_by",
                            foreignField: "_id",
                            as: "referred_store_details"
                        }
            };

            var tax_lookup = {
                $lookup: {
                    from: "taxes",
                    localField: "taxes",
                    foreignField: "_id",
                    as: "store_taxes"
                }
            }
            var table_settings_lookup = {
                $lookup: {
                    from: "table_settings",
                    localField: "_id",
                    foreignField: "store_id",
                    as: "table_settings_details"
                }
            }

            var table_settings_unwind = {
                $unwind: {
                    path: "$table_settings_details",
                    preserveNullAndEmptyArrays: true
                }
            }

            var array_to_json2 = {$unwind: "$delivery_details"};

            var condition = {"$match": {'_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};


            Store.aggregate([condition, country_query, city_query, delivery_query, referred_query, array_to_json, array_to_json1, array_to_json2, tax_lookup, table_settings_lookup, table_settings_unwind]).then((store_detail) => {

                if (store_detail.length != 0) {

                    var store_condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
                    var group = {
                        $group: {
                            _id: null,
                            total_orders: {$sum: 1},
                            accepted_orders: {$sum: {$cond: [{$and: [{$gte: ["$order_status", ORDER_STATE.STORE_ACCEPTED]}, {$gte: ["$order_status", ORDER_STATE.STORE_ACCEPTED]}]}, 1, 0]}},
                            completed_orders: {$sum: {$cond: [{$eq: ["$order_status_id", ORDER_STATUS_ID.COMPLETED]}, 1, 0]}},
                            cancelled_orders: {$sum: {$cond: [{$eq: ["$order_status_id", ORDER_STATUS_ID.CANCELLED]}, 1, 0]}}
                        }
                    }
                    Order.aggregate([store_condition, group]).then((order_detail) => {

                        if (order_detail.length == 0) {
                            response_data.json({success: true,
                                message: STORE_MESSAGE_CODE.STORE_DATA_SUCCESSFULLY,
                                store_detail: store_detail[0],
                                order_detail: {
                                    total_orders: 0,
                                    accepted_orders: 0,
                                    completed_orders: 0,
                                    cancelled_orders: 0,
                                    completed_order_percentage: 0
                                }
                            });
                        } else {

                            var completed_order_percentage = order_detail[0].completed_orders * 100 / order_detail[0].total_orders;
                            order_detail[0].completed_order_percentage = completed_order_percentage;
                          
                            response_data.json({success: true,
                                message: STORE_MESSAGE_CODE.STORE_DATA_SUCCESSFULLY,
                                store_detail: store_detail[0],
                                order_detail: order_detail[0]
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
                    response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND});
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

exports.get_admin_store_detail = function (request_data, response_data) {
    
    var request_data_body = request_data.body;
    utils.check_request_params(request_data.body, [{name: 'store_id', type: 'string'}], function (response) {
        if (response.success) {

            var condition = {"$match": {'_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};

            var project = {
                $project: {
                    name: 1,
                    phone: 1,
                    country_phone_code: 1,
                    email: 1,
                    image_url: 1,
                    password: 1,
                    is_use_wallet: 1,
                    wallet: 1,
                    wallet_currency_code: 1,
                    created_at: 1,
                    app_version: 1,
                    device_type: 1,
                    comment: 1,
                    user_rate: 1,
                    referral_code: 1,
                    is_approved: 1,
                    provider_rate: 1,
                    is_phone_verified: "$is_phone_number_verified",
                    is_email_verified: 1,
                    website_url: 1,
                    location: 1,
                    address: 1,
                    is_store_can_complete_order: 1,
                    is_store_can_add_provider: 1,
                    slogan: 1,
                    admin_profit_mode_on_store: 1,
                    admin_profit_value_on_store: 1
                }
            }

            Store.aggregate([condition, project]).then((store) => {
                if (store.length == 0) {
                    response_data.json({success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND});

                } else
                {
                    response_data.json({success: true,
                        store: store[0]
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

exports.update_store = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'store_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store_id = request_data_body.store_id;
            var is_approved = request_data_body.is_approved;
            request_data_body.name = JSON.parse(request_data_body.name);
            request_data_body.location = JSON.parse(request_data_body.location)
            request_data_body.name.forEach(function(data){
                if(data =="" || data =="null"){
                            data = null;
                }
            })
            if (request_data_body.password != "") {
                var new_password = utils.encryptPassword(request_data_body.password);
                request_data_body.password = new_password;
            } else {
                delete request_data_body.password
            }
            Store.find({_id: {'$ne': store_id}, phone: request_data_body.phone}).then((store_detail) => {
                
                if (store_detail.length > 0) {
                    response_data.json({ success: false, error_code: STORE_ERROR_CODE.PHONE_NUMBER_ALREADY_REGISTRED });
                } else {
                    Store.find({ _id: { '$ne': store_id },  email: request_data_body.email }).then(store_detail => {
                        if (store_detail.length > 0) {
                            response_data.json({ success: false, error_code: STORE_ERROR_CODE.EMAIL_ALREADY_REGISTRED });
                        } else {


                            Store.findOneAndUpdate({ _id: store_id }, request_data_body, { new: true }).then((store_data) => {

                                if (store_data) {
                                    var device_type = store_data.device_type;
                                    var device_token = store_data.device_token;

                                    var image_file = request_data.files;
                                    if (image_file != undefined && image_file.length > 0) {
                                        utils.deleteImageFromFolder(store_data.image_url, FOLDER_NAME.STORE_PROFILES);
                                        var image_name = store_data._id + utils.generateServerToken(4);
                                        var url = utils.getStoreImageFolderPath(FOLDER_NAME.STORE_PROFILES) + image_name + FILE_EXTENSION.STORE;
                                        utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.STORE, FOLDER_NAME.STORE_PROFILES);
                                        store_data.image_url = url;
                                    }
                                    store_data.save();


                                    response_data.json({
                                        success: true,
                                        message: STORE_MESSAGE_CODE.UPDATE_SUCCESSFULLY,
                                        store: store_data

                                    });

                                } else {
                                    response_data.json({ success: false, error_code: STORE_ERROR_CODE.UPDATE_FAILED });

                                }

                            }, (error) => {
                                console.log(error)
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });
                        }
                    })
                }
            }, (error) => {
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


//approve_decline_store
exports.approve_decline_store = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'store_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store_id = request_data_body.store_id;
            var is_approved = request_data_body.is_approved;
            var store_page_type = request_data_body.store_page_type;

            if (store_page_type == 2)
            {
                Store.findOneAndUpdate({_id: store_id}, {is_approved: true}, {new : true}).then((stores) => {

                    if (!stores) {
                        response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.UPDATE_FAILED});
                    } else {
                        var phone_with_code = stores.country_phone_code + stores.phone;
                        var device_type = stores.device_type;
                        var device_token = stores.device_token;

                        // email to store approved
                        if (setting_detail.is_mail_notification)
                        {
                            emails.sendStoreApprovedEmail(request_data, stores, stores.name);
                        }

                        // sms to store approved
                        if (setting_detail.is_sms_notification)
                        {
                            SMS.sendOtherSMS(phone_with_code, SMS_UNIQUE_ID.STORE_APPROVED, "");
                        }

                        // push to store approved
                        if (setting_detail.is_push_notification)
                        {
                            utils.sendPushNotification(ADMIN_DATA_ID.STORE, device_type, device_token, STORE_PUSH_CODE.APPROVED, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                        }


                        response_data.json({
                            success: true,
                            message: STORE_MESSAGE_CODE.APPROVED_SUCCESSFULLY
                        });
                    }
                }, (error) => {
                    console.log(error);
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                });
            } else if (store_page_type == 1 || store_page_type == 3)
            {

                Store.findOneAndUpdate({_id: store_id}, {is_approved: false}, {new : true}).then((stores) => {

                    if (!stores) {
                        response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.UPDATE_FAILED});
                    } else {
                        var phone_with_code = stores.country_phone_code + stores.phone;
                        var device_type = stores.device_type;
                        var device_token = stores.device_token;

                        // email to store declined
                        if (setting_detail.is_mail_notification)
                        {
                            emails.sendStoreDeclineEmail(request_data, stores, stores.name);

                        }
                        // sms to store declined
                        if (setting_detail.is_sms_notification)
                        {
                            SMS.sendOtherSMS(phone_with_code, SMS_UNIQUE_ID.STORE_DECLINE, "");
                        }

                        // push to store approved
                        if (setting_detail.is_push_notification)
                        {
                            utils.sendPushNotification(ADMIN_DATA_ID.STORE, device_type, device_token, STORE_PUSH_CODE.DECLINED, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                        }


                        response_data.json({
                            success: true,
                            message: STORE_MESSAGE_CODE.DECLINED_SUCCESSFULLY
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
        } else {
            response_data.json(response);
        }
    });

};

//get_store_list_for_city
exports.get_store_list_for_city = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'city_id', type: 'string'}], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var city_id = request_data_body.city_id;
            if (city_id == "000000000000000000000000")
            {
            Store.find({is_business: true}).then((store) => {

                    if (store.length == 0) {
                        response_data.json({success: false, error_code: DELIVERY_ERROR_CODE.DELIVERY_DATA_NOT_FOUND});
                    } else {
                        response_data.json({success: true,
                            message: DELIVERY_MESSAGE_CODE.DELIVERY_LIST_SUCCESSFULLY,
                            stores: store
                        });
                    }
                });
            } else
            {
                Store.find({is_business: true, city_id: city_id}).then((store) => {
                    if (store.length == 0) {
                        response_data.json({success: false, error_code: DELIVERY_ERROR_CODE.DELIVERY_DATA_NOT_FOUND});
                    } else {
                        response_data.json({success: true,message: DELIVERY_MESSAGE_CODE.DELIVERY_LIST_SUCCESSFULLY,stores: store});
                    }
                });
            }
        } else {
            response_data.json(response);
        }
    });
};


//get_store_list_for_country
exports.get_store_list_for_country = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'country_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var country_id = request_data_body.country_id;
            Store.find({is_business: true, country_id: country_id}).then((store) => {

                if (store.length == 0) {
                    response_data.json({success: false, error_code: DELIVERY_ERROR_CODE.DELIVERY_DATA_NOT_FOUND});
                } else {
                    response_data.json({success: true,
                        message: DELIVERY_MESSAGE_CODE.DELIVERY_LIST_SUCCESSFULLY,
                        stores_all: store
                    });
                }
            });
        } else {
            response_data.json(response);
        }
    });
};

exports.get_store_list = function (request_data, response_data) {
    var request_data_body = request_data.body;
    Store.find({}).then((store) => {
        if (store.length == 0) {
            response_data.json({success: false, error_code: DELIVERY_ERROR_CODE.DELIVERY_DATA_NOT_FOUND});
        } else {
            response_data.json({success: true,
                message: DELIVERY_MESSAGE_CODE.DELIVERY_LIST_SUCCESSFULLY,
                stores: store
            });
        }
    });
};

exports.get_store_list_by_delivery = function (request_data, response_data) {
    var request_data_body = request_data.body;
    Store.find({store_delivery_id: request_data_body.delivery_id}).then((store) => {
        if (store.length == 0) {
            response_data.json({success: false, error_code: DELIVERY_ERROR_CODE.DELIVERY_DATA_NOT_FOUND});
        } else {
            response_data.json({success: true,
                message: DELIVERY_MESSAGE_CODE.DELIVERY_LIST_SUCCESSFULLY,
                stores: store
            });
        }
    });
};

//product_for_city_store
exports.product_for_city_store = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'city_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            
            var city_condition = {"$match": {'_id': {$eq: mongoose.Types.ObjectId(request_data_body.city_id)}}};

            var store_query = {
                $lookup:
                        {
                            from: "stores",
                            localField: "_id",
                            foreignField: "city_id",
                            as: "store_detail"
                        }
            };
            var array_to_json1 = {$unwind: "$store_detail"};

            var product_query = {
                $lookup:
                        {
                            from: "products",
                            localField: "store_detail._id",
                            foreignField: "store_id",
                            as: "product_detail"
                        }
            };

            City.aggregate([city_condition, store_query, array_to_json1, product_query
            ]).then((city) => {

                if (city.length == 0) {
                    response_data.json({success: false, error_code: PROMO_CODE_ERROR_CODE.PROMO_CODE_DATA_NOT_FOUND});
                } else
                {

                    response_data.json({success: true,
                        message: PROMO_CODE_MESSAGE_CODE.PROMO_CODE_LIST_SUCCESSFULLY,
                        city: city});
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

//item_for_city_store
exports.item_for_city_store = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'city_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            
            var city_condition = {"$match": {'_id': {$eq: mongoose.Types.ObjectId(request_data_body.city_id)}}};
            var store_query = {
                $lookup:
                        {
                            from: "stores",
                            localField: "_id",
                            foreignField: "city_id",
                            as: "store_detail"
                        }
            };
            var array_to_json1 = {$unwind: "$store_detail"};
            var item_query = {
                $lookup:
                        {
                            from: "items",
                            localField: "store_detail._id",
                            foreignField: "store_id",
                            as: "item_detail"
                        }
            };

            City.aggregate([city_condition, store_query, array_to_json1, item_query
            ]).then((city) => {

                if (city.length == 0) {
                    response_data.json({success: false, error_code: PROMO_CODE_ERROR_CODE.PROMO_CODE_DATA_NOT_FOUND});
                } else
                {

                    response_data.json({success: true,
                        message: PROMO_CODE_MESSAGE_CODE.PROMO_CODE_LIST_SUCCESSFULLY,
                        city: city});
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

//export_excel_store
exports.export_excel_store = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Store.find({}).then((stores) => {

                    var json2csv = require('json2csv');
                    var fs = require('fs');
                    var fields = ['unique_id', 'name', 'device_type', 'referral_code',
                        'email', 'country_phone_code',
                        'phone', 'app_version', 'wallet', 'wallet_currency_code', 'address',
                        'is_approved',
                        'is_email_verified', 'is_phone_number_verified', 'is_document_uploaded',
                        'location'
                    ];

                    var fieldNames = ['Unique ID', 'Name', 'Device Type', 'Referral Code',
                        'Email', 'Country Phone Code',
                        'Phone', 'App Version', 'Wallet', 'Wallet Currency Code', 'Address',
                        'Approved',
                        'Email Verify', 'Phone Number Verify', 'Document Uploaded',
                        'Location'
                    ];


                    var csv = json2csv({data: stores, fields: fields, fieldNames: fieldNames});
                    var path = './uploads/csv/file.csv';
                    fs.writeFile(path, csv, function (error, data) {
                        if (error) {
                            throw error;
                        } else {
                            var new_path = './csv/file.csv';

                            response_data.json({success: true,
                                message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
                                path: new_path});

                        }
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

exports.get_store_review_history = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'store_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var condition = {$match: {'store_id': mongoose.Types.ObjectId(request_data_body.store_id)}}

            var user_query = {
                $lookup:
                    {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_detail"
                    }
            };
            var array_to_json1 = { $unwind: {
                    path: "$user_detail",
                    preserveNullAndEmptyArrays: true
                }
            }; 

            var provider_query = {
                $lookup:
                    {
                        from: "providers",
                        localField: "provider_id",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
            };
            var array_to_json2 = { $unwind: {
                    path: "$provider_detail",
                    preserveNullAndEmptyArrays: true
                }
            };

            var project = {
                $project: {
                    provider_first_name: '$provider_detail.first_name',
                    provider_last_name: '$provider_detail.last_name',
                    provider_phone: '$provider_detail.phone',
                    provider_country_phone_code: '$provider_detail.country_phone_code',
                    provider_email: '$provider_detail.email',
                    provider_image_url: '$provider_detail.image_url',
                    provider_review_to_store: 1,
                    provider_rating_to_store: 1,
                    user_first_name: '$user_detail.first_name',
                    user_last_name: '$user_detail.last_name',
                    user_phone: '$user_detail.phone',
                    user_country_phone_code: '$user_detail.country_phone_code',
                    user_email: '$user_detail.email',
                    user_image_url: '$user_detail.image_url',
                    user_review_to_store: 1,
                    user_rating_to_store: 1,
                    created_at: 1
                }
            }

            Review.aggregate([condition, user_query, array_to_json1, provider_query, array_to_json2, project]).then((review_list) => {
                response_data.json({success: true, review_list: review_list})
            }, (error) => {
                console.log(error);
                response_data.json({
                    success: false,
                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                });
            })
        } else {
            response_data.json(response);
        }
    });
};