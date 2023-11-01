require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
var utils = require('../../utils/utils');
var console = require('../../utils/console');



var Country = require('mongoose').model('country');

//// get country list
exports.get_country_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {
            Country.find({is_business: true}).then((country) => {
                if (country.length == 0) {
                    response_data.json({success: false, error_code: COUNTRY_ERROR_CODE.COUNTRY_DETAILS_NOT_FOUND});
                } else {
                    response_data.json({success: true,
                        message: COUNTRY_MESSAGE_CODE.COUNTRY_LIST_SUCCESSFULLY,
                        countries: country
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

exports.check_country_exists = function (request_data, response_data) {
    Country.find({country_phone_code: request_data.body.country_phone_code}).then(country => {
        console.log(country)
        if(country.length > 0){
            response_data.json({success: true, country_id: country[0]._id, message: 'country already exists'})
        } else {
            var request_data_body = request_data.body;
            request_data.country_name = request_data.body.country_name.replace(/'/g, '');
            var add_country = new Country(request_data_body);
            var file_new_name = (add_country.country_name).split(' ').join('_').toLowerCase() + '.gif';
            var file_upload_path = 'flags/' + file_new_name;
            add_country.country_flag = file_upload_path;
            add_country.save().then((country) => {
                response_data.json({
                    success: true,
                    _id: country._id,
                    country_code: country.country_code,
                    message: COUNTRY_MESSAGE_CODE.ADD_COUNTRY_SUCCESSFULLY
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
}
