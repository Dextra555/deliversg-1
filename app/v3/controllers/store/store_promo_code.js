require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/push_code');
require('../../utils/constants');
var utils = require('../../utils/utils');
var Promo_code = require('mongoose').model('promo_code');
var mongoose = require('mongoose');
var Store = require('mongoose').model('store');
var console = require('../../utils/console');


//Store_add_promo
exports.store_add_promo = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'promo_code_name', type: 'string'}], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var store_detail = response.store;

            var promo_code_name = (request_data_body.promo_code_name).toUpperCase();

            Promo_code.findOne({promo_code_name: promo_code_name}).then(promo_code => {
                if(promo_code){
                    response_data.json({
                        success: false,
                        error_code: PROMO_CODE_ERROR_CODE.PROMO_CODE_WITH_SAME_NAME_ALREADY_EXISTS
                    })
                } else {

                    request_data_body.promo_code_name = promo_code_name;
                    var promo_start_date = request_data_body.promo_start_date;
                    var is_promo_expiry_date = request_data_body.is_promo_have_date;
        
                    if (is_promo_expiry_date == true) {
                        var promo_expire_date = request_data_body.promo_expire_date;
                        if (promo_expire_date != null && promo_expire_date != undefined) {
        
                            request_data_body.promo_expire_date = promo_expire_date;
                        }
                    }
                    if (request_data_body.promo_apply_on && request_data_body.promo_apply_on.length > 0) {
                        request_data_body.promo_apply_on = request_data_body.promo_apply_on.replace(/[^0-9a-z,]/gi, '')
                        request_data_body.promo_apply_on = request_data_body.promo_apply_on.toString().split(',')
                        if (!request_data_body.promo_apply_on.length) {
                            request_data_body.promo_apply_on = []
                        }
                    } else {
                        request_data_body.promo_apply_on = []
                    }

                    if (request_data_body.months && request_data_body.months.length > 0) {
                        request_data_body.months = request_data_body.months.replace(/[^0-9a-z,]/gi, '')
                        request_data_body.months = request_data_body.months.toString().split(',')
                        if (!request_data_body.months.length) {
                            request_data_body.months = []
                        }
                    } else {
                        request_data_body.months = []
                    }

                    if (request_data_body.weeks && request_data_body.weeks.length > 0) {
                        request_data_body.weeks = request_data_body.weeks.replace(/[^0-9a-z,]/gi, '')
                        request_data_body.weeks = request_data_body.weeks.toString().split(',')
                        if (!request_data_body.weeks.length) {
                            request_data_body.weeks = []
                        }
                    } else {
                        request_data_body.weeks = []
                    }

                    if (request_data_body.days && request_data_body.days.length > 0) {
                        request_data_body.days = request_data_body.days.replace(/[^0-9a-z,]/gi, '')
                        request_data_body.days = request_data_body.days.toString().split(',')
                        if (!request_data_body.days.length) {
                            request_data_body.days = []
                        }
                    } else {
                        request_data_body.days = []
                    }
                    
                    request_data_body.promo_start_date = promo_start_date;
                    request_data_body.created_by = ADMIN_DATA_ID.STORE;
                    request_data_body.created_id = store_detail._id;
                    request_data_body.country_id = store_detail.country_id;
                    request_data_body.city_id = store_detail.city_id;
        
                    var promo_code = new Promo_code(request_data_body);
                    var image_file = request_data.files;
                    if (image_file != undefined && image_file.length > 0) {
                        // utils.deleteImageFromFolder(provider_data.image_url, FOLDER_NAME.PROVIDER_PROFILES);
                        var image_name = promo_code._id + utils.generateServerToken(4);
                        var url = utils.getStoreImageFolderPath(FOLDER_NAME.PROMO_IMAGES) + image_name + FILE_EXTENSION.PROMO;
                        utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.PROMO, FOLDER_NAME.PROMO_IMAGES);
                        promo_code.image_url = url;
                    }

                    promo_code.save().then((data) => {
                        response_data.json({
                            success: true,
                            message: PROMO_CODE_MESSAGE_CODE.PROMO_CODE_ADD_SUCCESSFULLY,
                            promo_id: data._id
                        });
                    }, (error) => {
                        console.log(error);
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        });
                    });
                }
            })


        } else {
            response_data.json(response);
        }
    });
};

// list for view all promo_codes
exports.store_promo_code_list = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
			
                        var store_promo_condition = {"$match": {'created_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
                        Promo_code.aggregate([store_promo_condition]).then((promo_codes) => {

                            if (promo_codes.length == 0) {
                                response_data.json({success: false, error_code: PROMO_CODE_ERROR_CODE.PROMO_LIST_NOT_FOUND});
                            } else
                            {
                                response_data.json({success: true,
                                    message: PROMO_CODE_MESSAGE_CODE.PROMO_CODE_LIST_SUCCESSFULLY,
                                    promo_codes: promo_codes});
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

// store_update_promo_code
exports.store_update_promo_code = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'promo_id', type: 'string'}], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var promo_id = request_data_body.promo_id;

            var promo_start_date = request_data_body.promo_start_date;
            var promo_expire_date = request_data_body.promo_expire_date;
            var is_promo_expiry_date = request_data_body.is_promo_expiry_date;

            if (is_promo_expiry_date == true)
            {
                if (promo_expire_date != null && promo_expire_date != undefined)
                {

                    request_data_body.promo_expire_date = promo_expire_date;
                }
            }
            request_data_body.promo_start_date = promo_start_date;
            
            // if (request_data_body.promo_apply_on && request_data_body.promo_apply_on.length > 0) {
            //     // request_data_body.promo_apply_on = request_data_body.promo_apply_on[0].replace(/[^0-9a-z,]/gi, '')
            //     request_data_body.promo_apply_on = request_data_body.promo_apply_on.toString().split(',')
            // } else {
            //     request_data_body.promo_apply_on = []
            // }
            if (request_data_body.promo_apply_on && request_data_body.promo_apply_on.length > 0) {
                if (typeof request_data_body.promo_apply_on === 'object') {
                    request_data_body.promo_apply_on = request_data_body.promo_apply_on.toString().split(',')
                } else {
                    request_data_body.promo_apply_on = request_data_body.promo_apply_on.replace(/[^0-9a-z,]/gi, '')
                    request_data_body.promo_apply_on = request_data_body.promo_apply_on.toString().split(',')
                }
            } else {
                request_data_body.promo_apply_on = []
            }
                   
                        Promo_code.findOneAndUpdate({_id: promo_id}, request_data_body, {new : true}).then((promo_code_data) => {
                            if (promo_code_data)
                            {
                                var image_file = request_data.files;
                                if (image_file != undefined && image_file.length > 0) {
                                    utils.deleteImageFromFolder(promo_code_data.image_url, FOLDER_NAME.PROMO_IMAGES);
                                    var image_name = promo_code_data._id + utils.generateServerToken(4);
                                    var url = utils.getStoreImageFolderPath(FOLDER_NAME.PROMO_IMAGES) + image_name + FILE_EXTENSION.PROMO;
                                    utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.PROMO, FOLDER_NAME.PROMO_IMAGES);
                                    promo_code_data.image_url = url;
                                }
                                promo_code_data.save().then(result => {
                                    response_data.json({ success: true, message: PROMO_CODE_MESSAGE_CODE.UPDATE_SUCCESSFULLY });
                                })
                            } else
                            {
                                response_data.json({success: false, error_code: PROMO_CODE_ERROR_CODE.UPDATE_FAILED});
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

exports.update_promo_image = function (request_data, response_data) {
    var request_data_body = request_data.body;
    Promo_code.findOne({_id:request_data_body.promo_id},function(err,promo_code){
        var image_file = request_data.files;
        if (image_file != undefined && image_file.length > 0) {

            var image_name = promo_code._id + utils.generateServerToken(4);
            var url = utils.getStoreImageFolderPath(FOLDER_NAME.PROMO_IMAGES) + image_name + FILE_EXTENSION.ITEM;
            promo_code.image_url = url;
            utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.ITEM, FOLDER_NAME.PROMO_IMAGES);
            promo_code.save();
        }
        response_data.json({success: true,promo_code:promo_code});
    })
}

/// store_check_promo_code
exports.store_check_promo_code = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'promo_code_name', type: 'string'}], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var promo_code_name = ((request_data_body.promo_code_name).trim()).toUpperCase();
            var store_detail = response.store;
                   
                        Promo_code.findOne({created_id: store_detail._id, country_id: store_detail.country_id, promo_code_name: promo_code_name, city_id: store_detail.city_id}).then((promo_code) => {
                            if (!promo_code) {
                                response_data.json({success: true});
                            } else {
                                response_data.json({success: false, error_code: PROMO_CODE_ERROR_CODE.PROMO_CODE_DATA_ADD_FAILED});

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

// list for store PANEL view all search_sort_promo_code_list
exports.search_sort_promo_code_list = function (request_data, response_data) {
    utils.check_unique_details(request_data, [{name: 'page'}], function (response) {
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

                        if (search_field === "promo_code_name")
                        {
                            var query1 = {};
                            var query2 = {};


                            var full_name = search_value.split(' ');
                            if (typeof full_name[0] === 'undefined' || typeof full_name[1] === 'undefined') {

                                query1[search_field] = {$regex: new RegExp(search_value, 'i')};
                                query2['promo_code_name'] = {$regex: new RegExp(search_value, 'i')};
                                var search = {"$match": {$or: [query1, query2]}};
                            }
                        } else
                        {
                            var query = {};
                            query[search_field] = {$regex: new RegExp(search_value, 'i')};
                            var search = {"$match": query};
                        }

                        var sort = {"$sort": {}};
                        sort["$sort"][sort_field] = parseInt(sort_promo_code);
                        var count = {$group: {_id: null, total: {$sum: 1}, data: {$push: '$data'}}};
                        var skip = {};
                        skip["$skip"] = (page * number_of_rec) - number_of_rec;
                        var limit = {};
                        limit["$limit"] = number_of_rec;


                        var store_promo_condition = {"$match": {'created_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
                        Promo_code.aggregate([store_promo_condition
                                    , search, count
                        ]).then((promo_codes) => {

                            if (promo_codes.length == 0) {
                                response_data.json({success: false, error_code: PROMO_CODE_ERROR_CODE.PROMO_CODE_DATA_NOT_FOUND});
                            } else
                            {
                                var pages = Math.ceil(promo_codes[0].total / number_of_rec);
                                Promo_code.aggregate([store_promo_condition
                                            , sort, search, skip, limit
                                ]).then((promo_codes) => {
                                    if (promo_codes.length == 0) {

                                        response_data.json({success: false, error_code: PROMO_CODE_ERROR_CODE.PROMO_CODE_DATA_NOT_FOUND});
                                    }
                                    {
                                        response_data.json({success: true,
                                            message: PROMO_CODE_MESSAGE_CODE.PROMO_CODE_LIST_SUCCESSFULLY,
                                            pages: pages,
                                            promo_codes: promo_codes});
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
                    

                
        } else {
            response_data.json(response);
        }
    });
};

