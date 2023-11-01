var history = require('../admin_controllers/history'); // include history controller ////
var express = require('express');
var router = express.Router();

    router.post('/api/admin/history', history.admin_history);
    router.post('/api/admin/get_order_data', history.get_order_data);
    router.post('/admin/admin_history_detail', history.admin_history_detail);
    router.post('/api/admin/delivery_list_search_sort', history.delivery_list_search_sort);
    router.post('/api/admin/admin_requests_detail', history.admin_requests_detail);

    //router.post('/admin/get_order_detail', history.get_order_detail);
    router.post('/admin/view_history', history.view_history);
    router.post('/admin/view_provider_history', history.view_provider_history);
    router.post('/admin/get_request_data', history.get_request_data);
    router.post('/api/admin/history_export_excel', history.history_export_excel);
    
    router.post('/api/admin/deliveries_export_excel', history.deliveries_export_excel);
    
    

module.exports = router;





