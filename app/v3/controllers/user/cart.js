require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/push_code');
require('../../utils/constants');
var User = require('mongoose').model('user');
var Provider = require('mongoose').model('provider');
var Store = require('mongoose').model('store');
var Order_payment = require('mongoose').model('order_payment');
var Cart = require('mongoose').model('cart');
var Country = require('mongoose').model('country');
var City = require('mongoose').model('city');
var Payment_gateway = require('mongoose').model('payment_gateway');
var Promo_code = require('mongoose').model('promo_code');
var mongoose = require('mongoose');
var utils = require('../../utils/utils');
var my_cart = require('../../controllers/user/cart');
var geolib = require('geolib');
var console = require('../../utils/console');
const { json } = require('express');


// replace order or reorder
exports.replace_order = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'order_id', type: 'string'}, {name: 'user_id', type: 'string'}], function (response) {
        if (response.success) 
        {
            var request_data_body = request_data.body;
           
            Cart.findOne({$and: [{user_id: mongoose.Types.ObjectId(request_data_body.user_id), order_id: mongoose.Types.ObjectId(request_data_body.order_id)}]}).then((ReorderItems) => {
                                    
                if (ReorderItems.length == 0) 
                {
                    response_data.json({ success: false, error_code: REORDER_ERROR_CODE.NO_DATA_FOUND });
                } 
                else 
                {
                    User.findOne({$and: [{_id: mongoose.Types.ObjectId(request_data_body.user_id), cart_id: null}]}).then((user_cart) => {

                        if (user_cart)
                        {
                            var cart_items = new Cart({
                                cart_unique_token: "",
                                user_id: ReorderItems.user_id,
                                user_type: ReorderItems.user_type,
                                user_type_id: ReorderItems.user_type_id,
                                store_id: ReorderItems.store_id,
                                order_payment_id: null,
                                order_id: null,
                                city_id: ReorderItems.city_id,
                                total_item_tax: ReorderItems.total_item_tax,
                                delivery_type: ReorderItems.delivery_type,
                                language: ReorderItems.language,     
                                total_item_count: ReorderItems.total_item_count,
                                pickup_addresses: ReorderItems.pickup_addresses,
                                destination_addresses: ReorderItems.destination_addresses,
                                order_details: ReorderItems.order_details,
                                total_item_count: ReorderItems.total_item_count,
                                total_cart_price: ReorderItems.total_cart_price,
                                delivery_type: ReorderItems.delivery_type,
                                is_use_item_tax: ReorderItems.is_use_item_tax,
                                is_tax_included: ReorderItems.is_tax_included,
                                store_taxes: ReorderItems.store_taxes,
                                table_no: ReorderItems.table_no,
                                no_of_persons: ReorderItems.no_of_persons,
                                booking_type: ReorderItems.booking_type
                            });

                            cart_items.save().then(() => {
                                
                                if (user_cart)
                                {
                                    user_cart.cart_id = cart_items._id;
                                    user_cart.save();
                                }

                                response_data.json
                                ({ 
                                    success: true,
                                    message: REORDER_MESSAGE_CODE.ORDER_REPLACED_SUCCESSFULLY 
                                });
                            }); 
                        }
                        else
                        {
                            response_data.json({ success: false, error_code: REORDER_ERROR_CODE.REORDER_FAILED });
                        }  
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
        } 
        else 
        {
            response_data.json(response);
        }
    });
};


// user add_item_in_cart
exports.add_item_in_cart = function (request_data, response_data) {
    
   
    utils.check_request_params(request_data.body, [{name: 'pickup_addresses'}, {name: 'destination_addresses'}], function (response) {
        
        if (response.success) {
            var request_data_body = request_data.body;
            var cart_unique_token = request_data_body.cart_unique_token;
            var user_type = Number(request_data_body.user_type);
            if(request_data_body.user_id == ''){
                request_data_body.user_id = null  
            }
            if(!request_data.headers.lang){
                request_data.headers.lang = 0;
                
            }
            User.findOne({_id: request_data_body.user_id}).then((user) => {
                if (user && request_data_body.server_token !== null && user.server_token !== request_data_body.server_token)
                {
                    response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                    // console.log(user.server_token);
                    // console.log(request_data_body.server_token);
                    // console.log(user && request_data_body.server_token !== null && user.server_token !== request_data_body.server_token);

                } else
                {
                    var cart_id = null;
                    if (request_data_body.cart_id != undefined) {
                        cart_id = request_data_body.cart_id;
                    } else
                    {
                        cart_id = null;
                    }
                    var user_id = null;

                    var delivery_type = DELIVERY_TYPE.STORE;
                    if(request_data_body.delivery_type){
                        delivery_type = request_data_body.delivery_type;
                    }
                    if(delivery_type == DELIVERY_TYPE.COURIER){
                        request_data_body.store_id = null;
                    }
                    var query = {
                        $match: {
                            $and: [{ _id: mongoose.Types.ObjectId(request_data_body.store_id)}]
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
                        if(delivery_type == DELIVERY_TYPE.STORE && store && store.is_business === false){
                            response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_BUSINESS_OFF});
                        } else
                        {
                            var country_id = request_data_body.country_id;
                            var city_id = request_data_body.city_id;
                            var store_id = null;
                            if(store){
                                country_id = store.country_id;
                                city_id = store.city_id;
                                store_id = store._id;
// console.log(request_data_body.pickup_addresses[0]);
                                request_data_body.pickup_addresses[0].address = store.address;
                                request_data_body.pickup_addresses[0].location = store.location;
                                request_data_body.pickup_addresses[0].user_details.country_phone_code = store.country_phone_code;
                                request_data_body.pickup_addresses[0].user_details.email = store.email;
                                var store_name = store.name[Number(request_data.headers.lang)];
                                if(!store_name || store_name == ''){
                                    store_name = store.name[0];
                                }
                                if(!store_name){
                                    store_name = "";
                                }
                                request_data_body.pickup_addresses[0].user_details.name = store_name;
                                request_data_body.pickup_addresses[0].user_details.phone = store.phone;                                
                            }

                            Country.findOne({_id: country_id}).then((country_detail) => {

                                var country_phone_code = '';
                                var wallet_currency_code = '';
                                var country_code = '';
 
                                if(country_detail){
                                    country_id = country_detail._id;
                                    country_phone_code = country_detail.country_phone_code;
                                    wallet_currency_code = country_detail.currency_code;
                                    country_code = country_detail.country_code;
                                }

                                var phone = request_data_body.destination_addresses[0].user_details.phone;
                                var email = request_data_body.destination_addresses[0].user_details.email;
                                var query = {$or: [{'email': email}, {'phone': phone}]};
                                // var query =  {'phone': phone};
                                
                                User.findOne(query).then((user_phone_data) => {

                                    if (user_type == ADMIN_DATA_ID.STORE && request_data_body.destination_addresses.length > 0)
                                    {
                                        if (user_phone_data)
                                        {
                                            console.log('save cart to user')
                                            user_phone_data.cart_id = cart_id;
                                            user_phone_data.save();
                                            user = user_phone_data;
                                            console.log(user);
                                        } else
                                        {

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
                                            
                                            utils.insert_documets_for_new_users(user_data, null, ADMIN_DATA_ID.USER, country_id, function(document_response){
                                                user_data.is_document_uploaded = document_response.is_document_uploaded;
                                                console.log('new user cart')
                                                user_data.save();
                                                user = user_data;
                                                console.log('new user document')
                                            });
                                            
                                        }
                                    }

                                    if (user)
                                    {
                                        cart_id = user.cart_id;
                                        // console.log(cart_id)
                                        user_id = user._id;
                                        cart_unique_token = null;
                                    }
                                    
                                // console.log(_id);
                                    Cart.findOne({$or: [{_id: cart_id}, {cart_unique_token: cart_unique_token}]}).then((cart) => {
                             

                                        if (cart && (!cart.store_id || cart.store_id.equals(store_id) || !store_id ) ) {
                                            
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
                                                        user_id: user_id
                                                    });
                                                }, (error) => {
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
                                        } else {
                                            // console.log('else');
                                            var total_cart_price = request_data_body.total_cart_price;
                                            var total_item_tax = 0;
                                            if(store){
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
                                                    if(total_cart_price){
                                                        store.taxes_details.forEach(tax => {
                                                            total_item_tax = total_item_tax + (total_cart_price - (100*total_cart_price) / (100+tax.tax));
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

                                            if (request_data_body.user_id != "" && request_data_body.user_id != undefined)
                                            {
                                                cart.cart_unique_token = "";
                                            }

                                            cart.save().then(() => {
                                                // console.log(user)
                                                if (user)
                                                {
                                                    user.cart_id = cart._id;
                                                    user.save();
                                                    // console.log('user new cart')
                                                    // console.log(user.cart_id)
                                                }

                                                response_data.json({
                                                    success: true, 
                                                    message: CART_MESSAGE_CODE.CART_ADDED_SUCCESSFULLY,
                                                    cart_id: cart._id,
                                                    city_id: city_id,
                                                    user_id: user_id
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
        } else {
            response_data.json(response);
        }
    });
};


// get cart 
exports.get_cart = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name: 'cart_unique_token', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var cart_unique_token = request_data_body.cart_unique_token;
            if(request_data_body.user_id == ''){
                request_data_body.user_id = null
            }

            User.findOne({_id: request_data_body.user_id}).then((user) => {

                if (user && request_data_body.server_token !== null && user.server_token !== request_data_body.server_token)
                {
                    response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                } else
                {
                    var cart_id = null;
                    var user_id = null;

                    if (user)
                    {
                        cart_id = user.cart_id;
                        user_id = user._id;
                        cart_unique_token = null;
                    }

                    Cart.findOne({$or: [{_id: cart_id}, {cart_unique_token: cart_unique_token}]}).then((cart_detail) => {

                        if (cart_detail) {

                            cart_id = cart_detail._id;

                            var query = {
                                $match: {
                                    _id: { $eq: mongoose.Types.ObjectId(cart_detail.store_id) }
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

                            Store.aggregate([query, tax_lookup]).then((store_detials) => {
                                var store = store_detials[0]
                                // Store.findOne({_id: cart_detail.store_id}).then((store) => {

                                if (store)
                                {
                                    if (store.is_business)
                                    {
                                        Country.findOne({_id: store.country_id}).then((country) => {

                                            var currency = "";
                                            if (country)
                                            {
                                                currency = country.currency_sign;
                                            }

                                            Cart.aggregate([

                                                {$match: {'_id': {$eq: cart_id}}},
                                                {$unwind: "$order_details"},
                                                {$unwind: "$order_details.items"},
                                                {$lookup: {
                                                        from: "items",
                                                        localField: "order_details.items.unique_id",
                                                        foreignField: "unique_id",
                                                        as: "order_details.items.item_details"
                                                    }
                                                },
                                                {
                                                    $match: {$and: [{"order_details.items.item_details.is_item_in_stock": true},
                                                            {"order_details.items.item_details.is_visible_in_store": true}]
                                                    }
                                                },
                                                {$unwind: "$order_details.items.item_details"},
                                                {
                                                    $lookup: {
                                                        from: "taxes",
                                                        localField: "order_details.items.item_details.item_taxes",
                                                        foreignField: "_id",
                                                        as: "order_details.items.item_details.tax_details"
                                                    }
                                                },
                                                {$project: {
                                                        "_id": 1,
                                                        "user_type": 1,
                                                        "store_id": 1,
                                                        "order_payment_id": 1,
                                                        "total_item_tax": 1,
                                                        "delivery_type": 1,
                                                        "pickup_addresses": 1,
                                                        "destination_addresses": 1,
                                                        "total_item_count": 1,
                                                        "total_cart_price": 1,
                                                        "cart_unique_token": 1,
                                                        "user_id": 1,
                                                        "user_type_id": 1,
                                                        "order_id": 1,
                                                        "city_id": 1,
                                                        "unique_id": 1,
                                                        "order_details.product_id": "$order_details.product_id",
                                                        "order_details.product_name": "$order_details.product_name",
                                                        "order_details.total_item_tax": "$order_details.total_item_tax",
                                                        "order_details.total_item_price": "$order_details.total_item_price",
                                                        "order_details.unique_id": "$order_details.unique_id",
                                                        "order_details.items.details": "$order_details.items.details",
                                                        "order_details.items.image_url": "$order_details.items.image_url",
                                                        "order_details.items.item_id": "$order_details.items.item_id",
                                                        "order_details.items.item_name": "$order_details.items.item_name",
                                                        "order_details.items.note_for_item": "$order_details.items.note_for_item",
                                                        "order_details.items.item_price": "$order_details.items.item_price",
                                                        "order_details.items.item_tax": "$order_details.items.item_tax",
                                                        "order_details.items.max_item_quantity": "$order_details.items.max_item_quantity",
                                                        "order_details.items.quantity": "$order_details.items.quantity",
                                                        "order_details.items.specifications": "$order_details.items.specifications",
                                                        "order_details.items.tax": "$order_details.items.tax",
                                                        "order_details.items.total_item_price": "$order_details.items.total_item_price",
                                                        "order_details.items.total_item_tax": "$order_details.items.total_item_tax",
                                                        "order_details.items.total_price": "$order_details.items.total_price",
                                                        "order_details.items.total_specification_price": "$order_details.items.total_specification_price",
                                                        "order_details.items.total_specification_tax": "$order_details.items.total_specification_tax",
                                                        "order_details.items.total_tax": "$order_details.items.total_tax",
                                                        "order_details.items.unique_id": "$order_details.items.unique_id",
                                                        "order_details.items.tax_details": "$order_details.items.tax_details",
                                                        "order_details.items.item_details._id": "$order_details.items.item_details._id",
                                                        "order_details.items.item_details.super_item_id": "$order_details.items.item_details.super_item_id",
                                                        "order_details.items.item_details.name": { $ifNull: [{$arrayElemAt: [ "$order_details.items.item_details.name", Number(request_data.headers.lang) ]}, { $ifNull: [{$arrayElemAt: [ "$order_details.items.item_details.name", 0 ]}, ""] }] },
                                                        "order_details.items.item_details.details": { $ifNull: [{$arrayElemAt: [ "$order_details.items.item_details.details", Number(request_data.headers.lang) ]}, { $ifNull: [{$arrayElemAt: [ "$order_details.items.item_details.details", 0 ]}, ""] }] },
                                                        "order_details.items.item_details.price": "$order_details.items.item_details.price",
                                                        "order_details.items.item_details.offer_message_or_percentage": "$order_details.items.item_details.offer_message_or_percentage",
                                                        "order_details.items.item_details.item_price_without_offer": "$order_details.items.item_details.item_price_without_offer",
                                                        "order_details.items.item_details.total_quantity": "$order_details.items.item_details.total_quantity",
                                                        "order_details.items.item_details.in_cart_quantity": "$order_details.items.item_details.in_cart_quantity",
                                                        "order_details.items.item_details.total_added_quantity": "$order_details.items.item_details.total_added_quantity",
                                                        "order_details.items.item_details.total_used_quantity": "$order_details.items.item_details.total_used_quantity",
                                                        "order_details.items.item_details.sequence_number": "$order_details.items.item_details.sequence_number",
                                                        "order_details.items.item_details.note_for_item": "$order_details.items.item_details.note_for_item",
                                                        "order_details.items.item_details.unique_id_for_store_data": "$order_details.items.item_details.unique_id_for_store_data",
                                                        "order_details.items.item_details.is_item_in_stock": "$order_details.items.item_details.is_item_in_stock",
                                                        "order_details.items.item_details.is_item_in_stock": "$order_details.items.item_details.is_item_in_stock",
                                                        "order_details.items.item_details.is_most_popular": "$order_details.items.item_details.is_most_popular",
                                                        "order_details.items.item_details.is_visible_in_store": "$order_details.items.item_details.is_visible_in_store",
                                                        "order_details.items.item_details.tax": "$order_details.items.item_details.tax",
                                                        "order_details.items.item_details.specifications_unique_id_count": "$order_details.items.item_details.specifications_unique_id_count",
                                                        "order_details.items.item_details.specifications": "$order_details.items.item_details.specifications",
                                                        "order_details.items.item_details.image_url": "$order_details.items.item_details.image_url",
                                                        "order_details.items.item_details.store_id": "$order_details.items.item_details.store_id",
                                                        "order_details.items.item_details.product_id": "$order_details.items.item_details.product_id",
                                                        "order_details.items.item_details.unique_id": "$order_details.items.item_details.unique_id",
                                                        "order_details.items.item_details.tax_details": "$order_details.items.item_details.tax_details",
                                                    }
                                                },
                                                {$group: {
                                                        _id: {order_id: '$_id', unique_id: "$order_details.unique_id"},
                                                        "items": {$push: "$order_details.items"}
                                                    }
                                                },
                                                {$lookup: {
                                                        from: "products",
                                                        localField: "_id.unique_id",
                                                        foreignField: "unique_id",
                                                        as: "_id.product_detail"
                                                    }
                                                },
                                                {
                                                    $match: {
                                                        "_id.product_detail.is_visible_in_store": true
                                                    }
                                                },
                                                {$unwind: "$_id.product_detail"},
                                                {$project: {
                                                        "order_detail.unique_id": "$_id.unique_id",
                                                        "order_detail.product_detail._id": "$_id.product_detail._id",
                                                        "order_detail.product_detail.name": { $ifNull: [{$arrayElemAt: [ "$_id.product_detail.name", Number(request_data.headers.lang) ]}, { $ifNull: [{$arrayElemAt: [ "$_id.product_detail.name", 0 ]}, ""] }] },
                                                        "order_detail.product_detail.is_visible_in_store": "$_id.product_detail.is_visible_in_store",
                                                        "order_detail.product_detail.super_product_id": "$_id.product_detail.super_product_id",
                                                        "order_detail.product_detail.group_id": "$_id.product_detail.group_id",
                                                        "order_detail.product_detail.unique_id_for_store_data": "$_id.product_detail.unique_id_for_store_data",
                                                        "order_detail.product_detail.sequence_number": "$_id.product_detail.sequence_number",
                                                        "order_detail.product_detail.store_id": "$_id.product_detail.store_id",
                                                        "order_detail.product_detail.unique_id": "$_id.product_detail.unique_id",
                                                        "order_detail.items": "$items"
                                                    }
                                                },
                                                {$group: {
                                                        _id: '$_id.order_id',
                                                        order_details: {$push: "$order_detail"}
                                                    }
                                                }
                                            ]).then((cart) => {
                                                if (cart.length == 0) {
                                                    response_data.json({success: false, error_code: CART_ERROR_CODE.CART_NOT_FOUND});
                                                } else
                                                {
                                                    store_name = "";
                                                    var store_name = store.name[Number(request_data.headers.lang)];
                                                    if(!store_name || store_name == ''){
                                                        store_name = store.name[0];
                                                    }
                                                    if(!store_name){
                                                        store_name = "";
                                                    }
                                                    response_data.json({success: true,
                                                        message: CART_MESSAGE_CODE.CART_GET_SUCCESSFULLY,
                                                        currency: currency,
                                                        cart_id: cart_detail._id,
                                                        city_id: cart_detail.city_id,
                                                        store_id: store._id,
                                                        delivery_type: cart_detail.delivery_type,
                                                        booking_type: cart_detail.booking_type,
                                                        tax_details: store.tax_details,
                                                        languages_supported: store.languages_supported,
                                                        store_time: store.store_time, 
                                                        is_use_item_tax: store.is_use_item_tax,
                                                        is_tax_included: store.is_tax_included,
                                                        item_tax: store.item_tax,
                                                        name: store_name,
                                                        max_item_quantity_add_by_user: store.max_item_quantity_add_by_user,
                                                        destination_addresses: cart_detail.destination_addresses,
                                                        pickup_addresses: cart_detail.pickup_addresses,
                                                        no_of_persons: cart_detail.no_of_persons,
                                                        table_no: cart_detail.no_of_persons,
                                                        cart: cart[0]});
                                                }
                                            }, (error) => {
                                                console.log(error);
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
                                    } else
                                    {
                                        if (user)
                                        {
                                            user.cart_id = null;
                                            user.save();
                                        }
                                        response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_BUSINESS_OFF});
                                    }

                                } else
                                {
                                    response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND});
                                }
                            }, (error) => {
                                console.log(error)
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });
                        } else
                        {
                            response_data.json({success: false, error_code: CART_ERROR_CODE.CART_NOT_FOUND});
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
};

// clear_cart
exports.clear_cart = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [{name: 'cart_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var cart_id = request_data_body.cart_id;
            if(request_data_body.user_id == ''){
                request_data_body.user_id = null
            }
            
            User.findOne({_id: request_data_body.user_id}).then((user) => {

                if (user && request_data_body.server_token !== null && user.server_token !== request_data_body.server_token)
                {
                    response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
                } else
                {
                    Cart.findOne({_id: cart_id,order_id:null}).then((cart) => {
                        if (cart) {
                            if (cart.order_payment_id != null) {
                                var order_payment_id = cart.order_payment_id;
                                Order_payment.findOne({_id: order_payment_id}).then((order_payment) => {
                                    if (order_payment)
                                    {
                                        var promo_id = order_payment.promo_id;
                                        if (promo_id != null) {
                                            Promo_code.findOne({_id: promo_id}).then((promo_code) => {
                                                if (promo_code) {
                                                    promo_code.used_promo_code = promo_code.used_promo_code - 1;
                                                    promo_code.save();
                                                    user.promo_count = user.promo_count - 1;
                                                    user.save();
                                                }
                                            });
                                        }

                                        Order_payment.remove({_id: order_payment_id}).then(() => {});
                                    }
                                }, (error) => {
                                    console.log(error)
                                });
                            }
                            Cart.remove({_id: cart_id}).then(() => {
                                
                                    if (user)
                                    {
                                        user.cart_id = null;
                                        user.save();
                                    }
                                    response_data.json({success: true,
                                        message: CART_MESSAGE_CODE.CART_DELETE_SUCCESSFULLY,
                                    });
                            }, (error) => {
                                console.log(error)
                                response_data.json({
                                    success: false,
                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                });
                            });
                        }else{
                            user.cart_id = null;
                            user.save();
                            response_data.json({success: false, error_code: CART_ERROR_CODE.CART_DELETE_FAILED});
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
};

// get_payment_gateway
exports.get_payment_gateway = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [{name: 'city_id', type: 'string'}], function (response) {
        if (response.success) {

            let request_data_body = request_data.body;
            let city_id = request_data_body.city_id;
            let type = Number(request_data_body.type); // 7 = User , 8 = Provider , 2 = Store
            let Table;
            let user_id = request_data_body.user_id
            switch (type) {
                case ADMIN_DATA_ID.USER:
                    Table = User;
                    break;
                case ADMIN_DATA_ID.PROVIDER:
                    Table = Provider;
                    break;
                case ADMIN_DATA_ID.STORE:
                    Table = Store;
                    // user_id = request_data_body.store
                    break;
                default:
                    Table = User;
                    break;
            }
// console.log(Table);
            if (user_id) {
                Table.findOne({ _id: user_id }).then((detail) => {
                    // console.log('-------get_payment_gateways-------')
                    //  console.log(detail);
                    //  console.log(city_id);
                    if (detail) {
                        if (request_data_body.server_token !== null && detail.server_token !== request_data_body.server_token) {
                            response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                        } else {
                            if (city_id != "" && city_id != undefined && city_id != null) {
                                my_cart.get_payment_gateway_from_city(request_data, detail, city_id, response_data);
                            } else {

                                var country = request_data_body.country;
                                var country_code = request_data_body.country_code;
                                var country_code_2 = request_data_body.country_code_2;

                                Country.findOne({ $and: [{ $or: [{ country_name: country }, { country_code: country_code }, { country_code_2: country_code_2 }] }, { is_business: true }] }).then((country_data) => {

                                    if (!country_data) {
                                        my_cart.get_payment_gateway_from_city(request_data, detail, null, response_data);
                                    } else {
                                        var city_lat_long = [request_data_body.latitude, request_data_body.longitude];
                                        var country_id = country_data._id;

                                        City.find({ country_id: country_id, is_business: true }).then((cityList) => {

                                            var size = cityList.length;
                                            var count = 0;
                                            if (size == 0) {
                                                my_cart.get_payment_gateway_from_city(request_data, detail, null, response_data);
                                            } else {
                                                var finalCityId = null;
                                                var finalDistance = 1000000;
                                                cityList.forEach(function (city_detail) {
                                                    count++;
                                                    var cityLatLong = city_detail.city_lat_long;
                                                    var distanceFromSubAdminCity = utils.getDistanceFromTwoLocation(city_lat_long, cityLatLong);
                                                    var cityRadius = city_detail.city_radius;
                                                    if (city_detail.is_use_radius) {
                                                        if (distanceFromSubAdminCity < cityRadius) {
                                                            if (distanceFromSubAdminCity < finalDistance) {
                                                                finalDistance = distanceFromSubAdminCity;
                                                                finalCityId = city_detail._id;
                                                            }
                                                        }
                                                    } else {
                                                        var store_zone = false;
                                                        if (city_detail.city_locations.length > 0) {
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
                                                            my_cart.get_payment_gateway_from_city(request_data, detail, finalCityId, response_data);
                                                        } else {
                                                            my_cart.get_payment_gateway_from_city(request_data, detail, null, response_data);
                                                        }
                                                    }

                                                });
                                            }
                                        },(error) => {
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
                        }

                    } else {
                        console.log('else')
                        
                        response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND });
                    }
                }, (error) => {
                    console.log(error)
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                });
            } else {
                if (request_data_body.city_id && request_data_body.store) {
                    Store.findById(request_data_body.store).then(store => {
                        if (store) {
                            let detail = {
                                wallet_currency_code: store.wallet_currency_code,
                                is_use_wallet: false,
                                wallet: 0
                            }
                            my_cart.get_payment_gateway_from_city(request_data, detail, request_data_body.city_id, response_data);
                        } else {
                            response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND });
                        }
                    })
                } else {
                    response_data.json({ success: false, error_code: USER_ERROR_CODE.USER_DATA_NOT_FOUND });
                }
            }
        } else {
            response_data.json(response);
        }
    });
};

//get_payment_gateway_from_city
exports.get_payment_gateway_from_city = function (request_data, detail, city_id, response_data) {

    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var type = Number(request_data_body.type); // 7 = User , 8 = Provider , 2 = Store

            if (city_id != "" && city_id != undefined && city_id != null) {

                City.findOne({_id: city_id}).then((city) => {
                    if (city) {
                        Payment_gateway.find({'_id': {$in: city.payment_gateway}, is_payment_visible: true}).then((payment_gateway) => {
                            if (city.is_other_payment_mode == false || payment_gateway.length == 0) {
                                payment_gateway = [];
                            }
                            if (type == ADMIN_DATA_ID.USER)
                            {
                                response_data.json({success: true,
                                    message: PAYMENT_GATEWAY_MESSAGE_CODE.LIST_SUCCESSFULLY,
                                    wallet_currency_code: detail.wallet_currency_code,
                                    is_use_wallet: detail.is_use_wallet,
                                    is_cash_payment_mode: city.is_cash_payment_mode,
                                    wallet: detail.wallet, payment_gateway: payment_gateway});
                            } else
                            {
                                response_data.json({success: true,
                                    message: PAYMENT_GATEWAY_MESSAGE_CODE.LIST_SUCCESSFULLY,
                                    wallet_currency_code: detail.wallet_currency_code,
                                    is_cash_payment_mode: city.is_cash_payment_mode,
                                    wallet: detail.wallet, payment_gateway: payment_gateway});
                            }
                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    } else
                    {

                        var payment_gateway = [];
                        response_data.json({success: true,
                            message: PAYMENT_GATEWAY_MESSAGE_CODE.LIST_SUCCESSFULLY,
                            wallet_currency_code: detail.wallet_currency_code,
                            is_use_wallet: detail.is_use_wallet,
                            is_cash_payment_mode: false,
                            wallet: detail.wallet, payment_gateway: payment_gateway});
                    }
                }, (error) => {
                    console.log(error)
                    response_data.json({
                        success: false,
                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                    });
                });
            } else {

                var payment_gateway = [];
                response_data.json({success: true,
                    message: PAYMENT_GATEWAY_MESSAGE_CODE.LIST_SUCCESSFULLY,
                    wallet_currency_code: detail.wallet_currency_code,
                    is_use_wallet: detail.is_use_wallet,
                    is_cash_payment_mode: false,
                    wallet: detail.wallet, payment_gateway: payment_gateway});
            }
        } else {
            response_data.json(response);
        }
    });
};

exports.check_delivery_available = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            City.findOne({_id: request_data_body.city_id}, function(error, city_detail){
                if(city_detail){

                    var store_zone = false;
                    if(city_detail.city_locations.length > 0){
                        store_zone = geolib.isPointInPolygon(
                            {latitude: request_data_body.latitude, longitude: request_data_body.longitude},
                            city_detail.city_locations);
                    }
                    var distance = utils.getDistanceFromTwoLocation(city_detail.city_lat_long, [request_data_body.latitude, request_data_body.longitude]);

                    if ((city_detail.is_use_radius && distance <= city_detail.city_radius) || store_zone) {
                        
                        response_data.json({success: true, message: CART_MESSAGE_CODE.DESTINATION_CHANGE_SUCCESSFULLY });
                        
                    } else {
                        response_data.json({success: false, error_code: CART_ERROR_CODE.YOUR_DELIVERY_ADDRESS_OUT_OF_AREA});
                    }
                } else {

                }
            })
        } else {
            response_data.json(response);
        }
    });
};


//change_delivery_address
exports.change_delivery_address = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [{name: 'cart_id', type: 'string'}], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var mongoose = require('mongoose');
            var Schema = mongoose.Types.ObjectId;

            var cartid_condition = {$match: {'_id': {$eq: Schema(request_data_body.cart_id)}}};
            var store_lookup = {
                $lookup: {
                    from: "stores",
                    localField: "store_id",
                    foreignField: "_id",
                    as: "store_detail"
                }
            };
            var store_unwind = {$unwind: "$store_detail"};
            var city_lookup = {
                $lookup:
                    {
                        from: "cities",
                        localField: "store_detail.city_id",
                        foreignField: "_id",
                        as: "city_detail"
                    }
            };
            var city_unwind = {$unwind: "$city_detail"};

            Cart.aggregate([cartid_condition, store_lookup, store_unwind, city_lookup, city_unwind]).then((cart) => {

                if (cart.length == 0) {
                    response_data.json({success: false, error_code: CART_ERROR_CODE.CART_NOT_FOUND});
                } else {
                    var city = cart[0].city_detail;
                    var store = cart[0].store_detail;
                    var distance = utils.getDistanceFromTwoLocation(city.city_lat_long, request_data_body.destination_addresses[0].location);

                    Cart.findOne({_id: request_data_body.cart_id}).then((cart_detail) => {
                        var store_zone = false;
                        if(city.city_locations.length > 0){
                            store_zone = geolib.isPointInPolygon(
                            {latitude: request_data_body.destination_addresses[0].location[0], longitude: request_data_body.destination_addresses[0].location[1]},
                            city.city_locations);
                        }
                        if ((city.is_use_radius && distance <= city.city_radius) || store_zone) {
                            distance = utils.getDistanceFromTwoLocation(store.location, request_data_body.destination_addresses[0].location);
                            if (store.is_provide_delivery_anywhere || (!store.is_provide_delivery_anywhere && distance < store.delivery_radius)) {
                                cart_detail.destination_addresses = request_data_body.destination_addresses;
                                cart_detail.save().then(() => {
                                    
                                        response_data.json({success: true, message: CART_MESSAGE_CODE.DESTINATION_CHANGE_SUCCESSFULLY
                                        });
                                    
                                });
                            } else {
                                response_data.json({success: false, error_code: CART_ERROR_CODE.YOUR_DELIVERY_ADDRESS_OUT_OF_STORE_AREA});
                            }
                        } else {
                            response_data.json({success: false, error_code: CART_ERROR_CODE.YOUR_DELIVERY_ADDRESS_OUT_OF_AREA});
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
};

exports.country_city_list = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var city_lookup = {
                $lookup:
                    {
                        from: "cities",
                        localField: "_id",
                        foreignField: "country_id",
                        as: "city_list"
                    }
            };

            Country.aggregate([city_lookup]).then((country_list) => {
                response_data.json({country_list: country_list});
            }, (error) => {
                console.log(error)
                response_data.json({
                    success: false,
                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                });
            })
        } else {
            response_data.json(response);
        }
    });

};