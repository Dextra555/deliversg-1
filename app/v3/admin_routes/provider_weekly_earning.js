
var provider_weekly_earning = require('../admin_controllers/provider_weekly_earning'); // include provider_weekly_earning controller ////

var express = require('express');
var router = express.Router();

   
    router.post('/admin/provider_weekly_earning', provider_weekly_earning.provider_weekly_earning);
    router.post('/admin/admin_paid_to_provider', provider_weekly_earning.admin_paid_to_provider);
    router.post('/admin/weekly_statement_for_provider', provider_weekly_earning.weekly_statement_for_provider);

   
    module.exports = router;





