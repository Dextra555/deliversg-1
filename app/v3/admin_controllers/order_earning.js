require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var mongoose = require('mongoose');
var Order = require('mongoose').model('order');
var console = require('../utils/console');


// get_order_earning
exports.get_order_earning = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var start_date = request_data_body.start_date;
            var end_date = request_data_body.end_date;

            if (end_date == '' || end_date == undefined) {
                end_date = new Date();
            } else {
                end_date = new Date(end_date.formatted);
            }
            end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);

            if (start_date == '' || start_date == undefined) {
                start_date = new Date(end_date.getTime() - (6 * 24 * 60 * 60 * 1000));
            } else {
                start_date = new Date(start_date.formatted);
            }
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);

            var filter = {"$match": {$and: [{"completed_date_in_city_timezone": {$gte: start_date, $lt: end_date}}]}};

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
            var store_query = {
                $lookup:
                    {
                        from: "stores",
                        localField: "store_id",
                        foreignField: "_id",
                        as: "store_detail"
                    }
            };
            var array_to_json_store_detail = {$unwind: {
                                    path: "$store_detail",
                                    preserveNullAndEmptyArrays: true
                                }
                            };

            var city_query = {
                $lookup:
                    {
                        from: "cities",
                        localField: "city_id",
                        foreignField: "_id",
                        as: "city_detail"
                    }
            };

            var array_to_json_city_detail = {$unwind: "$city_detail"};

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

            var payment_gateway_query = {
                $lookup:
                    {
                        from: "payment_gateways",
                        localField: "order_payment_detail.payment_id",
                        foreignField: "_id",
                        as: "payment_gateway_detail"
                    }
            };

            var request_query = {
                $lookup:
                    {
                        from: "requests",
                        localField: "request_id",
                        foreignField: "_id",
                        as: "request_detail"
                    }
            };

            var array_to_json_request_query = {$unwind: {
                    path: "$request_detail",
                    preserveNullAndEmptyArrays: true
                }
            };


            var provider_query = {
                $lookup:
                    {
                        from: "providers",
                        localField: "request_detail.current_provider",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
            };


            var number_of_rec = SEARCH_SORT.NO_OF_RECORD_PER_PAGE;
            var page = request_data_body.page;

            var search_field = request_data_body.search_field;
            var search_value = request_data_body.search_value;
            search_value = search_value.replace(/^\s+|\s+$/g, '');
            search_value = search_value.replace(/ +(?= )/g, '');

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
                    var search = {"$match": {$or: [query1, query2]}};
                } else {

                    query1[search_field] = {$regex: new RegExp(search_value, 'i')};
                    query2['provider_detail.last_name'] = {$regex: new RegExp(search_value, 'i')};
                    query3[search_field] = {$regex: new RegExp(full_name[0], 'i')};
                    query4['provider_detail.last_name'] = {$regex: new RegExp(full_name[0], 'i')};
                    query5[search_field] = {$regex: new RegExp(full_name[1], 'i')};
                    query6['provider_detail.last_name'] = {$regex: new RegExp(full_name[1], 'i')};
                    var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
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

            // var order_state_condition = {"$match": {'order_status': {$eq: ORDER_STATE.ORDER_COMPLETED}}};
            var order_status_id_condition = {"$match":{$or: [ {'order_status_id': {$eq: ORDER_STATUS_ID.COMPLETED}},{$and: [{'order_status': {$eq: ORDER_STATE.CANCELED_BY_USER}}, {'order_payment_detail.order_cancellation_charge': {$gt: 0}} ]} ]}};

            Order.aggregate([filter, order_status_id_condition, user_query, order_payment_query, store_query,city_query,country_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_order_payment_query, payment_gateway_query,  array_to_json_city_detail, array_to_json_country_query, request_query, array_to_json_request_query, provider_query
                , search
                , count
            ]).then((orders) => {
                if (orders.length === 0)
                {
                    response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0});
                } else
                {
                    var pages = Math.ceil(orders[0].total / number_of_rec);
                    var total_condition = {
                        $group: {
                            _id: null,
                            total_completed_orders: {$sum: {$cond: [{$eq: ["$order_status_id", ORDER_STATUS_ID.COMPLETED]}, 1, 0]}},
                            total_cancelled_orders: {$sum: {$cond: [{$eq: ["$order_status_id", ORDER_STATUS_ID.CANCELLED]}, 1, 0]}},
                            total_admin_earn: {$sum: {$multiply: [{$sum: ['$order_payment_detail.total_admin_profit_on_delivery', '$order_payment_detail.total_admin_profit_on_store']}, '$order_payment_detail.current_rate']}},

                            admin_earn_wallet: {$sum: {$multiply: ['$order_payment_detail.wallet_payment', '$order_payment_detail.current_rate']}},
                            provider_earn: {$sum: {$multiply: ['$order_payment_detail.total_provider_income', '$order_payment_detail.current_rate']}},
                            store_earn: {$sum: {$multiply: ['$order_payment_detail.total_store_income', '$order_payment_detail.current_rate']}},

                            total: {$sum: {$multiply: ['$order_payment_detail.total', '$order_payment_detail.current_rate']}},
                            cash_payment: {$sum: {$multiply: ['$order_payment_detail.cash_payment', '$order_payment_detail.current_rate']}},
                            card_payment: {$sum: {$multiply: ['$order_payment_detail.card_payment', '$order_payment_detail.current_rate']}},

                            pay_to_provider: {$sum: {$multiply: ['$order_payment_detail.pay_to_provider', '$order_payment_detail.current_rate']}},
                            pay_to_store: {$sum: {$multiply: ['$order_payment_detail.pay_to_store', '$order_payment_detail.current_rate']}},

                            provider_income_set_in_wallet: {$sum: {$multiply: ['$order_payment_detail.provider_income_set_in_wallet', '$order_payment_detail.current_rate']}},
                            store_income_set_in_wallet: {$sum: {$multiply: ['$order_payment_detail.store_income_set_in_wallet', '$order_payment_detail.current_rate']}}

                        }
                    }

                    Order.aggregate([filter, order_status_id_condition, user_query, order_payment_query, store_query,city_query,country_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_order_payment_query, payment_gateway_query, array_to_json_city_detail, array_to_json_country_query, request_query, array_to_json_request_query, provider_query
                        , search
                        , total_condition
                    ]).then((order_total) => {
                        if (page)
                        {
                            Order.aggregate([filter, order_status_id_condition, user_query, order_payment_query, store_query,city_query,country_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_order_payment_query, payment_gateway_query,  array_to_json_city_detail, array_to_json_country_query, request_query, array_to_json_request_query, provider_query
                                , sort
                                , search
                                , skip, limit
                            ]).then((orders) => {
                                response_data.json({success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,

                                    admin_currency: setting_detail.admin_currency,
                                    order_total: order_total[0],
                                    orders: orders});
                            }, (error) => {
                                console.log(error);
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });
                        } else
                        {
                            Order.aggregate([filter, order_status_id_condition, user_query,city_query,country_query, order_payment_query, store_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_order_payment_query, payment_gateway_query, array_to_json_city_detail, array_to_json_country_query, request_query, array_to_json_request_query, provider_query
                                , sort
                                , search
                            ]).then((orders) => {
                                response_data.json({success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,

                                    admin_currency: setting_detail.admin_currency,
                                    order_total: order_total[0],
                                    orders: orders});
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



// admin get_order_earning_detail
exports.get_order_earning_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'order_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var order_condition = {"$match": {'_id': {$eq: mongoose.Types.ObjectId(request_data_body.order_id)}}};
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
            var store_query = {
                $lookup:
                    {
                        from: "stores",
                        localField: "store_id",
                        foreignField: "_id",
                        as: "store_detail"
                    }
            };
            var array_to_json_store_detail = {$unwind: {
                                    path: "$store_detail",
                                    preserveNullAndEmptyArrays: true
                                }
                            };


            var cart_query = {
                $lookup:
                    {
                        from: "carts",
                        localField: "cart_id",
                        foreignField: "_id",
                        as: "cart_detail"
                    }
            };
            var array_to_json_cart_query = {$unwind: "$cart_detail"};

            var city_query = {
                $lookup:
                    {
                        from: "cities",
                        localField: "city_id",
                        foreignField: "_id",
                        as: "city_detail"
                    }
            };
            var array_to_json_city_detail = {$unwind: "$city_detail"};

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
            var request_query = {
                $lookup:
                    {
                        from: "requests",
                        localField: "request_id",
                        foreignField: "_id",
                        as: "request_detail"
                    }
            };

            var array_to_json_request_query = {$unwind: {
                    path: "$request_detail",
                    preserveNullAndEmptyArrays: true
                }
            };


            var provider_query = {
                $lookup:
                    {
                        from: "providers",
                        localField: "request_detail.current_provider",
                        foreignField: "_id",
                        as: "provider_detail"
                    }
            };


            Order.aggregate([order_condition, user_query, store_query, cart_query, city_query,country_query, order_payment_query, request_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_order_payment_query,
                array_to_json_cart_query, array_to_json_city_detail,  array_to_json_country_query, array_to_json_request_query, provider_query

            ]).then((order) => {

                if (order.length === 0)
                {
                    response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                } else
                {
                    response_data.json({success: true,
                        message: ORDER_MESSAGE_CODE.GET_ORDER_DATA_SUCCESSFULLY,
                        order: order[0]
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
