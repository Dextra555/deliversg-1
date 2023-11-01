
var store_weekly_earning = require('../admin_controllers/store_weekly_earning'); // include store_weekly_earning controller ////
var express = require('express');
var router = express.Router();

    router.post('/admin/store_weekly_earning', store_weekly_earning.store_weekly_earning);
    router.post('/admin/weekly_statement_for_store', store_weekly_earning.weekly_statement_for_store);
    router.post('/admin/admin_paid_to_store', store_weekly_earning.admin_paid_to_store);
    //router.route('/admin/export_excel_store_weekly_earning').get(store_weekly_earning.export_excel_store_weekly_earning);
    module.exports = router;





