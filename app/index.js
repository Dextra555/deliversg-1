var express = require('express');
var router = express.Router();

router.use('', require('./v3/routes/store'));
router.use('', require('./v3/routes/user'));
router.use('', require('./v3/routes/franchise'));
router.use('', require('./v3/routes/provider'));
router.use('', require('./v3/routes/admin'));
//router.use('/v2', require('./v2'));
 

// taxation apis
router.use('', require('./v3/routes/store'));
router.use('', require('./v3/routes/user'));
router.use('', require('./v3/routes/franchise'));
router.use('', require('./v3/routes/provider'));
router.use('', require('./v3/routes/admin'));

router.use('', require('./v3/admin_routes/tax'))
router.use('', require('./v3/admin_routes/script_page'))
router.use('', require('./v3/admin_routes/payment_gateway'))
router.use('', require('./v3/admin_routes/view_document'))
router.use('', require('./v3/admin_routes/promo_code'))
router.use('', require('./v3/admin_routes/provider'))
router.use('', require('./v3/admin_routes/user'))
router.use('', require('./v3/admin_routes/store'))
router.use('', require('./v3/admin_routes/setting'))
router.use('', require('./v3/admin_routes/history'))
router.use('', require('./v3/admin_routes/order'))
router.use('', require('./v3/admin_routes/earning'))
router.use('', require('./v3/admin_routes/referral_code'))
router.use('', require('./v3/admin_routes/store_weekly_earning'))
router.use('', require('./v3/admin_routes/ads'))
router.use('', require('./v3/admin_routes/mass_notification'))
router.use('', require('./v3/admin_routes/document'))
router.use('', require('./v3/admin_routes/country'))
router.use('', require('./v3/admin_routes/chat'))
router.use('', require('./v3/admin_routes/city'))
router.use('', require('./v3/admin_routes/vehicle'))
router.use('', require('./v3/admin_routes/service'))
router.use('', require('./v3/admin_routes/delivery'))
router.use('', require('./v3/admin_routes/admin'))
router.use('', require('./v3/admin_routes/franchise'))
router.use('', require('./v3/admin_routes/database_backup'))
router.use('', require('./v3/admin_routes/order_earning'))
router.use('', require('./v3/admin_routes/provider_weekly_earning'))
router.use('', require('./v3/admin_routes/provider_map'))
router.use('', require('./v3/admin_routes/store_map'))
router.use('', require('./v3/admin_routes/dashboard'))
router.use('', require('./v3/admin_routes/add_details'))
router.use('', require('./v3/admin_routes/wallet_request'))
router.use('', require('./v3/admin_routes/wallet'))
router.use('', require('./v3/admin_routes/provider_vehicle'))
router.use('', require('./v3/admin_routes/cancellation_charge'))
router.use('', require('./v3/admin_routes/transaction_history'))
router.use('', require('./v3/admin_routes/email'))
router.use('', require('./v3/admin_routes/sms'))
router.use('', require('./v3/admin_routes/legal'))
router.use('', require('./v3/admin_routes/cancellation_reason'))
router.use('', require('./v3/admin_routes/sub_category'))
router.use('', require('./v3/admin_routes/bad_weather'))
router.use('', require('./v3/admin_routes/peak_hour'))
router.use('', require('./v3/admin_routes/deliver_fee'))
router.use('', require('./v3/admin_routes/pickup_offer'))


module.exports = router;