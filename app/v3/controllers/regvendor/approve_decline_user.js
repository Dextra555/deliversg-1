// require('../../utils/message_code');
// require('../../utils/error_code');
// require('../../utils/constants');
// require('../../utils/console');
// var utils = require('../../utils/utils');
// var emails = require('../../controllers/email_sms/emails');
// var wallet_history = require('../controllers/user/wallet');
// var SMS = require('../../controllers/email_sms/sms');
// var User = require('mongoose').model('user');
// var Country = require('mongoose').model('country');
// var mongoose = require('mongoose');
// var Provider = require('mongoose').model('provider');
// var User = require('mongoose').model('user');
// var Referral_code = require('mongoose').model('referral_code');
// var Store = require('mongoose').model('store');
// var Review = require('mongoose').model('review');require('../utils/message_code');
// require('../../utils/error_code');
// require('../../utils/constants');
// require('../../utils/push_code');
// var utils = require('../../utils/utils');
// var emails = require('../../controllers/email_sms/emails');
// var wallet_history = require('../../controllers/user/wallet');
// var SMS = require('../../controllers/email_sms/sms');
// var User = require('mongoose').model('user');
// var Country = require('mongoose').model('country');
// var mongoose = require('mongoose');
// var Provider = require('mongoose').model('provider');
// var User = require('mongoose').model('user');
// var Store = require('mongoose').model('store');
// var Review = require('mongoose').model('review');
// var console = require('../../utils/console');



// //approve_decline_user
// exports.approve_decline_user = function (request_data, response_data) {
//     utils.check_request_params(request_data.body, [{name: 'user_id', type: 'string'}], function (response) {
//         if (response.success) {

//             var request_data_body = request_data.body;
//             var user_id = request_data_body.user_id;
//             var is_approved = request_data_body.is_approved;
//             var user_page_type = request_data_body.user_page_type;
            
//             if (user_page_type == 2)
//             {

//                 User.findOneAndUpdate({_id: user_id}, {is_approved: true}, {new : true}).then((users) => {
//                     if (!users) {
//                         response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.UPDATE_FAILED});
//                     } else {

//                         var phone_with_code = users.country_phone_code + users.phone;
//                         var device_type = users.device_type;
//                         var device_token = users.device_token;
//                         // email to user approved
//                         if (setting_detail.is_mail_notification) {
//                             emails.sendUserApprovedEmail(request_data, users, users.first_name + " " + users.last_name);

//                         }
//                         // sms to user approved
//                         if (setting_detail.is_sms_notification)
//                         {
//                             SMS.sendOtherSMS(phone_with_code, SMS_UNIQUE_ID.USER_APPROVED, "");
//                         }
//                         // push to user approved
//                         if (setting_detail.is_push_notification) {
//                             utils.sendPushNotification(ADMIN_DATA_ID.USER, device_type, device_token, USER_PUSH_CODE.APPROVED, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
//                         }

//                         response_data.json({
//                             success: true,
//                             message: USER_MESSAGE_CODE.APPROVED_SUCCESSFULLY
//                         });
//                     }
//                 }, (error) => {
//                     console.log(error);
//                     response_data.json({
//                         success: false,
//                         error_code: ERROR_CODE.SOMETHING_WENT_WRONG
//                     });
//                 });


//             } else if (user_page_type == 1)
//             {

//                 User.findOneAndUpdate({_id: user_id}, {is_approved: false}, {new : true}).then((users) => {

//                     if (!users) {

//                         response_data.json({success: false, error_code: PROVIDER_ERROR_CODE.UPDATE_FAILED});
//                     } else {

//                         var phone_with_code = users.country_phone_code + users.phone;
//                         var device_type = users.device_type;
//                         var device_token = users.device_token;
//                         // email to user decline
//                         if (setting_detail.is_mail_notification) {
//                             emails.sendUserDeclineEmail(request_data, users, users.first_name + " " + users.last_name);

//                         }
//                         // sms to user decline
//                         if (setting_detail.is_sms_notification)
//                         {
//                             SMS.sendOtherSMS(phone_with_code, SMS_UNIQUE_ID.USER_DECLINE, "");
//                         }
//                         // push to user decline
//                         if (setting_detail.is_push_notification) {
//                             utils.sendPushNotification(ADMIN_DATA_ID.USER, device_type, device_token, USER_PUSH_CODE.DECLINED, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS);
//                         }

//                         response_data.json({
//                             success: true,
//                             message: USER_MESSAGE_CODE.DECLINED_SUCCESSFULLY
//                         });
//                     }
//                 }, (error) => {
//                     console.log(error);
//                     response_data.json({
//                         success: false,
//                         error_code: ERROR_CODE.SOMETHING_WENT_WRONG
//                     });
//                 });
//             }

//         } else {
//             response_data.json(response);
//         }
//     });

// };