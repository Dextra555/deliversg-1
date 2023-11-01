var email = require('../admin_controllers/email'); // include email controller ////
var express = require('express');
var router = express.Router();


    router.get('/admin/email_list', email.email_list);
    router.post('/admin/get_email_detail', email.get_email_detail);
    router.post('/admin/update_email', email.update_email);
    
    router.post('/admin/update_email_configuration', email.update_email_configuration);

module.exports = router;




