var tax = require('../admin_controllers/tax'); // include admin controller ////
var express = require('express');
var router = express.Router();


    router.post('/admin/add_tax', tax.add_tax);
    router.post('/admin/edit_tax', tax.edit_tax);

    module.exports = router;




