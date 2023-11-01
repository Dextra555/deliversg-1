require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var PeakHour = require('mongoose').model('peak_hour');
var Store = require('mongoose').model('store');
var console = require('../utils/console');
const moment = require('moment');


//To enable peak hour status
exports.add_peak_hour_status = function (request_data, response_data) 
{
    utils.check_request_params(request_data.body, [], function (response) 
    {
        if (response.success) 
        {
            var request_data_body = request_data.body;
            var peakHour = new PeakHour(request_data_body);
                    
            PeakHour.findOne({ peak_hour_status: true,
                $or: [
                  { from_time: { $lte: request_data_body.from_time, $gte: request_data_body.to_time } },
                  { to_time: { $gte: request_data_body.from_time, $lte: request_data_body.to_time } },
                  { from_time: { $lte: request_data_body.from_time }, to_time: { $gte: request_data_body.to_time } }, ], }).then((peak_hour_data) => {
                    
                if (peak_hour_data)
                {
                    response_data.json({success: false, error_code: PEAK_HOUR_ERROR_CODE.PEAK_HOUR_TIME_ALREADY_EXISTS});
                }
                else
                {
                    peakHour.save().then((peak_hour_enable) => 
                    {
                        if (peak_hour_enable)
                        {
                            response_data.json({success: true, message: PEAK_HOUR_MESSAGE_CODE.PEAK_HOUR_ADDED_SUCCESSFULLY});
                        }
                        else
                        {
                            response_data.json({success: false, error_code: PEAK_HOUR_ERROR_CODE.PEAK_HOUR_ADD_FAILED});
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
}


//To get peak hour status
exports.get_peak_hour_status = function (request_data, response_data) 
{
    const currentDateTime = moment();
    console.log(currentDateTime);

    PeakHour.find({ peak_hour_status: true, from_time: { $lte: currentDateTime }, to_time: { $gte: currentDateTime } }, {_id: 1, from_time: 1, to_time: 1, peak_hour_fee: 1, delay_time: 1, peak_hour_status: 1, unique_id: 1}).then((peak_hours_status) => 
    {
        if (peak_hours_status.length == 0) 
        {
            var peak_hours_status = false;

            response_data.json({ success: false, error_code: PEAK_HOUR_ERROR_CODE.PEAK_HOUR_DATA_NOT_FOUND
            });
        } 
        else
        {
            response_data.json({
                success: true,
                message: PEAK_HOUR_MESSAGE_CODE.GET_SUB_CATEGORY_SUCCESSFULLY,
                peak_hours_status: peak_hours_status
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


//To get peak hour status for web
exports.get_peak_hour_status_web = function (request_data, response_data) 
{
    const currentDateTime = moment();
    console.log(currentDateTime);

    PeakHour.find({ peak_hour_status: true, from_time: { $lte: currentDateTime }, to_time: { $gte: currentDateTime } }, {_id: 1, from_time: 1, to_time: 1, peak_hour_fee: 1, delay_time: 1, peak_hour_status: 1, unique_id: 1}).then((peak_hours_status) => 
    {
        if (peak_hours_status.length == 0) 
        {
            response_data.json({ success: false, error_code: PEAK_HOUR_ERROR_CODE.PEAK_HOUR_DATA_NOT_FOUND,
                peak_hours_status: [
                    {
                        peak_hour_status: false
                    }
                ] 
            });
        } 
        else
        {
            response_data.json({
                success: true,
                message: PEAK_HOUR_MESSAGE_CODE.GET_SUB_CATEGORY_SUCCESSFULLY,
                peak_hours_status: peak_hours_status
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

//To get all peak hour status
exports.get_all_peak_hour_status = function (request_data, response_data) 
{
    const currentDateTime = moment();
    console.log(currentDateTime);

    PeakHour.find({}, {_id: 1, from_time: 1, to_time: 1, peak_hour_fee: 1, delay_time: 1, peak_hour_status: 1, unique_id: 1}).sort({ unique_id: -1 }).then((peak_hours) => 
    {
        if (peak_hours.length == 0) 
        {
            response_data.json({ success: false, error_code: PEAK_HOUR_ERROR_CODE.PEAK_HOUR_DATA_NOT_FOUND });
        } 
        else
        {
            response_data.json({
                success: true,
                message: PEAK_HOUR_MESSAGE_CODE.GET_SUB_CATEGORY_SUCCESSFULLY,
                peak_hours: peak_hours
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


//delete deliver fee
exports.delete_peak_hour = function (request_data, response_data)
{
    utils.check_request_params(request_data.body, [], function (response) 
    {
        if (response.success) 
        {
            var request_data_body = request_data.body;

            PeakHour.deleteOne({_id:request_data_body.id}).then((peak_hour_delete) => {

                if (peak_hour_delete)
                {
                    response_data.json({ success: true, message: PEAK_HOUR_MESSAGE_CODE.PEAK_HOUR_DELETED });
                }
                else
                {
                    response_data.json({ success: false, error_code: PEAK_HOUR_ERROR_CODE.PEAK_HOUR_DELETE_FAILED });
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