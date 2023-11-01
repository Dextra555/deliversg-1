var express = require('express');
var router = express.Router();
var franchises = require('../../controllers/franchise/franchise');
var delivery = require('../../controllers/franchise/delivery');
var item = require('../../controllers/franchise/item');
var product = require('../../controllers/franchise/product');
var group_product = require('../../controllers/franchise/group_product');
var specification = require('../../controllers/franchise/specification');
var specification_group = require('../../controllers/franchise/specification_group');
var franchise_promo_code = require('../../controllers/franchise/store_promo_code');
var store_earning = require('../../controllers/store/store_earning');
var request = require('../../controllers/store/request');
var order = require('../../controllers/user/order');

// franchise promo api
router.post('/api/franchise/add_promo', franchise_promo_code.store_add_promo);
router.post('/api/franchise/promo_code_list', franchise_promo_code.store_promo_code_list);
router.post('/api/franchise/update_promo_code', franchise_promo_code.store_update_promo_code);
router.post('/api/franchise/check_promo_code', franchise_promo_code.store_check_promo_code);
router.post('/api/franchise/search_sort_promo_code_list', franchise_promo_code.search_sort_promo_code_list);
// specification_group api
router.post('/api/franchise/add_specification_group', specification_group.add_specification_group);
router.post('/api/franchise/get_specification_group', specification_group.get_specification_group);
router.post('/api/franchise/delete_specification_group', specification_group.delete_specification_group);
router.post('/api/franchise/get_specification_lists', specification_group.get_specification_lists);
router.post('/api/admin/update_sp_name', specification_group.update_sp_name);
// specification api
router.post('/api/franchise/add_specification', specification.add_specification);
router.post('/api/franchise/get_specification_list', specification.get_specification_list);
router.post('/api/franchise/delete_specification', specification.delete_specification);
router.post('/api/franchise/update_specification_name', specification.update_specification_name);
// group_product api
router.post('/api/franchise/add_product_group_data', group_product.add_product_group_data);
router.post('/api/franchise/get_group_list_of_group', group_product.get_group_list_of_group);
router.post('/api/franchise/get_product_group_list', group_product.get_product_group_list);
router.post('/api/franchise/update_product_group', group_product.update_product_group);
router.post('/api/franchise/delete_product_group', group_product.delete_product_group);
router.post('/api/franchise/get_product_group_data', group_product.get_product_group_data);
// product api
router.post('/api/franchise/add_product', product.add_product);
router.post('/api/franchise/get_product_list', product.get_product_list);
router.post('/api/franchise/update_product', product.update_product);
router.post('/api/franchise/get_product_data', product.get_product_data);
router.post('/api/get_product_item_detail', product.get_product_item_detail);
// item api
router.post('/api/franchise/add_item', item.add_item);
router.post('/api/franchise/copy_items', item.copy_items);
router.post('/api/franchise/upload_item_image', item.upload_item_image);
router.post('/api/franchise/update_item_image', item.update_item_image);
router.post('/api/franchise/get_store_product_item_list', item.get_store_product_item_list);
router.post('/api/franchise/get_item_list', item.get_item_list);
router.post('/api/franchise/update_item', item.update_item);
router.post('/api/franchise/delete_item', item.delete_item);
router.post('/api/franchise/get_item_data', item.get_item_data);
router.post('/api/franchise/is_item_in_stock', item.is_item_in_stock);
router.post('/api/franchise/delete_item_image', item.delete_item_image);
router.post('/api/franchise/update_sequence_number', item.update_sequence_number);
router.post('/api/get_item_detail', item.get_item_detail);
// delivery api
router.post('/api/franchise/get_store_providers', delivery.get_store_providers);
router.post('/api/franchise/provider_location_track', delivery.provider_location_track);
router.post('/api/franchise/get_dispatcher_order_list', delivery.get_dispatcher_order_list);
router.post('/api/franchise/order_list_for_delivery', delivery.order_list_for_delivery);
router.post('/api/franchise/history', delivery.history);
router.post('/api/franchise/delivery_list_search_sort', delivery.delivery_list_search_sort);
router.post('/api/franchise/store_notify_new_order', delivery.store_notify_new_order);
router.post('/api/franchise/get_order_data', delivery.get_order_data);
router.post('/api/franchise/order_list_search_sort', delivery.order_list_search_sort);
router.post('/api/franchise/export_excel_history', delivery.export_excel_history);
router.post('/api/franchise/get_order_list', delivery.get_order_list);
// franchise api
router.post('/api/franchise/register', franchises.store_register);
router.post('/api/franchise/login', franchises.store_login); 
router.post('/api/franchise/update', franchises.store_update);
router.post('/api/franchise/update_store_time', franchises.update_store_time);
router.post('/api/franchise/logout', franchises.logout);
router.post('/api/franchise/update_device_token', franchises.update_device_token);
router.post('/api/franchise/otp_verification', franchises.store_otp_verification);
router.post('/api/franchise/get_detail', franchises.get_detail);
router.post('/api/franchise/get_country_phone_number_length', franchises.get_country_phone_number_length);
router.post('/api/franchise/get_franchise_data', franchises.get_franchise_data);
router.post('/api/franchise/get_order_detail', franchises.get_order_detail);
router.post('/api/franchise/cancel_request', franchises.franchise_cancel_request);
router.post('/api/franchise/complete_order', franchises.franchise_complete_order);
router.post('/api/franchise/order_history_detail', franchises.order_history_detail);

router.post('/api/franchise/get_store_earning', store_earning.get_store_earning);
router.post('/api/franchise/create_request', request.create_request);
router.post('/api/franchise/get_vehicle_list', request.get_vehicle_list);
router.post('/api/franchise/set_order_status', order.set_order_status);
router.post('/api/franchise/store_cancel_or_reject_order', order.store_cancel_or_reject_order);

module.exports = router;
