
var payment_gateway = require('../admin_controllers/payment_gateway'); // include payment_gateway controller ////
var express = require('express');
var router = express.Router();

    router.post('/admin/add_payment_gateway_data', payment_gateway.add_payment_gateway_data);
    router.get('/admin/payment_gateway_list', payment_gateway.payment_gateway_list);
    router.post('/admin/payment_gateway_list', payment_gateway.payment_gateway_list);
    router.post('/admin/get_payment_gateway_detail', payment_gateway.get_payment_gateway_detail);
    router.post('/admin/update_payment_gateway', payment_gateway.update_payment_gateway);
    router.post('/api/admin/update_payment_gateway_keys', payment_gateway.update_payment_gateway_keys);

    module.exports = router;





