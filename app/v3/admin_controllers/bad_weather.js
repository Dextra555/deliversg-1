require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var BadWeather = require('mongoose').model('bad_weather');
var Store = require('mongoose').model('store');
var console = require('../utils/console');


//To update sub category ids to store
exports.add_subid_to_store = function (request_data, response_data) 
{
    utils.check_request_params(request_data.body, [{ name: 'store_id', type: 'string' }, { name: 'sub_category_id', type: 'string' }], function (response) {
        if (response.success) 
        {
            var request_data_body = request_data.body;
            var store_id = request_data_body.store_id;

            if (request_data_body.sub_category_id.length > 0) {
                request_data_body.sub_category_id = request_data_body.sub_category_id.toString().split(',')
            } else {
                request_data_body.sub_category_id = []
            }

            Store.findOneAndUpdate({ _id: store_id }, request_data_body, { new: true }).then((store_update) => {

                if (store_update)
                {
                    store_update.save().then(result => {
                        response_data.json({ success: true, message: STORE_MESSAGE_CODE.UPDATE_SUCCESSFULLY });
                    })
                }
                else
                {
                    response_data.json({ success: false, error_code: STORE_ERROR_CODE.UPDATE_FAILED });
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
    }, 
    (error) => {
        console.log(error);
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        });
    });
};


// enable or disable bad weather status
exports.add_bad_weather = function (request_data, response_data) 
{
    utils.check_request_params(request_data.body, [{ name: 'bad_weather_status', type: 'string' }, { name: 'delay_time', type: 'string' }], function (response) 
    {
        if (response.success) 
        {
            var request_data_body = request_data.body;

            var badWeather = new BadWeather(request_data_body);
            var bad_weather_status = request_data_body.bad_weather_status;
            var delay_time = request_data_body.delay_time;

            BadWeather.findOne().then((bad_weather_data) => {
                if (!bad_weather_data)
                {
                    badWeather.save().then((bad_weather_enable) => 
                    {
                        if (bad_weather_enable)
                        {
                            response_data.json({success: true, message: BAD_WEATHER_MESSAGE_CODE.BAD_WEATHER_ADDED_SUCCESSFULLY});
                        }
                        else
                        {
                            response_data.json({success: true, message: BAD_WEATHER_ERROR_CODE.BAD_WEATHER_ADD_FAILED});
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
                    BadWeather.findOneAndUpdate({}, request_data_body, {new : true}).then((update_bad_weather) => {

                        if (update_bad_weather)
                        {
                            update_bad_weather.bad_weather_status = bad_weather_status;
                            update_bad_weather.delay_time = delay_time;
                            update_bad_weather.save();
        
                            response_data.json({success: true, message: BAD_WEATHER_MESSAGE_CODE.BAD_WEATHER_UPDATED_SUCCESSFULLY});
                        } 
                        else
                        {
                            response_data.json({success: false, error_code: BAD_WEATHER_ERROR_CODE.BAD_WEATHER_UPDATE_FAILED});
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


//To get bad weather status
exports.get_bad_weather_status = function (request_data, response_data) {

    BadWeather.find({}, {_id: 1, bad_weather_status: 1, delay_time: 1}).then((bad_weather_data) => {

            if (bad_weather_data.length == 0) {
                response_data.json({ success: false, error_code: BAD_WEATHER_ERROR_CODE.BAD_WEATHER_DATA_NOT_FOUND });
            } else {
                response_data.json({
                    success: true,
                    message: BAD_WEATHER_MESSAGE_CODE.BAD_WEATHER_LIST_SUCCESSFULLY,
                    bad_weather_data: bad_weather_data
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






