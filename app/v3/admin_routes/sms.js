var sms = require('../admin_controllers/sms'); // include sms controller ////

var express = require('express');
var router = express.Router();

    router.get('/admin/sms_list', sms.sms_list);
    router.post('/admin/get_sms_detail', sms.get_sms_detail);
    router.post('/admin/update_sms', sms.update_sms);


    router.post('/admin/get_sms_gateway_detail', sms.get_sms_gateway_detail);

    router.post('/admin/update_sms_configuration', sms.update_sms_configuration);


    module.exports = router;





