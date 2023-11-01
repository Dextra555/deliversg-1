
var service = require('../admin_controllers/service'); // include service controller ////
var express = require('express');
var router = express.Router();

    router.post('/admin/add_service_data', service.add_service_data);
    router.get('/admin/service_list', service.service_list);
    router.post('/admin/service_list', service.service_list);
    router.post('/admin/get_service_detail', service.get_service_detail);
    router.post('/admin/update_service', service.update_service);
    router.post('/admin/get_service_list_by_city', service.get_service_list_by_city)

    router.post('/admin/add_zone_price', service.add_zone_price);
    router.post('/admin/update_zone_price', service.update_zone_price);
    
    router.post('/admin/get_zone_detail', service.get_zone_detail);
    router.post('/admin/select_default_service', service.select_default_service);

    module.exports = router;




