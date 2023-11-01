var express = require('express');
var router = express.Router();
var stores = require('../../controllers/store/store');
var delivery = require('../../controllers/store/delivery');
var item = require('../../controllers/store/item');
var product = require('../../controllers/store/product');
var group_product = require('../../controllers/store/group_product');
var request = require('../../controllers/store/request');
var specification = require('../../controllers/store/specification');
var specification_group = require('../../controllers/store/specification_group');
var store_earning = require('../../controllers/store/store_earning');
var store_promo_code = require('../../controllers/store/store_promo_code');
var import_data = require('../../controllers/store/import_data');
var table_booking = require('../../controllers/store/table_booking');

// store promo api
router.post('/api/store/add_promo', store_promo_code.store_add_promo);
router.post('/api/store/promo_code_list', store_promo_code.store_promo_code_list);
router.post('/api/store/update_promo_code', store_promo_code.store_update_promo_code);
router.post('/api/store/check_promo_code', store_promo_code.store_check_promo_code);
router.post('/api/store/search_sort_promo_code_list', store_promo_code.search_sort_promo_code_list);
router.post('/api/store/update_promo_image', store_promo_code.update_promo_image);
// store earning api
router.post('/api/store/get_store_earning', store_earning.get_store_earning);
router.post('/api/store/daily_earning', store_earning.store_daily_earning);
router.post('/api/store/weekly_earning', store_earning.store_weekly_earning);
router.post('/api/store/list_orders', store_earning.list_orders);
router.post('/api/store/table_list_orders', store_earning.table_list_orders);
router.post('/api/store/list_orders_history', store_earning.list_orders_history);
router.post('/api/store/list_earning', store_earning.list_earning);
router.post('/api/store/fetch_order_detail', store_earning.fetch_order_detail);
// specification_group api
router.post('/api/store/add_specification_group', specification_group.add_specification_group);
router.post('/api/store/get_specification_group', specification_group.get_specification_group);
router.post('/api/store/delete_specification_group', specification_group.delete_specification_group);
router.post('/api/store/get_specification_lists', specification_group.get_specification_lists);
router.post('/api/admin/update_sp_name', specification_group.update_sp_name);

// specification api
router.post('/api/store/add_specification', specification.add_specification);
router.post('/api/store/get_specification_list', specification.get_specification_list);
router.post('/api/store/delete_specification', specification.delete_specification);
router.post('/api/store/update_specification_name', specification.update_specification_name);

// request api
router.post('/api/store/create_request', request.create_request);
router.post('/api/store/find_nearest_provider_list', request.findNearestProviderList);
router.post('/api/store/get_vehicle_list', request.get_vehicle_list);
router.post('/api/store/get_vehicles_list', request.get_vehicles_list);
router.post('/api/provider/complete_request', request.complete_request);
router.post('/api/provider/show_request_invoice', request.show_request_invoice);
router.post('/api/provider/provider_cancel_or_reject_request', request.provider_cancel_or_reject_request);
router.post('/api/provider/get_invoice', request.provider_get_invoice);
router.post('/api/provider/change_request_status', request.change_request_status);
router.post('/api/provider/check_assigned_request_status', request.check_assigned_request_status);
router.post('/api/provider/assign_request_status', request.assign_request_status);
router.post('/api/provider/assign_request_status_admin', request.assign_request_status_admin);
router.post('/api/provider/reassign_request_status_admin', request.reassign_request_status_admin);
router.post('/api/store/provider_request_history', request.provider_request_history);
router.post('/api/provider/findProviderByOrdersList', request.findNearestProviderLists);
router.post('/api/provider/findProviderByOrdersListAdmin', request.findNearestProviderListsAdmin);

router.post('/api/provider/get_request_id', request.getRequestIdFromOrderId);

// group_product api
router.post('/api/store/add_product_group_data', group_product.add_product_group_data);
router.post('/api/store/get_group_list_of_group', group_product.get_group_list_of_group);
router.post('/api/store/get_product_group_list', group_product.get_product_group_list);
router.post('/api/store/update_product_group', group_product.update_product_group);
router.post('/api/store/delete_product_group', group_product.delete_product_group);
router.post('/api/store/get_product_group_data', group_product.get_product_group_data);
// product api
router.post('/api/store/add_product', product.add_product);
router.post('/api/store/get_product_list', product.get_product_list);
router.post('/api/store/update_product', product.update_product);
router.post('/api/store/get_product_data', product.get_product_data);
router.post('/api/get_product_item_detail', product.get_product_item_detail);
router.post('/api/store/get_subcategory_list', product.get_subcategory_list);


// item api
router.post('/api/store/add_item', item.add_item);
router.post('/api/store/copy_items', item.copy_items);
router.post('/api/store/upload_item_image', item.upload_item_image);
router.post('/api/store/update_item_image', item.update_item_image);
router.post('/api/store/get_store_product_item_list', item.get_store_product_item_list);
router.post('/api/store/get_item_list', item.get_item_list);
router.post('/api/store/update_item', item.update_item);
router.post('/api/store/delete_item', item.delete_item);
router.post('/api/store/get_item_data', item.get_item_data);
router.post('/api/store/is_item_in_stock', item.is_item_in_stock);
router.post('/api/store/delete_item_image', item.delete_item_image);
router.post('/api/store/update_sequence_number', item.update_sequence_number);
router.post('/api/get_item_detail', item.get_item_detail);
// delivery api
router.post('/api/store/get_store_providers', delivery.get_store_providers);
router.post('/api/store/provider_location_track', delivery.provider_location_track);
router.post('/api/store/get_dispatcher_order_list', delivery.get_dispatcher_order_list);
router.post('/api/store/order_list_for_delivery', delivery.order_list_for_delivery);
router.post('/api/store/history', delivery.history);
router.post('/api/store/delivery_list_search_sort', delivery.delivery_list_search_sort);
router.post('/api/store/store_notify_new_order', delivery.store_notify_new_order);
router.post('/api/store/get_order_data', delivery.get_order_data);
router.post('/api/store/order_list_search_sort', delivery.order_list_search_sort);
router.post('/api/store/export_excel_history', delivery.export_excel_history);
router.post('/api/store/get_order_list', delivery.get_order_list);
// store api
router.post('/api/store/sub_store_login', stores.sub_store_login);
router.post('/api/store/add_page', stores.add_page);
router.post('/api/store/update_page', stores.update_page);
router.post('/api/store/pages', stores.pages);
router.post('/api/store/order_list', stores.order_list);
router.post('/api/store/sub_store_list', stores.sub_store_list);
router.post('/api/store/add_sub_store', stores.add_sub_store);
router.post('/api/store/update_sub_store', stores.update_sub_store);
router.post('/api/store/register', stores.store_register);
router.post('/api/store/login', stores.store_login); 
router.post('/api/store/update', stores.store_update);
router.post('/api/store/update_store_time', stores.update_store_time);
router.post('/api/store/get_store_promo', stores.get_store_promo);
router.post('/api/store/get_store_detail', stores.get_store_detail);
router.post('/api/store/logout', stores.logout);
router.post('/api/store/update_device_token', stores.update_device_token);
router.post('/api/store/get_detail', stores.get_detail);
router.post('/api/store/order_payment_status_set_on_cash_on_delivery', stores.order_payment_status_set_on_cash_on_delivery);
//router.post('/api/store/check_order_status', stores.check_order_status);
router.post('/api/store/get_store_data', stores.get_store_data);
router.post('/api/store/order_history', stores.order_history);
router.post('/api/store/order_history_detail', stores.order_history_detail);
router.post('/api/store/rating_to_provider', stores.store_rating_to_provider);
router.post('/api/store/rating_to_user', stores.store_rating_to_user);
router.post('/api/store/cancel_request', stores.store_cancel_request);
router.post('/api/store/get_order_detail', stores.get_order_detail);
router.post('/api/store/get_user', stores.get_user);
router.post('/api/store/get_country_phone_number_length', stores.get_country_phone_number_length);
router.post('/api/store/complete_order', stores.store_complete_order);
router.post('/api/store/create_order', stores.store_create_order);
router.post('/api/store/store_change_delivery_address', stores.store_change_delivery_address);
router.post('/api/store/update_order', stores.store_update_order);
router.post('/api/store/check_request_status', stores.check_request_status);
router.post('/api/store/get_reviews_list', stores.get_reviews_list);
router.post('/api/store/store_generate_otp', stores.store_generate_otp);
router.post('/api/store/otp_verification', stores.store_otp_verification);
router.post('/api/store/check_store_location', stores.check_store_location)

router.get('/api/store/export_item_product', import_data.export_item_product);
router.post('/api/store/export_item_product', import_data.export_item_product);
router.get('/api/store/export_modifier_product', import_data.export_modifier_product);
router.post('/api/store/export_modifier_product', import_data.export_modifier_product);
router.get('/api/store/import_modifier_product', import_data.import_modifier_product);
router.post('/api/store/import_modifier_product', import_data.import_modifier_product);
router.get('/api/store/import_item_product', import_data.import_item_product);
router.post('/api/store/import_item_product', import_data.import_item_product);
router.post('/api/store/import_item_image', import_data.import_item_image);

router.post('/api/store/fetch_table_booking_basic_setting', table_booking.fetch_table_booking_basic_setting);
router.post('/api/store/update_table_booking_basic_setting', table_booking.update_table_booking_basic_setting);
router.post('/api/store/update_table_booking_time_setting', table_booking.update_table_booking_time_setting);
router.post('/api/store/list_table', table_booking.list_table);
router.post('/api/store/add_table', table_booking.add_table);
router.post('/api/store/update_table', table_booking.update_table);
router.post('/api/store/change_qrcode', table_booking.change_qrcode);
router.post('/api/store/fetchTableDetails', table_booking.fetchTableDetails);
// router.post('/api/store/reserve_table', table_booking.reserve_table)
router.post('/api/store/get_cancellation_reasons', stores.get_store_cancellation_reasons);
router.post('/api/store/get_store_review_data', stores.get_store_review_data);

module.exports = router;
