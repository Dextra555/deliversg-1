'use strict';
var myUtils = require('../../utils/utils');
require('../../utils/constants');
var fs = require("fs");
var moment = require('moment');
var myEmail = require('../../controllers/email_sms/emails');
var Email = require('mongoose').model('email_detail');


// send email //
exports.sendEmail = function (request_data, provider, user, store, email_id, extra_param) {
    let name = "";
    let email = "";
    if (provider != null) {
        name = provider.first_name + " " + provider.last_name;
        email = provider.email;
    } else if (user != null) {
        name = user.first_name + " " + user.last_name;
        email = user.email;
    } else if (store != null) {
        name = store.name;
        email = store.email;
    }

    let test = new Date(Date.now());
    let d = moment(test);
    let date = d.format(DATE_FORMATE.MMM_D_YYYY);
    let ejs = require("ejs");
    try {
        if (email != "") {
            Email.findOne({unique_id: email_id}, function (error, email_data) {
                let template_string = EMAIL_STRING.template_string;
                let app_name_string = EMAIL_STRING.app_name_string;
                let title = email_data.email_title;
                let email_content = email_data.email_content;
                let email_admin_info = email_data.email_admin_info;
                let is_send = email_data.is_send;
                console.log("is_send" + is_send);
                if (is_send) {
                    console.log("in is_send" + is_send);
                    if (email_id == EMAIL_UNIQUE_ID.USER_WELCOME || 
                        EMAIL_UNIQUE_ID.PROVIDER_WELCOME || 
                        EMAIL_UNIQUE_ID.STORE_WELCOME || 
                        EMAIL_UNIQUE_ID.USER_FORGOT_PASSWORD || 
                        EMAIL_UNIQUE_ID.PROVIDER_FORGOT_PASSWORD || 
                        EMAIL_UNIQUE_ID.STORE_FORGOT_PASSWORD || 
                        EMAIL_UNIQUE_ID.ORDER_PAYMENT_DONE || 
                        EMAIL_UNIQUE_ID.ORDER_DIGITAL_CODE || 
                        EMAIL_UNIQUE_ID.USER_APPROVED || 
                        EMAIL_UNIQUE_ID.USER_DECLINED || 
                        EMAIL_UNIQUE_ID.PROVIDER_APPROVED || 
                        EMAIL_UNIQUE_ID.PROVIDER_DECLINED || 
                        EMAIL_UNIQUE_ID.STORE_APPROVED || 
                        EMAIL_UNIQUE_ID.STORE_DECLINED || 
                        EMAIL_UNIQUE_ID.USER_PAYMENT_REFUND || 
                        EMAIL_UNIQUE_ID.STORE_PAYMENT_REFUND ||
                        EMAIL_UNIQUE_ID.DOCUMENT_EXPIRED) {
                        email_content = email_content.replace("XXXXXX", extra_param);
                    }

                    if(email_id == EMAIL_UNIQUE_ID.SUB_STORE_REGISTERED || EMAIL_UNIQUE_ID.SUB_ADMIN_REGISTERED && request_data !== null){
                        email_content = email_content.replace("XXXXXX", extra_param);
                        email_content = email_content.replace("YYYYYY", request_data.body.password);
                    }

                    let template = process.cwd() + '/app/email_template/email.html';
                    fs.readFile(template, 'utf8', function (error, file) {
                        if (error) {
                            return error;
                        } else {
                            let compiledTmpl = ejs.compile(file, {filename: template});
                            let logo_image_url;
                            let background_image_url;
                            if(request_data != null){
                                logo_image_url = request_data.protocol + '://' + request_data.get('host') + "/email_images/mail_logo.png";
                                background_image_url = request_data.protocol + '://' + request_data.get('host') + "/email_images/email_vector.png";
                            } else {
                                logo_image_url = setting_detail.api_base_url + "/email_images/mail_logo.png";
                                background_image_url = setting_detail.api_base_url + "/email_images/email_vector.png"
                            }
                            let context = {title: title, name: name,
                                app_name_string: app_name_string, template_string: template_string,
                                email_content: email_content, email_admin_info: email_admin_info,
                                logo_image_url: logo_image_url, background_image_url: background_image_url,
                                date: date};
                            let htmls = compiledTmpl(context);
                            htmls = htmls.replace(/&lt;/g, "<");
                            htmls = htmls.replace(/&gt;/g, ">");
                            htmls = htmls.replace(/&#34;/g, '"');
                            myUtils.mail_notification(email, email_data.email_title, "", htmls);
                        }
                    });
                }
            });

        }
    } catch (error) {
        console.error('ERROR!');
    }
};

// userForgotPassword
exports.userForgotPassword = function (request_data, user, new_password, type) {
    try {
        console.log("userForgotPassword");
        switch (type) {
            case ADMIN_DATA_ID.USER:
                myEmail.sendEmail(request_data, null, user, null, EMAIL_UNIQUE_ID.USER_FORGOT_PASSWORD, new_password);
                break;
            case ADMIN_DATA_ID.PROVIDER:
                myEmail.sendEmail(request_data, user, null, null, EMAIL_UNIQUE_ID.USER_FORGOT_PASSWORD, new_password);
                break;
            case ADMIN_DATA_ID.STORE:
                myEmail.sendEmail(request_data, null, null, user, EMAIL_UNIQUE_ID.USER_FORGOT_PASSWORD, new_password);
                break;
            case ADMIN_DATA_ID.ADMIN:
                myEmail.sendEmail(request_data, null, null, user, EMAIL_UNIQUE_ID.USER_FORGOT_PASSWORD, new_password);
                break;
            default:
                break;
        }


    } catch (error) {
        console.error('ERROR!');
    }
};

// sub store registered notification
exports.subStoreRegistered = function(request_data, store, password) {
    try {
        request_data.body.password = password
        myEmail.sendEmail(request_data, null, null, store, EMAIL_UNIQUE_ID.SUB_STORE_REGISTERED, store.email)
    } catch (error) {
        console.log('ERROR!: ' + error)
    }
}

// sub admin resgister notification
exports.subAdminRegistered = function(request_data, admin, name) {
    try {
        myEmail.sendEmail(request_data, null, null, admin, EMAIL_UNIQUE_ID.SUB_ADMIN_REGISTERED, admin.email)
    } catch (error) {
        console.log('ERROR!: ' + error)
    }
}

exports.documentExpired = function (user, document_name){
    console.log(user.length)
    let json = {
        email: user.toString(),
        first_name: '',
        last_name: ''
    }
    try {
        myEmail.sendEmail(null, json, null, null, EMAIL_UNIQUE_ID.DOCUMENT_EXPIRED, document_name)
    } catch (error) {
        console.log('ERROR!!: ' + error)
    }
} 

exports.providerWalletBelowMinimumAmount = function (provider){
    try {
        myEmail.sendEmail(null, provider, null, null, EMAIL_UNIQUE_ID.PROVIDER_WALLET_BELOW_MINIMUM_AMOUNT)
    } catch (error) {
        console.log('ERROR!!' + error)
    }
}

// providerForgotPassword
exports.providerForgotPassword = function (request_data, provider, new_password) {
    try {
        myEmail.sendEmail(request_data, provider, null, null, EMAIL_UNIQUE_ID.PROVIDER_FORGOT_PASSWORD, new_password);
    } catch (error) {
        console.error('ERROR!');
    }
};

// storeForgotPassword
exports.storeForgotPassword = function (request_data, store, new_password) {
    try {
        myEmail.sendEmail(request_data, null, null, store, EMAIL_UNIQUE_ID.STORE_FORGOT_PASSWORD, new_password);
    } catch (error) {
        console.error('ERROR!');
    }
};

// sendUserRegisterEmail
exports.sendUserRegisterEmail = function (request_data, user, name) {
    try {
        myEmail.sendEmail(request_data, null, user, null, EMAIL_UNIQUE_ID.USER_WELCOME, name);
    } catch (error) {
        console.log('ERROR!');
    }
};

// sendProviderRegisterEmail
exports.sendProviderRegisterEmail = function (request_data, provider, name) {
    try {
        myEmail.sendEmail(request_data, provider, null, null, EMAIL_UNIQUE_ID.PROVIDER_WELCOME, name);
    } catch (error) {
        console.log('ERROR!');
    }
};

// sendStoreRegisterEmail
exports.sendStoreRegisterEmail = function (request_data, store, name) {
    try {
        myEmail.sendEmail(request_data, null, null, store, EMAIL_UNIQUE_ID.STORE_WELCOME, name);
    } catch (error) {
        console.log('ERROR!');
    }
};


// sendUserApprovedEmail
exports.sendUserApprovedEmail = function (request_data, user, name) {
    try {
        console.log("sendUserApprovedEmail");
        myEmail.sendEmail(request_data, null, user, null, EMAIL_UNIQUE_ID.USER_APPROVED, name);
    } catch (error) {
        console.log(" catch sendUserApprovedEmail");
        console.log('ERROR!');
    }
};

// sendProviderApprovedEmail
exports.sendProviderApprovedEmail = function (request_data, provider, name) {
    try {
        myEmail.sendEmail(request_data, provider, null, null, EMAIL_UNIQUE_ID.PROVIDER_APPROVED, name);
    } catch (error) {
        console.log('ERROR!');
    }
};


// sendStoreApprovedEmail
exports.sendStoreApprovedEmail = function (request_data, store, name) {
    try {
        console.log("sendStoreApprovedEmail");
        myEmail.sendEmail(request_data, null, null, store, EMAIL_UNIQUE_ID.STORE_APPROVED, name);
    } catch (error) {
        console.log(" catch sendStoreApprovedEmail");
        console.log('ERROR!');
    }
};

// sendUserDeclineEmail
exports.sendUserDeclineEmail = function (request_data, user, name) {
    try {
        myEmail.sendEmail(request_data, null, user, null, EMAIL_UNIQUE_ID.USER_DECLINED, name);
    } catch (error) {
        console.log('ERROR!');
    }
};


// sendProviderDeclineEmail
exports.sendProviderDeclineEmail = function (request_data, provider, name) {
    try {
        myEmail.sendEmail(request_data, provider, null, null, EMAIL_UNIQUE_ID.PROVIDER_DECLINED, name);
    } catch (error) {
        console.log('ERROR!');
    }
};


// sendStoreDeclineEmail
exports.sendStoreDeclineEmail = function (request_data, store, name) {
    try {
        myEmail.sendEmail(request_data, null, null, store, EMAIL_UNIQUE_ID.STORE_DECLINED, name);
    } catch (error) {
        console.log('ERROR!');
    }
};


// emailForOTPVerification
exports.emailForOTPVerification = function (request_data, email, otp_for_email, email_id) {
    let request_data_body = request_data.body;
    var email = request_data_body.email;
    try {
        if (email != "") {
            Email.findOne({unique_id: email_id}, function (error, email_data) {
                let template_string = EMAIL_STRING.template_string;
                let app_name_string = EMAIL_STRING.app_name_string;
                let title = email_data.email_title;
                let email_content = email_data.email_content;
                let email_admin_info = email_data.email_admin_info;
                let is_send = email_data.is_send;
                if (is_send) {
                    if (email_id == EMAIL_UNIQUE_ID.USER_OTP_VERIFICATION || email_id == EMAIL_UNIQUE_ID.PROVIDER_OTP_VERIFICATION || email_id == EMAIL_UNIQUE_ID.STORE_OTP_VERIFICATION) {
                        email_content = email_content.replace("XXXXXX", otp_for_email);
                    }
                    let ejs = require("ejs");
                    let template = process.cwd() + '/app/email_template/email.html';
                    fs.readFile(template, 'utf8', function (error, file) {
                        if (error) {
                            console.log('ERROR!');
                            return error;
                        } else {
                            let compiledTmpl = ejs.compile(file, {filename: template});
                            let logo_image_url = request_data.protocol + '://' + request_data.get('host') + "/email_images/mail_logo.png";
                            let background_image_url = request_data.protocol + '://' + request_data.get('host') + "/email_images/email_vector.png";
                            let context = {title: title, template_string: template_string,
                                app_name_string: app_name_string,
                                email_content: email_content, email_admin_info: email_admin_info, logo_image_url: logo_image_url, background_image_url: background_image_url};
                            let htmls = compiledTmpl(context);
                            htmls = htmls.replace(/&lt;/g, "<");
                            htmls = htmls.replace(/&gt;/g, ">");
                            htmls = htmls.replace(/&#34;/g, '"');
                            myUtils.mail_notification(email, email_data.email_title, "", htmls);
                        }
                    });
                }
            });

        }
    } catch (error) {
        console.log('ERROR!');
    }

};

// sendUserOrderPaymentPaidEmail
exports.sendUserOrderPaymentPaidEmail = function (request_data, user, amount) {
    try {
        myEmail.sendEmail(request_data, null, user, null, EMAIL_UNIQUE_ID.ORDER_PAYMENT_DONE, amount);
    } catch (error) {
        console.log('ERROR!');
    }

};


// sendUserOrderPaymentPaidEmail
exports.sendStoreOrderPaymentPaidEmail = function (request_data, store, amount) {
    try {
        myEmail.sendEmail(request_data, null, null, store, EMAIL_UNIQUE_ID.STORE_ORDER_PAYMENT_DONE, amount);
    } catch (error) {
        console.log('ERROR!');
    }

};





// sendOrderBookedEmail
exports.sendOrderBookedEmail = function (request_data, user) {
    try {
        myEmail.sendEmail(request_data, null, user, null, EMAIL_UNIQUE_ID.ORDER_BOOKED, "");
    } catch (error) {
        console.log('ERROR!');
    }
};

// sendOrderReadyEmail
exports.sendOrderReadyEmail = function (request_data, user) {
    try {
        myEmail.sendEmail(request_data, null, user, null, EMAIL_UNIQUE_ID.ORDER_READY, "");
    } catch (error) {
        console.log('ERROR!');
    }
};



// sendOrderPrepareEmail
exports.sendOrderPrepareEmail = function (request_data, user) {
    try {
        myEmail.sendEmail(request_data, null, user, null, EMAIL_UNIQUE_ID.USER_ORDER_PREPARE, "");
    } catch (error) {
        console.log('ERROR!');
    }
};



// sendDeliverymanOnTheWayEmail to user
exports.sendDeliverymanOnTheWayEmail = function (request_data, user) {
    try {
        myEmail.sendEmail(request_data, null, user, null, EMAIL_UNIQUE_ID.DELIVERY_MAN_ON_THE_WAY, "");
    } catch (error) {
        console.log('ERROR!');
    }
};


// sendDeliverymanStartDeliveryEmail to store
exports.sendDeliverymanStartDeliveryEmail = function (request_data, store) {
    try {
        myEmail.sendEmail(request_data, null, null, store, EMAIL_UNIQUE_ID.DELIVERY_MAN_STARTED_DELIVERY, "");
    } catch (error) {
        console.log('ERROR!');
    }
};





// sendDeliverymanArrivedAtDestinationEmail to user
exports.sendDeliverymanArrivedAtDestinationEmail = function (request_data, user) {
    try {
        myEmail.sendEmail(request_data, null, user, null, EMAIL_UNIQUE_ID.DELIVERY_MAN_ARRIVED_AT_DESTINATION, "");
    } catch (error) {
        console.log('ERROR!');
    }
};


// sendDeliverymanReachedAtDestinationEmail to store
exports.sendDeliverymanReachedAtDestinationEmail = function (request_data, store) {
    try {
        myEmail.sendEmail(request_data, null, null, store, EMAIL_UNIQUE_ID.DELIVERY_MAN_REACHED_AT_DESTINATION, "");
    } catch (error) {
        console.log('ERROR!');
    }
};

//////////////

// sendDeliverymanAcceptedEmail to store
exports.sendDeliverymanAcceptedEmail = function (request_data, store) {
    try {
        myEmail.sendEmail(request_data, null, null, store, EMAIL_UNIQUE_ID.DELIVERY_MAN_ACCEPTED, "");
    } catch (error) {
        console.log('ERROR!');
    }
};

// sendDeliverymanComingEmail to store
exports.sendDeliverymanComingEmail = function (request_data, store) {
    try {
        myEmail.sendEmail(request_data, null, null, store, EMAIL_UNIQUE_ID.DELIVERY_MAN_COMING, "");
    } catch (error) {
        console.log('ERROR!');
    }
};

// sendDeliverymanArrivedEmail to store
exports.sendDeliverymanArrivedEmail = function (request_data, store) {
    try {
        myEmail.sendEmail(request_data, null, null, store, EMAIL_UNIQUE_ID.DELIVERY_MAN_ARRIVED, "");
    } catch (error) {
        console.log('ERROR!');
    }
};
/////////////





// sendOrderDispatchEmail
exports.sendOrderDispatchEmail = function (request_data, user) {
    try {
        myEmail.sendEmail(request_data, null, user, null, EMAIL_UNIQUE_ID.ORDER_DISPATCH, "");
    } catch (error) {
        console.log('ERROR!');
    }
};

// sendOrderDigitalCodeEmail
exports.sendOrderDigitalCodeEmail = function (request_data, user, unique_code) {
    try {
        myEmail.sendEmail(request_data, null, user, null, EMAIL_UNIQUE_ID.ORDER_DIGITAL_CODE, unique_code);
    } catch (error) {
        console.log('ERROR!');
    }
};


// sendUserRefundAmountEmail
exports.sendUserRefundAmountEmail = function (request_data, user, amount) {
    try {
        myEmail.sendEmail(request_data, null, user, null, EMAIL_UNIQUE_ID.USER_PAYMENT_REFUND, amount);
    } catch (error) {
        console.log('ERROR!');
    }
};

// sendStoreRefundAmountEmail
exports.sendStoreRefundAmountEmail = function (request_data, store, amount) {
    try {
        myEmail.sendEmail(request_data, null, null, store, EMAIL_UNIQUE_ID.STORE_PAYMENT_REFUND, amount);
    } catch (error) {
        console.log('ERROR!');
    }
};

// sendUserOrderCompleteEmail
exports.sendUserOrderCompleteEmail = function (request_data, user) {
    try {
        myEmail.sendEmail(request_data, null, user, null, EMAIL_UNIQUE_ID.USER_ORDER_COMPLETED, "");
    } catch (error) {
        console.log('ERROR!');
    }
};

// sendUserOrderCancelEmail
exports.sendUserOrderCancelEmail = function (request_data, user) {
    try {
        myEmail.sendEmail(request_data, null, user, null, EMAIL_UNIQUE_ID.USER_ORDER_CANCELLED, "");
    } catch (error) {
        console.log('ERROR!');
    }
};

// sendUserOrderRejectEmail
exports.sendUserOrderRejectEmail = function (request_data, user) {
    try {
        myEmail.sendEmail(request_data, null, user, null, EMAIL_UNIQUE_ID.USER_ORDER_REJECTED, "");
    } catch (error) {
        console.log('ERROR!');
    }
};

// sendProviderOrderCancelEmail
exports.sendProviderOrderCancelEmail = function (request_data, provider) {
    try {
        myEmail.sendEmail(request_data, provider, null, null, EMAIL_UNIQUE_ID.PROVIDER_ORDER_CANCELLED, "");
    } catch (error) {
        console.log('ERROR!');
    }
};

// sendOrderRemainingEmail
exports.sendOrderRemainingEmail = function (request_data, provider) {
    try {
        myEmail.sendEmail(request_data, provider, null, null, EMAIL_UNIQUE_ID.ORDER_REMAINING, "");
    } catch (error) {
        console.log('ERROR!');
    }
};

// sendProviderOrderDeliveredEmail
exports.sendProviderOrderDeliveredEmail = function (request_data, provider) {
    try {
        myEmail.sendEmail(request_data, provider, null, null, EMAIL_UNIQUE_ID.ORDER_DELIVERED, "");
    } catch (error) {
        console.log('ERROR!');
    }
};


// sendStoreOrderCompleteEmail
exports.sendStoreOrderCompleteEmail = function (request_data, store) {
    try {
        myEmail.sendEmail(request_data, null, null, store, EMAIL_UNIQUE_ID.STORE_ORDER_COMPLETED, "");
    } catch (error) {
        console.log('ERROR!');
    }
};



// sendNewOrderEmail
exports.sendNewOrderEmail = function (request_data, store) {
    try {
        myEmail.sendEmail(request_data, null, null, store, EMAIL_UNIQUE_ID.NEW_ORDER, "");
    } catch (error) {
        console.log('ERROR!');
    }
};

// sendStoreOrderReadyEmail
exports.sendStoreOrderReadyEmail = function (request_data, store) {
    try {
        myEmail.sendEmail(request_data, null, null, store, EMAIL_UNIQUE_ID.STORE_ORDER_READY, "");
    } catch (error) {
        console.log('ERROR!');
    }
};

// sendOrderAssignEmail
exports.sendOrderAssignEmail = function (request_data, provider) {
    try {
        myEmail.sendEmail(request_data, provider, null, null, EMAIL_UNIQUE_ID.ORDER_ASSIGN, "");
    } catch (error) {
        console.log('ERROR!');
    }
};


// sendStoreOrderCancelEmail
exports.sendStoreOrderCancelEmail = function (request_data, store) {
    try {
        myEmail.sendEmail(request_data, null, null, store, EMAIL_UNIQUE_ID.STORE_ORDER_CANCELLED, "");
    } catch (error) {
        console.log('ERROR!');
    }
};

// sendStoreDocumentExpiredEmail
exports.sendStoreDocumentExpiredEmail = function (request_data, store) {
    try {
        myEmail.sendEmail(request_data, null, null, store, EMAIL_UNIQUE_ID.DOCUMENT_EXPIRED, "");
    } catch (error) {
        console.log('ERROR!');
    }
};

// sendProviderDocumentExpiredEmail
exports.sendProviderDocumentExpiredEmail = function (request_data, provider) {
    try {
        myEmail.sendEmail(request_data, provider, null, null, EMAIL_UNIQUE_ID.DOCUMENT_EXPIRED, "");
    } catch (error) {
        console.log('ERROR!');
    }
};

// sendUserDocumentExpiredEmail
exports.sendUserDocumentExpiredEmail = function (request_data, user) {
    try {
        myEmail.sendEmail(request_data, null, user, null, EMAIL_UNIQUE_ID.DOCUMENT_EXPIRED, "");
    } catch (error) {
        console.log('ERROR!');
    }
};


// sendUserInvoiceEmail 
exports.sendUserInvoiceEmail = function (request_data, user, provider, store, order_payment, currency) {

    let provider_unique_id = 0;
    let provider_name = "";
    let provider_address = "";

    if (provider) {
        provider_unique_id = provider.unique_id;
        provider_name = provider.first_name + " " + provider.last_name;
        provider_address = provider.address;

    }

    let store_unique_id = store.unique_id;
    let store_name = store.name;
    let store_address = store.address;

    let user_name = user.first_name + " " + user.last_name;
    let user_email = user.email;

    let title = "User Invoice";
    let pattern = "User Invoice";

    let template_string = EMAIL_STRING.template_string;

    let test = new Date(Date.now());
    let d = moment(test);
    let date = d.format(DATE_FORMATE.MMM_D_YYYY);
    let ejs = require("ejs");
    let payment_mode = ''
    let payment;
    let distance_unit;

    try {
        if (user_email != "") {
            let template = process.cwd() + '/app/email_template/user_invoice_email.html';
            fs.readFile(template, 'utf8', function (error, file) {
                if (error) {
                    return error;
                } else {

                    if (order_payment.is_payment_mode_cash == true)
                    {
                        payment_mode = "Cash";
                        payment = order_payment.cash_payment;
                    } else
                    {
                        payment_mode = "Card";
                        payment = order_payment.card_payment;
                    }

                    if (order_payment.is_distance_unit_mile == true)
                    {
                        distance_unit = "mile";
                    } else
                    {
                        distance_unit = "km";
                    }
                    let compiledTmpl = ejs.compile(file, {filename: template});

                    let hour_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/time.png";
                    let distance_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/distance.png";
                    let credit_card = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/cash.png";
                    let support_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/support.png";
                    let calendar_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/calendar.png";
                    let main_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/user_icon.png";

                    let context = {date: date,
                        title: title,
                        template_string: template_string,
                        calendar_icon: calendar_icon,
                        credit_card: credit_card,
                        distance_icon: distance_icon,
                        hour_icon: hour_icon,
                        support_icon: support_icon,
                        main_icon: main_icon,

                        payment_mode: payment_mode,
                        distance_unit: distance_unit,
                        currency: currency,

                        payment: payment,
                        provider_unique_id: provider_unique_id,
                        provider_name: provider_name,
                        provider_address: provider_address,
                        store_unique_id: store_unique_id,
                        store_name: store_name[0],
                        store_address: store_address,
                        orderid: order_payment.order_unique_id ,
                        total_time: order_payment.total_time,
                        total_distance: Number(order_payment.total_distance).toFixed(2),
                        total_service_price: order_payment.total_service_price,
                        total_admin_tax_price: order_payment.total_admin_tax_price,
                        total_sur_charge: order_payment.total_sur_charge,
                        total_surge_price: order_payment.total_surge_price,
                        promo_payment: order_payment.promo_payment,

                        total_store_tax_price: order_payment.total_store_tax_price,
                        total_cart_price: order_payment.total_cart_price,
                        wallet_payment: order_payment.wallet_payment,
                        cash_payment: order_payment.cash_payment,
                        card_payment: order_payment.card_payment,
                        total: order_payment.total,
                        total_order_price: order_payment.total_order_price,
                        total_delivery_price: order_payment.total_delivery_price,

                        is_promo_for_delivery_service: order_payment.is_promo_for_delivery_service,
                        is_distance_unit_mile: order_payment.is_distance_unit_mile,
                        is_payment_mode_cash: order_payment.is_payment_mode_cash
                    };
                    let htmls = compiledTmpl(context);
                    htmls = htmls.replace(/&lt;/g, "<");
                    htmls = htmls.replace(/&gt;/g, ">");
                    htmls = htmls.replace(/&#34;/g, '"');

                    myUtils.mail_notification(user_email, title, pattern, htmls);

                }
            });
        }

    } catch (error) {
        console.error('ERROR!');
    }


};


// sendProviderInvoiceEmail
exports.sendProviderInvoiceEmail = function (request_data, user, provider, store, order_payment, currency) {

    let user_unique_id = user.unique_id;
    let user_name = user.first_name + " " + user.last_name;
    let user_address = user.address;
    let store_unique_id = 0;
    let store_name = "";
    let store_address = "";
    let email_admin_info = '';

    if (store)
    {
        store_unique_id = store.unique_id;
        store_name = store.name;
        store_address = store.address;
    }



    let provider_name = provider.first_name + " " + provider.last_name;
    let provider_email = provider.email;

    let title = "Deliveryman Invoice";
    let pattern = "Deliveryman Invoice";

    let test = new Date(Date.now());
    let d = moment(test);
    let date = d.format(DATE_FORMATE.MMM_D_YYYY);
    let ejs = require("ejs");
    let payment_mode = ''
    let distance_unit;

    try {
        if (provider_email != "") {


            let template = process.cwd() + '/app/email_template/deliveryman_invoice_email.html';
            fs.readFile(template, 'utf8', function (error, file) {
                if (error) {
                    return error;
                } else {

                    if (order_payment.is_payment_mode_cash == true)
                    {
                        payment_mode = "Cash";
                    } else
                    {
                        payment_mode = "Card";
                    }

                    if (order_payment.is_distance_unit_mile == true)
                    {
                        distance_unit = "mile";
                    } else
                    {
                        distance_unit = "km";
                    }
                    let compiledTmpl = ejs.compile(file, {filename: template});

                    let hour_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/time.png";
                    let distance_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/distance.png";
                    let credit_card = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/cash.png";
                    let support_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/support.png";
                    let calendar_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/calendar.png";
                    let main_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/delivery_icon.png";
                    let template_string = EMAIL_STRING.template_string;

                    let context = {date: date,
                        template_string: template_string,
                        title: title,
                        calendar_icon: calendar_icon,
                        credit_card: credit_card,
                        distance_icon: distance_icon,
                        hour_icon: hour_icon,
                        support_icon: support_icon,
                        main_icon: main_icon,
                        email_admin_info: email_admin_info,

                        payment_mode: payment_mode,
                        distance_unit: distance_unit,
                        currency: currency,

                        user_unique_id: user_unique_id,
                        user_name: user_name,
                        user_address: user_address,
                        store_unique_id: store_unique_id,
                        store_name: store_name,
                        store_address: store_address,
                        total_time: order_payment.total_time,
                        total_distance: Number(order_payment.total_distance).toFixed(2),

                        total_service_price: order_payment.total_service_price,
                        total_admin_tax_price: order_payment.total_admin_tax_price,
                        total_sur_charge: order_payment.total_sur_charge,
                        total_surge_price: order_payment.total_surge_price,
                        promo_payment: order_payment.promo_payment,

                        total_store_tax_price: order_payment.total_store_tax_price,
                        total_cart_price: order_payment.total_cart_price,
                        wallet_payment: order_payment.wallet_payment,
                        cash_payment: order_payment.cash_payment,
                        card_payment: order_payment.card_payment,
                        total: order_payment.total,
                        pay_to_provider: order_payment.pay_to_provider,
                        provider_have_cash_payment: order_payment.provider_have_cash_payment,

                        provider_paid_order_payment: order_payment.provider_paid_order_payment,
                        total_provider_income: order_payment.total_provider_income,
                        total_order_price: order_payment.total_order_price,
                        total_delivery_price: order_payment.total_delivery_price,
                        is_promo_for_delivery_service: order_payment.is_promo_for_delivery_service,
                        is_distance_unit_mile: order_payment.is_distance_unit_mile,
                        is_payment_mode_cash: order_payment.is_payment_mode_cash
                    };


                    let htmls = compiledTmpl(context);
                    htmls = htmls.replace(/&lt;/g, "<");
                    htmls = htmls.replace(/&gt;/g, ">");
                    htmls = htmls.replace(/&#34;/g, '"');
                    myUtils.mail_notification(provider_email, title, pattern, htmls);

                }
            });

        }
    } catch (error) {
        console.error('ERROR!');
    }


};




// sendStoreInvoiceEmail
exports.sendStoreInvoiceEmail = function (request_data, user, provider, store, order_payment, currency, order_detail = null) {

    let user_unique_id = user.unique_id;
    let user_name = user.first_name + " " + user.last_name;
    let user_address = user.address;

    let store_email = store.email;

    let provider_unique_id = provider.unique_id;
    let provider_name = provider.first_name + " " + provider.last_name;
    let provider_address = provider.address;



    let title = "Store Invoice";
    let pattern = "Store Invoice";
    let template_string = EMAIL_STRING.template_string;
    let email_admin_info = '';

    let test = new Date(Date.now());
    let d = moment(test);
    let date = d.format(DATE_FORMATE.MMM_D_YYYY);
    let ejs = require("ejs");
    let payment_mode = ''
    let payment;
    let distance_unit;

    try {
        if (store_email != "") {

            let template = process.cwd() + '/app/email_template/store_invoice_email.html';
            fs.readFile(template, 'utf8', function (error, file) {
                if (error) {
                    return error;
                } else {

                    if (order_payment.is_payment_mode_cash == true)
                    {
                        payment_mode = "Cash";
                        payment = order_payment.cash_payment;
                    } else
                    {
                        payment_mode = "Card";
                        payment = order_payment.card_payment;
                    }

                    if (order_payment.is_distance_unit_mile == true)
                    {
                        distance_unit = "mile";
                    } else
                    {
                        distance_unit = "km";
                    }
                    let compiledTmpl = ejs.compile(file, {filename: template});

                    let hour_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/time.png";
                    let distance_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/distance.png";
                    let credit_card = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/cash.png";
                    let support_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/support.png";
                    let calendar_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/calendar.png";
                    let main_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/store_icon.png";

                    if(!order_payment.store_have_order_payment){
                        order_payment.store_have_order_payment = 0;
                    }
                    if(!order_payment.store_have_service_payment){
                        order_payment.store_have_service_payment = 0;
                    }
                    if(order_detail){
                        console.log(order_detail.destination_addresses)
                        user_address = order_detail.destination_addresses[0].address;
                    }

                    let context = {date: date,
                        title: title,
                        template_string: template_string,

                        calendar_icon: calendar_icon,
                        credit_card: credit_card,
                        distance_icon: distance_icon,
                        hour_icon: hour_icon,
                        support_icon: support_icon,
                        main_icon: main_icon,
                        email_admin_info: email_admin_info,

                        payment_mode: payment_mode,
                        distance_unit: distance_unit,
                        currency: currency,

                        user_unique_id: user_unique_id,
                        user_name: user_name,
                        user_address: user_address,
                        provider_unique_id: provider_unique_id,
                        provider_name: provider_name,
                        provider_address: provider_address,
                        total_time: order_payment.total_time,
                        total_distance: Number(order_payment.total_distance).toFixed(2),

                        total_service_price: order_payment.total_service_price,
                        total_admin_tax_price: order_payment.total_admin_tax_price,
                        total_surge_price: order_payment.total_surge_price,
                        promo_payment: order_payment.promo_payment,
                        orderid: order_payment.order_unique_id,

                        total_store_tax_price: order_payment.total_store_tax_price,
                        total_cart_price: order_payment.total_cart_price,
                        wallet_payment: order_payment.wallet_payment,
                        cash_payment: order_payment.cash_payment,
                        card_payment: order_payment.card_payment,
                        total: order_payment.total,
                        pay_to_store: order_payment.pay_to_store,

                        total_store_income: order_payment.total_store_income,
                        store_have_order_payment: order_payment.store_have_order_payment,
                        store_have_service_payment: order_payment.store_have_service_payment,

                        total_order_price: order_payment.total_order_price,
                        total_delivery_price: order_payment.total_delivery_price,

                        is_promo_for_delivery_service: order_payment.is_promo_for_delivery_service,
                        is_distance_unit_mile: order_payment.is_distance_unit_mile,
                        is_payment_mode_cash: order_payment.is_payment_mode_cash
                    };
                    let htmls = compiledTmpl(context);
                    htmls = htmls.replace(/&lt;/g, "<");
                    htmls = htmls.replace(/&gt;/g, ">");
                    htmls = htmls.replace(/&#34;/g, '"');

                    myUtils.mail_notification(store_email, title, pattern, htmls);

                }
            });



        }
    } catch (error) {
        console.error('ERROR!');
    }


};




//////// PROVIDER WEEKLY INVOICE
// sendProviderWeeklyInvoiceEmail 
exports.sendProviderWeeklyInvoiceEmail = function (request_data, provider, provider_weekly_earning) {

    let provider_name = provider.first_name + " " + provider.last_name;
    let provider_email = provider.email;
    let provider_phone = provider.country_phone_code + provider.phone;
    let provider_unique_id = provider.unique_id;

    let title = "Deliveryman Weekly Invoice";
    let pattern = "Deliveryman Weekly Invoice";
    let template_string = EMAIL_STRING.template_string;

    let test = new Date(Date.now());
    let d = moment(test);
    let date = d.format(DATE_FORMATE.MMM_D_YYYY);

    let s_date = moment(provider_weekly_earning.start_date).format(DATE_FORMATE.MMM_D_YYYY);

    let e_date = moment(provider_weekly_earning.end_date).format(DATE_FORMATE.MMM_D_YYYY);

    let ejs = require("ejs");

    try {
        if (provider_email != "") {
            let template = process.cwd() + '/app/email_template/deliveryman_weekly_invoice_email.html';
            fs.readFile(template, 'utf8', function (error, file) {
                if (error) {
                    return error;
                } else {

                    let compiledTmpl = ejs.compile(file, {filename: template});
          

                    let hour_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/time.png";
                    let distance_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/distance.png";
                    let credit_card = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/cash.png";
                    let support_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/support.png";
                    let calendar_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/calendar.png";
                    let main_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/delivery_icon.png";


                    let context = {date: date,
                        title: title,
                        template_string: template_string,
                        calendar_icon: calendar_icon,
                        credit_card: credit_card,
                        distance_icon: distance_icon,
                        hour_icon: hour_icon,
                        support_icon: support_icon,
                        main_icon: main_icon,

                        provider_unique_id: provider_unique_id,
                        provider_name: provider_name,
                        provider_email: provider_email,
                        provider_phone: provider_phone,

                        statement_number: provider_weekly_earning.statement_number,
                        start_date: s_date,
                        end_date: e_date,

                        total_order_price: provider_weekly_earning.total_order_price,
                        total_provider_profit: provider_weekly_earning.total_provider_profit,
                        total_provider_earning: provider_weekly_earning.total_provider_earning,

                        total_wallet_income_set: provider_weekly_earning.total_wallet_income_set,
                        total_pay_to_provider: provider_weekly_earning.total_pay_to_provider,
                        total_provider_paid_order_payment: provider_weekly_earning.total_provider_paid_order_payment,

                        total_provider_have_cash_payment: provider_weekly_earning.total_provider_have_cash_payment,
                        total_provider_have_cash_payment_on_hand: provider_weekly_earning.total_provider_have_cash_payment_on_hand,
                        total_wallet_income_set_in_other_order: provider_weekly_earning.total_wallet_income_set_in_other_order,
                        total_wallet_income_set_in_cash_order: provider_weekly_earning.total_wallet_income_set_in_cash_order,

                    };


                    let htmls = compiledTmpl(context);
                    htmls = htmls.replace(/&lt;/g, "<");
                    htmls = htmls.replace(/&gt;/g, ">");
                    htmls = htmls.replace(/&#34;/g, '"');

                    myUtils.mail_notification(provider_email, title, pattern, htmls);

                }
            });

        }

    } catch (error) {
        console.error('ERROR!');
    }


};

//////// STORE WEEKLY INVOICE
// sendStoreWeeklyInvoiceEmail 
exports.sendStoreWeeklyInvoiceEmail = function (request_data, store, store_weekly_earning) {

    let store_name = store.name;
    let store_email = store.email;
    let store_phone = store.country_phone_code + store.phone;
    let store_unique_id = store.unique_id;
    let store_address = store.address;

    let title = "Store Weekly Invoice";
    let pattern = "Store Weekly Invoice";
    let template_string = EMAIL_STRING.template_string;

    let test = new Date(Date.now());
    let d = moment(test);
    let date = d.format(DATE_FORMATE.MMM_D_YYYY);

    let s_date = moment(store_weekly_earning.start_date).format(DATE_FORMATE.MMM_D_YYYY);

    let e_date = moment(store_weekly_earning.end_date).format(DATE_FORMATE.MMM_D_YYYY);

    console.log("s_date" + s_date);
    console.log("e_date" + e_date);
    let ejs = require("ejs");

    try {

        if (store_email != "")
        {
            let template = process.cwd() + '/app/email_template/store_weekly_invoice_email.html';
            fs.readFile(template, 'utf8', function (error, file) {
                if (error) {
                    return error;
                } else {

                    let compiledTmpl = ejs.compile(file, {filename: template});
                    let hour_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/time.png";
                    let distance_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/distance.png";
                    let credit_card = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/cash.png";
                    let support_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/support.png";
                    let calendar_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/calendar.png";
                    let main_icon = request_data.protocol + '://' + request_data.get('host') + "/email_images/invoice/delivery_icon.png";


                    let context = {date: date,
                        title: title,
                        template_string: template_string,
                        calendar_icon: calendar_icon,
                        credit_card: credit_card,
                        distance_icon: distance_icon,
                        hour_icon: hour_icon,
                        support_icon: support_icon,
                        main_icon: main_icon,

                        store_unique_id: store_unique_id,
                        store_name: store_name,
                        store_email: store_email,
                        store_phone: store_phone,
                        store_address: store_address,

                        statement_number: store_weekly_earning.statement_number,
                        start_date: s_date,
                        end_date: e_date,

                        total_store_profit: store_weekly_earning.total_store_profit,
                        store_have_service_payment: store_weekly_earning.store_have_service_payment,
                        store_have_order_payment: store_weekly_earning.store_have_order_payment,

                        total_wallet_income_set_in_other_order: store_weekly_earning.total_wallet_income_set_in_other_order,
                        total_wallet_income_set_in_cash_order: store_weekly_earning.total_wallet_income_set_in_cash_order,
                        total_store_earning: store_weekly_earning.total_store_earning,

                        total_wallet_income_set: store_weekly_earning.total_wallet_income_set,
                        total_pay_to_store: store_weekly_earning.total_pay_to_store



                    };


                    let htmls = compiledTmpl(context);
                    htmls = htmls.replace(/&lt;/g, "<");
                    htmls = htmls.replace(/&gt;/g, ">");
                    htmls = htmls.replace(/&#34;/g, '"');

                    myUtils.mail_notification(store_email, title, pattern, htmls);

                }
            });

        }
    } catch (error) {
        console.error('ERROR!');
    }


};








// sendOrderRemainingEmail
//exports.sendOrderRemainingEmail = function (request_data, provider) {
//    try {
//        myEmail.sendEmail(request_data, provider, null, null, EMAIL_UNIQUE_ID.ORDER_REMAINING, "");
//    } catch (error) {
//        console.log('ERROR!');
//    }
//};




// send email //
//exports.adminsendEmail = function (request_data, detail, extra_param) {
//
//    var name = "";
//    var email = "";
//    var title = "Admin send email";
//    name = detail.name;
//    email = detail.email;
//    try {
//        myUtils.mail_notification(email, title, extra_param, "");
//    } catch (error) {
//        console.error('ERROR!');
//    }
//};
