require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var console = require('../utils/console');

var Order = require('mongoose').model('order');
var Provider = require('mongoose').model('provider');
var Request = require('mongoose').model('request');

// Today orders order_lists_search_sort
exports.order_lists_search_sort = function (request_data, response_data) {
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
            var array_to_json_city_query = {$unwind: "$city_detail"};
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

            var number_of_rec = SEARCH_SORT.NO_OF_RECORD_PER_PAGE;
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
            } else
            {
                var query = {};
                query[search_field] = {$regex: new RegExp(search_value, 'i')};
                var search = {"$match": query};
            }

            var sort = {"$sort": {}};
            sort["$sort"][sort_field] = parseInt(sort_order);
            var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;

            var condition = {$match: {}};
            var date = new Date(Date.now());
            date = date.setHours(0, 0, 0, 0);
            startdate = new Date(date);
            enddate = new Date(Date.now());
            condition = {$match: {'created_at': {$gte: startdate, $lt: enddate}}};

            Order.aggregate([condition, user_query, order_payment_query, store_query, city_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_city_query, array_to_json_order_payment_query, payment_gateway_query
                        , search, count]).then((orders) => {

                if (orders.length === 0)
                {

                    response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0});
                } else
                {

                    var timezone = "";
                    if (setting_detail)
                    {
                        timezone = setting_detail.admin_panel_timezone;
                    }
                    var pages = Math.ceil(orders[0].total / number_of_rec);
                    if (page)
                    {
                        Order.aggregate([condition, user_query, order_payment_query, store_query, city_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_city_query, array_to_json_order_payment_query, payment_gateway_query
                                    , sort, search, skip, limit]).then((orders) => {
                            if (orders.length === 0) {
                                response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                            } else
                            {

                                response_data.json({success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,
                                    orders: orders,
                                    timezone: timezone});
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
                        Order.aggregate([condition, user_query, order_payment_query, store_query, city_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_city_query, array_to_json_order_payment_query, payment_gateway_query
                                    , sort, search]).then((orders) => {
                            if (orders.length === 0) {
                                response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                            } else
                            {

                                response_data.json({success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,
                                    orders: orders,
                                    timezone: timezone});
                            }
                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }

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

// admin_orders
exports.admin_orders = function (request_data, response_data) {
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
            var array_to_json_city_query = {$unwind: "$city_detail"};

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


            var number_of_rec = SEARCH_SORT.NO_OF_RECORD_PER_PAGE;
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
            } else
            {
                var query = {};
                query[search_field] = {$regex: new RegExp(search_value, 'i')};
                var search = {"$match": query};
            }

            var sort = {"$sort": {}};
            sort["$sort"][sort_field] = parseInt(sort_order);
            var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;

            var order_condition = {"$match": {'order_status_id': {$ne: ORDER_STATUS_ID.COMPLETED}}};


            Order.aggregate([order_condition, user_query, order_payment_query, store_query, city_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_city_query, array_to_json_order_payment_query, payment_gateway_query
                        , search
                        , count
            ]).then((orders) => {

                if (orders.length === 0)
                {
                    response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0});
                } else
                {
                    var timezone = "";
                    if (setting_detail)
                    {
                        timezone = setting_detail.admin_panel_timezone;
                    }
                    var pages = Math.ceil(orders[0].total / number_of_rec);
                    if (page)
                    {
                        Order.aggregate([order_condition, user_query, order_payment_query, store_query, city_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_city_query, array_to_json_order_payment_query, payment_gateway_query

                                    , sort, search, skip, limit
                        ]).then((orders) => {
                            if (orders.length == 0) {
                                response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                            } else
                            {
                                response_data.json({success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,
                                    orders: orders,
                                    timezone: timezone});
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
                        Order.aggregate([order_condition, user_query, order_payment_query, store_query, city_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_city_query, array_to_json_order_payment_query, payment_gateway_query
                                    , sort, search
                        ]).then((orders) => {
                                response_data.json({success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,
                                    orders: orders,
                                    timezone: timezone});
                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }
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

// deliveryman_track
exports.deliveryman_track = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var id = request_data_body.id;
            var type = Number(request_data_body.type);
            
            if (type == 1)
            {
                Order.findOne({_id: id}).then((order_detail) => {
                    if (order_detail)
                    {
                        Request.findOne({_id: order_detail.request_id}).then((request) => {
                            if (request)
                            {
                                Provider.findOne({_id: request.current_provider}).then((provider_detail) => {
                                    console.log("pass order provider_detail");
                                    if (provider_detail) {
                                        response_data.json({
                                            success: true,
                                            message: ORDER_MESSAGE_CODE.ORDER_CANCEL_OR_REJECT_BY_PROVIDER_SUCCESSFULLY,
                                            provider: provider_detail

                                        });
                                    } else
                                    {
                                        response_data.json({
                                            success: false,
                                            message: ORDER_MESSAGE_CODE.ORDER_CANCEL_OR_REJECT_BY_PROVIDER_SUCCESSFULLY


                                        });
                                    }
                                });
                            } else
                            {
                                response_data.json({
                                    success: false,
                                    message: ORDER_MESSAGE_CODE.ORDER_CANCEL_OR_REJECT_BY_PROVIDER_SUCCESSFULLY
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
                        response_data.json({
                            success: false,
                            message: ORDER_MESSAGE_CODE.ORDER_CANCEL_OR_REJECT_BY_PROVIDER_SUCCESSFULLY
                        });
                    }
                });
            } else
            {
                Provider.findOne({_id: id}).then((provider_detail) => {
                    console.log("pass provider_id provider_detail");
                    response_data.json({
                        success: true,
                        message: ORDER_MESSAGE_CODE.ORDER_CANCEL_OR_REJECT_BY_PROVIDER_SUCCESSFULLY,
                        provider: provider_detail

                    });
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

// order_list_location_track
exports.order_list_location_track = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Order.find({}).then((orders) => {
                if (orders.length == 0)
                {
                    response_data.json({
                        success: false,
                        message: ORDER_MESSAGE_CODE.ORDER_CANCEL_OR_REJECT_BY_PROVIDER_SUCCESSFULLY
                    });
                } else
                {

                    response_data.json({
                        success: true,
                        message: ORDER_MESSAGE_CODE.ORDER_CANCEL_OR_REJECT_BY_PROVIDER_SUCCESSFULLY,
                        orders: orders

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

////////////
// orders_list_export_excel
exports.orders_list_export_excel = function (request_data, response_data) {
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
            var array_to_json_city_query = {$unwind: "$city_detail"};

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


            var number_of_rec = SEARCH_SORT.NO_OF_RECORD_PER_PAGE;
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
            } else
            {
                var query = {};
                query[search_field] = {$regex: new RegExp(search_value, 'i')};
                var search = {"$match": query};
            }

            var sort = {"$sort": {}};
            sort["$sort"][sort_field] = parseInt(sort_order);
            var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;

            var order_condition = {"$match": {'order_status_id': {$ne: ORDER_STATUS_ID.COMPLETED}}};

            var group = {$group: {
                    _id: null,
                    data: {$push: {
                                user_first_name: "$user_detail.first_name",
                                user_last_name: "$user_detail.last_name",
                                store: '$store_detail.name',
                                city: "$city_detail.city_name",
                                amount: "$order_payment_detail.total",
                                payment_status:"$order_payment_detail.is_payment_mode_cash",
                                date:"$created_at"
                            }}
                }
            };
            var project = { $project : { data:1 } }


            Order.aggregate([order_condition, user_query, order_payment_query, store_query, city_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_city_query, array_to_json_order_payment_query, payment_gateway_query
                        , search,group,project

            ]).then((orders) => {

                if (orders.length === 0)
                {
                    response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0});
                } else
                {

                    var json_data = [];
                    if (orders[0].data.length > 0) {
                        var order_data = orders[0].data;
                        for (var i = 0; i < order_data.length; ) {
                            var city = '';
                            city = order_data[i].city;


                            json_data.push({
                                "User": order_data[i].user_first_name + " " + order_data[i].user_last_name,
                                "Store": order_data[i].store,
                                "City": city,
                                "Amount": order_data[i].amount,
                                "Date":order_data[i].date
                            });
                            i++;
                            if (orders[0].data.length == i) {
                                response_data.json({success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
                                    orders: json_data});
                            }
                        }
                    } else {
                        response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0});
                    }
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