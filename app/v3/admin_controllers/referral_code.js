require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var console = require('../utils/console');

var Referral_code = require('mongoose').model('referral_code');

// get_referral_detail
exports.get_referral_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var type = {"$match": { user_type:request_data_body.user_type}}

            Referral_code.aggregate([
                type,
                {
                    $lookup:
                            {
                                from: "users",
                                localField: "referred_id",
                                foreignField: "_id",
                                as: "user_detail"
                            }
                },
                {
                    $lookup:
                            {
                                from: "providers",
                                localField: "referred_id",
                                foreignField: "_id",
                                as: "provider_detail"
                            }
                },
                {
                    $lookup:
                            {
                                from: "stores",
                                localField: "referred_id",
                                foreignField: "_id",
                                as: "store_detail"
                            }
                },

                {
                    $group: {
                        _id: '$user_id',
                        count: {$sum: '$referral_bonus_to_user'},
                        referral_code: {$push: "$$ROOT"}
                    }

                },
                {
                    $lookup:
                            {
                                from: "users",
                                localField: "_id",
                                foreignField: "_id",
                                as: "referred_user_detail"
                            }
                },
                {
                    $lookup:
                            {
                                from: "providers",
                                localField: "_id",
                                foreignField: "_id",
                                as: "referred_provider_detail"
                            }
                },
                {
                    $lookup:
                            {
                                from: "stores",
                                localField: "_id",
                                foreignField: "_id",
                                as: "referred_store_detail"
                            }
                }

            ]).then((referral_codes) => {

                if (referral_codes.length == 0) {

                    response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0});
                } else {
                    Referral_code.aggregate([
                        type,
                        {
                            $lookup:
                                    {
                                        from: "users",
                                        localField: "referred_id",
                                        foreignField: "_id",
                                        as: "user_detail"
                                    }
                        },
                        {
                            $lookup:
                                    {
                                        from: "providers",
                                        localField: "referred_id",
                                        foreignField: "_id",
                                        as: "provider_detail"
                                    }
                        },
                        {
                            $lookup:
                                    {
                                        from: "stores",
                                        localField: "referred_id",
                                        foreignField: "_id",
                                        as: "store_detail"
                                    }
                        },
                        {
                            $group: {
                                _id: '$user_id',
                                count: {$sum: '$referral_bonus_to_user'},
                                referral_code: {$push: "$$ROOT"}
                            }

                        },
                        {
                            $lookup:
                                    {
                                        from: "users",
                                        localField: "_id",
                                        foreignField: "_id",
                                        as: "referred_user_detail"
                                    }
                        },
                        {
                            $lookup:
                                    {
                                        from: "providers",
                                        localField: "_id",
                                        foreignField: "_id",
                                        as: "referred_provider_detail"
                                    }
                        },
                        {
                            $lookup:
                                    {
                                        from: "stores",
                                        localField: "_id",
                                        foreignField: "_id",
                                        as: "referred_store_detail"
                                    }
                        }

                    ]).then((referral_codes) => {

                        if (referral_codes.length == 0) {

                            response_data.json({success: false, error_code: ORDER_ERROR_CODE.ORDER_NOT_FOUND, pages: 0});
                        } else {
                            response_data.json({success: true,
                                message: ORDER_MESSAGE_CODE.ORDER_LIST_FOR_PROVIDER_SUCCESSFULLY,
                                referral_codes: referral_codes
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
        } else {
            response_data.json(response);
        }
    });
};