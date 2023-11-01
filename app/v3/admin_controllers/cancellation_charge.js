require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
require('../utils/push_code');
var utils = require('../utils/utils');
var Order = require('mongoose').model('order');
var Request = require('mongoose').model('request');
var console = require('../utils/console');


// cancellation_reason_list
exports.cancellation_reason_list = function (request_data, response_data) {
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

            var user_query = {
                $lookup:
                        {
                            from: "users",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "user_detail"
                        }
            };
            var array_to_json_user_detail = {$unwind: "$user_detail"};


            var order_payment_query = {
                $lookup:
                        {
                            from: "order_payments",
                            localField: "order_payment_id",
                            foreignField: "_id",
                            as: "order_payment_detail"
                        }
            };
            var array_to_json_order_payment_query = {$unwind: "$order_payment_detail"};

            var store_query = {
                $lookup:
                        {
                            from: "stores",
                            localField: "store_id",
                            foreignField: "_id",
                            as: "store_detail"
                        }
            };
            var array_to_json_store_detail = {$unwind: "$store_detail"};

            var country_query = {
                $lookup:
                        {
                            from: "countries",
                            localField: "store_detail.country_id",
                            foreignField: "_id",
                            as: "country_detail"
                        }
            };
            var array_to_json_country_query = {$unwind: "$country_detail"};


            var number_of_rec = SEARCH_SORT.NO_OF_RECORD_PER_PAGE_OF_NO_ACTION;
            var page = request_data_body.page;

            var sort_field = request_data_body.sort_field;
            var sort_order = request_data_body.sort_order;
            var search_field = request_data_body.search_field;
            var search_value = request_data_body.search_value;


            if (search_field === "user_detail.first_name")
            {
                search_value = search_value.replace(/^\s+|\s+$/g, '');
                search_value = search_value.replace(/ +(?= )/g, '');
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
                    var search = {"$match": {$or: [query1, query2]}};
                } else {

                    query1[search_field] = {$regex: new RegExp(search_value, 'i')};
                    query2['user_detail.last_name'] = {$regex: new RegExp(search_value, 'i')};
                    query3[search_field] = {$regex: new RegExp(full_name[0], 'i')};
                    query4['user_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                    query5[search_field] = {$regex: new RegExp(full_name[1], 'i')};
                    query6['user_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};
                    var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
                }
            } else if (search_field === "store_detail.name")
            {
                search_value = search_value.replace(/^\s+|\s+$/g, '');
                search_value = search_value.replace(/ +(?= )/g, '');
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
                    var search = {"$match": {$or: [query1, query2]}};
                } else {

                    query1[search_field] = {$regex: new RegExp(search_value, 'i')};
                    query2['store_detail.name'] = {$regex: new RegExp(search_value, 'i')};
                    query3[search_field] = {$regex: new RegExp(full_name[0], 'i')};
                    query4['store_detail.name'] = {$regex: new RegExp(full_name[0], 'i')};
                    query5[search_field] = {$regex: new RegExp(full_name[1], 'i')};
                    query6['store_detail.name'] = {$regex: new RegExp(full_name[1], 'i')};
                    var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
                }
            } else if (search_field == 'unique_id')
            {
                var query = {};
                if (search_value !== "")
                {
                    search_value = Number(search_value);
                    query[search_field] = search_value;
                    var search = {"$match": query};
                }
            } else if (search_field == 'store_detail.unique_id')
            {
                var query = {};
                if (search_value !== "")
                {
                    search_value = Number(search_value);
                    query[search_field] = search_value;
                    var search = {"$match": query};
                }
            } else if (search_field == 'user_detail.unique_id')
            {
                var query = {};
                if (search_value !== "")
                {
                    search_value = Number(search_value);
                    query[search_field] = search_value;
                    var search = {"$match": query};
                }
            } else
            {
                var query = {};
                query[search_field] = {$regex: new RegExp(search_value, 'i')};
                var search = {"$match": query};
            }
            var filter = {"$match": {"completed_at": {$gte: start_date, $lt: end_date}}};
            var sort = {"$sort": {}};
            sort["$sort"][sort_field] = parseInt(sort_order);
            var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;

            var order_condition = {"$match": {'order_status_id': {$eq: ORDER_STATUS_ID.CANCELLED}}};
            Order.aggregate([filter, order_condition, user_query, order_payment_query, store_query, array_to_json_user_detail, array_to_json_store_detail, country_query, array_to_json_country_query, array_to_json_order_payment_query
                        , search
                        , count
            ]).then((orders) => {
                if (orders.length === 0)
                {
                    response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0});
                } else
                {
                    var pages = Math.ceil(orders[0].total / number_of_rec);
                    Order.aggregate([filter, order_condition, user_query, order_payment_query, store_query, array_to_json_user_detail, array_to_json_store_detail, country_query, array_to_json_country_query, array_to_json_order_payment_query
                                , sort, search
                                , skip, limit
                    ]).then((orders) => {
                        if (orders.length === 0) {
                            response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                        } else
                        {
                            response_data.json({success: true,
                                message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,
                                orders: orders});
                        }
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
        } else {
            response_data.json(response);
        }
    });
};


// request_cancellation_reason
exports.request_cancellation_reason = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var user_query = {
                $lookup:
                        {
                            from: "users",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "user_detail"
                        }
            };
            var array_to_json_user_detail = {$unwind: "$user_detail"};
            var array_to_json_orders = {$unwind: "$orders"};
            var order_query = {
                $lookup:
                        {
                            from: "orders",
                            localField: "orders.order_id",
                            foreignField: "_id",
                            as: "order_detail"
                        }
            };
            var array_to_json_order_query = {$unwind: "$order_detail"};

            var order_payment_query = {
                $lookup:
                        {
                            from: "orders",
                            localField: "orders.order_payment_id",
                            foreignField: "_id",
                            as: "order_payment_detail"
                        }
            };
            var array_to_json_order_payment_query = {$unwind: "$order_payment_detail"};
            var store_query = {
                $lookup:
                        {
                            from: "stores",
                            localField: "order_detail.store_id",
                            foreignField: "_id",
                            as: "store_detail"
                        }
            };
            var array_to_json_store_detail = {$unwind: "$store_detail"};

            var country_query = {
                $lookup:
                        {
                            from: "countries",
                            localField: "country_id",
                            foreignField: "_id",
                            as: "country_detail"
                        }
            };
            var array_to_json_country_query = {$unwind: "$country_detail"};

            var provider_query = {
                $lookup:
                        {
                            from: "providers",
                            localField: "current_provider",
                            foreignField: "_id",
                            as: "provider_detail"
                        }
            };


            var number_of_rec = SEARCH_SORT.NO_OF_RECORD_PER_PAGE_OF_NO_ACTION;
            var page = request_data_body.page;

            var sort_field = request_data_body.sort_field;
            var sort_request = request_data_body.sort_request;
            var search_field = request_data_body.search_field;
            var search_value = request_data_body.search_value;

            var search = {"$match": {}};
            if (search_field === "user_detail.first_name")
            {
                search_value = search_value.replace(/^\s+|\s+$/g, '');
                search_value = search_value.replace(/ +(?= )/g, '');
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
                search_value = search_value.replace(/^\s+|\s+$/g, '');
                search_value = search_value.replace(/ +(?= )/g, '');
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
            } else if (search_field == 'unique_id')
            {
                var query = {};
                if (search_value !== "")
                {
                    search_value = Number(search_value);
                    query[search_field] = search_value;
                    search = {"$match": query};
                }
            } else if (search_field == 'user_detail.unique_id')
            {
                var query = {};
                if (search_value !== "")
                {
                    search_value = Number(search_value);
                    query[search_field] = search_value;
                    search = {"$match": query};
                }
            } else
            {
                var query = {};
                query[search_field] = {$regex: new RegExp(search_value, 'i')};
                search = {"$match": query};
            }
            //var filter = {"$match": {"cancelled_at": {$gte: start_date, $lt: end_date}}};
            var sort = {"$sort": {}};
            sort["$sort"][sort_field] = parseInt(sort_request);
            var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;

            var request_condition = {$match: {
                    $or: [{delivery_status_manage_id: {$eq: ORDER_STATUS_ID.CANCELLED}},
                        {delivery_status_manage_id: {$eq: ORDER_STATUS_ID.REJECTED}}
                    ]}}

            Request.aggregate([request_condition, user_query,country_query, provider_query
                        , array_to_json_orders
                        , order_query, order_payment_query
                        , array_to_json_user_detail
                        , array_to_json_country_query
                        , array_to_json_order_query
                        , store_query, array_to_json_store_detail
                        , search, count
            ]).then((requests) => {
                console.log( search);
                if (requests.length === 0)
                {
                    response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0});
                } else
                {
                    var pages = Math.ceil(requests[0].total / number_of_rec);
                    Request.aggregate([request_condition, user_query,country_query, provider_query
                                , array_to_json_orders
                                , order_query, order_payment_query
                                , array_to_json_user_detail
                                , array_to_json_country_query
                                , array_to_json_order_query
                                , store_query, array_to_json_store_detail
                                , sort, search, skip, limit
                    ]).then((requests) => {
                        if (requests.length === 0) {
                            response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                        } else
                        {
                            response_data.json({success: true,
                                message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,
                                requests: requests});
                        }
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
        } else {
            response_data.json(response);
        }
    });
};