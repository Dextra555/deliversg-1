
var referral_code = require('../admin_controllers/referral_code'); // include referral_code controller ////
var express = require('express');
var router = express.Router();

    router.post('/admin/get_referral_detail', referral_code.get_referral_detail);

    module.exports = router;





