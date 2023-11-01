require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var console = require('../utils/console');

var mongoose = require('mongoose');
var Service = require('mongoose').model('service');
var ZoneValue = require('mongoose').model('zonevalue');
var Cityzone = require('mongoose').model('cityzone');

//add_service_data
// exports.add_service_data = function (request_data, response_data) {
//     utils.check_request_params(request_data.body, [], function (response) {
//         if (response.success) {
//             var request_data_body = request_data.body;
//             Service.find({type_id: request_data_body.type_id, city_id: request_data_body.city_id}, function(error, service_list){
//                 if(service_list.length>0){
//                     request_data_body.is_default = true;
//                 } else {
//                     request_data_body.is_default = false;
//                 }
//                 var service = new Service(request_data_body);
//                 service.save().then(() => {
//                     response_data.json({success: true, message: SERVICE_MESSAGE_CODE.SERVICE_ADD_SUCCESSFULLY});
//                 }, (error) => {
//                     console.log(error)
//                     response_data.json({
//                         success: false,
//                         error_code: ERROR_CODE.SOMETHING_WENT_WRONG
//                     });
//                 });
//             })
            
//         } else {
//             response_data.json(response);
//         }
//     });
// };



exports.add_service_data = async function (request_data, response_data) {
    try {
        utils.check_request_params(request_data.body, [], async function (response) {
            if (!response.success) {
                return response_data.json(response);
            }
            var request_data_body = request_data.body;
            console.log(request_data_body.type_id)
            let service_detail = await Service.findOne({ type_id: request_data_body.type_id, delivery_type: request_data_body.delivery_type, city_id: request_data_body.city_id, vehicle_id: request_data_body.vehicle_id })
            if (service_detail) {
                console.log(error)
                return response_data.json({
                    success: false,
                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                });
            }
            let isDefaultService = await Service.find({ type_id: request_data_body.type_id, city_id: request_data_body.city_id })
            isDefaultService.length > 0 ? request_data_body.is_default = true : request_data_body.is_default = false;
            var service = new Service(request_data_body);
            // if (service.service_taxes.length > 0) {
            //     service.service_taxes.forEach(tax => {
            //         service.service_tax = service.service_tax + tax
            //     })
            // }
            let addedService = await service.save()
            if (!addedService) {
                console.log(error)
                return response_data.json({
                    success: false,
                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                });
            }
            return response_data.json({ success: true, message: SERVICE_MESSAGE_CODE.SERVICE_ADD_SUCCESSFULLY });

        });
    } catch (e) {
        console.log(e)
        return response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    }
};





exports.select_default_service = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            Service.findOneAndUpdate({_id: request_data_body.service_id}, {is_default: request_data_body.is_default}, function(error, service_data){
                Service.update({type_id: request_data_body.type_id, delivery_type: service_data.delivery_type, city_id: request_data_body.city_id, _id: {$ne: request_data_body.service_id}}, {is_default: false},{multi: true}, function(error, service_list){
                    response_data.json({success: true});
                })
            });
        } else {
            response_data.json(response);
        }
    });
};

// service_list
exports.service_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var country_query = {
                $lookup:
                    {
                        from: "countries",
                        localField: "country_id",
                        foreignField: "_id",
                        as: "country_details"
                    }
            };
            var array_to_json1 = {$unwind: "$country_details"};

            var city_query = {
                $lookup:
                    {
                        from: "cities",
                        localField: "city_id",
                        foreignField: "_id",
                        as: "city_details"
                    }
            };
            var array_to_json2 = {$unwind: "$city_details"};

            var delivery_type_query = {
                $lookup:
                    {
                        from: "delivery_types",
                        localField: "delivery_type_id",
                        foreignField: "_id",
                        as: "delivery_type_details"
                    }
            };
            var delivery_type_unwind = {$unwind: "$delivery_type_details"};

            var vehicle_query = {
                $lookup:
                    {
                        from: "vehicles",
                        localField: "vehicle_id",
                        foreignField: "_id",
                        as: "vehicle_detail"
                    }
            };
            var vehicle_array_to_json = {$unwind: "$vehicle_detail"};

            var service_query = {
                $lookup:
                    {
                        from: "services",
                        localField: "type_id",
                        foreignField: "_id",
                        as: "service_detail"
                    }
            };
            var service_array_to_json = {$unwind: "$vehicle_detail"};

            var number_of_rec = SEARCH_SORT.NO_OF_RECORD_PER_PAGE;
            var page = request_data_body.page;
            var sort_field = request_data_body.sort_field;
            var sort_service = request_data_body.sort_service;
            var search_field = request_data_body.search_field;
            var search_value = request_data_body.search_value;
            search_value = search_value.replace(/^\s+|\s+$/g, '');
            search_value = search_value.replace(/ +(?= )/g, '');

            if (search_field === "country_details.country_name") {
                var query1 = {};
                var query2 = {};
                var query3 = {};
                var query4 = {};
                var query5 = {};
                var query6 = {};

                var full_name = search_value.split(' ');
                if (typeof full_name[0] === 'undefined' || typeof full_name[1] === 'undefined') {

                    query1[search_field] = {$regex: new RegExp(search_value, 'i')};
                    query2['country_details.country_name'] = {$regex: new RegExp(search_value, 'i')};
                    var search = {"$match": {$or: [query1, query2]}};
                } else {

                    query1[search_field] = {$regex: new RegExp(search_value, 'i')};
                    query2['country_details.country_name'] = {$regex: new RegExp(search_value, 'i')};
                    query3[search_field] = {$regex: new RegExp(full_name[0], 'i')};
                    query4['country_details.country_name'] = {$regex: new RegExp(full_name[0], 'i')};
                    query5[search_field] = {$regex: new RegExp(full_name[1], 'i')};
                    query6['country_details.country_name'] = {$regex: new RegExp(full_name[1], 'i')};
                    var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
                }
            } else if (search_field === "city_details.city_name") {
                var query1 = {};
                var query2 = {};
                var query3 = {};
                var query4 = {};
                var query5 = {};
                var query6 = {};
                var full_name = search_value.split(' ');
                if (typeof full_name[0] === 'undefined' || typeof full_name[1] === 'undefined') {

                    query1[search_field] = {$regex: new RegExp(search_value, 'i')};
                    query2['city_details.city_name'] = {$regex: new RegExp(search_value, 'i')};
                    var search = {"$match": {$or: [query1, query2]}};
                } else {

                    query1[search_field] = {$regex: new RegExp(search_value, 'i')};
                    query2['city_details.city_name'] = {$regex: new RegExp(search_value, 'i')};
                    query3[search_field] = {$regex: new RegExp(full_name[0], 'i')};
                    query4['city_details.city_name'] = {$regex: new RegExp(full_name[0], 'i')};
                    query5[search_field] = {$regex: new RegExp(full_name[1], 'i')};
                    query6['city_details.city_name'] = {$regex: new RegExp(full_name[1], 'i')};
                    var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
                }
            } else {
                var query = {};
                query[search_field] = {$regex: new RegExp(search_value, 'i')};
                var search = {"$match": query};
            }

            var sort = {"$sort": {}};
            sort["$sort"][sort_field] = parseInt(sort_service);
            var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;

            var type_query = {$match: {type_id: null}}
            if(request_data_body.type_id){
                type_query = {$match: {type_id: mongoose.Types.ObjectId(request_data_body.type_id)}};
            }
            var condition1 = {$match: {}};

            if (request_data_body.store_ids) {
                var store_ids =[];
                request_data_body.store_ids.forEach(function(store_id){
                    store_ids.push(mongoose.Types.ObjectId(store_id));
                })
                var type_query = {$match: {'type_id':{$in:store_ids}}};
            }

            Service.aggregate([country_query, city_query, type_query, vehicle_query, vehicle_array_to_json, service_query, service_array_to_json, array_to_json1, array_to_json2, search, count]).then((service) => {

                if (service.length == 0) {
                    response_data.json({
                        success: false,
                        error_code: SERVICE_ERROR_CODE.SERVICE_DATA_NOT_FOUND,
                        pages: 0
                    });
                } else {

                    var pages = Math.ceil(service[0].total / number_of_rec);
                    // Service.aggregate([country_query, city_query, type_query, array_to_json1, vehicle_query, vehicle_array_to_json, service_query, service_array_to_json, array_to_json2, sort, search, skip, limit]).then((service) => {
                        Service.aggregate([country_query, city_query, type_query, array_to_json1, vehicle_query, vehicle_array_to_json, service_query, service_array_to_json, array_to_json2, sort, search]).then((service) => {
                        if (service.length == 0) {
                            response_data.json({success: false, error_code: SERVICE_ERROR_CODE.SERVICE_DATA_NOT_FOUND});
                        } else {
                            response_data.json({
                                success: true,
                                message: SERVICE_MESSAGE_CODE.SERVICE_LIST_SUCCESSFULLY, pages: pages, service: service
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


// update service
exports.update_service = async function (request_data, response_data) {
    try {
        utils.check_request_params(request_data.body, [{ name: 'service_id', type: 'string' }], async function (response) {
            if (!response.success) {
                return response_data.json(response);
            }
            let request_data_body = request_data.body;
            if(!request_data_body.is_default){
                delete request_data_body.is_default
            }
            let service_id = request_data_body.service_id;
            let service = await Service.findOneAndUpdate({ _id: service_id }, request_data_body, { new: true })
            if (!service) {
                return response_data.json({ success: false, error_code: SERVICE_ERROR_CODE.UPDATE_FAILED });
            }
            console.log(service.delivery_type)
            if(!request_data_body.is_default){
                return response_data.json({ success: true, message: SERVICE_MESSAGE_CODE.UPDATE_SUCCESSFULLY });
            }
            let updateAllServices = await Service.updateMany({_id: {$ne: service_id}, is_default: true, delivery_type: service.delivery_type}, {$set: {is_default: false}})
            if(!updateAllServices){
                return response_data.json({success: false, error_code: ERROR_CODE.SOMETHING_WENT_WRONG})
            }

            return response_data.json({ success: true, message: SERVICE_MESSAGE_CODE.UPDATE_SUCCESSFULLY });
        });
    } catch (e) {
        return response_data.json({success: false, error_code: ERROR_CODE.SOMETHING_WENT_WRONG})
    }
};

exports.get_zone_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'city_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var city_id = request_data_body.city_id;
            Cityzone.find({city_id: city_id}).then((city_zone) => {
                    response_data.json({
                        success: true,
                        message: PRODUCT_MESSAGE_CODE.PRODUCT_LIST_SUCCESSFULLY,
                        city_zone: city_zone
                    });

            }, (error) => {
                console.log(error)
                response_data.json({
                    success: false,
                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                });
            })
        } else {
            response_data.json(response);
        }
    });
}

exports.get_service_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'service_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var service_condition = {"$match": {'_id': {$eq: mongoose.Types.ObjectId(request_data_body.service_id)}}};
            var country_query = {
                $lookup:
                    {
                        from: "countries",
                        localField: "country_id",
                        foreignField: "_id",
                        as: "country_details"
                    }
            };
            var array_to_json1 = {$unwind: "$country_details"};

            var city_query = {
                $lookup:
                    {
                        from: "cities",
                        localField: "city_id",
                        foreignField: "_id",
                        as: "city_details"
                    }
            };
            var array_to_json2 = {$unwind: "$city_details"};

            var vehicle_query = {
                $lookup:
                    {
                        from: "vehicles",
                        localField: "vehicle_id",
                        foreignField: "_id",
                        as: "vehicle_detail"
                    }
            };
            var vehicle_array_to_json = {$unwind: "$vehicle_detail"};

            Service.aggregate([service_condition, country_query, city_query, array_to_json1, array_to_json2, vehicle_query, vehicle_array_to_json]).then((service) => {
                if (service.length == 0) {
                    response_data.json({success: false, error_code: SERVICE_ERROR_CODE.SERVICE_DATA_NOT_FOUND});
                } else {
                    Cityzone.find({city_id: service[0].city_id}, function (error, city_zone) {

                        var query1 = {$match: {'city_id': {$eq: service[0].city_id}}};
                        var vehicle_query = {$match: {'vehicle_id': {$eq: service[0].vehicle_id}}};
                        var delivery_type_query = {$match: {'delivery_type': {$eq: service[0].delivery_type}}};
                        var type_query = {$match: {'type_id': {$eq: null}}};

                        if(request_data_body.type_id){
                            type_query = {$match: {'type_id': mongoose.Types.ObjectId(request_data_body.type_id)}};
                        }

                        var lookup2 = {
                            $lookup:
                                {
                                    from: "cityzones",
                                    localField: "from_zone_id",
                                    foreignField: "_id",
                                    as: "from_zone_detail"
                                }
                        };
                        var unwind2 = {$unwind: "$from_zone_detail"};
                        var lookup3 = {
                            $lookup:
                                {
                                    from: "cityzones",
                                    localField: "to_zone_id",
                                    foreignField: "_id",
                                    as: "to_zone_detail"
                                }
                        };
                        var unwind3 = {$unwind: "$to_zone_detail"};
                        ZoneValue.aggregate([query1, vehicle_query, delivery_type_query, type_query, lookup2, unwind2, lookup3, unwind3]).then((zonevalue) => {

                            response_data.json({
                                success: true,
                                message: PRODUCT_MESSAGE_CODE.PRODUCT_LIST_SUCCESSFULLY,
                                service: service[0], city_zone: city_zone, zone_price: zonevalue
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
                    })
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

//add_zone_price
exports.add_zone_price = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'city_id', type: 'string'}, {name: 'from_zone_id', type: 'string'}, {name: 'to_zone_id', type: 'string'}, {name: 'price'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var from_zone_id = request_data_body.from_zone_id;
            var to_zone_id = request_data_body.to_zone_id;
            if(!request_data_body.type_id){
                request_data_body.type_id = null;
            }

            // ZoneValue.findOne({
            //     $or: [{from_zone_id: from_zone_id, to_zone_id: to_zone_id}, {
            //         from_zone_id: to_zone_id,
            //         to_zone_id: from_zone_id
            //     }], vehicle_id: request_data_body.vehicle_id , delivery_type: request_data_body.delivery_type , type_id: request_data_body.type_id
            // })

            ZoneValue.findOne({from_zone_id: from_zone_id, to_zone_id: to_zone_id
                , vehicle_id: request_data_body.vehicle_id , delivery_type: request_data_body.delivery_type , type_id: request_data_body.type_id
            }).then((zonevalue) => {
                if (zonevalue) {
                    response_data.json({success: false});
                } else {


                    var zone_value = new ZoneValue({
                        city_id: request_data_body.city_id,
                        vehicle_id: request_data_body.vehicle_id,
                        delivery_type: request_data_body.delivery_type,
                        from_zone_id: request_data_body.from_zone_id,
                        to_zone_id: request_data_body.to_zone_id,
                        price: request_data_body.price,
                        type_id: request_data_body.type_id
                    });

                    zone_value.save().then(() => {
                        response_data.json({success: true, zone_value: zone_value});
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

//update_zone_price
exports.update_zone_price = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            ZoneValue.findOneAndUpdate({_id: request_data_body._id}, request_data_body).then((zone_value) => {

                response_data.json({success: true});
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

exports.get_service_list_by_city = function(request_data, response_data){
        utils.check_request_params(request_data.body, [{name: 'city_id', type: 'string'}], function(response) {
            if(response.success) {
                var request_data_body = request_data.body
                Service.aggregate([
                    {
                        $match: {
                            city_id: mongoose.Types.ObjectId(request_data_body.city_id)
                        }
                    }
                ]).then(service => {
                    console.log(service)
                    if(service.length > 0){
                        response_data.json({
                            success: true,
                            service
                        })
                    } else {
                        response_data.json({
                            success: false
                        })
                    }
                })
            } else {
                response_data.json({
                    success: false,
                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                })
            }
        })
}