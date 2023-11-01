var cancellation_reason = require('../admin_controllers/cancellation_reason'); // include ads controller ////
var express = require('express');
var router = express.Router();

    router.post('/admin/add_cancellation_reason', cancellation_reason.add_cancellation_reason);
    router.post('/admin/delete_cancellation_reason', cancellation_reason.delete_cancellation_reason);
    router.post('/admin/update_cancellation_reason', cancellation_reason.update_cancellation_reason);
    router.post('/admin/cancellationreason_list', cancellation_reason.cancellation_reason_list);
    router.get('/admin/cancellationreason_list', cancellation_reason.cancellation_reason_list);
    router.post('/admin/get_cancellation_reason', cancellation_reason.get_cancellation_reason);
    
module.exports = router;