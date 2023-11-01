var wallet = require('../admin_controllers/wallet'); // include wallet controller ////
var express = require('express');
var router = express.Router();

    router.post('/admin/get_wallet_detail', wallet.get_wallet_detail);
    router.get('/admin/get_wallet_detail', wallet.get_wallet_detail);
    
    
    module.exports = router;




