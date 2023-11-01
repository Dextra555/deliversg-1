require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var mongoose = require('mongoose');
var Order = require('mongoose').model('order');
var Provider = require('mongoose').model('provider');
var Request = require('mongoose').model('request');
var console = require('../utils/console');

var utils = require('../utils/utils');

// admin_history
exports.admin_history_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {
            var Provider = require('mongoose').model('provider');
            var User = require('mongoose').model('user');
            var Store = require('mongoose').model('store');
            var Cart = require('mongoose').model('cart');
            var Order_payment = require('mongoose').model('order_payment');
            var request_data_body = request_data.body;
            Order.findOne({ _id: request_data_body.order_id }, function (err, order_detail) {
                Provider.findOne({ _id: request_data_body.provider_id }, function (err, provider_detail) {
                    User.findOne({ _id: order_detail.user_id }, function (err, user_detail) {
                        Store.findOne({ _id: order_detail.store_id }, function (err, store_detail) {
                            Order_payment.findOne({ _id: order_detail.order_payment_id }, function (err, order_payment_detail) {
                                Cart.findOne({ _id: order_detail.cart_id }, function (err, cart_detail) {
                                    response_data.json({
                                        success: true,
                                        message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
                                        user_detail: user_detail,
                                        store_detail: store_detail,
                                        order_payment_detail: order_payment_detail,
                                        order_detail: order_detail,
                                        provider_detail: provider_detail,
                                        cart_detail: cart_detail
                                    });
                                })
                            })
                        })
                    })
                })
            })

        } else {
            response_data.json(response);
        }
    });
};
exports.admin_history = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'start_date' }, { name: 'end_date' }], function (response) {
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
                    var end_date = request_data_body.end_date;
                    end_date = new Date(end_date);
                    end_date = end_date.setHours(23, 59, 59, 999);
                    end_date = new Date(end_date);
                } else {
                    var start_date = request_data_body.start_date;
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

            var request_query = {
                $lookup:
                {
                    from: "requests",
                    localField: "request_id",
                    foreignField: "_id",
                    as: "request_detail"
                }
            };

            var array_to_json_request_query = {
                $unwind: {
                    path: "$request_detail",
                    preserveNullAndEmptyArrays: true
                }
            };


            var number_of_rec = request_data_body.no_of_records;
            var page = request_data_body.page;

            var order_status_id = request_data_body.order_status_id;

            var payment_status_condition = { $match: {} }
            if (request_data_body.payment_status != 'all') {
                if (request_data_body.payment_status == 'true') {
                    payment_status_condition = { "$match": { 'is_payment_mode_cash': { $eq: true } } };
                } else {
                    payment_status_condition = { "$match": { 'is_payment_mode_cash': { $eq: false } } };
                }
            }

            var pickup_type = request_data_body.pickup_type;
            var pickup_type_condition = { $match: {} }
            if (pickup_type != 'both') {
                if (request_data_body.pickup_type == 'true') {
                    pickup_type_condition = { "$match": { 'is_user_pick_up_order': { $eq: true } } };
                } else {
                    pickup_type_condition = { "$match": { 'is_user_pick_up_order': { $eq: false } } };
                }
            }

            var order_type = request_data_body.order_type;
            var order_type_condition = { $match: {} }
            if (order_type != 'both') {
                if (request_data_body.order_type == 'true') {
                    order_type_condition = { "$match": { 'is_schedule_order': { $eq: true } } };
                } else {
                    order_type_condition = { "$match": { 'is_schedule_order': { $eq: false } } };
                }
            }

            var created_by = request_data_body.created_by;
            var created_by_condition = { $match: {} }
            if (created_by != 'both') {
                created_by_condition = { "$match": { 'order_type': { $eq: Number(created_by) } } };
            }

            /*var search_field = request_data_body.search_field;
            var search_value = request_data_body.search_value;*/
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};



            if (request_data_body.user_name !== "") {
                request_data_body.user_name = request_data_body.user_name.replace(/^\s+|\s+$/g, '');
                request_data_body.user_name = request_data_body.user_name.replace(/ +(?= )/g, '');

                query1['user_detail.name'] = { $regex: new RegExp(request_data_body.user_name, 'i') };

            }
            if (request_data_body.store_name !== "") {
                request_data_body.store_name = request_data_body.store_name.replace(/^\s+|\s+$/g, '');
                request_data_body.store_name = request_data_body.store_name.replace(/ +(?= )/g, '');

                query2['store_detail.name'] = { $regex: new RegExp(request_data_body.store_name, 'i') };

            }
            if (request_data_body.provider_name !== "") {
                request_data_body.provider_name = request_data_body.provider_name.replace(/^\s+|\s+$/g, '');
                request_data_body.provider_name = request_data_body.provider_name.replace(/ +(?= )/g, '');

                query4['provider_detail.name'] = { $regex: new RegExp(request_data_body.provider_name, 'i') };

            }
            if (request_data_body.unique_id && request_data_body.unique_id !== "") {

                query3['unique_id'] = Number(request_data_body.unique_id);

            }

            var search = { "$match": { $and: [query1, query2, query3, query4] } };
            var filter = { "$match": { "completed_at": { $gte: start_date, $lt: end_date } } };
            var sort = { "$sort": {} };
            sort["$sort"]['unique_id'] = parseInt(-1);
            var count = { $group: { _id: null, total: { $sum: 1 }, data: { $push: '$data' } } };
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;
            var condition1 = { "$match": { $and: [{ 'order_status_id': { $ne: ORDER_STATUS_ID.RUNNING } }, { 'order_status_id': { $ne: ORDER_STATUS_ID.IDEAL } }] } };

            var order_status_id_condition = { $match: {} }
            if (order_status_id != '') {
                order_status_id_condition = { $match: { order_status_id: { $eq: Number(order_status_id) } } }
            }
            var project = {
                $project: {
                    delivery_type: "$delivery_type",
                    unique_id: "$unique_id",
                    provider_detail: "$provider_detail",
                    created_at: "$created_at",
                    completed_at: "$completed_at",
                    user_detail: "$user_detail",
                    store_detail: "$store_detail",
                    delivery_type: "$delivery_type",
                    order_status: "$order_status",
                    is_paid_from_wallet: "$is_paid_from_wallet",
                    is_payment_mode_cash: "$is_payment_mode_cash",
                    updated_at: "$updated_at",
                    user_id: "$user_id",
                    total: "$total",
                    timezone: "$timezone",
                    cancellation_reason: "$request_detail.cancel_reasons",
                    cancel_reason: "$cancel_reason"
                }
            }

            var count = {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    results: {
                        $push: '$$ROOT'
                    }
                }
            }

            var slice = {
                $project: {
                    _id: 0,
                    count: 1,
                    results: {
                        $slice: ['$results', page ? (page - 1) * number_of_rec : 0, number_of_rec]
                    }
                }
            }

            if (page) {

                // skip, limit
                Order.aggregate([filter, condition1, created_by_condition, order_type_condition, order_status_id_condition, request_query, array_to_json_request_query, pickup_type_condition, payment_status_condition, sort, project, search, count, slice]).then((orders) => {

                    if (orders.length <= 0 || !orders[0] || orders[0].count === 0) {
                        response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
                    } else {
                        response_data.json({
                            success: true,
                            message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
                            orders: orders[0].results,
                            count: orders[0].count,
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
                Order.aggregate([filter, condition1, created_by_condition, order_type_condition, order_status_id_condition, request_query, array_to_json_request_query, pickup_type_condition, payment_status_condition, sort, search]).then((orders) => {
                    if (orders.length === 0) {
                        response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
                    } else {
                        response_data.json({
                            success: true,
                            message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
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
            }
        } else {
            response_data.json(response);
        }
    });
};

// admin get_order_data
exports.get_order_data = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'order_id', type: 'string' }], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var order_condition = { "$match": { '_id': { $eq: mongoose.Types.ObjectId(request_data_body.order_id) } } };

            var user_query = {
                $lookup:
                {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user_detail"
                }
            };
            var array_to_json_user_detail = { $unwind: "$user_detail" };
            var store_query = {
                $lookup:
                {
                    from: "stores",
                    localField: "store_id",
                    foreignField: "_id",
                    as: "store_detail"
                }
            };
            var array_to_json_store_detail = {
                $unwind: {
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
            var array_to_json_cart_query = { $unwind: "$cart_detail" };

            var city_query = {
                $lookup:
                {
                    from: "cities",
                    localField: "city_id",
                    foreignField: "_id",
                    as: "city_detail"
                }
            };

            var array_to_json_city_detail = { $unwind: "$city_detail" };

            var country_query = {
                $lookup:
                {
                    from: "countries",
                    localField: "country_id",
                    foreignField: "_id",
                    as: "country_detail"
                }
            };

            var array_to_json_country_query = { $unwind: "$country_detail" };

            var order_payment_query = {
                $lookup:
                {
                    from: "order_payments",
                    localField: "order_payment_id",
                    foreignField: "_id",
                    as: "order_payment_detail"
                }
            };
            var array_to_json_order_payment_query = { $unwind: "$order_payment_detail" };


            var request_query = {
                $lookup:
                {
                    from: "requests",
                    localField: "request_id",
                    foreignField: "_id",
                    as: "request_detail"
                }
            };

            var array_to_json_request_query = {
                $unwind: {
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

            Order.aggregate([order_condition, user_query, store_query, cart_query, city_query, country_query, order_payment_query, request_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_order_payment_query,
                array_to_json_cart_query, array_to_json_city_detail, array_to_json_country_query, array_to_json_request_query, provider_query


            ]).then((order) => {
                if (order.length === 0) {
                    response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
                } else {

                    response_data.json({
                        success: true,
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

// delivery_list_search_sort
exports.delivery_list_search_sort = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var orders_array_unwind = { $unwind: "$orders" };
            var order_query = {
                $lookup:
                {
                    from: "orders",
                    localField: "orders.order_id",
                    foreignField: "_id",
                    as: "order_detail"
                }
            };
            var array_to_json_order_query = { $unwind: "$order_detail" };

            // var order_condition = {"$match": {$and: [{'order_detail.request_id': {$ne: null}}, {'order_detail.order_status_id': {$ne: ORDER_STATUS_ID.RUNNING}}]}};
            var order_condition = { $match: { 'order_detail.order_status_id': { $eq: ORDER_STATUS_ID.RUNNING } } };

            var number_of_rec = Number(request_data_body.no_of_records);
            var page = request_data_body.page;

            var request_status = request_data_body.request_status;
            /*var search_field = request_data_body.search_field;
            var search_value = request_data_body.search_value;*/
            var query1 = {};
            var query2 = {};
            var query3 = {};
            var query4 = {};

            
            var search = { "$match": {$and: []} };
            
            if (request_data_body.user_name && request_data_body.user_name !== "") {
                request_data_body.user_name = request_data_body.user_name.replace(/^\s+|\s+$/g, '');
                request_data_body.user_name = request_data_body.user_name.replace(/ +(?= )/g, '');

                search.$match.$and.push({'user_detail.name' : { $regex: new RegExp(request_data_body.user_name, 'i') }})

            }
            if (request_data_body.store_name && request_data_body.store_name !== "") {
                request_data_body.store_name = request_data_body.store_name.replace(/^\s+|\s+$/g, '');
                request_data_body.store_name = request_data_body.store_name.replace(/ +(?= )/g, '');

                search.$match.$and.push({'store_detail.name' : { $regex: new RegExp(request_data_body.store_name, 'i') }});

            }
            if (request_data_body.provider_name && request_data_body.provider_name !== "") {
                request_data_body.provider_name = request_data_body.provider_name.replace(/^\s+|\s+$/g, '');
                request_data_body.provider_name = request_data_body.provider_name.replace(/ +(?= )/g, '');

                search.$match.$and.push({'provider_detail.name' : { $regex: new RegExp(request_data_body.provider_name, 'i') }});

            }
            // if (request_data_body.unique_id && request_data_body.unique_id !== "") {

            //     query3['unique_id'] = Number(request_data_body.unique_id);

            // }
            if(search.$match.$and.length === 0){
                search = {"$match": {}}
            }

            var sort = { "$sort": {} };
            sort["$sort"]['order_unique_id'] = parseInt(-1);
            var count = { $group: { _id: null, total: { $sum: 1 }, data: { $push: '$data' } } };

            var request_status_condition = { $match: {} };
            if (request_status != '') {
                request_status_condition = { $match: { delivery_status: Number(request_status) } }
            }


            var pickup_type = request_data_body.pickup_type;
            var pickup_type_condition = { $match: {} }
            if (pickup_type != 'both') {
                if (request_data_body.pickup_type == 'true') {
                    pickup_type_condition = { "$match": { 'order_detail.is_user_pick_up_order': { $eq: true } } };
                } else {
                    pickup_type_condition = { "$match": { 'order_detail.is_user_pick_up_order': { $eq: false } } };

                }
            }

            var payment_status_condition = { $match: {} }
            if (request_data_body.payment_status != 'all') {
                if (request_data_body.payment_status == 'true') {
                    payment_status_condition = { "$match": { 'order_detail.is_payment_mode_cash': { $eq: true } } };
                } else {
                    payment_status_condition = { "$match": { 'order_detail.is_payment_mode_cash': { $eq: false } } };
                }
            }
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
            var filter = { "$match": { "created_at": { $gte: start_date, $lt: end_date } } };
            var delivery_status_condition = { "$match": { 'delivery_status': { $gte: ORDER_STATE.WAITING_FOR_DELIVERY_MAN } } };
            var delivery_status_manage_id_condition = { "$match": { 'delivery_status_manage_id': { $ne: ORDER_STATUS_ID.COMPLETED } } };
            var project = {
                $project: {
                    created_at: "$created_at",
                    timezone: "$timezone",
                    user_detail: "$user_detail",
                    provider_detail: "$provider_detail",
                    is_paid_from_wallet: "$is_paid_from_wallet",
                    is_payment_mode_cash: "$is_payment_mode_cash",
                    store_detail: "$store_detail",
                    pickup_addresses: "$pickup_addresses",
                    destination_addresses: "$destination_addresses",
                    delivery_type: "$delivery_type",
                    delivery_status: "$delivery_status",
                    city_id: "$city_id",
                    user_id: "$user_id",
                    current_provider: "$current_provider",
                    order_unique_id: "$order_detail.unique_id",
                    unique_id: "$order_detail.unique_id",
                    total: "$order_detail.total",
                    order_id: "$order_detail._id"
                }
            }
            if (page) {
                var skip = {};
                skip["$skip"] = (page * number_of_rec) - number_of_rec;
                var limit = {};
                limit["$limit"] = number_of_rec;

                Request.aggregate([filter, delivery_status_condition, request_status_condition, delivery_status_manage_id_condition, orders_array_unwind, order_query, array_to_json_order_query, order_condition, payment_status_condition, project, sort, search]).then((total_requests) => {
                    var pages = Math.ceil(total_requests.length / number_of_rec);
                    Request.aggregate([filter, delivery_status_condition, request_status_condition, delivery_status_manage_id_condition, orders_array_unwind, order_query, array_to_json_order_query, order_condition, payment_status_condition, project, sort, search, skip, limit]).then((requests) => {
                    if (requests.length === 0) {
                        response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
                    } else {
                        response_data.json({
                            success: true,
                            message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
                            requests: requests,
                            pages
                        });
                    }
                }, (error) => {
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                });
            });

            } else {
                Request.aggregate([filter, delivery_status_condition, request_status_condition, delivery_status_manage_id_condition, orders_array_unwind, order_query, array_to_json_order_query, order_condition, payment_status_condition, sort, search]).then((requests) => {
                    if (requests.length === 0) {
                        response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
                    } else {
                        response_data.json({
                            success: true,
                            message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
                            requests: requests
                        });
                    }
                }, (error) => {
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
exports.admin_requests_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {
            var User = require('mongoose').model('user');
            var Store = require('mongoose').model('store');
            var Cart = require('mongoose').model('cart');
            var Order_payment = require('mongoose').model('order_payment');
            var request_data_body = request_data.body;
            Order.findOne({ request_id: request_data_body.order_detail_id }, function (err, order_detail) {

                Request.findOne({ _id: order_detail.request_id }, function (err, request_detail) {
                    User.findOne({ _id: order_detail.user_id }, function (err, user_detail) {
                        Store.findOne({ _id: order_detail.store_id }, function (err, store_detail) {
                            Order_payment.findOne({ _id: order_detail.order_payment_id }, function (err, order_payment_detail) {
                                Cart.findOne({ _id: order_detail.cart_id }, function (err, cart_detail) {
                                    Provider.findOne({ _id: request_data_body.provider_id }, function (err, provider_detail) {
                                        response_data.json({
                                            success: true,
                                            message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
                                            user_detail: user_detail,
                                            store_detail: store_detail,
                                            order_payment_detail: order_payment_detail,
                                            order_detail: order_detail,
                                            request_detail,
                                            provider_detail: provider_detail,
                                            cart_detail: cart_detail
                                        });
                                    })
                                })
                            })
                        })
                    })
                })
            })

        } else {
            response_data.json(response);
        }
    });
};
// view_history
exports.view_history = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'id', type: 'string' }, { name: 'type' }, { name: 'start_date' }, { name: 'end_date' }], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var type = request_data_body.type;

            var condition1 = { $match: {} };

            if (type == 2) {
                condition1 = { "$match": { 'user_id': { $eq: mongoose.Types.ObjectId(request_data_body.id) } } };
            } else if (type == 3) {
                condition1 = { "$match": { 'store_id': { $eq: mongoose.Types.ObjectId(request_data_body.id) } } };
            }

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
            var array_to_json_user_detail = { $unwind: "$user_detail" };
            var store_query = {
                $lookup:
                {
                    from: "stores",
                    localField: "store_id",
                    foreignField: "_id",
                    as: "store_detail"
                }
            };
            var array_to_json_store_detail = {
                $unwind: {
                    path: "$store_detail",
                    preserveNullAndEmptyArrays: true
                }
            };
            var order_payment_query = {
                $lookup:
                {
                    from: "order_payments",
                    localField: "order_payment_id",
                    foreignField: "_id",
                    as: "order_payment_detail"
                }
            };
            var array_to_json_order_payment_query = { $unwind: "$order_payment_detail" };

            var payment_gateway_query = {
                $lookup:
                {
                    from: "payment_gateways",
                    localField: "order_payment_detail.payment_id",
                    foreignField: "_id",
                    as: "payment_gateway_detail"
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
            var array_to_json_city_query = { $unwind: "$city_detail" };

            var request_query = {
                $lookup: {
                    from: "requests",
                    localField: "request_id",
                    foreignField: "_id",
                    as: "request_detail"
                }
            };
            var array_to_json_request_query =
            {
                $unwind: {
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

            var sort_field = request_data_body.sort_field;
            var sort_order = request_data_body.sort_order;
            var search_field = request_data_body.search_field;
            var search_value = request_data_body.search_value;
            search_value = search_value.replace(/^\s+|\s+$/g, '');
            search_value = search_value.replace(/ +(?= )/g, '');

            if (search_field === "user_detail.first_name") {
                var query1 = {};
                var query2 = {};
                var query3 = {};
                var query4 = {};
                var query5 = {};
                var query6 = {};
                var full_name = search_value.split(' ');
                if (typeof full_name[0] === 'undefined' || typeof full_name[1] === 'undefined') {

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['user_detail.last_name'] = { $regex: new RegExp(search_value, 'i') };
                    var search = { "$match": { $or: [query1, query2] } };
                } else {

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['user_detail.last_name'] = { $regex: new RegExp(search_value, 'i') };
                    query3[search_field] = { $regex: new RegExp(full_name[0], 'i') };
                    query4['user_detail.last_name'] = { $regex: new RegExp(full_name[0], 'i') };
                    query5[search_field] = { $regex: new RegExp(full_name[1], 'i') };
                    query6['user_detail.last_name'] = { $regex: new RegExp(full_name[1], 'i') };
                    var search = { "$match": { $or: [query1, query2, query3, query4, query5, query6] } };
                }
            } else if (search_field === "provider_detail.first_name") {
                var query1 = {};
                var query2 = {};
                var query3 = {};
                var query4 = {};
                var query5 = {};
                var query6 = {};
                var full_name = search_value.split(' ');
                if (typeof full_name[0] === 'undefined' || typeof full_name[1] === 'undefined') {

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['provider_detail.last_name'] = { $regex: new RegExp(search_value, 'i') };
                    var search = { "$match": { $or: [query1, query2] } };
                } else {

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['provider_detail.last_name'] = { $regex: new RegExp(search_value, 'i') };
                    query3[search_field] = { $regex: new RegExp(full_name[0], 'i') };
                    query4['provider_detail.last_name'] = { $regex: new RegExp(full_name[0], 'i') };
                    query5[search_field] = { $regex: new RegExp(full_name[1], 'i') };
                    query6['provider_detail.last_name'] = { $regex: new RegExp(full_name[1], 'i') };
                    var search = { "$match": { $or: [query1, query2, query3, query4, query5, query6] } };
                }
            } else if (search_field === "store_detail.name") {
                var query1 = {};
                var query2 = {};
                var query3 = {};
                var query4 = {};
                var query5 = {};
                var query6 = {};
                var full_name = search_value.split(' ');
                if (typeof full_name[0] === 'undefined' || typeof full_name[1] === 'undefined') {

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['store_detail.name'] = { $regex: new RegExp(search_value, 'i') };
                    var search = { "$match": { $or: [query1, query2] } };
                } else {

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['store_detail.name'] = { $regex: new RegExp(search_value, 'i') };
                    query3[search_field] = { $regex: new RegExp(full_name[0], 'i') };
                    query4['store_detail.name'] = { $regex: new RegExp(full_name[0], 'i') };
                    query5[search_field] = { $regex: new RegExp(full_name[1], 'i') };
                    query6['store_detail.name'] = { $regex: new RegExp(full_name[1], 'i') };
                    var search = { "$match": { $or: [query1, query2, query3, query4, query5, query6] } };
                }
            } else {
                var query = {};
                query[search_field] = { $regex: new RegExp(search_value, 'i') };
                var search = { "$match": query };
            }
            var filter = { "$match": { "completed_at": { $gte: start_date, $lt: end_date } } };
            var sort = { "$sort": {} };
            sort["$sort"][sort_field] = parseInt(sort_order);
            var count = { $group: { _id: null, total: { $sum: 1 }, data: { $push: '$data' } } };
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;
            var order_condition = { "$match": { 'order_status_id': { $eq: ORDER_STATUS_ID.COMPLETED } } };

            Order.aggregate([condition1, order_condition, user_query, city_query, request_query, order_payment_query, store_query, array_to_json_user_detail, array_to_json_city_query, array_to_json_store_detail, array_to_json_order_payment_query, payment_gateway_query, array_to_json_request_query, provider_query, search, filter, count]).then((orders) => {

                if (orders.length === 0) {
                    response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0 });
                } else {
                    var pages = Math.ceil(orders[0].total / number_of_rec);
                    Order.aggregate([condition1, order_condition, user_query, city_query, request_query, order_payment_query, store_query, array_to_json_user_detail, array_to_json_city_query, array_to_json_store_detail, array_to_json_order_payment_query, payment_gateway_query, array_to_json_request_query, provider_query, sort, search, filter, skip, limit]).then((orders) => {

                        if (orders.length === 0) {
                            response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
                        } else {

                            response_data.json({
                                success: true,
                                message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,
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


// get_request_data
exports.get_request_data = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'request_id', type: 'string' }], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var request_condition = { "$match": { '_id': { $eq: mongoose.Types.ObjectId(request_data_body.request_id) } } };
            var user_query = {
                $lookup:
                {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user_detail"
                }
            };
            var array_to_json_user_detail = { $unwind: "$user_detail" };
            var orders_array_unwind = { $unwind: "$orders" };
            var order_query = {
                $lookup:
                {
                    from: "orders",
                    localField: "orders.order_id",
                    foreignField: "_id",
                    as: "order_detail"
                }
            };

            var array_to_json_order_query = { $unwind: "$order_detail" };

            var cart_query = {
                $lookup:
                {
                    from: "carts",
                    localField: "orders.cart_id",
                    foreignField: "_id",
                    as: "cart_detail"
                }
            };

            var array_to_json_cart_query = { $unwind: "$cart_detail" };
            var order_payment_query = {
                $lookup:
                {
                    from: "order_payments",
                    localField: "orders.order_payment_id",
                    foreignField: "_id",
                    as: "order_payment_detail"
                }
            };

            var array_to_json_order_payment_query = { $unwind: "$order_payment_detail" };
            var provider_query = {
                $lookup:
                {
                    from: "providers",
                    localField: "current_provider",
                    foreignField: "_id",
                    as: "provider_detail"
                }
            };

            var payment_gateway_query = {
                $lookup:
                {
                    from: "payment_gateways",
                    localField: "order_payment_detail.payment_id",
                    foreignField: "_id",
                    as: "payment_gateway_detail"
                }
            };


            var store_query = {
                $lookup:
                {
                    from: "stores",
                    localField: "order_detail.store_id",
                    foreignField: "_id",
                    as: "store_detail"
                }
            };
            var array_to_json_store_detail = {
                $unwind: {
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

            var array_to_json_city_detail = { $unwind: "$city_detail" };

            var country_query = {
                $lookup:
                {
                    from: "countries",
                    localField: "city_detail.country_id",
                    foreignField: "_id",
                    as: "country_detail"
                }
            };

            var array_to_json_country_query = { $unwind: "$country_detail" };

            Request.aggregate([request_condition, user_query, array_to_json_user_detail, city_query, array_to_json_city_detail, country_query, array_to_json_country_query, orders_array_unwind, order_query, array_to_json_order_query, cart_query, array_to_json_cart_query, order_payment_query, array_to_json_order_payment_query, store_query, array_to_json_store_detail, provider_query,
            ]).then((request) => {

                if (request.length === 0) {
                    response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
                } else {

                    response_data.json({
                        success: true,
                        message: ORDER_MESSAGE_CODE.GET_ORDER_DATA_SUCCESSFULLY,
                        request: request[0]
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


// view_history
exports.view_provider_history = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'start_date' }, { name: 'end_date' }], function (response) {
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
            var array_to_json_user_detail = { $unwind: "$user_detail" };

            var orders_array_unwind = { $unwind: "$orders" };

            var order_query = {
                $lookup:
                {
                    from: "orders",
                    localField: "orders.order_id",
                    foreignField: "_id",
                    as: "order_detail"
                }
            };

            var array_to_json_order_query = { $unwind: "$order_detail" };

            var store_query = {
                $lookup:
                {
                    from: "stores",
                    localField: "order_detail.store_id",
                    foreignField: "_id",
                    as: "store_detail"
                }
            };
            var array_to_json_store_detail = {
                $unwind: {
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

            var array_to_json_city_query = { $unwind: "$city_detail" };



            var order_payment_query = {
                $lookup:
                {
                    from: "order_payments",
                    localField: "orders.order_payment_id",
                    foreignField: "_id",
                    as: "order_payment_detail"
                }
            };

            var array_to_json_order_payment_query = { $unwind: "$order_payment_detail" };


            var provider_query = {
                $lookup:
                {
                    from: "providers",
                    localField: "current_provider",
                    foreignField: "_id",
                    as: "provider_detail"
                }
            };

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
            var sort_request = request_data_body.sort_request;
            var search_field = request_data_body.search_field;
            var search_value = request_data_body.search_value;
            search_value = search_value.replace(/^\s+|\s+$/g, '');
            search_value = search_value.replace(/ +(?= )/g, '');
            if (search_field === "user_detail.first_name") {
                var query1 = {};
                var query2 = {};
                var query3 = {};
                var query4 = {};
                var query5 = {};
                var query6 = {};
                var full_name = search_value.split(' ');
                if (typeof full_name[0] === 'undefined' || typeof full_name[1] === 'undefined') {

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['user_detail.last_name'] = { $regex: new RegExp(search_value, 'i') };
                    var search = { "$match": { $or: [query1, query2] } };
                } else {

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['user_detail.last_name'] = { $regex: new RegExp(search_value, 'i') };
                    query3[search_field] = { $regex: new RegExp(full_name[0], 'i') };
                    query4['user_detail.last_name'] = { $regex: new RegExp(full_name[0], 'i') };
                    query5[search_field] = { $regex: new RegExp(full_name[1], 'i') };
                    query6['user_detail.last_name'] = { $regex: new RegExp(full_name[1], 'i') };
                    var search = { "$match": { $or: [query1, query2, query3, query4, query5, query6] } };
                }
            } else if (search_field === "provider_detail.first_name") {
                var query1 = {};
                var query2 = {};
                var query3 = {};
                var query4 = {};
                var query5 = {};
                var query6 = {};
                var full_name = search_value.split(' ');
                if (typeof full_name[0] === 'undefined' || typeof full_name[1] === 'undefined') {

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['provider_detail.last_name'] = { $regex: new RegExp(search_value, 'i') };
                    var search = { "$match": { $or: [query1, query2] } };
                } else {

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['provider_detail.last_name'] = { $regex: new RegExp(search_value, 'i') };
                    query3[search_field] = { $regex: new RegExp(full_name[0], 'i') };
                    query4['provider_detail.last_name'] = { $regex: new RegExp(full_name[0], 'i') };
                    query5[search_field] = { $regex: new RegExp(full_name[1], 'i') };
                    query6['provider_detail.last_name'] = { $regex: new RegExp(full_name[1], 'i') };
                    var search = { "$match": { $or: [query1, query2, query3, query4, query5, query6] } };
                }
            } else {
                var query = {};
                query[search_field] = { $regex: new RegExp(search_value, 'i') };
                var search = { "$match": query };
            }
            var filter = { "$match": { "completed_at": { $gte: start_date, $lt: end_date } } };
            var sort = { "$sort": {} };
            sort["$sort"][sort_field] = parseInt(sort_request);
            var count = { $group: { _id: null, total: { $sum: 1 }, data: { $push: '$data' } } };
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;

            var provider_condition = { "$match": { 'current_provider': { $eq: mongoose.Types.ObjectId(request_data_body.provider_id) } } };

            var delivery_status_condition = { "$match": { $or: [{ delivery_status: ORDER_STATE.ORDER_COMPLETED }, { delivery_status: ORDER_STATE.STORE_CANCELLED_REQUEST }, { delivery_status: ORDER_STATE.DELIVERY_MAN_CANCELLED }] } };
            var delivery_status_manage_id_condition = { "$match": { $or: [{ delivery_status_manage_id: ORDER_STATUS_ID.COMPLETED }, { delivery_status_manage_id: ORDER_STATUS_ID.CANCELLED }] } };


            Request.aggregate([provider_condition, delivery_status_condition, delivery_status_manage_id_condition, user_query, orders_array_unwind, order_query, array_to_json_order_query
                , order_payment_query, city_query, store_query, provider_query, array_to_json_user_detail, array_to_json_city_query, array_to_json_store_detail, array_to_json_order_payment_query, payment_gateway_query

                , search, filter, count
            ]).then((requests) => {
                if (requests.length === 0) {
                    response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0 });
                } else {

                    var timezone = "";
                    if (setting_detail) {
                        timezone = setting_detail.admin_panel_timezone;
                    }
                    var pages = Math.ceil(requests[0].total / number_of_rec);
                    if (page) {
                        Request.aggregate([provider_condition, delivery_status_condition, delivery_status_manage_id_condition, user_query, orders_array_unwind, order_query, array_to_json_order_query
                            , order_payment_query, city_query, store_query, provider_query, array_to_json_user_detail, array_to_json_city_query, array_to_json_store_detail, array_to_json_order_payment_query, payment_gateway_query

                            , sort, search, filter, skip, limit
                        ]).then((requests) => {
                            if (requests.length === 0) {
                                response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
                            } else {
                                response_data.json({
                                    success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,
                                    requests: requests,
                                    timezone: timezone
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

// history_export_excel
exports.history_export_excel = function (request_data, response_data) {
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
            var array_to_json_user_detail = { $unwind: "$user_detail" };
            var store_query = {
                $lookup:
                {
                    from: "stores",
                    localField: "store_id",
                    foreignField: "_id",
                    as: "store_detail"
                }
            };
            var array_to_json_store_detail = {
                $unwind: {
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
            var array_to_json_city_query = { $unwind: "$city_detail" };
            var order_payment_query = {
                $lookup:
                {
                    from: "order_payments",
                    localField: "order_payment_id",
                    foreignField: "_id",
                    as: "order_payment_detail"
                }
            };
            var array_to_json_order_payment_query = { $unwind: "$order_payment_detail" };

            var request_query = {
                $lookup:
                {
                    from: "requests",
                    localField: "request_id",
                    foreignField: "_id",
                    as: "request_detail"
                }
            };

            var array_to_json_request_query = {
                $unwind: {
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


            if (search_field === "user_detail.first_name") {
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

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['user_detail.last_name'] = { $regex: new RegExp(search_value, 'i') };
                    var search = { "$match": { $or: [query1, query2] } };
                } else {

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['user_detail.last_name'] = { $regex: new RegExp(search_value, 'i') };
                    query3[search_field] = { $regex: new RegExp(full_name[0], 'i') };
                    query4['user_detail.last_name'] = { $regex: new RegExp(full_name[0], 'i') };
                    query5[search_field] = { $regex: new RegExp(full_name[1], 'i') };
                    query6['user_detail.last_name'] = { $regex: new RegExp(full_name[1], 'i') };
                    var search = { "$match": { $or: [query1, query2, query3, query4, query5, query6] } };
                }
            } else if (search_field === "provider_detail.first_name") {
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

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['provider_detail.last_name'] = { $regex: new RegExp(search_value, 'i') };
                    var search = { "$match": { $or: [query1, query2] } };
                } else {

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['provider_detail.last_name'] = { $regex: new RegExp(search_value, 'i') };
                    query3[search_field] = { $regex: new RegExp(full_name[0], 'i') };
                    query4['provider_detail.last_name'] = { $regex: new RegExp(full_name[0], 'i') };
                    query5[search_field] = { $regex: new RegExp(full_name[1], 'i') };
                    query6['provider_detail.last_name'] = { $regex: new RegExp(full_name[1], 'i') };
                    var search = { "$match": { $or: [query1, query2, query3, query4, query5, query6] } };
                }
            } else if (search_field === "store_detail.name") {
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

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['store_detail.name'] = { $regex: new RegExp(search_value, 'i') };
                    var search = { "$match": { $or: [query1, query2] } };
                } else {

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['store_detail.name'] = { $regex: new RegExp(search_value, 'i') };
                    query3[search_field] = { $regex: new RegExp(full_name[0], 'i') };
                    query4['store_detail.name'] = { $regex: new RegExp(full_name[0], 'i') };
                    query5[search_field] = { $regex: new RegExp(full_name[1], 'i') };
                    query6['store_detail.name'] = { $regex: new RegExp(full_name[1], 'i') };
                    var search = { "$match": { $or: [query1, query2, query3, query4, query5, query6] } };
                }
            } else if (search_field == 'unique_id') {
                var query = {};
                if (search_value !== "") {
                    search_value = Number(search_value);
                    query[search_field] = search_value;
                    var search = { "$match": query };
                }
            } else {
                var query = {};
                query[search_field] = { $regex: new RegExp(search_value, 'i') };
                var search = { "$match": query };
            }
            var filter = { "$match": { "completed_at": { $gte: start_date, $lt: end_date } } };
            var sort = { "$sort": {} };
            sort["$sort"][sort_field] = parseInt(sort_order);
            var count = { $group: { _id: null, total: { $sum: 1 }, data: { $push: '$data' } } };
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;
            var condition = { "$match": { 'order_status_id': { $ne: ORDER_STATUS_ID.RUNNING } } };


            var group = {
                $group: {
                    _id: null,
                    data: {
                        $push: {
                            user_first_name: "$user_detail.first_name",
                            user_last_name: "$user_detail.last_name",
                            store: '$store_detail.name',
                            city: "$city_detail.city_name",
                            provider_first_name: "$provider_detail.first_name",
                            provider_last_name: "$provider_detail.last_name",
                            amount: "$order_payment_detail.total",
                            date: "$created_at"
                        }
                    }
                }
            };
            var project = { $project: { data: 1 } }

            Order.aggregate([condition, user_query, order_payment_query, city_query, store_query, request_query, array_to_json_request_query, provider_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_city_query, array_to_json_order_payment_query, payment_gateway_query, search, group, project]).then((orders) => {

                if (orders.length === 0) {
                    response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0 });
                } else {

                    var json_data = [];
                    if (orders[0].data.length > 0) {
                        var order_data = orders[0].data;
                        for (var i = 0; i < order_data.length;) {
                            var city = '';
                            var order_status = "";

                            var provider_first_name = '';
                            var provider_last_name = '';

                            city = order_data[i].city;
                            if (order_data[i].provider_first_name.length > 0) {
                                provider_first_name = order_data[i].provider_first_name[0];
                                provider_last_name = order_data[i].provider_last_name[0];
                            }
                            json_data.push({
                                "User": order_data[i].user_first_name + " " + order_data[i].user_last_name,
                                "Store": order_data[i].store,
                                "City": city,
                                "Provider": provider_first_name + " " + provider_last_name,
                                "Amount": order_data[i].amount,
                                "Date": order_data[i].date
                            });
                            i++;
                            if (orders[0].data.length == i) {
                                response_data.json({
                                    success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
                                    orders: json_data
                                });
                            }
                        }
                    } else {
                        response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0 });
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

// deliveries_export_excel
exports.deliveries_export_excel = function (request_data, response_data) {
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
            var array_to_json_user_detail = { $unwind: "$user_detail" };
            var orders_array_unwind = { $unwind: "$orders" };
            var order_query = {
                $lookup:
                {
                    from: "orders",
                    localField: "orders.order_id",
                    foreignField: "_id",
                    as: "order_detail"
                }
            };

            var array_to_json_order_query = { $unwind: "$order_detail" };
            var store_query = {
                $lookup:
                {
                    from: "stores",
                    localField: "order_detail.store_id",
                    foreignField: "_id",
                    as: "store_detail"
                }
            };
            var array_to_json_store_detail = {
                $unwind: {
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

            var array_to_json_city_query = { $unwind: "$city_detail" };
            var order_payment_query = {
                $lookup:
                {
                    from: "order_payments",
                    localField: "orders.order_payment_id",
                    foreignField: "_id",
                    as: "order_payment_detail"
                }
            };

            var array_to_json_order_payment_query = { $unwind: "$order_payment_detail" };
            var provider_query = {
                $lookup:
                {
                    from: "providers",
                    localField: "current_provider",
                    foreignField: "_id",
                    as: "provider_detail"
                }
            };

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

            if (search_field === "user_detail.first_name") {
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

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['user_detail.last_name'] = { $regex: new RegExp(search_value, 'i') };
                    var search = { "$match": { $or: [query1, query2] } };
                } else {

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['user_detail.last_name'] = { $regex: new RegExp(search_value, 'i') };
                    query3[search_field] = { $regex: new RegExp(full_name[0], 'i') };
                    query4['user_detail.last_name'] = { $regex: new RegExp(full_name[0], 'i') };
                    query5[search_field] = { $regex: new RegExp(full_name[1], 'i') };
                    query6['user_detail.last_name'] = { $regex: new RegExp(full_name[1], 'i') };
                    var search = { "$match": { $or: [query1, query2, query3, query4, query5, query6] } };
                }
            } else if (search_field === "provider_detail.first_name") {
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

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['provider_detail.last_name'] = { $regex: new RegExp(search_value, 'i') };
                    var search = { "$match": { $or: [query1, query2] } };
                } else {

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['provider_detail.last_name'] = { $regex: new RegExp(search_value, 'i') };
                    query3[search_field] = { $regex: new RegExp(full_name[0], 'i') };
                    query4['provider_detail.last_name'] = { $regex: new RegExp(full_name[0], 'i') };
                    query5[search_field] = { $regex: new RegExp(full_name[1], 'i') };
                    query6['provider_detail.last_name'] = { $regex: new RegExp(full_name[1], 'i') };
                    var search = { "$match": { $or: [query1, query2, query3, query4, query5, query6] } };
                }
            } else if (search_field === "store_detail.name") {
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

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['store_detail.name'] = { $regex: new RegExp(search_value, 'i') };
                    var search = { "$match": { $or: [query1, query2] } };
                } else {

                    query1[search_field] = { $regex: new RegExp(search_value, 'i') };
                    query2['store_detail.name'] = { $regex: new RegExp(search_value, 'i') };
                    query3[search_field] = { $regex: new RegExp(full_name[0], 'i') };
                    query4['store_detail.name'] = { $regex: new RegExp(full_name[0], 'i') };
                    query5[search_field] = { $regex: new RegExp(full_name[1], 'i') };
                    query6['store_detail.name'] = { $regex: new RegExp(full_name[1], 'i') };
                    var search = { "$match": { $or: [query1, query2, query3, query4, query5, query6] } };
                }
            } else if (search_field == 'unique_id') {
                var query = {};
                if (search_value !== "") {
                    search_value = Number(search_value);
                    query[search_field] = search_value;
                    var search = { "$match": query };
                }
            } else {
                var query = {};
                query[search_field] = { $regex: new RegExp(search_value, 'i') };
                var search = { "$match": query };
            }

            var sort = { "$sort": {} };
            sort["$sort"][sort_field] = parseInt(sort_order);
            var count = { $group: { _id: null, total: { $sum: 1 }, data: { $push: '$data' } } };
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;

            //var delivery_status_condition = {"$match": {'delivery_status': {$gte: ORDER_STATE.WAITING_FOR_DELIVERY_MAN}}};
            var delivery_status_manage_id_condition = { "$match": { 'delivery_status_manage_id': { $eq: ORDER_STATUS_ID.RUNNING } } };

            var group = {
                $group: {
                    _id: null,
                    data: {
                        $push: {
                            user_first_name: "$user_detail.first_name",
                            user_last_name: "$user_detail.last_name",
                            store: '$store_detail.name',
                            city: "$city_detail.city_name",

                            provider_first_name: "$provider_detail.first_name",
                            provider_last_name: "$provider_detail.last_name",
                            amount: "$order_payment_detail.total",
                            date: "$created_at"
                        }
                    }
                }
            };
            var project = { $project: { data: 1 } }

            Request.aggregate([delivery_status_manage_id_condition, user_query, orders_array_unwind, order_query, array_to_json_order_query
                , order_payment_query, city_query, store_query, provider_query, array_to_json_user_detail, array_to_json_city_query, array_to_json_store_detail, array_to_json_order_payment_query, payment_gateway_query

                , search, group, project
            ]).then((requests) => {
                if (requests.length === 0) {
                    response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0 });
                } else {

                    var json_data = [];
                    if (requests[0].data.length > 0) {
                        var request_data = requests[0].data;
                        for (var i = 0; i < request_data.length;) {
                            var city = '';
                            var provider_first_name = '';
                            var provider_last_name = '';
                            city = request_data[i].city;

                            if (request_data[i].provider_first_name.length > 0) {
                                provider_first_name = request_data[i].provider_first_name[0];
                                provider_last_name = request_data[i].provider_last_name[0];
                            }
                            json_data.push({
                                "User": request_data[i].user_first_name + " " + request_data[i].user_last_name,
                                "Store": request_data[i].store,
                                "City": city,
                                "Provider": provider_first_name + " " + provider_last_name,
                                "Amount": request_data[i].amount,
                                "Date": request_data[i].date
                            });
                            i++;
                            if (requests[0].data.length == i) {
                                response_data.json({
                                    success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
                                    requests: json_data
                                });
                            }
                        }
                    } else {
                        response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0 });
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