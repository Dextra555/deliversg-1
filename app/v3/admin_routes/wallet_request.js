var wallet_request = require('../admin_controllers/wallet_request'); // include wallet_request controller ////
var express = require('express');
var router = express.Router();


    router.post('/api/admin/create_wallet_request', wallet_request.create_wallet_request);
    router.post('/api/admin/get_wallet_request_list', wallet_request.get_wallet_request_list);
    router.post('/admin/approve_wallet_request_amount', wallet_request.approve_wallet_request_amount);
    router.post('/admin/transfer_wallet_request_amount', wallet_request.transfer_wallet_request_amount);
    router.post('/admin/complete_wallet_request_amount', wallet_request.complete_wallet_request_amount);
    router.post('/admin/cancel_wallet_request', wallet_request.cancel_wallet_request);

    router.post('/admin/get_wallet_request_list_search_sort', wallet_request.get_wallet_request_list_search_sort);

    router.post('/admin/get_wallet_request_bank_detail', wallet_request.get_wallet_request_bank_detail);

    module.exports = router;





