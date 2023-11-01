var express = require('express');
var router = express.Router();
var card = require('../../controllers/user/card');
var cart = require('../../controllers/user/cart');
var cron_job = require('../../controllers/user/cron_job');
var order = require('../../controllers/user/order');
var promo_code = require('../../controllers/user/promo_code');
var user = require('../../controllers/user/user');
var wallet = require('../../controllers/user/wallet');
var vendor=require("../../controllers/regvendor/regform");/////////////////Vendor
var admin_vendor=require("../../controllers/regvendor/admin_vendor");/////////////////Vendor
var deletes=require("../../admin_controllers/user")
var cancel_order_mail=require("../../controllers/user/cancel_account")

router.post('/api/user/deleteAccount', deletes.approve_decline_user);

//vendor

router.post('/api/vendor/vendor-registration', vendor.vendor_registration );
router.get('/api/vendor/getform', vendor.getform);
router.put('/api/vendor/approve', vendor.approve);
router.post('/api/vendor/post_delivery_list_for_nearest_city', vendor.post_delivery_list_for_nearest_city);////////////
router.post('/api/vendor/add_country_data',vendor.add_country_data);
router.get('/api/vendor/get_country_data_list',vendor.get_country_data_list);
router.post('/api/vendor/add_city',vendor.add_city);
router.post('/api/vendor/get_city',vendor.get_city);
router.post('/api/vendor/add_to_cart', vendor.add_to_cart);
router.post('/api/vendor/get_courier_order_invoice', vendor.get_courier_order_invoice);
router.post('/api/vendor/create_order',vendor.create_order);
router.post('/api/vendor/get_distance',vendor.calculation);
// router.get('/api/vendor/check',vendor.check);

//vendor_admin
router.post('/admin_vendor/add_delivery_data', admin_vendor.add_delivery_data);

















//User



//cancel mail
router.post('/api/user/cancel_order',cancel_order_mail.cancel_mail)
// wallet api
router.post('/api/user/add_wallet_amount', wallet.add_wallet_amount);
router.post('/api/user/change_user_wallet_status', wallet.change_user_wallet_status);
router.post('/api/admin/get_wallet_history', wallet.get_wallet_history);
// user api
router.post('/api/user/register', user.user_register);
router.post('/api/user/login', user.user_login);
router.post('/api/user/update', user.user_update);
router.post('/api/user/update_device_token', user.update_device_token);
router.post('/api/user/logout', user.logout);
router.post('/api/user/get_detail', user.get_detail);
router.post('/api/user/get_store_list_nearest_city', user.get_store_list_nearest_city);
router.post('/api/user/get_product_group_list', user.get_product_group_list);
router.post('/api/user/user_update_order', user.user_update_order);
router.post('/api/user/otp_verification', user.user_otp_verification);
router.post('/api/user/rating_to_provider', user.user_rating_to_provider);
router.post('/api/user/rating_to_store', user.user_rating_to_store);
router.post('/api/user/get_store_list', user.get_store_list);
router.post('/api/user/get_delivery_store_list', user.get_delivery_store_list);
router.post('/api/user/get_subcategory_store_list', user.get_subcategory_store_list);
router.post('/api/user/get_subcategory_store_list_web', user.get_subcategory_store_list_web);
router.post('/api/user/check_user_pickup', user.check_user_pickup);
router.post('/api/user/get_delivery_list_for_nearest_city', user.get_delivery_list_for_nearest_city);////////////
router.post('/api/user/get_order_cart_invoice', user.get_order_cart_invoice);
router.post('/api/user/get_courier_order_invoice', user.get_courier_order_invoice);
router.post('/api/user/pay_order_payment', user.pay_order_payment);
router.post('/api/user/user_get_store_product_item_list', user.user_get_store_product_item_list);
router.post('/api/user/add_favourite_store', user.add_favourite_store);
router.post('/api/user/remove_favourite_store', user.remove_favourite_store);
router.post('/api/user/get_order_detail', user.get_order_detail);
router.post('/api/user/get_favourite_store_list', user.get_favourite_store_list);
router.post('/api/user/user_get_store_review_list', user.user_get_store_review_list);
router.post('/api/user/user_like_dislike_store_review', user.user_like_dislike_store_review);
router.post('/api/user/store_list_for_item', user.store_list_for_item);
router.post('/api/user/user_get_specification_list', user.user_get_specification_list);
router.post('/api/user/get_orders', user.get_orders);
router.post('/api/user/get_order_status', user.get_order_status);
router.post('/api/user/order_history', user.order_history);
router.post('/api/user/order_history_detail', user.order_history_detail);
router.post('/api/user/get_provider_location', user.get_provider_location);
router.post('/api/user/get_invoice', user.get_invoice);
router.post('/api/user/read_chat', user.read_chat);
router.post('/api/user/send_chat', user.send_chat);
router.post('/api/user/register_user_without_credentials', user.register_user_without_credentials)
// promo api
router.post('/api/user/apply_promo_code', promo_code.apply_promo_code);
router.post('/api/user/get_store_offers', promo_code.get_store_offers);
// order api
router.post('/api/user/user_cancel_order', order.user_cancel_order);
router.post('/api/user/create_order', order.create_order);
router.post('/api/user/create_order_from_store', order.create_order_from_others);
router.post('/api/user/approve_edit_order', order.approve_edit_order);
router.post('/api/user/show_invoice', order.show_invoice);//////////////////////////////////////////////
router.post('/api/get_order_detail', order.get_order_detail);
router.post('/api/store/set_order_status', order.set_order_status);
router.post('/api/store/store_cancel_or_reject_order', order.store_cancel_or_reject_order);
// cart api
router.post('/api/user/add_item_in_cart', cart.add_item_in_cart);
router.post('/api/user/get_cart', cart.get_cart);
router.post('/api/user/replace_order', cart.replace_order);
router.post('/api/user/clear_cart', cart.clear_cart);
router.post('/api/user/get_payment_gateway', cart.get_payment_gateway);
router.post('/api/user/change_delivery_address', cart.change_delivery_address);
router.post('/api/user/check_delivery_available', cart.check_delivery_available);
router.post('/api/user/country_city_list', cart.country_city_list);
// card api
router.post('/api/user/pay_stripe_intent_payment', card.pay_stripe_intent_payment);
router.post('/api/user/get_stripe_payment_intent', card.get_stripe_payment_intent);
router.post('/api/user/get_stripe_payment_intent_wallet', card.get_stripe_payment_intent_wallet);
router.post('/api/user/get_stripe_add_card_intent', card.get_stripe_add_card_intent);
router.get ('/api/user/paystack_add_card_callback',card.paystack_add_card_callback);
router.post('/api/user/add_card', card.add_card);
router.post('/api/user/get_card_list', card.get_card_list);//////////////////////////////
router.post('/api/user/delete_card', card.delete_card);
router.post('/api/user/select_card', card.select_card);
router.get ('/api/user/base_url', card.test);
router.post('/api/user/send_paystack_required_detail',card.send_paystack_required_detail);
router.post('/api/user/createChargeForOrderWithoutUserLogin', card.createChargeForOrderWithoutUserLogin)


router.post('/api/user/store_search', user.store_search);

router.post('/api/user/get_favoutire_addresses', user.get_favoutire_addresses);
router.post('/api/user/add_favourite_address', user.add_favourite_address);
router.post('/api/user/update_favourite_address', user.update_favourite_address);
router.post('/api/user/delete_favourite_address', user.delete_favourite_address);
router.post('/api/user/get_cancellation_reasons', user.get_user_cancellation_reasons);


module.exports = router;
