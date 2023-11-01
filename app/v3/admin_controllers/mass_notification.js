var MassNotification = require('mongoose').model('mass_notification');
var User = require('mongoose').model('user');
var Store = require('mongoose').model('store');
var Provider = require('mongoose').model('provider');
var mongoose = require('mongoose');
var Schema = mongoose.Types.ObjectId;
var utils = require('../utils/utils');
var console = require('../utils/console');


exports.get_mass_notification_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'page'}], function (response) {
        if (response.success) {

            var country_lookup = {
                $lookup: {
                    from: "countries",
                    localField: "country",
                    foreignField: "_id",
                    as: "country_detail"
                }
            };
            var country_query_unwind = {$unwind: {
                    path: "$country_detail",
                    preserveNullAndEmptyArrays: true
                }
            };
            var city_lookup = {
                $lookup: {
                    from: "cities",
                    localField: "city",
                    foreignField: "_id",
                    as: "city_detail"
                }
            };
            var city_query_unwind = {$unwind: {
                    path: "$city_detail",
                    preserveNullAndEmptyArrays: true
                }
            };
            var request_data_body = request_data.body;
            var page = request_data_body.page;
            var number_of_rec = SEARCH_SORT.NO_OF_RECORD_PER_PAGE;
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;
            var sort = {$sort: { unique_id: -1 }}
            var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
            if(request_data_body.user_type && request_data_body.user_type!=''){
                var user_type_condition = {"$match": {'user_type':Number(request_data_body.user_type)}};
            }else{
                var user_type_condition = {"$match": {}};
            }
            MassNotification.aggregate([user_type_condition,country_lookup, country_query_unwind, city_lookup, city_query_unwind, count]).then((mass_notification_list) => {

                if (mass_notification_list.length == 0) {
                    response_data.json({success: false, pages: 0});
                } else {
                    var pages = Math.ceil(mass_notification_list[0].total / number_of_rec);
                    MassNotification.aggregate([user_type_condition,country_lookup, country_query_unwind, city_lookup, city_query_unwind, sort, skip, limit]).then((mass_notification_list) => {
                        response_data.json({success: true, mass_notification_list: mass_notification_list, pages: pages});
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
            })
        } else {
            response_data.json(response);
        }
    });
};

exports.create_mass_notification = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'country', type: 'string'}, {name: 'message', type: 'string'}, {name: 'city', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            
            var array_android = [];
            var array_ios = [];
            var array = [];
            var array1 = [];

            if (request_data_body.country == 'all') {
                request_data_body.country = null;
            }
            if (request_data_body.city == 'all') {
                request_data_body.city = null;
            }
            if(!request_data_body.delivery)
            {
                request_data_body.delivery = null;
            }

            var mass_notification = new MassNotification({
                user_type: request_data_body.user_type,
                device_type: request_data_body.device_type,
                message: request_data_body.message,
                country: request_data_body.country,
                delivery: request_data_body.delivery,
                city:request_data_body.city
            });

            mass_notification.save(function (error) {
                console.log(error)
                response_data.json({success: true, mass_notification_data: mass_notification})
            });

            var country_query = {"$match": {}};
            if (request_data_body.country != null) {
                country_query = {"$match": {country_id: {$eq: Schema(request_data_body.country)}}}
            }

            var city_query = {"$match": {}};
            if (request_data_body.city != null) {
                city_query = {"$match": {city_id: {$eq: Schema(request_data_body.city)}}}
            }

            var device_type_query = {"$match": {}};
            if (request_data_body.device_type != 'both') {
                    device_type_query = {"$match": {device_type: {$eq: request_data_body.device_type}}}
            }
            var device_token_query = {"$match": {device_token: {$ne: ''}}};
            if (request_data_body.user_type == 7) {
                User.aggregate([country_query,device_type_query,device_token_query,{$project: {a: '$device_token', device_type: '$device_type'}}, {$unwind: '$a'},
                    {$group: {_id: '$device_type', device_token: {$addToSet: '$a'}}}]).then((user_list) => {
                    
                    if (user_list.length == 0) {

                    } else {
                        var split_val = 10;

                        if (user_list[0]._id == 'android') {
                            array_android = user_list[0].device_token
                            
                        } else {
                            array_ios = user_list[0].device_token
                        }


                        if (user_list[1]) {
                            if (user_list[1]._id == 'android') {
                                array_android = user_list[1].device_token
                            } else {
                                array_ios = user_list[1].device_token
                            }
                        }

                        if (array_android.length > 0) {
                            var size = Math.ceil(array_android.length / split_val);
                            for (i = 0; i <= size - 1; i++) {
                                if (i == size - 1)
                                {
                                    array = array_android.slice(i * split_val, array_android.length)
                                    var push_data = {
                                        device_type: 'android',
                                        device_token: array,
                                        type: 7,
                                        code: USER_PUSH_CODE.MASS_NOTIFICATION,
                                        sound_file_name: '',
                                        message: request_data_body.message
                                    }
                                    utils.sendMassNotification(push_data);
                                } else {
                                    array = array_android.slice(i * split_val, i * split_val + split_val)
                                    var push_data = {
                                        device_type: 'android',
                                        device_token: array,
                                        type: 7,
                                        code: USER_PUSH_CODE.MASS_NOTIFICATION,
                                        sound_file_name: '',
                                        message: request_data_body.message
                                    }
                                    utils.sendMassNotification(push_data);
                                }
                            }
                        }

                        if (array_ios.length > 0) {
                            var size = Math.ceil(array_ios.length / split_val);
                            for (i = 0; i <= size - 1; i++) {
                                if (i == size - 1)
                                {
                                    array = array_ios.slice(i * split_val, array_ios.length)
                                    var push_data = {
                                        device_type: 'ios',
                                        device_token: array,
                                        type: 7,
                                        code: USER_PUSH_CODE.MASS_NOTIFICATION,
                                        sound_file_name: '',
                                        message: request_data_body.message
                                    }
                                    utils.sendMassNotification(push_data);
                                } else {
                                    array = array_ios.slice(i * split_val, i * split_val + split_val)
                                    var push_data = {
                                        device_type: 'ios',
                                        device_token: array,
                                        type: 7,
                                        code: USER_PUSH_CODE.MASS_NOTIFICATION,
                                        sound_file_name: '',
                                        message: request_data_body.message
                                    }
                                    utils.sendMassNotification(push_data);
                                }
                            }
                        }
                    }
                }, (error) => {
                    console.log(error)
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                })

            }
            else if (request_data_body.user_type == 2) {
                Store.aggregate([country_query,city_query, device_type_query,device_token_query, {$project: {a: '$device_token', device_type: '$device_type'}}, {$unwind: '$a'},
                    {$group: {_id: '$device_type', device_token: {$addToSet: '$a'}}}]).then((user_list) => {


                    if (user_list.length == 0) {

                    } else {
                        var split_val = 10;
                        if (user_list[0]._id == 'android') {
                            array_android = user_list[0].device_token
                        } else {
                            array_ios = user_list[0].device_token
                        }


                        if (user_list[1]) {
                            if (user_list[1]._id == 'android') {
                                array_android = user_list[1].device_token
                            } else {
                                array_ios = user_list[1].device_token
                            }
                        }

                        if (array_android.length > 0) {
                            var size = Math.ceil(array_android.length / split_val);
                            for (i = 0; i <= size - 1; i++) {
                                if (i == size - 1)
                                {
                                    array = array_android.slice(i * split_val, array_android.length)
                                    var push_data = {
                                        device_type: 'android',
                                        device_token: array,
                                        type: 2,
                                        sound_file_name: '',
                                        message: request_data_body.message
                                    }
                                    utils.sendMassNotification(push_data);
                                } else {
                                    array = array_android.slice(i * split_val, i * split_val + split_val)
                                    var push_data = {
                                        device_type: 'android',
                                        device_token: array,
                                        type: 2,
                                        sound_file_name: '',
                                        message: request_data_body.message
                                    }
                                    utils.sendMassNotification(push_data);
                                }
                            }
                        }

                        if (array_ios.length > 0) {
                            var size = Math.ceil(array_ios.length / split_val);
                            for (i = 0; i <= size - 1; i++) {
                                if (i == size - 1)
                                {
                                    array = array_ios.slice(i * split_val, array_ios.length)
                                    var push_data = {
                                        device_type: 'ios',
                                        device_token: array,
                                        type: 2,
                                        sound_file_name: '',
                                        message: request_data_body.message
                                    }
                                    utils.sendMassNotification(push_data);
                                } else {
                                    array = array_ios.slice(i * split_val, i * split_val + split_val)
                                    var push_data = {
                                        device_type: 'ios',
                                        device_token: array,
                                        type: 2,
                                        sound_file_name: '',
                                        message: request_data_body.message
                                    }
                                    utils.sendMassNotification(push_data);
                                }
                            }
                        }
                    }
                }, (error) => {
                    console.log(error)
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                })

            }
             else if (request_data_body.user_type == 8) {
                var device_token_query = {"$match": {device_token: {$ne: ''}}};
                Provider.aggregate([country_query,city_query, device_type_query, device_token_query, {$project: {a: '$device_token', device_type: '$device_type'}}, {$unwind: '$a'},
                    {$group: {_id: '$device_type', device_token: {$addToSet: '$a'}}}]).then((user_list) => {

                    if (user_list.length == 0) {
                    } else {
                        var split_val = 10;
                        if (user_list[0]._id == 'android') {
                            array_android = user_list[0].device_token
                        } else {
                            array_ios = user_list[0].device_token
                        }

                        if (user_list[1]) {
                            if (user_list[1]._id == 'android') {
                                array_android = user_list[1].device_token
                            } else {
                                array_ios = user_list[1].device_token
                            }
                        }

                        if (array_android.length > 0) {
                            var size = Math.ceil(array_android.length / split_val);
                            for (i = 0; i <= size - 1; i++) {
                                if (i == size - 1)
                                {
                                    array = array_android.slice(i * split_val, array_android.length)
                                    var push_data = {
                                        device_type: 'android',
                                        device_token: array,
                                        type: 8,
                                        sound_file_name: '',
                                        message: request_data_body.message
                                    }
                                    utils.sendMassNotification(push_data);
                                } else {
                                    array = array_android.slice(i * split_val, i * split_val + split_val)
                                    var push_data = {
                                        device_type: 'android',
                                        device_token: array,
                                        type: 8,
                                        sound_file_name: '',
                                        message: request_data_body.message
                                    }
                                    utils.sendMassNotification(push_data);
                                }
                            }
                        }

                        if (array_ios.length > 0) {
                            var size = Math.ceil(array_ios.length / split_val);
                            for (i = 0; i <= size - 1; i++) {
                                if (i == size - 1)
                                {
                                    array = array_ios.slice(i * split_val, array_ios.length)
                                    var push_data = {
                                        device_type: 'ios',
                                        device_token: array,
                                        type: 8,
                                        sound_file_name: '',
                                        message: request_data_body.message
                                    }
                                    utils.sendMassNotification(push_data);
                                } else {
                                    array = array_ios.slice(i * split_val, i * split_val + split_val)
                                    var push_data = {
                                        device_type: 'ios',
                                        device_token: array,
                                        type: 8,
                                        sound_file_name: '',
                                        message: request_data_body.message
                                    }
                                    utils.sendMassNotification(push_data);
                                }
                            }
                        }
                    }
                }, (error) => {
                    console.log(error)
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                })

            }
        } else {
            response_data.json(response);
        }
    });
};
