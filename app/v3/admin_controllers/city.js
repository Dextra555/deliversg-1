require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var City = require('mongoose').model('city');
var CityZone = require('mongoose').model('cityzone');
var Payment_gateway = require('mongoose').model('payment_gateway');
var Country = require('mongoose').model('country');
var Delivery = require('mongoose').model('delivery');
var mongoose = require('mongoose');
var fs = require('fs');
var DOMParser = require('xmldom').DOMParser;
var togeojson = require('togeojson');
var console = require('../utils/console');


// update_bad_weather
exports.update_bad_weather_status = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'city_id', type: 'string'}, {name: 'bad_weather', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var city_id = request_data_body.city_id;
            var bad_weather = request_data_body.bad_weather;
            
            City.findOneAndUpdate({_id: city_id}, request_data_body, {new : true}).then((city_data) => {

                if (city_data)
                {
                    city_data.bad_weather = bad_weather;
                    city_data.save();

                    response_data.json({success: true, message: CITY_MESSAGE_CODE.UPDATE_SUCCESSFULLY});
                } else
                {
                    response_data.json({success: false, error_code: CITY_ERROR_CODE.UPDATE_FAILED});
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

//To get bad weather condition
exports.get_bad_weather_status = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'city_id', type: 'string' }], function (response) 
    {
        if (response.success) {

            var request_data_body = request_data.body;
            City.findOne({_id: request_data_body.city_id}, {bad_weather: 1, city_name: 1, city_code: 1, timezone: 1}).then((country) => {
                if (!country) {
                    response_data.json({success: false, error_code: CITY_ERROR_CODE.CITY_DETAILS_NOT_FOUND});
                } else {
                    response_data.json({success: true,
                        message: CITY_MESSAGE_CODE.CITY_LIST_SUCCESSFULLY,
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
}


// get_server_country_list
exports.get_server_country_list = function (request_data, response_data) {
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

            Country.aggregate([tax_lookup]).then((country_list) => {
                if (country_list.length == 0) {
                    response_data.json({success: false, error_code: COUNTRY_ERROR_CODE.COUNTRY_DETAILS_NOT_FOUND});
                } else {
                    var delivery = [];
                    var payment_gateway = [];

                    Delivery.find({}).then((delivery_list) => {
                        if (delivery_list.length > 0) {
                            delivery = delivery_list;
                        }

                        Payment_gateway.find({}).then((payment_gateway_list) => {
                            if (payment_gateway_list.length > 0) {
                                payment_gateway = payment_gateway_list;
                            }
                            response_data.json({success: true,
                                message: COUNTRY_MESSAGE_CODE.COUNTRY_LIST_SUCCESSFULLY,
                                countries: country_list,
                                 delivery: delivery,
                                  payment_gateway: payment_gateway
                                });
                        }, (error) => {
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });

                    }, (error) => {
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        });
                    });
                }
            }, (error) => {
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

// add_city_data
exports.add_city_data = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'city_name', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var city_name = (request_data_body.city_name).trim();
            city_name = city_name.charAt(0).toUpperCase() + city_name.slice(1);
            request_data_body.city_name = city_name;

            request_data_body.city_lat_long = [request_data_body.city_lat, request_data_body.city_lng];

            var city = new City(request_data_body);
            city.save().then(() => {
                request_data_body.city_zone.forEach(function (zone) {
                    var city_zone = new CityZone({
                        city_id: city._id,
                        title: zone.title,
                        kmlzone: zone.kmlzone,
                        color: zone.color,
                        index: zone.index
                    });
                    city_zone.save();
                });
                response_data.json({success: true, city_id: city._id, message: CITY_MESSAGE_CODE.ADD_CITY_SUCCESSFULLY});
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



/// for view all city
exports.city_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var country_query = {
                $lookup:
                        {
                            from: "countries",
                            localField: "country_id",
                            foreignField: "_id",
                            as: "country_details"
                        }
            };

            var array_to_json_country_query = {$unwind: "$country_details"};

            City.aggregate([country_query, array_to_json_country_query]).then((cities) => {
                if (cities.length == 0) {
                    response_data.json({success: false, error_code: CITY_ERROR_CODE.CITY_DETAILS_NOT_FOUND
                    });
                } else {
                    response_data.json({success: true,
                        message: CITY_MESSAGE_CODE.CITY_LIST_SUCCESSFULLY,
                        cities: cities

                    });
                }
            }, (error) => {
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

/// get city_list_search_sort 
exports.city_list_search_sort = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var city_query = {
                $lookup:
                        {
                            from: "cities",
                            localField: "_id",
                            foreignField: "country_id",
                            as: "cities"
                        }

            };

            Country.aggregate([city_query]).then((countries) => {
                if (countries.length == 0) {
                    response_data.json({success: false, error_code: ITEM_ERROR_CODE.ITEM_NOT_FOUND});
                } else {
                    response_data.json({success: true,
                        message: ITEM_MESSAGE_CODE.ITEM_LIST_SUCCESSFULLY,
                        countries: countries
                    });
                }
            }, (error) => {
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



// get_city_detail
exports.get_city_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'city_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var city_condition = {"$match": {'_id': {$eq: mongoose.Types.ObjectId(request_data_body.city_id)}}};
            var country_query = {
                $lookup:
                        {
                            from: "countries",
                            localField: "country_id",
                            foreignField: "_id",
                            as: "country_details"
                        }
            };
            var array_to_json_country_query = {$unwind: "$country_details"};
            City.aggregate([city_condition, country_query, array_to_json_country_query], function (error, city) {

                CityZone.find({'city_id': city[0]._id}).then((city_zone) => {
                    if (city.length == 0) {

                        response_data.json({success: false, error_code: SERVICE_ERROR_CODE.SERVICE_DATA_NOT_FOUND});
                    } else {

                        response_data.json({
                            success: true, city_zone: city_zone,
                            message: PRODUCT_MESSAGE_CODE.PRODUCT_LIST_SUCCESSFULLY,
                            city: city[0]
                        });
                    }
                }, (error) => {
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                });
            });
        } else {
            response_data.json(response);
        }
    });
};

/// check city
exports.check_city = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'city_name', type: 'string'}, {name: 'city_code', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            City.findOne({country_id: request_data_body.country_id, city_name: (request_data_body.city_name).trim(), city_code: (request_data_body.city_code).trim()}).then((city) => {
                if (!city) {
                    response_data.json({success: true,
                        message: CITY_MESSAGE_CODE.CITY_LIST_SUCCESSFULLY

                    });
                } else {
                    response_data.json({success: false, error_code: CITY_ERROR_CODE.CITY_ADD_FAILED});

                }
            }, (error) => {
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

// add_city_zone
exports.add_city_zone = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var city_id = request_data_body.city_id;

            City.findOne({_id: city_id}).then((city_detail) => {
                var files = request_data.files;
                if (request_data.files && request_data.files.length > 0) {
                    var kml = new DOMParser().parseFromString(fs.readFileSync(files[0].path, 'utf8'));
                    var convertedWithStyles = togeojson.kml(kml, {styles: true});
                    var size = convertedWithStyles.features.length;
                    var i = 0;
                    ;
                    convertedWithStyles.features.forEach(function (kmldata) {
                        var city_zone = new CityZone({
                            city_id: city_id,
                            city_unique_id: city_detail.unique_id,
                            title: kmldata.properties.name,
                            kmlzone: kmldata.geometry.coordinates[0],
                            styleUrl: kmldata.properties.styleUrl,
                            styleHash: kmldata.properties.styleHash,
                            description: kmldata.properties.description,
                            stroke: kmldata.properties.stroke,
                            stroke_opacity: 1,
                            stroke_width: 1.2,
                            fill: kmldata.properties.fill,
                            fill_opacity: 0.30196078431372547,
                        });

                        city_zone.save().then(() => {
                            if (i == size - 1) {
                                response_data.json({success: true});
                            } else {
                                i++;
                            }
                        }, (error) => {
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });

                    });
                } else {
                    response_data.json({success: true});
                }
            }, (error) => {
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

// update_city_zone
exports.update_city_zone = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var city_id = request_data_body.city_id;

            City.findOne({_id: city_id}).then((city_detail) => {
                var files = request_data.files;
                if (request_data.files && request_data.files.length > 0) {
                    var kml = new DOMParser().parseFromString(fs.readFileSync(files[0].path, 'utf8'));
                    var convertedWithStyles = togeojson.kml(kml, {styles: true});
                    var size = convertedWithStyles.features.length;
                    var i = 0;
                    ;
                    convertedWithStyles.features.forEach(function (kmldata) {

                        CityZone.findOne({city_id: city_id, title: kmldata.properties.name}).then((city_zone_detail) => {
                            if (city_zone_detail)
                            {
                                city_zone_detail.kmlzone = kmldata.geometry.coordinates[0];
                                city_zone_detail.styleUrl = kmldata.properties.styleUrl;
                                city_zone_detail.styleHash = kmldata.properties.styleHash;
                                city_zone_detail.description = kmldata.properties.description;
                                city_zone_detail.stroke = kmldata.properties.stroke;
                                city_zone_detail.fill = kmldata.properties.fill;
                                city_zone_detail.save();
                            } else {
                                var city_zone = new CityZone({
                                    city_id: city_id,
                                    title: kmldata.properties.name,
                                    kmlzone: kmldata.geometry.coordinates[0],
                                    styleUrl: kmldata.properties.styleUrl,
                                    styleHash: kmldata.properties.styleHash,
                                    description: kmldata.properties.description,
                                    stroke: kmldata.properties.stroke,
                                    stroke_opacity: 1,
                                    stroke_width: 1.2,
                                    fill: kmldata.properties.fill,
                                    fill_opacity: 0.30196078431372547,
                                });
                                city_zone.save();
                            }
                        }, (error) => {
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });

                        if (i == size - 1) {
                            response_data.json({success: true});
                        } else {
                            i++;
                        }

                    });
                } else {
                    response_data.json({success: true});
                }
            }, (error) => {
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

// update_city
exports.update_city = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'city_name', type: 'string'}, {name: 'city_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var city_id = request_data_body.city_id;
            var city_name = (request_data_body.city_name).trim();
            city_name = city_name.charAt(0).toUpperCase() + city_name.slice(1);
            request_data_body.city_name = city_name;
            request_data_body.city_lat_long = [request_data_body.city_lat, request_data_body.city_lng];

            City.findOneAndUpdate({_id: city_id}, request_data_body, {new : true}).then((city_data) => {

                if (city_data)
                {
                    request_data_body.city_zone.forEach(function (zone) {
                        if (zone._id) {
                            CityZone.findOneAndUpdate({_id: zone._id}, zone).then((city_zone_detail) => {


                            });
                        } else {
                            var city_zone = new CityZone({
                                city_id: city_id,
                                title: zone.title,
                                kmlzone: zone.kmlzone,
                                color: zone.color,
                                index: zone.index
                            });
                            city_zone.save();
                        }
                    })

                    response_data.json({success: true, message: CITY_MESSAGE_CODE.UPDATE_SUCCESSFULLY});

                } else
                {
                    response_data.json({success: false, error_code: CITY_ERROR_CODE.UPDATE_FAILED});
                }
            }, (error) => {
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

//toggle_change
exports.toggle_change = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'city_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var city_id = request_data_body.city_id;
            City.findOne({_id: city_id}).then((city) => {
                if (city) {
                    if (request_data_body.is_business != undefined)
                    {
                        city.is_business = request_data_body.is_business;
                    }
                    if (request_data_body.is_other_payment_mode != undefined)
                    {
                        city.is_other_payment_mode = request_data_body.is_other_payment_mode;
                    }
                    if (request_data_body.is_cash_payment_mode != undefined)
                    {
                        city.is_cash_payment_mode = request_data_body.is_cash_payment_mode;
                    }
                    city.save().then(() => {

                            response_data.json({success: true,
                                message: ITEM_MESSAGE_CODE.STATE_CHANGE_SUCCESSFULLY
                            });
                        
                    });
                } else
                {
                    response_data.json({success: false, error_code: ITEM_ERROR_CODE.ITEM_NOT_FOUND});
                }
            }, (error) => {
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