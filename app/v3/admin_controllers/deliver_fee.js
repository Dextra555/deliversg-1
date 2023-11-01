require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var DeliverFee = require('mongoose').model('deliver_fee');
var mongoose = require('mongoose');
var console = require('../utils/console');


//add deliver fee
exports.add_deliver_fee = function (request_data, response_data) 
{
    utils.check_request_params(request_data.body, [], function (response) 
    {
        if (response.success) 
        {
            var request_data_body = request_data.body;

            var deliverFee = new DeliverFee(request_data_body);
            // var deliver_fee_name = request_data_body.deliver_fee_name;

            DeliverFee.findOne().then((deliver_fee_data) => {
                if (!deliver_fee_data)
                {
                    deliverFee.save().then((deliver_fee_add) => 
                    {
                        if (deliver_fee_add)
                        {
                            response_data.json({success: true, message: DELIVERY_FEE_MESSAGE_CODE.DELIVERY_FEE_ADDED_SUCCESSFULLY});
                        }
                        else
                        {
                            response_data.json({success: false, error_code: DELIVERY_FEE_ERROR_CODE.DELIVERY_FEE_ADD_FAILED});
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
                    DeliverFee.findOneAndUpdate({}, {$push: { delivery_fee: {from: Number(request_data_body.from), to: Number(request_data_body.to), fee: Number(request_data_body.fee)}}}).then((deliver_fee_update) => {

                        if (deliver_fee_update)
                        {
                            deliver_fee_update.save().then(result => {
                                response_data.json({ success: true, message: DELIVERY_FEE_MESSAGE_CODE.DELIVERY_FEE_UPDATED_SUCCESSFULLY });
                            })
                        }
                        else
                        {
                            response_data.json({ success: false, error_code: DELIVERY_FEE_ERROR_CODE.DELIVERY_FEE_UPDATE_FAILED });
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
            });
        }
        else 
        {
            response_data.json(response);
        }
    });
};


//To get all delivery fees data
exports.get_all_deliver_fee = function (request_data, response_data) 
{
    DeliverFee.find({}, {_id: 1, delivery_fee: 1, unique_id: 1}).then((deliveryFees) => {

            if (deliveryFees.length == 0) {
                response_data.json({ success: false, error_code: DELIVERY_FEE_ERROR_CODE.DELIVERY_FEE_DATA_NOT_FOUND });
            } else {
                response_data.json({
                    success: true,
                    message: DELIVERY_FEE_MESSAGE_CODE.DELIVERY_FEE_DATA_FOUND,
                    deliveryFee: deliveryFees
                });
            }
        }, (error) => {
            console.log(error)
            response_data.json({
                success: false,
                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
            });
        });
};


//To get peak hour status
exports.get_deliver_fee = function (request_data, response_data) 
{
    var final_delivery_fee = 0;
    var cost_found = false;

    utils.check_request_params(request_data.body, [], function (response) 
    {
        var request_data_body = request_data.body;
        var cost = request_data_body.cost;

        if(cost == null || cost == "" || cost == 0)
        {
            response_data.json({
                success: false,
                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
            });
        }
        else{
            DeliverFee.find({}, function(err, posts){
                if(err){
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                }
                else {
                    console.log(posts);
                    var delivery_data = posts[0];
                    var delivery_id = delivery_data._id;
                    var delivery_fee = delivery_data.delivery_fee;
    
                    const between = (x, min, max) => {
                        return x >= min && x <= max;
                    }
    
                    var delivery_high = 0;
                    
                    delivery_fee.forEach(element => {
                        if(parseInt(element.fee)>delivery_high)
                        {
                            delivery_high = parseInt(element.fee);
                        }
                        if(cost >= parseInt(element.from) && cost <= parseInt(element.to))
                        {
                            cost_found = true;
                            console.log("Final delivery fee: "+element.fee)
                            final_delivery_fee = parseInt(element.fee);
                        }
                    });

                    if(!cost_found)
                    {
                        final_delivery_fee = 0;
                    }
                    
                    response_data.json({success: true,delivery_fee:final_delivery_fee});
                }
            });
        }
    });
};



//delete deliver fee
exports.delete_deliver_fee = function (request_data, response_data)
{
    utils.check_request_params(request_data.body, [], function (response) 
    {
        if (response.success) 
        {
            var request_data_body = request_data.body;

            DeliverFee.findOneAndUpdate({}, {$pull: { delivery_fee: {from: Number(request_data_body.from), to: Number(request_data_body.to), fee: Number(request_data_body.fee)}}}).then((deliver_fee_delete) => {

                if (deliver_fee_delete)
                {
                    deliver_fee_delete.save().then(result => {
                        response_data.json({ success: true, message: DELIVERY_FEE_MESSAGE_CODE.DELIVERY_FEE_DELETED });
                    })
                }
                else
                {
                    response_data.json({ success: false, error_code: DELIVERY_FEE_ERROR_CODE.DELIVERY_FEE_DELETE_FAILED });
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
    });
}