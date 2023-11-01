require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
var console = require('../../utils/console');

var utils = require('../../utils/utils');
var Store = require('mongoose').model('store');
var Order = require('mongoose').model('order');
var Provider = require('mongoose').model('provider');
var mongoose = require('mongoose');
var Setting = require('mongoose').model('setting');
var Request = require('mongoose').model('request');
var Country = require('mongoose').model('country');
var City = require('mongoose').model('city');
var Service = require('mongoose').model('service');
// store get order_list for delivery
exports.get_store_providers = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            City.findOne({_id: response.store.city_id}).then((city) => {
                var provider_query = {};
                var distance = setting_detail.default_search_radius / UNIT.DEGREE_TO_KM;
                    provider_query = {
                        location: {$near:  response.store.location, $maxDistance: distance},
                        //is_online: true,
                        is_approved: true,
                        //is_active_for_job: true,
                        city_id: response.store.city_id
                    }

                if(setting_detail.is_upload_provider_documents){
                    provider_query['is_document_uploaded'] = true;
                }
                if(response.store.is_store_can_add_provider){
                    provider_query['provider_type_id'] = response.store._id;
                }
                
                Provider.find(provider_query).exec(function (error, providers) {
                    response_data.json({
                        success: true,
                        is_check_provider_wallet_amount_for_received_cash_request: city.is_check_provider_wallet_amount_for_received_cash_request,
                        provider_min_wallet_amount_for_received_cash_request: city.provider_min_wallet_amount_for_received_cash_request,
                        providers: providers
                    });
                });
            });
        } else {
            response_data.json(response);
        }
    });
}
exports.order_list_for_delivery = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
			var store_detail = response.store;
			                       
                        var orders_array_unwind = {$unwind: "$orders"};

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


                         var order_condition = {$match: {
                                $and: [
                                    {'order_detail.order_status': {$ne: ORDER_STATE.STORE_REJECTED}},
                                    {'order_detail.order_status': {$ne: ORDER_STATE.STORE_CANCELLED}},
                                    {'order_detail.order_status': {$ne: ORDER_STATE.CANCELED_BY_USER}},
                                    {'order_detail.order_status': {$ne: ORDER_STATE.ORDER_COMPLETED}},
                                ]
                            }
                        }

                        var store_id_condition = {"$match": {'order_detail.store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};

                        var sort = {"$sort": {}};
                        sort["$sort"]['unique_id'] = parseInt(-1);

                        var delivery_status_condition = {"$match": {'delivery_status': {$gte: ORDER_STATE.WAITING_FOR_DELIVERY_MAN}}};
                        var delivery_status_manage_id_condition = {"$match": {'delivery_status_manage_id': {$ne: ORDER_STATUS_ID.COMPLETED}}};
                        var project = {$project: {destination_addresses: "$destination_addresses",
                                            delivery_status: "$delivery_status",
                                            provider_type_id: "$provider_type_id",
                                            is_payment_mode_cash: "$order_detail.is_payment_mode_cash",
                                            total: "$order_detail.total",
                                            order_id: "$order_detail._id",
                                            order_unique_id: "$order_detail.unique_id",
                                            user_detail: "$order_detail.user_detail"
                                        }
                                    }
                        Request.aggregate([delivery_status_condition, delivery_status_manage_id_condition,orders_array_unwind, order_query,store_id_condition, order_condition,array_to_json_order_query, project,sort]).then((requests) => {

                            if (requests.length == 0) {
                                response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                            } else
                            {
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
                                var group = {$group: {
                                        _id: null,
                                        vehicles: {$push: {
                                                $cond: {
                                                    if: { $eq: [ "$admin_type", ADMIN_DATA_ID.STORE ] },
                                                    then: '$vehicle_detail' ,
                                                    else: null,
                                                }
                                            }},
                                        admin_vehicles: {$push: {
                                                $cond: {
                                                    if: { $eq: [ "$admin_type", ADMIN_DATA_ID.ADMIN ] },
                                                    then: '$vehicle_detail' ,
                                                    else: null,
                                                }
                                            }},
                                    }
                                }
                                var condition = {$match: {'city_id': {$eq: store_detail.city_id}}};
                                var type_condition = {$match: {$or: [{'type_id': {$eq: store_detail._id}},{'type_id': {$eq: null}}]}};
                                var vehicle_condition = {$match: {'vehicle_detail.is_business': {$eq: true}}};
                                var delivery_type_query = {$match: {delivery_type: {$eq: 1}}};
                            var condition1 = {$match: {'is_business': {$eq: true}}};

                                Service.aggregate([condition, condition1, type_condition, delivery_type_query, lookup, unwind, vehicle_condition, group]).then((services) => {
                                    if (services.length > 0) {
                                        services[0].admin_vehicles = services[0].admin_vehicles.filter(v=>v!=null);
                                        services[0].vehicles = services[0].vehicles.filter(v=>v!=null);
                                        response_data.json({success: true,
                                            message: ORDER_MESSAGE_CODE.ORDER_LIST_FOR_DELIVERY_SUCCESSFULLY,
                                            requests: requests, 
                                            admin_vehicles: services[0].admin_vehicles, 
                                            vehicles: services[0].vehicles
                                        });
                                    } else {
                                        response_data.json({success: true,
                                            message: ORDER_MESSAGE_CODE.ORDER_LIST_FOR_DELIVERY_SUCCESSFULLY,
                                            requests: requests, admin_vehicles: [], vehicles: []
                                        });

                                    }
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

exports.get_order_list = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store_detail = response.store;
                        var user_query = {
                            $lookup:
                            {
                                from: "users",
                                localField: "user_id",
                                foreignField: "_id",
                                as: "user_detail"
                            }
                        };
                        var array_to_json1 = {$unwind: "$user_detail"};
                        var cart_query = {
                            $lookup:
                                {
                                    from: "carts",
                                    localField: "cart_id",
                                    foreignField: "_id",
                                    as: "cart_detail"
                                }
                        };
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
                        var array_to_json2 = {$unwind: "$cart_detail"};
                        var condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
                        var condition1 = {"$match": {'request_status': {$eq: ORDER_STATE.NO_DELIVERY_MAN_FOUND}}};
                        var store_id_condition = {"$match": {'order_detail.store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
                        Request.aggregate([order_query,  array_to_json_order_query, store_id_condition, condition1, user_query, array_to_json1]).then((no_deliveryman_orders) => {
                            var condition1 = {"$match": {'order_status': {$eq: ORDER_STATE.WAITING_FOR_ACCEPT_STORE}}};
                            Order.aggregate([condition, condition1, cart_query, array_to_json2, user_query, array_to_json1]).then((new_order_list) => {

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
                                var group = {$group: {
                                        _id: null,
                                        vehicles: {$push: {
                                                $cond: {
                                                    if: { $and: [{$eq: [ "$admin_type", ADMIN_DATA_ID.STORE ] }, {$eq: [ "$vehicle_detail.is_business", true ] }] },
                                                    then: '$vehicle_detail' ,
                                                    else: null,
                                                }
                                            }},
                                        admin_vehicles: {$push: {
                                                $cond: {
                                                    if: { $and: [{$eq: [ "$admin_type", ADMIN_DATA_ID.STORE ] }, {$eq: [ "$vehicle_detail.is_business", true ] }] },
                                                    then: '$vehicle_detail' ,
                                                    else: null,
                                                }
                                            }},
                                    }
                                }
                                var delivery_type_query = {$match: {delivery_type: {$eq: 1}}};
                                var vehicle_condition = {$match: {'vehicle_detail.is_business': {$eq: true}}};

                                var condition = {$match: {'city_id': {$eq: store_detail.city_id}}};
                                var condition1 = {$match: {'is_business': {$eq: true}}};
                                Service.aggregate([condition, condition1, delivery_type_query, lookup, unwind, vehicle_condition, group]).then((services) => {
                                    if(services.length>0){
                                        services[0].admin_vehicles = services[0].admin_vehicles.filter(v => v != null);
                                        services[0].vehicles = services[0].vehicles.filter(v => v != null);
                                        response_data.json({
                                            success: true,
                                            new_order_list: new_order_list,
                                            no_deliveryman_orders: no_deliveryman_orders,
                                            vehicles: services[0].vehicles, admin_vehicles: services[0].admin_vehicles
                                        });
                                    } else {
                                        response_data.json({
                                            success: true,
                                            new_order_list: new_order_list,
                                            no_deliveryman_orders: no_deliveryman_orders,
                                            vehicles: [], admin_vehicles: []
                                        });
                                    }
                                }, (error) => {
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



//store_notify_new_order
exports.store_notify_new_order = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store_detail = response.store;
                        
                            var user_query = {
                                $lookup:
                                        {
                                            from: "users",
                                            localField: "user_id",
                                            foreignField: "_id",
                                            as: "user_detail"
                                        }
                            };
                            var array_to_json1 = {$unwind: "$user_detail"};
                            var cart_query = {
                                $lookup:
                                    {
                                        from: "carts",
                                        localField: "cart_id",
                                        foreignField: "_id",
                                        as: "cart_detail"
                                    }
                            };
                            var array_to_json2 = {$unwind: "$cart_detail"};

                            var condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
                            var condition2 = {"$match": {'store_notify': {$eq: 0}}};
                            var condition1 = {"$match": {'order_status': {$eq: ORDER_STATE.NO_DELIVERY_MAN_FOUND}}};

                            Order.aggregate([condition, condition1, condition2, user_query, array_to_json1, cart_query, array_to_json2]).then((no_deliveryman_orders) => {

                                var condition1 = {"$match": {'order_status': {$eq: ORDER_STATE.WAITING_FOR_ACCEPT_STORE}}};
                                Order.aggregate([condition, condition1, condition2, user_query, array_to_json1, cart_query, array_to_json2]).then((orders) => {
                                    if (orders.length == 0) {

                                        if (no_deliveryman_orders.length == 0) {
                                            response_data.json({
                                                success: false,
                                                store_detail: store_detail,
                                                error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND,
                                                setting_detail: setting_detail
                                            });
                                        } else {
                                            Order.findOneAndUpdate({_id: no_deliveryman_orders[0]._id}, {store_notify: 1}).then((order) => {
                                                response_data.json({
                                                    success: false,
                                                    store_detail: store_detail,
                                                    error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND,
                                                    setting_detail: setting_detail,
                                                    no_deliveryman_orders: no_deliveryman_orders[0]
                                                });
                                            })
                                        }
                                    } else {
                                        Order.update({
                                            store_notify: 0,
                                            store_id: request_data_body.store_id,
                                            _id: orders[0]._id
                                        }, {store_notify: 1}, {multi: true}).then((response) => {

                                            if (no_deliveryman_orders.length == 0) {
                                                response_data.json({
                                                    success: true,
                                                    store_detail: store_detail,
                                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_FOR_DELIVERY_SUCCESSFULLY,
                                                    order: orders[0],
                                                    setting_detail: setting_detail
                                                });
                                            } else {
                                                response_data.json({
                                                    success: true,
                                                    store_detail: store_detail,
                                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_FOR_DELIVERY_SUCCESSFULLY,
                                                    order: orders[0],
                                                    setting_detail: setting_detail,
                                                    no_deliveryman_orders: no_deliveryman_orders[0]
                                                });
                                            }
                                        });

                                    }
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

exports.get_dispatcher_order_list = function (request_data, response_data) {
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
                        var array_to_json_request_query = {$unwind: {
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
                        var array_to_json_cart_query = {$unwind: "$cart_detail"};

                        var order_payment_query = {
                            $lookup:
                                    {
                                        from: "order_payments",
                                        localField: "order_payment_id",
                                        foreignField: "_id",
                                        as: "order_payments_detail"
                                    }
                        };
                        var array_to_json_order_payment_query = {$unwind: "$order_payments_detail"};

                        var order_condition = {$match: {'order_status_id': {$eq: ORDER_STATUS_ID.RUNNING}}};


                        var store_id_condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};

                        var number_of_rec = SEARCH_SORT.NO_OF_RECORD_PER_PAGE;
                       
                        var request_status = request_data_body.request_status;
                     
                        var sort = {"$sort": {}};
                        sort["$sort"]['unique_id'] = parseInt(-1);
                        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
                        
                        var delivery_status_condition = {"$match": {$or: [{'request_detail.delivery_status': {$gte: ORDER_STATE.WAITING_FOR_DELIVERY_MAN}},{'request_id':null}]}};
                        var delivery_status_manage_id_condition = {"$match": {$or: [{'request_detail.delivery_status_manage_id': {$ne: ORDER_STATUS_ID.COMPLETED}},{'request_id':null}]}};
                        var project = {$project: {user_detail: "$user_detail",
                                            provider_detail: "$request_detail.provider_detail",
                                            request_id: "$request_id",
                                            destination_addresses: "$cart_detail.destination_addresses",
                                            delivery_status: "$request_detail.delivery_status",
                                            timezone: "$timezone",
                                            created_at: "$created_at",
                                            unique_id: "$unique_id",
                                            store_id: "$store_id",
                                            order_id: "$_id",
                                            total: "$total",
                                            is_payment_mode_cash: "$is_payment_mode_cash",
                                            schedule_order_start_at: "$schedule_order_start_at",
                                            schedule_order_start_at2: "$schedule_order_start_at2",
                                            confirmation_code_for_pick_up_delivery:"$confirmation_code_for_pick_up_delivery",
                                            delivery_price_used_type:"$order_payments_detail.delivery_price_used_type"
                                        }
                                    }
                        
                                Order.aggregate([order_condition,cart_query,array_to_json_cart_query,request_query,order_payment_query,array_to_json_request_query,array_to_json_order_payment_query,delivery_status_manage_id_condition,sort, store_id_condition, project]).then((requests) => {
                                    if (requests.length === 0) {
                                        response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                                    } else
                                    {
                                        response_data.json({success: true,
                                            message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
                                            requests: requests});
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


//delivery_list_search_sort
exports.delivery_list_search_sort = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'page'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store_detail = response.store;
                        var orders_array_unwind = {$unwind: "$orders"};
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


                        var store_id_condition = {"$match": {'order_detail.store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};

                        var number_of_rec = SEARCH_SORT.NO_OF_RECORD_PER_PAGE;
                        var page = request_data_body.page;

                        var request_status = request_data_body.request_status;
                        var search_field = request_data_body.search_field;
                        var search_value = request_data_body.search_value;
                        search_value = search_value.replace(/^\s+|\s+$/g, '');
                        search_value = search_value.replace(/ +(?= )/g, '');
                        var query1 = {};
                        if (search_value !== ""){
                            if (search_field === "user_detail.name")
                            {
                                query1['order_detail.user_detail.name'] = {$regex: new RegExp(search_value, 'i')};
                                var search = {"$match": {$or: [query1]}};
                            } else if (search_field === "provider_detail.name")
                            {
                                query1['order_detail.provider_detail.name'] = {$regex: new RegExp(search_value, 'i')};
                                var search = {"$match": {$or: [query1]}};
                            } else
                            {
                                var query = {};
                                query[search_field] = {$regex: new RegExp(search_value, 'i')};
                                var search = {"$match": query};
                            }
                        }else{
                            var search = {"$match": {}};
                        }
                        var sort = {"$sort": {}};
                        sort["$sort"]['order_detail.unque_id'] = parseInt(-1);
                        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
                        var skip = {};
                        skip["$skip"] = (page * number_of_rec) - number_of_rec;
                        var limit = {};
                        limit["$limit"] = number_of_rec;
                        var request_status_condition = {$match: {}};
                        if(request_status != ''){
                            request_status_condition = {$match: {delivery_status: Number(request_status)}}
                        }

                        var delivery_status_condition = {"$match": {'delivery_status': {$gte: ORDER_STATE.WAITING_FOR_DELIVERY_MAN}}};
                        var delivery_status_manage_id_condition = {"$match": {'delivery_status_manage_id': {$ne: ORDER_STATUS_ID.COMPLETED}}};
                        var project = {$project: {user_detail: "$order_detail.user_detail",
                                            provider_detail: "$provider_detail",
                                            delivery_status: "$delivery_status",
                                            timezone: "$timezone",
                                            created_at: "$created_at",
                                            unique_id: "$order_detail.unique_id",
                                            order_id: "$order_detail._id",
                                            total: "$total",
                                            is_payment_mode_cash: "$is_payment_mode_cash",
                                            schedule_order_start_at: "$schedule_order_start_at",
                                            schedule_order_start_at2: "$schedule_order_start_at2"
                                        }
                                    }
                        
                                Request.aggregate([delivery_status_condition, request_status_condition, delivery_status_manage_id_condition,sort,orders_array_unwind, order_query,array_to_json_order_query, store_id_condition, order_condition, search,project, skip, limit]).then((requests) => {
                                    if (requests.length === 0) {
                                        response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                                    } else
                                    {
                                        response_data.json({success: true,
                                            message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
                                            requests: requests});
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


//history
exports.history = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'start_date'}, {name: 'end_date'}, {name: 'page'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store_detail = response.store;
                        Country.findOne({_id: store_detail.country_id}).then((country_detail) => {
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

                            var number_of_rec = SEARCH_SORT.NO_OF_RECORD_PER_PAGE;
                            var page = request_data_body.page;

                            var order_status_id = request_data_body.order_status_id;
                            var search_field = request_data_body.search_field;
                            var search_value = request_data_body.search_value;
                            search_value = search_value.replace(/^\s+|\s+$/g, '');
                            search_value = search_value.replace(/ +(?= )/g, '');
                            var query1 = {};
                            if (search_value !== ""){
                                if (search_field === "user_detail.name") {
                                    query1['user_detail.name'] = {$regex: new RegExp(search_value, 'i')};
                                    var search = {"$match": {$or: [query1]}};
                                } else if (search_field === "provider_detail.name") {
                                    query1['provider_detail.name'] = {$regex: new RegExp(search_value, 'i')};
                                    var search = {"$match": {$or: [query1]}};
                                } else {                                    
                                    query1[search_field] = {$regex: new RegExp(search_value, 'i')};
                                    var search = {"$match": query1};
                                }
                            }else{
                                var search = {"$match": {}};
                            }
                            var filter = {"$match": {"completed_at": {$gte: start_date, $lt: end_date}}};
                            var sort = {"$sort": {}};
                            sort["$sort"]['unique_id'] = parseInt(-1);
                            var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
                            var skip = {};
                            skip["$skip"] = (page * number_of_rec) - number_of_rec;
                            var limit = {};
                            limit["$limit"] = number_of_rec;
                            var condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
                            var condition1 = {"$match": {$and:[{'order_status_id': {$ne: ORDER_STATUS_ID.RUNNING}}, {'order_status_id': {$ne: ORDER_STATUS_ID.IDEAL}}]}};

                            var order_status_id_condition = {$match:{}}
                            if(order_status_id != ''){
                                order_status_id_condition = {$match:{order_status_id: {$eq: Number(order_status_id)}}}
                            }

                            var payment_status_condition = {$match: {}}
                            if (request_data_body.payment_status != 'all') {
                                if (request_data_body.payment_status == 'true') {
                                    payment_status_condition = {"$match": {'is_payment_mode_cash': {$eq: true}}};
                                } else {
                                    payment_status_condition = {"$match": {'is_payment_mode_cash': {$eq: false}}};
                                }
                            }

                            var pickup_type = request_data_body.pickup_type;
                            var pickup_type_condition = {$match: {}}
                            if (pickup_type != 'both') {
                                if (request_data_body.pickup_type == 'true') {
                                    pickup_type_condition = {"$match": {'is_user_pick_up_order': {$eq: true}}};
                                } else {
                                    pickup_type_condition = {"$match": {'is_user_pick_up_order': {$eq: false}}};
                                }
                            }

                            var order_type = request_data_body.order_type;
                            var order_type_condition = {$match: {}}
                            if (order_type != 'both') {
                                if (request_data_body.order_type == 'true') {
                                    order_type_condition = {"$match": {'is_schedule_order': {$eq: true}}};
                                } else {
                                    order_type_condition = {"$match": {'is_schedule_order': {$eq: false}}};
                                }
                            }

                            var created_by = request_data_body.created_by;
                            var created_by_condition = {$match: {}}
                            if (created_by != 'both') {
                                created_by_condition = {"$match": {'order_type': {$eq: Number(created_by)}}};
                            }
                            var project = {$project: {user_detail: "$user_detail",
                                            unique_id: "$unique_id",
                                            provider_detail: "$provider_detail",
                                            completed_at: "$completed_at",
                                            timezone: "$timezone",
                                            total: "$total",
                                            order_status: "$order_status"
                                        }
                                    }
                            
                                    Order.aggregate([condition, condition1,order_type_condition, created_by_condition, order_status_id_condition,pickup_type_condition, payment_status_condition, search, filter,project, sort, skip, limit]).then((orders) => {
                                        if (orders.length === 0) {
                                            response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                                        } else {
                                            response_data.json({
                                                success: true,
                                                currency_sign: country_detail.currency_sign,
                                                message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
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
                                
                        });
                    
        } else {
            response_data.json(response);
        }
    });
};

// order_list_search_sort
exports.order_list_search_sort = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {
           
            var request_data_body = request_data.body;
            var store_detail = response.store;
                        Country.findOne({_id: store_detail.country_id}).then((country_detail) => {


                            var number_of_rec = SEARCH_SORT.NO_OF_RECORD_PER_PAGE;
                            var page = request_data_body.page;
                            var order_type = request_data_body.order_type;
                            var pickup_type = request_data_body.pickup_type;
                            var payment_mode = request_data_body.payment_mode;

                            var search_field = request_data_body.search_field;
                            var search_value = request_data_body.search_value;
                            search_value = search_value.replace(/^\s+|\s+$/g, '');
                            search_value = search_value.replace(/ +(?= )/g, '');
                            var query1 = {};
                            if (search_value !== ""){
                                if (search_field === "user_detail.name")
                                {
                                    query1['user_detail.name'] = {$regex: new RegExp(search_value, 'i')};
                                    var search = {"$match": {$or: [query1]}};
                                } else
                                {
                                    var query = {};
                                    query[search_field] = {$regex: new RegExp(search_value, 'i')};
                                    var search = {"$match": query};
                                }
                            }else{
                                var search = {"$match": {}};
                            }
                            var sort = {"$sort": {}};
                            sort["$sort"]['unque_id'] = parseInt(-1);
                            var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
                            var skip = {};
                            skip["$skip"] = (page * number_of_rec) - number_of_rec;
                            var limit = {};
                            limit["$limit"] = number_of_rec;
                            var store_condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
                            var order_status_condition = {$match: {$and: [ {$or: [ {'order_status_id': {$eq: ORDER_STATUS_ID.RUNNING}} , {'order_status_id': {$eq: ORDER_STATUS_ID.IDEAL}} ]} ,{$or: [{'order_status_manage_id': {$ne: ORDER_STATUS_ID.COMPLETED}}, {'request_id': {$eq: null}}]} ]}};


                            var payment_mode_condition = {$match: {}}
                            if(payment_mode != ''){
                                if(payment_mode == 1){
                                    payment_mode_condition = {$match: {'is_payment_mode_cash': {$eq: true}}}
                                } else {
                                    payment_mode_condition = {$match: {'is_payment_mode_cash': {$eq: false}}}
                                }
                            }

                            var pickup_type_condition = {$match: {}}
                            if(pickup_type != ''){
                                if(pickup_type == 1){
                                    pickup_type_condition = {$match: {'is_user_pick_up_order': {$eq: true}}}
                                } else {
                                    pickup_type_condition = {$match: {'is_user_pick_up_order': {$eq: false}}}
                                }
                            }

                            var order_type_condition = {$match: {}}
                            if(order_type != ''){
                                order_type_condition = {$match: {'order_type': {$eq: Number(order_type)}}}
                            }

                            var project = {$project: {order_status: "$order_status",
                                            is_schedule_order: "$is_schedule_order",
                                            order_type: "$order_type",
                                            request_id: "$request_id",
                                            user_id: "$user_id",
                                            order_change: "$order_change",
                                            user_order_change: "$user_order_change",
                                            timezone: "$timezone",
                                            unique_id: "$unique_id",
                                            is_user_pick_up_order: "$is_user_pick_up_order",
                                            total: "$total",
                                            user_detail: "$user_detail",
                                            schedule_order_start_at: "$schedule_order_start_at",
                                            schedule_order_start_at2: "$schedule_order_start_at2",
                                            is_payment_mode_cash: "$is_payment_mode_cash",
                                            is_paid_from_wallet: "$is_paid_from_wallet",
                                            delivery_type: "$delivery_type",
                                            created_at: "$created_at"
                                        }
                                    }
                                    Order.aggregate([store_condition, order_status_condition,payment_mode_condition, order_type_condition, pickup_type_condition,project, sort, search]).then((orders) => {
                                        if (orders.length === 0) {
                                            response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                                        } else
                                        {
                                            response_data.json({success: true,
                                                message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
                                                is_confirmation_code_required_at_complete_delivery: setting_detail.is_confirmation_code_required_at_complete_delivery,
                                                is_confirmation_code_required_at_pickup_delivery: setting_detail.is_confirmation_code_required_at_pickup_delivery,
                                                currency_sign: country_detail.currency_sign, orders: orders});
                                        }

                                    }, (error) => {
                                        console.log(error)
                                        response_data.json({
                                            success: false,
                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                        });
                                    });
                            //     }
                            // });

                        });
                  
        } else {
            response_data.json(response);
        }
    });
};


// admin get_order_data
exports.get_order_data = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'order_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store_detail = response.store;

                        var store_condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
                        var order_condition = {"$match": {'_id': {$eq: mongoose.Types.ObjectId(request_data_body.order_id)}}};
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
                        var array_to_json_store_detail = {$unwind: "$store_detail"};
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
                        var provider_query = {
                            $lookup:
                                    {
                                        from: "providers",
                                        localField: "current_provider",
                                        foreignField: "_id",
                                        as: "provider_detail"
                                    }
                        };

                        Order.aggregate([order_condition, store_condition, user_query, order_payment_query, store_query, provider_query, array_to_json_user_detail, array_to_json_store_detail, array_to_json_order_payment_query

                        ]).then((order) => {

                            if (order.length === 0)
                            {
                                response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});
                            } else
                            {
                                response_data.json({success: true,
                                    message: ORDER_MESSAGE_CODE.GET_ORDER_DATA_SUCCESSFULLY,
                                    order: order[0]
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


//export_excel_history
exports.export_excel_history = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'start_date'}, {name: 'end_date'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store_detail = response.store;
			
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
                        var array_to_json_user_detail = {$unwind: "$user_detail"};
                        var provider_query = {
                            $lookup:
                                    {
                                        from: "providers",
                                        localField: "provider_id",
                                        foreignField: "_id",
                                        as: "provider_detail"
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

                        var review_query = {
                            $lookup:
                                    {
                                        from: "reviews",
                                        localField: "_id",
                                        foreignField: "order_id",
                                        as: "review_detail"
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

                        if (search_field === "user_detail.first_name")
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
                        } else if (search_field === "provider_detail.first_name")
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
                        var filter = {"$match": {"completed_at": {$gte: start_date, $lt: end_date}}};
                        var sort = {"$sort": {}};
                        sort["$sort"]['unique_id'] = parseInt(-1);
                        var condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
                        var condition1 = {"$match": {'order_status_id': {$ne: ORDER_STATUS_ID.RUNNING}}};

                        Order.aggregate([condition, condition1, user_query, order_payment_query, provider_query, review_query, array_to_json_user_detail, array_to_json_order_payment_query, payment_gateway_query, sort, search, filter]).then((orders) => {
                            
                                response_data.json({
                                    success: true,
                                    message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY,
                                    orders: orders
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


// provider_location_track
exports.provider_location_track = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'request_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store_detail = response.store;
                        Request.findOne({_id: request_data_body.request_id}).then((request_detail) => {

                            Provider.findOne({_id: request_detail.current_provider}).then((provider_detail) => {

                                if (provider_detail)
                                {
                                    response_data.json({
                                        success: true,
                                        message: ORDER_MESSAGE_CODE.ORDER_CANCEL_OR_REJECT_BY_PROVIDER_SUCCESSFULLY,
                                        provider: provider_detail

                                    });
                                } else
                                {
                                    response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND});

                                }
                            }, (error) => {
                                console.log(error)
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
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