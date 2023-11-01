require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
require('../utils/push_code');
var utils = require('../utils/utils');
var emails = require('../controllers/email_sms/emails');
var wallet_history = require('../controllers/user/wallet');
var SMS = require('../controllers/email_sms/sms');
var Setting = require('mongoose').model('setting');
var Country = require('mongoose').model('country');
var Wallet_request = require('mongoose').model('wallet_request');
var Provider = require('mongoose').model('provider');
var Store = require('mongoose').model('store');
var Admin = require('mongoose').model('admin');
var console = require('../utils/console');

var mongoose = require('mongoose');
var Bank_detail = require('mongoose').model('bank_detail');

// create_wallet_request
exports.create_wallet_request = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'id', type: 'string'}, {name: 'type'}, {name: 'requested_wallet_amount'},
        {name: 'description_for_request_wallet_amount', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var type = Number(request_data_body.type);
            var Table;
            switch (type) {
                case ADMIN_DATA_ID.PROVIDER:
                    Table = Provider;
                    break;
                case ADMIN_DATA_ID.STORE:
                    Table = Store;
                    break;
                default:
                    break;
            }

            Table.findOne({_id: request_data_body.id}).then((detail) => {
                if (detail) {
                    if (request_data_body.server_token !== null && detail.server_token !== request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        if (detail.wallet >= request_data_body.requested_wallet_amount) {
                            var query = { $or: [{ '_id': detail.country_id }, { 'country_code': detail.country_code }] };
                            Country.findOne(query).then((country) => {


                                if (country && setting_detail) {
                                    var wallet_currency_code = country.currency_code;
                                    var admin_currency_code = setting_detail.admin_currency_code;
                                    utils.getCurrencyConvertRate(1, wallet_currency_code, admin_currency_code, function (response) {

                                        if (response.success) {
                                            wallet_to_admin_current_rate = response.current_rate;
                                        } else {
                                            wallet_to_admin_current_rate = 1;
                                        }


                                        var wallet_request = new Wallet_request({
                                            user_id: request_data_body.id,
                                            user_type: request_data_body.type,
                                            user_unique_id: detail.unique_id,
                                            country_id: country._id,
                                            wallet_currency_code: wallet_currency_code,
                                            admin_currency_code: setting_detail.admin_currency_code,
                                            wallet_to_admin_current_rate: wallet_to_admin_current_rate,
                                            requested_wallet_amount: request_data_body.requested_wallet_amount,
                                            total_wallet_amount: detail.wallet,
                                            approved_requested_wallet_amount: 0,
                                            after_total_wallet_amount: 0,
                                            wallet_status: WALLET_REQUEST_STATUS.CREATED,
                                            is_payment_mode_cash: request_data_body.is_payment_mode_cash,
                                            description_for_request_wallet_amount: request_data_body.description_for_request_wallet_amount,
                                            transaction_details: request_data_body.transaction_details,
                                            transaction_date: null,
                                            completed_date: null,
                                            wallet_request_accepted_id: null,
                                            wallet_request_transaction_id: null,
                                            wallet_request_cancelled_id: null

                                        });
                                        wallet_request.save().then(() => {
                                                response_data.json({success: true, message: WALLET_REQUEST_MESSAGE_CODE.WALLET_REQUEST_CREATE_SUCCESSFULLY,
                                                    wallet_request: wallet_request});
                                        }, (error) => {
                                            console.log(error)
                                            response_data.json({
                                                success: false,
                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                            });
                                        });

                                    });

                                }

                            });

                        } else
                        {
                            response_data.json({success: false, error_code: ERROR_CODE.INSUFFICIENT_BALANCE});
                        }

                    }
                } else
                {
                    response_data.json({success: false, error_code: ERROR_CODE.DETAIL_NOT_FOUND});
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

// get_wallet_request_list
exports.get_wallet_request_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'id', type: 'string'}, {name: 'type'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var type = Number(request_data_body.type);
            var Table;
            switch (type) {
                case ADMIN_DATA_ID.PROVIDER:
                    Table = Provider;
                    break;
                case ADMIN_DATA_ID.STORE:
                    Table = Store;
                    break;
                default:
                    break;
            }

            Table.findOne({_id: request_data_body.id}).then((detail) => {
                if (detail) {
                    if (request_data_body.server_token !== null && detail.server_token !== request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        Wallet_request.find({user_id: request_data_body.id, user_type: type}, null, {sort: {'unique_id': -1}}).then((wallet_request_detail) => {

                            //Wallet_request.find({user_id: request_data_body.id, user_type: type}, function (error, wallet_request_detail) {
                            if (wallet_request_detail.length == 0) {
                                response_data.json({success: false, error_code: WALLET_REQUEST_ERROR_CODE.WALLET_REQUEST_DETAILS_NOT_FOUND});
                            } else {
                                response_data.json({success: true,
                                    message: WALLET_REQUEST_MESSAGE_CODE.WALLET_REQUEST_GET_SUCCESSFULLY,
                                    wallet_request_detail: wallet_request_detail
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


exports.approve_wallet_request_amount = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Wallet_request.findOne({_id: request_data_body.id}).then((wallet_request) => {

                if (wallet_request) {
                    wallet_request.wallet_status = WALLET_REQUEST_STATUS.ACCEPTED;
                    wallet_request.save().then(() => {
                            response_data.json({success: true,
                                message: WALLET_REQUEST_MESSAGE_CODE.WALLET_REQUEST_ACCEPTED_SUCCESSFULLY,
                                wallet_request: wallet_request});
                        
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




exports.complete_wallet_request_amount = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Wallet_request.findOne({_id: request_data_body.id}).then((wallet_request) => {

                if (wallet_request) {
                    wallet_request.wallet_status = WALLET_REQUEST_STATUS.COMPLETED;
                    wallet_request.save().then(() => {
                            response_data.json({success: true,
                                message: WALLET_REQUEST_MESSAGE_CODE.WALLET_REQUEST_COMPLETED_SUCCESSFULLY,
                                wallet_request: wallet_request});
                        
                    });
                }
            });
        } else {
            response_data.json(response);
        }
    });
};


//cancel_wallet_request

exports.cancel_wallet_request = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'id', type: 'string'}, {name: 'type'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var type = Number(request_data_body.type);
            switch (type) {
                case ADMIN_DATA_ID.ADMIN:
                    Table = Admin;
                    break;
                case ADMIN_DATA_ID.SUB_ADMIN:
                    Table = Admin;
                    break;
                case ADMIN_DATA_ID.PROVIDER:
                    Table = Provider;
                    break;
                case ADMIN_DATA_ID.STORE:
                    Table = Store;
                    break;
                default:
                    break;
            }
            
            Wallet_request.findOne({_id: request_data_body.id}).then((wallet_request) => {
                if (wallet_request)
                {
                    if (wallet_request.wallet_status == WALLET_REQUEST_STATUS.COMPLETED || wallet_request.wallet_status == WALLET_REQUEST_STATUS.CANCELLED || wallet_request.wallet_status == WALLET_REQUEST_STATUS.TRANSFERED)
                    {
                        response_data.json({success: false, error_code: WALLET_REQUEST_ERROR_CODE.WALLET_REQUEST_CANCELLED_FAILED});

                    } else
                    {
                        Table.findOne({admin_type: type}).then((detail) => {

                            if (detail)
                            {

                                wallet_request.wallet_status = WALLET_REQUEST_STATUS.CANCELLED;
                                wallet_request.wallet_request_cancelled_id = detail._id;
                                wallet_request.wallet_request_cancelled_by = type;
                                wallet_request.save().then(() => {
                                        response_data.json({success: true,
                                            message: WALLET_REQUEST_MESSAGE_CODE.WALLET_REQUEST_CANCELLED_SUCCESSFULLY,
                                            wallet_request: wallet_request});
                                }, (error) => {
                                    console.log(error)
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });
                            }

                        });
                    }
                }
            });
        } else {
            response_data.json(response);
        }
    });
};


// transfer_wallet_request_amount
exports.transfer_wallet_request_amount = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'wallet_request_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var date = new Date();
            Wallet_request.findOne({_id: request_data_body.wallet_request_id}).then((wallet_request) => {
                if (wallet_request)
                {
                    var user_type = Number(wallet_request.user_type);
                                    switch (user_type) {
                                        case ADMIN_DATA_ID.PROVIDER:
                                            Table = Provider;
                                            break;
                                        case ADMIN_DATA_ID.STORE:
                                            Table = Store;
                                            break;
                                        default:
                                            break;
                                    }

                    Table.findOne({_id: wallet_request.user_id}).then((detail) => {

                        // if (detail.wallet >= request_data_body.approved_requested_wallet_amount) {
                            var approved_requested_wallet_amount = utils.precisionRoundTwo(Number(request_data_body.approved_requested_wallet_amount));
                            wallet_request.approved_requested_wallet_amount = approved_requested_wallet_amount;
                            wallet_request.transaction_date = date;
                            wallet_request.total_wallet_amount = detail.wallet;
                            wallet_request.after_total_wallet_amount = wallet_request.total_wallet_amount - approved_requested_wallet_amount;
                            wallet_request.wallet_status = WALLET_REQUEST_STATUS.TRANSFERED;
                            wallet_request.save().then(() => {
                                    

                                    var total_wallet_amount = wallet_history.add_wallet_history(user_type, detail.unique_id, detail._id, detail._id
                                            , wallet_request.wallet_currency_code, wallet_request.admin_currency_code, wallet_request.wallet_to_admin_current_rate, approved_requested_wallet_amount, detail.wallet,
                                            WALLET_STATUS_ID.REMOVE_WALLET_AMOUNT, WALLET_COMMENT_ID.SET_BY_WALLET_REQUEST, "Wallet Request Charge");

                                    detail.wallet = total_wallet_amount;
                                    detail.save();

                                    response_data.json({success: true,
                                        message: WALLET_REQUEST_MESSAGE_CODE.WALLET_REQUEST_TRANSFERED_SUCCESSFULLY,
                                        wallet_request: wallet_request});
                                
                            }, (error) => {
                                console.log(error)
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });
                        // } else {
                        //     response_data.json({success: false, error_code: ERROR_CODE.INSUFFICIENT_BALANCE});
                        // }
                    });
                }
            });
        } else {
            response_data.json(response);
        }
    });
};

// get_wallet_request_list_search_sort
exports.get_wallet_request_list_search_sort = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            if (request_data_body.start_date == '' || request_data_body.end_date == '') {
                if (request_data_body.start_date == '' && request_data_body.end_date == '') {
                    var date = new Date(Date.now());
                    date = date.setHours(0, 0, 0, 0);
                    start_date = new Date(0);
                    end_date = new Date(Date.now());
                } else if (request_data_body.start_date == '') {
                    start_date = new Date(0);
                    var end_date = request_data_body.end_date.formatted;
                    end_date = new Date(end_date);
                    end_date = end_date.setHours(23, 59, 59, 999);
                    end_date = new Date(end_date);
                } else {
                    var start_date = request_data_body.start_date.formatted;
                    start_date = new Date(start_date);
                    start_date = start_date.setHours(0, 0, 0, 0);
                    start_date = new Date(start_date);
                    end_date = new Date(Date.now());
                }
            } else {

                var start_date = request_data_body.start_date.formatted;
                var end_date = request_data_body.end_date.formatted;

                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(end_date);
                end_date = end_date.setHours(23, 59, 59, 999);
                end_date = new Date(end_date);
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


            var store_query = {
                $lookup:
                        {
                            from: "stores",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "store_detail"
                        }
            };

            var provider_query = {
                $lookup:
                        {
                            from: "providers",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "provider_detail"
                        }
            };
            // var number_of_rec = SEARCH_SORT.NO_OF_RECORD_PER_PAGE;
            var number_of_rec = request_data_body.number_of_rec;
            var page = request_data_body.page;

            var sort_field = request_data_body.sort_field;
            var sort_wallet_request = request_data_body.sort_wallet_request;
            var search_field = request_data_body.search_field;
            var search_value = request_data_body.search_value;
            search_value = search_value.replace(/^\s+|\s+$/g, '');
            search_value = search_value.replace(/ +(?= )/g, '');

            if (search_field === "provider_detail.first_name")
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
                    query2['provider_detail.name'] = {$regex: new RegExp(search_value, 'i')};
                    var search = {"$match": {$or: [query1, query2]}};
                } else {

                    query1[search_field] = {$regex: new RegExp(search_value, 'i')};
                    query2['provider_detail.name'] = {$regex: new RegExp(search_value, 'i')};
                    query3[search_field] = {$regex: new RegExp(full_name[0], 'i')};
                    query4['provider_detail.name'] = {$regex: new RegExp(full_name[0], 'i')};
                    query5[search_field] = {$regex: new RegExp(full_name[1], 'i')};
                    query6['provider_detail.name'] = {$regex: new RegExp(full_name[1], 'i')};
                    var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
                }
            } else if (search_field === "store_detail.first_name")
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
                    query2['store_detail.first_name'] = {$regex: new RegExp(search_value, 'i')};
                    var search = {"$match": {$or: [query1, query2]}};
                } else {

                    query1[search_field] = {$regex: new RegExp(search_value, 'i')};
                    query2['store_detail.first_name'] = {$regex: new RegExp(search_value, 'i')};
                    query3[search_field] = {$regex: new RegExp(full_name[0], 'i')};
                    query4['store_detail.first_name'] = {$regex: new RegExp(full_name[0], 'i')};
                    query5[search_field] = {$regex: new RegExp(full_name[1], 'i')};
                    query6['store_detail.first_name'] = {$regex: new RegExp(full_name[1], 'i')};
                    var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
                }
            } else
            {
                var query = {};
                query[search_field] = {$regex: new RegExp(search_value, 'i')};
                var search = {"$match": query};
            }
            var filter = {"$match": {"created_at": {$gte: start_date, $lt: end_date}}};
            var sort = {"$sort": {}};
            sort["$sort"][sort_field] = parseInt(sort_wallet_request);
            var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            
            if(request_data_body.number_of_rec && request_data_body.number_of_rec != -1){
                number_of_rec = request_data_body.number_of_rec;
            }
            limit["$limit"] = number_of_rec;
            Wallet_request.aggregate([filter, country_query, store_query, provider_query, array_to_json
                        , search, count
            ]).then((wallet_request) => {
                if (wallet_request.length === 0)
                {
                    response_data.json({success: false, error_code: WALLET_REQUEST_ERROR_CODE.WALLET_REQUESTS_NOT_FOUND, pages: 0});
                } else
                {
                    var pages = Math.ceil(wallet_request[0].total / number_of_rec);
                    Wallet_request.aggregate([filter, country_query, store_query, provider_query, array_to_json
                                , sort, search, skip, limit
                    ]).then((wallet_request) => {
                        
                            response_data.json({success: true,
                                message: WALLET_REQUEST_MESSAGE_CODE.WALLET_REQUEST_LIST_SUCCESSFUL,
                                pages: pages,
                                wallet_request: wallet_request});
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

//get_wallet_request_bank_detail
exports.get_wallet_request_bank_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'bank_detail_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var bank_detail_id = request_data_body.bank_detail_id;
            console.log("get_wallet_request_bank_detail");

            var query1 = {$match: {'_id': {$eq: mongoose.Types.ObjectId(bank_detail_id)}}};

            Bank_detail.aggregate([query1]).then((bank_detail) => {

                if (bank_detail.length == 0) {
                    response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                } else {
                    response_data.json({success: true,
                        message: PRODUCT_MESSAGE_CODE.PRODUCT_LIST_SUCCESSFULLY,
                        bank_detail: bank_detail[0]
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