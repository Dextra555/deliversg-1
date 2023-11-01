
var delivery = require('../admin_controllers/delivery'); // include delivery controller ////
var express = require('express');
var router = express.Router();

    router.post('/admin/add_delivery_data', delivery.add_delivery_data);
    router.get('/admin/get_delivery_type', delivery.get_delivery_type);

    router.get('/admin/delivery_list', delivery.delivery_list);
    router.post('/admin/update_delivery', delivery.update_delivery);
    router.post('/admin/delivery_toggle_change', delivery.delivery_toggle_change);
    router.post('/admin/get_delivery_detail', delivery.get_delivery_detail);

module.exports = router;





