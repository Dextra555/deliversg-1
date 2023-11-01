var order = require('../admin_controllers/order'); // include order controller ////
var express = require('express');
var router = express.Router();

router.post('/admin/orders_list', order.admin_orders);
router.post('/admin/orders_list_export', order.orders_list_export);
router.post('/admin/orders_list_detail', order.admin_orders_detail);
router.post('/api/admin/order_lists_search_sort', order.order_lists_search_sort);
router.post('/admin/deliveryman_track', order.deliveryman_track);
router.post('/admin/order_list_location_track', order.order_list_location_track);
router.post('/admin/admin_list_orders', order.admin_list_orders);
router.post('/admin/admin_table_list_orders', order.admin_table_list_orders);
router.post('/admin/admin_list_deliveries', order.admin_list_deliveries);
router.post('/admin/admin_fetch_order_detail', order.admin_fetch_order_detail);
router.get('/admin/orders_list_export_excel', order.orders_list_export_excel);
router.post('/admin/admin_review_list', order.admin_review_list);
router.post('/admin/get_admin_dispatcher_order_list', order.get_admin_dispatcher_order_list)
router.post('/admin/get_cancellation_charges', order.get_cancellation_charges)

module.exports = router;