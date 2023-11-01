'use strict';
require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var console = require('../utils/console');

var Order = require('mongoose').model('order');
var Provider = require('mongoose').model('provider');
var Request = require('mongoose').model('request');
var Review = require('mongoose').model('review');
var User = require('mongoose').model('user')
var TableSettings = require('mongoose').model('table_settings');
var console = require('../utils/console');
var mongoose = require('mongoose');
var OrderPayment = require('mongoose').model('order_payment')
var Store = require('mongoose').model('store')

var utils = require('../utils/utils');

var start = new Date().toDateString();
console.log(start);



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
            sort["$sort"]['unique_id'] = parseInt(-1);
            var count = { $group: { _id: null, total: { $sum: 1 }, data: { $push: '$data' } } };
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;

            var condition = { $match: {} };
            var date = new Date(Date.now()).toLocaleString("en-US", { timeZone: setting_detail.admin_panel_timezone });
            date = new Date(date);
            date = date.setHours(0, 0, 0, 0);
            startdate = new Date(date);
            enddate = new Date(Date.now()).toLocaleString("en-US", { timeZone: setting_detail.admin_panel_timezone });

            enddate = new Date(enddate);
            condition = { $match: { 'created_at': { $gte: startdate, $lt: enddate } } };

            Order.aggregate([condition, user_query, order_payment_query, store_query, city_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_city_query, array_to_json_order_payment_query, payment_gateway_query
                , search, count]).then((orders) => {

                    if (orders.length === 0) {
                        response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0 });
                    } else {

                        var timezone = "";
                        if (setting_detail) {
                            timezone = setting_detail.admin_panel_timezone;
                        }
                        var pages = Math.ceil(orders[0].total / number_of_rec);
                        if (page) {
                            Order.aggregate([condition, user_query, order_payment_query, store_query, city_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_city_query, array_to_json_order_payment_query, payment_gateway_query
                                , sort, search, skip, limit]).then((orders) => {
                                    if (orders.length === 0) {
                                        response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
                                    } else {

                                        response_data.json({
                                            success: true,
                                            message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,
                                            orders: orders,
                                            timezone: timezone
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
                            Order.aggregate([condition, user_query, order_payment_query, store_query, city_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_city_query, array_to_json_order_payment_query, payment_gateway_query
                                , sort, search]).then((orders) => {
                                    if (orders.length === 0) {
                                        response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
                                    } else {

                                        response_data.json({
                                            success: true,
                                            message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,
                                            orders: orders,
                                            timezone: timezone
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
exports.orders_list_export = function (request_data, response_data) {
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
            if (request_data_body.search_field == "user_detail.name") {
                request_data_body.search_field = "user_detail.first_name";
            }
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
            sort["$sort"]["unique_id"] = parseInt(-1);
            var count = { $group: { _id: null, total: { $sum: 1 }, data: { $push: '$data' } } };
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;

            // var order_condition = {$match: {$and: [ {$or: [ {'order_status_id': {$eq: ORDER_STATUS_ID.RUNNING}} , {'order_status_id': {$eq: ORDER_STATUS_ID.IDEAL}} ]} ,{'order_status_manage_id': {$ne: ORDER_STATUS_ID.COMPLETED}} ]}};
            var order_condition = { $match: { $and: [{ $or: [{ 'order_status_id': { $eq: ORDER_STATUS_ID.RUNNING } }, { 'order_status_id': { $eq: ORDER_STATUS_ID.IDEAL } }] }, { $or: [{ 'order_status_manage_id': { $ne: ORDER_STATUS_ID.COMPLETED } }, { 'request_id': { $eq: null } }] }] } };

            var request_status_condition = { $match: {} }
            if (request_data_body.order_status != 'all') {
                request_status_condition = { "$match": { 'order_status': { $eq: Number(request_data_body.order_status) } } };
            }
            var payment_status_condition = { $match: {} }
            if (request_data_body.payment_status != 'all') {
                if (request_data_body.payment_status == 'true') {
                    payment_status_condition = { "$match": { 'order_payment_detail.is_payment_mode_cash': { $eq: true } } };
                } else {
                    payment_status_condition = { "$match": { 'order_payment_detail.is_payment_mode_cash': { $eq: false } } };
                }
            }

            var pickup_type = request_data_body.pickup_type;
            var pickup_type_condition = { $match: {} }
            if (pickup_type != 'both') {
                if (request_data_body.pickup_type == 'true') {
                    payment_status_condition = { "$match": { 'order_payment_detail.is_user_pick_up_order': { $eq: true } } };
                } else {
                    payment_status_condition = { "$match": { 'order_payment_detail.is_user_pick_up_order': { $eq: false } } };
                }
            }

            var created_by = request_data_body.created_by;
            var created_by_condition = { $match: {} }
            if (created_by != 'both') {
                created_by_condition = { "$match": { 'order_type': { $eq: Number(created_by) } } };
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

            Order.aggregate([order_condition, created_by_condition, order_type_condition, user_query, request_status_condition, order_payment_query, store_query, cart_query, array_to_json_cart_query, city_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_city_query, array_to_json_order_payment_query, payment_status_condition, pickup_type_condition, payment_gateway_query
                , search
                , count
            ]).then((orders) => {

                if (orders.length === 0) {
                    response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0 });
                } else {
                    var timezone = "";
                    if (setting_detail) {
                        timezone = setting_detail.admin_panel_timezone;
                    }
                    var pages = Math.ceil(orders[0].total / number_of_rec);
                    if (page) {
                        Order.aggregate([order_condition, created_by_condition, order_type_condition, user_query, request_status_condition, order_payment_query, store_query, city_query, cart_query, array_to_json_cart_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_city_query, array_to_json_order_payment_query, payment_status_condition, pickup_type_condition, payment_gateway_query

                            , sort, search, skip, limit
                        ]).then((orders) => {
                            if (orders.length == 0) {
                                response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
                            } else {
                                response_data.json({
                                    success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,
                                    orders: orders,
                                    timezone: timezone
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
                        Order.aggregate([order_condition, created_by_condition, order_type_condition, request_status_condition, user_query, order_payment_query, store_query, city_query, cart_query, array_to_json_cart_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_city_query, array_to_json_order_payment_query, payment_status_condition, pickup_type_condition, payment_gateway_query
                            , sort, search
                        ]).then((orders) => {
                            if (orders.length == 0) {
                                response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
                            } else {
                                response_data.json({
                                    success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,
                                    orders: orders,
                                    timezone: timezone
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

// admin_orders
exports.admin_orders = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;

            var number_of_rec = Number(request_data_body.no_of_records);
            var page = request_data_body.page;

            /*var search_field = request_data_body.search_field;
            var search_value = request_data_body.search_value;*/
            var query1 = {};
            var query2 = {};
            var query3 = {};



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
            if (request_data_body.unique_id && request_data_body.unique_id !== "") {

                query3['unique_id'] = Number(request_data_body.unique_id);

            }

            var search = { "$match": { $and: [query1, query2, query3] } };

            var sort = { "$sort": {} };
            sort["$sort"]["unique_id"] = parseInt(-1);
            var count = { $group: { _id: null, total: { $sum: 1 }, data: { $push: '$data' } } };
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;

            // var order_condition = {$match: {$and: [ {$or: [ {'order_status_id': {$eq: ORDER_STATUS_ID.RUNNING}} , {'order_status_id': {$eq: ORDER_STATUS_ID.IDEAL}} ]} ,{'order_status_manage_id': {$ne: ORDER_STATUS_ID.COMPLETED}} ]}};
            var order_condition = { $match: { $and: [{ $or: [{ 'order_status_id': { $eq: ORDER_STATUS_ID.RUNNING } }, { 'order_status_id': { $eq: ORDER_STATUS_ID.IDEAL } }] }, { $or: [{ 'order_status_manage_id': { $ne: ORDER_STATUS_ID.COMPLETED } }, { 'request_id': { $eq: null } }] }] } };

            var request_status_condition = { $match: {} }
            if (request_data_body.order_status != 'all') {
                request_status_condition = { "$match": { 'order_status': { $eq: Number(request_data_body.order_status) } } };
            }
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
                    payment_status_condition = { "$match": { 'is_user_pick_up_order': { $eq: true } } };
                } else {
                    payment_status_condition = { "$match": { 'is_user_pick_up_order': { $eq: false } } };
                }
            }

            var created_by = request_data_body.created_by;
            var created_by_condition = { $match: {} }
            if (created_by != 'both') {
                created_by_condition = { "$match": { 'order_type': { $eq: Number(created_by) } } };
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
            var project = {
                $project: {
                    is_schedule_order: "$is_schedule_order",
                    unique_id: "$unique_id",
                    schedule_order_start_at: "$schedule_order_start_at",
                    created_at: "$created_at",
                    user_detail: "$user_detail",
                    store_detail: "$store_detail",
                    order_status: "$order_status",
                    is_paid_from_wallet: "$is_paid_from_wallet",
                    user_id: "$user_id",
                    total: "$total",
                    is_payment_mode_cash: "$is_payment_mode_cash"
                }
            }


            var timezone = "";
            if (setting_detail) {
                timezone = setting_detail.admin_panel_timezone;
            }

            if (page) {
                Order.aggregate([filter, order_condition, created_by_condition, order_type_condition, request_status_condition, payment_status_condition, pickup_type_condition, project, sort, search, skip, limit
                ]).then((orders) => {
                    if (orders.length == 0) {
                        response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
                    } else {
                        response_data.json({
                            success: true,
                            message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
                            orders: orders,
                            timezone: timezone
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
                Order.aggregate([filter, order_condition, created_by_condition, order_type_condition, request_status_condition, payment_status_condition, pickup_type_condition, sort, search
                ]).then((orders) => {
                    if (orders.length == 0) {
                        response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND });
                    } else {
                        response_data.json({
                            success: true,
                            message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
                            orders: orders,
                            timezone: timezone
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

        } else {
            response_data.json(response);
        }
    });
};
exports.admin_orders_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {
            var User = require('mongoose').model('user');
            var Store = require('mongoose').model('store');
            var Cart = require('mongoose').model('cart');
            var Order_payment = require('mongoose').model('order_payment');
            var request_data_body = request_data.body;
            Order.findOne({ _id: request_data_body.order_detail_id }, function (err, order_detail) {
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
                                    cart_detail: cart_detail
                                });
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
// deliveryman_track
exports.deliveryman_track = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'id', type: 'string' }], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var id = request_data_body.id;
            var type = Number(request_data_body.type);
            if (type == 1) {
                Order.findOne({ _id: id }).then((order_detail) => {
                    if (order_detail) {
                        Request.findOne({ _id: order_detail.request_id }).then((request) => {
                            if (request) {
                                Provider.findOne({ _id: request.current_provider }).then((provider_detail) => {
                                    if (provider_detail) {
                                        response_data.json({
                                            success: true,
                                            message: ORDER_MESSAGE_CODE.ORDER_CANCEL_OR_REJECT_BY_PROVIDER_SUCCESSFULLY,
                                            provider: provider_detail

                                        });
                                    } else {
                                        response_data.json({
                                            success: false,
                                            message: ORDER_MESSAGE_CODE.ORDER_CANCEL_OR_REJECT_BY_PROVIDER_SUCCESSFULLY


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
                                response_data.json({
                                    success: false,
                                    message: ORDER_MESSAGE_CODE.ORDER_CANCEL_OR_REJECT_BY_PROVIDER_SUCCESSFULLY
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
                        response_data.json({
                            success: false,
                            message: ORDER_MESSAGE_CODE.ORDER_CANCEL_OR_REJECT_BY_PROVIDER_SUCCESSFULLY
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
                Provider.findOne({ _id: id }).then((provider_detail) => {
                    response_data.json({
                        success: true,
                        message: ORDER_MESSAGE_CODE.ORDER_CANCEL_OR_REJECT_BY_PROVIDER_SUCCESSFULLY,
                        provider: provider_detail

                    });
                }, (error) => {
                    console.log(error)
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
            Order.find({ city_id: request_data_body.city_id, order_status_id: ORDER_STATUS_ID.RUNNING }).then((orders) => {
                if (orders.length == 0) {
                    response_data.json({
                        success: false,
                        message: ORDER_MESSAGE_CODE.ORDER_CANCEL_OR_REJECT_BY_PROVIDER_SUCCESSFULLY
                    });
                } else {
                    response_data.json({
                        success: true,
                        message: ORDER_MESSAGE_CODE.ORDER_CANCEL_OR_REJECT_BY_PROVIDER_SUCCESSFULLY,
                        orders: orders

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

            var order_condition = { "$match": { 'order_status_id': { $ne: ORDER_STATUS_ID.COMPLETED } } };

            var group = {
                $group: {
                    _id: null,
                    data: {
                        $push: {
                            user_first_name: "$user_detail.first_name",
                            user_last_name: "$user_detail.last_name",
                            store: '$store_detail.name',
                            city: "$city_detail.city_name",
                            amount: "$order_payment_detail.total",
                            payment_status: "$order_payment_detail.is_payment_mode_cash",
                            date: "$created_at"
                        }
                    }
                }
            };
            var project = { $project: { data: 1 } }


            Order.aggregate([order_condition, user_query, order_payment_query, store_query, city_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_city_query, array_to_json_order_payment_query, payment_gateway_query
                , search, group, project

            ]).then((orders) => {

                if (orders.length === 0) {
                    response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0 });
                } else {

                    var json_data = [];
                    if (orders[0].data.length > 0) {
                        var order_data = orders[0].data;
                        for (var i = 0; i < order_data.length;) {
                            var city = '';
                            city = order_data[i].city;


                            json_data.push({
                                "User": order_data[i].user_first_name + " " + order_data[i].user_last_name,
                                "Store": order_data[i].store,
                                "City": city,
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

exports.admin_list_orders = function (request_data, response_data) {

    var request_data_body = request_data.body;

    var search_by = null;
    var search_value = null;

    if (request_data_body.query && request_data_body.query.search_by && request_data_body.query.search_value) {
        search_by = request_data_body.query.search_by || null;
        search_value = request_data_body.query.search_value || null;
    }

    var date_filter = { $match: {} }
    var delivery_type_filter = { $match: {} };
    var payment_by_filter = { $match: {} };
    var search_by_filter = { $match: {} };

    // Date Filter
    if (request_data_body.start_date && request_data_body.end_date) {


        var start_date = new Date(request_data_body.start_date);
        var end_date = new Date(request_data_body.end_date);
        start_date = start_date.setHours(0, 0, 0, 0);
        start_date = new Date(start_date);
        end_date = end_date.setHours(23, 59, 59, 999);
        end_date = new Date(end_date);

        var timeZone = "Asia/Calcutta";

        if (request_data_body.timezone && request_data_body.timezone !== "") {
            timeZone = request_data_body.timezone;
        }
        start_date = utils.get_date_in_citytimezone(start_date, timeZone)
        end_date = utils.get_date_in_citytimezone(end_date, timeZone)

        date_filter = {
            $match: {
                schedule_order_start_at: {
                    $gte: start_date, $lt: end_date
                }
            }
        };


    }




    // Search Filter
    if (search_by !== null) {
        search_by_filter = { $match: { $or: [] } };
        switch (search_by) {
            case 'user':
                search_by_filter.$match.$or.push({ "user_detail.name": { '$regex': search_value, '$options': 'i' } })
                break;
            case 'deliveryman':
                search_by_filter.$match.$or.push({ "provider_detail.name": { '$regex': search_value, '$options': 'i' } })
                break;
            case 'order':
                search_by_filter.$match.$or.push({ "unique_id": Number(search_value) })
                break;
            default:
                break;
        }
    }

    // Delivery Type Filter
    if (request_data_body.query && request_data_body.query.delivery_types && request_data_body.query.delivery_types.length) {

        delivery_type_filter = { $match: { $or: [] } };

        request_data_body.query.delivery_types.forEach(_delivery_type => {
            switch (_delivery_type.name) {
                case 'pickup':
                    delivery_type_filter.$match.$or.push({ "is_user_pick_up_order": true })
                    break;
                case 'delivery':
                    delivery_type_filter.$match.$or.push({ $and: [{ "is_user_pick_up_order": false }] })
                    break;
                case 'schedule':
                    delivery_type_filter.$match.$or.push({ "is_schedule_order": true })
                    break;
                case 'now':
                    delivery_type_filter.$match.$or.push({ "is_schedule_order": false })
                    break;
                default:
                    break;
            }

        })
    }

    // Payment By Filter
    if (request_data_body.query && request_data_body.query.payment_by && request_data_body.query.payment_by.length) {

        payment_by_filter = { $match: { $or: [] } };

        request_data_body.query.payment_by.forEach(_payment_type => {
            if (_payment_type.id === 'cash') {
                payment_by_filter.$match.$or.push({ "order_payment_details.is_payment_mode_cash": { "$eq": true } });
            } else {
                payment_by_filter.$match.$or.push({ "order_payment_details.payment_id": { "$eq": mongoose.Types.ObjectId(_payment_type.id) } });
            }

        })
    }

    var start = new Date();
    start.setDate(start.getDate() - 1); 

    // Status Filter
    var status_filter ={$and:[ {'delivery_type':{$ne:3}}]}

    var page;
    var perPage;
    var slice;
    if (request_data_body.page && request_data_body.perPage) {
        page = Number(request_data_body.page)
        perPage = Number(request_data_body.perPage)
        slice = {
            $project: {
                _id: 0,
                count: 1,
                results: {
                    $slice: ['$results', page ? (page - 1) * perPage : 0, perPage]
                }
            }
        }
    }


    var sort = { $sort: { unique_id: -1 } }

    const aggregate = [
        delivery_type_filter,
        date_filter,
        {
            "$match": {
                ...status_filter,
            }
        },
        search_by_filter,
        {
            $lookup: {
                from: 'order_payments',
                localField: 'order_payment_id',
                foreignField: '_id',
                as: 'order_payment_details'
            }
        },
        {
            "$unwind": "$order_payment_details",
        },
        payment_by_filter,
        { $unwind: "$user_detail" },
        {
            $unwind: {
                path: "$store_detail",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $unwind: {
                path: "$destination_addresses",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: 'requests',
                localField: 'request_id',
                foreignField: '_id',
                as: 'request_details'
            }
        },
        {
            $unwind: {
                path: "$request_details",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            "$project": {
                unique_id: 1,
                user_name: "$user_detail.name",
                user_id:"$user_detail._id",
                store_id: "$store_detail._id",
                store_name: "$store_detail.name",
                is_store_can_complete_order: { $cond: ["$store_detail.is_store_can_complete_order", true, false] },
                address: "$destination_addresses.address",
                price: "$total",
                is_user_pick_up_order: 1,
                pickup_time: "$order_payment_details.pickup_time",
                is_schedule_order: 1,
                delivery_type: 1,
                order_status: 1,
                payment_method: { $cond: ["$is_payment_mode_cash", "cash", "card"] },
                delivery_date: { $cond: ["$is_schedule_order", "$schedule_order_start_at", "$created_at"] },
                is_payment_mode_cash: 1,
                total: 1,
                order_payment_id:"$order_payment_details.payment_intent_id",
                order_change: 1,
                user_image_url: "$user_detail.image_url",
                user_phone: "$user_detail.phone",
                estimated_time_for_delivery_in_min: {$cond: ["$request_details.estimated_time_for_delivery_in_min","$request_details.estimated_time_for_delivery_in_min",""]},
                timezone: 1,
                schedule_order_start_at: 1,
                schedule_order_start_at2: 1,
                delivery_status: {$cond: ["$request_details.delivery_status","$request_details.delivery_status",""]},
		estimated_time_for_delivery: {
                    
                    $concat: [{$dateToString: { 
                        format: "%H",
                        timezone: "Asia/Kolkata",
                        date: "$estimated_time_for_ready_order"
                        } }, ":", {$dateToString: {format: "%M",
                        timezone: "Asia/Kolkata",
                        date: "$estimated_time_for_ready_order" }}]

                    // $concat: [{$toString: {$hour: "$estimated_time_for_ready_order"}}, ":", {$toString: {$minute: "$estimated_time_for_ready_order"}}]
                }
            }
        },
        sort,
        {
            $group: {
                _id: null,
                count: {
                    $sum: 1 
                },
                results: {
                    $push: '$$ROOT'
                }
            }
        }
    ];

    if (slice) {
        aggregate.push(slice);
    }

    Order.aggregate(aggregate).then((order_details) => {
        if (order_details.length) {
            //console.log(order_details[0]);

            response_data.json({
                success: true,
                data: order_details[0]
            })
        } else {
            response_data.json({
                success: false,
                error_code: ERROR_CODE.DETAIL_NOT_FOUND
            });
        }
    }, (errors) => {
        console.log(errors)
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    })
}

exports.admin_table_list_orders = function (request_data, response_data) {

    var request_data_body = request_data.body;

    var search_by = null;
    var search_value = null;

    if (request_data_body.search_by && request_data_body.search_value) {
        search_by = request_data_body.search_by || null;
        search_value = request_data_body.search_value || null;
    }

    var date_filter = { $match: {} }
    var delivery_type_filter = { $match: {} };
    var payment_by_filter = { $match: {} };
    var search_by_filter = { $match: {} };

    // Date Filter
    if (request_data_body.start_date && request_data_body.end_date) {


        var start_date = new Date(request_data_body.start_date);
        var end_date = new Date(request_data_body.end_date);
        start_date = start_date.setHours(0, 0, 0, 0);
        start_date = new Date(start_date);
        end_date = end_date.setHours(23, 59, 59, 999);
        end_date = new Date(end_date);

        var timeZone = "Asia/Calcutta";

        if (request_data_body.timezone && request_data_body.timezone !== "") {
            timeZone = request_data_body.timezone;
        }
        start_date = utils.get_date_in_citytimezone(start_date, timeZone)
        end_date = utils.get_date_in_citytimezone(end_date, timeZone)

        date_filter = {
            $match: {
                schedule_order_start_at: {
                    $gte: start_date, $lt: end_date
                }
            }
        };


    }




    // Search Filter
    if (search_by !== null) {
        search_by_filter = { $match: { $or: [] } };
        switch (search_by) {
            case 'user':
                search_by_filter.$match.$or.push({ "user_detail.name": { '$regex': search_value, '$options': 'i' } })
                break;
            case 'deliveryman':
                search_by_filter.$match.$or.push({ "provider_detail.name": { '$regex': search_value, '$options': 'i' } })
                break;
            case 'order':
                search_by_filter.$match.$or.push({ "unique_id": Number(search_value) })
                break;
            default:
                break;
        }
    }

    // Delivery Type Filter
    if (request_data_body.query && request_data_body.query.delivery_types && request_data_body.query.delivery_types.length) {

        delivery_type_filter = { $match: { $or: [] } };

        request_data_body.query.delivery_types.forEach(_delivery_type => {
            switch (_delivery_type.name) {
                case 'pickup':
                    delivery_type_filter.$match.$or.push({ "is_user_pick_up_order": true })
                    break;
                case 'delivery':
                    delivery_type_filter.$match.$or.push({ $and: [{ "is_user_pick_up_order": false }] })
                    break;
                case 'schedule':
                    delivery_type_filter.$match.$or.push({ "is_schedule_order": true })
                    break;
                case 'now':
                    delivery_type_filter.$match.$or.push({ "is_schedule_order": false })
                    break;
                default:
                    break;
            }

        })
    }

    // Payment By Filter
    if (request_data_body.query && request_data_body.query.payment_by && request_data_body.query.payment_by.length) {

        payment_by_filter = { $match: { $or: [] } };

        request_data_body.query.payment_by.forEach(_payment_type => {
            if (_payment_type.id === 'cash') {
                payment_by_filter.$match.$or.push({ "order_payment_details.is_payment_mode_cash": { "$eq": true } });
            } else {
                payment_by_filter.$match.$or.push({ "order_payment_details.payment_id": { "$eq": mongoose.Types.ObjectId(_payment_type.id) } });
            }

        })
    }

    // Status Filter
    var status_filter = { $and: [{ 'delivery_type': { $eq: 3 } }, { 'order_status': { $lt: ORDER_STATE.ORDER_READY } }] };
    // var status_filter = { 'order_status': { $lt: ORDER_STATE.ORDER_READY } };
    // var status_filter = { 'delivery_type':{$eq: 3} };

    var page;
    var perPage;
    var slice;
    if (request_data_body.page && request_data_body.perPage) {
        page = Number(request_data_body.page)
        perPage = Number(request_data_body.perPage)
        slice = {
            $project: {
                _id: 0,
                count: 1,
                results: {
                    $slice: ['$results', page ? (page - 1) * perPage : 0, perPage]
                }
            }
        }
    }


    var sort = { $sort: { unique_id: -1 } }

    const aggregate = [
        delivery_type_filter,
        date_filter,
        {
            "$match": {
                ...status_filter,
            }
        },
        search_by_filter,
        {
            $lookup: {
                from: 'order_payments',
                localField: 'order_payment_id',
                foreignField: '_id',
                as: 'order_payment_details'
            }
        },
        {
            "$unwind": "$order_payment_details",
        },
        {
            $lookup: {
                from: "carts",
                localField: "cart_id",
                foreignField: "_id",
                as: "cart_details"
            }
        },
        {
            $unwind: {
                path: "$cart_details",
                preserveNullAndEmptyArrays: true
            }
        },
        payment_by_filter,
        { $unwind: "$user_detail" },
        {
            $unwind: {
                path: "$store_detail",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $unwind: {
                path: "$destination_addresses",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            "$project": {
                unique_id: 1,
                user_name: "$user_detail.name",
                store_name: "$store_detail.name",
                address: "$destination_addresses.address",
                price: "$total",
                is_user_pick_up_order: 1,
                is_schedule_order: 1,
                order_status: 1,
                payment_method: { $cond: ["$is_payment_mode_cash", "cash", "card"] },
                delivery_date: { $cond: ["$is_schedule_order", "$schedule_order_start_at", "$created_at"] },
                is_payment_mode_cash: 1,
                total: 1,
                order_change: 1,
                user_image_url: "$user_detail.image_url",
                user_phone: "$user_detail.phone",
                timezone: 1,
                schedule_order_start_at: 1,
                schedule_order_start_at2: 1,
                table_no: "$cart_details.table_no",
                no_of_persons: "$cart_details.no_of_persons",
                booking_type: "$cart_details.booking_type",
                order_details: "$cart_details.order_details",
                booking_fees:"$order_payment_details.booking_fees"
            }
        },
        sort,
        {
            $group: {
                _id: null,
                count: { $sum: 1 },
                results: {
                    $push: '$$ROOT'
                }
            }
        }
    ];

    if (slice) {
        aggregate.push(slice);
    }

    Order.aggregate(aggregate).then((order_details) => {
        if (order_details.length) {
            response_data.json({
                success: true,
                data: order_details[0]
            })
        } else {
            response_data.json({
                success: false,
                error_code: ERROR_CODE.DETAIL_NOT_FOUND
            });
        }
    }, (errors) => {
        console.log(errors)
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    })
}

exports.admin_list_deliveries = function (request_data, response_data) {

    var request_data_body = request_data.body;

    var search_by = null;
    var search_value = null;

    if (request_data_body.query && request_data_body.query.search_by && request_data_body.query.search_value) {
        search_by = request_data_body.query.search_by || null;
        search_value = request_data_body.query.search_value || null;
    }

    var date_filter = { $match: {} }
    var delivery_type_filter = { $match: {} };
    var payment_by_filter = { $match: {} };
    var search_by_filter = { $match: {} };

    // Date Filter
    if (request_data_body.start_date && request_data_body.end_date) {


        var start_date = new Date(request_data_body.start_date);
        var end_date = new Date(request_data_body.end_date);
        start_date = start_date.setHours(0, 0, 0, 0);
        start_date = new Date(start_date);
        end_date = end_date.setHours(23, 59, 59, 999);
        end_date = new Date(end_date);

        var timeZone = "Asia/Calcutta";

        if (request_data_body.timezone && request_data_body.timezone !== "") {
            timeZone = request_data_body.timezone;
        }
        start_date = utils.get_date_in_citytimezone(start_date, timeZone)
        end_date = utils.get_date_in_citytimezone(end_date, timeZone)

        date_filter = {
            $match: {
                schedule_order_start_at: {
                    $gte: start_date, $lt: end_date
                }
            }
        };


    }




    // Search Filter
    if (search_by !== null) {
        search_by_filter = { $match: { $or: [] } };
        switch (search_by) {
            case 'user':
                search_by_filter.$match.$or.push({ "user_detail.name": { '$regex': search_value, '$options': 'i' } })
                break;
            case 'deliveryman':
                search_by_filter.$match.$or.push({ "provider_detail.name": { '$regex': search_value, '$options': 'i' } })
                break;
            case 'order':
                search_by_filter.$match.$or.push({ "unique_id": Number(search_value) })
                break;
            default:
                break;
        }
    }

    // Delivery Type Filter
    if (request_data_body.query && request_data_body.query.delivery_types && request_data_body.query.delivery_types.length) {

        delivery_type_filter = { $match: { $or: [] } };

        request_data_body.query.delivery_types.forEach(_delivery_type => {
            switch (_delivery_type.name) {
                case 'pickup':
                    delivery_type_filter.$match.$or.push({ "is_user_pick_up_order": true })
                    break;
                case 'delivery':
                    delivery_type_filter.$match.$or.push({ $and: [{ "is_user_pick_up_order": false }] })
                    break;
                case 'schedule':
                    delivery_type_filter.$match.$or.push({ "is_schedule_order": true })
                    break;
                case 'now':
                    delivery_type_filter.$match.$or.push({ "is_schedule_order": false })
                    break;
                default:
                    break;
            }

        })
    }

    // Payment By Filter
    if (request_data_body.query && request_data_body.query.payment_by && request_data_body.query.payment_by.length) {

        payment_by_filter = { $match: { $or: [] } };

        request_data_body.query.payment_by.forEach(_payment_type => {
            if (_payment_type.id === 'cash') {
                payment_by_filter.$match.$or.push({ "order_payment_details.is_payment_mode_cash": { "$eq": true } });
            } else {
                payment_by_filter.$match.$or.push({ "order_payment_details.payment_id": { "$eq": mongoose.Types.ObjectId(_payment_type.id) } });
            }

        })
    }

    // Status Filter
    var status_filter = {
        $and: [
            { 'order_status': { $gt: ORDER_STATE.ORDER_READY } },
            { 'order_status': { $lt: ORDER_STATE.ORDER_COMPLETED } },
            // {'order_status_id':{$eq:ORDER_STATUS_ID.RUNNING}}
        ]
    };

    var page;
    var perPage;
    var slice;
    if (request_data_body.page && request_data_body.perPage) {
        page = Number(request_data_body.page)
        perPage = Number(request_data_body.perPage)
        slice = {
            $project: {
                _id: 0,
                count: 1,
                results: {
                    $slice: ['$results', page ? (page - 1) * perPage : 0, perPage]
                }
            }
        }
    }


    var sort = { $sort: { unique_id: -1 } }

    const aggregate = [
        delivery_type_filter,
        date_filter,
        {
            "$match": {
                ...status_filter,
            }
        },
        search_by_filter,
        {
            $lookup: {
                from: 'order_payments',
                localField: 'order_payment_id',
                foreignField: '_id',
                as: 'order_payment_details'
            }
        },
        {
            "$unwind": "$order_payment_details",
        },
        payment_by_filter,
        { $unwind: "$user_detail" },
        {
            $unwind: {
                path: "$store_detail",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $unwind: {
                path: "$destination_addresses",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            "$project": {
                unique_id: 1,
                user_name: "$user_detail.name",
                store_name: "$store_detail.name",
                address: "$destination_addresses.address",
                price: "$total",
                is_user_pick_up_order: 1,
                is_schedule_order: 1,
                order_status: 1,
                payment_method: { $cond: ["$is_payment_mode_cash", "cash", "card"] },
                delivery_date: { $cond: ["$is_schedule_order", "$schedule_order_start_at", "$created_at"] },
                is_payment_mode_cash: 1,
                total: 1,
                order_change: 1,
                user_image_url: "$user_detail.image_url",
                user_phone: "$user_detail.phone",
                timezone: 1,
                schedule_order_start_at: 1,
                schedule_order_start_at2: 1
            }
        },
        sort,
        {
            $group: {
                _id: null,
                count: { $sum: 1 },
                results: {
                    $push: '$$ROOT'
                }
            }
        }
    ];

    if (slice) {
        aggregate.push(slice);
    }

    Order.aggregate(aggregate).then((order_details) => {
        if (order_details.length) {
            response_data.json({
                success: true,
                data: order_details[0]
            })
        } else {
            response_data.json({
                success: false,
                error_code: ERROR_CODE.DETAIL_NOT_FOUND
            });
        }
    }, (errors) => {
        console.log(errors)
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    })
}

exports.admin_fetch_order_detail = function (request_data, response_data) {
    var request_data_body = request_data.body;
    var order_id = mongoose.Types.ObjectId(request_data_body.order_id);

    const aggregate = [
        { $match: { _id: order_id } },
        { $unwind: "$user_detail" },
        {
            $lookup: {
                from: 'order_payments',
                localField: 'order_payment_id',
                foreignField: '_id',
                as: 'order_payment_details'
            }
        },
        { $unwind: "$order_payment_details" },
        {
            $lookup: {
                from: 'carts',
                localField: 'cart_id',
                foreignField: '_id',
                as: 'cart_details'
            }
        },
        { $unwind: "$cart_details" },
        {
            $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'order_by_details'
            }
        },
        { $unwind: "$order_by_details" },
        {
            $lookup: {
                from: 'requests',
                localField: 'request_id',
                foreignField: '_id',
                as: 'request_details'
            }
        },
        {
            $lookup: {
                from: 'countries',
                localField: 'country_id',
                foreignField: '_id',
                as: 'country_details'
            }
        },
        {
            $unwind: '$country_details'
        },
        {
            $unwind: {
                path: "$request_details",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $unwind: {
                path: "$cart_details.destination_addresses",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $unwind: {
                path: "$cart_details.pickup_addresses",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                id: "$unique_id",
                order_for_name: "$cart_details.destination_addresses.user_details.name",
                order_for_email: "$cart_details.destination_addresses.user_details.email",
                order_for_address: "$cart_details.destination_addresses.address",
                order_for_phone: "$cart_details.destination_addresses.user_details.phone",
                order_to_landmark: "$cart_details.destination_addresses.landmark",
                order_to_street: "$cart_details.destination_addresses.street",
                order_to_flat_no: "$cart_details.destination_addresses.flat_no",
                order_to_name: "$cart_details.pickup_addresses.user_details.name",
                order_to_email: "$cart_details.pickup_addresses.user_details.email",
                order_to_phone: "$cart_details.pickup_addresses.user_details.phone",
                order_to_address: "$cart_details.pickup_addresses.address",
                order_by_name: { $concat: ["$order_by_details.first_name", " ", "$order_by_details.last_name"] },
                order_by_email: "$order_by_details.email",
                order_by_phone: "$order_by_details.phone",
                delivery_note: "$cart_details.destination_addresses.note",
                pickup_note: "$cart_details.pickup_addresses.note",
                user_id: "$user_id",

                country_currency_sign: '$country_details.currency_sign',
                is_user_pick_up_order: "$is_user_pick_up_order",
                is_distance_unit_mile: "$order_payment_details.is_distance_unit_mile",
                request_date_time: "$request_details.date_time",
                date_time: 1,
                items: "$cart_details.order_details.items",
                payment_method: { $cond: ["$order_payment_details.is_payment_mode_cash", "cash", "card"] },
                country_code: { $first: '$destination_addresses.user_details.country_phone_code' },
                currency_sign: "$order_payment_details.order_currency_code",
                distance: "$order_payment_details.total_distance",
                time: "$order_payment_details.total_time",
                orderedAt: "$created_at",
                deliveryAt: { $cond: ["$is_schedule_order", "$schedule_order_start_at2", "$created_at"] },

                price: "$total",
                tax: "$order_payment_details.item_tax",
                delivery_price: "$order_payment_details.total_delivery_price",
                service_price: "$order_payment_details.total_service_price",
                admin_profit_on_delivery: "$order_payment_details.total_admin_profit_on_delivery",

                total_sur_charge: "$order_payment_details.total_sur_charge",
                total_admin_tax_price: "$order_payment_details.total_admin_tax_price",
                total_store_tax_price: "$order_payment_details.total_store_tax_price",
                total_order_price: "$order_payment_details.total_order_price",
                total_cart_price: "$order_payment_details.total_cart_price",
                user_pay_payment: "$order_payment_details.user_pay_payment",
                discount: "$order_payment_details.promo_payment",
                is_store_pay_delivery_fees: "$order_payment_details.is_store_pay_delivery_fees",
                total_store_income: "$order_payment_details.total_store_income",
                total_provider_income: "$order_payment_details.total_provider_income",
                total_admin_profit_on_delivery: "$order_payment_details.total_admin_profit_on_delivery",
                total_admin_profit_on_store: "$order_payment_details.total_admin_profit_on_store",
                is_order_price_paid_by_store: "$order_payment_details.is_order_price_paid_by_store",
                is_store_income_set_in_wallet: "$order_payment_details.is_store_income_set_in_wallet",
                store_income_set_in_wallet: "$order_payment_details.store_income_set_in_wallet",
                is_provider_income_set_in_wallet: "$order_payment_details.is_provider_income_set_in_wallet",
                provider_income_set_in_wallet: "$order_payment_details.provider_income_set_in_wallet",
                taxes: "$order_payment_details.taxes",
                total: "$total",
                cancellation_reason: "$cancel_reason",
                tip_amount: "$order_payment_details.tip_amount",
                tip_value: "$order_payment_details.tip_value",
                delivery_type: "$delivery_type",
                table_no: "$cart_details.table_no",
                no_of_persons: "$cart_details.no_of_persons",
                booking_type: "$cart_details.booking_type",
                booking_fess:"$order_payment_details.booking_fees",
                order_details: "$cart_details.order_details",
            }
        },
        {
            $unwind: {
                path: "$delivery_note",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $unwind: {
                path: "$address",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $unwind: {
                path: "$country_code",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $unwind: {
                path: "$items",
                preserveNullAndEmptyArrays: true
            }
        },
    ];
    Order.aggregate(aggregate).then(order => {
        if (order.length) {
            response_data.json({
                success: true,
                data: order[0],
                orders: order
            });
        } else {
            response_data.json({
                success: false,
                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
            });
        }
    }, (errors) => {
        console.log(errors)
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    })
}

exports.admin_review_list = function (request_data, response_data) {
    var request_data_body = request_data.body;
    var order_query = {
        $lookup: {
            from: "orders",
            localField: "order_id",
            foreignField: "_id",
            as: "order_detail"
        }
    };
    var array_to_json_order_detail = { $unwind: "$order_detail" };

    var delivery_type_filter = { $match: {} };
    var search_by_filter = { $match: {} };
    var rating_by_filter = { $match: {} };

    var search_by = request_data_body.query.search_by || null;
    var search_value = request_data_body.query.search_value || null;

    var deliveryman_min_rating = request_data_body.query.deliveryman_min_rating;
    var deliveryman_max_rating = request_data_body.query.deliveryman_max_rating;
    var order_min_rating = request_data_body.query.order_min_rating;
    var order_max_rating = request_data_body.query.order_max_rating;


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

    var filter = { "$match": { "order_detail.completed_at": { $gte: start_date, $lt: end_date } } };

    if (search_by !== null) {
        search_by_filter = { $match: { $or: [] } };
        switch (search_by) {
            case 'user':
                search_by_filter.$match.$or.push({ "order_detail.user_detail.name": { '$regex': search_value, '$options': 'i' } })
                break;
            case 'deliveryman':
                search_by_filter.$match.$or.push({ "order_detail.provider_detail.name": { '$regex': search_value, '$options': 'i' } })
                break;
            case 'store':
                search_by_filter.$match.$or.push({ "order_detail.store_detail.name": { '$regex': search_value, '$options': 'i' } })
                break;
            case 'order':
                search_by_filter.$match.$or.push({ "order_detail.unique_id": Number(search_value) })
                break;
            default:
                break;
        }
    }

    rating_by_filter = {
        $match: {
            $and: [
                { user_rating_to_store: { $lte: order_max_rating, $gte: order_min_rating } },
                { user_rating_to_provider: { $lte: deliveryman_max_rating, $gte: deliveryman_min_rating } },
            ]
        }
    }

    if (order_max_rating === 0 && deliveryman_max_rating === 0) {
        rating_by_filter = { $match: {} }
    }

    if (request_data_body.query.delivery_types && request_data_body.query.delivery_types.length) {

        delivery_type_filter = { $match: { $or: [] } };
        request_data_body.query.delivery_types.forEach(_delivery_type => {
            _delivery_type.name = _delivery_type.name.toLowerCase()
            switch (_delivery_type.name) {
                case 'pickup':
                    delivery_type_filter.$match.$or.push({ "order_detail.is_user_pick_up_order": true })
                    break;
                case 'delivery':
                    delivery_type_filter.$match.$or.push({ "order_detail.is_user_pick_up_order": false })
                    break;
                case 'schedule':
                    delivery_type_filter.$match.$or.push({ "order_detail.is_schedule_order": true })
                    break;
                case 'now':
                    delivery_type_filter.$match.$or.push({ "order_detail.is_schedule_order": false })
                    break;
                default:
                    delivery_type_filter = { $match: {} }
                    break;
            }

        })
    }

    var project = {
        $project: {
            user_rating_to_store: "$user_rating_to_store",
            user_rating_to_provider: "$user_rating_to_provider",
            provider_rating_to_user: "$provider_rating_to_user",
            provider_rating_to_store: "$provider_rating_to_store",
            store_rating_to_user: "$store_rating_to_user",
            store_rating_to_provider: "$store_rating_to_provider",
            user_review_to_provider: "$user_review_to_provider",
            user_review_to_store: "$user_review_to_store",
            provider_review_to_user: "$provider_review_to_user",
            provider_review_to_store: "$provider_review_to_store",
            store_review_to_provider: "$store_review_to_provider",
            store_review_to_user: "$store_review_to_user",
            number_of_users_like_store_comment: "$number_of_users_like_store_comment",
            number_of_users_dislike_store_comment: "$number_of_users_like_store_comment",
            user_name: "$order_detail.user_detail.name",
            user_phone: "$order_detail.user_detail.phone",
            user_image: "$order_detail.user_detail.image_url",
            store_name: "$order_detail.store_detail.name",
            store_phone: "$order_detail.store_detail.phone",
            store_image: "$order_detail.store_detail.image_url",
            provider_name: "$order_detail.provider_detail.name",
            provider_phone: "$order_detail.provider_detail.phone",
            provider_image: "$order_detail.provider_detail.image_url",
            total: "$order_detail.total",
            is_user_pick_up_order: "$order_detail.is_user_pick_up_order",
            is_schedule_order: "$order_detail.is_schedule_order",
            is_payment_mode_cash: "$order_detail.is_payment_mode_cash",
            is_paid_from_wallet: "$order_detail.is_paid_from_wallet",
            unique_id: "$order_detail.unique_id",
            completed_at: "$order_detail.completed_at"
        }
    }

    var sort = { "$sort": {} };
    sort["$sort"]['order_detail.unique_id'] = parseInt(-1);

    const aggregate = [order_query, array_to_json_order_detail, filter, delivery_type_filter, search_by_filter, rating_by_filter, sort, project]
    // const aggregate = [order_query, array_to_json_order_detail, delivery_type_filter, search_by_filter, rating_by_filter, project]

    Review.aggregate(aggregate).then((reviews) => {
        response_data.json({
            success: true,
            message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
            reviews: reviews
        });
    }, (error) => {
        console.log(error);
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    });
}


exports.get_admin_dispatcher_order_list = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store_detail = response.store;
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

            var store_query = {
                $lookup: {
                    from: "stores",
                    localField: "store_id",
                    foreignField: "_id",
                    as: "store_detail"
                }
            }

            var array_to_json_store_query = {
                $unwind: {
                    path: "$store_detail",
                    preserveNullAndEmptyArrays: true
                }
            }

            var store_order_filter = { $match: { $or: [{ "store_detail.is_store_can_add_provider": { $eq: false } }, { store_id: { $eq: null } }] } }

            var order_condition = { $match: { 'order_status_id': { $eq: ORDER_STATUS_ID.RUNNING } } };


            // var store_id_condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};

            var number_of_rec = SEARCH_SORT.NO_OF_RECORD_PER_PAGE;

            var request_status = request_data_body.request_status;


            var sort = { "$sort": {} };
            sort["$sort"]['unique_id'] = parseInt(-1);
            var count = { $group: { _id: null, total: { $sum: 1 }, data: { $push: '$data' } } };

            var delivery_status_condition = { "$match": { $or: [{ 'request_detail.delivery_status': { $gte: ORDER_STATE.WAITING_FOR_DELIVERY_MAN } }, { 'request_id': null }] } };
            var delivery_status_manage_id_condition = { "$match": { $or: [{ $and: [{ 'request_detail.delivery_status_manage_id': { $ne: ORDER_STATUS_ID.COMPLETED } }] }, { 'request_id': null }] } };
            // var delivery_status_manage_id_condition = { "$match": { $or: [{$and: [{ 'request_detail.delivery_status_manage_id': { $ne: ORDER_STATUS_ID.COMPLETED } }, { 'request_detail.delivery_status_manage_id': { $ne: ORDER_STATUS_ID.CANCELLED } }]}, { 'request_id': null }] } };
            var project = {
                $project: {
                    user_detail: "$user_detail",
                    provider_detail: "$request_detail.provider_detail",
                    request_id: "$request_id",
                    destination_addresses: "$cart_detail.destination_addresses",
                    delivery_status: "$request_detail.delivery_status",
                    timezone: "$timezone",
                    created_at: "$created_at",
                    unique_id: "$unique_id",
                    order_id: "$_id",
                    store_id: "$store_id",
                    total: "$total",
                    is_payment_mode_cash: "$is_payment_mode_cash",
                    schedule_order_start_at: "$schedule_order_start_at",
                    schedule_order_start_at2: "$schedule_order_start_at2",
                    confirmation_code_for_pick_up_delivery: "$confirmation_code_for_pick_up_delivery",
                    order_status: 1,
                    city_id: 1,
                    is_user_pick_up_order: 1,
                    delivery_type: 1
                }
            }

            Order.aggregate([order_condition, cart_query, array_to_json_cart_query, request_query, array_to_json_request_query, store_query, array_to_json_store_query, store_order_filter, delivery_status_manage_id_condition, sort, project]).then((requests) => {
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

exports.get_cancellation_charges  = async function(request_data, response_data){
    await utils.check_request_params(request_data, [], async function(response) {
        let request_data_body = request_data.body
        let orderCancellationCharge = 0
        if(response){
            let user = await User.findById(request_data_body.user_id)
            if(user) {
                let cartLookup = {
                    $lookup: {
                        from: 'carts',
                        localField: 'cart_id',
                        foreignField: '_id',
                        as: 'cart_details'
                    }
                }
                let cartUnwind = {
                    $unwind: {
                        path: '$cart_details',
                        preserveNullAndEmptyArrays: true
                    }
                }
                let query = {
                    $match: {_id: mongoose.Types.ObjectId(request_data_body.order_id)}
                }
                let order = await Order.aggregate([query, cartLookup, cartUnwind])
                if(order.length > 0){
                    let order_details = order[0]
                    if (order_details.delivery_type === 3) {
                        let table_settings = await TableSettings.find({ store_id: mongoose.Types.ObjectId(order_details.store_id) })
                        if (table_settings) {
                            let tableSettingsDetails = table_settings[0]
                            let currentDate = new Date()
                            let orderDate = order_details.schedule_order_start_at
                            let hoursBeforeCancelled = (Math.floor(orderDate.getTime() - currentDate.getTime()) / 1000 / 60 / 60)
                            let cancellationChargeType
                            let cancellationCharge
                            let min = 0
                            let min_index = 0
                            if (order_details.cart_details.booking_type === 1 && tableSettingsDetails.is_cancellation_charges_for_without_order) {
                                let tableCancellationCharges = tableSettingsDetails.without_order_cancellation_charges
                                tableCancellationCharges.forEach((charge, index) => {
                                    if (hoursBeforeCancelled > charge.hours && min < charge.hours) {
                                        min = charge.hours
                                        min_index = index
                                    }
                                });
                                cancellationChargeType = tableCancellationCharges[min_index].type
                                cancellationCharge = tableCancellationCharges[min_index].value
                                if (cancellationChargeType === 1) {
                                    orderCancellationCharge = order_details.total * (tableCancellationCharges[min_index].value / 100)
                                } else {
                                    orderCancellationCharge = cancellationCharge
                                }
                            } else if (order_details.cart_details.booking_type === 2 && tableSettingsDetails.is_cancellation_charges_for_with_order) {
                                let tableCancellationCharges = tableSettingsDetails.with_order_cancellation_charges
                                tableCancellationCharges.forEach((charge, index) => {
                                    if (hoursBeforeCancelled > charge.hours && min < charge.hours) {
                                        min = charge.hours
                                        min_index = index
                                    }
                                });
                                cancellationChargeType = tableCancellationCharges[min_index].type
                                cancellationCharge = tableCancellationCharges[min_index].value
                                if (cancellationChargeType === 1) {
                                    orderCancellationCharge = order_details.total * (tableCancellationCharges[min_index].value / 100)
                                } else {
                                    orderCancellationCharge = cancellationCharge
                                }
                            }
                            return response_data.json({
                                success: true,
                                cancellation_charge: orderCancellationCharge,
                                cancellation_reason: []
                            })
                        } else {
                            return response_data.json({
                                success: false,
                                error_code: STORE_ERROR_CODE.TABLE_NOT_FOUND
                            })
                        }
                    } else {
                        let store = await Store.findById(order_details.store_id)
                        let orderStatus = order_details.order_status
                        let total_value = 0
                        let orderPaymentDetails = await OrderPayment.findById(mongoose.Types.ObjectId(order_details.order_payment_id))
                        if (store) {
                            let is_order_cancellation_charge_apply = store.is_order_cancellation_charge_apply;
                            let order_cancellation_charge_for_above_order_price = store.order_cancellation_charge_for_above_order_price;
                            let order_cancellation_charge_type = store.order_cancellation_charge_type;
                            let order_cancellation_charge_value = store.order_cancellation_charge_value;
                            let cancellation_charge_apply_from = store.cancellation_charge_apply_from;
                            let cancellation_charge_apply_till = store.cancellation_charge_apply_till;
                            if (is_order_cancellation_charge_apply && orderStatus >= cancellation_charge_apply_from && orderStatus <= cancellation_charge_apply_till && orderPaymentDetails.total_order_price > order_cancellation_charge_for_above_order_price) {
                                // if (is_order_cancellation_charge_apply && order_status >= ORDER_STATE.ORDER_READY && order_payment.total_order_price > order_cancellation_charge_for_above_order_price) {
                                console.log(order_cancellation_charge_type)
                                switch (order_cancellation_charge_type) {
                                    case ORDER_CANCELLATION_CHARGE_TYPE.PERCENTAGE: /* percentage */
                                        order_cancellation_charge_value = (orderPaymentDetails.total_order_price) * order_cancellation_charge_value * 0.01;
                                        break;
                                    case ORDER_CANCELLATION_CHARGE_TYPE.ABSOLUTE: /* absolute */
                                        order_cancellation_charge_value = order_cancellation_charge_value;
                                        break;
                                    default: /* percentage */
                                        order_cancellation_charge_value = (orderPaymentDetails.total_order_price) * order_cancellation_charge_value * 0.01;
                                        break;
                                }
                                order_cancellation_charge_value = utils.precisionRoundTwo(Number(order_cancellation_charge_value));
                                return response_data.json({
                                    success: true,
                                    cancellation_charge: order_cancellation_charge_value,
                                    cancellation_reason: []
                                })
                            } else {
                                return response_data.json({
                                    success: true,
                                    cancellation_charge: 0,
                                    cancellation_reason: []
                                })
                            }
                        } else {
                            return response_data.json({
                                success: false,
                                error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND
                            })
                        }
                    }
                } else {
                    return response_data.json({
                        success: false,
                        error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND
                    })
                }
            } else {
                return response_data.json({
                    success: false,
                    error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND
                })
            }
        }
    })
}