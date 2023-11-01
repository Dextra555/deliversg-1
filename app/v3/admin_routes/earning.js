
var earning = require('../admin_controllers/earning'); // include earning controller ////
var express = require('express');
var router = express.Router();


    router.post('/admin/get_earning', earning.get_admin_earning);
    router.post('/admin/fetch_earning_detail', earning.fetch_earning_detail);
    
    //app.route('/admin/export_excel_earning').get(earning.export_excel_earning);

module.exports = router;





