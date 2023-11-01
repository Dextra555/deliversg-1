
var order_earning = require('../admin_controllers/order_earning'); // include order_earning controller ////
var express = require('express');
var router = express.Router();


    router.post('/admin/get_order_earning', order_earning.get_order_earning);
    router.post('/admin/get_order_earning_detail', order_earning.get_order_earning_detail);

module.exports = router;





