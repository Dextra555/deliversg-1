var order = require('../admin_controllers/order'); // include order controller ////
var express = require('express');
var router = express.Router();


    router.post('/admin/orders_list', order.admin_orders);
    router.post('/api/admin/order_lists_search_sort', order.order_lists_search_sort);
    router.post('/admin/deliveryman_track', order.deliveryman_track);
    router.get('/admin/order_list_location_track', order.order_list_location_track);
    
    router.get('/admin/orders_list_export_excel', order.orders_list_export_excel);

    module.exports = router;





