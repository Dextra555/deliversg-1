require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
var utils = require('../../utils/utils');
var console = require('../../utils/console');


var SubCategory = require('mongoose').model('sub_category');




// add_sub_category
exports.add_sub_category = function (request_data, response_data) 
{
    utils.check_request_params(request_data.body, [{ name: 'sub_category_name', type: 'string' }, { name: 'store_delivery_id', type: 'string' }], function (response) 
    {
        if (response.success) 
        {
            var request_data_body = request_data.body;

            

            var add_sub_category = new SubCategory(request_data_body);

            let query = { $or: [{ 'sub_category_name': request_data_body.sub_category_name }] };

            Delivery.findOne({ _id: request_data_body.store_delivery_id }).then((deliveryId) => {
                if (deliveryId)
                {
                    // var vehicle_document_condition = {"$match": {'store_id': {$eq: null}}};
                    // if(request_data_body.store_id != undefined)
                    // {
                    //     vehicle_document_condition = {"$match": {'store_id': {$eq: mongoose.Types.ObjectId(request_data_body.store_id)}}};
                    // }

                    SubCategory.findOne(query, function (err, subCategory) 
                    {
                        if (subCategory) 
                        {
                            if (subCategory.sub_category_name == request_data_body.sub_category_name) {
                                return response_data.json({ success: false, error_code: SUB_CATEGORY_ERROR_CODE.SUB_CATEGORY_ALREADY_EXIST });
                            }
                        }
                        else
                        {
                            add_sub_category.save().then(() => 
                            {
                                response_data.json({success: true, message: SUB_CATEGORY_MESSAGE_CODE.ADD_SUB_CATEGORY_SUCCESSFULLY});
                            }, 
                            (error) => {
                                console.log(error);
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });
                        }
                    })
                }
            }, 
            (error) => {
                console.log(error);
                response_data.json({
                    success: false,
                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                });
            });
        }
        else 
        {
            response_data.json(response);
        }
    });
};






