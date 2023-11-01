require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var PickupOffer = require('mongoose').model('pickup_offer');
var Store = require('mongoose').model('store');
var console = require('../utils/console');


// add pickup offer
exports.add_pickup_offer = function (request_data, response_data) 
{
    utils.check_request_params(request_data.body, [{ name: 'offer_value', type: 'string' }, { name: 'offer_detail', type: 'string' }], function (response) 
    {
        if (response.success) 
        {
            var request_data_body = request_data.body;

            var pickupOffer = new PickupOffer(request_data_body);
            var offer_value = request_data_body.offer_value;
            var offer_detail = request_data_body.offer_detail;

            PickupOffer.findOne().then((pickup_offer_data) => {
                if (!pickup_offer_data)
                {
                    pickupOffer.save().then((offer_data) => 
                    {
                        if (offer_data)
                        {
                            response_data.json({success: true, message: PICKUP_OFFER_MESSAGE_CODE.PICKUP_OFFER_ADDED_SUCCESSFULLY});
                        }
                        else
                        {
                            response_data.json({success: false, error_code: PICKUP_OFFER_ERROR_CODE.PICKUP_OFFER_ADD_FAILED});
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
                    PickupOffer.findOneAndUpdate({}, request_data_body, {new : true}).then((update_pickup_offer) => {

                        if (update_pickup_offer)
                        {
                            update_pickup_offer.offer_value = offer_value;
                            update_pickup_offer.offer_detail = offer_detail;
                            update_pickup_offer.save();
        
                            response_data.json({success: true, message: PICKUP_OFFER_MESSAGE_CODE.PICKUP_OFFER_UPDATED_SUCCESSFULLY});
                        } 
                        else
                        {
                            response_data.json({success: false, error_code: PICKUP_OFFER_ERROR_CODE.PICKUP_OFFER_UPDATE_FAILED});
                        }
                    }, (error) => {
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

//To get pickup offer
exports.get_pickup_offer = function (request_data, response_data) {

    PickupOffer.find({}, {_id: 1, offer_value: 1, offer_detail: 1, unique_id: 1}).then((pickup_offer) => {

            if (pickup_offer.length == 0) {
                response_data.json({ success: false, error_code: PICKUP_OFFER_ERROR_CODE.PICKUP_OFFER_DATA_NOT_FOUND });
            } else {
                response_data.json({
                    success: true,
                    message: PICKUP_OFFER_MESSAGE_CODE.PICKUP_OFFER_DATA_FOUND,
                    pickup_offer: pickup_offer
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






