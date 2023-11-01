var myUtils = require('../../utils/utils');
require('../../utils/constants');
var SMS_Detail = require('mongoose').model('sms_detail');

// sendSmsForOTPVerificationAndForgotPassword
exports.sendSmsForOTPVerificationAndForgotPassword = function (phone_with_code, sms_id, extra_param) {
    SMS_Detail.findOne({unique_id: sms_id}, function (error, sms_detail) {
        var sms_content = sms_detail.sms_content;
        var is_send = sms_detail.is_send;
        if (is_send) {
            console.log("sent");
            if (sms_id === SMS_UNIQUE_ID.USER_ORDER_DIGITAL_CODE ||  SMS_UNIQUE_ID.USER_FORGOT_PASSWORD || SMS_UNIQUE_ID.PROVIDER_FORGOT_PASSWORD ||  SMS_UNIQUE_ID.STORE_FORGOT_PASSWORD || SMS_UNIQUE_ID.USER_OTP ||  SMS_UNIQUE_ID.PROVIDER_OTP ||  SMS_UNIQUE_ID.STORE_OTP  ||SMS_UNIQUE_ID.STORE_PAYMENT_REFUND || SMS_UNIQUE_ID.USER_PAYMENT_REFUND) {
                sms_content = sms_content.replace("XXXXXX", extra_param);
            }
            myUtils.sendSMS(phone_with_code, sms_content);
        }
    });
};

// sendOtherSMS
exports.sendOtherSMS = function (phone_with_code, sms_id, extra_param) {
    SMS_Detail.findOne({unique_id: sms_id}, function (error, sms_detail) {
        var is_send = sms_detail.is_send;
        if (is_send) {
            console.log("sent sms");
            myUtils.sendSMS(phone_with_code, sms_detail.sms_content);
        }
    });
};