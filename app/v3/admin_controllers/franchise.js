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
var Franchise = require('mongoose').model('franchise'); 
var Order = require('mongoose').model('order');
var mongoose = require('mongoose');
var Product = require('mongoose').model('product');
var City = require('mongoose').model('city');
var Item = require('mongoose').model('item');
var Review = require('mongoose').model('review');
var console = require('../utils/console');

exports.franchise_list_search_sort = function (request_data, response_data) {
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

            var number_of_rec = Number(request_data_body.number_of_rec);
            var page = request_data_body.page;
            var sort_field = request_data_body.sort_field;
            var sort_franchise = request_data_body.sort_franchise;
            var search_field = request_data_body.search_field;
            var search_value = request_data_body.search_value;
            search_value = search_value.replace(/^\s+|\s+$/g, '');
            search_value = search_value.replace(/ +(?= )/g, '');
            var franchise_page_type = request_data_body.franchise_page_type;


            if (search_field === "name")
            {
                var query1 = {};
                var query2 = {};
                var query3 = {};
                var query4 = {};
                var query5 = {};
                var query6 = {};

                var full_name = search_value.split(' ');
                if (typeof full_name[0] === 'undefined' || typeof full_name[1] === 'undefined') {

                    query1[search_field] = {$regex: new RegExp(search_value, 'i')};
                    query2['city_details.city_name'] = {$regex: new RegExp(search_value, 'i')};
                    var search = {"$match": {$or: [query1, query2]}};
                } else {

                    query1[search_field] = {$regex: new RegExp(search_value, 'i')};
                    query2['city_details.city_name'] = {$regex: new RegExp(search_value, 'i')};
                    query3[search_field] = {$regex: new RegExp(full_name[0], 'i')};
                    query4['city_details.city_name'] = {$regex: new RegExp(full_name[0], 'i')};
                    query5[search_field] = {$regex: new RegExp(full_name[1], 'i')};
                    query6['city_details.city_name'] = {$regex: new RegExp(full_name[1], 'i')};
                    var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
                }
             } else if(search_field == 'unique_id'){
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
            sort["$sort"][sort_field] = parseInt(sort_franchise);
            var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;

            var condition = {$match: {}};
            if (franchise_page_type == 1) {
                condition = {$match: {'is_approved': {$eq: true}}};
            } else if (franchise_page_type == 2) {
                condition = {$match: {'is_approved': {$eq: false}}};
            }

                    if (page) {

                        Franchise.aggregate([ condition, city_query, country_query, array_to_json, array_to_json_city_query, delivery_query, array_to_json_delivery_query
                                    , sort
                                    , search, skip, limit
                        ]).then((franchises) => {
                            if (franchises.length == 0) {
                                response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND
                                });
                            } else
                            {

                                response_data.json({success: true,
                                    message: STORE_MESSAGE_CODE.STORE_LIST_SUCCESSFULLY,
                                    franchises: franchises});
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
                        Franchise.aggregate([ condition, city_query, country_query, array_to_json, array_to_json_city_query, delivery_query, array_to_json_delivery_query
                                    , sort
                                    , search
                        ]).then((franchises) => {
                            if (franchises.length == 0) {
                                response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND
                                });
                            } else
                            {

                                response_data.json({success: true,
                                    message: STORE_MESSAGE_CODE.STORE_LIST_SUCCESSFULLY,
                                    franchises: franchises});
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

//// store update
exports.update_franchise = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'franchise_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var franchise_id = request_data_body.franchise_id;
            var is_approved = request_data_body.is_approved;
            request_data_body.name = JSON.parse(request_data_body.name);
            request_data_body.name.forEach(function(data){
                if(data =="" || data =="null"){
                            data = null;
                }
            })
            Franchise.find({_id: {'$ne': franchise_id}, phone: request_data_body.phone}).then((franchise_detail) => {
                if (franchise_detail.length > 0) {
                    response_data.json({success: false, error_code: STORE_ERROR_CODE.PHONE_NUMBER_ALREADY_REGISTRED});
                } else
                {
                    Franchise.findOneAndUpdate({_id: franchise_id}, request_data_body, {new : true}).then((franchise_data) => {

                        if (franchise_data)
                        {
                            var device_type = franchise_data.device_type;
                            var device_token = franchise_data.device_token;

                            var image_file = request_data.files;
                            if (image_file != undefined && image_file.length > 0) {
                                utils.deleteImageFromFolder(franchise_data.image_url, FOLDER_NAME.STORE_PROFILES);
                                var image_name = franchise_data._id + utils.generateServerToken(4);
                                var url = utils.getStoreImageFolderPath(FOLDER_NAME.STORE_PROFILES) + image_name + FILE_EXTENSION.STORE;
                                utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.STORE, FOLDER_NAME.STORE_PROFILES);
                                franchise_data.image_url = url;
                            }
                            franchise_data.save();


                            response_data.json({
                                success: true,
                                message: STORE_MESSAGE_CODE.UPDATE_SUCCESSFULLY,
                                franchise: franchise_data

                            });

                        } else
                        {
                            response_data.json({success: false, error_code: STORE_ERROR_CODE.UPDATE_FAILED});

                        }
                    }, (error) => {
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        });
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

exports.approve_decline_franchise = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'franchise_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var franchise_id = request_data_body.franchise_id;
            var is_approved = request_data_body.is_approved;
            var franchise_page_type = request_data_body.franchise_page_type;

            if (franchise_page_type == 2)
            {
                Franchise.findOneAndUpdate({_id: franchise_id}, {is_approved: true}, {new : true}).then((franchises) => {

                    if (!franchises) {
                        response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.UPDATE_FAILED});
                    } else {
                        var phone_with_code = franchises.country_phone_code + franchises.phone;
                        var device_type = franchises.device_type;
                        var device_token = franchises.device_token;

                        // email to store approved
                        if (setting_detail.is_mail_notification)
                        {
                            emails.sendStoreApprovedEmail(request_data, franchises, franchises.name);
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
            } else if (franchise_page_type == 1 || franchise_page_type == 3)
            {

                Franchise.findOneAndUpdate({_id: franchise_id}, {is_approved: false}, {new : true}).then((franchises) => {

                    if (!franchises) {
                        response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.UPDATE_FAILED});
                    } else {
                        var phone_with_code = franchises.country_phone_code + franchises.phone;
                        var device_type = franchises.device_type;
                        var device_token = franchises.device_token;

                        // email to store declined
                        if (setting_detail.is_mail_notification)
                        {
                            emails.sendStoreDeclineEmail(request_data, franchises, franchises.name);

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
