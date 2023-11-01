require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var cron = require('../controllers/user/cron_job');
var emails = require('../controllers/email_sms/emails');
var Store = require('mongoose').model('store');
var mongoose = require('mongoose');
var Order_payment = require('mongoose').model('order_payment');
var moment = require('moment-timezone');
var City = require('mongoose').model('city');
var Country = require('mongoose').model('country');
var console = require('../utils/console');


// store_weekly_earning
exports.store_weekly_earning = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'start_date', type: 'string'}, {name: 'end_date', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var start_date = request_data_body.start_date;
            start_date = new Date(start_date);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
            var end_date = request_data_body.end_date;
            end_date = new Date(end_date);
            end_date = end_date.setHours(23, 59, 59, 999);
            end_date = new Date(end_date);


            var store_query = {
                $lookup:
                        {
                            from: "stores",
                            localField: "store_id",
                            foreignField: "_id",
                            as: "store_detail"
                        }
            };
            var array_to_json_store_query = {$unwind: {
                                    path: "$store_detail",
                                    preserveNullAndEmptyArrays: true
                                }
                            };
            var country_query = {
                $lookup:
                        {
                            from: "countries",
                            localField: "store_detail.country_id",
                            foreignField: "_id",
                            as: "country_detail"
                        }
            };

            var number_of_rec = request_data_body.number_of_rec;
            var page = request_data_body.page;

            var search_field = request_data_body.search_field;
            var search_value = request_data_body.search_value;
            search_value = search_value.replace(/^\s+|\s+$/g, '');
            search_value = search_value.replace(/ +(?= )/g, '');

            if (search_field === "store_detail.email")
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
            var order_status_id_condition = {"$match":{$or: [ {'order_status_id': {$eq: ORDER_STATUS_ID.COMPLETED}},{'order_status': {$eq: ORDER_STATE.CANCELED_BY_USER}}]}};
            var filter = {"$match": {$and: [{"completed_date_in_city_timezone": {$gte: start_date, $lt: end_date}}, {total_store_income: {$ne: 0}}]}};

            var count = {$group: {_id: null, totals: {$sum: 1}, data: {$push: '$data'}}};
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;

            var store_weekly_group = {
                $group: {
                    _id: '$store_id',
                    total_order: {$sum: 1},
                    total_store_earning: {$sum: '$total_store_income'},
                    store_have_order_payment: {$sum: { $add: [ {$sum: { $cond: [ {$and : [ { $eq: [ "$is_payment_mode_cash", true] }, { $eq: [ "$is_order_price_paid_by_store",false] } ] }, '$total_order_price', 0 ] }} , {$sum: { $cond: [ {$and : [ { $eq: [ "$is_payment_mode_cash", true] }, { $eq: [ "$delivery_price_used_type",2] } ] }, "$user_pay_payment", 0 ] }} ] } },
                    total_pay_to_store: {$sum: {'$cond': [{$and: [{'$eq': ['$is_store_income_set_in_wallet', false]}, {'$eq': ['$is_transfered_to_store', false]}]}, '$pay_to_store', 0]}},
                    total_wallet_income_set_in_cash_order: {$sum: {'$cond': [{'$eq': ['$is_store_income_set_in_wallet', true], '$eq': ['$is_payment_mode_cash', true]}, '$store_income_set_in_wallet', 0]}},
                    total_wallet_income_set_in_other_order: {$sum: {'$cond': [{'$eq': ['$is_store_income_set_in_wallet', true], '$eq': ['$is_payment_mode_cash', false]}, '$store_income_set_in_wallet', 0]}},
                    total_deduct_wallet_income: {$sum: {'$cond': [{"$and": [{'$eq': ['$is_store_income_set_in_wallet', true]}, {'$lt': ['$pay_to_store', 0]}]}, '$store_income_set_in_wallet', 0]}},
                    total_added_wallet_income: {$sum: {'$cond': [{"$and": [{'$eq': ['$is_store_income_set_in_wallet', true]}, {'$gt': ['$pay_to_store', 0]}]}, '$store_income_set_in_wallet', 0]}},
                    total_transferred_amount: {$sum: {'$cond': [{$and: [{'$eq': ['$is_store_income_set_in_wallet', false]}, {'$eq': ['$is_transfered_to_store', true]}]}, '$pay_to_store', 0]}},
                    store_detail: {$first: '$store_detail'},
                    country_detail: {$first: '$country_detail'}
                }

            }

            Order_payment.aggregate([filter, store_query, array_to_json_store_query, search, store_weekly_group, count]).then((store_weekly_earnings) => {

                if (store_weekly_earnings.length === 0)
                {
                    response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0});
                } else
                {
                    var pages = Math.ceil(store_weekly_earnings[0].totals / number_of_rec);
                    var total_condition = {
                        $group: {
                            _id: "null",
                            total_orders: {$sum: 1},
                            total_admin_earn: {$sum: {$sum: ["$total_admin_profit_on_delivery", "$total_admin_profit_on_store"]}},
                            total_store_earning: {$sum: '$total_store_income'},
                            total_pay_to_store: {$sum: {'$cond': [{$and: [{'$eq': ['$is_store_income_set_in_wallet', false]}, {'$eq': ['$is_transfered_to_store', false]}]}, '$pay_to_store', 0]}},
                            total_wallet_income_set_in_cash_order: {$sum: {'$cond': [{'$eq': ['$is_store_income_set_in_wallet', true], '$eq': ['$is_payment_mode_cash', true]}, '$store_income_set_in_wallet', 0]}},
                            total_wallet_income_set_in_other_order: {$sum: {'$cond': [{'$eq': ['$is_store_income_set_in_wallet', true], '$eq': ['$is_payment_mode_cash', false]}, '$store_income_set_in_wallet', 0]}},
                            total_deduct_wallet_income: {$sum: {'$cond': [{"$and": [{'$eq': ['$is_store_income_set_in_wallet', true]}, {'$lt': ['$pay_to_store', 0]}]}, '$store_income_set_in_wallet', 0]}},
                            total_added_wallet_income: {$sum: {'$cond': [{"$and": [{'$eq': ['$is_store_income_set_in_wallet', true]}, {'$gt': ['$pay_to_store', 0]}]}, '$store_income_set_in_wallet', 0]}},

                        }
                    }
                    Order_payment.aggregate([filter, store_query, array_to_json_store_query, country_query, search, total_condition]).then((order_total) => {

                        if (page) {

                            Order_payment.aggregate([store_query, array_to_json_store_query, country_query, search, filter, store_weekly_group, skip, limit]).then((store_weekly_earnings) => {
                                response_data.json({success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,
                                    admin_currency: setting_detail.admin_currency,
                                    order_total: order_total[0],
                                    pages: pages,
                                    store_weekly_earnings: store_weekly_earnings
                                });
                            }, (error) => {
                                console.log(error);
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });
                        } else
                        {
                            Order_payment.aggregate([store_query, array_to_json_store_query, country_query, filter, search]).then((store_weekly_earnings) => {

                                response_data.json({success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,

                                    admin_currency: setting_detail.admin_currency,
                                    order_total: order_total[0],
                                    pages: pages,
                                    store_weekly_earnings: store_weekly_earnings
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

//admin_paid_to_store
exports.admin_paid_to_store = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Store_weekly_earning.findOne({_id: request_data_body.store_weekly_earning_id}).then((store_weekly_earning) => {
                store_weekly_earning.total_paid = +store_weekly_earning.total_paid + +request_data_body.amount;
                store_weekly_earning.total_remaining_to_paid = store_weekly_earning.total_remaining_to_paid - request_data_body.amount;
                store_weekly_earning.is_weekly_invoice_paid = true;

                store_weekly_earning.save().then(() => {

                        response_data.json({success: true,
                            message: ITEM_MESSAGE_CODE.STATE_CHANGE_SUCCESSFULLY
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


//weekly_statement_for_store
exports.weekly_statement_for_store = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Store_weekly_earning.findOne({_id: request_data_body.store_weekly_earning_id}).then((store_weekly_earning) => {
                if (store_weekly_earning) {

                    Store.findOne({_id: store_weekly_earning.store_id}).then((store) => {
                        if (store) {
                            var city_id = store.city_id;
                            var country_id = store.country_id;
                            Country.findOne({_id: country_id}).then((country) => {
                                if (country) {
                                    var currency = country.currency_sign;
                                    City.findOne({_id: city_id}).then((city) => {
                                        if (city) {
                                            var timezone = city.timezone;

                                            Store_weekly_earning.findOne({_id: request_data_body.store_weekly_earning_id, start_date_tag: store_weekly_earning.start_date_tag, end_date_tag: store_weekly_earning.end_date_tag}).then((store_weekly_earning) => {

                                                Store_analytic_weekly.findOne({store_id: store_weekly_earning.store_id, start_date_tag: store_weekly_earning.start_date_tag, end_date_tag: store_weekly_earning.end_date_tag}).then((store_analytic_weekly) => {

                                                    var store_condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(store_weekly_earning.store_id)}}};
                                                    var filter = {"$match": {"delivered_at": {$gte: store_weekly_earning.start_date, $lt: store_weekly_earning.end_date}}};
                                                    var total_condition = {
                                                        $group: {
                                                            _id: null,
                                                            total_item_price: {$sum: '$total_item_price'},
                                                            total_store_tax_price: {$sum: '$total_store_tax_price'},
                                                            total_order_price: {$sum: '$total_order_price'},
                                                            total_admin_profit_on_store: {$sum: '$total_admin_profit_on_store'},
                                                            total_store_income: {$sum: '$total_store_income'},
                                                            wallet: {$sum: '$total_store_income'},
                                                            total_earning: {$sum: '$total_store_income'},
                                                            store_have_order_payment: {$sum: {'$cond': [{'$eq': ['$is_payment_mode_cash', true], '$eq': ['$is_order_price_paid_by_store', false]}, '$total_order_price', 0]}},
                                                            store_have_service_payment: {$sum: {'$cond': [{'$eq': ['$is_store_pay_delivery_fees', true]}, '$total_delivery_price', 0]}},

                                                            total_paid: {$sum: 0},
                                                            total_remaining_to_paid: {$sum: {'$cond': [{'$eq': ['$is_store_income_set_in_wallet', false]}, '$pay_to_store', 0]}},

                                                            total_wallet_income_set: {$sum: {'$cond': [{'$eq': ['$is_store_income_set_in_wallet', true]}, '$store_income_set_in_wallet', 0]}},
                                                            pay_to_store: {$sum: {'$cond': [{'$eq': ['$is_store_income_set_in_wallet', false]}, '$pay_to_store', 0]}},
                                                            total_wallet_income_set_in_cash_order: {$sum: {'$cond': [{'$eq': ['$is_store_income_set_in_wallet', true], '$eq': ['$is_payment_mode_cash', true]}, '$store_income_set_in_wallet', 0]}},
                                                            total_wallet_income_set_in_other_order: {$sum: {'$cond': [{'$eq': ['$is_store_income_set_in_wallet', true], '$eq': ['$is_payment_mode_cash', false]}, '$store_income_set_in_wallet', 0]}}




                                                        }

                                                    }
                                                    var daily_condition = {
                                                        $group: {
                                                            _id: null,
                                                            date1_total: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(0, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(1, 'days'))]}]}, '$total', 0]}},
                                                            date1_total_delivery_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(0, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(1, 'days'))]}]}, '$total_delivery_price', 0]}},
                                                            date1_total_order_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(0, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(1, 'days'))]}]}, '$total_order_price', 0]}},
                                                            date1_profit: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(0, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(1, 'days'))]}]}, '$total_store_income', 0]}},
                                                            date1_delivery_paid: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(0, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(1, 'days'))]}]}, '$store_have_service_payment', 0]}},
                                                            date1_recieved_order_payment: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(0, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(1, 'days'))]}]}, '$store_have_order_payment', 0]}},
                                                            date1_pay_to_store: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(0, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(1, 'days'))]}]}, '$pay_to_store', 0]}},

                                                            date2_total: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(1, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(2, 'days'))]}]}, '$total', 0]}},
                                                            date2_total_delivery_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(1, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(2, 'days'))]}]}, '$total_delivery_price', 0]}},
                                                            date2_total_order_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(1, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(2, 'days'))]}]}, '$total_order_price', 0]}},
                                                            date2_profit: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(1, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(2, 'days'))]}]}, '$total_store_income', 0]}},
                                                            date2_delivery_paid: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(1, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(2, 'days'))]}]}, '$store_have_service_payment', 0]}},
                                                            date2_recieved_order_payment: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(1, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(2, 'days'))]}]}, '$store_have_order_payment', 0]}},
                                                            date2_pay_to_store: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(1, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(2, 'days'))]}]}, '$pay_to_store', 0]}},

                                                            date3_total: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(2, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(3, 'days'))]}]}, '$total', 0]}},
                                                            date3_total_delivery_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(2, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(3, 'days'))]}]}, '$total_delivery_price', 0]}},
                                                            date3_total_order_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(2, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(3, 'days'))]}]}, '$total_order_price', 0]}},
                                                            date3_profit: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(2, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(3, 'days'))]}]}, '$total_store_income', 0]}},
                                                            date3_delivery_paid: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(2, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(3, 'days'))]}]}, '$store_have_service_payment', 0]}},
                                                            date3_recieved_order_payment: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(2, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(3, 'days'))]}]}, '$store_have_order_payment', 0]}},
                                                            date3_pay_to_store: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(2, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(3, 'days'))]}]}, '$pay_to_store', 0]}},

                                                            date4_total: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(3, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(4, 'days'))]}]}, '$total', 0]}},
                                                            date4_total_delivery_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(3, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(4, 'days'))]}]}, '$total_delivery_price', 0]}},
                                                            date4_total_order_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(3, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(4, 'days'))]}]}, '$total_order_price', 0]}},
                                                            date4_profit: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(3, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(4, 'days'))]}]}, '$total_store_income', 0]}},
                                                            date4_delivery_paid: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(3, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(4, 'days'))]}]}, '$store_have_service_payment', 0]}},
                                                            date4_recieved_order_payment: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(3, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(4, 'days'))]}]}, '$store_have_order_payment', 0]}},
                                                            date4_pay_to_store: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(3, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(4, 'days'))]}]}, '$pay_to_store', 0]}},

                                                            date5_total: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(4, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(5, 'days'))]}]}, '$total', 0]}},
                                                            date5_total_delivery_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(4, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(5, 'days'))]}]}, '$total_delivery_price', 0]}},
                                                            date5_total_order_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(4, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(5, 'days'))]}]}, '$total_order_price', 0]}},
                                                            date5_profit: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(4, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(5, 'days'))]}]}, '$total_store_income', 0]}},
                                                            date5_delivery_paid: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(4, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(5, 'days'))]}]}, '$store_have_service_payment', 0]}},
                                                            date5_recieved_order_payment: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(4, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(5, 'days'))]}]}, '$store_have_order_payment', 0]}},
                                                            date5_pay_to_store: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(4, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(5, 'days'))]}]}, '$pay_to_store', 0]}},

                                                            date6_total: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(5, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(6, 'days'))]}]}, '$total', 0]}},
                                                            date6_total_delivery_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(5, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(6, 'days'))]}]}, '$total_delivery_price', 0]}},
                                                            date6_total_order_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(5, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(6, 'days'))]}]}, '$total_order_price', 0]}},
                                                            date6_profit: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(5, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(6, 'days'))]}]}, '$total_store_income', 0]}},
                                                            date6_delivery_paid: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(5, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(6, 'days'))]}]}, '$store_have_service_payment', 0]}},
                                                            date6_recieved_order_payment: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(5, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(6, 'days'))]}]}, '$store_have_order_payment', 0]}},
                                                            date6_pay_to_store: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(5, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(6, 'days'))]}]}, '$pay_to_store', 0]}},

                                                            date7_total: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(6, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(7, 'days'))]}]}, '$total', 0]}},
                                                            date7_total_delivery_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(6, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(7, 'days'))]}]}, '$total_delivery_price', 0]}},
                                                            date7_total_order_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(6, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(7, 'days'))]}]}, '$total_order_price', 0]}},
                                                            date7_profit: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(6, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(7, 'days'))]}]}, '$total_store_income', 0]}},
                                                            date7_delivery_paid: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(6, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(7, 'days'))]}]}, '$store_have_service_payment', 0]}},
                                                            date7_recieved_order_payment: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(6, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(7, 'days'))]}]}, '$store_have_order_payment', 0]}},
                                                            date7_pay_to_store: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(6, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(store_weekly_earning.start_date).add(7, 'days'))]}]}, '$pay_to_store', 0]}}
                                                        }
                                                    }
                                                    var date = {
                                                        date1: new Date(moment(store_weekly_earning.start_date).add(1, 'days')),
                                                        date2: new Date(moment(store_weekly_earning.start_date).add(2, 'days')),
                                                        date3: new Date(moment(store_weekly_earning.start_date).add(3, 'days')),
                                                        date4: new Date(moment(store_weekly_earning.start_date).add(4, 'days')),
                                                        date5: new Date(moment(store_weekly_earning.start_date).add(5, 'days')),
                                                        date6: new Date(moment(store_weekly_earning.start_date).add(6, 'days')),
                                                        date7: new Date(moment(store_weekly_earning.start_date).add(7, 'days'))

                                                    }

                                                    Order_payment.aggregate([store_condition, filter, daily_condition]).then((order_day_total) => {
                                                        Order_payment.aggregate([store_condition, filter, total_condition]).then((order_total) => {

                                                            var order_total_new = {};
                                                            var order_day_total_new = {};
                                                            if (store_weekly_earning) {
                                                                console.log("if store_weekly_earning");
                                                                order_total_new = {

                                                                    total_item_price: store_weekly_earning.total_item_price,
                                                                    total_store_tax_price: store_weekly_earning.total_store_tax_price,
                                                                    total_order_price: store_weekly_earning.total_order_price,
                                                                    total_admin_profit_on_store: store_weekly_earning.total_admin_profit,
                                                                    total_store_income: store_weekly_earning.total_store_earning,
                                                                    wallet: store_weekly_earning.total_store_earning,
                                                                    total_earning: store_weekly_earning.total_store_earning,
                                                                    store_have_order_payment: store_weekly_earning.store_have_order_payment,
                                                                    store_have_service_payment: store_weekly_earning.store_have_service_payment,
                                                                    pay_to_store: store_weekly_earning.total_pay_to_store,
                                                                total_paid:store_weekly_earning.total_paid,
                                                                total_remaining_to_paid:store_weekly_earning.total_remaining_to_paid,
                                                                total_wallet_income_set: store_weekly_earning.total_wallet_income_set,
                                                                total_wallet_income_set_in_cash_order: store_weekly_earning.total_wallet_income_set_in_cash_order,
                                                                total_wallet_income_set_in_other_order: store_weekly_earning.total_wallet_income_set_in_other_order


                                                                }

                                                                if (order_day_total.length == 0) {
                                                                    order_day_total_new = order_day_total_new;
                                                                } else {

                                                                    order_day_total_new = order_day_total[0];
                                                                }


                                                            } else if (order_total.length != 0) {

                                                                order_total_new = order_total[0];
                                                                order_day_total_new = order_day_total[0];

                                                            } else {

                                                                order_total_new = order_total_new;
                                                                order_day_total_new = order_day_total_new;
                                                            }
                                                            if (store_analytic_weekly) {
                                                                response_data.json({success: true,
                                                                    message: STORE_MESSAGE_CODE.GET_WEEKLY_EARNING_SUCCESSFULLY,
                                                                    currency: currency,
                                                                    store_analytic_weekly: store_analytic_weekly,
                                                                    order_total: order_total_new,
                                                                    order_day_total: order_day_total_new,
                                                                    date: date
                                                                });
                                                            } else {
                                                                console.log("not store_analytic_weekly");

                                                                cron.setStoreWeeklyAnalyticsData(store, store_weekly_earning.end_date, timezone, function (return_data) {
                                                                    response_data.json({success: true,
                                                                        message: STORE_MESSAGE_CODE.GET_WEEKLY_EARNING_SUCCESSFULLY,
                                                                        currency: currency,
                                                                        store_analytic_weekly: return_data,
                                                                        order_total: order_total_new,
                                                                        order_day_total: order_day_total_new,
                                                                        date: date
                                                                    });
                                                                });
                                                            }
                                                        });
                                                    });
                                                });
                                            });
                                        }
                                    });
                                }
                            });

                        } else
                        {
                            response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND});
                        }
                    });

                } else
                {

                }
            });
        } else {
            response_data.json(response);
        }
    });
};


