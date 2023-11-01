require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
require('../utils/push_code');
var utils = require('../utils/utils');
var emails = require('../controllers/email_sms/emails');
var SMS = require('../controllers/email_sms/sms');
var Wallet = require('mongoose').model('wallet');
var Provider = require('mongoose').model('provider');
var User = require('mongoose').model('user');
var Store = require('mongoose').model('store');
var console = require('../utils/console');


// get_wallet_detail for Admin
exports.get_wallet_detail = function (request_data, response_data) {
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

                var start_date = request_data_body.start_date;
                var end_date = request_data_body.end_date;

                start_date = new Date(start_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = new Date(end_date);
                end_date = end_date.setHours(23, 59, 59, 999);
                end_date = new Date(end_date);
            }

            var user_query = {
                $lookup:
                        {
                            from: "users",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "user_detail"
                        }
            };
            var array_to_json_user_detail = {$unwind: { path: "$user_detail", preserveNullAndEmptyArrays: true }};
            var store_query = {
                $lookup:
                        {
                            from: "stores",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "store_detail"
                        }
            };
            var array_to_json_store_detail = {$unwind: { path: "$store_detail", preserveNullAndEmptyArrays: true }};

            var provider_query = {
                $lookup:
                        {
                            from: "providers",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "provider_detail"
                        }
            };
            var array_to_json_provider_detail = {$unwind: { path: "$provider_detail", preserveNullAndEmptyArrays: true }};
            var number_of_rec = request_data_body.number_of_rec;
            var page = request_data_body.page;

            var search_field = request_data_body.search_field;
            var search_value = request_data_body.search_value;
            search_value = search_value.replace(/^\s+|\s+$/g, '');
            search_value = search_value.replace(/ +(?= )/g, '');
            var wallet_comment_id = Number(request_data_body.wallet_comment_id);
            var user_type = Number(request_data_body.user_type);

            var user_type_query = {$match: {}}
            var wallet_comment_id_query = {$match: {}}

            if(wallet_comment_id > 0){
                wallet_comment_id_query = {$match: {wallet_comment_id: {$eq: wallet_comment_id}}}
            }

            if(user_type > 0){
                user_type_query = {$match: {user_type: {$eq: user_type}}}
            }
            var search = {"$match":{}}
                if (search_field === "user_detail.first_name")
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
                    query2['user_detail.last_name'] = {$regex: new RegExp(search_value, 'i')};
                    search = {"$match": {$or: [query1, query2]}};
                } else {

                    query1[search_field] = {$regex: new RegExp(search_value, 'i')};
                    query2['user_detail.last_name'] = {$regex: new RegExp(search_value, 'i')};
                    query3[search_field] = {$regex: new RegExp(full_name[0], 'i')};
                    query4['user_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                    query5[search_field] = {$regex: new RegExp(full_name[1], 'i')};
                    query6['user_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};
                    search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
                }
            } else if (search_field === "provider_detail.first_name")
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
                    query2['provider_detail.last_name'] = {$regex: new RegExp(search_value, 'i')};
                    search = {"$match": {$or: [query1, query2]}};
                } else {

                    query1[search_field] = {$regex: new RegExp(search_value, 'i')};
                    query2['provider_detail.last_name'] = {$regex: new RegExp(search_value, 'i')};
                    query3[search_field] = {$regex: new RegExp(full_name[0], 'i')};
                    query4['provider_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                    query5[search_field] = {$regex: new RegExp(full_name[1], 'i')};
                    query6['provider_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};
                    search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
                }
            } else if (search_field === "store_detail.name")
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
                    query2['store_detail.name'] = {$regex: new RegExp(search_value, 'i')};
                    search = {"$match": {$or: [query1, query2]}};
                } else {

                    query1[search_field] = {$regex: new RegExp(search_value, 'i')};
                    query2['store_detail.name'] = {$regex: new RegExp(search_value, 'i')};
                    query3[search_field] = {$regex: new RegExp(full_name[0], 'i')};
                    query4['store_detail.name'] = {$regex: new RegExp(full_name[0], 'i')};
                    query5[search_field] = {$regex: new RegExp(full_name[1], 'i')};
                    query6['store_detail.name'] = {$regex: new RegExp(full_name[1], 'i')};
                    search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
                }
            } else
            {
                if(search_value){
                    var query = {};
                    query[search_field] = {$regex: new RegExp(search_value, 'i')};
                    search = {"$match": query};
                }
            }
            var filter = {"$match": {"created_at": {$gte: start_date, $lt: end_date}}};
            var sort = {"$sort": {}};
            sort["$sort"]["unique_id"] = parseInt(-1);
            var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;
            var project = {
                "$project":{
                    unique_id:1,
                    created_at:1,
                    user_type:1,
                    user_detail:{
                        first_name:1,
                        last_name:1
                    },
                    provider_detail:{
                        first_name:1,
                        last_name:1
                    },
                    store_detail:{
                        name:1
                    },
                    from_currency_code:1,
                    wallet_amount:1,
                    wallet_status:1,
                    total_wallet_amount:1,
                    wallet_description:1,
                    added_wallet:1,
                }
            }

            Wallet.aggregate([filter, wallet_comment_id_query, user_type_query, user_query, store_query, provider_query, search, count]).then((wallet) => {
                if (wallet.length === 0)
                {
                    response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0});
                } else
                {

                    var pages = Math.ceil(wallet[0].total / number_of_rec);
                    if(page)
                    {
                        Wallet.aggregate([filter, wallet_comment_id_query, user_type_query, user_query, array_to_json_user_detail,store_query,array_to_json_store_detail, provider_query,array_to_json_provider_detail,project, sort, search, skip, limit]).then((wallet) => {

                           
                                response_data.json({success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,
                                    wallet: wallet});
                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }else
                    {
                        Wallet.aggregate([filter, wallet_comment_id_query, user_type_query, user_query, store_query, provider_query,project, sort, filter]).then((wallet) => {
                                response_data.json({success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,
                                    wallet: wallet});
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


