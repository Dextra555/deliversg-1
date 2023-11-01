var cancellation_charge = require('../admin_controllers/cancellation_charge'); // include cancellation_charge controller ////
var express = require('express');
var router = express.Router();

    router.post('/admin/cancellation_reason_list', cancellation_charge.cancellation_reason_list);
    router.post('/admin/request_cancellation_reason', cancellation_charge.request_cancellation_reason);




module.exports = router;


