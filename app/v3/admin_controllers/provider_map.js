require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
require('../utils/push_code');
var utils = require('../utils/utils');
var emails = require('../controllers/email_sms/emails');
var SMS = require('../controllers/email_sms/sms');
var Provider = require('mongoose').model('provider');
var console = require('../utils/console');
var Request = require('mongoose').model('request');

// for view all provider_list 
exports.provider_list_for_map = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
           
             //////////////////////
             var mongoose = require('mongoose');
             var Schema = mongoose.Types.ObjectId;
             
             var admin_type =request_data_body.admin_type
             var city_condition = {$match: {}};
             if(admin_type == 3){
                 var city_id = Schema(request_data_body.admin_city_id)
                 city_condition = {$match: {"city_id": {$eq : city_id}}};
             }
             //////////////////////
            
            Provider.aggregate([city_condition]).then((providers) => {

                var obj = JSON.parse(JSON.stringify(providers))
                var provider_with_orders = [];
                var delivery_status_condition = {"$match": {'delivery_status': {$gte: ORDER_STATE.WAITING_FOR_DELIVERY_MAN}}};
                var delivery_status_manage_id_condition = {"$match": {'delivery_status_manage_id': {$ne: ORDER_STATUS_ID.COMPLETED}}};

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
                var order_condition = {$match: {'order_detail.order_status_id': {$eq: ORDER_STATUS_ID.RUNNING}}};

                Request.aggregate([delivery_status_condition, delivery_status_manage_id_condition, order_query, array_to_json_order_query, order_condition]).then((requests) => {
                    requests.forEach(element => {
                        provider_with_orders.push(element.current_provider+"")
                    });
                    obj.forEach((element,index) => {
                       if(provider_with_orders.indexOf(element._id+"") != -1){
                           obj[index].has_order = 1
                       }else{
                        obj[index].has_order = 0
                       }
                    });
                    if (providers.length == 0) {
                        response_data.json({success: false, error_code: PRODUCT_ERROR_CODE.PRODUCT_DATA_NOT_FOUND});
                    } else {
                        response_data.json({success: true,
                            message: PROVIDER_MESSAGE_CODE.PROVIDER_LIST_SUCCESSFULLY,
                            providers: obj
                        });
                    }
                })
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