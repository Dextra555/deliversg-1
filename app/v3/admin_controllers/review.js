require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
require('../utils/push_code');
var utils = require('../utils/utils');
var console = require('../utils/console');

var emails = require('../controllers/email_sms/emails');
var SMS = require('../controllers/email_sms/sms');
var mongoose = require('mongoose');
var Review = require('mongoose').model('review');
var Order = require('mongoose').model('order');

//get_review_list for view 
exports.get_review_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'page'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
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
            var array_to_json_store_detail = {$unwind: {
                                    path: "$store_detail",
                                    preserveNullAndEmptyArrays: true
                                }
                            };

            var provider_query = {
                $lookup:
                        {
                            from: "providers",
                            localField: "provider_id",
                            foreignField: "_id",
                            as: "provider_detail"
                        }
            };

            //var array_to_json_provider_detail = {$unwind: "$provider_detail"};

            var number_of_rec = SEARCH_SORT.NO_OF_RECORD_PER_PAGE;
            var page = request_data_body.page;

            var sort_field = request_data_body.sort_field;
            var sort_review = request_data_body.sort_review;
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
                    query2['user_detail.first_name'] = {$regex: new RegExp(search_value, 'i')};
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
            } else if (search_field === "store_detail.name")
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
            var filter = {"$match": {"created_at": {$gte: start_date, $lt: end_date}}};
            var sort = {"$sort": {}};
            sort["$sort"][sort_field] = parseInt(sort_review);
            var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
            var skip = {};
            skip["$skip"] = (page * number_of_rec) - number_of_rec;
            var limit = {};
            limit["$limit"] = number_of_rec;


            Review.aggregate([user_query, store_query, provider_query, array_to_json_user_detail, array_to_json_store_detail
                        , search, filter, count
            ]).then((reviews) => {
                if (reviews.length === 0)
                {
                    response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0});
                } else
                {

                    var pages = Math.ceil(reviews[0].total / number_of_rec);
                    Review.aggregate([user_query, store_query, provider_query, array_to_json_user_detail, array_to_json_store_detail
                                , sort, search, filter, skip, limit
                    ]).then((reviews) => {
                            response_data.json({success: true,
                                message: ORDER_MESSAGE_CODE.ORDER_LIST_SUCCESSFULLY, pages: pages,
                                reviews: reviews});
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


// get_review_detail
exports.get_review_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'order_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var review_id_condition = {"$match": {'order_id': {$eq: mongoose.Types.ObjectId(request_data_body.order_id)}}};
            var user_query = {
                $lookup:
                        {
                            from: "users",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "user_detail"
                        }
            };

            var provider_query = {
                $lookup:
                        {
                            from: "providers",
                            localField: "provider_id",
                            foreignField: "_id",
                            as: "provider_detail"
                        }
            };

            var store_query = {
                $lookup:
                        {
                            from: "stores",
                            localField: "store_id",
                            foreignField: "_id",
                            as: "store_detail"
                        }
            };

            Review.aggregate([review_id_condition, user_query, provider_query, store_query]).then((review_detail) => {
                if (review_detail.length == 0) {
                    response_data.json({success: false, error_code: SERVICE_ERROR_CODE.SERVICE_DATA_NOT_FOUND});
                } else
                {
                    response_data.json({success: true,
                        message: PRODUCT_MESSAGE_CODE.PRODUCT_LIST_SUCCESSFULLY,
                        review_detail: review_detail[0]

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



