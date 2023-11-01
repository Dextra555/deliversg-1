//CONSTANTS FILE IMPORT
require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
var console = require('../../utils/console');

var utils = require('../../utils/utils');
var myEarning = require('../../controllers/provider/provider_earning');
// IMPORT MODELS
var mongoose = require('mongoose');
var moment = require('moment-timezone');
// DATABASE TABLE IMPORT
var Provider = require('mongoose').model('provider');
var Country = require('mongoose').model('country');
var City = require('mongoose').model('city');
var Order_payment = require('mongoose').model('order_payment');
var Provider_analytic_daily = require('mongoose').model('provider_analytic_daily');

exports.provider_daily_earning = function (request_data, response_data) {
    var request_data_body = request_data.body;

    Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {

        if (provider) {
            if (request_data_body.server_token !== null && provider.server_token != request_data_body.server_token)
            {
                response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
            } else
            {
                var country_id = provider.country_id;

                Country.findOne({_id: country_id}).then((country) => {
                    City.findOne({_id: provider.city_id}).then((city) => {

                        var currency = "";
                        var city_timezone = "";
                        if(city){
                            city_timezone = city.timezone;
                        }

                        if (country) {
                            currency = country.currency_sign;
                            if(city_timezone == ""){
                                city_timezone = country.timezone;
                            }
                        }

                        var today = new Date(request_data_body.start_date);

                        if (today == '' || today == undefined) {
                            today = new Date();
                        }

                        var start_date = today;
                        start_date = start_date.setHours(0, 0, 0, 0);
                        start_date = new Date(start_date);

                        var end_date = today;
                        end_date = end_date.setHours(23, 59, 59, 999);
                        end_date = new Date(end_date);

                        var provider_condition = {"$match": {'provider_id': {$eq: mongoose.Types.ObjectId(request_data_body.provider_id)}}};
                        var filter = {"$match": {$and: [{"completed_date_in_city_timezone": {$gte: start_date, $lt: end_date}}, {total_provider_income: {$ne: 0}}]}};
                        var order_status_id_condition = {"$match": {'order_status_id': {$eq: ORDER_STATUS_ID.COMPLETED}}};

                        var tag_date = moment(start_date).format(DATE_FORMATE.DDMMYYYY);

                        Provider_analytic_daily.findOne({provider_id: provider._id, date_tag: tag_date}).then((provider_analytic_daily) => {
                            var provider_analytic_daily_data = {};

                            if (provider_analytic_daily)
                            {
                                provider_analytic_daily_data = provider_analytic_daily;

                                tag_date = moment.utc(utils.get_date_now_at_city(new Date(), city_timezone)).format("DDMMYYYY");
                                if (provider.is_online && tag_date == provider_analytic_daily.date_tag)
                                {
                                    var provider_time_diff_in_sec_online_time = 0;
                                    var provider_time_diff_in_sec_active_job_time = 0;
                                    provider_time_diff_in_sec_online_time = utils.getTimeDifferenceInSecond(new Date(), provider.start_online_time);
                                    provider_analytic_daily_data.total_online_time = +provider_analytic_daily.total_online_time + +provider_time_diff_in_sec_online_time;
                                    if (provider.is_active_for_job)
                                    {
                                        provider_time_diff_in_sec_active_job_time = utils.getTimeDifferenceInSecond(new Date(), provider.start_active_job_time);
                                        provider_analytic_daily_data.total_active_job_time = +provider_analytic_daily.total_active_job_time + +provider_time_diff_in_sec_active_job_time;
                                    }
                                }
                            }


                            Order_payment.aggregate([provider_condition, filter]).then((order_payments) => {

                                if (order_payments.length === 0)
                                {
                                    var order_total = {};
                                    response_data.json({success: true,
                                        message: PROVIDER_MESSAGE_CODE.GET_DAILY_EARNING_SUCCESSFULLY,
                                        currency: currency,
                                        provider_analytic_daily: provider_analytic_daily_data,
                                        order_total: order_total,
                                        order_payments: order_payments});
                                } else
                                {
                                    var total_condition = {
                                        $group: {
                                            _id: null,
                                            
                                            total_service_price: {$sum: '$total_service_price'},
                                            total_admin_tax_price: {$sum: '$total_admin_tax_price'},

                                            total_delivery_price: {$sum: '$total_delivery_price'},
                                            total_admin_profit_on_delivery: {$sum: '$total_admin_profit_on_delivery'},
                                            total_provider_profit: {$sum: '$total_provider_income'},
                                            
                                            provider_paid_order_payment: {$sum: {'$cond': [{'$eq': ['$is_payment_mode_cash', true], '$eq': ['$is_order_price_paid_by_store', false]}, '$total_order_price', 0]}},
                                            provider_have_cash_payment: {$sum: {'$cond': [{'$eq': ['$is_payment_mode_cash', true]}, '$cash_payment', 0]}},
                                            total_provider_have_cash_payment_on_hand: {$sum: {'$cond': [{'$eq': ['$is_payment_mode_cash', true], '$eq': ['$is_provider_income_set_in_wallet', false]}, '$cash_payment', 0]}},
                                            
                                            total_deduct_wallet_income: {$sum: {'$cond': [{"$and": [{'$eq': ['$is_provider_income_set_in_wallet', true]}, {'$lt': ['$pay_to_provider', 0]}]}, '$provider_income_set_in_wallet', 0]}},
                                            total_added_wallet_income: {$sum: {'$cond': [{"$and": [{'$eq': ['$is_provider_income_set_in_wallet', true]}, {'$gt': ['$pay_to_provider', 0]}]}, '$provider_income_set_in_wallet', 0]}},
                                            total_wallet_income_set: {$sum: {'$cond': [{'$eq': ['$is_provider_income_set_in_wallet', true]}, '$pay_to_provider', 0]}},
                                            
                                            total_earning: {$sum: '$total_provider_income'},
                                            total_transferred_amount: {$sum: {'$cond': [{$and: [{'$eq': ['$is_provider_income_set_in_wallet', false]}, {'$eq': ['$is_transfered_to_provider', true]}]}, '$pay_to_provider', 0]}},                                           
                                            total_paid: {$sum: {'$cond': [{$and: [{'$eq': ['$is_transfered_to_provider', true]}]}, '$pay_to_provider', 0]}},
                                            pay_to_provider: {$sum: {'$cond': [{$and: [{'$eq': ['$is_provider_income_set_in_wallet', false]}, {'$eq': ['$is_transfered_to_provider', false]}]}, '$pay_to_provider', 0]}},
                                            
                                        }
                                    }

                                    Order_payment.aggregate([provider_condition, filter, total_condition]).then((order_total) => {
                                        response_data.json({success: true,
                                            message: PROVIDER_MESSAGE_CODE.GET_DAILY_EARNING_SUCCESSFULLY,
                                            currency: currency,
                                            provider_analytic_daily: provider_analytic_daily_data,
                                            order_total: order_total[0],
                                            order_payments: order_payments});
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
            }
        } else
        {
            response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
        }
    }, (error) => {
        console.log(error);
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    });

};

exports.provider_weekly_earning = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'start_date', type: 'string'}, {name: 'end_date', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {
                if (provider) {

                    if (request_data_body.type != 1 && request_data_body.server_token !== null && provider.server_token != request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {

                        Country.findOne({_id: provider.country_id}).then((country) => {
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

                            var provider_condition = {"$match": {'provider_id': {$eq: mongoose.Types.ObjectId(request_data_body.provider_id)}}};
                            var order_status_id_condition = {"$match": {'order_status_id': {$eq: ORDER_STATUS_ID.COMPLETED}}};
                            var filter = {"$match": {$and: [{"completed_date_in_city_timezone": {$gte: start_date, $lt: end_date}}, {total_provider_income: {$ne: 0}}]}};
                            var total_condition = {
                                $group: {
                                    _id: null,
                                    
                                    total_service_price: {$sum: '$total_service_price'},
                                    total_admin_tax_price: {$sum: '$total_admin_tax_price'},

                                    total_delivery_price: {$sum: '$total_delivery_price'},
                                    total_admin_profit_on_delivery: {$sum: '$total_admin_profit_on_delivery'},
                                    total_provider_profit: {$sum: '$total_provider_income'},

                                    provider_paid_order_payment: {$sum: {'$cond': [{'$eq': ['$is_payment_mode_cash', true], '$eq': ['$is_order_price_paid_by_store', false]}, '$total_order_price', 0]}},
                                    provider_have_cash_payment: {$sum: {'$cond': [{'$eq': ['$is_payment_mode_cash', true]}, '$cash_payment', 0]}},
                                    total_provider_have_cash_payment_on_hand: {$sum: {'$cond': [{'$eq': ['$is_payment_mode_cash', true], '$eq': ['$is_provider_income_set_in_wallet', false]}, '$cash_payment', 0]}},
                                   
                                    total_deduct_wallet_income: {$sum: {'$cond': [ {"$and": [ { '$eq': ['$is_provider_income_set_in_wallet', true] }, {'$lt': ['$pay_to_provider', 0] }] }  , '$provider_income_set_in_wallet', 0]}},
                                    total_added_wallet_income: {$sum: {'$cond': [ {"$and": [ { '$eq': ['$is_provider_income_set_in_wallet', true] }, {'$gt': ['$pay_to_provider', 0] }] }  , '$provider_income_set_in_wallet', 0]}},
                                    total_wallet_income_set: {$sum: {'$cond': [{'$eq': ['$is_provider_income_set_in_wallet', true]}, '$pay_to_provider', 0]}},

                                    total_earning: {$sum: '$total_provider_income'},
                                    total_transferred_amount: {$sum: {'$cond': [{$and: [{'$eq': ['$is_provider_income_set_in_wallet', false]}, {'$eq': ['$is_transfered_to_provider', true]}]}, '$pay_to_provider', 0]}},
                                    total_paid: {$sum: {'$cond': [{$and: [{'$eq': ['$is_transfered_to_provider', true]}]}, '$pay_to_provider', 0]}},
                                    pay_to_provider: {$sum: {'$cond': [{$and: [{'$eq': ['$is_provider_income_set_in_wallet', false]}, {'$eq': ['$is_transfered_to_provider', false]}]}, '$pay_to_provider', 0]}},

                                }

                            }
                            var daily_condition = {
                                $group: {
                                    _id: null,
                                    date1: {$sum: {$cond: [{$eq: ["$completed_date_tag", moment(new Date(moment(start_date_time).add(0, 'days'))).format(DATE_FORMATE.DDMMYYYY)]}, '$total_provider_income', 0]}},
                                    date2: {$sum: {$cond: [{$eq: ["$completed_date_tag", moment(new Date(moment(start_date_time).add(1, 'days'))).format(DATE_FORMATE.DDMMYYYY)]}, '$total_provider_income', 0]}},
                                    date3: {$sum: {$cond: [{$eq: ["$completed_date_tag", moment(new Date(moment(start_date_time).add(2, 'days'))).format(DATE_FORMATE.DDMMYYYY)]}, '$total_provider_income', 0]}},
                                    date4: {$sum: {$cond: [{$eq: ["$completed_date_tag", moment(new Date(moment(start_date_time).add(3, 'days'))).format(DATE_FORMATE.DDMMYYYY)]}, '$total_provider_income', 0]}},
                                    date5: {$sum: {$cond: [{$eq: ["$completed_date_tag", moment(new Date(moment(start_date_time).add(4, 'days'))).format(DATE_FORMATE.DDMMYYYY)]}, '$total_provider_income', 0]}},
                                    date6: {$sum: {$cond: [{$eq: ["$completed_date_tag", moment(new Date(moment(start_date_time).add(5, 'days'))).format(DATE_FORMATE.DDMMYYYY)]}, '$total_provider_income', 0]}},
                                    date7: {$sum: {$cond: [{$eq: ["$completed_date_tag", moment(new Date(moment(start_date_time).add(6, 'days'))).format(DATE_FORMATE.DDMMYYYY)]}, '$total_provider_income', 0]}}
                                }

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


                            Order_payment.aggregate([provider_condition, filter, daily_condition]).then((order_day_total) => {
                                Order_payment.aggregate([provider_condition, filter, total_condition]).then((order_total) => {

                                    var order_total_new = {};
                                    var order_day_total_new = {};

                                    if (order_day_total.length != 0) {
                                        order_total_new = order_total[0];
                                        order_day_total_new = order_day_total[0];
                                    }



                                    myEarning.get_provider_weekly_analytics_data(provider, end_date,  function (return_data) {
                                        response_data.json({success: true,
                                            message: PROVIDER_MESSAGE_CODE.GET_WEEKLY_EARNING_SUCCESSFULLY,
                                            currency: currency,
                                            provider_analytic_weekly: return_data,
                                            provider:provider,
                                            order_total: order_total_new,
                                            order_day_total: order_day_total_new,
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
                    }
                } else
                {
                    response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_DATA_NOT_FOUND});
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

exports.get_provider_weekly_analytics_data = function (provider_detail, end_date, return_data) {


            var week_end_date = moment(end_date);
            var week_end_date_for_tag = week_end_date;
            var date_tag_array = [];
            var tag = "";

            for (var i = 0; i < 7; i++) {
                tag = moment(week_end_date_for_tag).format(DATE_FORMATE.DDMMYYYY);
                date_tag_array.push(tag);
                week_end_date_for_tag = moment(week_end_date_for_tag).subtract(1, 'days');
            }

            var provider_id = provider_detail._id;
            Provider_analytic_daily.find({provider_id: provider_id, date_tag: {$in: date_tag_array}}).then((provider_analytic_dailies) => {

                var received = 0;
                var accepted = 0;
                var rejected = 0;
                var not_answered = 0;
                var cancelled = 0;
                var completed = 0;
                var total_online_time = 0;
                var total_active_job_time = 0;
                var acception_ratio = 0;
                var rejection_ratio = 0;
                var cancellation_ratio = 0;
                var completed_ratio = 0;
                var provider_analytic_daily_count = 0;

                var provider_analytic_weekly = {
                    received: received,
                    accepted: accepted,
                    rejected: rejected,
                    not_answered: not_answered,
                    cancelled: cancelled,
                    completed: completed,
                    acception_ratio: acception_ratio,
                    cancellation_ratio: cancellation_ratio,
                    rejection_ratio: rejection_ratio,
                    completed_ratio: completed_ratio,
                    total_online_time: total_online_time,
                    total_active_job_time: total_active_job_time
                };

                if (provider_analytic_dailies.length > 0) {
                    var provider_analytic_dailies_size = provider_analytic_dailies.length;

                    provider_analytic_dailies.forEach(function (provider_analytic_daily) {

                        provider_analytic_daily_count++;

                        if (provider_analytic_daily) {
                            received = received + provider_analytic_daily.received;
                            accepted = accepted + provider_analytic_daily.accepted;
                            rejected = rejected + provider_analytic_daily.rejected;
                            not_answered = not_answered + provider_analytic_daily.not_answered;
                            cancelled = cancelled + provider_analytic_daily.cancelled;
                            completed = completed + provider_analytic_daily.completed;
                            total_online_time = total_online_time + provider_analytic_daily.total_online_time;
                            total_active_job_time = total_active_job_time + provider_analytic_daily.total_active_job_time;
                        }

                        if (provider_analytic_daily_count == provider_analytic_dailies_size)
                        {
                            if (Number(received) > 0) {
                                acception_ratio = utils.precisionRoundTwo(Number((accepted * 100) / received));
                                cancellation_ratio = utils.precisionRoundTwo(Number((cancelled * 100) / received));
                                completed_ratio = utils.precisionRoundTwo(Number((completed * 100) / received));
                                rejection_ratio = utils.precisionRoundTwo(Number((rejected * 100) / received));
                            }


                            provider_analytic_weekly.received = received;
                            provider_analytic_weekly.accepted = accepted;
                            provider_analytic_weekly.rejected = rejected;
                            provider_analytic_weekly.not_answered = not_answered;
                            provider_analytic_weekly.cancelled = cancelled;
                            provider_analytic_weekly.completed = completed;
                            provider_analytic_weekly.acception_ratio = acception_ratio;
                            provider_analytic_weekly.cancellation_ratio = cancellation_ratio;
                            provider_analytic_weekly.rejection_ratio = rejection_ratio;
                            provider_analytic_weekly.completed_ratio = completed_ratio;
                            provider_analytic_weekly.total_online_time = total_online_time;
                            provider_analytic_weekly.total_active_job_time = total_active_job_time;

                            if (return_data != null) {
                                return_data(provider_analytic_weekly);
                            } else {
                                return;
                            }

                        }
                    });
                } else {
                    if (return_data != null) {
                        return_data(provider_analytic_weekly);
                    } else {
                        return;
                    }
                }
            }, (error) => {
                console.log(error);
                response_data.json({
                    success: false,
                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                });
            });

};
