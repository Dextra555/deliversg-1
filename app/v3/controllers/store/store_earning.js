require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
var moment = require('moment');
var moment = require('moment-timezone');
var utils = require('../../utils/utils');
var myEarning = require('../../controllers/store/store_earning');
var Order = require('mongoose').model('order');
var Order_payment = require('mongoose').model('order_payment');
var Country = require('mongoose').model('country');
var Store = require('mongoose').model('store');
var mongoose = require('mongoose');
var Store_analytic_daily = require('mongoose').model('store_analytic_daily');
var console = require('../../utils/console');


exports.get_store_earning = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'start_date', type: 'string'}, {name: 'end_date', type: 'string'}], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var store  = response.store;

                        var start_date = request_data_body.start_date;
                        var end_date = request_data_body.end_date;

                        if (end_date == '' || end_date == undefined) {
                            end_date = new Date();
                        } else {
                            end_date = new Date(end_date);
                            end_date = end_date.setHours(23, 59, 59, 999);
                            end_date = new Date(end_date);
                        }

                        if (start_date == '' || start_date == undefined) {
                            start_date = new Date(end_date.getTime() - (6 * 24 * 60 * 60 * 1000));
                            start_date = start_date.setHours(0, 0, 0, 0);
                            start_date = new Date(start_date);
                        } else {
                            start_date = new Date(start_date);
                            start_date = start_date.setHours(0, 0, 0, 0);
                            start_date = new Date(start_date);
                        }

                        var filter = {"$match": {$and: [{"completed_date_in_city_timezone": {$gte: start_date, $lt: end_date}}, {total_store_income: {$ne: 0}}]}};

                        
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

                        var number_of_rec = SEARCH_SORT.NO_OF_RECORD_PER_PAGE;
                        var page = request_data_body.page;

                        var sort_field = request_data_body.sort_field;
                        var sort_order = request_data_body.sort_order;
                        
                        // var filter = {"$match": {}};
                        // filter = {"$match": {"completed_at": {$gte: start_date, $lt: end_date}}};
                        // filter = {"$match": {$and: [{"completed_date_in_city_timezone": {$gte: start_date, $lt: end_date}}, {total_store_income: {$ne: 0}}]}};
                        //
                        var sort = {"$sort": {}};
                        sort["$sort"]['unique_id'] = parseInt(-1);
                        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
                        var skip = {};
                        skip["$skip"] = (page * number_of_rec) - number_of_rec;
                        var limit = {};
                        limit["$limit"] = number_of_rec;
                        if(request_data_body.store_ids){
                            var store_condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_ids)}}};
                        }else{
                            var store_condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
                        }
                        var order_status_id_condition = {"$match": {$or: [{'order_status_id': {$eq: ORDER_STATUS_ID.COMPLETED}}, {'order_status': {$eq: ORDER_STATE.CANCELED_BY_USER}}]}};

                        Order.aggregate([filter, store_condition, order_status_id_condition, order_payment_query, request_query, array_to_json_order_payment_query,array_to_json_request_query 
                                   
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
                                        total_completed_orders: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, 1, 0]}},
                                        total_item_count: {$sum: '$order_payment_detail.total_item_count'},
                                        total_cart_price: {$sum: '$order_payment_detail.total_cart_price'},
                                        total_item_tax: {$sum: '$order_payment_detail.item_tax'},
                                        total_delivery_price: {$sum: '$order_payment_detail.total_delivery_price'},
                                        total_service_tax: {$sum: '$order_payment_detail.service_tax'},
                                        total: {$sum: '$order_payment_detail.total'},
                                        total_promo_payment: {$sum: '$order_payment_detail.promo_payment'},
                                        total_cash_payment: {$sum: '$order_payment_detail.cash_payment'},
                                        total_card_payment: {$sum: '$order_payment_detail.card_payment'},
                                        total_wallet_payment: {$sum: '$order_payment_detail.wallet_payment'}
                                    }
                                }

                                Order.aggregate([filter, store_condition, order_status_id_condition, order_payment_query, request_query, array_to_json_order_payment_query, array_to_json_request_query
                                            
                                            , total_condition
                                ]).then((order_total) => {
                                    if (page) {
                                        Order.aggregate([filter, store_condition, order_status_id_condition, order_payment_query, request_query, array_to_json_order_payment_query, array_to_json_request_query
                                                    , sort
                                                    
                                                    , skip, limit
                                        ]).then((orders) => {

                                            response_data.json({success: true,
                                                message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,
                                                admin_currency: setting_detail.admin_currency,
                                                order_total: order_total[0],
                                                orders: orders
                                            });
                                        }, (error) => {
                                            console.log(error);
                                            response_data.json({
                                                success: false,
                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                            });
                                        });
                                    } else {
                                        Order.aggregate([filter, store_condition, order_status_id_condition, order_payment_query, request_query, array_to_json_order_payment_query, array_to_json_request_query
                                                    , sort
                                                  
                                        ]).then((orders) => {
                                            response_data.json({success: true,
                                                message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
                                                admin_currency: setting_detail.admin_currency,
                                                order_total: order_total[0],
                                                orders: orders
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

exports.store_daily_earning = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'start_date'}], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var store  = response.store;
                    
                        Country.findOne({_id: store.country_id}).then((country) => {
                            var currency = "";
                            if (country) {
                                currency = country.currency_sign;
                            }

                            if (typeof request_data_body.start_date == 'object')
                            {
                                var today = new Date(request_data_body.start_date.formatted);
                            } else
                            {
                                var today = new Date(request_data_body.start_date);
                            }


                            if (today == '' || today == undefined) {
                                today = new Date();
                            }

                            var tag_date = moment(today).format(DATE_FORMATE.DDMMYYYY);

                            var start_date = today;
                            start_date = start_date.setHours(0, 0, 0, 0);
                            start_date = new Date(start_date);
                            var end_date = today;
                            end_date = end_date.setHours(23, 59, 59, 999);
                            end_date = new Date(end_date);

                            var store_condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
                            var order_status_id_condition = {"$match": {$or: [{'order_status_id': {$eq: ORDER_STATUS_ID.COMPLETED}}, {'order_status': {$eq: ORDER_STATE.CANCELED_BY_USER}}]}};

                            var filter = {"$match": {$and: [{"completed_date_in_city_timezone": {$gte: start_date, $lt: end_date}}, {total_store_income: {$ne: 0}}]}};
                            var payment_gateway_query = {
                                $lookup:
                                        {
                                            from: "payment_gateways",
                                            localField: "payment_id",
                                            foreignField: "_id",
                                            as: "payment_gateway_detail"
                                        }
                            };

                            Store_analytic_daily.findOne({store_id: store._id, date_tag: tag_date}).then((store_analytic_daily) => {
                                var store_analytic_daily_data = {};
                                if (store_analytic_daily)
                                {
                                    store_analytic_daily_data = store_analytic_daily;
                                }

                                Order_payment.aggregate([store_condition, filter, payment_gateway_query]).then((order_payments) => {


                                    if (order_payments.length === 0)
                                    {
                                        var order_total = {};
                                        response_data.json({success: true,
                                            message: STORE_MESSAGE_CODE.GET_DAILY_EARNING_SUCCESSFULLY,
                                            currency: currency,
                                            store_analytic_daily: store_analytic_daily_data,
                                            order_total: order_total,
                                            order_payments: order_payments});
                                    } else
                                    {
                                        var total_condition = {
                                            $group: {
                                                _id: null,

                                                total_item_price: {$sum: '$total_cart_price'},
                                                total_store_tax_price: {$sum: '$total_store_tax_price'},
                                                total_order_price: {$sum: '$total_order_price'},
                                                total_store_income: {$sum: '$total_store_income'},
                                                total_admin_profit_on_store: {$sum: '$total_admin_profit_on_store'},

                                                // store_have_order_payment: {$sum: {'$cond': [{'$eq': ['$is_payment_mode_cash', true], '$eq': ['$is_order_price_paid_by_store', false]}, '$total_order_price', 0]}},
                                                store_have_order_payment: {$sum: { $add: [ {$sum: { $cond: [ {$and : [ { $eq: [ "$is_payment_mode_cash", true] }, { $eq: [ "$is_order_price_paid_by_store",false] } ] }, '$total_order_price', 0 ] }}, {$sum: { $cond: [ {$and : [ { $eq: [ "$is_payment_mode_cash", true] }, { $eq: [ "$is_user_pick_up_order",true] } ] }, "$user_pay_payment", 0 ] }} , {$sum: { $cond: [ {$and : [ { $eq: [ "$is_payment_mode_cash", true] }, { $eq: [ "$delivery_price_used_type",2] } ] }, "$user_pay_payment", 0 ] }} ] } },
                                                // store_have_order_payment: {$sum: { $add: [ {$sum: { $cond: [ {$and : [ { $eq: [ "$is_payment_mode_cash", true] }, { $eq: [ "$is_order_price_paid_by_store",false] } ] }, '$total_order_price', 0 ] }} , {$sum: { $cond: [ {$and : [ { $eq: [ "$is_payment_mode_cash", true] }, { $eq: [ "$delivery_price_used_type",2] } ] }, "$user_pay_payment", 0 ] }} ] } },
                                                store_have_service_payment: {$sum: {'$cond': [{'$eq': ['$is_store_pay_delivery_fees', true]}, '$total_delivery_price', 0]}},
                                                total_deduct_wallet_income: {$sum: {'$cond': [{"$and": [{'$eq': ['$is_store_income_set_in_wallet', true]}, {'$lt': ['$pay_to_store', 0]}]}, '$store_income_set_in_wallet', 0]}},
                                                total_added_wallet_income: {$sum: {'$cond': [{"$and": [{'$eq': ['$is_store_income_set_in_wallet', true]}, {'$gt': ['$pay_to_store', 0]}]}, '$store_income_set_in_wallet', 0]}},
                                  
                                                total_earning: {$sum: '$total_store_income'},
                                                total_wallet_income_set: {$sum: {'$cond': [{'$eq': ['$is_store_income_set_in_wallet', true]}, '$pay_to_store', 0]}},
                                                total_transferred_amount: {$sum: {'$cond': [{$and: [{'$eq': ['$is_store_income_set_in_wallet', false]}, {'$eq': ['$is_transfered_to_store', true]}]}, '$pay_to_store', 0]}},
                                                pay_to_store: {$sum: {'$cond': [{$and: [{'$eq': ['$is_store_income_set_in_wallet', false]}, {'$eq': ['$is_transfered_to_store', false]}]}, '$pay_to_store', 0]}},

                                            }
                                        }


                                        Order_payment.aggregate([store_condition, filter, total_condition, payment_gateway_query]).then((order_total) => {


                                            response_data.json({success: true,
                                                message: STORE_MESSAGE_CODE.GET_DAILY_EARNING_SUCCESSFULLY,
                                                currency: currency,
                                                store_analytic_daily: store_analytic_daily_data,
                                                order_total: order_total[0],
                                                order_payments: order_payments});
                                        });
                                    }
                                }, (error) => {
                                    console.log(error);
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });
                            }, (error) => {
                                console.log(error);
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
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

exports.store_weekly_earning = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'start_date', type: 'string'}, {name: 'end_date', type: 'string'}], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var store  = response.store;
                    
                        Country.findOne({_id: store.country_id}).then((country) => {
                            var currency = "";
                            if (country) {
                                currency = country.currency_sign;
                            }
                            var start_date = new Date(request_data_body.start_date);
                            var end_date = new Date(request_data_body.end_date);
                            start_date = start_date.setHours(0, 0, 0, 0);
                            start_date = new Date(start_date);

                            end_date = end_date.setHours(23, 59, 59, 999);
                            end_date = new Date(end_date);

                            var start_date_time = start_date;

                            var store_condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
                            var filter = {"$match": {$and: [{"completed_date_in_city_timezone": {$gte: start_date, $lt: end_date}}, {total_store_income: {$ne: 0}}]}};
                            var order_status_id_condition = {"$match": {$or: [{'order_status_id': {$eq: ORDER_STATUS_ID.COMPLETED}}, {'order_status': {$eq: ORDER_STATE.CANCELED_BY_USER}}]}};

                            var total_condition = {
                                $group: {
                                    _id: null,
                                    total_item_price: {$sum: '$total_cart_price'},
                                    total_store_tax_price: {$sum: '$total_store_tax_price'},
                                    total_order_price: {$sum: '$total_order_price'},
                                    total_store_income: {$sum: '$total_store_income'},
                                    total_admin_profit_on_store: {$sum: '$total_admin_profit_on_store'},

                                    // store_have_order_payment: {$sum: {'$cond': [{'$eq': ['$is_payment_mode_cash', true], '$eq': ['$is_order_price_paid_by_store', false]}, '$total_order_price', 0]}},
                                    store_have_service_payment: {$sum: {'$cond': [{'$eq': ['$is_store_pay_delivery_fees', true]}, '$total_delivery_price', 0]}},
                                    store_have_order_payment: {$sum: { $add: [ {$sum: { $cond: [ {$and : [ { $eq: [ "$is_payment_mode_cash", true] }, { $eq: [ "$is_order_price_paid_by_store",false] } ] }, '$total_order_price', 0 ] }}, {$sum: { $cond: [ {$and : [ { $eq: [ "$is_payment_mode_cash", true] }, { $eq: [ "$is_user_pick_up_order",true] } ] }, "$user_pay_payment", 0 ] }}, {$sum: { $cond: [ {$and : [ { $eq: [ "$is_payment_mode_cash", true] }, { $eq: [ "$delivery_price_used_type",2] } ] }, "$user_pay_payment", 0 ] }} ] } },
                                    // store_have_order_payment: {$sum: { $add: [ {$sum: { $cond: [ {$and : [ { $eq: [ "$is_payment_mode_cash", true] }, { $eq: [ "$is_order_price_paid_by_store",false] } ] }, '$total_order_price', 0 ] }} , {$sum: { $cond: [ {$and : [ { $eq: [ "$is_payment_mode_cash", true] }, { $eq: [ "$delivery_price_used_type",2] } ] }, "$user_pay_payment", 0 ] }} ] } },

                                    total_deduct_wallet_income: {$sum: {'$cond': [{"$and": [{'$eq': ['$is_store_income_set_in_wallet', true]}, {'$lt': ['$pay_to_store', 0]}]}, '$store_income_set_in_wallet', 0]}},
                                    total_added_wallet_income: {$sum: {'$cond': [{"$and": [{'$eq': ['$is_store_income_set_in_wallet', true]}, {'$gt': ['$pay_to_store', 0]}]}, '$store_income_set_in_wallet', 0]}},

                                    total_earning: {$sum: '$total_store_income'},
                                    total_wallet_income_set: {$sum: {'$cond': [{'$eq': ['$is_store_income_set_in_wallet', true]}, '$pay_to_store', 0]}},
                                    total_transferred_amount: {$sum: {'$cond': [{$and: [{'$eq': ['$is_store_income_set_in_wallet', false]}, {'$eq': ['$is_transfered_to_store', true]}]}, '$pay_to_store', 0]}},
                                    pay_to_store: {$sum: {'$cond': [{$and: [{'$eq': ['$is_store_income_set_in_wallet', false]}, {'$eq': ['$is_transfered_to_store', false]}]}, '$pay_to_store', 0]}},

                                }

                            }
                            var daily_condition = {
                                $group: {
                                    _id: null,
                                    date1: {$sum: {$cond: [{$eq: ["$completed_date_tag", moment(new Date(moment(start_date_time).add(0, 'days'))).format(DATE_FORMATE.DDMMYYYY)]}, '$total_store_income', 0]}},
                                    date2: {$sum: {$cond: [{$eq: ["$completed_date_tag", moment(new Date(moment(start_date_time).add(1, 'days'))).format(DATE_FORMATE.DDMMYYYY)]}, '$total_store_income', 0]}},
                                    date3: {$sum: {$cond: [{$eq: ["$completed_date_tag", moment(new Date(moment(start_date_time).add(2, 'days'))).format(DATE_FORMATE.DDMMYYYY)]}, '$total_store_income', 0]}},
                                    date4: {$sum: {$cond: [{$eq: ["$completed_date_tag", moment(new Date(moment(start_date_time).add(3, 'days'))).format(DATE_FORMATE.DDMMYYYY)]}, '$total_store_income', 0]}},
                                    date5: {$sum: {$cond: [{$eq: ["$completed_date_tag", moment(new Date(moment(start_date_time).add(4, 'days'))).format(DATE_FORMATE.DDMMYYYY)]}, '$total_store_income', 0]}},
                                    date6: {$sum: {$cond: [{$eq: ["$completed_date_tag", moment(new Date(moment(start_date_time).add(5, 'days'))).format(DATE_FORMATE.DDMMYYYY)]}, '$total_store_income', 0]}},
                                    date7: {$sum: {$cond: [{$eq: ["$completed_date_tag", moment(new Date(moment(start_date_time).add(6, 'days'))).format(DATE_FORMATE.DDMMYYYY)]}, '$total_store_income', 0]}}}
                            }
                            var date = {
                                date1: new Date(moment(start_date_time)),
                                date2: new Date(moment(start_date_time).add(1, 'days')),
                                date3: new Date(moment(start_date_time).add(2, 'days')),
                                date4: new Date(moment(start_date_time).add(3, 'days')),
                                date5: new Date(moment(start_date_time).add(4, 'days')),
                                date6: new Date(moment(start_date_time).add(5, 'days')),
                                date7: new Date(moment(start_date_time).add(6, 'days'))

                            }

                            Order_payment.aggregate([store_condition, filter, daily_condition]).then((order_day_total) => {
                                Order_payment.aggregate([store_condition, filter, total_condition]).then((order_total) => {

                                    var order_total_new = {};
                                    var order_day_total_new = {};
                                    if (order_total.length != 0) {
                                        order_total_new = order_total[0];
                                        order_day_total_new = order_day_total[0];

                                    }

                                    myEarning.get_store_weekly_analytics_data(store, end_date, function (store_analytic_weekly) {
                                        response_data.json({success: true,
                                            message: STORE_MESSAGE_CODE.GET_WEEKLY_EARNING_SUCCESSFULLY,
                                            currency: currency,
                                            store_analytic_weekly: store_analytic_weekly,
                                            order_total: order_total_new,
                                            order_day_total: order_day_total_new,
                                            store:store,
                                            date: date
                                        });
                                    });

                                }, (error) => {
                                    console.log(error);
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });

                            }, (error) => {
                                console.log(error);
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
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

exports.get_store_weekly_analytics_data = function (store_detail, end_date, return_data) {


    var week_end_date = moment(end_date);
    var week_end_date_for_tag = week_end_date;
    var date_tag_array = [];
    var tag = "";

    for (var i = 0; i < 7; i++) {
        tag = moment(week_end_date_for_tag).format(DATE_FORMATE.DDMMYYYY);
        date_tag_array.push(tag);
        week_end_date_for_tag = moment(week_end_date_for_tag).subtract(1, 'days');
    }

    var store_id = store_detail._id;
    Store_analytic_daily.find({store_id: store_id, date_tag: {$in: date_tag_array}}).then((store_analytic_dailies) => {


        var received = 0;
        var accepted = 0;
        var rejected = 0;
        var total_orders = 0;
        var cancelled = 0;
        var order_ready = 0;
        var completed = 0;
        var acception_ratio = 0;
        var rejection_ratio = 0;
        var cancellation_ratio = 0;
        var completed_ratio = 0;
        var order_ready_ratio = 0;
        var total_items = 0;
        var store_analytic_daily_count = 0;

        var store_analytic_weekly = {
            received: received,
            total_orders: total_orders,
            accepted: accepted,
            rejected: rejected,
            order_ready: order_ready,
            cancelled: cancelled,
            completed: completed,
            total_items: total_items,
            acception_ratio: acception_ratio,
            cancellation_ratio: cancellation_ratio,
            rejection_ratio: rejection_ratio,
            completed_ratio: completed_ratio,
            order_ready_ratio: order_ready_ratio
        };

        if (store_analytic_dailies.length > 0) {
            var store_analytic_dailies_size = store_analytic_dailies.length;

            store_analytic_dailies.forEach(function (store_analytic_daily) {

                store_analytic_daily_count++;

                if (store_analytic_daily) {

                    received = received + store_analytic_daily.received;
                    accepted = accepted + store_analytic_daily.accepted;
                    rejected = rejected + store_analytic_daily.rejected;
                    total_orders = total_orders + store_analytic_daily.total_orders;
                    order_ready = order_ready + store_analytic_daily.order_ready;
                    cancelled = cancelled + store_analytic_daily.cancelled;
                    completed = completed + store_analytic_daily.completed;
                    total_items = total_items + store_analytic_daily.total_items;

                }

                if (store_analytic_daily_count == store_analytic_dailies_size)
                {
                    if (Number(received) > 0) {
                        acception_ratio = utils.precisionRoundTwo(Number((accepted * 100) / received));
                        cancellation_ratio = utils.precisionRoundTwo(Number((cancelled * 100) / received));
                        completed_ratio = utils.precisionRoundTwo(Number((completed * 100) / received));
                        rejection_ratio = utils.precisionRoundTwo(Number((rejected * 100) / received));
                        order_ready_ratio = utils.precisionRoundTwo(Number((order_ready * 100) / received));

                    }

                    store_analytic_weekly.received = received;
                    store_analytic_weekly.total_orders = total_orders;
                    store_analytic_weekly.accepted = accepted;
                    store_analytic_weekly.rejected = rejected;
                    store_analytic_weekly.order_ready = order_ready;
                    store_analytic_weekly.cancelled = cancelled;
                    store_analytic_weekly.completed = completed;
                    store_analytic_weekly.total_items = total_items;
                    store_analytic_weekly.acception_ratio = acception_ratio;
                    store_analytic_weekly.cancellation_ratio = cancellation_ratio;
                    store_analytic_weekly.rejection_ratio = rejection_ratio;
                    store_analytic_weekly.completed_ratio = completed_ratio;
                    store_analytic_weekly.order_ready_ratio = order_ready_ratio

                    if (return_data != null)
                        return_data(store_analytic_weekly);


                }
            });
        } else {
            if (return_data != null)
                return_data(store_analytic_weekly);
            else
                return;
        }
    });

};


exports.list_earning = function(request_data,response_data){
        
    var request_data_body = request_data.body;
    var search_by = request_data_body.query.search_by || null;
    var search_value = request_data_body.query.search_value || null;

    var date_filter = {}
    var delivery_type_filter = {$match:{}};
    var payment_by_filter = {$match:{}};
    var search_by_filter = {$match:{}};
    var type_by_filter = {$match:{}};

    if(request_data_body.start_date && request_data_body.end_date && request_data_body.start_date !== null && request_data_body.end_date !== null){
        var start_date = new Date(request_data_body.start_date);
        var end_date = new Date(request_data_body.end_date);
        start_date = start_date.setHours(0, 0, 0, 0);
        start_date = new Date(start_date);
        end_date = end_date.setHours(23, 59, 59, 999);
        end_date = new Date(end_date);
        date_filter = {completed_at: { $gte: start_date, $lt: end_date }}
    }else{
        var date = new Date(Date.now());
        date = date.setHours(0, 0, 0, 0);
        start_date = new Date(0);
        end_date = new Date(Date.now());
    }


    // Search Filter
if(search_by !== null){
    search_by_filter = {$match:{$or:[]}};
    switch (search_by) {
        case 'user':
            search_by_filter.$match.$or.push({"user_detail.name":{'$regex' : search_value, '$options' : 'i'}})
            break;
        case 'deliveryman':
            search_by_filter.$match.$or.push({"provider_detail.name":{'$regex' : search_value, '$options' : 'i'}})
            break;
        case 'order':
            search_by_filter.$match.$or.push({"unique_id":Number(search_value)})
            break;
        default:
            break;
    }
}

// Delivery Type Filter
if(request_data_body.query.delivery_types && request_data_body.query.delivery_types.length){

    delivery_type_filter = {$match:{$or:[]}};

    request_data_body.query.delivery_types.forEach(_delivery_type =>{
        switch (_delivery_type.name) {
            case 'pickup':
                delivery_type_filter.$match.$or.push({"is_user_pick_up_order":true})
                break;
            case 'delivery':
                delivery_type_filter.$match.$or.push({$and:[{ "is_user_pick_up_order":false}]})
                break;
            case 'schedule':
                delivery_type_filter.$match.$or.push({"is_schedule_order":true})
                break;
            case 'now':
                delivery_type_filter.$match.$or.push({"is_schedule_order":false})
                break;
            default:
                break;
        }

    })
}


// Type Filter
if(request_data_body.query.type_by && request_data_body.query.type_by.length){

    type_by_filter = {$match:{$or:[]}};

    request_data_body.query.type_by.forEach(_type =>{
        switch (_type.id) {
            case 'free_delivery':
                type_by_filter.$match.$or.push({"order_payment_details.is_store_pay_delivery_fees":true})
                break;
            case 'promo_applied':
                type_by_filter.$match.$or.push({"order_payment_details.promo_id":{$ne:null}})
                break;
            default:
                break;
        }

    })
}

// Payment By Filter
if(request_data_body.query.payment_by && request_data_body.query.payment_by.length){

    payment_by_filter = {$match:{$or:[]}};

    request_data_body.query.payment_by.forEach(_payment_type =>{
        if(_payment_type.id === 'cash'){
            payment_by_filter.$match.$or.push({"order_payment_details.is_payment_mode_cash":{"$eq": true}});
        }else{
            payment_by_filter.$match.$or.push({"order_payment_details.payment_id":{"$eq": mongoose.Types.ObjectId(_payment_type.id)}});
        }
        
    })
}


    var page = 1;
    var perPage = 1;

    if(request_data_body.page && request_data_body.perPage){
        page = Number(request_data_body.page)
        perPage = Number(request_data_body.perPage)
    }

    var store_id = mongoose.Types.ObjectId(request_data_body.store_id);

    // Status Filter
    var status_filter = {$or: [
        {'order_status_id': {$eq: ORDER_STATUS_ID.COMPLETED}}
    ]};
    
    var sort = { $sort :{unique_id:-1} }

    const aggregatation = [
        delivery_type_filter,
        {
            $match: {
                ...date_filter,
                ...status_filter,
                store_id:{
                    $eq:store_id
                }
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
            $unwind:'$order_payment_details'
        },
        type_by_filter,
        payment_by_filter,
        {
            $project: {
                unique_id:1,
                name:"$user_detail.name",
                total_cart_price:"$order_payment_details.total_cart_price",
                item_tax:"$order_payment_details.total_store_tax_price",
                total_delivery_price:"$order_payment_details.total_delivery_price",
                total_store_income:"$order_payment_details.total_store_income",
                total:"$order_payment_details.total",
                promo_payment:"$order_payment_details.promo_payment",
                user_pay_payment:"$order_payment_details.user_pay_payment",
                total_item_count:"$order_payment_details.total_item_count",
                currency_sign:"$order_payment_details.currency_sign",
                payment_method:{$cond:["$order_payment_details.is_payment_mode_cash","cash","card"]},
                completed_at:1
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
        },
        {
            $project: {
                _id: 0,
                count: 1,
                results: {
                $slice: ['$results',page ? (page - 1) * perPage : 0 , perPage]                      
                }
            }
        }
    ]
    Order.aggregate(aggregatation).then((order_details)=>{
        if(order_details.length){
            response_data.json({
                success:true,
                data:order_details[0]
            })
        }else{
            response_data.json({
                success: false,
                error_code: ERROR_CODE.DETAIL_NOT_FOUND
            });
        }
    },(errors)=>{
        console.log(errors)
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    })
}

exports.list_orders = function(request_data,response_data){

    var request_data_body = request_data.body;
    
        var search_by = null
        var search_value = null
        if (request_data_body.search_by && request_data_body.search_value) {
            search_by = request_data_body.query.search_by || null;
            search_value = request_data_body.query.search_value || null;
        }
    
    var date_filter = {$match:{}}
    var delivery_type_filter = {$match:{}};
    var payment_by_filter = {$match:{}};
    var search_by_filter = {$match:{}};
    
    // Date Filter
    if(request_data_body.start_date && request_data_body.end_date){
        
        var start_date = new Date(request_data_body.start_date);
        var end_date = new Date(request_data_body.end_date);
    
        var timeZone = "Asia/Calcutta";
    
        if(request_data_body.timezone && request_data_body.timezone !== ""){
            timeZone = request_data_body.timezone;
        }
        
        
        start_date = start_date.setHours(0, 0, 0, 0);
        start_date = new Date(start_date);
        end_date = end_date.setHours(23, 59, 59, 999);
        end_date = new Date(end_date);
        
        start_date = utils.get_date_in_citytimezone(start_date,timeZone)
        end_date = utils.get_date_in_citytimezone(end_date,timeZone)
        
        date_filter = {
            $match:{ 
                schedule_order_start_at: { 
                    $gte: start_date, $lt: end_date 
                }
            }
        };
    }
    
    // Search Filter
    if(search_value !== null){
        search_by_filter = {$match:{$or:[]}};
        switch (search_by) {
            case 'user':
                search_by_filter.$match.$or.push({"user_detail.name":{'$regex' : search_value, '$options' : 'i'}})
                break;
            case 'deliveryman':
                search_by_filter.$match.$or.push({"provider_detail.name":{'$regex' : search_value, '$options' : 'i'}})
                break;
            case 'order':
                search_by_filter.$match.$or.push({"unique_id":Number(search_value)})
                break;
            default:
                break;
        }
    }
    
    // Delivery Type Filter
    if(request_data_body.query.delivery_types && request_data_body.query.delivery_types.length){
    
        delivery_type_filter = {$match:{$or:[]}};
    
        request_data_body.query.delivery_types.forEach(_delivery_type =>{
            switch (_delivery_type.name) {
                case 'pickup':
                    delivery_type_filter.$match.$or.push({"is_user_pick_up_order":true})
                    break;
                case 'delivery':
                    delivery_type_filter.$match.$or.push({$and:[{ "is_user_pick_up_order":false}]})
                    break;
                case 'schedule':
                    delivery_type_filter.$match.$or.push({"is_schedule_order":true})
                    break;
                case 'now':
                    delivery_type_filter.$match.$or.push({"is_schedule_order":false})
                    break;
                default:
                    break;
            }
    
        })
    }
    
    // Payment By Filter
    if(request_data_body.query.payment_by && request_data_body.query.payment_by.length){
    
        payment_by_filter = {$match:{$or:[]}};
    
        request_data_body.query.payment_by.forEach(_payment_type =>{
            if(_payment_type.id === 'cash'){
                payment_by_filter.$match.$or.push({"order_payment_details.is_payment_mode_cash":{"$eq": true}});
            }else{
                payment_by_filter.$match.$or.push({"order_payment_details.payment_id":{"$eq": mongoose.Types.ObjectId(_payment_type.id)}});
            }
            
        })
    }
    
    // Status Filter
    // var status_filter = {
    //     $and:[
    //         {'order_status': {$lte: ORDER_STATE.ORDER_READY}},
    //     ]
    // };
    
    var status_filter = {$and: [{'delivery_type':{$ne:3}}, {$or: [ {'order_status_id': {$eq: ORDER_STATUS_ID.RUNNING}} , {'order_status_id': {$eq: ORDER_STATUS_ID.IDEAL}} ]} ,{$or: [{'order_status_manage_id': {$ne: ORDER_STATUS_ID.COMPLETED}}, {'request_id': {$eq: null}}]} ]};
    
    
    var page = 1;
    var perPage = 1;
    
    if(request_data_body.page && request_data_body.perPage){
        page = Number(request_data_body.page)
        perPage = Number(request_data_body.perPage)
    }
    
    
    var store_id = mongoose.Types.ObjectId(request_data_body.store_id);
    var sort = { $sort :{unique_id:-1} }
    
    const aggregate = [
        delivery_type_filter,
        date_filter,
        {
          "$match": {
            ...status_filter,
            "store_id": {"$eq": store_id}
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
            $unwind: {
                path: "$order_payment_details",
                preserveNullAndEmptyArrays: true
            }
        }, 
        payment_by_filter,
        {
            $unwind: {
                path: "$user_detail",
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
            address: "$destination_addresses.address",
            price:"$total",
            pickup_time: "$order_payment_details.pickup_time",
            is_user_pick_up_order:1,
            is_schedule_order:1,
            order_status:1,
            store_id:1,
            delivery_price_used_type:"$order_payment_details.delivery_price_used_type",
            payment_method:{$cond:["$is_payment_mode_cash","cash","card"]},
            delivery_date:{$cond:["$is_schedule_order","$schedule_order_start_at","$created_at"]},
            is_payment_mode_cash:1,
            total:1,
            request_id:{$type:"$request_id"},
            order_change:1,
            user_image_url: "$user_detail.image_url",
            user_phone: "$user_detail.phone",
            timezone:1,
            schedule_order_start_at:1,
            schedule_order_start_at2:1,
            confirmation_code_for_complete_delivery:1,
		estimated_time_for_delivery: {
                    
                $concat: [{$dateToString: { 
                    format: "%H",
                    timezone: "Asia/Kolkata",
                    date: "$estimated_time_for_ready_order"
                    } }, ":", {$dateToString: {format: "%M",
                    timezone: "Asia/Kolkata",
                    date: "$estimated_time_for_ready_order" }}]

                // $concat: [{$toString: {$hour: "$estimated_time_for_ready_order"}}, ":", {$toString: {$minute: "$estimated_time_for_ready_order"}}]
            },
            estimated_time_for_delivery_in_min: {$cond: ["$request_details.estimated_time_for_delivery_in_min","$request_details.estimated_time_for_delivery_in_min",""]}
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
        },
        {
            $project: {
                _id: 0,
                count: 1,
                results: {
                $slice: ['$results',page ? (page - 1) * perPage : 0 , perPage]                      
                }
            }
        }
    ];
    Order.aggregate(aggregate).then((order_details)=>{
        if(order_details.length){
            response_data.json({
                success:true,
                data:order_details[0]
            })
        }else{
            response_data.json({
                success: false,
                error_code: ERROR_CODE.DETAIL_NOT_FOUND
            });
        }
    },(errors)=>{
        console.log(errors)
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    })
}

exports.table_list_orders = function(request_data,response_data){
    
    var request_data_body = request_data.body;
    
    var search_by = request_data_body.search_by || null;
    var search_value = request_data_body.search_value || '';
    
    var date_filter = {$match:{}}
    var delivery_type_filter = {$match:{}};
    var payment_by_filter = {$match:{}};
    var search_by_filter = {$match:{}};
    
    // Date Filter
    // if(request_data_body.start_date && request_data_body.end_date){
        
    //     var start_date = new Date(request_data_body.start_date);
    //     var end_date = new Date(request_data_body.end_date);
    
    //     var timeZone = "Asia/Calcutta";
    
    //     if(request_data_body.timezone && request_data_body.timezone !== ""){
    //         timeZone = request_data_body.timezone;
    //     }
        
        
    //     start_date = start_date.setHours(0, 0, 0, 0);
    //     start_date = new Date(start_date);
    //     end_date = end_date.setHours(23, 59, 59, 999);
    //     end_date = new Date(end_date);
        
    //     start_date = utils.get_date_in_citytimezone(start_date,timeZone)
    //     end_date = utils.get_date_in_citytimezone(end_date,timeZone)
        
    //     // date_filter = {
    //     //     $match:{ 
    //     //         schedule_order_start_at: { 
    //     //             $gte: start_date, $lt: end_date 
    //     //         }
    //     //     }
    //     // };
    // }
    
    // Search Filter
    if(search_by !== null){
        search_by_filter = {$match:{$or:[]}};
        switch (search_by) {
            case 'user':
                search_by_filter.$match.$or.push({"user_detail.name":{'$regex' : search_value, '$options' : 'i'}})
                break;
            case 'order':
                search_by_filter.$match.$or.push({"unique_id":Number(search_value)})
                break;
            default:
                break;
        }
    }
    
    // Delivery Type Filter
    // if(request_data_body.query.delivery_types && request_data_body.query.delivery_types.length){
    
    //     delivery_type_filter = {$match:{$or:[]}};
    
    //     request_data_body.query.delivery_types.forEach(_delivery_type =>{
    //         switch (_delivery_type.name) {
    //             case 'pickup':
    //                 delivery_type_filter.$match.$or.push({"is_user_pick_up_order":true})
    //                 break;
    //             case 'delivery':
    //                 delivery_type_filter.$match.$or.push({$and:[{ "is_user_pick_up_order":false}]})
    //                 break;
    //             case 'schedule':
    //                 delivery_type_filter.$match.$or.push({"is_schedule_order":true})
    //                 break;
    //             case 'now':
    //                 delivery_type_filter.$match.$or.push({"is_schedule_order":false})
    //                 break;
    //             default:
    //                 break;
    //         }
    
    //     })
    // }
    
    // Status Filter
    // var status_filter = {
    //     $and:[
    //         {'order_status': {$lte: ORDER_STATE.ORDER_READY}},
    //     ]
    // };
    
    var status_filter = {$and: [{'delivery_type':{$eq: 3}}, {$or: [ {'order_status_id': {$eq: ORDER_STATUS_ID.RUNNING}} ,  {'order_status_id': {$eq: ORDER_STATUS_ID.IDEAL}} ]} ,{$or: [{'order_status_manage_id': {$ne: ORDER_STATUS_ID.COMPLETED}}, {'request_id': {$eq: null}}]} ]};
    // var status_filter = {'delivery_type':{$eq: 3}};
    
    var page = 1;
    var perPage = 1;
    
    if(request_data_body.page && request_data_body.perPage){
        page = Number(request_data_body.page)
        perPage = Number(request_data_body.perPage)
    }
    
    
    var store_id = mongoose.Types.ObjectId(request_data_body.store_id);
    var sort = { $sort :{unique_id:-1} }
    
    const aggregate = [
        delivery_type_filter,
        date_filter,
        {
          "$match": {
            ...status_filter,
            "store_id": {"$eq": store_id}
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
            $unwind: {
                path: "$order_payment_details",
                preserveNullAndEmptyArrays: true
            }
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
        {
            $unwind: {
                path: "$user_detail",
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
            address: "$destination_addresses.address",
            price:"$total",
            is_user_pick_up_order:1,
            is_schedule_order:1,
            order_status:1,
            store_id:1,
            delivery_price_used_type:"$order_payment_details.delivery_price_used_type",
            payment_method:{$cond:["$is_payment_mode_cash","cash","card"]},
            delivery_date:{$cond:["$is_schedule_order","$schedule_order_start_at","$created_at"]},
            is_payment_mode_cash:1,
            total:1,
            request_id:{$type:"$request_id"},
            order_change:1,
            user_image_url: "$user_detail.image_url",
            user_phone: "$user_detail.phone",
            timezone:1,
            schedule_order_start_at:1,
            schedule_order_start_at2:1,
            confirmation_code_for_complete_delivery:1,
            // cart_details: "$cart_details",
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
        },
        {
            $project: {
                _id: 0,
                count: 1,
                results: {
                $slice: ['$results',page ? (page - 1) * perPage : 0 , perPage]                      
                }
            }
        }
    ];
    Order.aggregate(aggregate).then((order_details)=>{
        if(order_details.length){
            response_data.json({
                success:true,
                data:order_details[0]
            })
        }else{
            response_data.json({
                success: false,
                error_code: ERROR_CODE.DETAIL_NOT_FOUND
            });
        }
    },(errors)=>{
        console.log(errors)
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    })
    }

exports.list_orders_history = function(request_data,response_data){

        var request_data_body = request_data.body;
        

        var search_by = request_data_body.query.search_by || null;
        var search_value = request_data_body.query.search_value || null;

        var date_filter = {}
        var delivery_type_filter = {$match:{}};
        var payment_by_filter = {$match:{}};
        var search_by_filter = {$match:{}};

        // Search Filter
        if(search_by !== null){
            search_by_filter = {$match:{$or:[]}};
            switch (search_by) {
                case 'user':
                    search_by_filter.$match.$or.push({"user_detail.name":{'$regex' : search_value, '$options' : 'i'}})
                    break;
                case 'deliveryman':
                    search_by_filter.$match.$or.push({"provider_detail.name":{'$regex' : search_value, '$options' : 'i'}})
                    break;
                case 'order':
                    search_by_filter.$match.$or.push({"unique_id":Number(search_value)})
                    break;
                default:
                    break;
            }
        }

        // Delivery Type Filter
        if(request_data_body.query.delivery_types && request_data_body.query.delivery_types.length){

            delivery_type_filter = {$match:{$or:[]}};

            request_data_body.query.delivery_types.forEach(_delivery_type =>{
                switch (_delivery_type.name) {
                    case 'pickup':
                        delivery_type_filter.$match.$or.push({"is_user_pick_up_order":true})
                        break;
                    case 'delivery':
                        delivery_type_filter.$match.$or.push({$and:[{ "is_user_pick_up_order":false}]})
                        break;
                    case 'schedule':
                        delivery_type_filter.$match.$or.push({"is_schedule_order":true})
                        break;
                    case 'now':
                        delivery_type_filter.$match.$or.push({"is_schedule_order":false})
                        break;
                    default:
                        break;
                }

            })
        }

        // Payment By Filter
        if(request_data_body.query.payment_by && request_data_body.query.payment_by.length){

            payment_by_filter = {$match:{$or:[]}};

            request_data_body.query.payment_by.forEach(_payment_type =>{
                if(_payment_type.id === 'cash'){
                    payment_by_filter.$match.$or.push({"order_payment_details.is_payment_mode_cash":{"$eq": true}});
                }else{
                    payment_by_filter.$match.$or.push({"order_payment_details.payment_id":{"$eq": mongoose.Types.ObjectId(_payment_type.id)}});
                }
            })
        }


        
        // Date Filter
        if(request_data_body.start_date && request_data_body.end_date){
            var start_date = new Date(request_data_body.start_date);
            var end_date = new Date(request_data_body.end_date);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
            end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);
            date_filter = {completed_date_in_city_timezone: { $gte: start_date, $lt: end_date }}
        }

  

        // Status Filter
        // var status_filter = {$or: [
        //     {'order_status_id': {$eq: ORDER_STATUS_ID.COMPLETED}}, 
        //     {'order_status': {$eq: ORDER_STATE.CANCELED_BY_USER}}
        // ]};
        var status_filter = {$and: [
            {'order_status_id': {$ne: ORDER_STATUS_ID.RUNNING}}, 
            {'order_status_id': {$ne: ORDER_STATUS_ID.IDEAL}}, 
        ]};

        var page = 1;
        var perPage = 1;

        if(request_data_body.page && request_data_body.perPage){
            page = Number(request_data_body.page)
            perPage = Number(request_data_body.perPage)
        }

        var sort = { $sort :{unique_id:-1} }
        var store_id = mongoose.Types.ObjectId(request_data_body.store_id);

        const aggregate = [
            delivery_type_filter,
            {
                $match:{
                    ...date_filter,
                    ...status_filter,
                    store_id: {$eq:store_id},
                }
            },
            search_by_filter,
            {$unwind: "$user_detail"},
            {
                $unwind: {
                    path: "$provider_detail",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'order_payments',
                    localField: 'order_payment_id',
                    foreignField: '_id',
                    as: 'order_payment_details'
                }
            },
            {$unwind: "$order_payment_details"},
            payment_by_filter,
            {
                $project:{
                    unique_id:1,
                    user_name:"$user_detail.name",
                    provider_name:"$provider_detail.name",
                    order_status:1,
                    is_user_pick_up_order:1,
                    is_schedule_order:1,
                    completed_at:1,
                    created_at:1,
                    price:"$order_payment_details.total",
                    currency_sign:"$order_payment_details.order_currency_code",
                    payment_method:{
                        $cond:["$order_payment_details.is_payment_mode_cash","cash","card"]
                    }
                }
            },
            sort,
            { $group: {
                _id: null,
                count: { $sum: 1 },
                results: {
                  $push: '$$ROOT'
                }
              } },
              { $project: {
                _id: 0,
                count: 1,
                results: {
                  $slice: ['$results',page ? (page - 1) * perPage : 0 , perPage]                      
                }
              } }
        ];

        Order.aggregate(aggregate).then((order_details)=>{
            if(order_details.length){
                response_data.json({
                    success:true,
                    data:order_details[0]
                })
            }else{
                response_data.json({
                    success: false,
                    error_code: ERROR_CODE.ORDER_HISTORY_NOT_FOUND
                });
            }
        },(errors)=>{
            console.log(errors)
            response_data.json({
                success: false,
                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
            });
        })
}

exports.fetch_order_detail = function (request_data, response_data) {
    var request_data_body = request_data.body;
    var store_id = mongoose.Types.ObjectId(request_data_body.store_id);
    var order_id = mongoose.Types.ObjectId(request_data_body.order_id);

    const aggregate = [
        { $match: { store_id, _id: order_id } },
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
            $lookup: {
                from: 'reviews',
                localField: '_id',
                foreignField: 'order_id',
                as: 'review_details'
            }
        },
        {
            $unwind: {
                path: "$review_details",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                id: "$unique_id",
                name: "$user_detail.name",
                address: "$destination_addresses.address",
                delivery_note: "$destination_addresses.note",
                price: "$total",
                is_user_pick_up_order: "$is_user_pick_up_order",
                tax: "$order_payment_details.item_tax",
                order_status: "$order_status",
                request_date_time: "$request_details.date_time",
                delivery_price: "$order_payment_details.total_delivery_price",
                discount: "$order_payment_details.promo_payment",
                user_id: "$user_detail._id",
                user_for_details: { $arrayElemAt: ["$destination_addresses.user_details", 0] },
                total_cart_price: "$order_payment_details.total_cart_price",
                is_store_pay_delivery_fees: "$order_payment_details.is_store_pay_delivery_fees",
                total_item_price: "$order_payment_details.total_cart_price",
                total_order_price: "$order_payment_details.total_order_price",
                total_store_tax_price: "$order_payment_details.total_store_tax_price",
                is_distance_unit_mile: "$order_payment_details.is_distance_unit_mile",
                tip_amount: "$order_payment_details.tip_amount",
                total_store_income: "$order_payment_details.total_store_income",
                total: "$total",
                taxes: "$order_payment_details.taxes",
                currency_sign: "$order_payment_details.order_currency_code",
                distance: "$order_payment_details.total_distance",
                time: "$order_payment_details.total_time",
                orderedAt: "$created_at",
                deliveryAt: { $cond: ["$is_schedule_order", "$schedule_order_start_at", "$created_at"] },
                phone: "$user_detail.phone",
                country_code: "$destination_addresses.user_details.country_phone_code",
                is_paid_from_wallet: "$order_payment_details.is_paid_from_wallet",
                is_payment_mode_cash: "$order_payment_details.is_payment_mode_cash",
                // payment_method:{$cond:["$order_payment_details.is_payment_mode_cash","cash","card"]},
                date_time: 1,
                items: "$cart_details.order_details",
                is_use_item_tax: "$cart_details.is_use_item_tax",
                is_tax_included: "$cart_details.is_tax_included",
                confirmation_code_for_pick_up_delivery: "$confirmation_code_for_pick_up_delivery",
                confirmation_code_for_complete_delivery: "$confirmation_code_for_complete_delivery",
                store_rating_to_user: "$review_details.store_rating_to_user",
                store_review_to_user: "$review_details.store_review_to_user",
                is_store_rated_to_user: "$is_store_rated_to_user",
                table_no: "$cart_details.table_no",
                no_of_persons: "$cart_details.no_of_persons",
                booking_type: "$cart_details.booking_type",
                order_details: "$cart_details.order_details",
                booking_fees:"$order_payment_details.booking_fees",
                is_schedule_order: "$is_schedule_order",
                delivery_type: "$delivery_type"
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
        // {
        //     $unwind: {
        //     path:"$items",
        //     preserveNullAndEmptyArrays:true
        //     }
        // },
    ];
    Order.aggregate(aggregate).then(order => {
        console.log(order)
        if (order.length) {
            response_data.json({
                success: true,
                data: order[0]
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