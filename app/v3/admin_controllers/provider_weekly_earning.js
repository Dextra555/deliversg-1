require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var cron = require('../controllers/user/cron_job');
var emails = require('../controllers/email_sms/emails');
var Provider = require('mongoose').model('provider');
var Country = require('mongoose').model('country');
var Order_payment = require('mongoose').model('order_payment');
var City = require('mongoose').model('city');
var mongoose = require('mongoose');
var moment = require('moment-timezone');
var utils = require('../utils/utils');
var console = require('../utils/console');

// provider_weekly_earning

// provider_weekly_earning
exports.provider_weekly_earning = function (request_data, response_data) {
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

            var provider_query = {
                $lookup:
                        {
                            from: "providers",
                            localField: "provider_id",
                            foreignField: "_id",
                            as: "provider_detail"
                        }
            };
            var array_to_json_provider_query = {$unwind: "$provider_detail"};

            var country_query = {
                $lookup:
                        {
                            from: "countries",
                            localField: "provider_detail.country_id",
                            foreignField: "_id",
                            as: "country_detail"
                        }
            };


            var provider_analytic_weekly_query = {
                $lookup:
                        {
                            from: "provider_analytic_weeklies",
                            localField: "provider_id",
                            foreignField: "provider_id",
                            as: "provider_analytic_weekly_detail"
                        }
            };

            // var number_of_rec = SEARCH_SORT.NO_OF_RECORD_PER_PAGE;
            var number_of_rec = request_data_body.number_of_rec;

            var page = request_data_body.page;

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
            } else
            {
                var query = {};
                query[search_field] = {$regex: new RegExp(search_value, 'i')};
                var search = {"$match": query};
            }

            var order_status_id_condition = {"$match":{$or: [ {'order_status_id': {$eq: ORDER_STATUS_ID.COMPLETED}},{'order_status': {$eq: ORDER_STATE.CANCELED_BY_USER}}]}};
            var filter = {"$match": {$and: [{"completed_date_in_city_timezone": {$gte: start_date, $lt: end_date}}, {total_provider_income: {$ne: 0}}]}};

            var count = {$group: {_id: null, totals: {$sum: 1}, data: {$push: '$data'}}};
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;

            var provider_weekly_group = {
                $group: {
                    _id: '$provider_id',
                    total_order: {$sum: 1},
                    total_provider_earning: {$sum: '$total_provider_income'},
                    total_provider_have_cash_payment: {$sum: {'$cond': [{'$eq': ['$is_payment_mode_cash', true], '$eq': ['$is_order_price_paid_by_store', false]}, '$total_order_price', 0]}},
                    total_pay_to_provider: {$sum: {'$cond': [{$and: [{'$eq': ['$is_provider_income_set_in_wallet', false]},{'$eq': ['$is_transfered_to_provider', false]}]}, '$pay_to_provider', 0]}},
                    total_wallet_income_set_in_cash_order: {$sum: {'$cond': [{'$eq': ['$is_provider_income_set_in_wallet', true], '$eq': ['$is_payment_mode_cash', true]}, '$provider_income_set_in_wallet', 0]}},
                    total_wallet_income_set_in_other_order: {$sum: {'$cond': [{'$eq': ['$is_provider_income_set_in_wallet', true], '$eq': ['$is_payment_mode_cash', false]}, '$provider_income_set_in_wallet', 0]}},
                    provider_have_cash_payment: {$sum: {'$cond': [{'$eq': ['$is_payment_mode_cash', true]}, '$cash_payment', 0]}},
                    total_deduct_wallet_income: {$sum: {'$cond': [{"$and": [{'$eq': ['$is_provider_income_set_in_wallet', true]}, {'$lt': ['$pay_to_provider', 0]}]}, '$provider_income_set_in_wallet', 0]}},
                    total_added_wallet_income: {$sum: {'$cond': [{"$and": [{'$eq': ['$is_provider_income_set_in_wallet', true]}, {'$gt': ['$pay_to_provider', 0]}]}, '$provider_income_set_in_wallet', 0]}},

                    total_transferred_amount: {$sum: {'$cond': [{$and: [{'$eq': ['$is_provider_income_set_in_wallet', false]}, {'$eq': ['$is_transfered_to_provider', true]} ]}, '$pay_to_provider', 0]}},
                    provider_detail: {$first: '$provider_detail'},
                    country_detail: {$first: '$country_detail'}
                }
            }

            Order_payment.aggregate([provider_query, array_to_json_provider_query, filter, search, provider_weekly_group, count]).then((provider_weekly_earnings) => {

                if (provider_weekly_earnings.length === 0)
                {
                    response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0});
                } else
                {
                    var pages = Math.ceil(provider_weekly_earnings[0].totals / number_of_rec);
                    var total_condition = {
                        $group: {
                            _id: "null",
                            total_orders: {$sum: 1},
                            total_admin_earn: {$sum:{$sum: ["$total_admin_profit_on_delivery", "$total_admin_profit_on_provider"] }},
                            total_provider_earning: {$sum: '$total_provider_income'},
                            total_pay_to_provider: {$sum: {'$cond': [{$and: [{'$eq': ['$is_provider_income_set_in_wallet', false]},{'$eq': ['$is_transfered_to_provider', false]}]}, '$pay_to_provider', 0]}},
                            total_wallet_income_set_in_cash_order: {$sum: {'$cond': [{'$eq': ['$is_provider_income_set_in_wallet', true], '$eq': ['$is_payment_mode_cash', true]}, '$provider_income_set_in_wallet', 0]}},
                            total_wallet_income_set_in_other_order: {$sum: {'$cond': [{'$eq': ['$is_provider_income_set_in_wallet', true], '$eq': ['$is_payment_mode_cash', false]}, '$provider_income_set_in_wallet', 0]}},
                            total_deduct_wallet_income: {$sum: {'$cond': [{"$and": [{'$eq': ['$is_provider_income_set_in_wallet', true]}, {'$lt': ['$pay_to_provider', 0]}]}, '$provider_income_set_in_wallet', 0]}},
                            total_added_wallet_income: {$sum: {'$cond': [{"$and": [{'$eq': ['$is_provider_income_set_in_wallet', true]}, {'$gt': ['$pay_to_provider', 0]}]}, '$provider_income_set_in_wallet', 0]}},

                        }
                    }
                    Order_payment.aggregate([provider_query, array_to_json_provider_query, country_query,filter, search, total_condition]).then((order_total) => {

                        if(page){
                            Order_payment.aggregate([provider_query, array_to_json_provider_query, country_query, filter, search, provider_weekly_group, skip, limit]).then((provider_weekly_earnings) => {

                                response_data.json({success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,

                                    admin_currency: setting_detail.admin_currency,
                                    order_total: order_total[0],
                                    pages: pages,
                                    provider_weekly_earnings: provider_weekly_earnings
                                });
                            }, (error) => {
                                console.log(error)
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });

                            });
                        }
                        else
                        {
                            Order_payment.aggregate([provider_query, array_to_json_provider_query, country_query, filter, search], function (error, provider_weekly_earnings) {

                                response_data.json({success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,

                                    admin_currency: setting_detail.admin_currency,
                                    order_total: order_total[0],
                                    pages: pages,
                                    provider_weekly_earnings: provider_weekly_earnings
                                });
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

//admin_paid_to_provider
exports.admin_paid_to_provider = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider_weekly_earning.findOne({_id: request_data_body.provider_weekly_earning_id}).then((provider_weekly_earning) => {
                provider_weekly_earning.total_paid = +provider_weekly_earning.total_paid + +request_data_body.amount;
                provider_weekly_earning.total_remaining_to_paid = provider_weekly_earning.total_remaining_to_paid - request_data_body.amount;
                provider_weekly_earning.is_weekly_invoice_paid = true;

                provider_weekly_earning.save().then(() => {
                        response_data.json({success: true,
                            message: ITEM_MESSAGE_CODE.STATE_CHANGE_SUCCESSFULLY
                        });
                }, (error) => {
                    console.log(error)
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                }, (error) => {
                    console.log(error)
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                });
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

//weekly_statement_for_provider
exports.weekly_statement_for_provider = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider_weekly_earning.findOne({_id: request_data_body.provider_weekly_earning_id}).then((provider_weekly_earning) => {
                Provider.findOne({_id: provider_weekly_earning.provider_id}).then((provider) => {
                    if (provider) {

                        var city_id = provider.city_id;
                        var country_id = provider.country_id;
                        Country.findOne({_id: country_id}).then((country) => {
                            if (country) {
                                var currency = country.currency_sign;
                                City.findOne({_id: city_id}).then((city) => {
                                    if (city) {
                                        var timezone = city.timezone;
                                        Provider_weekly_earning.findOne({_id: request_data_body.provider_weekly_earning_id, start_date_tag: provider_weekly_earning.start_date_tag, end_date_tag: provider_weekly_earning.end_date_tag}).then((provider_weekly_earning) => {
                                            Provider_analytic_weekly.findOne({provider_id: provider_weekly_earning.provider_id, start_date_tag: provider_weekly_earning.start_date_tag, end_date_tag: provider_weekly_earning.end_date_tag
                                            }).then((provider_analytic_weekly) => {

                                                var provider_condition = {"$match": {'provider_id': {$eq: mongoose.Types.ObjectId(provider_weekly_earning.provider_id)}}};
                                                var filter = {"$match": {"delivered_at": {$gte: provider_weekly_earning.start_date, $lt: provider_weekly_earning.end_date}}};
                                                var total_condition = {
                                                    $group: {
                                                        _id: null,
                                                        total_service_price: {$sum: '$total_service_price'},

                                                        total_admin_tax_price: {$sum: '$total_admin_tax_price'},
                                                        total_delivery_price: {$sum: '$total_delivery_price'},
                                                        total_admin_profit_on_delivery: {$sum: '$total_admin_profit_on_delivery'},
                                                        total_provider_profit: {$sum: '$total_provider_income'},
                                                        wallet: {$sum: '$wallet_payment'},
                                                        total_earning: {$sum: '$total_provider_income'},
                                                        provider_paid_order_payment: {$sum: {'$cond': [{'$eq': ['$is_payment_mode_cash', true], '$eq': ['$is_order_price_paid_by_store', false]}, '$total_order_price', 0]}},
                                                        provider_have_cash_payment: {$sum: {'$cond': [{'$eq': ['$is_payment_mode_cash', true]}, '$cash_payment', 0]}},


                                                        pay_to_provider: {$sum: {'$cond': [{'$eq': ['$is_provider_income_set_in_wallet', false]}, '$pay_to_provider', 0]}},
                                                        total_wallet_income_set: {$sum: {'$cond': [{'$eq': ['$is_provider_income_set_in_wallet', true]}, '$provider_income_set_in_wallet', 0]}},

                                                        total_paid: {$sum: 0},
                                                        total_remaining_to_paid: {$sum: {'$cond': [{'$eq': ['$is_provider_income_set_in_wallet', false]}, '$pay_to_provider', 0]}},

                                                        total_wallet_income_set_in_cash_order: {$sum: {'$cond': [{'$eq': ['$is_provider_income_set_in_wallet', true], '$eq': ['$is_payment_mode_cash', true]}, '$provider_income_set_in_wallet', 0]}},
                                                        total_wallet_income_set_in_other_order: {$sum: {'$cond': [{'$eq': ['$is_provider_income_set_in_wallet', true], '$eq': ['$is_payment_mode_cash', false]}, '$provider_income_set_in_wallet', 0]}},
                                                        total_provider_have_cash_payment_on_hand: {$sum: {'$cond': [{'$eq': ['$is_payment_mode_cash', true], '$eq': ['$is_provider_income_set_in_wallet', false]}, '$cash_payment', 0]}}

                                                    }





                                                }
                                                var daily_condition = {
                                                    $group: {
                                                        _id: null,
                                                        date1_total: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(0, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(1, 'days'))]}]}, '$total', 0]}},
                                                        date1_total_delivery_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(0, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(1, 'days'))]}]}, '$total_delivery_price', 0]}},
                                                        date1_total_order_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(0, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(1, 'days'))]}]}, '$total_order_price', 0]}},
                                                        date1_profit: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(0, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(1, 'days'))]}]}, '$total_provider_income', 0]}},
                                                        date1_cash: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(0, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(1, 'days'))]}]}, '$provider_have_cash_payment', 0]}},
                                                        date1_paid_order: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(0, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(1, 'days'))]}]}, '$provider_paid_order_payment', 0]}},
                                                        date1_earn: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(0, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(1, 'days'))]}]}, '$total_provider_have_payment', 0]}},

                                                        date2_total: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(1, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(2, 'days'))]}]}, '$total', 0]}},
                                                        date2_total_delivery_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(1, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(2, 'days'))]}]}, '$total_delivery_price', 0]}},
                                                        date2_total_order_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(1, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(2, 'days'))]}]}, '$total_order_price', 0]}},
                                                        date2_profit: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(1, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(2, 'days'))]}]}, '$total_provider_income', 0]}},
                                                        date2_cash: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(1, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(2, 'days'))]}]}, '$provider_have_cash_payment', 0]}},
                                                        date2_paid_order: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(1, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(2, 'days'))]}]}, '$provider_paid_order_payment', 0]}},
                                                        date2_earn: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(1, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(2, 'days'))]}]}, '$total_provider_have_payment', 0]}},

                                                        date3_total: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(2, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(3, 'days'))]}]}, '$total', 0]}},
                                                        date3_total_delivery_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(2, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(3, 'days'))]}]}, '$total_delivery_price', 0]}},
                                                        date3_total_order_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(2, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(3, 'days'))]}]}, '$total_order_price', 0]}},
                                                        date3_profit: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(2, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(3, 'days'))]}]}, '$total_provider_income', 0]}},
                                                        date3_cash: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(2, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(3, 'days'))]}]}, '$provider_have_cash_payment', 0]}},
                                                        date3_paid_order: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(2, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(3, 'days'))]}]}, '$provider_paid_order_payment', 0]}},
                                                        date3_earn: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(2, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(3, 'days'))]}]}, '$total_provider_have_payment', 0]}},

                                                        date4_total: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(3, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(4, 'days'))]}]}, '$total', 0]}},
                                                        date4_total_delivery_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(3, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(4, 'days'))]}]}, '$total_delivery_price', 0]}},
                                                        date4_total_order_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(3, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(4, 'days'))]}]}, '$total_order_price', 0]}},
                                                        date4_profit: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(3, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(4, 'days'))]}]}, '$total_provider_income', 0]}},
                                                        date4_cash: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(3, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(4, 'days'))]}]}, '$provider_have_cash_payment', 0]}},
                                                        date4_paid_order: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(3, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(4, 'days'))]}]}, '$provider_paid_order_payment', 0]}},
                                                        date4_earn: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(3, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(4, 'days'))]}]}, '$total_provider_have_payment', 0]}},

                                                        date5_total: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(4, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(5, 'days'))]}]}, '$total', 0]}},
                                                        date5_total_delivery_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(4, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(5, 'days'))]}]}, '$total_delivery_price', 0]}},
                                                        date5_total_order_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(4, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(5, 'days'))]}]}, '$total_order_price', 0]}},
                                                        date5_profit: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(4, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(5, 'days'))]}]}, '$total_provider_income', 0]}},
                                                        date5_cash: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(4, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(5, 'days'))]}]}, '$provider_have_cash_payment', 0]}},
                                                        date5_paid_order: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(4, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(5, 'days'))]}]}, '$provider_paid_order_payment', 0]}},
                                                        date5_earn: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(4, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(5, 'days'))]}]}, '$total_provider_have_payment', 0]}},

                                                        date6_total: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(5, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(6, 'days'))]}]}, '$total', 0]}},
                                                        date6_total_delivery_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(5, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(6, 'days'))]}]}, '$total_delivery_price', 0]}},
                                                        date6_total_order_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(5, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(6, 'days'))]}]}, '$total_order_price', 0]}},
                                                        date6_profit: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(5, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(6, 'days'))]}]}, '$total_provider_income', 0]}},
                                                        date6_cash: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(5, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(6, 'days'))]}]}, '$provider_have_cash_payment', 0]}},
                                                        date6_paid_order: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(5, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(6, 'days'))]}]}, '$provider_paid_order_payment', 0]}},
                                                        date6_earn: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(5, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(6, 'days'))]}]}, '$total_provider_have_payment', 0]}},

                                                        date7_total: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(6, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(7, 'days'))]}]}, '$total', 0]}},
                                                        date7_total_delivery_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(6, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(7, 'days'))]}]}, '$total_delivery_price', 0]}},
                                                        date7_total_order_price: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(6, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(7, 'days'))]}]}, '$total_order_price', 0]}},
                                                        date7_profit: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(6, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(7, 'days'))]}]}, '$total_provider_income', 0]}},
                                                        date7_cash: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(6, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(7, 'days'))]}]}, '$provider_have_cash_payment', 0]}},
                                                        date7_paid_order: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(6, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(7, 'days'))]}]}, '$provider_paid_order_payment', 0]}},
                                                        date7_earn: {$sum: {$cond: [{$and: [{$gte: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(6, 'days'))]}, {$lt: ["$delivered_at", new Date(moment(provider_weekly_earning.start_date).add(7, 'days'))]}]}, '$total_provider_have_payment', 0]}}
                                                    }
                                                }
                                                var date = {
                                                    date1: new Date(moment(provider_weekly_earning.start_date).add(1, 'days')),
                                                    date2: new Date(moment(provider_weekly_earning.start_date).add(2, 'days')),
                                                    date3: new Date(moment(provider_weekly_earning.start_date).add(3, 'days')),
                                                    date4: new Date(moment(provider_weekly_earning.start_date).add(4, 'days')),
                                                    date5: new Date(moment(provider_weekly_earning.start_date).add(5, 'days')),
                                                    date6: new Date(moment(provider_weekly_earning.start_date).add(6, 'days')),
                                                    date7: new Date(moment(provider_weekly_earning.start_date).add(7, 'days'))

                                                }


                                                Order_payment.aggregate([provider_condition, filter, daily_condition]).then((order_day_total) => {
                                                    Order_payment.aggregate([provider_condition, filter, total_condition]).then((order_total) => {

                                                        var order_total_new = {};
                                                        var order_day_total_new = {};

                                                        if (provider_weekly_earning) {
                                                            order_total_new = {
                                                                total_service_price: provider_weekly_earning.total_service_price,
                                                                total_admin_tax_price: provider_weekly_earning.total_admin_tax_price,
                                                                total_delivery_price: provider_weekly_earning.total_delivery_price,
                                                                total_admin_profit_on_delivery: provider_weekly_earning.total_admin_profit,
                                                                total_provider_profit: provider_weekly_earning.total_provider_earning,
                                                                wallet: provider_weekly_earning.total_provider_earning,
                                                                total_earning: provider_weekly_earning.total_provider_earning,
                                                                provider_paid_order_payment: provider_weekly_earning.total_provider_paid_order_payment,
                                                                provider_have_cash_payment: provider_weekly_earning.total_provider_have_cash_payment,

                                                                pay_to_provider: provider_weekly_earning.total_pay_to_provider,
                                                                total_paid: provider_weekly_earning.total_paid,
                                                                total_remaining_to_paid: provider_weekly_earning.total_remaining_to_paid,
                                                                total_wallet_income_set: provider_weekly_earning.total_wallet_income_set,
                                                                total_wallet_income_set_in_cash_order: provider_weekly_earning.total_wallet_income_set_in_cash_order,
                                                                total_wallet_income_set_in_other_order: provider_weekly_earning.total_wallet_income_set_in_other_order,
                                                                total_provider_have_cash_payment_on_hand: provider_weekly_earning.total_provider_have_cash_payment_on_hand

                                                            }
                                                            if (order_day_total.length == 0) {
                                                                order_day_total_new = order_day_total_new;
                                                            } else {
                                                                order_day_total_new = order_day_total[0];
                                                            }


                                                        } else if (order_total.length != 0) {

                                                            order_total_new = order_total[0];
                                                            order_day_total_new = order_day_total[0];
                                                        } else
                                                        {

                                                            order_total_new = order_total_new;
                                                            order_day_total_new = order_day_total_new;
                                                        }

                                                        if (provider_analytic_weekly) {
                                                            response_data.json({success: true,
                                                                message: PROVIDER_MESSAGE_CODE.GET_WEEKLY_EARNING_SUCCESSFULLY,
                                                                currency: currency,
                                                                provider_analytic_weekly: provider_analytic_weekly,
                                                                order_total: order_total_new,
                                                                order_day_total: order_day_total_new,
                                                                date: date
                                                            });
                                                        } else {

                                                            cron.setProviderWeeklyAnalyticsData(provider, provider_weekly_earning.end_date_time, timezone, function (return_data) {
                                                                response_data.json({success: true,
                                                                    message: PROVIDER_MESSAGE_CODE.GET_WEEKLY_EARNING_SUCCESSFULLY,
                                                                    currency: currency,
                                                                    provider_analytic_weekly: return_data,
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

                    }

                });

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



