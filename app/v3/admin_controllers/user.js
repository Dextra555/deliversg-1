require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
require('../utils/push_code');
var utils = require('../utils/utils');
var emails = require('../controllers/email_sms/emails');
var wallet_history = require('../controllers/user/wallet');
var SMS = require('../controllers/email_sms/sms');
var User = require('mongoose').model('user');
var Country = require('mongoose').model('country');
var mongoose = require('mongoose');
var Provider = require('mongoose').model('provider');
var User = require('mongoose').model('user');
var Referral_code = require('mongoose').model('referral_code');
var Store = require('mongoose').model('store');
var Review = require('mongoose').model('review');require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
require('../utils/push_code');
var utils = require('../utils/utils');
var emails = require('../controllers/email_sms/emails');
var wallet_history = require('../controllers/user/wallet');
var SMS = require('../controllers/email_sms/sms');
var User = require('mongoose').model('user');
var Country = require('mongoose').model('country');
var mongoose = require('mongoose');
var Provider = require('mongoose').model('provider');
var User = require('mongoose').model('user');
var Store = require('mongoose').model('store');
var Review = require('mongoose').model('review');
var console = require('../utils/console');

// for view all user_list

// user_list_search_sort
exports.user_list_search_sort = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var number_of_rec = Number(request_data_body.number_of_rec);
            var page = request_data_body.page;
            var search_field = request_data_body.search_field;
            var search_value = request_data_body.search_value;
            search_value = search_value.replace(/^\s+|\s+$/g, '');
            search_value = search_value.replace(/ +(?= )/g, '');
            var user_page_type = request_data_body.user_page_type;
            if (search_field === "first_name")
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
                    query2['last_name'] = {$regex: new RegExp(search_value, 'i')};

                    var search = {"$match": {$or: [query1, query2]}};

                } else {

                    query1[search_field] = {$regex: new RegExp(search_value, 'i')};
                    query2['last_name'] = {$regex: new RegExp(search_value, 'i')};
                    query3[search_field] = {$regex: new RegExp(full_name[0], 'i')};
                    query4['last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                    query5[search_field] = {$regex: new RegExp(full_name[1], 'i')};
                    query6['last_name'] = {$regex: new RegExp(full_name[1], 'i')};

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
            sort["$sort"]["unique_id"] = parseInt(-1);
            var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;

            var condition = {$match: {}};
            if (user_page_type == 1) {
                condition = {$match: {'is_approved': {$eq: true}}};
            } else if (user_page_type == 2) {
                condition = {$match: {'is_approved': {$eq: false}}};
            }

            var country_query = {
                $lookup:
                    {
                        from: "countries",
                        localField: "country_id",
                        foreignField: "_id",
                        as: "country_details"
                    }
            };
            var array_to_json = {$unwind: {
                    path: "$country_details",
                    preserveNullAndEmptyArrays: true
                }
            };

            var user_email_phone_validation = {
                $match: {
                    $or: [{"email": {$ne: ""}}, {"phone": {$ne: ""}}]
                }
            }

            var project = {
                $project: {
                    unique_id: 1,
                    first_name: 1,
                    last_name: 1,
                    phone: 1,
                    country_phone_code: 1,
                    email: 1, 
                    image_url: 1,
                    wallet: 1,
                    wallet_currency_code: 1,
                    country_details: {country_name: 1},
                    address: 1,
                    is_email_verified: 1,
                    is_phone_number_verified: 1
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
                User.aggregate([user_email_phone_validation, condition, filter, country_query, array_to_json, search, project, sort, count, project1
                ]).then((users) => {
                    if (users.length == 0) {
                        response_data.json({success: true, users: [], count: 0
                        });
                    } else
                    {
                        response_data.json({success: true,
                            message: USER_MESSAGE_CODE.USER_LIST_SUCCESSFULLY,
                            users: users[0].data,
                            count: users[0].count
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
                User.aggregate([condition, filter, country_query, array_to_json, search, project, sort
                ]).then((users) => {
                    if (users.length == 0) {
                        response_data.json({success: true, users: [], count: 0
                        });
                    } else
                    {
                        response_data.json({success: true,
                            message: USER_MESSAGE_CODE.USER_LIST_SUCCESSFULLY,
                            users: users,
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

//get_user_detail
exports.get_user_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;

            var condition = {"$match": {'_id': {$eq: mongoose.Types.ObjectId(request_data_body.user_id)}}};

            var country_lookup = {
                $lookup: {
                    from: 'countries',
                    localField: 'country_id',
                    foreignField: '_id',
                    as: 'country_details'
                }
            }
            var country_lookup_unwind = {
                $unwind: {
                    path: "$country_details",
                    preserveNullAndEmptyArrays: true
                }
            };

            var project = {
                $project: {
                    first_name: 1,
                    last_name: 1,
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
                    store_rate: 1,
                    referral_code: 1,
                    provider_rate: 1,
                    is_phone_verified: "$is_phone_number_verified",
                    minimum_phone_number_length: "$country_details.minimum_phone_number_length",
                    maximum_phone_number_length: "$country_details.maximum_phone_number_length",
                    is_phone_number_verified:1,
                    is_email_verified: 1,
                    is_approved: 1
                }
            }

            User.aggregate([condition, country_lookup, country_lookup_unwind, project]).then((user) => {
                if (user.length == 0) {
                    response_data.json({success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND});

                } else
                {
                    response_data.json({success: true,
                        message: USER_MESSAGE_CODE.USER_DETAIL_SUCCESSFULLY,
                        user: user[0]
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

/// update_user
exports.update_user = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var user_id = request_data_body.user_id;

            User.find({_id: {'$ne': user_id}, phone: request_data_body.phone}).then((user_detail) => {

                if (user_detail.length > 0)
                {
                    response_data.json({success: false, error_code: USER_ERROR_CODE.PHONE_NUMBER_ALREADY_REGISTRED});
                } else
                {
                
                    if (request_data_body.password !== "") {
                        var new_password = utils.encryptPassword(request_data_body.password);
                        request_data_body.password = new_password;
                    } else {
                        delete request_data_body.password
                    }
                    User.findOneAndUpdate({_id: user_id}, request_data_body, {new : true}).then((user_data) => {

                        if (user_data)
                        {
                            var image_file = request_data.files;
                            if (image_file != undefined && image_file.length > 0) {
                                utils.deleteImageFromFolder(user_data.image_url, FOLDER_NAME.USER_PROFILES);
                                var image_name = user_data._id + utils.generateServerToken(4);
                                var url = utils.getStoreImageFolderPath(FOLDER_NAME.USER_PROFILES) + image_name + FILE_EXTENSION.USER;
                                utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.USER, FOLDER_NAME.USER_PROFILES);
                                user_data.image_url = url;
                                
                            }

                            var first_name = (request_data_body.first_name).trim();
                            first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);

                            var last_name = (request_data_body.last_name).trim();
                            last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);

                            user_data.first_name = first_name;
                            user_data.last_name = last_name;
                            user_data.save();


                            response_data.json({
                                success: true,
                                message: USER_MESSAGE_CODE.UPDATE_SUCCESSFULLY,
                                user: user_data

                            });

                        } else
                        {
                            response_data.json({success: false, error_code: USER_ERROR_CODE.UPDATE_FAILED});

                        }
                    });
                }
            });
        } else {
            response_data.json(response);
        }
    });
};

//approve_decline_user
exports.approve_decline_user = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var user_id = request_data_body.user_id;
            var is_approved = request_data_body.is_approved;
            var user_page_type = request_data_body.user_page_type;
            
            if (user_page_type == 2)
            {

                User.findOneAndUpdate({_id: user_id}, {is_approved: true}, {new : true}).then((users) => {
                    if (!users) {
                        response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.UPDATE_FAILED});
                    } else {

                        var phone_with_code = users.country_phone_code + users.phone;
                        var device_type = users.device_type;
                        var device_token = users.device_token;
                        // email to user approved
                        if (setting_detail.is_mail_notification) {
                            emails.sendUserApprovedEmail(request_data, users, users.first_name + " " + users.last_name);

                        }
                        // sms to user approved
                        if (setting_detail.is_sms_notification)
                        {
                            SMS.sendOtherSMS(phone_with_code, SMS_UNIQUE_ID.USER_APPROVED, "");
                        }
                        // push to user approved
                        if (setting_detail.is_push_notification) {
                            utils.sendPushNotification(ADMIN_DATA_ID.USER, device_type, device_token, USER_PUSH_CODE.APPROVED, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                        }

                        response_data.json({
                            success: true,
                            message: USER_MESSAGE_CODE.APPROVED_SUCCESSFULLY
                        });
                    }
                }, (error) => {
                    console.log(error);
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                });


            } else if (user_page_type == 1)
            {

                User.findOneAndUpdate({_id: user_id}, {is_approved: false}, {new : true}).then((users) => {

                    if (!users) {

                        response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.UPDATE_FAILED});
                    } else {

                        var phone_with_code = users.country_phone_code + users.phone;
                        var device_type = users.device_type;
                        var device_token = users.device_token;
                        // email to user decline
                        if (setting_detail.is_mail_notification) {
                            emails.sendUserDeclineEmail(request_data, users, users.first_name + " " + users.last_name);

                        }
                        // sms to user decline
                        if (setting_detail.is_sms_notification)
                        {
                            SMS.sendOtherSMS(phone_with_code, SMS_UNIQUE_ID.USER_DECLINE, "");
                        }
                        // push to user decline
                        if (setting_detail.is_push_notification) {
                            utils.sendPushNotification(ADMIN_DATA_ID.USER, device_type, device_token, USER_PUSH_CODE.DECLINED, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                        }

                        response_data.json({
                            success: true,
                            message: USER_MESSAGE_CODE.DECLINED_SUCCESSFULLY
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


// admin add user wallet
exports.add_wallet = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'type'}, {name: 'wallet'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var type = Number(request_data_body.type);
            var Table;
            switch (type) {
                case ADMIN_DATA_ID.USER:
                    Table = User;
                    var id = request_data_body.user_id;
                    break;
                case ADMIN_DATA_ID.PROVIDER:
                    Table = Provider;
                    var id = request_data_body.provider_id;
                    break;
                case ADMIN_DATA_ID.STORE:
                    Table = Store;
                    var id = request_data_body.store_id;
                    break;
                default:
                    break;
            }
            Table.findOne({_id: id}).then((detail) => {
                if (detail)
                {
                    var query = { $or: [{ '_id': detail.country_id }, { 'country_code': detail.country_code }] };
                    Country.findOne(query).then((country) => {

                        if (setting_detail) {
                            if(country){
                                var wallet_currency_code = country.currency_code;
                            }else{
                                var wallet_currency_code = detail.wallet_currency_code;
                            }

                            var wallet = utils.precisionRoundTwo(Number(request_data_body.wallet));
                            var total_wallet_amount = 0;
                            if(wallet > 0) {
                                total_wallet_amount = wallet_history.add_wallet_history(type, detail.unique_id, detail._id, detail.country_id, wallet_currency_code, wallet_currency_code,
                                    1, wallet, detail.wallet, WALLET_STATUS_ID.ADD_WALLET_AMOUNT, WALLET_COMMENT_ID.SET_BY_ADMIN, "By Admin");
                            } else {
                                total_wallet_amount = wallet_history.add_wallet_history(type, detail.unique_id, detail._id, detail.country_id, wallet_currency_code, wallet_currency_code,
                                    1, Math.abs(wallet), detail.wallet, WALLET_STATUS_ID.REMOVE_WALLET_AMOUNT, WALLET_COMMENT_ID.SET_BY_ADMIN, "By Admin");
                            }
                            detail.wallet = total_wallet_amount;
                            detail.save().then(() => {
                                    response_data.json({
                                        success: true,
                                        message: USER_MESSAGE_CODE.WALLET_AMOUNT_ADD_SUCCESSFULLY

                                    });
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



// admin send sms
exports.send_sms = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'type'}, {name: 'content', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var type = Number(request_data_body.type);

            switch (type) {
                case ADMIN_DATA_ID.USER:
                    Table = User;
                    var id = request_data_body.user_id;
                    break;
                case ADMIN_DATA_ID.PROVIDER:
                    Table = Provider;
                    var id = request_data_body.provider_id;
                    break;
                case ADMIN_DATA_ID.STORE:
                    Table = Store;
                    var id = request_data_body.store_id;
                    break;
                default:
                    break;
            }
            Table.findOne({_id: id}).then((detail) => {
                if (detail)
                {
                    var phone_with_code = detail.country_phone_code + detail.phone;


                    var sms_content = request_data_body.content;
                    utils.sendSMS(phone_with_code, sms_content);


                    response_data.json({
                        success: true,
                        message: USER_MESSAGE_CODE.SEND_SMS_SUCCESSFULLY

                    });

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

// admin send notification
exports.send_notification = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var type = Number(request_data_body.type);

            switch (type) {
                case ADMIN_DATA_ID.USER:
                    Table = User;
                    var id = request_data_body.user_id;
                    break;
                case ADMIN_DATA_ID.PROVIDER:
                    Table = Provider;
                    var id = request_data_body.provider_id;
                    break;
                case ADMIN_DATA_ID.STORE:
                    Table = Store;
                    var id = request_data_body.store_id;
                    break;
                default:
                    break;
            }
            Table.findOne({_id: id}).then((detail) => {
                if (detail)
                {
                    var device_type = detail.device_type;
                    var device_token = detail.device_token;

                    var notification_content = request_data_body.content;
                    utils.sendPushNotification(type, device_type, device_token, notification_content, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);


                    response_data.json({
                        success: true,
                        message: USER_MESSAGE_CODE.SEND_NOTIFICATION_SUCCESSFULLY

                    });
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


//export_excel_user
exports.export_excel_user = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            User.find({}).then((users) => {

                    var json2csv = require('json2csv');
                    var fs = require('fs');
                    var fields = ['unique_id', 'first_name', 'last_name', 'device_type', 'referral_code',
                        'email', 'country_phone_code',
                        'phone', 'app_version', 'wallet', 'wallet_currency_code', 'address',
                        'is_approved',
                        'is_email_verified', 'is_phone_number_verified', 'is_document_uploaded',
                        'location'
                    ];
                    var fieldNames = ['Unique ID', 'First Name', 'Last Name', 'Device Type', 'Referral Code',
                        'Email', 'Country Phone Code',
                        'Phone', 'App Version', 'Wallet', 'Wallet Currency Code', 'Address',
                        'Approved',
                        'Email Verify', 'Phone Number Verify', 'Document Uploaded',
                        'Location'
                    ];


                    var csv = json2csv({data: users, fields: fields, fieldNames: fieldNames});
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

exports.get_user_referral_history = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'type'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var type = Number(request_data_body.type);
            
            var condition = {$match: {'user_id': mongoose.Types.ObjectId(request_data_body.id)}}
            var project = {
                $project: {
                    first_name: '$user_detail.first_name',
                    last_name: '$user_detail.last_name',
                    phone: '$user_detail.phone',
                    country_phone_code: '$user_detail.country_phone_code',
                    email: '$user_detail.email',
                    referral_bonus_to_user_friend: 1,
                    currency_sign: 1,
                    created_at: 1
                }
            }
            
            var lookup;
            switch (type) {
                case ADMIN_DATA_ID.USER:
                    lookup = {
                        $lookup:
                        {
                            from: "users",
                            localField: "referred_id",
                            foreignField: "_id",
                            as: "user_detail"
                        }
                    };
                    break;
                case ADMIN_DATA_ID.PROVIDER:
                    lookup = {
                        $lookup:
                        {
                            from: "providers",
                            localField: "referred_id",
                            foreignField: "_id",
                            as: "user_detail"
                        }
                    };
                    break;
                case ADMIN_DATA_ID.STORE:
                    lookup = {
                        $lookup:
                        {
                            from: "stores",
                            localField: "referred_id",
                            foreignField: "_id",
                            as: "user_detail"
                        }
                    };
                    break;
                    
                default:
                    break;
            }
            var unwind = { $unwind: "$user_detail"};

            Referral_code.aggregate([condition, lookup, unwind, project]).then((referral_history) => {
                
                    response_data.json({success: true, referral_history: referral_history})
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

exports.get_user_review_history = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'user_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var condition1 = {$match: {'user_id': mongoose.Types.ObjectId(request_data_body.user_id)}}
            var condition2 = {$match: {'type': Number(request_data_body.type)}}

            var provider_query = {
                $lookup:
                    {
                        from: "providers",
                        localField: "provider_id",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
            };
            var array_to_json2 = { $unwind: "$provider_detail" };

            var store_query = {
                $lookup:
                    {
                        from: "stores",
                        localField: "store_id",
                        foreignField: "_id",
                        as: "store_detail"
                    }
            };
            var array_to_json3 = { $unwind: "$store_detail" };

            var project = {
                $project: {
                    provider:{
                        first_name: '$provider_detail.first_name',
                        last_name: '$provider_detail.last_name',
                        phone: '$provider_detail.phone',
                        country_phone_code: '$provider_detail.country_phone_code',
                        email: '$provider_detail.email',
                        provider_review_to_user: "$provider_rating_to_user",
                        provider_rating_to_user: "$provider_rating_to_user",
                        created_at: 1,
                        image_url: "$provider_detail.image_url"
                    },
                    store:{
                        name: '$store_detail.name',
                        phone: '$store_detail.phone',
                        country_phone_code: '$store_detail.country_phone_code',
                        email: '$store_detail.email',
                        store_review_to_user: "$store_review_to_user",
                        store_rating_to_user: "$store_rating_to_user",
                        created_at: 1,
                        image_url: "$store_detail.image_url"
                    }
                }
            }

            Review.aggregate([condition1, provider_query, array_to_json2,store_query,array_to_json3, project]).then((review_list) => {
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

exports.get_user_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var search_value = request_data_body.search_string;
            search_value = search_value.replace(/^\s+|\s+$/g, '');
            search_value = search_value.replace(/ +(?= )/g, '');

            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};
            var query5 = {};
            var query6 = {};
            var query7 = {};


            var full_name = search_value.split(' ');
            
            query1['first_name'] = {$regex: new RegExp(search_value, 'i')};
            query2['last_name'] = {$regex: new RegExp(search_value, 'i')};

            if (typeof full_name[0] != 'undefined' && typeof full_name[1] != 'undefined') {
                query3['first_name'] = {$regex: new RegExp(full_name[0], 'i')};
                query4['last_name'] = {$regex: new RegExp(full_name[1], 'i')};
            }else{
                query3['first_name'] = {$regex: new RegExp(search_value, 'i')};
                query4['last_name'] = {$regex: new RegExp(search_value, 'i')};
            }

            query5['email'] = {$eq: search_value};
            query6['phone'] = {$eq: search_value};
            query7['unique_id'] =  {$eq: Number(search_value)};

            var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6, query7]}};

            var project = {
                $project: {
                    unique_id: 1,
                    first_name: 1,
                    last_name: 1,
                    phone: 1,
                    country_phone_code: 1,
                    email: 1, 
                    image_url: 1,
                    wallet: 1,
                    wallet_currency_code: 1,
                    country_details: {country_name: 1},
                    address: 1,
                    is_email_verified: 1,
                    is_phone_number_verified: 1
                }
            }

            if(request_data_body.promo_apply_on){
                let promo_apply_on = [];
                request_data_body.promo_apply_on.forEach(element => {
                    promo_apply_on.push(mongoose.Types.ObjectId(element))
                });
                search  = { $match: { _id: { $in : promo_apply_on }}}
            }

            User.aggregate([search, project
            ]).then((users) => {
                if (users.length == 0) {
                    response_data.json({success: true, users: []
                    });
                } else
                {
                    response_data.json({success: true,
                        message: USER_MESSAGE_CODE.USER_LIST_SUCCESSFULLY,
                        users: users,
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