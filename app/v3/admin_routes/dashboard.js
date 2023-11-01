var dashboard = require('../admin_controllers/dashboard'); // include admin controller ////
var express = require('express');
var router = express.Router();


    router.post('/admin/dashboard/last_six_month_payment_detail', dashboard.last_six_month_payment_detail);
    router.post('/admin/dashboard/last_six_month_earning_detail', dashboard.last_six_month_earning_detail);
    router.post('/admin/dashboard/last_fifteen_day_order_detail', dashboard.last_fifteen_day_order_detail);
    router.post('/admin/dashboard/order_detail', dashboard.order_detail);
    router.post('/admin/dashboard/monthly_payment_detail', dashboard.monthly_payment_detail);
    router.post('/admin/dashboard/country_chart', dashboard.country_chart);

module.exports = router;





