require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var Order = require('mongoose').model('order');
var Order_payment = require('mongoose').model('order_payment');
var Store = require('mongoose').model('store');
const order_payment = require('../../models/user/order_payment');
var console = require('../utils/console');
var mongoose = require('mongoose');

var utils = require('../utils/utils');

// get_admin_earning
exports.get_admin_earning = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var search_by = request_data_body.query.search_by || null;
            var search_value = request_data_body.query.search_value || null;

            var date_filter = {$match:{}}
            var delivery_type_filter = {$match:{}};
            var payment_by_filter = {$match:{}};
            var search_by_filter = {$match:{}};
            
            // Date Filter
            if(request_data_body.start_date && request_data_body.end_date){

                
                var start_date = new Date(request_data_body.start_date);
                var end_date = new Date(request_data_body.end_date);
                start_date = start_date.setHours(0, 0, 0, 0);
                start_date = new Date(start_date);
                end_date = end_date.setHours(23, 59, 59, 999);
                end_date = new Date(end_date);

                var timeZone = "Asia/Calcutta";

                if(request_data_body.timezone && request_data_body.timezone !== ""){
                    timeZone = request_data_body.timezone;
                }
                start_date = utils.get_date_in_citytimezone(start_date,timeZone)
                end_date = utils.get_date_in_citytimezone(end_date,timeZone)

                date_filter = {
                    $match:{ 
                        completed_date_in_city_timezone: { 
                            $gte: start_date, $lt: end_date 
                        }
                    }
                };


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
                    case 'store':
                        search_by_filter.$match.$or.push({"store_detail.name":{'$regex' : search_value, '$options' : 'i'}})
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
                            delivery_type_filter.$match.$or.push({$and:[{ "is_user_pick_up_order":false},{ "is_schedule_order":false}]})
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

            
            var order_status_id_condition = {"$match":{$or: [ {'order_status_id': {$eq: ORDER_STATUS_ID.COMPLETED}},{'order_status': {$eq: ORDER_STATE.CANCELED_BY_USER}}]}};
            
            
            
            var number_of_rec = request_data_body.perPage;
            var page = request_data_body.page;
            var slice_project = {$match:{}};

            if(number_of_rec && number_of_rec > 0){
                slice_project = {
                    $project: {
                        _id: 0,
                        count: 1,
                        results: {
                            $slice: ['$results',page ? (page - 1) * number_of_rec : 0 , number_of_rec]                      
                        }
                    }
                }
            }


            const aggregatation = [
                delivery_type_filter,
                date_filter,
                order_status_id_condition,
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
                payment_by_filter,
                {
                    $project: {
                        unique_id:'$unique_id',
                        order_payment_id:'$order_payment_details._id',
                        completed_at:'$completed_date_in_city_timezone',
                        order_currency_code:'$order_payment_details.order_currency_code',
                        total: {$multiply: ['$order_payment_details.total', '$order_payment_details.current_rate']},
                        deliveryman_earn: {$multiply: ['$order_payment_details.total_provider_income', '$order_payment_details.current_rate']},
                        store_earn: {$multiply: ['$order_payment_details.total_store_income', '$order_payment_details.current_rate']},
                        admin_earn: {$multiply: [{$sum:['$order_payment_details.total_admin_profit_on_delivery','$order_payment_details.total_admin_profit_on_store']}, '$order_payment_details.current_rate']},
                        user_name: "$user_detail.name",
                        store_name: "$store_detail.name",
                        provider_name: "$provider_detail.name",
                        is_paid_from_wallet: "$order_payment_details.is_paid_from_wallet",
                        is_payment_mode_cash: "$order_payment_details.is_payment_mode_cash",
                        card_payment: "$order_payment_details.card_payment"
                    }
                },
                {
                    $sort:{
                        unique_id:-1
                    }
                },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        results: {
                            $push: '$$ROOT'
                        }
                    }
                },                
                slice_project                
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

        } else {
            response_data.json(response);
        }
    });
};

exports.fetch_earning_detail = function(request_data,response_data){
    utils.check_request_params(request_data.body, [{name:'order_payment_id'}], function (response) {
        if (response.success) {

            var order_payment_id = request_data.body.order_payment_id;


            // total_deduct_wallet_income: {$sum: {'$cond': [{"$and": [{'$eq': ['$is_store_income_set_in_wallet', true]}, {'$lt': ['$pay_to_store', 0]}]}, '$store_income_set_in_wallet', 0]}},
            // total_added_wallet_income: {$sum: {'$cond': [{"$and": [{'$eq': ['$is_store_income_set_in_wallet', true]}, {'$gt': ['$pay_to_store', 0]}]}, '$store_income_set_in_wallet', 0]}},

            Order_payment.findById(order_payment_id,{
                total_cart_price:1,
                total_store_tax_price:1,
                total_order_price:1,
                total_store_income:1,
                total_admin_profit_on_store:1,
                total_admin_profit_on_delivery:1,
                user_pay_payment:1,
                total_delivery_price:1,
                wallet_payment:1,
                refund_amount:1,
                store_income_set_in_wallet:1,
                completed_date_in_city_timezone:1,
                remaining_payment:1,
                is_store_income_set_in_wallet:1,
                pay_to_store:1,   
                store_id:1                            
            }).then(order=>{
                if(order){
                    Store.findById(order.store_id).then(store=>{
                        if(store){
                            response_data.json({
                                success:true,
                                order:order,
                                store:store
                            })
                        }else{
                            response_data.json({
                                success:false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            })
                        }
                    })
                }else{
                    response_data.json({
                        success:false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    })
                }
            }).catch(err=>{
                response_data.json({
                    success:false,
                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                })
            })
        }else{
            response_data.json({
                success:false,
                ...response
            })
        }
    })
}



// exports.get_admin_earning = function (request_data, response_data) {
//     utils.check_request_params(request_data.body, [], function (response) {
//         if (response.success) {

//             var request_data_body = request_data.body;
//             var start_date = request_data_body.start_date;
//             var end_date = request_data_body.end_date;
//             if (end_date == '' || end_date == undefined) {
//                 end_date = new Date();
//             } else {
//                 end_date = new Date(end_date);
//                 end_date = end_date.setHours(23, 59, 59, 999);
//                 end_date = new Date(end_date);
//             }

//             if (start_date == '' || start_date == undefined) {
//                 start_date = new Date(end_date.getTime() - (6 * 24 * 60 * 60 * 1000));
//                 start_date = start_date.setHours(0, 0, 0, 0);
//                 start_date = new Date(start_date);
//             } else {
//                 start_date = new Date(start_date);
//                 start_date = start_date.setHours(0, 0, 0, 0);
//                 start_date = new Date(start_date);
//             }


//             var user_query = {
//                 $lookup:
//                         {
//                             from: "users",
//                             localField: "user_id",
//                             foreignField: "_id",
//                             as: "user_detail"
//                         }
//             };
//             var array_to_json_user_detail = {$unwind: "$user_detail"};
//             var store_query = {
//                 $lookup:
//                         {
//                             from: "stores",
//                             localField: "store_id",
//                             foreignField: "_id",
//                             as: "store_detail"
//                         }
//             };
//             var array_to_json_store_detail = {$unwind: "$store_detail"};

//             var city_query = {
//                 $lookup:
//                         {
//                             from: "cities",
//                             localField: "city_id",
//                             foreignField: "_id",
//                             as: "city_detail"}
//             };

//             var array_to_json_city_query = {$unwind: "$city_detail"};

//             var country_query = {$lookup:
//                         {
//                             from: "countries",
//                             localField: "country_id",
//                             foreignField: "_id",
//                             as: "country_detail"
//                         }
//             };

//             var array_to_json_country_query = {$unwind: "$country_detail"};

//             var order_payment_query = {
//                 $lookup:
//                         {
//                             from: "order_payments",
//                             localField: "order_payment_id",
//                             foreignField: "_id",
//                             as: "order_payment_detail"
//                         }
//             };
//             var array_to_json_order_payment_query = {$unwind: "$order_payment_detail"};
//             var payment_gateway_query = {
//                 $lookup:
//                         {
//                             from: "payment_gateways",
//                             localField: "order_payment_detail.payment_id",
//                             foreignField: "_id",
//                             as: "payment_gateway_detail"
//                         }
//             };

//             var request_query = {
//                 $lookup:
//                         {
//                             from: "requests",
//                             localField: "request_id",
//                             foreignField: "_id",
//                             as: "request_detail"
//                         }
//             };

//             var array_to_json_request_query = {$unwind: {
//                     path: "$request_detail",
//                     preserveNullAndEmptyArrays: true
//                 }
//             };


//             var provider_query = {
//                 $lookup:
//                         {
//                             from: "providers",
//                             localField: "request_detail.current_provider",
//                             foreignField: "_id",
//                             as: "provider_detail"
//                         }
//             };
//             var user_referral_query = {
//                 $lookup:
//                         {
//                             from: "referral_codes",
//                             localField: "user_id",
//                             foreignField: "user_id",
//                             as: "user_referral_detail"
//                         }
//             };

//             var provider_referral_query = {
//                 $lookup:
//                         {
//                             from: "referral_codes",
//                             localField: "provider_id",
//                             foreignField: "user_id",
//                             as: "provider_referral_detail"
//                         }
//             };
//             // var array_to_json_user_referral_query = {$unwind: "$user_referral_detail"};
//             var store_referral_query = {
//                 $lookup:
//                         {
//                             from: "referral_codes",
//                             localField: "store_id",
//                             foreignField: "user_id",
//                             as: "store_referral_detail"
//                         }
//             };
//             var number_of_rec = SEARCH_SORT.NO_OF_RECORD_PER_PAGE;
//             var page = request_data_body.page;
//             var sort_field = request_data_body.sort_field;
//             var sort_order = request_data_body.sort_order;
//             var search_field = request_data_body.search_field;
//             var search_value = request_data_body.search_value;
//             if (search_field === "user_detail.email")
//             {
//                 search_value = search_value.replace(/^\s+|\s+$/g, '');
//                 search_value = search_value.replace(/ +(?= )/g, '');
//                 var query1 = {};
//                 var query2 = {};
//                 var query3 = {};
//                 var query4 = {};
//                 var query5 = {};
//                 var query6 = {};
//                 var full_name = search_value.split(' ');
//                 if (typeof full_name[0] === 'undefined' || typeof full_name[1] === 'undefined') {

//                     query1[search_field] = {$regex: new RegExp(search_value, 'i')};
//                     query2['user_detail.email'] = {$regex: new RegExp(search_value, 'i')};
//                     var search = {"$match": {$or: [query1, query2]}};
//                 } else {

//                     query1[search_field] = {$regex: new RegExp(search_value, 'i')};
//                     query2['user_detail.email'] = {$regex: new RegExp(search_value, 'i')};
//                     query3[search_field] = {$regex: new RegExp(full_name[0], 'i')};
//                     query4['user_detail.email'] = {$regex: new RegExp(full_name[0], 'i')};
//                     query5[search_field] = {$regex: new RegExp(full_name[1], 'i')};
//                     query6['user_detail.email'] = {$regex: new RegExp(full_name[1], 'i')};
//                     var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
//                 }
//             } else if (search_field === "provider_detail.email")
//             {
//                 search_value = search_value.replace(/^\s+|\s+$/g, '');
//                 search_value = search_value.replace(/ +(?= )/g, '');
//                 var query1 = {};
//                 var query2 = {};
//                 var query3 = {};
//                 var query4 = {};
//                 var query5 = {};
//                 var query6 = {};
//                 var full_name = search_value.split(' ');
//                 if (typeof full_name[0] === 'undefined' || typeof full_name[1] === 'undefined') {

//                     query1[search_field] = {$regex: new RegExp(search_value, 'i')};
//                     query2['provider_detail.email'] = {$regex: new RegExp(search_value, 'i')};
//                     var search = {"$match": {$or: [query1, query2]}};
//                 } else {

//                     query1[search_field] = {$regex: new RegExp(search_value, 'i')};
//                     query2['provider_detail.email'] = {$regex: new RegExp(search_value, 'i')};
//                     query3[search_field] = {$regex: new RegExp(full_name[0], 'i')};
//                     query4['provider_detail.email'] = {$regex: new RegExp(full_name[0], 'i')};
//                     query5[search_field] = {$regex: new RegExp(full_name[1], 'i')};
//                     query6['provider_detail.email'] = {$regex: new RegExp(full_name[1], 'i')};
//                     var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
//                 }
//             } else if (search_field === "store_detail.email")
//             {
//                 search_value = search_value.replace(/^\s+|\s+$/g, '');
//                 search_value = search_value.replace(/ +(?= )/g, '');
//                 var query1 = {};
//                 var query2 = {};
//                 var query3 = {};
//                 var query4 = {};
//                 var query5 = {};
//                 var query6 = {};
//                 var full_name = search_value.split(' ');
//                 if (typeof full_name[0] === 'undefined' || typeof full_name[1] === 'undefined') {

//                     query1[search_field] = {$regex: new RegExp(search_value, 'i')};
//                     query2['store_detail.email'] = {$regex: new RegExp(search_value, 'i')};
//                     var search = {"$match": {$or: [query1, query2]}};
//                 } else {

//                     query1[search_field] = {$regex: new RegExp(search_value, 'i')};
//                     query2['store_detail.email'] = {$regex: new RegExp(search_value, 'i')};
//                     query3[search_field] = {$regex: new RegExp(full_name[0], 'i')};
//                     query4['store_detail.email'] = {$regex: new RegExp(full_name[0], 'i')};
//                     query5[search_field] = {$regex: new RegExp(full_name[1], 'i')};
//                     query6['store_detail.email'] = {$regex: new RegExp(full_name[1], 'i')};
//                     var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
//                 }
//             } else if (search_field == 'unique_id')
//             {
//                 var query = {};
//                 if (search_value !== "")
//                 {
//                     search_value = Number(search_value);
//                     query[search_field] = search_value;
//                     var search = {"$match": query};
//                 }
//             } else if (search_field == 'user_detail.unique_id')
//             {
//                 var query = {};
//                 if (search_value !== "")
//                 {
//                     search_value = Number(search_value);
//                     query[search_field] = search_value;
//                     var search = {"$match": query};
//                 }
//             } else if (search_field == 'provider_detail.unique_id')
//             {
//                 var query = {};
//                 if (search_value !== "")
//                 {
//                     search_value = Number(search_value);
//                     query[search_field] = search_value;
//                     var search = {"$match": query};
//                 }
//             } else if (search_field == 'store_detail.unique_id')
//             {
//                 var query = {};
//                 if (search_value !== "")
//                 {
//                     search_value = Number(search_value);
//                     query[search_field] = search_value;
//                     var search = {"$match": query};
//                 }
//             } else
//             {
//                 var query = {};
//                 query[search_field] = {$regex: new RegExp(search_value, 'i')};
//                 var search = {"$match": query};
//             }
//             var filter = {"$match": {$and: [{"completed_date_in_city_timezone": {$gte: start_date, $lt: end_date}}, {total_store_income: {$ne: 0}}]}};
//             var order_status_id_condition = {"$match":{$or: [ {'order_status_id': {$eq: ORDER_STATUS_ID.COMPLETED}},{'order_status': {$eq: ORDER_STATE.CANCELED_BY_USER}}]}};

//             var sort = {"$sort": {}};
//             sort["$sort"][sort_field] = parseInt(sort_order);
//             var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
//             var skip = {};
//             skip["$skip"] = (page * number_of_rec) - number_of_rec;
//             var limit = {};
//             limit["$limit"] = number_of_rec;


//             Order.count({}, function (error, order_count) {
//                 Order.aggregate([order_status_id_condition, user_query, order_payment_query, store_query, request_query, city_query, array_to_json_city_query, country_query, array_to_json_country_query, array_to_json_request_query, provider_query, user_referral_query, provider_referral_query, store_referral_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_order_payment_query, payment_gateway_query
//                             , search
//                             , filter
//                             , count
//                 ]).then((orders) => {
//                     if (orders.length === 0)
//                     {
//                         response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0});
//                     } else
//                     {
//                         var pages = Math.ceil(orders[0].total / number_of_rec);
//                         var total_condition = {
//                             $group: {
//                                 _id: null,
//                                 total_rejected_orders: {$sum: {$cond: [{$eq: ["$order_status_id", ORDER_STATUS_ID.REJECTED]}, 1, 0]}},
//                                 total_completed_orders: {$sum: {$cond: [{$eq: ["$order_status_id", ORDER_STATUS_ID.COMPLETED]}, 1, 0]}},
//                                 total_cancelled_orders: {$sum: {$cond: [{$eq: ["$order_status_id", ORDER_STATUS_ID.CANCELLED]}, 1, 0]}},
//                                 order_cancellation_charge: {$sum: {$multiply: ['$order_payment_detail.order_cancellation_charge', '$order_payment_detail.current_rate']}},
//                                 refund_amount: {$sum: {$multiply: ['$order_payment_detail.refund_amount', '$order_payment_detail.current_rate']}},
//                                 deliveryman_earn: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.total_provider_income', '$order_payment_detail.current_rate']}, 0]}},
//                                 store_earn: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.total_store_income', '$order_payment_detail.current_rate']}, 0]}},
//                                 admin_earn: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: [{$sum: ['$order_payment_detail.total_admin_profit_on_delivery', '$order_payment_detail.total_admin_profit_on_store']}, '$order_payment_detail.current_rate']}, 0]}},
//                                 total: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.total', '$order_payment_detail.current_rate']}, 0]}},
//                                 pay_to_store: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.pay_to_store', '$order_payment_detail.current_rate']}, 0]}},
//                                 pay_to_provider: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.pay_to_provider', '$order_payment_detail.current_rate']}, 0]}},
//                                 total_order_price: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.total_order_price', '$order_payment_detail.current_rate']}, 0]}},
//                                 total_delivery_price: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.total_delivery_price', '$order_payment_detail.current_rate']}, 0]}},
//                                 cash_payment: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.cash_payment', '$order_payment_detail.current_rate']}, 0]}},
//                                 other_payment: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.card_payment', '$order_payment_detail.current_rate']}, 0]}},
//                                 wallet: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.wallet_payment', '$order_payment_detail.current_rate']}, 0]}},

//                                 user_paid: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.total', '$order_payment_detail.current_rate']}, 0]}},
//                                 user_cash: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.cash_payment', '$order_payment_detail.current_rate']}, 0]}},
//                                 user_card: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.card_payment', '$order_payment_detail.current_rate']}, 0]}},
//                                 user_wallet: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.wallet_payment', '$order_payment_detail.current_rate']}, 0]}},
//                                 promo_payment: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.promo_payment', '$order_payment_detail.current_rate']}, 0]}},
//                                 user_refferal: {$sum: '$user_referral_detail[0].referral_bonus_to_user'},
//                                 provider_refferal: {$sum: '$provider_referral_detail[0].referral_bonus_to_user'},
//                                 store_refferal: {$sum: '$store_referral_detail[0].referral_bonus_to_user'},
//                                 total_item_count: {$sum: '$order_payment_detail.total_item_count'},

//                                 provider_paid: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.pay_to_provider', '$order_payment_detail.current_rate']}, 0]}},
//                                 provider_cash: {$sum: {$cond: [{$and: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$eq: ["$order_payment_detail.is_payment_mode_cash", true]}]}, {$multiply: ['$order_payment_detail.cash_payment', '$order_payment_detail.current_rate']}, 0]}},
//                                 provider_profit: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.total_provider_income', '$order_payment_detail.current_rate']}, 0]}},
//                                 provider_admin_earn: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.total_admin_profit_on_delivery', '$order_payment_detail.current_rate']}, 0]}},
//                                 provider_paid_order_payment: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$eq: ["$order_payment_detail.is_payment_mode_cash", true]}, {$eq: ["$order_payment_detail.is_order_price_paid_by_store",false]}, {$multiply: ['$order_payment_detail.provider_paid_order_payment', '$order_payment_detail.current_rate']}, 0]}},
//                                 provider_have_cash_payment: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$eq: ['$order_payment_detail.is_payment_mode_cash', true]}, '$cash_payment', 0]}},
//                                 total_provider_have_payment: {$sum: {$subtract: ['$provider_have_cash_payment', '$provider_paid_order_payment']}},

//                                 store_have_order_payment: {$sum: {$cond: [{$and:[{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]},{$eq: ["$order_payment_detail.is_payment_mode_cash", true]}]}, {$multiply: ['$order_payment_detail.is_order_price_paid_by_store', '$order_payment_detail.current_rate']}, 0]}},
//                                 store_admin_earn: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.total_admin_profit_on_store', '$order_payment_detail.current_rate']}, 0]}},
//                                 store_profit: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.total_store_income', '$order_payment_detail.current_rate']}, 0]}},
//                                 store_paid: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.pay_to_store', '$order_payment_detail.current_rate']}, 0]}},
//                                 store_have_payment: {$sum: {$cond: [{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]}, {$multiply: ['$order_payment_detail.total_store_have_payment', '$order_payment_detail.current_rate']}, 0]}},
//                                 store_have_service_payment: {$sum: {$cond: [{$and:[{$eq: ["$order_status", ORDER_STATE.ORDER_COMPLETED]},{$eq: ["$order_payment_detail.is_store_pay_delivery_fees", true]}]}, {$multiply: ['$order_payment_detail.total_delivery_price', '$order_payment_detail.current_rate']}, 0]}}

//                             }
//                         }

//                         Order.aggregate([order_status_id_condition, user_query, order_payment_query, store_query, request_query, city_query,country_query, array_to_json_city_query, array_to_json_country_query, array_to_json_request_query, provider_query, user_referral_query, provider_referral_query, store_referral_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_order_payment_query, payment_gateway_query
//                                     , search
//                                     , filter
//                                     , total_condition
//                         ]).then((order_total) => {
//                             if (page)
//                             {
//                                 Order.aggregate([order_status_id_condition, user_query, order_payment_query, store_query, request_query, city_query,country_query, array_to_json_city_query, array_to_json_country_query, array_to_json_request_query, provider_query, user_referral_query, provider_referral_query, store_referral_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_order_payment_query, payment_gateway_query
//                                             , sort
//                                             , search
//                                             , filter
//                                             , skip, limit
//                                 ]).then((orders) => {
//                                     response_data.json({success: true,
//                                         message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,
//                                         order_total: order_total[0],
//                                         order_count: order_count,
//                                         orders: orders});
//                                 }, (error) => {
//                                     console.log(error);
//                                     response_data.json({
//                                         success: false,
//                                         error_code: ERROR_CODE.SOMETHING_WENT_WRONG
//                                     });
//                                 });
//                             } else
//                             {
//                                 Order.aggregate([order_status_id_condition, user_query, order_payment_query, store_query, request_query, city_query,country_query, array_to_json_city_query, array_to_json_country_query, array_to_json_request_query, provider_query, user_referral_query, provider_referral_query, store_referral_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_order_payment_query, payment_gateway_query
//                                             , sort
//                                             , search
//                                             , filter
//                                 ]).then((orders) => {
//                                     response_data.json({success: true,
//                                         message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,
//                                         order_total: order_total[0],
//                                         order_count: order_count,
//                                         orders: orders});
//                                 }, (error) => {
//                                     console.log(error);
//                                     response_data.json({
//                                         success: false,
//                                         error_code: ERROR_CODE.SOMETHING_WENT_WRONG
//                                     });
//                                 });
//                             }
//                         }, (error) => {
//                             console.log(error);
//                             response_data.json({
//                                 success: false,
//                                 error_code: ERROR_CODE.SOMETHING_WENT_WRONG
//                             });
//                         });

//                     }
//                 }, (error) => {
//                     console.log(error);
//                     response_data.json({
//                         success: false,
//                         error_code: ERROR_CODE.SOMETHING_WENT_WRONG
//                     });
//                 });
//             });
//         } else {
//             response_data.json(response);
//         }
//     });
// };