require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var Promo_code = require('mongoose').model('promo_code');
var Order_payment = require('mongoose').model('order_payment');
var Country = require('mongoose').model('country');
var City = require('mongoose').model('city');
var mongoose = require('mongoose');
var console = require('../utils/console');


//add_promo_code_data
exports.add_promo_code_data = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Promo_code.findOne({ country_id: request_data_body.country_id, promo_code_name: request_data_body.promo_code_name, city_id: request_data_body.city_id }).then((promo_code) => {
                if (!promo_code) {

                    var promo_code_name = request_data_body.promo_code_name.toString().toUpperCase();
                    request_data_body.promo_code_name = promo_code_name;
                    var is_promo_have_date = request_data_body.is_promo_have_date;
                    if (is_promo_have_date == true) {
                        var promo_start_date = request_data_body.promo_start_date;
                        var promo_expire_date = request_data_body.promo_expire_date;

                        if (promo_start_date != undefined && promo_start_date != null) {
                            promo_start_date = request_data_body.promo_start_date.formatted;
                        }
                        if (promo_expire_date != undefined && promo_expire_date != null) {
                            promo_expire_date = request_data_body.promo_expire_date.formatted;
                        }
                        promo_start_date = new Date(promo_start_date);
                        promo_start_date = promo_start_date.setHours(0, 0, 0, 0);
                        promo_start_date = new Date(promo_start_date);
                        promo_expire_date = new Date(promo_expire_date);
                        promo_expire_date = promo_expire_date.setHours(23, 59, 59, 999);
                        promo_expire_date = promo_expire_date.getDate() - 1;
                        promo_expire_date = new Date(promo_expire_date);
                        request_data_body.promo_start_date = promo_start_date;
                        request_data_body.promo_expire_date = promo_expire_date;
                    }

                    // request_data_body.promo_apply_on = JSON.parse(request_data_body.promo_apply_on)
                    request_data_body.store_ids = []
                    if (request_data_body.promo_apply_on) {
                        request_data_body.promo_apply_on = request_data_body.promo_apply_on.toString().split(',')
                        if (!request_data_body.promo_apply_on.length) {
                            request_data_body.promo_apply_on = []
                        }
                    } else {
                        request_data_body.promo_apply_on = []
                    }
                    var created_by = ADMIN_DATA_ID.ADMIN;
                    request_data_body.created_by = created_by;
                    request_data_body.created_id = request_data_body.created_id;
                    var promo_code = new Promo_code(request_data_body);
                    var image_file = request_data.files;
                    if (image_file != undefined && image_file.length > 0) {
                        // utils.deleteImageFromFolder(provider_data.image_url, FOLDER_NAME.PROVIDER_PROFILES);
                        var image_name = promo_code._id + utils.generateServerToken(4);
                        var url = utils.getStoreImageFolderPath(FOLDER_NAME.PROMO_IMAGES) + image_name + FILE_EXTENSION.PROMO;
                        utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.PROMO, FOLDER_NAME.PROMO_IMAGES);
                        promo_code.image_url = url;
                    }
                    promo_code.save().then(() => {
                        response_data.json({ success: true, message: PROMO_CODE_MESSAGE_CODE.PROMO_CODE_ADD_SUCCESSFULLY });
                    }, (error) => {
                        console.log(error)
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        });
                    });
                } else {
                    response_data.json({ success: false, error_code: PROMO_CODE_ERROR_CODE.PROMO_CODE_DATA_ADD_FAILED });
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

// list for view all promo_code
exports.promo_code_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;

            var number_of_rec = SEARCH_SORT.NO_OF_RECORD_PER_PAGE;
            var page = request_data_body.page;
            var sort_field = request_data_body.sort_field;
            var sort_promo_code = request_data_body.sort_promo_code;
            var search_field = request_data_body.search_field;
            var search_value = request_data_body.search_value;
            search_value = search_value.replace(/^\s+|\s+$/g, '');
            search_value = search_value.replace(/ +(?= )/g, '');

            var country_query = {
                $lookup:
                {
                    from: "countries",
                    localField: "country_id",
                    foreignField: "_id",
                    as: "country_details"
                }
            };
            var array_to_json1 = { $unwind: "$country_details" };

            var city_query = {
                $lookup:
                {
                    from: "cities",
                    localField: "city_id",
                    foreignField: "_id",
                    as: "city_details"
                }
            };

            // if (search_field === "promo_code_name")
            // {
            //     var query1 = {};
            //     var query2 = {};
            //     var query3 = {};
            //     var query4 = {};
            //     var query5 = {};
            //     var query6 = {};

            //     var full_name = search_value.split(' ');
            //     if (typeof full_name[0] === 'undefined' || typeof full_name[1] === 'undefined') {

            //         query1[search_field] = {$regex: new RegExp(search_value, 'i')};
            //         query2['promo_code_name'] = {$regex: new RegExp(search_value, 'i')};
            //         var search = {"$match": {$or: [query1, query2]}};
            //     } else {

            //         query1[search_field] = {$regex: new RegExp(search_value, 'i')};
            //         query2['country_details.country_name'] = {$regex: new RegExp(search_value, 'i')};
            //         query3[search_field] = {$regex: new RegExp(full_name[0], 'i')};
            //         query4['country_details.country_name'] = {$regex: new RegExp(full_name[0], 'i')};
            //         query5[search_field] = {$regex: new RegExp(full_name[1], 'i')};
            //         query6['country_details.country_name'] = {$regex: new RegExp(full_name[1], 'i')};
            //         var search = {"$match": {$or: [query1, query2, query3, query4, query5, query6]}};
            //     }
            // } else
            // {
            var query = {};
            query[search_field] = { $regex: new RegExp(search_value, 'i') };
            var search = { "$match": query };

            var page_type = request_data_body.page_type;
            var page_type_condition = { $match: {} }
            switch (page_type) {
                case 1:
                    page_type_condition = { $match: { $and: [{ is_active: true }, { is_approved: true }, { $or: [{ promo_expire_date: { $gt: new Date() } }, { is_promo_have_date: false }] }] } }
                    break;
                case 2:
                    page_type_condition = { $match: { $and: [{ is_active: false }] } }
                    break;
                case 3:
                    page_type_condition = { $match: { $and: [{ is_approved: false }] } }
                    break;
                case 4:
                    page_type_condition = { $match: { $and: [{ is_promo_have_date: true }, { promo_expire_date: { $lt: new Date() } }] } }
                    break;
            }

            var project = {
                $project: {
                    promo_details: 1,
                    promo_code_name: 1,
                    promo_code_uses: 1,
                    promo_start_date: 1,
                    promo_expire_date: 1,
                    image_url: 1,
                    unique_id: 1,
                    used_promo_code: 1,
                    country_name: "$country_details.country_name",
                    city_name: "$city_details.city_name"
                }
            }

            var start = (page * number_of_rec) - number_of_rec;
            var end = number_of_rec;
            var count = { $group: { _id: null, count: { $sum: 1 }, result: { $push: "$$ROOT" } } };
            var project1 = { $project: { count: 1, data: { $slice: ['$result', start, end] } } }
            var sort = { "$sort": {} };
            sort["$sort"]["unique_id"] = parseInt(-1);

            var page = request_data_body.page;
            var number_of_rec = request_data_body.number_of_rec;
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;
            Promo_code.aggregate([page_type_condition, search, project, sort, count, project1]).then((promo_codes) => {

                if (promo_codes.length == 0) {
                    response_data.json({
                        success: true, promo_codes: [], count: 0
                    });
                } else {
                    var page = Math.ceil(promo_codes[0].count / number_of_rec);
                    Promo_code.aggregate([country_query, array_to_json1, city_query, page_type_condition, search, project, sort, skip, limit]).then((promo_codes) => {
                        response_data.json({
                            success: true,
                            message: USER_MESSAGE_CODE.USER_LIST_SUCCESSFULLY,
                            promo_codes: promo_codes,
                            page
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


exports.promocode_active_deactive = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var promo_id = request_data_body.promo_id;
            var state = request_data_body.state;
            Promo_code.findOne({ _id: promo_id }).then((promo_code) => {

                if (!promo_code) {
                    response_data.json({ success: false, error_code: PROVIDER_ERROR_CODE.UPDATE_FAILED });
                } else {
                    promo_code.is_active = state;
                    promo_code.save();
                    response_data.json({
                        success: true,
                        message: PROVIDER_MESSAGE_CODE.DECLINED_SUCCESSFULLY
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


// update promo_code
exports.update_promo_code = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var promo_id = request_data_body.promo_id;
            var is_promo_have_date = request_data_body.is_promo_have_date;

            if (request_data_body.promo_start_date && request_data_body.promo_expire_date) {
                var promo_start_date = request_data_body.promo_start_date;
                var promo_expire_date = request_data_body.promo_expire_date;

                if (promo_start_date != undefined && promo_start_date != null) {
                    promo_start_date = request_data_body.promo_start_date;
                }
                if (promo_expire_date != undefined && promo_expire_date != null) {
                    promo_expire_date = request_data_body.promo_expire_date;
                }
                promo_start_date = new Date(promo_start_date);
                promo_start_date = promo_start_date.setHours(0, 0, 0, 0);
                promo_start_date = new Date(promo_start_date);
                promo_expire_date = new Date(promo_expire_date);
                promo_expire_date = promo_expire_date.setHours(23, 59, 59, 999);
                promo_expire_date = new Date(promo_expire_date);

                request_data_body.promo_start_date = promo_start_date;
                request_data_body.promo_expire_date = promo_expire_date;
            }
            else {
                delete request_data_body.promo_start_date;
                delete request_data_body.promo_expire_date;
            }
            request_data_body.store_ids = []
            if (request_data_body.months.length > 0) {
                request_data_body.months = request_data_body.months.toString().split(',')
            } else {
                request_data_body.months = []
            }

            if (request_data_body.weeks.length > 0) {
                request_data_body.weeks = request_data_body.weeks.toString().split(',')
            } else {
                request_data_body.weeks = []
            }

            if (request_data_body.days.length > 0) {
                request_data_body.days = request_data_body.days.toString().split(',')
            } else {
                request_data_body.days = []
            }

            if (request_data_body.promo_apply_on.length > 0) {
                request_data_body.promo_apply_on = request_data_body.promo_apply_on.toString().split(',')
            } else {
                request_data_body.promo_apply_on = []
            }

            Promo_code.findOneAndUpdate({ _id: promo_id }, request_data_body, { new: true }).then((promo_code_data) => {


                if (promo_code_data) {
                    var image_file = request_data.files;
                    if (image_file != undefined && image_file.length > 0) {
                        utils.deleteImageFromFolder(promo_code_data.image_url, FOLDER_NAME.PROMO_IMAGES);
                        var image_name = promo_code_data._id + utils.generateServerToken(4);
                        var url = utils.getStoreImageFolderPath(FOLDER_NAME.PROMO_IMAGES) + image_name + FILE_EXTENSION.PROMO;
                        utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.PROMO, FOLDER_NAME.PROMO_IMAGES);
                        promo_code_data.image_url = url;
                        promo_code_data.save().then(result => {
                            response_data.json({ success: true, message: PROMO_CODE_MESSAGE_CODE.UPDATE_SUCCESSFULLY });
                        })
                    } else {
                        response_data.json({ success: true, message: PROMO_CODE_MESSAGE_CODE.UPDATE_SUCCESSFULLY });
                    }

                } else {
                    response_data.json({ success: false, error_code: PROMO_CODE_ERROR_CODE.UPDATE_FAILED });

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

// get_promo_detail
exports.get_promo_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var promo_condition = { "$match": { '_id': { $eq: mongoose.Types.ObjectId(request_data_body.promo_id) } } };
            var country_query = {
                $lookup:
                {
                    from: "countries",
                    localField: "country_id",
                    foreignField: "_id",
                    as: "country_details"
                }
            };
            var array_to_json1 = { $unwind: "$country_details" };

            var city_query = {
                $lookup:
                {
                    from: "cities",
                    localField: "city_id",
                    foreignField: "_id",
                    as: "city_details"
                }
            };

            Promo_code.aggregate([promo_condition]).then((promo_code) => {
                if (promo_code.length == 0) {
                    response_data.json({ success: false, error_code: SERVICE_ERROR_CODE.SERVICE_DATA_NOT_FOUND });
                } else {
                    response_data.json({
                        success: true,
                        message: PRODUCT_MESSAGE_CODE.PRODUCT_LIST_SUCCESSFULLY,
                        promo_code_detail: promo_code[0]
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


// get_promo_uses_detail
exports.get_promo_uses_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;

            var condition = { $match: { '_id': mongoose.Types.ObjectId(request_data_body.promo_id) } }
            var country_query = {
                $lookup:
                {
                    from: "countries",
                    localField: "country_id",
                    foreignField: "_id",
                    as: "country_detail"
                }
            };
            var array_to_json1 = { $unwind: { path: "$country_detail", preserveNullAndEmptyArrays: true } };
            var city_query = {
                $lookup:
                {
                    from: "cities",
                    localField: "city_id",
                    foreignField: "_id",
                    as: "city_detail"
                }
            };
            var array_to_json2 = { $unwind:{path: "$city_detail", preserveNullAndEmptyArrays: true }};
            var project = {
                $project: {
                    promo_code_name: 1,
                    promo_code_value: 1,
                    promo_code_uses: 1,
                    promo_code_type: 1,
                    used_promo_code: 1,
                    promo_for: 1,
                    country_name: '$country_detail.country_name',
                    city_name: '$city_detail.city_name',
                }
            }

            Promo_code.aggregate([condition, country_query, array_to_json1, city_query, array_to_json2, project]).then((promo_code_detail) => {
                if (promo_code_detail.length > 0) {

                    var promo_condition = { "$match": { 'promo_id': { $eq: mongoose.Types.ObjectId(request_data_body.promo_id) } } };
                    var user_query = {
                        $lookup:
                        {
                            from: "users",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "user_detail"
                        }
                    };
                    var array_to_json1 = { $unwind: "$user_detail" };

                    var project = {
                        $project: {
                            first_name: '$user_detail.first_name',
                            last_name: '$user_detail.last_name',
                            email: '$user_detail.email',
                            phone: '$user_detail.phone',
                            country_phone_code: '$user_detail.country_phone_code',
                            image_url: '$user_detail.image_url',
                            total: 1,
                            is_payment_mode_cash: 1,
                            is_paid_from_wallet: 1,
                            total_cart_price: 1,
                            total_delivery_price: 1,
                            order_unique_id: 1,
                            currency_code: 1,
                            promo_payment: 1
                        }
                    }

                    Order_payment.aggregate([promo_condition, user_query, array_to_json1, project]).then((order_list) => {


                        response_data.json({ success: true, promo_code_detail: promo_code_detail[0], order_list: order_list });


                    });

                } else {
                    response_data.json({ success: false })
                }
            });

            // Promo_code.findOne({_id: request_data_body.promo_id}).then((promo_code) => {
            //     if (promo_code)
            //     {
            //         Country.findOne({_id: promo_code.country_id}).then((country_details) => {

            //             City.findOne({_id: promo_code.city_id}).then((city_details) => {

            //                 var city_name = "All";
            //                 if (city_details) {
            //                     city_name = city_details.city_name;
            //                 }
            //                 var promo_condition = {"$match": {'promo_id': {$eq: mongoose.Types.ObjectId(request_data_body.promo_id)}}};


            //                 var order_query = {
            //                     $lookup:
            //                             {
            //                                 from: "orders",
            //                                 localField: "order_id",
            //                                 foreignField: "_id",
            //                                 as: "order_details"
            //                             }
            //                 };
            //                 var array_to_json2 = {$unwind: "$order_details"};

            //                 var promo_code_query = {
            //                     $lookup:
            //                             {
            //                                 from: "promo_codes",
            //                                 localField: "promo_id",
            //                                 foreignField: "_id",
            //                                 as: "promo_code_details"
            //                             }
            //                 };
            //                 var array_to_json3 = {$unwind: "$promo_code_details"};

            //                 var city_query = {
            //                     $lookup:
            //                             {
            //                                 from: "cities",
            //                                 localField: "promo_code_details.city_id",
            //                                 foreignField: "_id",
            //                                 as: "city_details"
            //                             }
            //                 };


            //                 Order_payment.aggregate([promo_condition, user_query, promo_code_query, order_query, array_to_json1, array_to_json2, array_to_json3, city_query]).then((order_payment) => {


            //                     if (order_payment.length == 0) {
            //                         response_data.json({success: false,
            //                             error_code: SERVICE_ERROR_CODE.SERVICE_DATA_NOT_FOUND,
            //                             country_details: country_details,
            //                             promo_code: promo_code,
            //                             city_name: city_name
            //                         });
            //                     } else
            //                     {

            //                         response_data.json({success: true,
            //                             message: PRODUCT_MESSAGE_CODE.PRODUCT_LIST_SUCCESSFULLY,
            //                             order_payment: order_payment,
            //                             country_details: country_details,
            //                             promo_code: promo_code,
            //                             city_name: city_name
            //                         });
            //                     }
            //                 }, (error) => {
            //                     console.log(error)
            //                     response_data.json({
            //                         success: false,
            //                         error_code: ERROR_CODE.SOMETHING_WENT_WRONG
            //                     });
            //                 });
            //             }, (error) => {
            //                 console.log(error)
            //                 response_data.json({
            //                     success: false,
            //                     error_code: ERROR_CODE.SOMETHING_WENT_WRONG
            //                 });
            //             });
            //         });
            //     }
            // }, (error) => {
            //     console.log(error)
            //     response_data.json({
            //         success: false,
            //         error_code: ERROR_CODE.SOMETHING_WENT_WRONG
            //     });
            // });
        } else {
            response_data.json(response);
        }
    });
};



/// check_promo_code
exports.check_promo_code = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var promo_code_name = ((request_data_body.promo_code_name).trim()).toUpperCase();

            Promo_code.findOne({ country_id: request_data_body.country_id, promo_code_name: promo_code_name, city_id: request_data_body.city_id }).then((promo_code) => {
                if (!promo_code) {
                    response_data.json({
                        success: true,
                        message: PROMO_CODE_MESSAGE_CODE.UPDATE_SUCCESSFULLY

                    });
                } else {
                    response_data.json({ success: false, error_code: PROMO_CODE_ERROR_CODE.UPDATE_FAILED });

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

exports.get_promo_code_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {
            var server_time = new Date()
            var reques_data_body = request_data.body
            City.findOne({ _id: reques_data_body.city_id }).then((city_data => {
                if (city_data.is_promo_apply) {
                    var promo_filter = {
                        $match: {
                            $or: [{
                                promo_for: 20
                            }, {
                                $and: [{ promo_for: 0 }, { promo_apply_on: { $in: [mongoose.Types.ObjectId(reques_data_body.delivery_id)] } }]
                            }]
                        }
                    }
                    var country_query = {
                        $lookup:
                        {
                            from: "countries",
                            localField: "country_id",
                            foreignField: "_id",
                            as: "country_details"
                        }
                    };
                    var array_to_json1 = { $unwind: "$country_details" };

                    var active_filter = {
                        $match: {
                            $and: [
                                {
                                    $or: [
                                        {
                                            is_promo_have_date: false
                                        },
                                        {
                                            $and: [
                                                {
                                                    is_approved: true
                                                },
                                                {
                                                    is_active: true
                                                },
                                                { is_promo_have_date: true },
                                                {
                                                    promo_start_date: {
                                                        $lt: server_time
                                                    }
                                                },
                                                {
                                                    promo_expire_date: {
                                                        $gt: server_time
                                                    }
                                                },
                                            ]
                                        }
                                    ]
                                },
                                {
                                    is_approved: true
                                },
                                {
                                    is_active: true
                                },
                                {
                                    $or: [
                                        {
                                            city_id: { $eq: mongoose.Types.ObjectId(reques_data_body.city_id) }
                                        },

                                        {
                                            $and: [
                                                {
                                                    country_id: { $eq: mongoose.Types.ObjectId(city_data.country_id) }
                                                },
                                                {
                                                    city_id: { $eq: mongoose.Types.ObjectId('000000000000000000000000') }
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                    var project = {
                        $project: {
                            // promo_for: 1,
                            // promo_apply_on: 1,
                            // promo_code_name: 1,
                            // promo_details: 1,
                            // is_approved: 1,
                            // is_active: 1,
                            // image_url: 1,
                            // promo_start_date: 1,
                            // promo_expire_date: 1,
                            // city_id: 1
                            _id: 1,
                            is_promo_have_date: 1,
                            promo_recursion_type: 1,
                            image_url: 1,
                            promo_start_time: 1,
                            promo_end_time: 1,
                            months: 1,
                            weeks: 1,
                            days: 1,
                            is_active: 1,
                            currency_sign: "$country_details.currency_sign",
                            is_approved: 1,
                            promo_details: 1,
                            promo_code_name: 1,
                            promo_code_value: 1,
                            promo_code_type: 1,
                            promo_apply_on: 1,
                            store_ids: 1,
                            admin_loyalty: 1,
                            is_promo_have_minimum_amount_limit: 1,
                            promo_code_apply_on_minimum_amount: 1,
                            is_promo_have_item_count_limit: 1,
                            promo_code_apply_on_minimum_item_count: 1,
                            is_promo_have_max_discount_limit: 1,
                            promo_code_max_discount_amount: 1,
                            is_promo_required_uses: 1,
                            promo_code_uses: 1,
                            used_promo_code: 1,
                            is_promo_apply_on_completed_order: 1,
                            promo_apply_after_completed_order: 1,
                            promo_for: 1,
                            promo_expire_date: 1,
                            promo_start_date: 1,
                            created_by: 1,
                            country_id: 1,
                            city_id: 1,
                            created_at: 1,
                            updated_at: 1,
                            unique_id: 1,
                        }
                    }

                    Promo_code.aggregate([promo_filter, active_filter, country_query, array_to_json1, project]).then(promo_codes => {

                        response_data.json({
                            success: true,
                            message: PROMO_CODE_MESSAGE_CODE.PROMO_CODE_LIST_SUCCESSFULLY,
                            promo_codes: promo_codes,
                            is_promo_availabel: city_data.is_promo_apply
                        });
                    }).catch(error => {
                        console.log(error)
                        response_data.json({
                            success: false,
                            message: PROMO_CODE_ERROR_CODE.PROMO_CODE_DATA_NOT_FOUND
                        })
                    })
                } else {
                    response_data.json({
                        success: true,
                        message: PROMO_CODE_MESSAGE_CODE.PROMO_CODE_LIST_SUCCESSFULLY,
                        promo_codes: []
                    });
                }
                // })
            }))
        }
    })
}