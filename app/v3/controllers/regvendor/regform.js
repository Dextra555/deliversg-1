// const model = require("../../../models/regvendor/register_vendor");
const vendor = require("../../../models/regvendor/register_vendor");

const vendorMail = require('./vendor_mail');
var Setting = require('mongoose').model('setting');
const express = require('express');
const router = express.Router();
// const validator = require('validator');

//user.js start
require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
require('../../utils/console');
let utils = require('../../utils/utils');
let emails = require('../../controllers/email_sms/emails');
let promo_code_controller = require('../../controllers/user/promo_code');
let wallet_history = require('../../controllers/user/wallet');
let card_stripe = require('../../controllers/user/card');
let mongoose = require('mongoose');
let Product = require('mongoose').model('product');
let User = require('mongoose').model('user');
let Card = require('mongoose').model('card');
let Country = require('mongoose').model('country');
let Provider = require('mongoose').model('provider');
let Store = require('mongoose').model('store');
let City = require('mongoose').model('city');
let Service = require('mongoose').model('service');
let Order = require('mongoose').model('order');
let Payment_gateway = require('mongoose').model('payment_gateway');
let Order_payment = require('mongoose').model('order_payment');
let Promo_code = require('mongoose').model('promo_code');
let Cart = require('mongoose').model('cart');
var DeliverFee = require('mongoose').model('deliver_fee');
let Review = require('mongoose').model('review');
let Referral_code = require('mongoose').model('referral_code');
let Vehicle = require('mongoose').model('vehicle');
let Delivery = require('mongoose').model('delivery');
let PeakHour = require('mongoose').model('peak_hour');
let Advertise = require('mongoose').model('advertise');
let Item = require('mongoose').model('item');
let Request = require('mongoose').model('request');
let geolib = require('geolib');
let console = require('../../utils/console');
const { request } = require('express');
const admin = require('../../../models/admin/admin');
const { match } = require('assert');
const { Console, log } = require('console');
let ProductGroup = require('mongoose').model('ProductGroup');
let Cancellation_reason = require('mongoose').model('cancellation_reason');
const moment = require('moment');
//user.js end
const fetch = require('node-fetch'); 
var pad = require('pad-left');



//add file s3 bucket 
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { error } = require("../../utils/console");


exports.post_delivery_list_for_nearest_city = (request_data, response_data) => {
    utils.check_request_params(request_data.body, [{ name: 'country', type: 'string' }, { name: 'latitude' }, { name: 'longitude' }], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let country = request_data_body.country;
            let server_time = new Date();
            let country_code = request_data_body.country_code;
            let country_code_2 = request_data_body.country_code_2;

            Country.findOne({ $and: [{ $or: [{ country_name: country }, { country_code: country_code }, { country_code_2: country_code_2 }] }, { is_business: true }] }).then((country_data) => {

                if (!country_data) {
                    response_data.json({ success: false, error_code: COUNTRY_ERROR_CODE.BUSINESS_NOT_IN_YOUR_COUNTRY });
                } else {

                    let city_lat_long = [request_data_body.latitude, request_data_body.longitude];
                    let country_id = country_data._id;
                    City.find({ country_id: country_id, is_business: true }).then((cityList) => {

                        let size = cityList.length;
                        let count = 0;
                        if (size == 0) {
                            response_data.json({ success: false, error_code: CITY_ERROR_CODE.BUSINESS_NOT_IN_YOUR_CITY });
                        } else {
                            let finalCityId = null;
                            let finalDistance = 1000000;

                            cityList.forEach(function (city_detail) {
                                count++;
                                if (city_detail.is_use_radius) {
                                    let cityLatLong = city_detail.city_lat_long;
                                    let distanceFromSubAdminCity = utils.getDistanceFromTwoLocation(city_lat_long, cityLatLong);
                                    let cityRadius = city_detail.city_radius;

                                    if (distanceFromSubAdminCity < cityRadius) {
                                        if (distanceFromSubAdminCity < finalDistance) {
                                            finalDistance = distanceFromSubAdminCity;
                                            finalCityId = city_detail._id;
                                        }
                                    }

                                } else {
                                    let store_zone = false;
                                    if (city_detail.city_locations && city_detail.city_locations.length > 0) {
                                        store_zone = geolib.isPointInPolygon(
                                            { latitude: city_lat_long[0], longitude: city_lat_long[1] },
                                            city_detail.city_locations);
                                    }
                                    if (store_zone) {
                                        finalCityId = city_detail._id;
                                        count = size;
                                    }
                                }


                                if (count == size) {
                                    if (finalCityId != null) {
                                        let city_id = finalCityId;

                                        let cityid_condition = { $match: { '_id': { $eq: city_id } } };

                                        City.aggregate([cityid_condition]).then((city) => {
                                            if (city.length == 0) {
                                                response_data.json({
                                                    success: false,
                                                    error_code: DELIVERY_ERROR_CODE.DELIVERY_DATA_NOT_FOUND_IN_YOUR_CITY
                                                });
                                            } else {
                                                if (city[0].is_business) {

                                                    if (!request_data_body.is_courier) {
                                                        let ads = [];
                                                        let condition = { "$match": { $and: [{ "_id": { $in: city[0].deliveries_in_city } }, { is_business: { $eq: true } }] } };

                                                        let project = {
                                                            $project:
                                                            {
                                                                delivery_name: { $ifNull: [{ $arrayElemAt: ["$delivery_name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$delivery_name", 0] }, ""] }] },
                                                                description: { $ifNull: [{ $arrayElemAt: ["$description", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$description", 0] }, ""] }] },
                                                                image_url: 1,
                                                                icon_url: 1,
                                                                map_pin_url: 1,
                                                                delivery_type: 1,
                                                                is_business: 1,
                                                                is_store_can_create_group: 1,
                                                                sequence_number: 1,
                                                                famous_products_tags: 1,
                                                                unique_id: 1,
                                                                is_provide_table_booking: 1
                                                            }
                                                        }
                                                        let array_to_json_famous_products_tags_detail = {
                                                            $unwind: {
                                                                path: "$famous_products_tags",
                                                                preserveNullAndEmptyArrays: true
                                                            }
                                                        };
                                                        let group = {
                                                            $group:
                                                            {
                                                                _id: '$_id',
                                                                is_provide_table_booking: { $first: '$is_provide_table_booking' },
                                                                delivery_name: { $first: '$delivery_name' },
                                                                description: { $first: '$description' },
                                                                image_url: { $first: '$image_url' },
                                                                icon_url: { $first: '$icon_url' },
                                                                map_pin_url: { $first: '$map_pin_url' },
                                                                delivery_type: { $first: '$delivery_type' },
                                                                is_business: { $first: '$is_business' },
                                                                is_store_can_create_group: { $first: '$is_store_can_create_group' },
                                                                sequence_number: { $first: '$sequence_number' },
                                                                famous_products_tags: { $addToSet: { $ifNull: [{ $arrayElemAt: ["$famous_products_tags", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$famous_products_tags", 0] }, "$famous_products_tags"] }] } },
                                                                unique_id: { $first: '$unique_id' }
                                                            }
                                                        }
                                                        let sort = { "$sort": {} };
                                                        sort["$sort"]['sequence_number'] = parseInt(1);
                                                        Delivery.aggregate([condition, sort, project, array_to_json_famous_products_tags_detail, group, sort], function (error, delivery) {
                                                            console.log(error);
                                                            if (delivery && delivery.length == 0) {
                                                                response_data.json({
                                                                    success: false,
                                                                    error_code: DELIVERY_ERROR_CODE.DELIVERY_DATA_NOT_FOUND_IN_YOUR_CITY
                                                                });
                                                            } else {

                                                                let condition = {
                                                                    $match: {
                                                                        $and: [{ country_id: { $eq: country_id } }, { ads_for: { $eq: ADS_TYPE.FOR_DELIVERY_LIST } },
                                                                        { is_ads_visible: { $eq: true } }, { is_ads_approve_by_admin: { $eq: true } }, { $or: [{ city_id: { $eq: city[0]._id } }, { city_id: { $eq: mongoose.Types.ObjectId(ID_FOR_ALL.ALL_ID) } }] }]
                                                                    }
                                                                }
                                                                let store_query = {
                                                                    $lookup:
                                                                    {
                                                                        from: "stores",
                                                                        localField: "store_id",
                                                                        foreignField: "_id",
                                                                        as: "store_detail"
                                                                    }
                                                                };
                                                                let array_to_json_store_detail = {
                                                                    $unwind: {
                                                                        path: "$store_detail",
                                                                        preserveNullAndEmptyArrays: true
                                                                    }
                                                                };

                                                                let store_condition = { $match: { $or: [{ 'is_ads_redirect_to_store': { $eq: false } }, { $and: [{ 'is_ads_redirect_to_store': { $eq: true } }, { 'store_detail.is_approved': { $eq: true } }, { 'store_detail.is_business': { $eq: true } }] }] } }

                                                                let project = {
                                                                    $project: {
                                                                        _id: '$_id',
                                                                        ads_detail: 1,
                                                                        store_id: 1,
                                                                        image_url: 1,
                                                                        is_ads_redirect_to_store: 1,
                                                                        is_ads_have_expiry_date: 1,
                                                                        image_for_banner: 1,
                                                                        image_for_mobile: 1,
                                                                        expiry_date: 1,
                                                                        "store_detail": {
                                                                            $cond: {
                                                                                if: { $ifNull: ["$store_detail", false] }, then: {
                                                                                    "_id": "store_detail._id",
                                                                                    "languages_supported": "$store_detail.languages_supported",
                                                                                    "is_use_item_tax": "$store_detail.is_use_item_tax",
                                                                                    "item_tax": "$store_detail.item_tax",
                                                                                    "is_provide_pickup_delivery": "$store_detail.is_provide_pickup_delivery",
                                                                                    "delivery_time_max": "$store_detail.delivery_time_max",
                                                                                    "delivery_radius": "$store_detail.delivery_radius",
                                                                                    "is_taking_schedule_order": "$store_detail.is_taking_schedule_order",
                                                                                    "is_store_busy": "$store_detail.is_store_busy",
                                                                                    "famous_products_tags": "$store_detail.famous_products_tags",
                                                                                    "currency": "$store_detail.currency",
                                                                                    "delivery_time": "$store_detail.delivery_time",
                                                                                    "price_rating": "$store_detail.price_rating",
                                                                                    "country_phone_code": "$store_detail.country_phone_code",
                                                                                    "user_rate": "$store_detail.user_rate",
                                                                                    "store_time": "$store_detail.store_time",
                                                                                    "email": "$store_detail.email",
                                                                                    "address": "$store_detail.address",
                                                                                    "image_url": "$store_detail.image_url",
                                                                                    "user_rate_count": "$store_detail.user_rate_count",
                                                                                    "website_url": "$store_detail.website_url",
                                                                                    "phone": "$store_detail.phone",
                                                                                    "_id": "$store_detail._id",
                                                                                    "slogan": "$store_detail.slogan",
                                                                                    "store_delivery_type_id": "$store_detail.store_delivery_id",
                                                                                    "location": "$store_detail.location",
                                                                                    "name": { $ifNull: [{ $arrayElemAt: ["$store_detail.name", Number(request_data.headers.lang)] }, { $ifNull: [{ $arrayElemAt: ["$store_detail.name", 0] }, ""] }] }
                                                                                }, else: null
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                                Advertise.aggregate([condition, store_query, array_to_json_store_detail, store_condition, project], function (error, advertise) {
                                                                    console.log(error);
                                                                    if (city[0] && city[0].is_ads_visible && country_data && country_data.is_ads_visible) {
                                                                        ads = advertise;
                                                                    }

                                                                    let lang_code = request_data.headers.lang;
                                                                    // let index = delivery.length - 1

                                                                    response_data.json({
                                                                        success: true,
                                                                        message: DELIVERY_MESSAGE_CODE.DELIVERY_LIST_FOR_NEAREST_CITY_SUCCESSFULLY,
                                                                        city: city[0],
                                                                        deliveries: delivery,
                                                                        ads: ads,
                                                                        is_allow_contactless_delivery: false,
                                                                        is_allow_pickup_order_verification: false,
                                                                        city_data: request_data_body,
                                                                        currency_code: country_data.currency_code,
                                                                        is_distance_unit_mile: country_data.is_distance_unit_mile,
                                                                        country_id: country_data._id,
                                                                        currency_sign: country_data.currency_sign,
                                                                        server_time: server_time
                                                                    });


                                                                });
                                                            }
                                                        })
                                                    } else {

                                                        let lang_code = request_data.headers.lang;
                                                        let index = delivery.length - 1
                                                        delivery.forEach((delivery_data, delivery_data_index) => {
                                                            if (!delivery_data.delivery_name[lang_code] || delivery_data.delivery_name[lang_code] == '') {
                                                                delivery_data.delivery_name = delivery_data.delivery_name['en'];
                                                            } else {
                                                                delivery_data.delivery_name = delivery_data.delivery_name[lang_code];
                                                            }

                                                            if (delivery_data_index == index) {

                                                                response_data.json({
                                                                    success: true,
                                                                    message: DELIVERY_MESSAGE_CODE.DELIVERY_LIST_FOR_NEAREST_CITY_SUCCESSFULLY,
                                                                    city: city[0],
                                                                    is_allow_contactless_delivery: setting_detail.is_allow_contactless_delivery,
                                                                    is_allow_pickup_order_verification: setting_detail.is_allow_pickup_order_verification,
                                                                    city_data: request_data_body,
                                                                    currency_code: country_data.currency_code,
                                                                    currency_sign: country_data.currency_sign,
                                                                    country_id: country_data._id,
                                                                    server_time: server_time
                                                                });
                                                            }
                                                        })
                                                    }
                                                } else {
                                                    response_data.json({
                                                        success: false,
                                                        error_code: DELIVERY_ERROR_CODE.DELIVERY_DATA_NOT_FOUND_IN_YOUR_CITY
                                                    });
                                                }
                                            }
                                        }, (error) => {
                                            console.log(error)
                                            response_data.json({
                                                success: false,
                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                            });
                                        });

                                    } else {
                                        response_data.json({
                                            success: false,
                                            error_code: CITY_ERROR_CODE.BUSINESS_NOT_IN_YOUR_CITY
                                        });
                                    }
                                }

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




}


    


    // const apiKey = 'AIzaSyBViKhoMt_4-rQ92byigbEanQEAmVJS1aA';
    // const origin = '1.3063779,103.84973'; // Lat,Lng format
    // const destination = '1.3851281,103.7459494';
    
    // const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${apiKey}`;
    
   
    // exports.check=()=>{ 
    //      fetch(url)

    //     .then(response => response.json())
    //     .then(data => {
    //       const distance = data.rows[0].elements[0].distance.text;
    //       const duration = data.rows[0].elements[0].duration.text;
             
    //       console.log( duration);
    //       console.log( duration);
    //     })
        
    // };
    
   
    

      






//Configure AWS SDK with your credentials and region here




AWS.config.update({
    accessKeyId: 'AKIAZK7M2OGTYIT7AEPE',
    secretAccessKey: 'RTbbOVcPSgN6KMPYEqqMUDHvD4nnUdXwyAXORWL9',
    // region: 'your_aws_region', // Specify your AWS region here
});
const s3 = new AWS.S3();



//Register Vendor and user
exports.vendor_registration = async (request_data, response_data) => {
    const {
        company_name,
        uen,
        company_website,
        industry_type,
        company_representative,
        mobile_no,
        email_address,
        mailing_address,
        any_entity_in_overseas,
        is_pdpa_consent_verified,
        is_bankcrupty_consent_verified,
        approve,
    } = request_data.body;


    if (!request_data.files || !request_data.files[0].path) {
        return response_data.status(400).json({ success: false, msg: 'No image data received.' });
    }

    const fieldName = request_data.files[0].path;
    const extname = path.extname(request_data.files[0].originalname);
    const imagePath = path.join(__dirname, 'uploads', 'vendor_image_' + Date.now() + extname);

    fs.readFile(fieldName, (err, fileBuffer) => {
        if (err) {
            return response_data.status(500).json({ success: false, msg: 'Error reading the uploaded file.' });
        }

        const params = {
            Bucket: 'deliversgbucket',
            Key: `vendor/vendor_image_${Date.now()}` + extname,
            Body: fileBuffer,
        };

        s3.upload(params, (s3Err, s3Data) => {
            if (s3Err) {
                console.error('Error uploading to S3:', s3Err);
                return response_data.status(500).json({ success: false, msg: 'Error uploading the image to S3.' });
            }

            const data = new vendor({
                company_name,
                uen,
                company_website,
                industry_type,
                company_representative,
                mobile_no,
                email_address,
                mailing_address,
                any_entity_in_overseas,
                is_pdpa_consent_verified,
                is_bankcrupty_consent_verified,
                approve,
                acra_pro_file: s3Data.Location,
            });

            data.save()

                .then(() => {
                    return response_data.json({ success: true, msg: 'Vendor Created Successfully.',vendor_id:data._id });

                })
                .catch((err) => {
                    return response_data.json({ success: false, msg: err.message });
                });
            vendor_id = data._id;


            //start user.js

            utils.check_request_params(request_data.body, [{ name: 'email_address', type: 'string' }/*, { name: 'country_id', type: 'string' }*/, { name: 'mobile_no', type: 'string' },
            { name: 'country_phone_code', type: 'string' }, { name: 'company_name', type: 'string' }], function (response) {


                if (response.success) {
                    let request_data_body = request_data.body;
                    // console.log(request_data_body)
                    let social_id = request_data_body.social_id;
                    let cart_unique_token = request_data_body.cart_unique_token;
                    if (request_data_body.is_email_verified == "true") {
                        request_data_body.is_email_verified = true;
                    }
                    if (request_data_body.is_phone_number_verified == "true") {
                        request_data_body.is_phone_number_verified = true;
                    }
                    if (request_data_body.is_email_verified == "false") {
                        request_data_body.is_email_verified = false;
                    }
                    if (request_data_body.is_phone_number_verified == "false") {
                        request_data_body.is_phone_number_verified = false;
                    }
                    let social_id_array = [];

                    if (social_id == undefined || social_id == null || social_id == "") {
                        social_id = null;
                    } else {
                        social_id_array.push(social_id);
                    }

                    Country.findOne({ country_code: request_data_body.country_code }).then((country) => {
                        var country_id = null;
                        if (country) {
                            country_id = country._id
                        }
                        User.findOne({ social_ids: { $all: social_id_array } }).then((user_detail) => {

                            if (user_detail) {
                                response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_ALREADY_REGISTER_WITH_SOCIAL });

                            } else {
                                User.findOne({ email: request_data_body.email_address }).then((user_detail) => {

                                    if (user_detail) {
                                        if (social_id != null && user_detail.social_ids.indexOf(social_id) < 0) {
                                            user_detail.social_ids.push(social_id);
                                            user_detail.save();
                                            return response_data.json({
                                                success: true,
                                                message: USER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                                /*minimum_phone_number_length: country.minimum_phone_number_length,
                                                maximum_phone_number_length: country.maximum_phone_number_length,*/
                                                user: user_detail

                                            });
                                        } else {
                                            if (request_data_body.is_qr_code_scanned) {
                                                return response_data.json({
                                                    success: true,
                                                    message: USER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                                    user: user_detail
                                                });
                                            }
                                            return response_data.json({
                                                success: false,
                                                error_code: USER_ERROR_CODE.EMAIL_ALREADY_REGISTRED
                                            });
                                        }
                                    } else {
                                        User.findOne({ phone: request_data_body.mobile_no }).then((user_detail) => {
                                            if (user_detail) {

                                                if (social_id != null && user_detail.social_ids.indexOf(social_id) < 0) {
                                                    user_detail.social_ids.push(social_id);
                                                    user_detail.save();
                                                    response_data.json({
                                                        success: true,
                                                        message: USER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                                        /*minimum_phone_number_length: country.minimum_phone_number_length,
                                                        maximum_phone_number_length: country.maximum_phone_number_length,*/
                                                        //user: user_detail
                                                    });

                                                } else {
                                                    if (request_data_body.is_qr_code_scanned) {
                                                        return response_data.json({
                                                            success: true,
                                                            message: USER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                                            //user: user_detail
                                                        });
                                                    }
                                                    return response_data.json({
                                                        success: false,
                                                        error_code: USER_ERROR_CODE.PHONE_NUMBER_ALREADY_REGISTRED
                                                    });
                                                }

                                            } else {

                                                let first_name = utils.get_string_with_first_letter_upper_case(request_data_body.company_name);
                                                let last_name = utils.get_string_with_first_letter_upper_case(request_data_body.last_name);
                                                let city = utils.get_string_with_first_letter_upper_case(request_data_body.city);
                                                let server_token = utils.generateServerToken(32);

                                                let user_data = new User({
                                                    user_type: ADMIN_DATA_ID.ADMIN,
                                                    admin_type: ADMIN_DATA_ID.USER,
                                                    user_type_id: null,
                                                    first_name: first_name,
                                                    last_name: last_name,
                                                    email: ((request_data_body.email_address).trim()).toLowerCase(),
                                                    password: request_data_body.uen,
                                                    social_ids: social_id_array,
                                                    login_by: request_data_body.login_by,
                                                    country_phone_code: request_data_body.country_phone_code,
                                                    phone: request_data_body.mobile_no,
                                                    address: request_data_body.address,
                                                    zipcode: request_data_body.zipcode,
                                                    country_id: country_id,
                                                    country_code: request_data_body.country_code,
                                                    city: city,
                                                    device_token: request_data_body.device_token,
                                                    device_type: request_data_body.device_type,
                                                    app_version: request_data_body.app_version,
                                                    is_email_verified: request_data_body.is_email_verified,
                                                    is_phone_number_verified: request_data_body.is_phone_number_verified,
                                                    server_token: server_token,
                                                });

                                                let image_file = request_data.files;
                                                if (image_file != undefined && image_file.length > 0) {
                                                    let image_name = user_data._id + utils.generateServerToken(4);
                                                    let url = utils.getStoreImageFolderPath(FOLDER_NAME.USER_PROFILES) + image_name + FILE_EXTENSION.USER;
                                                    user_data.image_url = url;
                                                    utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.USER, FOLDER_NAME.USER_PROFILES);

                                                }

                                                if (social_id == undefined || social_id == null || social_id == "") {
                                                    user_data.password = utils.encryptPassword(request_data_body.uen);
                                                }

                                                let referral_code_string = utils.generateReferralCode(ADMIN_DATA_ID.ADMIN, request_data_body.currency, first_name, last_name);
                                                user_data.referral_code = referral_code_string;
                                                user_data.wallet_currency_code = request_data_body.currency;

                                                // Start Apply Referral //
                                                //if (request_data_body.referral_code != "") {
                                                User.findOne({ referral_code: request_data_body.referral_code }).then((user) => {
                                                    if (user && country) {

                                                        let referral_bonus_to_user = country.referral_bonus_to_user;
                                                        let referral_bonus_to_user_friend = country.referral_bonus_to_user_friend;
                                                        let user_refferal_count = user.total_referrals;
                                                        if (user_refferal_count < country.no_of_user_use_referral) {
                                                            user.total_referrals = +user.total_referrals + 1;

                                                            let wallet_information = { referral_code: referral_code_string, user_friend_id: user_data._id };
                                                            let total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.USER, user.unique_id, user._id, user.country_id, country.currency_code, country.currency_code,
                                                                1, referral_bonus_to_user, user.wallet, WALLET_STATUS_ID.ADD_WALLET_AMOUNT, WALLET_COMMENT_ID.ADDED_BY_REFERRAL, "Using Refferal : " + request_data_body.referral_code, wallet_information);


                                                            // Entry in wallet Table //
                                                            user.wallet = total_wallet_amount;
                                                            user.save();
                                                            user_data.is_referral = true;
                                                            user_data.referred_by = user._id;

                                                            // Entry in wallet Table //
                                                            wallet_information = { referral_code: referral_code_string, user_friend_id: user._id };
                                                            let new_total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.USER, user_data.unique_id, user_data._id, user_data.country_id, country.currency_code, country.currency_code,
                                                                1, referral_bonus_to_user_friend, user_data.wallet, WALLET_STATUS_ID.ADD_WALLET_AMOUNT, WALLET_COMMENT_ID.ADDED_BY_REFERRAL, "Using Refferal : " + request_data_body.referral_code, wallet_information);

                                                            user_data.wallet = new_total_wallet_amount;
                                                            //user_data.save();

                                                            // Entry in referral_code Table //
                                                            let referral_code = new Referral_code({
                                                                user_type: ADMIN_DATA_ID.USER,
                                                                user_id: user._id,
                                                                user_unique_id: user.unique_id,
                                                                user_referral_code: user.referral_code,
                                                                referred_id: user_data._id,
                                                                referred_unique_id: user_data.unique_id,
                                                                country_id: user_data.country_id,
                                                                current_rate: 1,
                                                                referral_bonus_to_user_friend: referral_bonus_to_user_friend,
                                                                referral_bonus_to_user: referral_bonus_to_user,
                                                                currency_sign: country.currency_sign
                                                            });

                                                            utils.getCurrencyConvertRate(1, country.currency_code, setting_detail.admin_currency_code, function (response) {

                                                                if (response.success) {
                                                                    referral_code.current_rate = response.current_rate;
                                                                } else {
                                                                    referral_code.current_rate = 1;
                                                                }
                                                                referral_code.save();

                                                            });

                                                        }
                                                    }
                                                    utils.insert_documets_for_new_users(user_data, null, ADMIN_DATA_ID.USER, country_id, function (document_response) {

                                                        Cart.findOne({ cart_unique_token: cart_unique_token }).then((cart) => {
                                                            user_data.is_document_uploaded = document_response.is_document_uploaded;
                                                            if (cart) {
                                                                cart.user_id = user_data._id;
                                                                cart.cart_unique_token = "";
                                                                cart.save();
                                                                user_data.cart_id = cart._id;
                                                            }
                                                            user_data.save().then((user) => {
                                                                let admin = fireUser
                                                                // utils.create_user(user, ADMIN_DATA_ID.USER, response => {
                                                                //     if (response.success) {

                                                                // user.uid = response.user.uid
                                                                user.save().then(user_details => {
                                                                    utils.create_user_token(user, ADMIN_DATA_ID.USER, response => {
                                                                        user_details.firebase_token = response.user_token
                                                                        user_details.save();



                                                                        user_id = user_details._id;
                                                                        vendor_id = data._id;
                                                                        // console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
                                                                        // console.log(vendor_id);
                                                                        // console.log(user_id);

                                                                        vendor.findOne({ _id: vendor_id }).then((mode) => {
                                                                            if (mode) {
                                                                                mode.user_id = user_data._id;
                                                                                // mode.server_token= user_data.server_token;
                                                                                mode.save();
                                                                            } else {
                                                                                console.log("mode is undifined");
                                                                            }
                                                                        })



                                                                        if (response.success) {
                                                                            if (setting_detail.is_mail_notification) {
                                                                                emails.sendUserRegisterEmail(request_data, user_data, user_data.first_name + " " + user_data.last_name);
                                                                            }
                                                                            response_data.json({
                                                                                success: true,
                                                                                message: USER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                                                                /*minimum_phone_number_length: country.minimum_phone_number_length,
                                                                                maximum_phone_number_length: country.maximum_phone_number_length,*/
                                                                               // user: user_data,
                                                                                firebase_token: response.user_token
                                                                            });
                                                                        } else {
                                                                            console.log(error)
                                                                            response_data.json({
                                                                                success: true,
                                                                                message: USER_MESSAGE_CODE.REGISTER_SUCCESSFULLY,
                                                                                /*minimum_phone_number_length: country.minimum_phone_number_length,
                                                                                maximum_phone_number_length: country.maximum_phone_number_length,*/
                                                                                //user: user_data,
                                                                                // firebase_token: ''
                                                                            });
                                                                        }


                                                                    })
                                                                    //     }).catch(error => {
                                                                    //         response_data.json({
                                                                    //             success: false,
                                                                    //             error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                    //         });
                                                                    //     })
                                                                    // } else {
                                                                    //     response_data.json({
                                                                    //         success: false,
                                                                    //         error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                    //     });
                                                                    // }
                                                                })

                                                            }, (error) => {
                                                                console.log(error)
                                                                response_data.json({
                                                                    success: false,
                                                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                                //}

                                                // End Apply Referral //

                                            }
                                        }, (error) => {
                                            console.log(error)
                                            response_data.json({
                                                success: false,
                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                            });
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
                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });

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



        });

    });

};

//end user.js


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





// get_country_data_list
exports.get_country_data_list = function (request_data, response_data) {
    Country.find({}, function (error, country_data) {
        response_data.json(country_data);
    });
};

// add_city_data
exports.add_city = function (request_data, response_data) {
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


exports.get_city=function (request_data, response_data) {
    var country=request_data.body.country_id
    City.findOne({ country_id: country }).then((city) => {
        response_data.json(city);
    });
}







//start clear cart and add to cart
// clear_cart and add to cart
exports.add_to_cart = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [{ name: 'vendor_id', type: 'string' }], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            // var vendor_id=vendor.findOne({ _id: request_data_body.vendor_id });
            // console.log(vendor_id);
            var cart_id = request_data_body.cart_id;
            if (request_data_body.user_id == '') {
                request_data_body.user_id = null
            }



            vendor.findOne({ _id: request_data_body.vendor_id }).then((vendor_id) => {
                //  console.log(vendor_id.user_id);
                User.findOne({ _id: vendor_id.user_id }).then((user) => {
                    // if (user && request_data_body.server_token !== null && user.server_token !== request_data_body.server_token) {
console.log(user._id);
                    if (user.server_token == null) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {
                        Cart.findOne({ _id: vendor_id.user_id, order_id: null }).then((cart) => {
                            if (cart) {
                                if (cart.order_payment_id != null) {
                                    var order_payment_id = cart.order_payment_id;
                                    Order_payment.findOne({ _id: order_payment_id }).then((order_payment) => {
                                        if (order_payment) {
                                            var promo_id = order_payment.promo_id;
                                            if (promo_id != null) {
                                                Promo_code.findOne({ _id: promo_id }).then((promo_code) => {
                                                    if (promo_code) {
                                                        promo_code.used_promo_code = promo_code.used_promo_code - 1;
                                                        promo_code.save();
                                                        user.promo_count = user.promo_count - 1;
                                                        user.save();
                                                    }
                                                });
                                            }

                                            Order_payment.remove({ _id: order_payment_id }).then(() => { });
                                        }
                                    }, (error) => {
                                        console.log(error)
                                    });
                                }
                                Cart.remove({ _id: vendor_id.user_id }).then(() => {

                                    if (user) {
                                        user.cart_id = null;
                                        user.save();
                                    }
                                    // response_data.json({
                                    //     success: true,
                                    //     message: CART_MESSAGE_CODE.CART_DELETE_SUCCESSFULLY,
                                    // });
                                }, (error) => {
                                    console.log(error)
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });
                            } else {
                                user.cart_id = null;
                                user.save();
                                // response_data.json({ success: false, error_code: CART_ERROR_CODE.CART_DELETE_FAILED });
                            }
                        }, (error) => {
                            console.log(error)
                            // response_data.json({
                            //     success: false,
                            //     error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            // });
                        });
                    }
                },
                    (error) => {
                        console.log(error)
                        // response_data.json({
                        //     success: false,
                        //     error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        // });
                    });

            });
        } else {
            // response_data.json(response);
        }
    });





    //addtocart

    utils.check_request_params(request_data.body, [{ name: 'pickup_addresses' }, { name: 'destination_addresses' }], function (response) {

        if (response.success) {
            var request_data_body = request_data.body;
            var cart_unique_token = request_data_body.cart_unique_token;
            var user_type = Number(request_data_body.user_type);
            if (request_data_body.user_id == '') {
                request_data_body.user_id = null
            }
            if (!request_data.headers.lang) {
                request_data.headers.lang = 0;

            }
            vendor.findOne({ _id: request_data_body.vendor_id }).then((vendor_id) => {
                User.findOne({ _id: vendor_id.user_id }).then((user) => {

                     console.log(user._id);
                    // if (user && request_data_body.server_token !== null && user.server_token !== request_data_body.server_token) {
                        if (user.server_token == null) {

                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                        // console.log(user.server_token);
                        // console.log(request_data_body.server_token);
                        // console.log(user && request_data_body.server_token !== null && user.server_token !== request_data_body.server_token);

                    } else {
                        var cart_id = null;
                        if (request_data_body.cart_id != undefined) {
                            cart_id = request_data_body.cart_id;
                        } else {
                            cart_id = null;
                        }
                        var user_id = null;

                        var delivery_type = DELIVERY_TYPE.STORE;
                        if (request_data_body.delivery_type) {
                            delivery_type = request_data_body.delivery_type;
                        }
                        if (delivery_type == DELIVERY_TYPE.COURIER) {
                            request_data_body.store_id = null;
                        }
                        var query = {
                            $match: {
                                $and: [{ _id: mongoose.Types.ObjectId(request_data_body.store_id) }]
                            }
                        }

                        var tax_lookup = {
                            $lookup: {
                                from: "taxes",
                                localField: "taxes",
                                foreignField: "_id",
                                as: "taxes_details"

                            }
                        }
                        // Store.find({ _id: request_data_body.store_id, is_business:  true}).then((store_detail) => {
                        Store.aggregate([query, tax_lookup]).then((store_detail) => {
                            var store = store_detail[0]
                            // 
                            if (delivery_type == DELIVERY_TYPE.STORE && store && store.is_business === false) {
                                response_data.json({ success: false, error_code: STORE_ERROR_CODE.STORE_BUSINESS_OFF });
                            } else {
                                // console.log(request_data_body.country_id); 
                                // console.log(user.country_id);
                                var country_id = request_data_body.country_id;
                                var city_id = request_data_body.city_id;
                                var store_id = null;
                                if (store) {
                                    country_id = store.country_id;
                                    city_id = store.city_id;
                                    store_id = store._id;
                                    // console.log(request_data_body.pickup_addresses[0]);
                                    request_data_body.pickup_addresses[0].address = store.address;
                                    request_data_body.pickup_addresses[0].location = store.location;
                                    request_data_body.pickup_addresses[0].user_details.country_phone_code = store.country_phone_code;
                                    request_data_body.pickup_addresses[0].user_details.email = store.email;
                                    var store_name = store.name[Number(request_data.headers.lang)];
                                    if (!store_name || store_name == '') {
                                        store_name = store.name[0];
                                    }
                                    if (!store_name) {
                                        store_name = "";
                                    }
                                    request_data_body.pickup_addresses[0].user_details.name = store_name;
                                    request_data_body.pickup_addresses[0].user_details.phone = store.phone;
                 }
                  
                             
                          Country.findOne({ _id: country_id }).then((country_detail) => {

                                    var country_phone_code = '';
                                    var wallet_currency_code = '';
                                    var country_code = '';

                                    if (country_detail) {
                                        country_id = country_detail._id;
                                        country_phone_code = country_detail.country_phone_code;
                                        wallet_currency_code = country_detail.currency_code;
                                        country_code = country_detail.country_code;
                                    }

                                    var phone = request_data_body.destination_addresses[0].user_details.phone;
                                    var email = request_data_body.destination_addresses[0].user_details.email;
                                    var query = { $or: [{ 'email': email }, { 'phone': phone }] };
                                    // var query =  {'phone': phone};

                                    User.findOne(query).then((user_phone_data) => {

                                        if (user_type == ADMIN_DATA_ID.STORE && request_data_body.destination_addresses.length > 0) {
                                            if (user_phone_data) {
                                                console.log('save cart to user')
                                                user_phone_data.cart_id = cart_id;
                                                user_phone_data.save();
                                                user = user_phone_data;
                                                console.log(user);
                                            } else {

                                                var server_token = utils.generateServerToken(32);
                                                var password = "123456";
                                                password = utils.encryptPassword(password);

                                                var first_name = request_data_body.destination_addresses[0].user_details.name.trim();
                                                if (first_name != "" && first_name != undefined && first_name != null) {
                                                    first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
                                                } else {
                                                    first_name = "";
                                                }
                                                var referral_code = utils.generateReferralCode(ADMIN_DATA_ID.ADMIN, country_detail.country_code, first_name, '');
                                                var user_data = new User({
                                                    user_type: ADMIN_DATA_ID.STORE,
                                                    admin_type: ADMIN_DATA_ID.USER,
                                                    first_name: first_name,
                                                    email: email,
                                                    password: password,
                                                    country_phone_code: country_phone_code,
                                                    phone: phone,
                                                    country_id: country_id,
                                                    server_token: server_token,
                                                    referral_code: referral_code,
                                                    wallet_currency_code: wallet_currency_code,
                                                    cart_id: cart_id
                                                });
                                                user_id = user_data._id;
                                                cart_id = user_data.cart_id;
                                                cart_unique_token = null;

                                                utils.insert_documets_for_new_users(user_data, null, ADMIN_DATA_ID.USER, country_id, function (document_response) {
                                                    user_data.is_document_uploaded = document_response.is_document_uploaded;
                                                    console.log('new user cart')
                                                    user_data.save();
                                                    user = user_data;
                                                    console.log('new user document')
                                                });

                                            }
                                        }

                                        if (user) {
                                            cart_id = user.cart_id;
                                            // console.log(cart_id)
                                            user_id = user._id;
                                            cart_unique_token = null;
                                        }

                                        // console.log(_id);
                                        Cart.findOne({ $and: [{ _id: cart_id }, { cart_unique_token: cart_unique_token }] }).then((cart) => {


                                            if (cart && (!cart.store_id || cart.store_id.equals(store_id) || !store_id)) {

                                                // if (request_data_body.user_type === 2 || cart.is_use_item_tax === request_data_body.is_use_item_tax) {

                                                if (request_data_body.user_id != "" && request_data_body.user_id != null) {
                                                    cart.cart_unique_token = "";
                                                }

                                                // if(request_data_body.table_no && request_data_body.no_of_persons){
                                                cart.table_no = request_data_body.table_no
                                                cart.no_of_persons = request_data_body.no_of_persons
                                                cart.booking_type = request_data_body.booking_type
                                                // }

                                                cart.delivery_type = delivery_type;
                                                cart.user_id = user_id;
                                                cart.user_type_id = user_id;
                                                cart.user_type = request_data_body.user_type;
                                                cart.city_id = city_id;
                                                cart.destination_addresses = request_data_body.destination_addresses;
                                                cart.order_details = request_data_body.order_details;
                                                cart.pickup_addresses = request_data_body.pickup_addresses;
                                                cart.store_id = store_id;
                                                cart.language = Number(request_data.headers.lang);
                                                cart.is_use_item_tax = request_data_body.is_use_item_tax;
                                                cart.is_tax_included = request_data_body.is_tax_included;

                                                var total_cart_price = request_data_body.total_cart_price;
                                                var total_item_tax = 0;
                                                cart.total_cart_price = total_cart_price;

                                                if (store) {
                                                    // console.log('in store');
                                                    if (store.is_use_item_tax) {
                                                        // console.log('----------is_use_item_tax----------');
                                                        if (request_data_body.total_item_tax) {
                                                            total_item_tax = request_data_body.total_item_tax;
                                                        }
                                                    } else {
                                                        // console.log('----------is_use_store_tax----------');
                                                        if (total_cart_price) {
                                                            store.taxes_details.forEach(tax => {

                                                                total_item_tax = total_item_tax + (total_cart_price * tax.tax * 0.01);
                                                            })
                                                        } else {
                                                            total_cart_price = 0;
                                                        }
                                                    }
                                                }
                                                //  else {
                                                //     console.log('else store');
                                                // }

                                                total_item_tax = utils.precisionRoundTwo(Number(total_item_tax));
                                                cart.total_item_tax = total_item_tax;
                                                cart.save().then(() => {
                                                    response_data.json({
                                                        success: true,
                                                        message: CART_MESSAGE_CODE.CART_UPDATED_SUCCESSFULLY,
                                                        cart_id: cart._id,
                                                        city_id: city_id,
                                                        // user_id: user_id,
                                                        vendor_id:vendor_id.id
                                                    });
                                                }, 
                                                (error) => {
                                                    console.log(error)
                                                    response_data.json({
                                                        success: false,
                                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                    });
                                                });

                                                //response_data.json({success: false, error_code: STORE_ERROR_CODE.MISMATCH_STORE_ID});

                                                // } else {
                                                //     response_data.json({success: false, error_code: CART_ERROR_CODE.CART_ITEM_TAX_MISS_MATCH});
                                                // }
                                            } 
                                            else {
                                                // console.log('else');
                                                var total_cart_price = request_data_body.total_cart_price;
                                                var total_item_tax = 0;
                                                if (store) {
                                                    // if (store.is_use_item_tax) {
                                                    //     if (request_data_body.total_item_tax) {
                                                    //         total_item_tax = request_data_body.total_item_tax;
                                                    //     }
                                                    // } else {
                                                    //     if(total_cart_price){
                                                    //         total_item_tax = total_cart_price * store.item_tax * 0.01;
                                                    //     } else {
                                                    //         total_cart_price = 0;
                                                    //     }
                                                    // }

                                                    console.log('in store');
                                                    if (store.is_use_item_tax) {
                                                        // console.log('---------is_use_item_tax-----------');
                                                        if (request_data_body.total_item_tax) {
                                                            total_item_tax = request_data_body.total_item_tax;
                                                        }
                                                    } else {
                                                        // console.log('---------is_use_store_tax-----------');
                                                        if (total_cart_price) {
                                                            store.taxes_details.forEach(tax => {
                                                                total_item_tax = total_item_tax + (total_cart_price - (100 * total_cart_price) / (100 + tax.tax));
                                                            })
                                                        } else {
                                                            total_cart_price = 0;
                                                        }
                                                    }
                                                }

                                                total_item_tax = utils.precisionRoundTwo(Number(total_item_tax));


                                                var cart = new Cart({
                                                    cart_unique_token: request_data_body.cart_unique_token,
                                                    user_id: user_id,
                                                    user_type: request_data_body.user_type,
                                                    delivery_type: delivery_type,
                                                    user_type_id: user_id,
                                                    store_id: store_id,
                                                    order_payment_id: null,
                                                    order_id: null,
                                                    city_id: city_id,
                                                    language: Number(request_data.headers.lang),
                                                    pickup_addresses: request_data_body.pickup_addresses,
                                                    destination_addresses: request_data_body.destination_addresses,
                                                    order_details: request_data_body.order_details,
                                                    total_cart_price: total_cart_price,
                                                    total_item_tax: total_item_tax,
                                                    is_use_item_tax: request_data_body.is_use_item_tax,
                                                    is_tax_included: request_data_body.is_tax_included,
                                                    table_no: request_data_body.table_no,
                                                    no_of_persons: request_data_body.no_of_persons,
                                                    booking_type: request_data_body.booking_type
                                                });

                                                if (request_data_body.user_id != "" && request_data_body.user_id != undefined) {
                                                    cart.cart_unique_token = "";
                                                }

                                                cart.save().then(() => {
                                                    // console.log(user)
                                                    if (user) {
                                                        user.cart_id = cart._id;
                                                        user.save();
                                                        // console.log('user new cart')
                                                        // console.log(user.cart_id)
                                                    }
                                                    response_data.json({
                                                        success: true,
                                                        message: CART_MESSAGE_CODE.CART_ADDED_SUCCESSFULLY,
                                                        cart_id: cart._id,
                                                        // city_id: city_id,
                                                        // user_id: user_id,
                                                        vendor_id:vendor_id.id
                                                        
                                                    });
                                                }, (error) => {
                                                    console.log(error)
                                                    response_data.json({
                                                        success: false,
                                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                    });
                                                });
                                            }
                                        }, (error) => {
                                            console.log(error)
                                            response_data.json({
                                                success: false,
                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                            });
                                        });
                                    }, (error) => {
                                        console.log(error)
                                        response_data.json({
                                            success: false,
                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                        });
                                    });
                                }, (error) => {
                                    console.log(error)
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
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
                }, (error) => {
                    console.log(error)
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

//end clear cart and add to cart








// Function to calculate distance using Haversine formula
function distance(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in kilometers
    var dLat = deg2rad(lat2 - lat1); // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in KM
    return d;
}

// Function to convert degrees to radians
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Export the calculation function
exports.calculation = function (req, res) {
    var _lat1 = 1.3063779;
    var _lon1 = 103.84973;
    var _lat2 = 1.3851281;
    var _lon2 = 103.7459494;

    // Calculate precise distance
    var _preciseDistance = "Precise value: " + distance(_lat1, _lon1, _lat2, _lon2);
    console.log(_preciseDistance);

    // Calculate rounded distance
    var _roundedDistance = "Round value: " +
        Math.round(distance(_lat1, _lon1, _lat2, _lon2) * 100)  +
        " km";
    console.log(_roundedDistance);

    // You can also send the distances as a response if this is an HTTP route handler
    res.send({ preciseDistance: _preciseDistance, roundedDistance: _roundedDistance });
};


//get courier order invoice

exports.get_courier_order_invoice = function (request_data, response_data) {
    // console.log('courier order invoice')
    utils.check_request_params(request_data.body, [{ name: 'vendor_id' }, { name: 'vehicle_id' }], function (response) {
        //  console.log('tested')
        if (response.success) {

            let request_data_body = request_data.body;
            let cart_unique_token = request_data_body.cart_unique_token;
            let server_time = new Date();

            if (request_data_body.user_id == '') {
                request_data_body.user_id = null;
            }
vendor.findOne({_id:request_data_body.vendor_id}).then((vendor_id)=>{
            User.findOne({ _id: vendor_id.user_id }).then((user) => {
                // console.log('1')
                // console.log(user)
                // if(user){
                if (  user.server_token == null) {
                    response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                } else {

                    if (user) {
                        cart_id = user.cart_id;
                        user_id = user._id;
                        cart_unique_token = null;
                        wallet_currency_code = user.wallet_currency_code;
                    }
                    
                    Cart.findOne({ $or: [{ _id: cart_id }, { cart_unique_token: cart_unique_token }] }).then((cart) => {
                        // console.log('2')

                        if (cart) {
                            let destination_location = cart.destination_addresses[cart.destination_addresses.length - 1].location
                            let pickup_location = cart.pickup_addresses[0].location;
                            let city_id = cart.city_id;
// console.log(city_id);

                            City.findOne({ _id: city_id }).then((cit)=>{                        
                            let country_id = cit.country_id;
                            let delivery_type = DELIVERY_TYPE.COURIER;

                            Country.findOne({ _id: country_id }).then((country) => {
                                // console.log('3')

                                let is_distance_unit_mile = false;
                                if (country) {
                                    let is_distance_unit_mile = country.is_distance_unit_mile;
                                    if (!user) {
                                        wallet_currency_code = country.currency_code;
                                    }
                                }

                                City.findOne({ _id: city_id }).then((city_detail) => {
                                    // console.log('4')

                                    if (city_detail) {

                                        let delivery_price_used_type = ADMIN_DATA_ID.ADMIN;
                                        let delivery_price_used_type_id = null;
                                        let is_order_payment_status_set_by_store = false;


                                        let query = {   };
                                        let vehicle_id;
                                        if (request_data_body.vehicle_id) {
                                            vehicle_id = request_data_body.vehicle_id;
                                            query = { city_id: city_id, delivery_type: delivery_type, vehicle_id: vehicle_id, type_id: delivery_price_used_type_id };
                                        } else {
                                            query = { city_id: city_id, delivery_type: delivery_type, type_id: delivery_price_used_type_id }
                                        }

                                        Service.find(query).then((service_list) => {
                                            // console.log('5')

                                            let service = null;
                                            let default_service_index = service_list.findIndex((service) => service.is_default == true);
                                            if (default_service_index !== -1 && !vehicle_id) {
                                                service = service_list[default_service_index];
                                            } else if (service_list.length > 0) {
                                                service = service_list[0];
                                            }

                                            if (service) {
                                            // console.log('6')    

                                                utils.check_zone(city_id, delivery_type, delivery_price_used_type_id, service.vehicle_id, city_detail.zone_business, pickup_location, destination_location, function (zone_response) {
                                                    /* HERE USER PARAM */

                                                    // console.log(cart.pickup_addresses[0].location[0]);
                                                    // console.log(cart.pickup_addresses[0].location[1]);
                                                    // console.log(cart.destination_addresses[0].location[0]);
                                                    // console.log(cart.destination_addresses[0].location[1]);
                                                    var _lat1 = cart.pickup_addresses[0].location
                                                    var _lat2 = cart.destination_addresses[0].location
                                                    // console.log(_lat1);
                                                    // console.log(_lat2);



                                                    // var _lat1 = cart.pickup_addresses[0].location[0]
                                                    // var _lon1 = cart.pickup_addresses[0].location[1]
                                                    // var _lat2 = cart.destination_addresses[0].location[0]
                                                    // var _lon2 = cart.destination_addresses[0].location[1]
                                                
                                                    // var _roundedDistance = "Round value: " + (_lat1, _lon1, _lat2, _lon2) * 100  +" km";
                                                    // console.log(_roundedDistance);
                                                    const apiKey = 'AIzaSyBViKhoMt_4-rQ92byigbEanQEAmVJS1aA';
                                                    const origin = _lat1; // Lat,Lng format
                                                    const destination = _lat2;
                                                    



                                                    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${apiKey}`;
                                                         fetch(url)
                                                        .then(response => response.json())
                                                        .then(apikey => {
                                                          const distance = apikey.rows[0].elements[0].distance.value;
                                                          const duration = apikey.rows[0].elements[0].duration.value;
                                                           
                                                        //   console.log( duration);
                                                        //   console.log( distance);
                                                       
                                                          let total_distance = distance;
                                                          let total_time = duration;
                                                       
                                                        
                                                    // };

                                                     //let total_distance = request_data_body.total_distance;
                                                     

                                                    //let total_time = request_data_body.total_time;
                                                   


                                              
                                                    let is_user_pick_up_order = false;


                                                    let total_item_count = 1;

                                                    /* SERVICE DATA HERE */
                                                    let base_price = 0;
                                                    let base_price_distance = 0;
                                                    let price_per_unit_distance = 0;
                                                    let price_per_unit_time = 0;
                                                    let service_tax = 0;
                                                    let min_fare = 0;
                                                    let is_min_fare_applied = false;
                                                    let admin_profit_mode_on_delivery = 1
                                                    let admin_profit_value_on_delivery = 0

                                                    if (service) {
                                                        //if (service.admin_profit_mode_on_delivery) {
                                                        admin_profit_mode_on_delivery = service.admin_profit_mode_on_delivery;
                                                        admin_profit_value_on_delivery = service.admin_profit_value_on_delivery;
                                                        //}

                                                        base_price = service.base_price;
                                                        base_price_distance = service.base_price_distance;
                                                        price_per_unit_distance = service.price_per_unit_distance;
                                                        price_per_unit_time = service.price_per_unit_time;
                                                        service_tax = service.service_tax;
                                                        min_fare = service.min_fare;

                                                    }
                                                    let admin_profit_mode_on_store = 0;
                                                    let admin_profit_value_on_store = 0;
                                                    // STORE DATA HERE //

                                                    let item_tax = 0;
                                                    // DELIVERY CALCULATION START //
                                                    let distance_price = 0;
                                                    let total_base_price = 0;
                                                    let total_distance_price = 0;
                                                    let total_time_price = 0;
                                                    let total_service_price = 0;
                                                    let total_sur_charge = 0;
                                                    let total_admin_tax_price = 0;
                                                    let total_after_tax_price = 0;
                                                    let total_surge_price = 0;
                                                    let total_delivery_price_after_surge = 0;
                                                    let delivery_price = 0;
                                                    let total_delivery_price = 0;
                                                    let total_admin_profit_on_delivery = 0;
                                                    let total_provider_income = 0;
                                                    let promo_payment = 0;

                                                    total_time = total_time / 60;// convert to mins
                                                    total_time = utils.precisionRoundTwo(Number(total_time));

                                                    if (is_distance_unit_mile) {
                                                        total_distance = total_distance * 0.000621371;
                                                    } else {
                                                        total_distance = total_distance * 0.001;
                                                    }

                                                    if (!is_user_pick_up_order) {
                                                        console.log("cart.destination_addresses.length")
                                                        console.log(cart.destination_addresses.length)
                                                        total_sur_charge = service.price_per_stop * cart.destination_addresses.length;
                                                        total_sur_charge = utils.precisionRoundTwo(Number(total_sur_charge));

                                                        if (service && service.is_use_distance_calculation) {
                                                            let delivery_price_setting = service.delivery_price_setting;
                                                            delivery_price_setting.forEach(function (delivery_setting_detail) {
                                                                if (delivery_setting_detail.to_distance >= total_distance) {
                                                                    distance_price = distance_price + delivery_setting_detail.delivery_fee;
                                                                }
                                                            });
                                                            total_distance_price = distance_price;
                                                            total_service_price = distance_price;
                                                            delivery_price = distance_price;
                                                            total_after_tax_price = distance_price + +total_sur_charge;
                                                            total_delivery_price_after_surge = distance_price;
                                                        } else {
                                                            total_base_price = base_price;
                                                            if (total_distance > base_price_distance) {
                                                                distance_price = (total_distance - base_price_distance) * price_per_unit_distance;
                                                            }

                                                            total_base_price = utils.precisionRoundTwo(total_base_price);
                                                            distance_price = utils.precisionRoundTwo(distance_price);
                                                            total_time_price = price_per_unit_time * total_time;
                                                            total_time_price = utils.precisionRoundTwo(Number(total_time_price));

                                                            total_distance_price = +total_base_price + +distance_price;
                                                            total_distance_price = utils.precisionRoundTwo(total_distance_price);

                                                            total_service_price = +total_distance_price + +total_time_price;
                                                            total_service_price = utils.precisionRoundTwo(Number(total_service_price));

                                                            total_admin_tax_price = service_tax * total_service_price * 0.01;
                                                            total_admin_tax_price = utils.precisionRoundTwo(Number(total_admin_tax_price));

                                                            total_after_tax_price = +total_service_price + +total_admin_tax_price + +total_sur_charge;
                                                            total_after_tax_price = utils.precisionRoundTwo(Number(total_after_tax_price));

                                                            total_delivery_price_after_surge = +total_after_tax_price + +total_surge_price;
                                                            total_delivery_price_after_surge = utils.precisionRoundTwo(Number(total_delivery_price_after_surge));

                                                            if (total_delivery_price_after_surge <= min_fare) {
                                                                delivery_price = min_fare;
                                                                is_min_fare_applied = true;
                                                            } else {
                                                                delivery_price = total_delivery_price_after_surge;
                                                            }
                                                        }



                                                        if (zone_response.success) {
                                                            total_admin_tax_price = 0;
                                                            total_base_price = 0;
                                                            total_distance_price = 0;
                                                            total_time_price = 0;
                                                            total_service_price = zone_response.zone_price;
                                                            delivery_price = zone_response.zone_price;
                                                            total_after_tax_price = total_service_price;
                                                            total_delivery_price_after_surge = total_service_price;
                                                        }

                                                        switch (admin_profit_mode_on_delivery) {
                                                            case ADMIN_PROFIT_ON_DELIVERY_ID.PERCENTAGE: /* 1- percentage */
                                                                total_admin_profit_on_delivery = delivery_price * admin_profit_value_on_delivery * 0.01;
                                                                break;
                                                            case ADMIN_PROFIT_ON_DELIVERY_ID.PER_DELVIERY: /* 2- absolute per delivery */
                                                                total_admin_profit_on_delivery = admin_profit_value_on_delivery;
                                                                break;
                                                            default: /* percentage */
                                                                total_admin_profit_on_delivery = delivery_price * admin_profit_value_on_delivery * 0.01;
                                                                break;
                                                        }

                                                        total_admin_profit_on_delivery = utils.precisionRoundTwo(Number(total_admin_profit_on_delivery + +total_sur_charge));
                                                        total_provider_income = delivery_price - total_admin_profit_on_delivery;
                                                        total_provider_income = utils.precisionRoundTwo(Number(total_provider_income));


                                                    } else {
                                                        total_distance = 0;
                                                        total_time = 0;
                                                    }

                                                    // DELIVERY CALCULATION END //
                                                    // ORDER CALCULATION START //

                                                    let order_price = 0;
                                                    let total_store_tax_price = 0;
                                                    let total_order_price = 0;
                                                    let total_admin_profit_on_store = 0;
                                                    let total_store_income = 0;
                                                    let total_cart_price = 0;
                                                    let is_store_pay_delivery_fees = false;

                                                    total_cart_price = 0;
 
                                                    cart.total_item_tax = total_store_tax_price;

                                                    order_price = +total_cart_price + +total_store_tax_price;
                                                    order_price = utils.precisionRoundTwo(Number(order_price));


                                                    /* FINAL INVOICE CALCULATION START */
                                                    total_delivery_price = delivery_price;
                                                    total_order_price = order_price;
                                                    let tip_amount = 0
                                                    if (!request_data_body.tip_amount) {
                                                        request_data_body.tip_amount = 0;
                                                    }
                                                    if (setting_detail.tip_type == 1) {
                                                        tip_amount = (request_data_body.tip_amount * total_order_price) / 100;
                                                        tip_amount = utils.precisionRoundTwo(Number(tip_amount));
                                                    } else {
                                                        tip_amount = request_data_body.tip_amount;
                                                    }
                                                    total_provider_income = total_provider_income + +tip_amount;
                                                    let total = +total_delivery_price + +total_order_price + +tip_amount;
                                                    total = utils.precisionRoundTwo(Number(total));
                                                    let user_pay_payment = total;


                                                    cart.total_item_count = total_item_count;

                                                    Vehicle.findOne({ _id: service.vehicle_id }).then((vehicle_data) => {
                                                        if (!vehicle_data) {
                                                            vehicle_data = [];
                                                        } else {
                                                            vehicle_data = [vehicle_data];
                                                        }

                                                        Order_payment.findOne({ _id: cart.order_payment_id }).then((order_payment) => {

                                                            if (order_payment) {
                                                                 //console.log('order payment')

                                                                let promo_id = order_payment.promo_id;
                                                                Promo_code.findOne({ _id: promo_id }).then((promo_code) => {
                                                                    if (promo_code) {
                                                                        promo_code.used_promo_code = promo_code.used_promo_code - 1;
                                                                        promo_code.save();
                                                                        user.promo_count = user.promo_count - 1;
                                                                        user.save();
                                                                    }
                                                                });

                                                                order_payment.cart_id = cart._id;
                                                                order_payment.is_min_fare_applied = is_min_fare_applied;
                                                                order_payment.order_id = null;
                                                                order_payment.order_unique_id = 0;
                                                                order_payment.store_id = null;
                                                                order_payment.user_id = cart.user_id;
                                                                order_payment.country_id = country_id;
                                                                order_payment.city_id = city_id;
                                                                order_payment.provider_id = null;
                                                                order_payment.promo_id = null;
                                                                order_payment.delivery_price_used_type = delivery_price_used_type;
                                                                order_payment.delivery_price_used_type_id = delivery_price_used_type_id;
                                                                order_payment.tip_amount = tip_amount;
                                                                order_payment.tip_value = request_data_body.tip_amount;
                                                                order_payment.currency_code = wallet_currency_code;
                                                                order_payment.admin_currency_code = "";
                                                                order_payment.order_currency_code = user.wallet_currency_code;
                                                                order_payment.current_rate = 1;
                                                                order_payment.admin_profit_mode_on_delivery = admin_profit_mode_on_delivery;
                                                                order_payment.admin_profit_value_on_delivery = admin_profit_value_on_delivery;
                                                                order_payment.total_admin_profit_on_delivery = total_admin_profit_on_delivery;
                                                                order_payment.total_provider_income = total_provider_income;
                                                                order_payment.admin_profit_mode_on_store = admin_profit_mode_on_store;
                                                                order_payment.admin_profit_value_on_store = admin_profit_value_on_store;
                                                                order_payment.total_admin_profit_on_store = total_admin_profit_on_store;
                                                                order_payment.total_store_income = total_store_income;
                                                                order_payment.total_distance = total_distance;
                                                                order_payment.total_time = total_time;
                                                                order_payment.is_distance_unit_mile = is_distance_unit_mile;
                                                                order_payment.is_store_pay_delivery_fees = is_store_pay_delivery_fees;
                                                                order_payment.total_service_price = total_service_price;
                                                                order_payment.total_sur_charge = total_sur_charge;
                                                                order_payment.total_admin_tax_price = total_admin_tax_price;
                                                                order_payment.total_after_tax_price = total_after_tax_price;
                                                                order_payment.total_surge_price = total_surge_price;
                                                                order_payment.total_delivery_price_after_surge = total_delivery_price_after_surge;
                                                                order_payment.total_cart_price = total_cart_price;
                                                                order_payment.total_delivery_price = total_delivery_price;
                                                                order_payment.total_item_count = total_item_count;
                                                                order_payment.service_tax = service_tax;
                                                                order_payment.item_tax = item_tax;
                                                                order_payment.total_store_tax_price = total_store_tax_price;
                                                                order_payment.total_order_price = total_order_price;
                                                                order_payment.promo_payment = 0;
                                                                order_payment.user_pay_payment = user_pay_payment;
                                                                order_payment.total = total;
                                                                order_payment.wallet_payment = 0;
                                                                order_payment.total_after_wallet_payment = 0;
                                                                order_payment.cash_payment = 0;
                                                                order_payment.card_payment = 0;
                                                                order_payment.remaining_payment = 0;
                                                                order_payment.delivered_at = null;
                                                                order_payment.is_order_payment_status_set_by_store = is_order_payment_status_set_by_store;
                                                                order_payment.is_user_pick_up_order = is_user_pick_up_order;
                                                                order_payment.save().then(() => {
                                                                    response_data.json({
                                                                        success: true,
                                                                        message: USER_MESSAGE_CODE.FARE_ESTIMATE_SUCCESSFULLY,
                                                                        order_payment_id: order_payment.id,
                                                                        server_time: server_time,
                                                                        currency: country.currency_sign,
                                                                        is_allow_contactless_delivery: setting_detail.is_allow_contactless_delivery,
                                                                        is_allow_user_to_give_tip: setting_detail.is_allow_user_to_give_tip,
                                                                        is_allow_pickup_order_verification: setting_detail.is_allow_pickup_order_verification,
                                                                        timezone: city_detail.timezone,
                                                                        tip_type: setting_detail.tip_type,
                                                                        order_payment: order_payment,
                                                                        vehicles: vehicle_data
                                                                    });

                                                                }, (error) => {
                                                                    console.log(error)
                                                                    response_data.json({
                                                                        success: false,
                                                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                    });
                                                                });
                                                            } else {
                                                                // console.log('new order payment')
                                                                /* ENTRY IN ORDER PAYMENT */
                                                                let order_payment = new Order_payment({
                                                                    cart_id: cart._id,
                                                                    store_id: null,
                                                                    user_id: cart.user_id,
                                                                    country_id: country_id,
                                                                    is_min_fare_applied: is_min_fare_applied,
                                                                    city_id: city_id,
                                                                    delivery_price_used_type: delivery_price_used_type,
                                                                    delivery_price_used_type_id: delivery_price_used_type_id,
                                                                    currency_code: wallet_currency_code,
                                                                    order_currency_code: user.wallet_currency_code,
                                                                    current_rate: 1, // HERE current_rate MEANS ORDER TO ADMIN CONVERT RATE
                                                                    wallet_to_admin_current_rate: 1,
                                                                    wallet_to_order_current_rate: 1,
                                                                    total_distance: total_distance,
                                                                    total_time: total_time,
                                                                    service_tax: service_tax,
                                                                    item_tax: item_tax,
                                                                    total_service_price: total_service_price,
                                                                    total_sur_charge: total_sur_charge,
                                                                    total_admin_tax_price: total_admin_tax_price,
                                                                    total_delivery_price: total_delivery_price,
                                                                    is_store_pay_delivery_fees: is_store_pay_delivery_fees,
                                                                    tip_amount: tip_amount,
                                                                    tip_value: request_data_body.tip_amount,
                                                                    total_item_count: total_item_count,
                                                                    total_cart_price: total_cart_price,
                                                                    total_store_tax_price: total_store_tax_price,
                                                                    user_pay_payment: user_pay_payment,
                                                                    total_order_price: total_order_price,
                                                                    promo_payment: promo_payment,
                                                                    total: total,
                                                                    admin_profit_mode_on_store: admin_profit_mode_on_store,
                                                                    admin_profit_value_on_store: admin_profit_value_on_store,
                                                                    total_admin_profit_on_store: total_admin_profit_on_store,
                                                                    total_store_income: total_store_income,
                                                                    admin_profit_mode_on_delivery: admin_profit_mode_on_delivery,
                                                                    admin_profit_value_on_delivery: admin_profit_value_on_delivery,
                                                                    total_admin_profit_on_delivery: total_admin_profit_on_delivery,
                                                                    total_provider_income: total_provider_income,
                                                                    is_user_pick_up_order: is_user_pick_up_order,
                                                                    is_order_payment_status_set_by_store: is_order_payment_status_set_by_store,
                                                                    is_distance_unit_mile: is_distance_unit_mile
                                                                });

                                                                order_payment.save().then(() => {

                                                                    cart.order_payment_id = order_payment._id;
                                                                    cart.save();
                                                                    response_data.json({
                                                                        success: true,
                                                                        message: USER_MESSAGE_CODE.FARE_ESTIMATE_SUCCESSFULLY,
                                                                        order_payment_id: order_payment.id,
                                                                        server_time: server_time,
                                                                        currency: country.currency_sign,
                                                                        is_allow_contactless_delivery: setting_detail.is_allow_contactless_delivery,
                                                                        is_allow_user_to_give_tip: setting_detail.is_allow_user_to_give_tip,
                                                                        is_allow_pickup_order_verification: setting_detail.is_allow_pickup_order_verification,
                                                                        timezone: city_detail.timezone,
                                                                        tip_type: setting_detail.tip_type,
                                                                        order_payment: order_payment,
                                                                        vehicles: vehicle_data
                                                                    });
                                                                }, (error) => {
                                                                    console.log(error)
                                                                    response_data.json({
                                                                        success: false,
                                                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                    });
                                                                });
                                                            }


                                                        });
                                                    })
                                                
                                                });
                                            })
                                        } 
                                        
                                        else {
                                                response_data.json({
                                                    success: false,
                                                    error_code: USER_ERROR_CODE.DELIVERY_SERVICE_NOT_AVAILABLE_IN_YOUR_CITY
                                                });
                                            }
                                        }, (error) => {
                                            console.log(error)
                                            response_data.json({
                                                success: false,
                                                error_code: USER_ERROR_CODE.DELIVERY_SERVICE_NOT_AVAILABLE_IN_YOUR_CITY
                                            });
                                        });

                                    }
                                }, (error) => {
                                    console.log(error)
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });
                            }, (error) => {
                                console.log(error)
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });
                        });
                            //     } else {
                            //         response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND});
                            //     }

                            // }, (error) => {
                            //     console.log(error)
                            //     response_data.json({
                            //         success: false,
                            //         error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            //     });
                            // });
                        } else {
                            response_data.json({ success: false, error_code: USER_ERROR_CODE.GET_ORDER_CART_INVOICE_FAILED });
                        }
                    }, (error) => {

                        console.log(error)
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        });
                    });

                }
                // } else {
                //     response_data.json({
                //         success: false,
                //         error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND
                //     });
                // }
            }, (error) => {

                console.log(error)
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

//end of courier order invoice










// user create order
exports.create_order = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'vendor_id', type: 'string'}], function (response) {
      
            if (response.success) {
                var request_data_body = request_data.body;
                var cart_id = request_data_body.cart_id;
                var date_now = new Date(Date.now());
                // var order_type = Number(request_data_body.order_type);
                var order_type = 2;

                
                vendor.findOne({_id: request_data_body.vendor_id}).then((Vendor)=>{
            User.findOne({_id: Vendor.user_id }).then((user) => {
                //console.log(ADMIN_DATA_ID.STORE);
               
               //console.log(order_type.server_token);
                
               
               if (user && order_type != ADMIN_DATA_ID.STORE && user.server_token !== null) {
                    response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                  
                } else {

                    Order_payment.findOne({ _id: request_data.body.order_payment_id }).then((order_payment) => {
                        card_stripe.pay_stripe_intent_payment(request_data, order_payment, function (payment_paid) {
                            
                    // console.log(user.cart_id);
                           
                            Order_payment.find({ user_id: Vendor.user_id, cart_id: request_data_body.cart_id, is_payment_paid: false, refund_amount: 0 }).then((order_payments) => {
                                if (order_payments.length = 0) {
                                    response_data.json({ success: false, error_code: USER_ERROR_CODE.YOUR_ORDER_PAYMENT_PENDING });
                                } else {
                                    Cart.findOne({ _id: cart_id }).then((cart) => {
                                        if (cart) {

                                            if (cart.destination_addresses) {
                                                cart.destination_addresses = cart.destination_addresses;
                                                cart.pickup_addresses[0].note=cart.pickup_note
                                                cart.save();
                                            }

                                            var order_status = ORDER_STATE.WAITING_FOR_ACCEPT_STORE;
                                            var order_status_id = ORDER_STATUS_ID.IDEAL;
                                            var order_status_manage_id = ORDER_STATUS_ID.IDEAL;

                                            if (order_type == ADMIN_DATA_ID.STORE) {
                                                order_status = ORDER_STATE.STORE_ACCEPTED;
                                                order_status_id = ORDER_STATUS_ID.RUNNING;
                                                order_status_manage_id = ORDER_STATUS_ID.RUNNING;
                                                order_type = ADMIN_DATA_ID.STORE;
                                            } else {
                                                order_type = ADMIN_DATA_ID.USER;
                                            }


                                            var is_schedule_order = request_data_body.is_schedule_order;
                                            var schedule_order_start_at = null;
                                            var schedule_order_start_at2 = null;
                                            if (is_schedule_order) {
                                                schedule_order_start_at = moment.utc(Number(request_data_body.order_start_at)).format();
                                                if (request_data_body.order_start_at2) {
                                                    schedule_order_start_at2 = moment.utc(Number(request_data_body.order_start_at2)).format();
                                                }
                                            } else {
                                                schedule_order_start_at = moment.utc(Number(new Date().getTime())).format();
                                            }

                                            var delivery_type = DELIVERY_TYPE.STORE;
                                            if (request_data_body.delivery_type) {
                                                delivery_type = request_data_body.delivery_type
                                            }

                                            if (delivery_type == DELIVERY_TYPE.COURIER) {
                                                order_status = ORDER_STATE.ORDER_READY;
                                                order_status_id = ORDER_STATUS_ID.RUNNING;
                                                order_status_manage_id = ORDER_STATUS_ID.COMPLETED;
                                            }
                                            var order = new Order({
                                                store_id: cart.store_id,
                                                cart_id: cart._id,
                                                order_payment_id: cart.order_payment_id,
                                                user_id: Vendor.user_id,
                                                delivery_type: delivery_type,
                                                order_type: order_type,
                                                order_type_id: user._id,
                                                order_status_id: order_status_id,
                                                order_status: order_status,
                                                user_detail: {
                                                    _id: user._id,
                                                    image_url: user.image_url,
                                                    email: user.email,
                                                    name: user.first_name + ' ' + user.last_name,
                                                    phone: user.country_phone_code + user.phone
                                                },
                                                order_status_manage_id: order_status_manage_id,
                                                destination_addresses: cart.destination_addresses,
                                                confirmation_code_for_pick_up_delivery: utils.generateUniqueCode(6),
                                                confirmation_code_for_complete_delivery: utils.generateUniqueCode(6),
                                                is_schedule_order: is_schedule_order,
                                                schedule_order_start_at: schedule_order_start_at,
                                                schedule_order_start_at2: schedule_order_start_at2,
                                                is_bring_change: request_data_body.is_bring_change
                                            });
                                            if (request_data_body.is_allow_contactless_delivery) {
                                                order.is_allow_contactless_delivery = request_data_body.is_allow_contactless_delivery;
                                            }
                                            order.is_allow_pickup_order_verification = setting_detail.is_allow_pickup_order_verification;
                                            Order_payment.findOne({ _id: cart.order_payment_id }).then((order_payment) => {

                                                if (order_payment) {
                                                    var store_query = {
                                                        $match: {
                                                            _id: { $eq: mongoose.Types.ObjectId(cart.store_id) }
                                                        }
                                                    }

                                                    var tax_lookup = {
                                                        $lookup: {
                                                            from: "taxes",
                                                            localField: "taxes",
                                                            foreignField: "_id",
                                                            as: "tax_details"
                                                        }
                                                    }

                                                    Store.aggregate([store_query, tax_lookup]).then((store_details) => {
                                                        // Store.findOne({_id: cart.store_id}).then((store) => {
                                                        var store = store_details[0]
                                                        var store_id = null;
                                                        var country_id = order_payment.country_id;
                                                        if (store) {
                                                            store_id = store._id;
                                                            order.store_detail = {
                                                                _id: store._id,
                                                                image_url: store.image_url,
                                                                email: store.email,
                                                                name: store.name,
                                                                phone: store.country_phone_code + store.phone
                                                            }
                                                            cart.store_taxes = store.tax_details
                                                            cart.save();
                                                        }
                                                        order.total = order_payment.total;
                                                        order.is_user_pick_up_order = order_payment.is_user_pick_up_order;
                                                        order.is_payment_mode_cash = order_payment.is_payment_mode_cash;
                                                        order.is_paid_from_wallet = order_payment.is_paid_from_wallet;
                                                        // if (store) {

                                                        City.findOne({ _id: cart.city_id }).then((city) => {

                                                            if (city) {
                                                                Country.findOne({ _id: country_id }).then((country_detail) => {
                                                                    var currency_sign = "";

                                                                    if (country_detail) {
                                                                        currency_sign = country_detail.currency_sign;
                                                                    }

                                                                    var tag_date = moment(utils.get_date_now_at_city(date_now, city.timezone)).format(DATE_FORMATE.DDMMYYYY);

                                                                    // Entry in Store_analytic daily Table

                                                                    if (store) {
                                                                        if (order_type == ADMIN_DATA_ID.STORE) {
                                                                            utils.insert_daily_store_analytics(tag_date, store._id, ORDER_STATE.STORE_CREATE_ORDER, order_payment.total_item_count, false);
                                                                        } else {
                                                                            utils.insert_daily_store_analytics(tag_date, store._id, ORDER_STATE.WAITING_FOR_ACCEPT_STORE, order_payment.total_item_count, false);

                                                                        }
                                                                    }

                                                                    var image_file = request_data.files;
                                                                    var file_list_size = 0;
                                                                    //console.log('---------courier images------------')
                                                                    //console.log(request_data_body)
                                                                    if (image_file != undefined && image_file.length > 0) {
                                                                        file_list_size = image_file.length;
                                                                        for (i = 0; i < file_list_size; i++) {
                                                                            image_file[i];
                                                                            var image_name = order._id + utils.generateServerToken(4);
                                                                            var url = utils.getStoreImageFolderPath(FOLDER_NAME.CART_ITEMS) + image_name + FILE_EXTENSION.ITEM;
                                                                            order.image_url.push(url);
                                                                            utils.storeImageToFolder(image_file[i].path, image_name + FILE_EXTENSION.ITEM, FOLDER_NAME.CART_ITEMS);
                                                                        }
                                                                    }

                                                                    order.city_id = city._id;
                                                                    order.country_id = country_detail._id;
                                                                    order.timezone = city.timezone;
                                                                    order.order_payment_id = order_payment._id;

                                                                    var index = order.date_time.findIndex((x) => x.status == ORDER_STATE.WAITING_FOR_ACCEPT_STORE);
                                                                    if (index == -1) {
                                                                        order.date_time.push({ status: ORDER_STATE.WAITING_FOR_ACCEPT_STORE, date: new Date() });
                                                                    } else {
                                                                        order.date_time[index].date = new Date();
                                                                    }

                                                                    if (order_type == ADMIN_DATA_ID.STORE && store) {
                                                                        order.order_type_id = store._id;

                                                                        var index = order.date_time.findIndex((x) => x.status == ORDER_STATE.STORE_ACCEPTED);
                                                                        if (index == -1) {
                                                                            order.date_time.push({ status: ORDER_STATE.STORE_ACCEPTED, date: new Date() });
                                                                        } 
                                                                        else {
                                                                            order.date_time[index].date = new Date();
                                                                        }

                                                                    }


                                                                    order.save().then(() => {

                                                                        Order.count({
                                                                            store_id: store_id, order_status: ORDER_STATE.WAITING_FOR_ACCEPT_STORE

                                                                        }).then((order_count_for_store) => {
                                                                            // console.log(order_count_for_store);
                                                                            var date1 = moment(date_now);
                                                                            var today_formats = date1.format(DATE_FORMATE.DDMMYYYY);
                                                                            var unique_id = pad(order.unique_id, 7, '0');
                                                                            var invoice_number = INVOICE_CODE.INVOICE_APP_NAME_CODE + " " + INVOICE_CODE.ORDER_EARNING_CODE + " " + today_formats + " " + unique_id;
                                                                            order_payment.invoice_number = invoice_number;

                                                                            order_payment.order_id = order._id;
                                                                            order_payment.order_unique_id = order.unique_id;
                                                                            order_payment.save();

                                                                            cart.order_id = order._id;
                                                                            cart.order_payment_id = order_payment._id;
                                                                            cart.save();

                                                                            if (setting_detail.is_mail_notification && store) {
                                                                                emails.sendNewOrderEmail(request_data, store);

                                                                            }

                                                                            if (setting_detail.is_sms_notification && store) {
                                                                                SMS.sendOtherSMS(store_phone_code, SMS_UNIQUE_ID.NEW_ORDER, "");
                                                                            }




                                                                            user.cart_id = null;
                                                                            user.save();

                                                                            
                                                                            if (order_type == ADMIN_DATA_ID.USER && store) {
                                                                                var store_push_data = {
                                                                                    order_id: order._id,
                                                                                    unique_id: order.unique_id,
                                                                                    order_count: order_count_for_store,
                                                                                    currency: currency_sign,
                                                                                    pickup_addresses: cart.pickup_addresses,
                                                                                    destination_addresses: cart.destination_addresses,
                                                                                    total_order_price: cart.delivery_type === DELIVERY_TYPE.STORE ? order_payment.total_order_price : order_payment.total,
                                                                                    is_payment_mode_cash: order_payment.is_payment_mode_cash,
                                                                                    first_name: user.first_name,
                                                                                    last_name: user.last_name,
                                                                                    user_image: user.image_url,
                                                                                    is_schedule_order: order.is_schedule_order
                                                                                }
                                                                                var store_phone_code = store.country_phone_code + store.phone;
                                                                                utils.sendPushNotificationWithPushData(ADMIN_DATA_ID.STORE, store.device_type, store.device_token, STORE_PUSH_CODE.NEW_ORDER, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, store_push_data, "");
                                                                            }


                                                                            var orders_array = {
                                                                                order_id: order._id,
                                                                                order_unique_id: order.unique_id,
                                                                                order_payment_id: order.order_payment_id,
                                                                                cart_id: order.cart_id
                                                                            }


                                                                            if (order.delivery_type == DELIVERY_TYPE.COURIER) {
                                                                                var request = new Request({
                                                                                    country_id: country_id,
                                                                                    city_id: city._id,
                                                                                    timezone: city.timezone,
                                                                                    vehicle_id: request_data_body.vehicle_id,
                                                                                    orders: orders_array,
                                                                                    user_id: user._id,
                                                                                    user_unique_id: user.unique_id,
                                                                                    request_type: 2,
                                                                                    request_type_id: cart.store_id,
                                                                                    estimated_time_for_delivery_in_min: 0,
                                                                                    user_detail: {
                                                                                        _id: user._id,
                                                                                        image_url: user.image_url,
                                                                                        email: user.email,
                                                                                        name: user.first_name + ' ' + user.last_name,
                                                                                        phone: user.country_phone_code + user.phone
                                                                                    },
                                                                                    provider_type: 0,
                                                                                    provider_type_id: null,
                                                                                    provider_id: null,
                                                                                    provider_unique_id: 0,
                                                                                    delivery_status: ORDER_STATE.WAITING_FOR_DELIVERY_MAN,
                                                                                    delivery_status_manage_id: ORDER_STATUS_ID.RUNNING,
                                                                                    delivery_status_by: null,
                                                                                    current_provider: null,
                                                                                    delivery_type: delivery_type,
                                                                                    providers_id_that_rejected_order_request: [],
                                                                                    confirmation_code_for_pick_up_delivery: order.confirmation_code_for_pick_up_delivery,
                                                                                    confirmation_code_for_complete_delivery: order.confirmation_code_for_complete_delivery,

                                                                                    is_forced_assigned: false,
                                                                                    provider_location: [],
                                                                                    provider_previous_location: [],
                                                                                    pickup_addresses: cart.pickup_addresses,
                                                                                    destination_addresses: cart.destination_addresses,
                                                                                    cancel_reasons: [],
                                                                                    completed_at: null

                                                                                });
                                                                                request.save().then(() => {
                                                                                    order_payment.order_id = order._id;
                                                                                    order_payment.order_unique_id = order.unique_id;
                                                                                    order_payment.save();
                                                                                    order.request_id = request._id;
                                                                                    order.save();
                                                                                    my_request.findNearestProviderWithoutPushData(request, null);
                                                                                    response_data.json({
                                                                                        success: true, order_id: order._id,
                                                                                        message: ORDER_MESSAGE_CODE.ORDER_CREATE_SUCCESSFULLY
                                                                                    });

                                                                                }, (error) => {
                                                                                    //console.log(error)
                                                                                    response_data.json({
                                                                                        success: false,
                                                                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                                    });
                                                                                });
                                                                            } else {
                                                                                response_data.json({
                                                                                    success: true, order_id: order._id,
                                                                                    message: ORDER_MESSAGE_CODE.ORDER_CREATE_SUCCESSFULLY
                                                                                });
                                                                            }
                                                                        });

                                                                    }, (error) => {
                                                                        Promo_code.findOne({ _id: order_payment.promo_id }).then((promo_code) => {
                                                                            if (promo_code) {
                                                                                promo_code.used_promo_code = promo_code.used_promo_code - 1;
                                                                                promo_code.save();
                                                                            }
                                                                        });
                                                                        order_payment.promo_id = null;
                                                                        order_payment.save();
                                                                        var added_wallet = 0;
                                                                        added_wallet = +order_payment.wallet_payment + +order_payment.card_payment;

                                                                        // Entry in wallet Table //
                                                                        /*if (added_wallet > 0) {
                                                                            var order_wallet_payment = added_wallet;
                                                                            
                                                                            var total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.USER, user.unique_id, user._id, user.country_id,
                                                                                    order_payment.order_currency_code, user.wallet_currency_code,
                                                                                    order_payment.wallet_to_order_current_rate, order_wallet_payment, user.wallet, WALLET_STATUS_ID.ADD_WALLET_AMOUNT, WALLET_COMMENT_ID.ORDER_REFUND, "Refund Amount Of Order", {_id: order._id, unique_id: order.unique_id})

                                                                            user.wallet = total_wallet_amount;
                                                                            user.save();

                                                                            order_payment.is_order_payment_refund = true;
                                                                            order_payment.refund_amount = added_wallet;
                                                                            order_payment.save();

                                                                            // sms to user refund amount.
                                                                            if (setting_detail.is_sms_notification) {
                                                                                SMS.sendSmsForOTPVerificationAndForgotPassword(user.country_phone_code + user.phone, SMS_UNIQUE_ID.USER_PAYMENT_REFUND, added_wallet);

                                                                            }

                                                                            // email to user refund amount.
                                                                            if (setting_detail.is_mail_notification) {
                                                                                emails.sendUserRefundAmountEmail(request_data, user, added_wallet);

                                                                            }
                                                                        }*/

                                                                        response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_FAILED });

                                                                    });

                                                                });
                                                            }
                                                        }, (error) => {
                                                            //console.log(error)
                                                            response_data.json({
                                                                success: false,
                                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                            });
                                                        });
                                                        // }
                                                    }, (error) => {
                                                        //console.log(error)
                                                        response_data.json({
                                                            success: false,
                                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                        });
                                                    });
                                                } else {
                                                    response_data.json({ success: false, error_code: ORDER_ERROR_CODE.ORDER_FAILED });

                                                }
                                            }, (error) => {
                                                //console.log(error)
                                                response_data.json({
                                                    success: false,
                                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                });
                                            });

                                        } else {
                                            response_data.json({ success: false, error_code: CART_ERROR_CODE.CART_NOT_FOUND });
                                        }
                                    }, (error) => {
                                        //console.log(error)
                                        response_data.json({
                                            success: false,
                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                        });
                                    });

                                }
                            }, (error) => {
                                //console.log(error)
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });
                        });
                    });

                }
            }, 
            
      
      
      
      
      
      
      
        (error) => {
                //console.log(error)
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
// end of create order




//show form
exports.getform = async (req, res) => {
    try {
        const data = await vendor.find();
        if (!data) {
            return res.status(404).json({ success: true, msg: "No Vendors found!" });
        }
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
}

// approve and email share
exports.approve = async (req, res) => {
    try {
        const id = req.body._id;
        const newData = req.body;
        const result = await vendor.findOneAndUpdate({ _id: req.body._id }, req.body, { new: true });

        const document = await vendor.findById(req.body._id);

        if (!document) {
            return res.status(404).json({ success: false, msg: "Vendor Id not given" });
        }

        if (document.approve === true) {
            const data = await vendor.findById(req.body._id);

            const mailOptions = {
                from: 'info@dextratechnologies.com',
                to: data.mailing_address,
                subject: "hai " + data.company_name,
                text: "venderToken - " + data.vendor_token,
            };

            vendorMail.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log("error: ", error);
                    return res.status(500).json({ success: false, msg: "Error sending email" });

                } else {

                    return res.status(200).json({ success: true, msg: 'Token Sent Successfully, Vendor got Approved!' });

                }
            })
        } else {
            const result = await vendor.findByIdAndUpdate(
                req.body._id,
                { status: 0 },
                { new: true }
            );
            return res.status(201).json({ success: true, msg: "Vendor got disapproved!" });

        }

    } catch (err) {
        // console.log("success");
        res.status(500).json({ err })
    }
}










   

    