require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/push_code');
require('../../utils/constants');
var console = require('../../utils/console');
var promo_code_controller = require('../../controllers/user/promo_code');
var mongoose = require('mongoose');
var my_request = require('../../controllers/store/request');
var Request = require('mongoose').model('request');
var Review = require('mongoose').model('review');
var utils = require('../../utils/utils');
var moment = require('moment');
var emails = require('../../controllers/email_sms/emails');
var SMS = require('../../controllers/email_sms/sms');
var User = require('mongoose').model('user');
var Country = require('mongoose').model('country');
var Provider = require('mongoose').model('provider');
var Store = require('mongoose').model('store');
var City = require('mongoose').model('city');
var Order = require('mongoose').model('order');
var Order_payment = require('mongoose').model('order_payment');
var Payment_gateway = require('mongoose').model('payment_gateway');
var Service = require('mongoose').model('service');
var Cart = require('mongoose').model('cart');
var wallet_history = require('../../controllers/user/wallet');
var Schema = mongoose.Types.ObjectId;

exports.create_request = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'order_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store = response.store;
                        Order.findOne({_id: request_data_body.order_id}).then((order) => {
                            if (order) {
                                if (order.request_id == null) {
                                    User.findOne({_id: order.user_id}).then((user) => {
                                        Cart.findOne({_id: order.cart_id}).then((cart) => {
                                            var orders_array = {
                                                order_id: order._id,
                                                order_unique_id: order.unique_id,
                                                order_payment_id: order.order_payment_id,
                                                cart_id: order.cart_id
                                            }

                                            var request = new Request({
                                                country_id: order.country_id,
                                                city_id: order.city_id,
                                                timezone: order.timezone,
                                                vehicle_id: request_data_body.vehicle_id,
                                                orders: orders_array,
                                                user_id: user._id,
                                                user_unique_id: user.unique_id,
                                                request_type: 2,
                                                request_type_id: store._id,
                                                provider_type: 0,
                                                provider_type_id: null,
                                                provider_id: null,
                                                provider_unique_id: 0,
                                                delivery_status: ORDER_STATE.WAITING_FOR_DELIVERY_MAN,
                                                delivery_status_manage_id: ORDER_STATUS_ID.RUNNING,
                                                delivery_status_by: null,
                                                current_provider: null,
                                                estimated_time_for_delivery_in_min: 0,
                                                user_detail:order.user_detail,
                                                store_detail:order.store_detail,
                                                delivery_type:order.delivery_type,
                                                providers_id_that_rejected_order_request: [],
                                                confirmation_code_for_pick_up_delivery: order.confirmation_code_for_pick_up_delivery,
                                                confirmation_code_for_complete_delivery: order.confirmation_code_for_complete_delivery,

                                                is_forced_assigned: false,
                                                provider_location: [],
                                                provider_previous_location: [],
                                                pickup_addresses: cart.pickup_addresses,
                                                destination_addresses: cart.destination_addresses,
                                                cancel_reasons: [],
                                                cancelled_at: null,
                                                completed_at: null

                                            });
                                            if(request_data_body.provider_id){
                                                request.manual_provider_id = request_data_body.provider_id;
                                            }
                                            if (request_data_body.estimated_time_for_ready_order != undefined && request_data_body.estimated_time_for_ready_order && request_data_body.estimated_time_for_ready_order > 0) {
                                                var estimated_time_for_ready_order = moment.utc();
                                                estimated_time_for_ready_order = new Date(estimated_time_for_ready_order.format());
                                                estimated_time_for_ready_order.setMinutes(estimated_time_for_ready_order.getMinutes() + Number(request_data_body.estimated_time_for_ready_order))
                                                order.estimated_time_for_ready_order = estimated_time_for_ready_order;
                                                request.estimated_time_for_delivery_in_min = request_data_body.estimated_time_for_ready_order;
                                                order.order_status = ORDER_STATE.STORE_PREPARING_ORDER
                                            } else
                                            {
                                                request.estimated_time_for_delivery_in_min = store.delivery_time_max;
                                            }
                                            order.request_id = request._id;
                                            order.save().then(() => {
                                                request.save(function (error) {
                                                    console.log(error)
                                                    if (error) {
                                                        response_data.json({
                                                            success: false,
                                                            error_code: PROVIDER_ERROR_CODE.NO_PROVIDER_FOUND
                                                        });
                                                    } else {
                                                        my_request.findNearestProvider(request, response_data);
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
                                        });
                                    });
                                } else
                                {
                                    // Reassign Request
                                    Request.findOne({_id: order.request_id}, function (error, request) {
                                        if(request_data_body.provider_id){
                                            request.manual_provider_id = request_data_body.provider_id;
                                        }
                                        request.vehicle_id = request_data_body.vehicle_id;
                                        my_request.findNearestProvider(request, response_data);
                                    });
                                }

                            } else {
                                response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
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

exports.findNearestProviderList = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'order_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
                    Order.findOne({_id: request_data.body.order_id}).then((order_detail) => {
                        if (order_detail)
                        {
                            exports.findNearestProviderQuery({
                                order:order_detail,
                                providers_id_that_rejected_order_request:[],
                                location: [0,0],
                                vehicle_id:request_data.body.vehicle_id,
                            }, function (return_data) {
                                response_data.json({success: true, providers: return_data.providers});
                            });
                        } else {
                            response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
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
exports.findNearestProviderQuery = function (request_data, response_data) {
    if(request_data.body){
        var request_data_body = request_data.body;
        var providers_id_that_rejected_order_request = request_data_body.providers_id_that_rejected_order_request;
    }else{
        var request_data_body = request_data;
        var providers_id_that_rejected_order_request = request_data.providers_id_that_rejected_order_request;
    }
    var order_detail = request_data_body.order;
    
            Order_payment.findOne({_id: order_detail.order_payment_id}).then((order_payment_detail) => {
                Store.findOne({_id: order_detail.store_id}).then((store) => {
                    var store_location = [];
                    var store_name = '';
                    var store_image_url = '';
                    var store_device_type = '';
                    var store_device_token = '';
                    if(store){
                        store_location = store.location;
                        store_image_url = store.image_url;
                        store_name = store.name;
                        store_device_type = store.device_type;
                        store_token = store.device_token;
                    } else {
                        store_location = request_data_body.location;
                    }
                    var city_id = order_detail.city_id;
                    City.findOne({_id: city_id}).then((city) => {
                        var distance = setting_detail.default_search_radius / UNIT.DEGREE_TO_KM;
                        var city_timezone = city.timezone;
                        var provider_min_wallet_amount_for_received_cash_request = city.provider_min_wallet_amount_for_received_cash_request;
                        var is_check_provider_wallet_amount_for_received_cash_request = city.is_check_provider_wallet_amount_for_received_cash_request;
                        var is_payment_mode_cash = order_payment_detail.is_payment_mode_cash;
                        var provider_query = {};
                        if (is_check_provider_wallet_amount_for_received_cash_request && is_payment_mode_cash)
                        {
                            provider_query = {
                                '_id': {$nin: providers_id_that_rejected_order_request},
                                location: {$near: store_location, $maxDistance: distance},
                                is_online: true,
                                is_approved: true,
                                is_active_for_job: true,
                                city_id: city_id,
                                wallet: {$gte: provider_min_wallet_amount_for_received_cash_request},
                                vehicle_id: request_data_body.vehicle_id
                            }

                        } else{
                            provider_query = {
                                '_id': {$nin: providers_id_that_rejected_order_request},
                                location: {$near: store_location, $maxDistance: distance},
                                is_online: true,
                                is_approved: true,
                                //is_active_for_job: true,
                                city_id: city_id,
                                vehicle_id: request_data_body.vehicle_id
                            }
                        }


                        if(setting_detail.is_upload_provider_documents){
                            provider_query['is_document_uploaded'] = true;
                        }

                        /*if(order_payment_detail.delivery_price_used_type == ADMIN_DATA_ID.STORE && store){
                            provider_query['provider_type_id'] = store._id;
                        } else {
                            provider_query['provider_type_id'] = null;
                        }*/
                        Provider.find(provider_query).exec(function (error, providers) {
                            var request_type_id = null;
                            var provider_array = [];
                            if(error){
                                provider_array = [];
                            }else{
                                if(request_data_body.manual_provider_id){                                    
                                    var index = providers.findIndex((x) => String(x._id) == String(request_data_body.manual_provider_id));
                                    if (index == -1) {
                                        provider_array = [];
                                    } else {
                                        provider_array = [providers[index]];
                                    }
                                }else if(order_payment_detail.delivery_price_used_type == ADMIN_DATA_ID.STORE && store){
                                    var index = providers.findIndex((x) => String(x.provider_type_id) == String(store._id));
                                    if (index == -1) {
                                        provider_array = providers;
                                    } else {
                                        provider_array = [providers[index]];
                                        request_type_id = provider_array[0].provider_type_id;
                                    }
                                }else{
                                    provider_array = providers;
                                }
                            }
                            response_data({
                                 providers:provider_array,   
                                 city_timezone:city_timezone,   
                                 request_type_id:request_type_id,   
                                 store_name:store_name,
                                 store_image_url:store_image_url,
                                 store_device_type : store_device_type,
                                 store_device_token : store_device_token,
                                 country_id:city.country_id 
                            });
                            
                        })
                    })
                })
            })
}
exports.findNearestProvider = function (request, response_data) {
        Order.findOne({_id: request.orders[0].order_id}).then((order_detail) => {
            if (order_detail)
            {
                    
                    Provider.findOne({_id: request.current_provider}).then((provider) => {
                        Country.findOne({_id: order_detail.country_id}).then((country) => {
                            var currency = "";
                            if (country)
                            {
                                currency = country.currency_sign;
                            }
                            var providers_id_that_rejected_order_request = request.providers_id_that_rejected_order_request;                     
                            if (provider)
                            {
                                providers_id_that_rejected_order_request.push(request.current_provider);
                                request.providers_id_that_rejected_order_request = providers_id_that_rejected_order_request;
                            }
                            var time_left_to_responds_trip = setting_detail.provider_timeout;

                            exports.findNearestProviderQuery({
                                order:order_detail,
                                providers_id_that_rejected_order_request:request.providers_id_that_rejected_order_request,
                                location: request.pickup_addresses[0].location,
                                manual_provider_id: request.manual_provider_id,
                                vehicle_id:request.vehicle_id,
                            }, function (return_data) {
                                if (provider)
                                {
                                    if (response_data == null)
                                    {
                                        utils.insert_daily_provider_analytics(return_data.city_timezone, provider._id, ORDER_STATE.NOT_ANSWERED, false, null, false, null);

                                    }
                                }
                                
                                if (return_data.providers.length == 0 || time_left_to_responds_trip <= 0 ) {
                                    request.delivery_status = ORDER_STATE.NO_DELIVERY_MAN_FOUND;
                                    request.delivery_status_manage_id = ORDER_STATUS_ID.RUNNING;
                                    request.providers_id_that_rejected_order_request = [];
                                    request.provider_id = null;
                                    request.provider_detail = null;
                                    request.provider_type_id = null;
                                    request.current_provider = null;
                                    request.manual_provider_id = null;
                                    request.save();

                                    order_detail.request_id = request._id;
                                    order_detail.provider_detail = null;
                                    order_detail.store_notify = 0;
                                    order_detail.save();

                                    // send push to store
                                    if(return_data.store_device_type != "" && return_data.store_device_token != ""){
                                        if (response_data == null) {
                                            utils.sendPushNotification(ADMIN_DATA_ID.STORE, return_data.store_device_type, return_data.store_device_token, STORE_PUSH_CODE.DELIVERY_MAN_NOT_FOUND, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                        }
                                    }

                                    if (response_data) {
                                        response_data.json({
                                            success: false,
                                            error_code: PROVIDER_ERROR_CODE.NO_PROVIDER_FOUND
                                        });
                                    }

                                } else
                                {
                                    var provider = return_data.providers[0];
                                    var provider_id = provider._id;

                                    provider.total_requests = provider.total_requests + 1;

                                    request.provider_type = provider.provider_type;
                                    request.provider_type_id = return_data.request_type_id;
                                    request.provider_location = provider.location;
                                    request.provider_previous_location = provider.previous_location;

                                    request.current_provider = provider_id;
                                    request.delivery_status = ORDER_STATE.WAITING_FOR_DELIVERY_MAN;
                                    request.delivery_status_manage_id = ORDER_STATUS_ID.RUNNING;
                                    request.delivery_status_by = null;
                                    request.provider_detail = {
                                                    _id:provider._id,
                                                    image_url:provider.image_url,
                                                    name:provider.first_name+' '+provider.last_name,
                                                    phone:provider.country_phone_code+provider.phone
                                                };

                                    var index = request.date_time.findIndex((x) => x.status == ORDER_STATE.WAITING_FOR_DELIVERY_MAN);
                                    if (index == -1) {
                                        request.date_time.push({status: ORDER_STATE.WAITING_FOR_DELIVERY_MAN, date: new Date()});
                                    } else {
                                        request.date_time[index].date = new Date();
                                    }

                                    request.markModified('date_time');
                                    request.save().then(() => {
                                        provider.save();
                                        var device_type = provider.device_type;
                                        var device_token = provider.device_token;
                                        order_detail.provider_detail = {
                                                    _id:provider._id,
                                                    image_url:provider.image_url,
                                                    name:provider.first_name+' '+provider.last_name,
                                                    phone:provider.country_phone_code+provider.phone
                                                };
                                        order_detail.request_id = request._id;
                                        order_detail.save();
                                        Order_payment.findOne({_id: order_detail.order_payment_id}).then((order_payment) => {
                                            var total_order_price = 0;
                                            var total_provider_income = 0;
                                            if (order_payment)
                                            {
                                                total_order_price = order_payment.total_order_price;
                                                total_provider_income = order_payment.total_provider_income;
                                            }
                                            // Entry in Provider Analytic Table
                                            utils.insert_daily_provider_analytics(return_data.city_timezone, provider._id, ORDER_STATE.WAITING_FOR_DELIVERY_MAN, false, null, false, null);

                                            var request_detail = {};
                                            if (order_detail.estimated_time_for_ready_order != undefined)
                                            {
                                                request_detail = {
                                                    request_id: request._id,
                                                    request_count: 0,
                                                    unique_id: request.unique_id,
                                                    order_unique_id: order_detail.unique_id,
                                                    estimated_time_for_ready_order: order_detail.estimated_time_for_ready_order,
                                                    pickup_addresses: request.pickup_addresses,
                                                    total_order_price: Number(total_order_price),
                                                    total_provider_income: Number(total_provider_income),
                                                    currency: currency,
                                                    destination_addresses: request.destination_addresses,
                                                    created_at: request.created_at,
                                                    delivery_type: order_detail.delivery_type,
                                                    total: Number(order_payment.total),
                                                    store_name: return_data.store_name,
                                                    store_image: return_data.store_image_url,
                                                    is_schedule_order: order_detail.is_schedule_order
                                                }
                                            } else
                                            {
                                                request_detail = {
                                                    request_id: request._id,
                                                    request_count: 0,
                                                    unique_id: request.unique_id,
                                                    order_unique_id: order_detail.unique_id,
                                                    estimated_time_for_delivery_in_min: request.estimated_time_for_delivery_in_min,
                                                    pickup_addresses: request.pickup_addresses,
                                                    total_order_price: Number(total_order_price),
                                                    total_provider_income: Number(total_provider_income),
                                                    currency: currency,
                                                    destination_addresses: request.destination_addresses,
                                                    created_at: request.created_at,
                                                    delivery_type: order_detail.delivery_type,
                                                    total: Number(order_payment.total),
                                                    store_name: return_data.store_name,
                                                    store_image: return_data.store_image_url,
                                                    is_schedule_order: order_detail.is_schedule_order
                                                }
                                            }
                                            utils.sendPushNotificationWithPushData(ADMIN_DATA_ID.PROVIDER, device_type, device_token, PROVIDER_PUSH_CODE.NEW_REQUEST, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, request_detail, time_left_to_responds_trip);
                                            if (response_data) {
                                                response_data.json({
                                                    success: true,
                                                    message: ORDER_MESSAGE_CODE.REQUEST_CREATE_SUCCESSFULLY,
                                                    request: request,
                                                    provider_detail: provider
                                                });
                                            }
                                        }, (error) => {
                                            if (response_data) {
                                                console.log(error);
                                                response_data.json({
                                                    success: false,
                                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                });
                                            }
                                        });

                                    }, (error) => {
                                        if (response_data) {
                                            response_data.json({
                                                success: false,
                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                            });
                                        }
                                    });
                                }
                                          
                            })
                        });

                    }, (error) => {
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        });
                    });
            } else {
                response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
            }
        }, (error) => {
            console.log(error);
            response_data.json({
                success: false,
                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
            });
        });

};

exports.change_request_status = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'delivery_status'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {
                if (provider)
                {
                    if (request_data_body.server_token !== null && provider.server_token !== request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        var delivery_status = Number(request_data_body.delivery_status);


                        if (delivery_status == ORDER_STATE.DELIVERY_MAN_ACCEPTED) {

                            exports.accept_request(provider, request_data, function (return_data) {
                                response_data.json(return_data);
                            });

                        } else if (delivery_status == ORDER_STATE.DELIVERY_MAN_COMING) {

                            exports.coming_for_pickup(provider, request_data, function (return_data) {
                                response_data.json(return_data);
                            });

                        } else if (delivery_status == ORDER_STATE.DELIVERY_MAN_ARRIVED) {

                            exports.arrived_at_pickup(provider, request_data, function (return_data) {
                                response_data.json(return_data);
                            });

                        } else if (delivery_status == ORDER_STATE.DELIVERY_MAN_PICKED_ORDER) {

                            exports.pickup_order(provider, request_data, function (return_data) {
                                response_data.json(return_data);
                            });

                        } else if (delivery_status == ORDER_STATE.DELIVERY_MAN_STARTED_DELIVERY) {

                            exports.started_for_delivery(provider, request_data, function (return_data) {
                                response_data.json(return_data);
                            });

                        } else if (delivery_status == ORDER_STATE.DELIVERY_MAN_ARRIVED_AT_DESTINATION) {

                            exports.arrived_at_destination(provider, request_data, function (return_data) {
                                response_data.json(return_data);
                            });

                        } else {
                            response_data.json({success: false});
                        }
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

exports.accept_request = function (provider , request_data, response_data) {
    var request_data_body = request_data.body;
    var request_id = request_data_body.request_id;
    var delivery_status = Number(request_data_body.delivery_status);

    Request.findOne({_id: request_id, provider_id : null , delivery_status_manage_id: ORDER_STATUS_ID.RUNNING}).then((request) => {
        if (request) {
            User.findOne({_id: request.user_id}).then((user) => {
                Order.findOne({_id: request.orders[0].order_id}).then((order) => {
                    if (order) {

                        var city_timezone = request.timezone;
                        Store.findOne({_id: order.store_id}).then((store) => {

                            var store_image_url = '';
                            var store_name = '';
                            if(store){
                                store_name = store.name;
                                store_image_url = store.image_url;
                            }

                            var order_data = {order_id: order._id, order_unique_id: order.unique_id, delivery_type: order.delivery_type,
                                confirmation_code_for_complete_delivery: order.confirmation_code_for_complete_delivery,
                                store_name: store_name, store_image: store_image_url}

                            request.delivery_status = ORDER_STATE.DELIVERY_MAN_COMING;
                            request.provider_id = provider._id;
                            request.provider_unique_id = provider.unique_id;
                            request.current_provider = provider._id;

                            var index = request.date_time.findIndex((x) => x.status == ORDER_STATE.DELIVERY_MAN_ACCEPTED);
                            if (index == -1) {
                                request.date_time.push({status: ORDER_STATE.DELIVERY_MAN_ACCEPTED, date: new Date()});
                            } else {
                                request.date_time[index].date = new Date();
                            }

                            var index = request.date_time.findIndex((x) => x.status == ORDER_STATE.DELIVERY_MAN_COMING);
                            if (index == -1) {
                                request.date_time.push({status: ORDER_STATE.DELIVERY_MAN_COMING, date: new Date()});
                            } else {
                                request.date_time[index].date = new Date();
                            }
                            request.markModified('date_time');
                            request.save().then(() => {

                                    var user_device_type = "";
                                    var user_device_token = "";
                                    if (user) {
                                        user_device_type = user.device_type;
                                        user_device_token = user.device_token;
                                    }

                                    if(store){
                                        var device_type = store.device_type;
                                        var device_token = store.device_token;
                                        var store_phone_with_code = store.country_phone_code + store.phone;
                                        if (setting_detail.is_sms_notification)
                                        {
                                            SMS.sendOtherSMS(store_phone_with_code, SMS_UNIQUE_ID.DELIVERY_MAN_ACCEPTED, "");
                                        }

                                        if (setting_detail.is_mail_notification) {
                                            emails.sendDeliverymanAcceptedEmail(request_data, store);
                                        }
                                        utils.insert_daily_provider_analytics(city_timezone, provider._id, ORDER_STATE.DELIVERY_MAN_ACCEPTED, false, null, false, null);
                                        provider.total_accepted_requests = provider.total_accepted_requests + 1;
                                        provider.save();
                                        utils.sendPushNotification(ADMIN_DATA_ID.STORE, device_type, device_token, STORE_PUSH_CODE.DELIVERY_MAN_ACCEPTED, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                    }

                                    utils.sendPushNotificationWithPushData(ADMIN_DATA_ID.USER, user_device_type, user_device_token, USER_PUSH_CODE.DELIVERY_MAN_ACCEPTED, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, order_data, "");

                                    response_data({
                                        success: true,
                                        message: ORDER_MESSAGE_CODE.CHANGE_ORDER_STATUS_SUCCESSFULLY,
                                        delivery_status: request.delivery_status
                                    });

                            }, (error) => {
                                console.log(error);
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });
                        });
                    }else{
                        response_data({success: false, error_code: ORDER_ERROR_CODE.ORDER_ALREADY_CANCELLED});
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
        } else
        {
            response_data({success: false, error_code: ORDER_ERROR_CODE.ORDER_ALREADY_CANCELLED});
        }

    }, (error) => {
        console.log(error);
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    });

};

exports.coming_for_pickup = function (provider , request_data, response_data) {
    var request_data_body = request_data.body;
    var request_id = request_data_body.request_id;
    var delivery_status = Number(request_data_body.delivery_status);

    Request.findOne({_id: request_id , provider_id : provider._id , delivery_status_manage_id: ORDER_STATUS_ID.RUNNING}).then((request) => {

        if (request) {

            User.findOne({_id: request.user_id}).then((user) => {

                Order.findOne({_id: request.orders[0].order_id}).then((order) => {

                    if (order) {

                        Store.findOne({_id: order.store_id}).then((store) => {

                            var store_image_url = '';
                            var store_name = '';
                            if(store){
                                store_name = store.name;
                                store_image_url = store.image_url;
                            }

                            var order_data = {order_id: order._id, order_unique_id: order.unique_id, delivery_type: order.delivery_type,
                                confirmation_code_for_complete_delivery: order.confirmation_code_for_complete_delivery,
                                store_name: store_name, store_image: store_image_url}

                            request.delivery_status = delivery_status;

                            var index = request.date_time.findIndex((x) => x.status == ORDER_STATE.DELIVERY_MAN_COMING);
                            if (index == -1) {
                                request.date_time.push({status: ORDER_STATE.DELIVERY_MAN_COMING, date: new Date()});
                            } else {
                                request.date_time[index].date = new Date();
                            }
                            request.markModified('date_time');
                            request.save().then(() => {

                                    var user_device_type = "";
                                    var user_device_token = "";
                                    if (user) {
                                        user_device_type = user.device_type;
                                        user_device_token = user.device_token;
                                    }
                                    utils.sendPushNotificationWithPushData(ADMIN_DATA_ID.USER, user_device_type, user_device_token, USER_PUSH_CODE.DELIVERY_MAN_COMING, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, order_data, "");

                                    if(store){
                                        var device_type = store.device_type;
                                        var device_token = store.device_token;
                                        var store_phone_with_code = store.country_phone_code + store.phone;

                                        if (setting_detail.is_sms_notification)
                                        {
                                            SMS.sendOtherSMS(store_phone_with_code, SMS_UNIQUE_ID.DELIVERY_MAN_COMING, "");
                                        }

                                        if (setting_detail.is_mail_notification)
                                        {
                                            emails.sendDeliverymanComingEmail(request_data, store);
                                        }

                                        utils.sendPushNotification(ADMIN_DATA_ID.STORE, device_type, device_token, STORE_PUSH_CODE.DELIVERY_MAN_COMING, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                    }

                                    response_data({
                                        success: true,
                                        message: ORDER_MESSAGE_CODE.CHANGE_ORDER_STATUS_SUCCESSFULLY,
                                        delivery_status: request.delivery_status
                                    });
                            }, (error) => {
                                console.log(error);
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });
                        });
                    }else{
                        response_data({success: false, error_code: ORDER_ERROR_CODE.ORDER_ALREADY_CANCELLED});
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
        } else
        {
            response_data({success: false, error_code: ORDER_ERROR_CODE.ORDER_ALREADY_CANCELLED});
        }
    }, (error) => {
        console.log(error);
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    });

};

exports.arrived_at_pickup = function (provider , request_data, response_data) {
    var request_data_body = request_data.body;
    var request_id = request_data_body.request_id;
    var delivery_status = Number(request_data_body.delivery_status);

    Request.findOne({_id: request_id , provider_id : provider._id , delivery_status_manage_id: ORDER_STATUS_ID.RUNNING}).then((request) => {

        if (request) {

            User.findOne({_id: request.user_id}).then((user) => {

                Order.findOne({_id: request.orders[0].order_id}).then((order) => {

                    if (order) {

                        Store.findOne({_id: order.store_id}).then((store) => {

                            var store_image_url = '';
                            var store_name = '';
                            if(store){
                                store_name = store.name;
                                store_image_url = store.image_url;
                            }

                            var order_data = {order_id: order._id, order_unique_id: order.unique_id, delivery_type: order.delivery_type,
                                confirmation_code_for_complete_delivery: order.confirmation_code_for_complete_delivery,
                                store_name: store_name, store_image: store_image_url};

                            request.delivery_status = delivery_status;

                            var index = request.date_time.findIndex((x) => x.status == ORDER_STATE.DELIVERY_MAN_ARRIVED);
                            if (index == -1) {
                                request.date_time.push({status: ORDER_STATE.DELIVERY_MAN_ARRIVED, date: new Date()});
                            } else {
                                request.date_time[index].date = new Date();
                            }
                            request.markModified('date_time');
                            request.save().then(() => {

                                    var user_device_type = "";
                                    var user_device_token = "";
                                    if (user) {
                                        user_device_type = user.device_type;
                                        user_device_token = user.device_token;
                                    }
                                    utils.sendPushNotificationWithPushData(ADMIN_DATA_ID.USER, user_device_type, user_device_token, USER_PUSH_CODE.DELIVERY_MAN_ARRIVED, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, order_data, "");

                                    if(store){
                                        var device_type = store.device_type;
                                        var device_token = store.device_token;
                                        var store_phone_with_code = store.country_phone_code + store.phone;

                                        if (setting_detail.is_sms_notification)
                                        {
                                            SMS.sendOtherSMS(store_phone_with_code, SMS_UNIQUE_ID.DELIVERY_MAN_ARRIVED, "");
                                        }
                                        if (setting_detail.is_mail_notification)
                                        {
                                            emails.sendDeliverymanArrivedEmail(request_data, store);
                                        }

                                        utils.sendPushNotification(ADMIN_DATA_ID.STORE, device_type, device_token, STORE_PUSH_CODE.DELIVERY_MAN_ARRIVED, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                    }

                                    response_data({
                                        success: true,
                                        message: ORDER_MESSAGE_CODE.CHANGE_ORDER_STATUS_SUCCESSFULLY,
                                        delivery_status: request.delivery_status
                                    });

                            }, (error) => {
                                console.log(error);
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });
                        });
                    }else{
                        response_data({success: false, error_code: ORDER_ERROR_CODE.ORDER_ALREADY_CANCELLED});
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
        } else
        {
            response_data({success: false, error_code: ORDER_ERROR_CODE.ORDER_ALREADY_CANCELLED});
        }

    }, (error) => {
        console.log(error);
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    });

};

exports.pickup_order = function (provider , request_data, response_data) {
    var request_data_body = request_data.body;
    var request_id = request_data_body.request_id;
    var delivery_status = Number(request_data_body.delivery_status);

    Request.findOne({_id: request_id , provider_id : provider._id , delivery_status_manage_id: ORDER_STATUS_ID.RUNNING}).then((request) => {

        if (request) {

            User.findOne({_id: request.user_id}).then((user) => {

                Order.findOne({_id: request.orders[0].order_id}).then((order) => {

                    if (order) {

                        Order_payment.findOne({_id: request.orders[0].order_payment_id}).then((order_payment) => {
                            Store.findOne({_id: order.store_id}).then((store) => {

                                var store_image_url = '';
                                var store_name = '';
                                if(store){
                                    store_name = store.name;
                                    store_image_url = store.image_url;
                                }

                                var order_data = {order_id: order._id, order_unique_id: order.unique_id, delivery_type: order.delivery_type,
                                    confirmation_code_for_complete_delivery: order.confirmation_code_for_complete_delivery,
                                    store_name: store_name, store_image: store_image_url};

                                if (order.order_status == ORDER_STATE.ORDER_READY) {
                                    request.delivery_status = ORDER_STATE.DELIVERY_MAN_STARTED_DELIVERY;
                                    var image_file = request_data.files;
                                    var image_url = "";
                                    if (image_file != undefined && image_file.length > 0) {
                                        var image_name = request._id + utils.generateServerToken(4);
                                        image_url = utils.getStoreImageFolderPath(FOLDER_NAME.PICKUP_ORDER_IMAGES) + image_name + FILE_EXTENSION.ORDER;
                                        utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.ORDER, FOLDER_NAME.PICKUP_ORDER_IMAGES);
                                    }    
                                    var index = request.date_time.findIndex((x) => x.status == ORDER_STATE.DELIVERY_MAN_PICKED_ORDER);
                                    if (index == -1) {
                                        request.date_time.push({status: ORDER_STATE.DELIVERY_MAN_PICKED_ORDER, date: new Date(), image_url:image_url});
                                    } else {
                                        request.date_time[index].date = new Date();
                                        request.date_time[index].image_url = image_url;
                                    }

                                    var index = request.date_time.findIndex((x) => x.status == ORDER_STATE.DELIVERY_MAN_STARTED_DELIVERY);
                                    if (index == -1) {
                                        request.date_time.push({status: ORDER_STATE.DELIVERY_MAN_STARTED_DELIVERY, date: new Date()});
                                    } else {
                                        request.date_time[index].date = new Date();
                                    }

                                    request.markModified('date_time');
                                    var date = new Date();
                                    var min = date.getMinutes();
                                    var create_date_min = (request.created_at).getMinutes();
                                    var main_min = min - create_date_min;
                                    request.estimated_time_for_delivery_in_min = (+order_payment.total_time + +request.estimated_time_for_delivery_in_min) - main_min;

                                    request.save().then(() => {

                                            var user_device_type = "";
                                            var user_device_token = "";
                                            var phone_with_code = "";
                                            if (user) {
                                                user_device_type = user.device_type;
                                                user_device_token = user.device_token;
                                                phone_with_code = user.country_phone_code + user.phone;
                                            }

                                            if(store){
                                                var device_type = store.device_type;
                                                var device_token = store.device_token;
                                                utils.sendPushNotification(ADMIN_DATA_ID.STORE, device_type, device_token, STORE_PUSH_CODE.DELIVERY_MAN_PICKED_ORDER, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                            }

                                            var provider_phone_with_code = provider.country_phone_code + provider.phone;

                                            if (setting_detail.is_sms_notification)
                                            {
                                                SMS.sendOtherSMS(provider_phone_with_code, SMS_UNIQUE_ID.PROVIDER_ORDER_REMAINING, "");
                                                SMS.sendOtherSMS(phone_with_code, SMS_UNIQUE_ID.USER_ORDER_DISPATCH, "");
                                                SMS.sendSmsForOTPVerificationAndForgotPassword(phone_with_code, SMS_UNIQUE_ID.USER_ORDER_DIGITAL_CODE, order.confirmation_code_for_complete_delivery);
                                            }

                                            if (setting_detail.is_mail_notification) {
                                                emails.sendOrderRemainingEmail(request_data, provider);
                                                emails.sendOrderDispatchEmail(request_data, user);
                                                emails.sendOrderDigitalCodeEmail(request_data, user, order.confirmation_code_for_complete_delivery);
                                            }

                                            utils.sendPushNotificationWithPushData(ADMIN_DATA_ID.USER, user_device_type, user_device_token, USER_PUSH_CODE.DELIVERY_MAN_PICKED_ORDER, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, order_data, "");


                                            response_data({
                                                success: true,
                                                message: ORDER_MESSAGE_CODE.CHANGE_ORDER_STATUS_SUCCESSFULLY,
                                                delivery_status: request.delivery_status
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
                                    response_data({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_READY});
                                }
                            });

                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        })
                    }else{
                        response_data({success: false, error_code: ORDER_ERROR_CODE.ORDER_ALREADY_CANCELLED});
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
        } else
        {
            response_data({success: false, error_code: ORDER_ERROR_CODE.ORDER_ALREADY_CANCELLED});
        }
    }, (error) => {
        console.log(error);
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    });

};

exports.started_for_delivery = function (provider , request_data, response_data) {
    var request_data_body = request_data.body;
    var request_id = request_data_body.request_id;
    var delivery_status = Number(request_data_body.delivery_status);

    Request.findOne({_id: request_id , provider_id : provider._id , delivery_status_manage_id: ORDER_STATUS_ID.RUNNING}).then((request) => {

        if (request) {

            User.findOne({_id: request.user_id}).then((user) => {

                Order.findOne({_id: request.orders[0].order_id}).then((order) => {

                    if (order) {

                        Store.findOne({_id: order.store_id}).then((store) => {

                            var store_image_url = '';
                            var store_name = '';
                            if(store){
                                store_name = store.name;
                                store_image_url = store.image_url;
                            }

                            var order_data = {order_id: order._id, order_unique_id: order.unique_id, delivery_type: order.delivery_type,
                                confirmation_code_for_complete_delivery: order.confirmation_code_for_complete_delivery,
                                store_name: store_name, store_image: store_image_url};


                            request.delivery_status = delivery_status;

                            var index = request.date_time.findIndex((x) => x.status == ORDER_STATE.DELIVERY_MAN_STARTED_DELIVERY);
                            if (index == -1) {
                                request.date_time.push({status: ORDER_STATE.DELIVERY_MAN_STARTED_DELIVERY, date: new Date()});
                            } else {
                                request.date_time[index].date = new Date();
                            }
                            request.markModified('date_time');
                            request.save().then(() => {

                                    var user_device_type = "";
                                    var user_device_token = "";
                                    var phone_with_code = "";
                                    if (user) {
                                        user_device_type = user.device_type;
                                        user_device_token = user.device_token;
                                        phone_with_code = user.country_phone_code + user.phone;
                                    }

                                    if(store){
                                        var device_type = store.device_type;
                                        var device_token = store.device_token;
                                        var store_phone_with_code = store.country_phone_code + store.phone;
                                        utils.sendPushNotification(ADMIN_DATA_ID.STORE, device_type, device_token, STORE_PUSH_CODE.DELIVERY_MAN_STARTED_DELIVERY, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                    }

                                    if (setting_detail.is_sms_notification)
                                    {
                                        SMS.sendOtherSMS(phone_with_code, SMS_UNIQUE_ID.DELIVERY_MAN_ON_THE_WAY, "");
                                        if(store){
                                            SMS.sendOtherSMS(store_phone_with_code, SMS_UNIQUE_ID.DELIVERY_MAN_STARTED_DELIVERY, "");
                                        }
                                    }
                                    if (setting_detail.is_mail_notification) {
                                        emails.sendDeliverymanOnTheWayEmail(request_data, user);
                                        if(store){
                                            emails.sendDeliverymanStartDeliveryEmail(request_data, store);
                                        }
                                    }

                                    utils.sendPushNotificationWithPushData(ADMIN_DATA_ID.USER, user_device_type, user_device_token, USER_PUSH_CODE.DELIVERY_MAN_STARTED_DELIVERY, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, order_data, "");

                                    response_data({
                                        success: true,
                                        message: ORDER_MESSAGE_CODE.CHANGE_ORDER_STATUS_SUCCESSFULLY,
                                        delivery_status: request.delivery_status
                                    });

                            });
                        });
                    }else{
                        response_data({success: false, error_code: ORDER_ERROR_CODE.ORDER_ALREADY_CANCELLED});
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
        } else
        {
            response_data({success: false, error_code: ORDER_ERROR_CODE.ORDER_ALREADY_CANCELLED});
        }

    }, (error) => {
        console.log(error);
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    });

};

exports.arrived_at_destination = function (provider , request_data, response_data) {
    var request_data_body = request_data.body;
    var request_id = request_data_body.request_id;
    var delivery_status = Number(request_data_body.delivery_status);

    Request.findOne({_id: request_id , provider_id : provider._id , delivery_status_manage_id: ORDER_STATUS_ID.RUNNING}).then((request) => {

        if (request) {

            User.findOne({_id: request.user_id}).then((user) => {

                Order.findOne({_id: request.orders[0].order_id}).then((order) => {

                    if (order) {

                        Store.findOne({_id: order.store_id}).then((store) => {

                            var store_image_url = '';
                            var store_name = '';
                            if(store){
                                store_name = store.name;
                                store_image_url = store.image_url;
                            }

                            var order_data = {order_id: order._id, order_unique_id: order.unique_id, delivery_type: order.delivery_type,
                                confirmation_code_for_complete_delivery: order.confirmation_code_for_complete_delivery,
                                store_name: store_name, store_image: store_image_url};

                            request.delivery_status = delivery_status;
                            var image_file = request_data.files;
                            var image_url = "";
                            if (image_file != undefined && image_file.length > 0) {
                                var image_name = request._id + utils.generateServerToken(4);
                                image_url = utils.getStoreImageFolderPath(FOLDER_NAME.ARRIVED_ORDER_IMAGES) + image_name + FILE_EXTENSION.ORDER;
                                utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.ORDER, FOLDER_NAME.ARRIVED_ORDER_IMAGES);
                            }    
                            var index = request.date_time.findIndex((x) => x.status == ORDER_STATE.DELIVERY_MAN_ARRIVED_AT_DESTINATION);
                            if (index == -1) {
                                request.date_time.push({status: ORDER_STATE.DELIVERY_MAN_ARRIVED_AT_DESTINATION, date: new Date(), image_url:image_url});
                            } else {
                                request.date_time[index].date = new Date();
                                request.date_time[index].image_url = image_url;
                            }
                            request.markModified('date_time');
                            request.save().then(() => {

                                var user_device_type = "";
                                var user_device_token = "";
                                var phone_with_code = "";
                                if (user) {
                                    user_device_type = user.device_type;
                                    user_device_token = user.device_token;
                                    phone_with_code = user.country_phone_code + user.phone;
                                }

                                if(store){
                                    var device_type = store.device_type;
                                    var device_token = store.device_token;
                                    var store_phone_with_code = store.country_phone_code + store.phone;
                                    utils.sendPushNotification(ADMIN_DATA_ID.STORE, device_type, device_token, STORE_PUSH_CODE.DELIVERY_MAN_ARRIVED_AT_DESTINATION, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                }

                                if (setting_detail.is_sms_notification)
                                {
                                    SMS.sendOtherSMS(phone_with_code, SMS_UNIQUE_ID.DELIVERY_MAN_ARRIVED_AT_DESTINATION, "");
                                    if(store){
                                        SMS.sendOtherSMS(store_phone_with_code, SMS_UNIQUE_ID.DELIVERY_MAN_REACHED_AT_DESTINATION, "");
                                    }
                                }

                                if (setting_detail.is_mail_notification) {
                                    emails.sendDeliverymanArrivedAtDestinationEmail(request_data, user);
                                    if(store){
                                        emails.sendDeliverymanReachedAtDestinationEmail(request_data, store);
                                    }
                                }

                                utils.sendPushNotificationWithPushData(ADMIN_DATA_ID.USER, user_device_type, user_device_token, USER_PUSH_CODE.DELIVERY_MAN_ARRIVED_AT_DESTINATION, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, order_data, "");

                                Order_payment.findOne({_id: request.orders[0].order_payment_id}).then((order_payment)=>{
                                    City.findOne({_id: request.city_id}).then((city)=>{
                                        my_request.change_delivery_payment(provider.provider_type_id,order.delivery_type, order_payment, city, request.vehicle_id, store, request.destination_addresses[0].location, request.pickup_addresses[0].location, function(delivery_payment_response){
                                            if(order_payment.is_payment_mode_cash){
                                                response_data({
                                                    success: true,
                                                    message: ORDER_MESSAGE_CODE.CHANGE_ORDER_STATUS_SUCCESSFULLY,
                                                    delivery_status: request.delivery_status,
                                                    order_payment: order_payment
                                                });
                                            } else {
                                                response_data({
                                                    success: true,
                                                    message: ORDER_MESSAGE_CODE.CHANGE_ORDER_STATUS_SUCCESSFULLY,
                                                    delivery_status: request.delivery_status
                                                });
                                            }
                                        });
                                    }, (error) => {
                                        console.log(error);
                                        response_data.json({
                                            success: false,
                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                        });
                                    })
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
                        });
                    }else{
                        response_data({success: false, error_code: ORDER_ERROR_CODE.ORDER_ALREADY_CANCELLED});
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
        } else
        {
            response_data({success: false, error_code: ORDER_ERROR_CODE.ORDER_ALREADY_CANCELLED});
        }
    }, (error) => {
        console.log(error);
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    });

};

exports.complete_request = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'request_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var request_id = request_data_body.request_id;

            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {
                if (provider)
                {
                    if (request_data_body.type !== ADMIN_DATA_ID.ADMIN && (request_data_body.server_token !== null && provider.server_token !== request_data_body.server_token))
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        City.findOne({_id: provider.city_id}).then((city) => {

                            var is_provider_earning_add_in_wallet_on_cash_payment_for_city = city.is_provider_earning_add_in_wallet_on_cash_payment;
                            var is_store_earning_add_in_wallet_on_cash_payment_for_city = city.is_store_earning_add_in_wallet_on_cash_payment;
                            var is_provider_earning_add_in_wallet_on_other_payment_for_city = city.is_provider_earning_add_in_wallet_on_other_payment;
                            var is_store_earning_add_in_wallet_on_other_payment_for_city = city.is_store_earning_add_in_wallet_on_other_payment;


                            var city_timezone = city.timezone;
                            var now = new Date();
                            var today_start_date_time = utils.get_date_now_at_city(now, city_timezone);
                            var tag_date = moment(today_start_date_time).format(DATE_FORMATE.DDMMYYYY);

                            Request.findOne({_id: request_id, provider_id: request_data_body.provider_id}).then((request) => {
                                if (request) {
                                    User.findOne({_id: request.user_id}).then((user) => {
                                        var user_device_type = user.device_type;
                                        var user_device_token = user.device_token;

                                        Order.findOne({_id: request.orders[0].order_id, order_status_id: ORDER_STATUS_ID.RUNNING}).then((order_detail) => {
                                            if (order_detail) {
                                                var country_id = order_detail.country_id;

                                                Store.findOne({_id: order_detail.store_id}).then((store) => {

                                                    if (country_id == null && country_id == undefined)
                                                    {
                                                        country_id = store.country_id;
                                                    }

                                                    Country.findOne({_id: country_id}).then((country) => {

                                                        var currency = "";
                                                        if (country) {
                                                            currency = country.currency_sign;
                                                        }
                                                        if(store){
                                                            var device_type = store.device_type;
                                                            var device_token = store.device_token;
                                                            var phone_with_code = store.country_phone_code + store.phone;
                                                        }

                                                        request.delivery_status_manage_id = ORDER_STATUS_ID.COMPLETED;
                                                        request.delivery_status_by = request_data_body.provider_id;
                                                        request.delivery_status = ORDER_STATE.ORDER_COMPLETED;
                                                        request.completed_at = now;
                                                        request.completed_date_tag = tag_date;
                                                        request.completed_date_in_city_timezone = today_start_date_time;

                                                        var index = request.date_time.findIndex((x) => x.status == ORDER_STATE.ORDER_COMPLETED);
                                                        if (index == -1) {
                                                            request.date_time.push({status: ORDER_STATE.ORDER_COMPLETED, date: new Date()});
                                                        } else {
                                                            request.date_time[index].date = new Date();
                                                        }
                                                        request.markModified('date_time');
                                                        request.save();

                                                        order_detail.order_status_manage_id = ORDER_STATUS_ID.COMPLETED;
                                                        order_detail.order_status_id = ORDER_STATUS_ID.COMPLETED;
                                                        order_detail.order_status_by = request_data_body.provider_id;
                                                        order_detail.order_status = ORDER_STATE.ORDER_COMPLETED;
                                                        order_detail.completed_at = now;
                                                        order_detail.completed_date_tag = tag_date;
                                                        order_detail.completed_date_in_city_timezone = today_start_date_time;

                                                        // Provider Analytic Table //
                                                        utils.insert_daily_provider_analytics(city_timezone, provider._id, ORDER_STATE.ORDER_COMPLETED, false, null, false, null);

                                                        order_detail.save();
                                                        Order_payment.findOne({_id: order_detail.order_payment_id}).then((order_payment) => {
                                                            if (order_payment) {

                                                                // my_request.change_delivery_payment(order_payment, city, request.vehicle_id, store, request.destination_addresses[0].location, request.pickup_addresses[0].location, function(delivery_payment_response){

                                                                //     if(delivery_payment_response.success){
                                                                //         order_payment = delivery_payment_response.order_payment;
                                                                //     }
                                                                    if(store){
                                                                        utils.insert_daily_store_analytics(tag_date, order_detail.store_id, ORDER_STATE.ORDER_COMPLETED, order_payment.total_item_count, false);
                                                                    }

                                                                    var payment_gateway_name = "Cash";
                                                                    var is_payment_mode_cash = order_payment.is_payment_mode_cash;

                                                                    var store_have_service_payment = 0;
                                                                    var store_have_order_payment = 0;
                                                                    var total_store_have_payment = 0;
                                                                    var pay_to_store = 0;
                                                                    var provider_have_cash_payment = 0;
                                                                    var provider_paid_order_payment = 0;
                                                                    var total_provider_have_payment = 0;
                                                                    var pay_to_provider = 0;

                                                                    if (order_payment.is_store_pay_delivery_fees) {
                                                                        store_have_service_payment = order_payment.total_delivery_price;
                                                                        store_have_service_payment = utils.precisionRoundTwo(store_have_service_payment);
                                                                    }

                                                                    if (is_payment_mode_cash) {
                                                                        provider_have_cash_payment = order_payment.cash_payment;
                                                                        if (!order_payment.is_order_price_paid_by_store) {
                                                                            store_have_order_payment = order_payment.total_order_price;
                                                                            store_have_order_payment = utils.precisionRoundTwo(store_have_order_payment);
                                                                            provider_paid_order_payment = order_payment.total_order_price;
                                                                            provider_paid_order_payment = utils.precisionRoundTwo(provider_paid_order_payment);
                                                                        }
                                                                    }
                                                                    var other_promo_payment_loyalty = order_payment.other_promo_payment_loyalty;

                                                                    total_store_have_payment = +store_have_service_payment + +store_have_order_payment;
                                                                    total_store_have_payment = utils.precisionRoundTwo(total_store_have_payment);
                                                                    pay_to_store = order_payment.total_store_income - total_store_have_payment - other_promo_payment_loyalty;

                                                                    total_provider_have_payment = provider_have_cash_payment - provider_paid_order_payment;
                                                                    total_provider_have_payment = utils.precisionRoundTwo(total_provider_have_payment);
                                                                    pay_to_provider = order_payment.total_provider_income - total_provider_have_payment;
                                                                    pay_to_provider = utils.precisionRoundTwo(pay_to_provider);

                                                                    if(order_payment.delivery_price_used_type == ADMIN_DATA_ID.STORE){
                                                                        order_payment.total_store_income = order_payment.total_store_income + order_payment.total_provider_income;
                                                                        if(is_payment_mode_cash){
                                                                            pay_to_store = order_payment.total_store_income  - order_payment.user_pay_payment - store_have_service_payment - other_promo_payment_loyalty;
                                                                        } else {
                                                                            pay_to_store = order_payment.total_store_income - store_have_service_payment - other_promo_payment_loyalty;
                                                                        }
                                                                        pay_to_provider = 0;
                                                                        order_payment.total_provider_income = 0;
                                                                    }
                                                                    pay_to_store = utils.precisionRoundTwo(pay_to_store);

                                                                    order_payment.pay_to_store = pay_to_store;
                                                                    order_payment.pay_to_provider = pay_to_provider;
                                                                    order_payment.completed_at = now;
                                                                    order_payment.completed_date_tag = tag_date;
                                                                    order_payment.completed_date_in_city_timezone = today_start_date_time;

                                                                    Payment_gateway.findOne({_id: order_payment.payment_id}).then((payment_gateway) => {

                                                                        if (!is_payment_mode_cash) {
                                                                            payment_gateway_name = payment_gateway.name;
                                                                        }
                                                                        if ((setting_detail.is_provider_earning_add_in_wallet_on_cash_payment && order_payment.is_payment_mode_cash && is_provider_earning_add_in_wallet_on_cash_payment_for_city) || (setting_detail.is_provider_earning_add_in_wallet_on_other_payment && !order_payment.is_payment_mode_cash && is_provider_earning_add_in_wallet_on_other_payment_for_city))
                                                                        {
                                                                            if (pay_to_provider<0) {
                                                                                var total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.PROVIDER, provider.unique_id, provider._id, provider.country_id,
                                                                                    provider.wallet_currency_code, order_payment.order_currency_code,
                                                                                    1, Math.abs(pay_to_provider), provider.wallet, WALLET_STATUS_ID.REMOVE_WALLET_AMOUNT, WALLET_COMMENT_ID.SET_ORDER_PROFIT, "Profit Of This Order : " + order_detail.unique_id);

                                                                                provider.wallet = total_wallet_amount;
                                                                            } else
                                                                            {
                                                                                var total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.PROVIDER, provider.unique_id, provider._id, provider.country_id,
                                                                                    provider.wallet_currency_code, order_payment.order_currency_code,
                                                                                    1, pay_to_provider, provider.wallet, WALLET_STATUS_ID.ADD_WALLET_AMOUNT, WALLET_COMMENT_ID.SET_ORDER_PROFIT, "Profit Of This Order : " + order_detail.unique_id);

                                                                                provider.wallet = total_wallet_amount;

                                                                            }
                                                                            provider.save();
                                                                            order_payment.is_provider_income_set_in_wallet = true;
                                                                            order_payment.provider_income_set_in_wallet = Math.abs(pay_to_provider);
                                                                        }
                                                                        if (store && ((setting_detail.is_store_earning_add_in_wallet_on_cash_payment && order_payment.is_payment_mode_cash &&  is_store_earning_add_in_wallet_on_cash_payment_for_city) || (setting_detail.is_store_earning_add_in_wallet_on_other_payment && !order_payment.is_payment_mode_cash && is_store_earning_add_in_wallet_on_other_payment_for_city)))
                                                                        {
                                                                            if (pay_to_store<0) {

                                                                                var store_total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.STORE, store.unique_id, store._id, store.country_id,
                                                                                    store.wallet_currency_code, order_payment.order_currency_code,
                                                                                    1, Math.abs(pay_to_store), store.wallet, WALLET_STATUS_ID.REMOVE_WALLET_AMOUNT, WALLET_COMMENT_ID.SET_ORDER_PROFIT, "Profit Of This Order : " + order_detail.unique_id);

                                                                                store.wallet = store_total_wallet_amount;
                                                                            } else
                                                                            {
                                                                                var store_total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.STORE, store.unique_id, store._id, store.country_id,
                                                                                    store.wallet_currency_code, order_payment.order_currency_code,
                                                                                    1, pay_to_store, store.wallet, WALLET_STATUS_ID.ADD_WALLET_AMOUNT, WALLET_COMMENT_ID.SET_ORDER_PROFIT, "Profit Of This Order : " + order_detail.unique_id);

                                                                                store.wallet = store_total_wallet_amount;
                                                                            }

                                                                            store.save();
                                                                            order_payment.is_store_income_set_in_wallet = true;
                                                                            order_payment.store_income_set_in_wallet = Math.abs(pay_to_store);
                                                                        }

                                                                        if (setting_detail.is_sms_notification)
                                                                        {
                                                                            SMS.sendOtherSMS(phone_with_code, SMS_UNIQUE_ID.STORE_ORDER_COMPLETED, "");
                                                                        }

                                                                        if (setting_detail.is_mail_notification) {
                                                                            emails.sendUserOrderCompleteEmail(request_data, user);
                                                                            if(store){
                                                                                emails.sendStoreOrderCompleteEmail(request_data, store);
                                                                                emails.sendStoreInvoiceEmail(request_data, user, provider, store, order_payment, currency);
                                                                            }
                                                                            emails.sendProviderOrderDeliveredEmail(request_data, provider);
                                                                        }

                                                                        order_payment.delivered_at = now;
                                                                        order_payment.provider_id = provider._id;
                                                                        order_payment.save();


                                                                        // Entry In Review Table //
                                                                        var reviews = new Review({
                                                                            order_id: order_detail._id,
                                                                            order_unique_id: order_detail.unique_id,
                                                                            user_id: order_detail.user_id,
                                                                            store_id: order_detail.store_id,
                                                                            provider_id: provider._id
                                                                        });
                                                                        reviews.save();

                                                                        var store_name = '';
                                                                        var store_image_url = '';
                                                                        if(store){
                                                                            store_name = store.name,
                                                                            store_image_url = store.image_url
                                                                        }

                                                                        var order_data = {
                                                                            order_id: order_detail._id,
                                                                            unique_id: order_detail.unique_id,
                                                                            store_name: store_name,
                                                                            store_image: store_image_url
                                                                        }

                                                                        utils.sendPushNotificationWithPushData(ADMIN_DATA_ID.USER, user_device_type, user_device_token, USER_PUSH_CODE.DELIVERY_MAN_COMPLETE_ORDER, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, order_data, "");
                                                                        if(store){
                                                                            utils.sendPushNotification(ADMIN_DATA_ID.STORE, device_type, device_token, STORE_PUSH_CODE.DELIVERY_MAN_COMPLETE_ORDER, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                                                                        }
                                                                        response_data.json({
                                                                            success: true,
                                                                            message: ORDER_MESSAGE_CODE.ORDER_COMPLETED_SUCCESSFULLY,
                                                                            request_id: request._id,
                                                                            delivery_status: request.delivery_status,
                                                                            order_id: order_detail._id,
                                                                            order_status: order_detail.order_status,
                                                                            currency: currency,
                                                                            payment_gateway_name: payment_gateway_name,
                                                                            order_payment: order_payment
                                                                        });

                                                                    });
                                                                // });

                                                            } else {
                                                                response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_COMPLETE_FAILED});
                                                            }

                                                        }, (error) => {
                                                            console.log(error);
                                                            response_data.json({
                                                                success: false,
                                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                            });
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
                                                response_data.json({
                                                    success: false,
                                                    error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND
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

                                } else
                                {
                                    response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                                }

                            }, (error) => {
                                console.log(error);
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
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

exports.show_request_invoice = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'request_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {
                if (provider) {
                    if (request_data_body.server_token !== null && provider.server_token !== request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {

                        Request.findOne({_id: request_data_body.request_id}).then((request) => {
                            if (request) {
                                User.findOne({_id: request.user_id}).then((user) => {

                                    Order.findOne({_id: request.orders[0].order_id}).then((order) => {
                                        if (order)
                                        {
                                            var country_id = order.country_id;
                                            Store.findOne({_id: order.store_id}).then((store) => {
                                                if (country_id == null && country_id == undefined) {
                                                    country_id = store.country_id;
                                                }
                                                Country.findOne({_id: country_id}).then((country) => {
                                                    var currency = "";
                                                    if (country)
                                                    {
                                                        currency = country.currency_sign;
                                                    }

                                                    Order_payment.findOne({_id: order.order_payment_id}).then((order_payment) => {

                                                        order.is_provider_show_invoice = request_data_body.is_provider_show_invoice;
                                                        provider.total_completed_requests = provider.total_completed_requests + 1;
                                                        provider.save();

                                                        emails.sendProviderInvoiceEmail(request_data, user, provider, store, order_payment, currency);
                                                        order.save();

                                                        response_data.json({success: true,
                                                            message: ORDER_MESSAGE_CODE.SHOW_INVOICE_SUCCESSFULLY});

                                                    }, (error) => {
                                                        console.log(error);
                                                        response_data.json({
                                                            success: false,
                                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                        });
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

                            } else
                            {
                                response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                            }

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

exports.provider_get_invoice = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'request_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var request_id = request_data_body.request_id;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {
                if (provider) {
                    if (request_data_body.server_token !== null && provider.server_token !== request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        Request.findOne({_id: request_id}).then((request) => {
                            if (request)
                            {
                                Order.findOne({_id: request.orders[0].order_id}).then((order) => {
                                    if (order) {
                                        var country_id = order.country_id;
                                        Store.findOne({_id: order.store_id}).then((store) => {
                                            if (order.country_id == null && order.country_id == undefined) {
                                                country_id = store.country_id;
                                            }
                                            Country.findOne({_id: country_id}).then((country) => {
                                                var currency = country.currency_sign;

                                                Order_payment.findOne({_id: request.orders[0].order_payment_id}).then((order_payment_detail) => {
                                                    if (order_payment_detail)
                                                    {
                                                        Provider.findOne({_id: request.current_provider}).then((provider_data) => {

                                                            var provider_detail = {};
                                                            if (provider_data)
                                                            {
                                                                provider_detail = provider_data;
                                                            }

                                                            Payment_gateway.findOne({_id: order_payment_detail.payment_id}).then((payment_gateway) => {
                                                                var payment_gateway_name = "Cash";
                                                                if (order_payment_detail.is_payment_mode_cash == false) {
                                                                    payment_gateway_name = payment_gateway.name;
                                                                }

                                                                response_data.json({success: true,
                                                                    message: USER_MESSAGE_CODE.GET_INVOICE_SUCCESSFULLY,
                                                                    payment_gateway_name: payment_gateway_name,
                                                                    currency: currency,
                                                                    provider_detail: provider_detail,
                                                                    request: request,
                                                                    order_payment: order_payment_detail

                                                                });

                                                            }, (error) => {
                                                                console.log(error);
                                                                response_data.json({
                                                                    success: false,
                                                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                });
                                                            });

                                                        });

                                                    } else
                                                    {
                                                        response_data.json({success: false, error_code: USER_ERROR_CODE.INVOICE_NOT_FOUND});
                                                    }

                                                }, (error) => {
                                                    console.log(error);
                                                    response_data.json({
                                                        success: false,
                                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                    });
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

exports.provider_cancel_or_reject_request = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'request_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Provider.findOne({_id: request_data_body.provider_id}).then((provider) => {
                if (provider)
                {
                    if (request_data_body.server_token !== null && provider.server_token !== request_data_body.server_token)
                    {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    } else
                    {
                        var delivery_status = Number(request_data_body.delivery_status);
                        if (delivery_status == ORDER_STATE.DELIVERY_MAN_REJECTED) {

                            exports.provider_reject_request(provider, request_data, function (return_data) {
                                response_data.json(return_data);
                            });

                        } else if (delivery_status == ORDER_STATE.DELIVERY_MAN_CANCELLED) {

                            exports.provider_cancel_request(provider, request_data, function (return_data) {
                                response_data.json(return_data);
                            });

                        } else {
                            response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                        }
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

exports.provider_cancel_request = function (provider , request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var request_id = request_data_body.request_id;

            Request.findOne({_id: request_id, provider_id: provider._id, delivery_status_manage_id: ORDER_STATUS_ID.RUNNING}).then((request) => {
                if (request) {
                    Order.findOne({_id: request.orders[0].order_id}).then((order) => {
                        if (order) {
                            Store.findOne({_id: order.store_id}).then((store) => {
                                request.delivery_status = ORDER_STATE.DELIVERY_MAN_CANCELLED;
                                request.delivery_status_manage_id = ORDER_STATUS_ID.CANCELLED;
                                request.delivery_status_by = null;
                                request.provider_id = null;
                                request.current_provider = null;

                                request.cancel_reasons.push(request_data_body.cancel_reasons);

                                var index = request.date_time.findIndex((x) => x.status == ORDER_STATE.DELIVERY_MAN_CANCELLED);
                                if (index == -1) {
                                    request.date_time.push({status: ORDER_STATE.DELIVERY_MAN_CANCELLED, date: new Date()});
                                } else {
                                    request.date_time[index].date = new Date();
                                }
                                request.markModified('date_time');

                                request.save().then(() => {
                                        utils.insert_daily_provider_analytics(request.timezone, provider._id, ORDER_STATE.DELIVERY_MAN_CANCELLED, false, null, false, null);
                                        provider.total_cancelled_requests = provider.total_cancelled_requests + 1;
                                        provider.save();
                                        if(store){
                                            if (setting_detail.is_sms_notification)
                                            {
                                                var store_phone_with_code = store.country_phone_code + store.phone;
                                                SMS.sendOtherSMS(store_phone_with_code, SMS_UNIQUE_ID.STORE_ORDER_CANCELLED, "");
                                            }
                                            if (setting_detail.is_mail_notification && store)
                                            {
                                                emails.sendStoreOrderCancelEmail(request_data, store);
                                            }
                                        }

                                        // my_request.findNearestProvider(request, null);

                                        response_data({
                                            success: true,
                                            message: ORDER_MESSAGE_CODE.ORDER_CANCEL_OR_REJECT_BY_PROVIDER_SUCCESSFULLY

                                        });

                                }, (error) => {
                                    console.log(error);
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });
                            });

                        }else{
                            response_data({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                        }

                    }, (error) => {
                        console.log(error);
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        });
                    });
                }else{
                    response_data({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
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

exports.provider_reject_request = function (provider , request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var request_id = request_data_body.request_id;

            Request.findOne({_id: request_id, current_provider: provider._id, provider_id: null, delivery_status_manage_id: ORDER_STATUS_ID.RUNNING}).then((request) => {
                if (request) {
                    Order.findOne({_id: request.orders[0].order_id}).then((order) => {
                        if (order) {

                            var city_timezone = request.timezone;

                            request.delivery_status = ORDER_STATE.DELIVERY_MAN_REJECTED;
                            request.delivery_status_manage_id = ORDER_STATUS_ID.REJECTED;
                            request.delivery_status_by = null;
                            request.cancel_reasons.push(request_data_body.cancel_reasons);

                            request.save().then(() => {
                                    utils.insert_daily_provider_analytics(city_timezone, provider._id, ORDER_STATE.DELIVERY_MAN_REJECTED, false, null, false, null);

                                    provider.total_rejected_requests = provider.total_rejected_requests + 1;
                                    provider.save();

                                    my_request.findNearestProvider(request, null);

                                    response_data({
                                        success: true,
                                        message: ORDER_MESSAGE_CODE.ORDER_CANCEL_OR_REJECT_BY_PROVIDER_SUCCESSFULLY

                                    });

                            }, (error) => {
                                console.log(error);
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });

                        }else{
                            response_data({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
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
                    response_data({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
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

exports.cancel_request = function (request_id , return_data) {


    Request.findOne({_id: request_id}).then((request) => {
        if (request) {
            var provider_id = request.provider_id;
            if (!provider_id) {
                provider_id = request.current_provider;
            }

            Provider.findOne({_id: provider_id}).then((provider) => {

                request.current_provider = null;
                request.provider_id = null;
                request.delivery_status = ORDER_STATE.STORE_CANCELLED_REQUEST;
                request.delivery_status_manage_id = ORDER_STATUS_ID.CANCELLED;
                request.delivery_status_by = null;

                var index = request.date_time.findIndex((x) => x.status == ORDER_STATE.STORE_CANCELLED_REQUEST);
                if (index == -1) {
                    request.date_time.push({status: ORDER_STATE.STORE_CANCELLED_REQUEST, date: new Date()});
                } else {
                    request.date_time[index].date = new Date();
                }
                request.markModified('date_time');

                request.save().then(() => {
                        if (provider) {
                            utils.sendPushNotification(ADMIN_DATA_ID.PROVIDER, provider.device_type, provider.device_token, PROVIDER_PUSH_CODE.STORE_CANCELLED_REQUEST, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
                        }
                        if (return_data) {
                            return_data({success: true,
                                message: STORE_MESSAGE_CODE.CANCEL_REQUEST_SUCESSFULLY,
                                delivery_status: request.delivery_status
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
        } else {
            if (return_data) {
                return_data({success: false});
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

exports.get_vehicle_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;

            var type = Number(request_data_body.type);
            var id = null;
            var Table;
            switch (type) {
                case ADMIN_DATA_ID.USER:
                    Table = User;
                    id = request_data_body.user_id
                    break;
                case ADMIN_DATA_ID.STORE:
                    Table = Store;
                    id = request_data_body.store_id
                    break;
                default:
                    Table = Store;
                    id = request_data_body.store_id
                    break;
            }
            Table.findOne({_id: id}).then((detail) => {
                // if (detail) {
                    /*if (detail && request_data_body.server_token !== null && detail.server_token !== request_data_body.server_token) {
                        response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});

                    } else {*/
                        
                        Order_payment.findOne({order_id: request_data_body.order_id}, function (error, order_payment_detail) {
                            var lookup = {
                                $lookup:
                                    {
                                        from: "vehicles",
                                        localField: "vehicle_id",
                                        foreignField: "_id",
                                        as: "vehicle_detail"
                                    }
                            };
                            var unwind = {$unwind: "$vehicle_detail"};
                            var mongoose = require('mongoose');
                            var condition = {$match: {}};

                            var delivery_type = DELIVERY_TYPE.STORE;
                            if(request_data_body.delivery_type){
                                delivery_type = request_data_body.delivery_type;
                            }

                            if(detail && detail.city_id){
                                condition = {$match: {'city_id': {$eq: detail.city_id}}};
                            } else {
                                condition = {$match: {'city_id': {$eq: Schema(request_data_body.city_id)}}};
                            }

                            var condition1 = {$match: {'is_business': {$eq: true}}};
                            var type_query = {$match: {}}
                            if(order_payment_detail){
                                if(order_payment_detail.delivery_price_used_type == ADMIN_DATA_ID.STORE && request_data_body.store_id){
                                    type_query = {$match: {type_id: detail._id}};
                                } else {
                                    type_query = {$match: {type_id: null}};
                                }
                            } else {
                                type_query = {$match: {type_id: null}};
                            }
                            var group = {$group: {
                                _id: null,
                                    vehicles: {
                                        $push: {
                                            $cond: {
                                                if: {$eq: [ "$vehicle_detail.is_business", true ] },
                                                then: '$vehicle_detail' ,
                                                else: null,
                                            }
                                        }
                                    },
                                }
                            }
                            var delivery_type_query = {$match: {delivery_type: {$eq: delivery_type}}};

                            Service.aggregate([condition, condition1, delivery_type_query, type_query, lookup, unwind, group]).then((services) => {
                                

                                if(services.length>0){
                                    services[0].vehicles = services[0].vehicles.filter(v => v != null);
                                    response_data.json({
                                        success: true, vehicles: services[0].vehicles
                                    })
                                } else {
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                }
                            }, (error) => {
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });
                        })
                    //}
                // } else {
                //     response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND});
                // }
            });

        } else {
            response_data.json(response);
        }
    });
};

exports.get_vehicles_list = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        //if (response.success) {

            var request_data_body = request_data.body;
            var store  = response.store;
                        
                            var lookup = {
                                $lookup:
                                {
                                    from: "vehicles",
                                    localField: "vehicle_id",
                                    foreignField: "_id",
                                    as: "vehicle_detail"
                                }
                            };
                            var unwind = {$unwind: "$vehicle_detail"};

                            var condition = {$match: {}}
                            if(store){
                                condition = {$match: {'city_id': {$eq: store.city_id}}};
                            } else {
                                condition = {$match: {'city_id': {$eq: Schema(request_data_body.city_id)}}};
                            }

                            var delivery_type = DELIVERY_TYPE.STORE;
                            if(request_data_body.delivery_type){
                                delivery_type = request_data_body.delivery_type;
                            }

                            var group = {
                                $group: {
                                    _id: null,
                                    vehicles: {
                                        $push: {
                                                $cond: {
                                                    if: { $and: [{$eq: [ "$admin_type", ADMIN_DATA_ID.STORE ] }, {$eq: [ "$vehicle_detail.is_business", true ] }] },
                                                    then: {
                                                        vehicle_name: '$vehicle_detail.vehicle_name',
                                                        description: '$vehicle_detail.description',
                                                        image_url: '$vehicle_detail.image_url',
                                                        map_pin_image_url: '$vehicle_detail.map_pin_image_url',
                                                        is_business: '$vehicle_detail.is_business',
                                                        price_per_unit_distance: '$price_per_unit_distance',
                                                        _id: '$vehicle_detail._id'
                                                    } ,
                                                    else: null,
                                                }
                                            
                                            
                                        }
                                    },
                                    admin_vehicles: {
                                        $push: {
                                                $cond: {
                                                    if: { $and: [{$ne: [ "$admin_type", ADMIN_DATA_ID.STORE ] }, {$eq: [ "$vehicle_detail.is_business", true ] }] },
                                                    then: {
                                                        vehicle_name: '$vehicle_detail.vehicle_name',
                                                        description: '$vehicle_detail.description',
                                                        image_url: '$vehicle_detail.image_url',
                                                        map_pin_image_url: '$vehicle_detail.map_pin_image_url',
                                                        is_business: '$vehicle_detail.is_business',
                                                        price_per_unit_distance: '$price_per_unit_distance',
                                                        _id: '$vehicle_detail._id'
                                                        
                                                    } ,
                                                    else: null,
                                                }
                                        }
                                    },
                                }
                            }

                            var type_condition = {$match: {'type_id': {$eq: null}}};
                            if(store){
                                type_condition = {$match: {$or: [{'type_id': {$eq: store._id}},{'type_id': {$eq: null}}]}};
                            }

                            var delivery_type_query = {$match: {delivery_type: {$eq: delivery_type}}};

                            Service.aggregate([condition, delivery_type_query, type_condition, lookup, unwind, group]).then((services) => {
                                if(services.length>0){
                                    services[0].admin_vehicles = services[0].admin_vehicles.filter(v => v != null);
                                    services[0].vehicles = services[0].vehicles.filter(v => v != null);

                                    
                                    response_data.json({
                                        success: true, admin_vehicles: services[0].admin_vehicles, vehicles: services[0].vehicles
                                    })
                                } else {
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                }
                            }, (error) => {
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });
               

        /*} else {
            response_data.json(response);
        }*/
    });
};

function removeDuplicates(json_all) {
    let unique_array = json_all.filter(function(elem, index, self) {
        return index == self.indexOf(elem.vehicle_id);
    });
    return unique_array
}


exports.change_delivery_payment = function (provider_type_id,delivery_type, order_payment, city_detail, vehicle_id, store, destination_location, pickup_location, response_data) {
    if(String(provider_type_id) == String(store._id)){
        var delivery_price_used_type_id = order_payment.delivery_price_used_type_id;
    }else{
        var delivery_price_used_type_id = null;
    }
    
    var city_id = city_detail._id;

    utils.check_zone(city_id, delivery_type, delivery_price_used_type_id, vehicle_id, city_detail.zone_business, pickup_location, destination_location, function (zone_response) {
        
                                                                
            Service.findOne({city_id: city_id, delivery_type: delivery_type, type_id: delivery_price_used_type_id, vehicle_id: vehicle_id}).then((service) => {
                
                if (service) {
                    /* HERE USER PARAM */
                    var total_distance = order_payment.total_distance;
                    var total_time = order_payment.total_time;
                    var is_user_pick_up_order = order_payment.is_user_pick_up_order;

                    console.log("total_distance: "+total_distance)
                    console.log("total_time: "+total_time)
                    
                    var base_price = 0;
                    var base_price_distance = 0;
                    var price_per_unit_distance = 0;
                    var price_per_unit_time = 0;
                    var service_tax = 0;
                    var min_fare = 0;

                    if (service){
                        if(service.admin_profit_mode_on_delivery){
                            admin_profit_mode_on_delivery = service.admin_profit_mode_on_delivery;
                            admin_profit_value_on_delivery = service.admin_profit_value_on_delivery;
                        }

                        base_price = service.base_price;
                        base_price_distance = service.base_price_distance;
                        price_per_unit_distance = service.price_per_unit_distance;
                        price_per_unit_time = service.price_per_unit_time;
                        service_tax = service.service_tax;
                        min_fare = service.min_fare;

                    }

                    // DELIVERY CALCULATION START //
                    var distance_price = 0;
                    var total_base_price = 0;
                    var total_distance_price = 0;
                    var total_time_price = 0;
                    var total_service_price = 0;
                    var total_admin_tax_price = 0;
                    var total_after_tax_price = 0;
                    var total_surge_price = 0;
                    var total_delivery_price_after_surge = 0;
                    var delivery_price = 0;
                    var total_delivery_price = 0;
                    var total_admin_profit_on_delivery = 0;
                    var total_provider_income = 0;
                    var promo_payment = 0;

                    // total_time = total_time / 60;// convert to mins
                    total_time = utils.precisionRoundTwo(Number(total_time));

                    // if (order_payment.is_distance_unit_mile) {
                    //     total_distance = total_distance * 0.000621371;
                    // } else {
                    //     total_distance = total_distance * 0.001;
                    // }

                    if (!is_user_pick_up_order) {

                        if(service && service.is_use_distance_calculation){
                            var delivery_price_setting = service.delivery_price_setting;
                            delivery_price_setting.forEach(function (delivery_setting_detail) {
                                if(delivery_setting_detail.from_distance <= total_distance && delivery_setting_detail.to_distance >= total_distance){
                                    distance_price = delivery_setting_detail.delivery_fee;
                                    total_distance_price = delivery_setting_detail.delivery_fee;
                                    total_service_price = delivery_setting_detail.delivery_fee;
                                    delivery_price = delivery_setting_detail.delivery_fee;
                                    total_after_tax_price = delivery_setting_detail.delivery_fee;
                                    total_delivery_price_after_surge = delivery_setting_detail.delivery_fee;
                                }
                            });
                        } else {
                            total_base_price = base_price;
                            if (total_distance > base_price_distance) {
                                distance_price = (total_distance - base_price_distance) * price_per_unit_distance;
                            }


                            total_base_price = utils.precisionRoundTwo(total_base_price);
                            distance_price = utils.precisionRoundTwo(distance_price);
                            total_time_price = price_per_unit_time * total_time;
                            total_time_price = utils.precisionRoundTwo(Number(total_time_price));


                            total_distance_price = +total_base_price + +distance_price;
                            total_distance_price = utils.precisionRoundTwo(total_distance_price);

                            total_service_price = +total_distance_price + +total_time_price;
                            total_service_price = utils.precisionRoundTwo(Number(total_service_price));
                            

                            total_admin_tax_price = service_tax * total_service_price * 0.01;
                            total_admin_tax_price = utils.precisionRoundTwo(Number(total_admin_tax_price));
                            
                            total_after_tax_price = +total_service_price + +total_admin_tax_price;
                            total_after_tax_price = utils.precisionRoundTwo(Number(total_after_tax_price));
                            
                            total_delivery_price_after_surge = +total_after_tax_price + +total_surge_price;
                            total_delivery_price_after_surge = utils.precisionRoundTwo(Number(total_delivery_price_after_surge));

                            if (total_delivery_price_after_surge <= min_fare) {
                                delivery_price = min_fare;
                            } else {
                                delivery_price = total_delivery_price_after_surge;
                            }
                        }

                        if (zone_response.success) {
                            total_admin_tax_price = 0;
                            total_base_price = 0;
                            total_distance_price = 0;
                            total_time_price = 0;
                            total_service_price = zone_response.zone_price;
                            delivery_price = zone_response.zone_price;
                            total_after_tax_price = total_service_price;
                            total_delivery_price_after_surge = total_service_price;
                        }

                        switch (admin_profit_mode_on_delivery) {
                            case ADMIN_PROFIT_ON_DELIVERY_ID.PERCENTAGE: /* 1- percentage */
                                total_admin_profit_on_delivery = delivery_price * admin_profit_value_on_delivery * 0.01;
                                break;
                            case ADMIN_PROFIT_ON_DELIVERY_ID.PER_DELVIERY: /* 2- absolute per delivery */
                                total_admin_profit_on_delivery = admin_profit_value_on_delivery;
                                break;
                            default: /* percentage */
                                total_admin_profit_on_delivery = delivery_price * admin_profit_value_on_delivery * 0.01;
                                break;
                        }

                        total_admin_profit_on_delivery = utils.precisionRoundTwo(Number(total_admin_profit_on_delivery));
                        total_provider_income = (delivery_price - total_admin_profit_on_delivery) + +order_payment.tip_amount;
                        total_provider_income = utils.precisionRoundTwo(Number(total_provider_income));


                    } else {
                        total_distance = 0;
                        total_time = 0;
                    }

                    // DELIVERY CALCULATION END //
                    // ORDER CALCULATION START //

                    var order_price = order_payment.total_order_price;

                    
                    /* FINAL INVOICE CALCULATION START */
                    total_delivery_price = delivery_price;
                    total_order_price = order_price;
                    var total = +total_delivery_price + +total_order_price + +order_payment.tip_amount;
                    total = utils.precisionRoundTwo(Number(total));
                    var user_pay_payment = total - order_payment.promo_payment;
					order_payment.total_service_price = total_service_price;
					order_payment.total_delivery_price = total_delivery_price;
                    // Store Pay Delivery Fees Condition
					promo_code_controller.edit_order_apply_promo_code({
                                                                user_id:order_payment.user_id,
                                                                store:store,
                                                                order_payment:order_payment,
                                                                promo_id:order_payment.promo_id,
                                                                order_payment_id:order_payment._id,
                                                            }, function (return_data) { 
													if(return_data.success == true){
														user_pay_payment = user_pay_payment - return_data.promo_payment;
														order_payment.remaining_payment = order_payment.remaining_payment - return_data.promo_payment;
                                                        order_payment.is_promo_for_delivery_service = return_data.is_promo_for_delivery_service;
                                                        order_payment.other_promo_payment_loyalty = return_data.other_promo_payment_loyalty;
                                                        order_payment.promo_payment = return_data.promo_payment;
                                                    }else{

                                                        order_payment.is_promo_for_delivery_service = true;
                                                        order_payment.other_promo_payment_loyalty = 0;
                                                        order_payment.promo_payment = 0;
														
                                                    }
						if(store){
							var distance_from_store = utils.getDistanceFromTwoLocation(destination_location, store.location);
							if (total_order_price > store.free_delivery_for_above_order_price && distance_from_store < store.free_delivery_within_radius && store.is_store_pay_delivery_fees == true) {
								is_store_pay_delivery_fees = true;
								user_pay_payment = (order_price + +order_payment.tip_amount) - order_payment.promo_payment;
							}
						}

						var user_pay_payment_difference = user_pay_payment - order_payment.user_pay_payment;
						User.findOne({_id: order_payment.user_id}).then((user)=>{
							if(!order_payment.is_payment_mode_cash || order_payment.is_paid_from_wallet)
							{
                               
    								if (user_pay_payment_difference>0) {
    									order_payment.wallet_payment = order_payment.wallet_payment + user_pay_payment_difference;
    									var total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.USER, user.unique_id, user._id, user.country_id,
    										user.wallet_currency_code, order_payment.order_currency_code,
    										1, Math.abs(user_pay_payment_difference), user.wallet, WALLET_STATUS_ID.REMOVE_WALLET_AMOUNT, WALLET_COMMENT_ID.ORDER_CHARGED, "ORDER CHARGED");
    									user.wallet = total_wallet_amount;
    								} else if (user_pay_payment_difference<0) {
    									order_payment.wallet_payment = order_payment.wallet_payment + user_pay_payment_difference;
    									var total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.USER, user.unique_id, user._id, user.country_id,
    										user.wallet_currency_code, order_payment.order_currency_code,
    										1, Math.abs(user_pay_payment_difference), user.wallet, WALLET_STATUS_ID.ADD_WALLET_AMOUNT, WALLET_COMMENT_ID.ORDER_CHARGED, "Order Refund");
    									user.wallet = total_wallet_amount;
    								}
    								user.save();
                                
							} else {
								order_payment.cash_payment = order_payment.cash_payment + user_pay_payment_difference;
							}

							order_payment.admin_profit_mode_on_delivery = admin_profit_mode_on_delivery;
							order_payment.admin_profit_value_on_delivery = admin_profit_value_on_delivery;
							order_payment.total_admin_profit_on_delivery = total_admin_profit_on_delivery;
							order_payment.total_provider_income = total_provider_income;
							
							order_payment.total_admin_tax_price = total_admin_tax_price;
							order_payment.total_after_tax_price = total_after_tax_price;
							order_payment.total_surge_price = total_surge_price;
							order_payment.total_delivery_price_after_surge = total_delivery_price_after_surge;
							
							order_payment.service_tax = service_tax;
							order_payment.user_pay_payment = user_pay_payment;
							order_payment.total = total;
							order_payment.save().then(() => {
								response_data({
									success: true,
									order_payment: order_payment
								});
							}, (error) => {
								console.log(error)
								response_data({
									success: false
								});
							});
							
						});
                    });
                            
                } else {
                    response_data.json({
                        success: false
                    });
                }
            }, (error) => {
                console.log(error)
                response_data.json({
                    success: false
                });
            });
        
    });
};