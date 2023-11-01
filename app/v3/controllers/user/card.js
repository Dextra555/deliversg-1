require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
var emails = require('../../controllers/email_sms/emails');
var Settings = require('mongoose').model('setting')
var User = require('mongoose').model('user');
var Store = require('mongoose').model('store');
var Provider = require('mongoose').model('provider');
var Card = require('mongoose').model('card');
var wallet_history = require('../../controllers/user/wallet');
var Payment_gateway = require('mongoose').model('payment_gateway');
var Order_payment = require('mongoose').model('order_payment');
var utils = require('../../utils/utils');
var Wallet = require('./wallet')
var console = require('../../utils/console');
const compression = require('compression');
const https = require('https');
const { options } = require('../../admin_routes/service');
const { response } = require('express');

exports.test = function (request_data, response_data) {
    var request = require('request');

    request({
        uri: 'https://api.merchantwarrior.com/token/',
        method: "POST",
        form: {
            method: "addCard",
            merchantUUID: "59a287c9ceb35",
            apiKey: "ezqx1jy0",
            cardName: "Test Customer",
            cardNumber: "5123456789012346",
            cardExpiryMonth: "05",
            cardExpiryYear: "23",
        }
    }, function (error, response, body) { })
    /*  
      var mongoose = require('mongoose');
      var Schema = mongoose.Types.ObjectId;
      response_data.json({success: true})
      var Product = require('mongoose').model('product');
      var Item = require('mongoose').model('item');
      var Specification_group = require('mongoose').model('specification_group');
      var Specification = require('mongoose').model('specification');
      var Delivery = require('mongoose').model('delivery');*/

    /*var requests = [];
    var famous_products_tags = [];
    Delivery.find({},{_id:1,delivery_name:1,description:1,famous_products_tags:1},function(err,deliveries){
        deliveries.forEach(delivery => { 
            famous_products_tags =[]
            delivery.famous_products_tags.forEach(famous_products_tag => { 
                famous_products_tags.push([famous_products_tag]);
            });
            if(famous_products_tags.length > 0){
                requests.push( { 
                    'updateOne': {
                        'filter': { '_id': delivery._id },
                        'update': { '$set': { 'delivery_name': [delivery.delivery_name],'description': [delivery.description],'famous_products_tags': famous_products_tags,"is_store_can_create_group":false,"is_store_can_edit_order":false } }
                    }
                });
            }
            
            if (requests.length === 500) {
                //Execute per 500 operations and re-init
                Delivery.bulkWrite(requests);
                requests = [];
            }
        });
        if(requests.length > 0) {
            
            Delivery.bulkWrite(requests);
        }
    })
    var requests = [];
    var famous_products_tags = [];
    Store.find({},{_id:1,famous_products_tags:1},function(err,stores){
        stores.forEach(store => { 
            famous_products_tags =[]
            
            store.famous_products_tags.forEach(famous_products_tag => { 
                famous_products_tags.push([famous_products_tag]);
            });
            if(famous_products_tags.length > 0){
                requests.push( { 
                    'updateOne': {
                        'filter': { '_id': store._id },
                        'update': { '$set': { 'famous_products_tags': famous_products_tags } }
                    }
                });
            }
            
            if (requests.length === 500) {
                //Execute per 500 operations and re-init
                Store.bulkWrite(requests);
                requests = [];
            }
        });
        if(requests.length > 0) {
            
            Store.bulkWrite(requests);
        }
    })
    /*var requests = [];
    Product.find({},{_id:1,name:1},function(err,products){
        products.forEach(product => { 
            requests.push( { 
                'updateOne': {
                    'filter': { '_id': product._id },
                    'update': { '$set': { 'name': [product.name] } }
                }
            });
            
            if (requests.length === 500) {
                //Execute per 500 operations and re-init
                Product.bulkWrite(requests);
                requests = [];
            }
        });
        if(requests.length > 0) {
            
            Product.bulkWrite(requests);
        }
    })
    var requests = [];
    Item.find({},{_id:1,name:1,details:1},function(err,items){
        
        items.forEach(item => { 
            
            requests.push( { 
                'updateOne': {
                    'filter': { '_id': item._id },
                    'update': { '$set': { 'name': [item.name],'details': [item.details] } }
                }
            });
            
            if (requests.length === 500) {
                //Execute per 500 operations and re-init
                Item.bulkWrite(requests);
                requests = [];
            }
        });
        if(requests.length > 0) {
            
            Item.bulkWrite(requests);
        }
    })
    
    var requests = [];
    Specification_group.find({},{_id:1,name:1},function(err,specification_groups){
        specification_groups.forEach(specification_group => { 
            requests.push( { 
                'updateOne': {
                    'filter': { '_id': specification_group._id },
                    'update': { '$set': { 'name': [specification_group.name] } }
                }
            });
            
            if (requests.length === 500) {
                //Execute per 500 operations and re-init
                Specification_group.bulkWrite(requests);
                requests = [];
            }
        });
        if(requests.length > 0) {
            
            Specification_group.bulkWrite(requests);
        }
    })
    var requests = [];
    Specification.find({},{_id:1,name:1},function(err,specifications){
        specifications.forEach(specification => { 
            requests.push( { 
                'updateOne': {
                    'filter': { '_id': specification._id },
                    'update': { '$set': { 'name': [specification.name] } }
                }
            });
            
            if (requests.length === 500) {
                //Execute per 500 operations and re-init
                Specification.bulkWrite(requests);
                requests = [];
            }
        });
        if(requests.length > 0) {
            
            Specification.bulkWrite(requests);
        }
    })
    var requests = [];
    Item.find({},{specifications:1,_id:1},function(err,items){
        
        items.forEach(item => { 
            item.specifications.forEach(specification_g => { 
                specification_g.name = [specification_g.name];
                specification_g.list.forEach(specification => { 
                    specification.name = [specification.name];
                });
            });
            if(item.specifications.length > 0){
                requests.push( { 
                    'updateOne': {
                        'filter': { '_id': item._id },
                        'update': { '$set': { 'specifications': item.specifications } }
                    }
                });
            }
            
            if (requests.length === 500) {
                //Execute per 500 operations and re-init
                Item.bulkWrite(requests);
                requests = [];
            }
        });
        if(requests.length > 0) {            
            Item.bulkWrite(requests);
        }
    }).limit(10000).skip(40000);*/


}

exports.get_stripe_add_card_intent = async function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'payment_id', type: 'string' }], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var type = Number(request_data_body.type); // 7 = User , 8 = Provider , 2 = Store
            var Table;
            switch (type) {
                case ADMIN_DATA_ID.USER:
                    type = ADMIN_DATA_ID.USER;
                    Table = User;
                    break;
                case ADMIN_DATA_ID.PROVIDER:
                    type = ADMIN_DATA_ID.PROVIDER;
                    Table = Provider;
                    break;
                case ADMIN_DATA_ID.STORE:
                    type = ADMIN_DATA_ID.STORE;
                    Table = Store;
                    break;
                default:
                    type = ADMIN_DATA_ID.USER;
                    Table = User;
                    break;
            }


            Payment_gateway.findOne({ _id: request_data.body.payment_id }).then((payment_gateway) => {
                if (payment_gateway.name == 'Stripe') {

                    var stripe = require("stripe")(payment_gateway.payment_key);
                    stripe.setupIntents.create({
                        usage: 'on_session'
                    }, function (error, paymentIntent) {
                        console.log(error);
                        response_data.json({ success: true, client_secret: paymentIntent.client_secret })
                    });
                } else if (payment_gateway.name == 'Paystack') {

                    Table.findOne({ _id: request_data.body.user_id }).then((user_detials) => {
                        if (user_detials) {
                            if (!request_data.body.is_web) {
                                request_data.body.is_web = false;
                            }
                            var is_web = request_data.body.is_web
                            const params = JSON.stringify({
                                "email": user_detials.email,
                                "phone": user_detials.phone,
                                "amount": "10000",
                                callback_url: request_data.protocol + '://' + request_data.headers.host + "/v3/api/user/paystack_add_card_callback?user_id=" + request_data.body.user_id + '&&is_web=' + is_web + '&&type=' + type + '&&payment_id=' + request_data.body.payment_id + '&&redirect_url=' + request_data.body.url
                            })
                            const options = {
                                hostname: 'api.paystack.co',
                                port: 443,
                                path: '/transaction/initialize',
                                method: 'POST',
                                headers: {
                                    Authorization: 'Bearer ' + payment_gateway.payment_key,
                                    'Content-Type': 'application/json'
                                }
                            }
                            const https = require("https");
                            const request = https.request(options, res => {
                                let data = ''
                                res.on('data', (chunk) => {
                                    data += chunk
                                });
                                res.on('end', () => {
                                    var response = JSON.parse(data)
                                    if (response.status && response.data) {
                                        response_data.json({ success: true, authorization_url: response.data.authorization_url, access_code: response.data.access_code })
                                    } else {
                                        response_data.json({ success: false, error: response.message })
                                    }
                                })
                            }).on('error', error => {
                                console.error(error)
                            })
                            request.write(params)
                            request.end()
                        } else {
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.USER_DATA_NOT_FOUND
                            });

                        }

                    })
                }
            });

        }
    })
}

exports.paystack_add_card_callback = async function (request_data, response_data) {
    var type = Number(request_data.query.type); // 7 = User , 8 = Provider , 2 = Store
    var Table;
    switch (type) {
        case ADMIN_DATA_ID.USER:
            type = ADMIN_DATA_ID.USER;
            Table = User;
            break;
        case ADMIN_DATA_ID.PROVIDER:
            type = ADMIN_DATA_ID.PROVIDER;
            Table = Provider;
            break;
        case ADMIN_DATA_ID.STORE:
            type = ADMIN_DATA_ID.STORE;
            Table = Store;
            break;
        default:
            type = ADMIN_DATA_ID.USER;
            Table = User;
            break;
    }
    Settings.findOne({}).then((setting_detail) => {
        Payment_gateway.findOne({ _id: request_data.query.payment_id }).then((payment_detail) => {

            const options = {
                hostname: 'api.paystack.co',
                port: 443,
                path: '/transaction/verify/' + request_data.query.reference,
                method: 'GET',
                headers: {
                    Authorization: 'Bearer ' + payment_detail.payment_key
                }
            }
            const https = require('https')
            var request = https.request(options, res => {
                let data = ''
                res.on('data', (chunk) => {
                    data += chunk
                });
                res.on('end', () => {
                    var response = JSON.parse(data)
                    if (response.status && response.data.status == 'success') {

                        exports.refund_payment(response.data.reference, payment_detail.payment_key)

                        Table.findOne({ _id: request_data.query.user_id }).then((detail) => {
                            var card = new Card({
                                card_expiry_date: response.data.authorization.exp_month + '/' + response.data.authorization.exp_year,
                                card_holder_name: response.data.customer.customer,
                                payment_id: request_data.query.payment_id,
                                user_type: detail.admin_type,
                                user_id: request_data.query.user_id,
                                last_four: response.data.authorization.last4,
                                payment_token: response.data.authorization.authorization_code,
                                card_type: response.data.authorization.card_type,
                                customer_id: response.data.customer.id,
                                is_default: false
                            })
                            if (request_data.query.is_web == 'false') {
                                request_data.query.is_web = false;
                            } else {
                                request_data.query.is_web = true;
                            }
                            card.save().then(() => {
                                if (request_data.query.is_web) {
                                    console.log(request_data.query.redirect_url)
                                    response_data.redirect(setting_detail.user_base_url + request_data.query.redirect_url);
                                } else {
                                    response_data.redirect('/add_card_success')
                                }
                            })
                        })
                    } else {
                        response_data.json({
                            success: false,
                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                        })
                        response_data.redirect(setting_detail.user_base_url + request_data.query.redirect_url);

                    }
                })
            }).on('error', error => {
                console.error(error)
            })
            request.end()
        })
    })
}

exports.refund_payment = async function (reference, payment_key) {

    const params = JSON.stringify({
        "transaction": reference
    })
    const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: '/refund',
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + payment_key,
            'Content-Type': 'application/json'
        }
    }
    const https = require('https')
    const req = https.request(options, res => {
        let data = ''
        res.on('data', (chunk) => {
            data += chunk
        });
        res.on('end', () => {
            var respone = console.log(JSON.parse(data))
        })
    }).on('error', error => {
        console.error(error)
    })
    req.write(params)
    req.end()
}

exports.add_card = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'payment_id', type: 'string' }], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var type = Number(request_data_body.type); // 7 = User , 8 = Provider , 2 = Store
            var Table;
            switch (type) {
                case ADMIN_DATA_ID.USER:
                    type = ADMIN_DATA_ID.USER;
                    Table = User;
                    break;
                case ADMIN_DATA_ID.PROVIDER:
                    type = ADMIN_DATA_ID.PROVIDER;
                    Table = Provider;
                    break;
                case ADMIN_DATA_ID.STORE:
                    type = ADMIN_DATA_ID.STORE;
                    Table = Store;
                    break;
                default:
                    type = ADMIN_DATA_ID.USER;
                    Table = User;
                    break;
            }

            Table.findOne({ _id: request_data_body.user_id }).then((detail) => {
                if (detail) {
                    if (request_data_body.server_token !== null && detail.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {
                        Payment_gateway.findOne({ _id: request_data_body.payment_id }).then((payment_gateway) => {
                            var payment_gateway_name = (payment_gateway.name).toLowerCase();

                            switch (type) {
                                case ADMIN_DATA_ID.USER:
                                    var name = detail.first_name + ' ' + detail.last_name
                                    break;
                                case ADMIN_DATA_ID.PROVIDER:
                                    var name = detail.first_name + ' ' + detail.last_name
                                    break;
                                case ADMIN_DATA_ID.STORE:
                                    var name = detail.name[0]
                                    break;
                                default:
                                    var name = detail.first_name + ' ' + detail.last_name
                                    break;
                            }
                            var email = detail.email;
                            var stripe_key = payment_gateway.payment_key;
                            var stripe = require("stripe")(stripe_key);

                            if (!detail.customer_id) {
                                stripe.customers.create({
                                    payment_method: request_data.body.payment_method,
                                    email: detail.email,
                                    name: name,
                                    phone: detail.phone
                                }, function (err, customer) {
                                    console.log(err);
                                    detail.customer_id = customer.id;
                                    detail.save();
                                });
                            } else {
                                stripe.paymentMethods.attach(request_data.body.payment_method,
                                    {
                                        customer: detail.customer_id,
                                    }, function (err, customer) {

                                    });
                            }
                            stripe.paymentMethods.retrieve(
                                request_data.body.payment_method,
                                (err, paymentMethod) => {
                                    if (!paymentMethod) {
                                        response_data.json({ success: false, error_code: CARD_ERROR_CODE.INVALID_PAYMENT_TOKEN });
                                    } else {

                                        Card.find({ user_id: request_data_body.user_id, user_type: type }).then((card_data) => {

                                            var card = new Card({
                                                card_expiry_date: request_data_body.card_expiry_date,
                                                card_holder_name: request_data_body.card_holder_name,
                                                payment_id: request_data_body.payment_id,
                                                user_type: type,
                                                user_id: request_data_body.user_id,
                                                last_four: paymentMethod.card.last4,
                                                payment_token: request_data_body.payment_method,
                                                card_type: paymentMethod.card.brand,
                                                customer_id: null
                                            })

                                            if (card_data.length > 0) {
                                                card.is_default = false;
                                            } else {
                                                card.is_default = true;
                                            }

                                            card.save().then(() => {
                                                response_data.json({
                                                    success: true,
                                                    message: CARD_MESSAGE_CODE.CARD_ADD_SUCCESSFULLY,
                                                    card: card

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
                                });
                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }

                } else {
                    response_data.json({ success: false, error_code: ERROR_CODE.DETAIL_NOT_FOUND });
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

exports.get_card_list = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var type = Number(request_data_body.type); // 7 = User , 8 = Provider , 2 = Store
            var Table;
            switch (type) {
                case ADMIN_DATA_ID.USER:
                    type = ADMIN_DATA_ID.USER;
                    Table = User;
                    break;
                case ADMIN_DATA_ID.PROVIDER:
                    type = ADMIN_DATA_ID.PROVIDER;
                    Table = Provider;
                    break;
                case ADMIN_DATA_ID.STORE:
                    type = ADMIN_DATA_ID.STORE;
                    Table = Store;
                    break;
                default:
                    type = ADMIN_DATA_ID.USER;
                    Table = User;
                    break;
            }
//console.log(Table);
            Table.findOne({ _id: request_data_body.user_id }).then((detail) => {
                if (detail) {
                    if (request_data_body.server_token !== null && detail.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {
                        Card.find({ user_id: request_data_body.user_id, user_type: type, payment_id: request_data_body.payment_gateway_id }).then((cards) => {
                            if (cards.length == 0) {
                                response_data.json({ success: false, error_code: CARD_ERROR_CODE.CARD_DATA_NOT_FOUND });
                            } else {

                                response_data.json({
                                    success: true,
                                    message: CARD_MESSAGE_CODE.CARD_LIST_SUCCESSFULLY,
                                    cards: cards
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

                } else {
                    response_data.json({ success: false, error_code: ERROR_CODE.DETAIL_NOT_FOUND });
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
exports.pay_stripe_intent_payment = function (request_data, order_payment, response_data) {

    if (order_payment.remaining_payment > 0) {
        Payment_gateway.findOne({ _id: order_payment.payment_id }).then((payment_gateway) => {

            var stripe = require("stripe")(payment_gateway.payment_key);
            stripe.paymentIntents.retrieve(order_payment.payment_intent_id, function (error, intent) {

                if (intent && intent.charges && intent.charges.data) {
                    order_payment.is_payment_paid = true;
                    order_payment.cash_payment = 0;
                    order_payment.card_payment = order_payment.total_after_wallet_payment;
                    var remaining_payment = order_payment.remaining_payment;
                    order_payment.remaining_payment = 0;
                    User.findOne({ _id: order_payment.user_id }).then((user) => {
                        /*if (order_payment.wallet_payment > 0) {
                            var wallet_information = { order_payment_id : order_payment._id };
                            var total_wallet_amount = wallet_history.add_wallet_history(ADMIN_DATA_ID.USER, user.unique_id, user._id, user.country_id
                                , user.wallet_currency_code, order_payment.order_currency_code, order_payment.wallet_to_order_current_rate, order_payment.wallet_payment, user.wallet,
                                WALLET_STATUS_ID.REMOVE_WALLET_AMOUNT, WALLET_COMMENT_ID.ORDER_CHARGED, "Order Charged" , wallet_information );
                                user.wallet = total_wallet_amount;
                        }
                        user.save();*/
                        if (setting_detail.is_mail_notification) {
                            emails.sendUserOrderPaymentPaidEmail(request_data, user, order_payment.order_currency_code + remaining_payment);
                        }
                    })

                    order_payment.save(function (err) {
                        console.log(err);
                        response_data({ success: true, message: USER_MESSAGE_CODE.ORDER_PAYMENT_SUCCESSFULLY });
                    });
                } else {
                    response_data({ success: false, message: error })
                }
            });
        });
    } else {
        response_data({ success: true, message: USER_MESSAGE_CODE.ORDER_PAYMENT_SUCCESSFULLY });
    }

}
exports.get_stripe_payment_intent = async function (request_data, response_data) {
    Payment_gateway.findOne({ _id: request_data.payment_id }).then((payment_gateway) => {
        //Order_payment.findOne({_id: request_data.order_payment_id}).then((trip_detail) => {
        var amount = Number(request_data.amount);
        var user_id = request_data.user_id;
        if(user_id){
        User.findOne({ _id: user_id }).then((detail) => {
            (async () => {
                var stripe = require("stripe")(payment_gateway.payment_key);
                try {
                    if (!request_data.payment_method) {
                        Card.findOne({ user_id: detail._id, is_default: true }).then((card_detail) => {
                            if (card_detail) {
                                /*stripe.paymentIntents.create({
                                    amount: Math.round((amount * 100)),
                                    currency: detail.wallet_currency_code,
                                    customer: detail.customer_id,
                                    payment_method: card_detail.payment_token
                                }, function(error, paymentIntent){
                                    if(paymentIntent){
                                       
                                        response_data({ success: true, payment_method: card_detail.payment_token,payment_intent_id:paymentIntent.id, client_secret: paymentIntent.client_secret });
                                    } else {
                                        response_data({ success: false,error_code: USER_ERROR_CODE.CHECK_PAYMENT_FAILED, error: error.raw.message});
                                    }
                                });*/


                                console.log("Payment to Stripe Before: "+ amount);

                                let amount_in_paisa = amount * 100;
                                let amount_stripe = amount_in_paisa.toFixed(0);

                                console.log("Payment to Stripe After: "+ amount_stripe);

                                stripe.paymentIntents.create({
                                    amount: amount_stripe,
                                    currency: detail.wallet_currency_code,
                                    customer: detail.customer_id,
                                    capture_method: 'manual',
                                    payment_method: card_detail.payment_token
                                }, function (error, paymentIntent) {
                                    if (paymentIntent) {
                                        response_data({ success: true, payment_method: card_detail.payment_token, payment_intent_id: paymentIntent.id, client_secret: paymentIntent.client_secret });
                                    } else {
                                        response_data({ success: false, error_code: USER_ERROR_CODE.CHECK_PAYMENT_FAILED, error: error.raw.message });
                                    }
                                });
                            } else if(detail.customer_id === ""){
                                exports.createChargeForOrderWithoutUserLogin(request_data, response_data)
                            } else {
                                response_data({ success: false, error_code: CARD_ERROR_CODE.CARD_DATA_NOT_FOUND });
                            }
                        });
                    } else {
                        /*stripe.customers.create({
                            payment_method: request_data.body.payment_method,
                            email: detail.email,
                            name: detail.name,
                            phone: detail.phone
                        }, function (err, customer) {
                            stripe.paymentIntents.create({
                                amount: Math.round((amount * 100)),
                                currency: detail.wallet_currency_code,
                                customer: customer.id,
                                payment_method: request_data.body.payment_method
                            }, function(error, paymentIntent){
                                if(paymentIntent){
                                    
                                         detail.customer_id = customer.id;
                                         detail.save();
                                   
                                    response_data({ success: true, payment_method: request_data.body.payment_method,payment_intent_id:paymentIntent.id, client_secret: paymentIntent.client_secret });
                                } else {
                                    response_data({ success: false, error: error.raw.message});
                                }
                            });
                        });*/
                        stripe.customers.create({
                            payment_method: request_data.body.payment_method,
                            email: detail.email,
                            name: detail.name,
                            capture_method: 'manual',
                            phone: detail.phone
                        }, function (err, customer) {
                            stripe.paymentIntents.create({
                                amount: Math.round((amount * 100)),
                                currency: detail.wallet_currency_code,
                                customer: customer.id,
                                payment_method: request_data.body.payment_method
                            }, function (error, paymentIntent) {
                                if (paymentIntent) {

                                    detail.customer_id = customer.id;
                                    detail.save();

                                    response_data({ success: true, payment_method: request_data.body.payment_method, payment_intent_id: paymentIntent.id, client_secret: paymentIntent.client_secret });
                                } else {
                                    response_data({ success: false, error: error.raw.message });
                                }
                            });
                        });
                    }
                } catch (error) {
                    if (error.raw) {
                        response_data({ success: false, message: error.raw.message });
                    } else {
                        response_data({ success: false, message: error.message });
                    }
                }
            })();
        });
    }
        //});
    });
}
exports.get_stripe_payment_intent_wallet = async function (request_data, response_data) {
    console.log(request_data.body)
    Payment_gateway.findOne({ _id: request_data.body.payment_id }).then((payment_gateway) => {
        var amount = Number(request_data.body.amount);
        var user_id = request_data.body.user_id;

        var type = Number(request_data.body.type);
        Table = User;
        switch (type) {
            case ADMIN_DATA_ID.USER:
                type = ADMIN_DATA_ID.USER;
                Table = User;
                break;
            case ADMIN_DATA_ID.PROVIDER:
                type = ADMIN_DATA_ID.PROVIDER;
                Table = Provider;
                break;
            case ADMIN_DATA_ID.STORE:
                type = ADMIN_DATA_ID.STORE;
                Table = Store;
                break;
            default:
                Table = User;
                type = ADMIN_DATA_ID.USER;
                break;
        }
        Table.findOne({ _id: user_id }).then((detail) => {
            (async () => {
                var stripe = require("stripe")(payment_gateway.payment_key);
                try {
                    if (payment_gateway.name == 'Stripe') {
                        if (!request_data.body.payment_method) {
                            Card.findOne({ user_id: detail._id, is_default: true }).then((card_detail) => {
                                if (card_detail) {
                                    stripe.paymentIntents.create({
                                        amount: Math.round((amount * 100)),
                                        currency: detail.wallet_currency_code,
                                        customer: detail.customer_id,
                                        payment_method: card_detail.payment_token
                                    }, function (error, paymentIntent) {
                                        console.log(error)
                                        if (paymentIntent) {

                                            detail.payment_intent_id = paymentIntent.id;
                                            detail.save();

                                            response_data.json({ success: true, payment_method: card_detail.payment_token, client_secret: paymentIntent.client_secret, last_four: card_detail.last_four });
                                        } else {
                                            response_data.json({ success: false, error_code: USER_ERROR_CODE.CHECK_PAYMENT_FAILED, error: error.raw.message });
                                        }
                                    });
                                } else {
                                    response_data.json({ success: false, error_code: CARD_ERROR_CODE.CARD_DATA_NOT_FOUND });
                                }
                            });
                        } else {
                            stripe.customers.create({
                                payment_method: request_data.body.payment_method,
                                email: detail.email,
                                name: detail.name,
                                phone: detail.phone
                            }, function (err, customer) {
                                stripe.paymentIntents.create({
                                    amount: Math.round((amount * 100)),
                                    currency: detail.wallet_currency_code,
                                    customer: customer.id,
                                    payment_method: request_data.body.payment_method
                                }, function (error, paymentIntent) {
                                    if (paymentIntent) {
                                        if (trip_detail) {
                                            // trip_detail.payment_status = PAYMENT_STATUS.WAITING;
                                            trip_detail.is_payment_paid = true;
                                            trip_detail.save();
                                            detail.customer_id = customer.id;
                                            detail.save();
                                        }
                                        response_data.json({ success: true, payment_method: request_data.body.payment_method, client_secret: paymentIntent.client_secret });
                                    } else {
                                        response_data.json({ success: false, error: error.raw.message });
                                    }
                                });
                            });
                        }
                    } else if (payment_gateway.name == 'Paystack') {
                        if (!request_data.body.payment_method) {
                            Card.findOne({ user_id: request_data.body.user_id, is_default: true }).then((card_detail) => {
                                if (card_detail) {
                                    const params = JSON.stringify({
                                        "email": detail.email,
                                        "amount": Math.round((amount * 100)),
                                        // currency : wallet_currency_code,
                                        authorization_code: card_detail.payment_token
                                    })
                                    const options = {
                                        hostname: 'api.paystack.co',
                                        port: 443,
                                        path: '/charge',
                                        method: 'POST',
                                        headers: {
                                            Authorization: 'Bearer ' + payment_gateway.payment_key,
                                            'Content-Type': 'application/json'
                                        }
                                    }
                                    const request = https.request(options, res_data => {
                                        let data = ''
                                        res_data.on('data', (chunk) => {
                                            data += chunk
                                        });
                                        res_data.on('end', () => {
                                            var payment_response = JSON.parse(data);
                                            if (payment_response.status) {
                                                if (payment_response.data.status == 'success') {
                                                    request_data.body.paystack_data = payment_response.data;
                                                    request_data.body.wallet = amount;
                                                    Wallet.add_wallet_amount(request_data, response_data)
                                                    // response_data.json({ success: true, payment_method: card_detail.payment_token, data: payment_response });
                                                } else if (payment_response.data.status == 'open_url') {
                                                    var json_response = { success: false, error_message: 'Please Try Another Card', url: payment_response.data.url }
                                                    response_data.json(json_response)
                                                } else {
                                                    var json_response = { success: false, reference: payment_response.data.reference, required_param: payment_response.data.status, data: payment_response }
                                                    response_data.json(json_response)
                                                }
                                            } else {
                                                if (payment_response.data) {
                                                    response_data.json({ success: false, error_code: payment_response.data.message })
                                                } else {
                                                    response_data.json({ success: false, error_message: payment_response.message })
                                                }
                                            }
                                        })
                                    }).on('error', error => {
                                        console.error(error)
                                    })
                                    request.write(params)
                                    request.end()


                                } else {
                                    response_data.json({ success: false, error_code: CARD_ERROR_CODE.CARD_DATA_NOT_FOUND });
                                }
                            })

                        }

                    }
                } catch (error) {
                    if (error.raw) {
                        response_data.json({ success: false, message: error.raw.message });
                    } else {
                        response_data.json({ success: false, message: error.message });
                    }
                }
            })();
        });

    });
}
exports.send_paystack_required_detail = async function (request_data, response_data) {
    var body_params = {
        "reference": request_data.body.reference
    }

    var url = ''
    switch (request_data.body.required_param) {
        case 'send_pin':
            body_params.pin = request_data.body.pin;
            url = '/charge/submit_pin'
            break;
        case 'send_otp':
            body_params.otp = request_data.body.otp;
            url = '/charge/submit_otp'
            break;
        case 'send_phone':
            body_params.phone = request_data.body.phone;
            url = '/charge/submit_phone'
            break;
        case 'send_birthday':
            body_params.birthday = request_data.body.birthday;
            url = '/charge/submit_birthday'
            break;
        case 'send_address':
            body_params.address = request_data.body.address;
            url = '/charge/submit_address'
            break;
        case 'default':
            body_params.pin = request_data.body.pin;
            url = '/charge/submit_pin'
            break;
    }
    Payment_gateway.findOne({ name: "Paystack" }).then((payment_gateway) => {
        const params = JSON.stringify(body_params)
        const options = {
            hostname: 'api.paystack.co',
            port: 443,
            path: url,
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + payment_gateway.payment_key,
                'Content-Type': 'application/json'
            }
        }

        const request = https.request(options, response => {
            let data = ''
            response.on('data', (chunk) => {
                data += chunk
            });
            response.on('end', () => {
                var payment_response = JSON.parse(data);
                if (payment_response.status) {
                    if (payment_response.data.status == 'success') {
                        request_data.body.paystack_data = payment_response.data;
                        request_data.body.amount = request_data.body.paystack_data.amount / 100;
                        if (request_data.body.order_payment_id) {
                            Order_payment.findOne({ _id: request_data.body.order_payment_id }).then(order_payment => {
                                User.findOne({ _id: request_data.body.order_payment_id }).then((user) => {

                                    order_payment.payment_intent_id = payment_response.data.reference;
                                    order_payment.capture_amount = order_payment.remaining_payment;
                                    order_payment.is_payment_paid = true;
                                    order_payment.cash_payment = 0;
                                    order_payment.card_payment = order_payment.remaining_payment;
                                    var remaining_payment = order_payment.remaining_payment;
                                    order_payment.remaining_payment = 0;
                                    order_payment.save().then(() => {
                                        if (setting_detail.is_mail_notification) {
                                            emails.sendUserOrderPaymentPaidEmail(request_data, user, order_payment.order_currency_code + remaining_payment);
                                        }
                                        response_data.json({
                                            success: true, message: USER_MESSAGE_CODE.ORDER_PAYMENT_SUCCESSFULLY,
                                            is_payment_paid: order_payment.is_payment_paid
                                        });
                                    })
                                })

                            })

                        } else {
                            request_data.body.wallet = request_data.body.paystack_data.amount / 100;
                            Wallet.add_wallet_amount(request_data, response_data)
                        }
                    } else if (payment_response.data.status == 'open_url') {
                        var json_response = { success: false, error_message: payment_response.data.url }
                        response_data.json(json_response)
                    } else {
                        var json_response = { success: false, reference: payment_response.data.reference, required_param: payment_response.data.status, data: payment_response }
                        response_data.json(json_response)
                    }
                } else {
                    if (payment_response.data) {
                        response_data.json({ success: false, error_message: payment_response.data.message })
                    } else {
                        response_data.json({ success: false, error_message: payment_response.message })
                    }
                }
            })
        }).on('error', error => {
            console.error(error)
        })
        request.write(params)
        request.end()
    })
}

exports.delete_card = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [{ name: 'card_id', type: 'string' }], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var type = Number(request_data_body.type); // 7 = User , 8 = Provider , 2 = Store
            var Table;
            switch (type) {
                case ADMIN_DATA_ID.USER:
                    type = ADMIN_DATA_ID.USER;
                    Table = User;
                    break;
                case ADMIN_DATA_ID.PROVIDER:
                    type = ADMIN_DATA_ID.PROVIDER;
                    Table = Provider;
                    break;
                case ADMIN_DATA_ID.STORE:
                    type = ADMIN_DATA_ID.STORE;
                    Table = Store;
                    break;
                default:
                    type = ADMIN_DATA_ID.USER;
                    Table = User;
                    break;
            }

            Table.findOne({ _id: request_data_body.user_id }).then((detail) => {
                if (detail) {
                    if (request_data_body.server_token !== null && detail.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {
                        Card.remove({ _id: request_data_body.card_id, user_id: request_data_body.user_id, user_type: type }).then(() => {
                            response_data.json({
                                success: true,
                                message: CARD_MESSAGE_CODE.CARD_DELETE_SUCCESSFULLY
                            });
                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });

                    }

                } else {
                    response_data.json({ success: false, error_code: ERROR_CODE.DETAIL_NOT_FOUND });
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

exports.select_card = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [{ name: 'card_id', type: 'string' }], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var type = Number(request_data_body.type); // 7 = User , 8 = Provider , 2 = Store
            var Table;
            switch (type) {
                case ADMIN_DATA_ID.USER:
                    type = ADMIN_DATA_ID.USER;
                    Table = User;
                    break;
                case ADMIN_DATA_ID.PROVIDER:
                    type = ADMIN_DATA_ID.PROVIDER;
                    Table = Provider;
                    break;
                case ADMIN_DATA_ID.STORE:
                    type = ADMIN_DATA_ID.STORE;
                    Table = Store;
                    break;
                default:
                    type = ADMIN_DATA_ID.USER;
                    Table = User;
                    break;
            }

            Table.findOne({ _id: request_data_body.user_id }).then((detail) => {
                if (detail) {
                    if (request_data_body.server_token !== null && detail.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {

                        Card.findOneAndUpdate({ _id: { $nin: request_data_body.card_id }, user_id: request_data_body.user_id, user_type: type, is_default: true }, { is_default: false }).then((card) => {

                        });
                        Card.findOne({ _id: request_data_body.card_id, user_id: request_data_body.user_id, user_type: type }).then((card) => {

                            if (card) {
                                card.is_default = true;
                                card.save().then(() => {
                                    response_data.json({
                                        success: true, message: CARD_MESSAGE_CODE.CARD_SELECTED_SUCCESSFULLY,
                                        card: card
                                    });
                                }, (error) => {
                                    console.log(error)
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });

                            } else {
                                response_data.json({ success: false, error_code: CARD_ERROR_CODE.CARD_DATA_NOT_FOUND });
                            }
                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });

                        });

                    }

                } else {
                    response_data.json({ success: false, error_code: ERROR_CODE.DETAIL_NOT_FOUND });
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

exports.createChargeForOrderWithoutUserLogin = async function (request_data, response_data){
    let request_data_body = request_data
    payment_gateway = await Payment_gateway.findOne({ _id: request_data_body.payment_id })
    order_payment = await Order_payment.findById(request_data_body.order_payment_id)
    if (payment_gateway && payment_gateway.name == 'Stripe') {

        var stripe = require("stripe")(payment_gateway.payment_key);
        await stripe.charges.create({
            amount: order_payment.user_pay_payment * 100,
            currency: order_payment.order_currency_code,
            source: request_data_body.token,
            capture: true
        }).then((payment_response) => {
            console.log(payment_response)
            // if (order_payment) {
            //     order_payment.payment_id = request_data_body.payment_id
            //     order_payment.payment_intent_id = payment_response.id;
            //     order_payment.capture_amount = order_payment.remaining_payment;
            //     order_payment.is_payment_paid = true;
            //     order_payment.cash_payment = 0;
            //     order_payment.card_payment = order_payment.remaining_payment;
            //     let remaining_payment = order_payment.remaining_payment;
            //     order_payment.remaining_payment = 0;
            //     order_payment.save().then(result => {
                    console.log('--------------result-----------------')
                    response_data({ success: true, payment_method: payment_response.payment_token, payment_intent_id: payment_response.id, client_secret: "" });
                // })
            // }
        }).catch(error => {
            console.log(error)
            response_data({ success: false, error_code: USER_ERROR_CODE.CHECK_PAYMENT_FAILED, error: error.raw.message });
        })
    } else {
        if (user_detials) {
            if (!request_data.body.is_web) {
                request_data.body.is_web = false;
            }
            var is_web = request_data.body.is_web
            const params = JSON.stringify({
                "email": user_detials.email,
                "phone": user_detials.phone,
                "amount": "100",
                callback_url: request_data.protocol + '://' + request_data.headers.host + "/v3/api/user/paystack_add_card_callback?user_id=" + request_data.body.user_id + '&&is_web=' + is_web + '&&type=' + type + '&&payment_id=' + request_data.body.payment_id + '&&redirect_url=' + request_data.body.url
            })
            const options = {
                hostname: 'api.paystack.co',
                port: 443,
                path: '/transaction/initialize',
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + payment_gateway.payment_key,
                    'Content-Type': 'application/json'
                }
            }
            const https = require("https");
            const request = https.request(options, res => {
                let data = ''
                res.on('data', (chunk) => {
                    data += chunk
                });
                res.on('end', () => {
                    var response = JSON.parse(data)
                    if (response.status && response.data) {
                        response_data.json({ success: true, authorization_url: response.data.authorization_url, access_code: response.data.access_code })
                    } else {
                        response_data.json({ success: false, error: response.message })
                    }
                })
            }).on('error', error => {
                console.error(error)
            })
            request.write(params)
            request.end()
        } else {
            response_data.json({
                success: false,
                error_code: ERROR_CODE.USER_DATA_NOT_FOUND
            });

        }
    }
}