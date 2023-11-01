require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var moment = require('moment-timezone');
var Country = require('mongoose').model('country');
var console = require('../utils/console');
var mongoose = require('mongoose');


// get_country_list
exports.get_country_list = function (request_data, response_data) {
    var countryList = require('country-data').callingCountries;
    response_data.json(countryList.all);
};

// get_timezone_list
exports.get_timezone_list = function (request_data, response_data) {
    var timeZones = moment.tz.names();
    response_data.json(timeZones);
};

exports.get_language_list = function (request_data, response_data) {
    const languages = require('../admin_controllers/languages') 
    response_data.json(languages.lang);
};

// get_country_data_list
exports.get_country_data_list = function (request_data, response_data) {
    Country.find({}, function (error, country_data) {
        response_data.json(country_data);
    });
};

// get_country_timezone
exports.get_country_timezone = function (request_data, response_data) {
    Country.findById(request_data.body.countryid, function (error, country_data) {
        response_data.json({country_timezone: country_data.country_timezone, country_code: country_data.country_code});
    });
};

// get_country_data
exports.get_country_data = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var countryname = request_data.body.countryname.replace(/'/g, '');
            Country.findOne({country_name: countryname}).then((country_detail) => {

                if (country_detail)
                {
                    response_data.json({success: false, _id: country_detail._id, country_code: country_detail.country_code,  error_code: COUNTRY_ERROR_CODE.COUNTRY_ALREADY_EXIST});
                } else
                {
                    var countriesAndTimezones = require('countries-and-timezones');

                    var lookup = require('country-data').lookup;
                    var currency_symbol1 = require('currency-symbol-map')
                    
                    lookup = lookup.countries({name: countryname})[0];
                    var currency = lookup.currencies;
                    currency = currency[0];
                    var currency_symbol = currency_symbol1.currencySymbolMap[currency];
                    var country_alpha2 = lookup.alpha2;


                    var country_timezone = countriesAndTimezones.getTimezonesForCountry(country_alpha2);

                    response_data.json({success: true, lookup: lookup, currency_symbol: currency_symbol, country_timezone: country_timezone});
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


exports.country_detail_for_admin = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var countryname = request_data.body.countryname.replace(/'/g, '');
            Country.findOne({country_name: countryname}).then((country_detail) => {
                var countriesAndTimezones = require('countries-and-timezones');
                var lookup = require('country-data').lookup;
                
                var currency_symbol1 = require('currency-symbol-map')
                lookup = lookup.countries({name: countryname})[0];
                var currency = lookup.currencies;
                currency = currency[0];
                var currency_symbol = currency_symbol1.currencySymbolMap[currency];
                var country_alpha2 = lookup.alpha2;
                var country_timezone = countriesAndTimezones.getTimezonesForCountry(country_alpha2);

                response_data.json({success: true, lookup: lookup, currency_symbol: currency_symbol, country_timezone: country_timezone});
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




// get_country_detail
exports.get_country_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'country_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            Country.findOne({_id: request_data_body.country_id}).then((country) => {
                if (!country) {
                    response_data.json({success: false, error_code: PRODUCT_ERROR_CODE.PRODUCT_DATA_NOT_FOUND});
                } else {
                    response_data.json({success: true,
                        message: PRODUCT_MESSAGE_CODE.PRODUCT_LIST_SUCCESSFULLY,
                        country: country
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


//country_toggle_change
exports.country_toggle_change = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'country_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var country_id = request_data_body.country_id;
            Country.findOne({_id: country_id}).then((country) => {
                if (country) {

                    if (request_data_body.is_business != undefined)
                    {
                        country.is_business = request_data_body.is_business;
                    }
                    if (request_data_body.is_referral_user != undefined)
                    {
                        country.is_referral_user = request_data_body.is_referral_user;
                    }
                    if (request_data_body.is_referral_store != undefined)
                    {
                        country.is_referral_store = request_data_body.is_referral_store;
                    }
                    if (request_data_body.is_referral_provider != undefined)
                    {
                        country.is_referral_provider = request_data_body.is_referral_provider;
                    }
                    country.save().then(() => {
                            response_data.json({success: true,
                                message: ITEM_MESSAGE_CODE.STATE_CHANGE_SUCCESSFULLY
                            });
                    }, (error) => {
                        console.log(error);
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        });
                    });
                } else
                {
                    response_data.json({success: false, error_code: ITEM_ERROR_CODE.ITEM_NOT_FOUND});
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

// add_country_data
exports.add_country_data = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'country_name', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            request_data.country_name = request_data.body.country_name.replace(/'/g, '');
            var add_country = new Country(request_data_body);
            var file_new_name = (add_country.country_name).split(' ').join('_').toLowerCase() + '.gif';
            var file_upload_path = 'flags/' + file_new_name;
            add_country.country_flag = file_upload_path;
            add_country.save().then(() => {
                    response_data.json({success: true, message: COUNTRY_MESSAGE_CODE.ADD_COUNTRY_SUCCESSFULLY});
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

// for view all country
exports.country_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {
  
            var tax_lookup = {
                $lookup: {
                    from: "taxes",
                    localField: "taxes",
                    foreignField: "_id",
                    as: "taxes_details"
                }
            }

            Country.aggregate([tax_lookup]).then((countries) => {
                if (countries.length == 0) {
                    response_data.json({success: false, error_code: COUNTRY_ERROR_CODE.COUNTRY_DETAILS_NOT_FOUND});
                } else {
                    response_data.json({success: true,
                        message: COUNTRY_MESSAGE_CODE.COUNTRY_LIST_SUCCESSFULLY,
                        countries: countries
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


// update_country
exports.update_country = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'country_id', type: 'string'}, {name: 'country_name', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var country_name = (request_data_body.country_name).trim();
            country_name = country_name.charAt(0).toUpperCase() + country_name.slice(1);
            request_data_body.country_name = country_name;
            var country_id = request_data_body.country_id;
            var taxes = []
            if (request_data_body.taxes) {
                request_data_body.taxes.forEach(tax => {
                    if (typeof tax == "string") {
                        taxes.push(mongoose.Types.ObjectId(tax))
                    } else {
                        taxes.push(mongoose.Types.ObjectId(tax._id))
                    }
                })
            }
            request_data_body.taxes = taxes
            Country.findOneAndUpdate({_id: country_id}, request_data_body, {new : true}).then((country_data) => {

                if (country_data)
                {
                    response_data.json({success: true, message: COUNTRY_MESSAGE_CODE.UPDATE_SUCCESSFULLY});
                } else
                {
                    response_data.json({success: false, error_code: COUNTRY_ERROR_CODE.UPDATE_FAILED});
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