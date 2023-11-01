var transaction_history = require('../admin_controllers/transaction_history'); // include wallet controller ////
var express = require('express');
var router = express.Router();

    router.post('/admin/get_transaction_history', transaction_history.get_transaction_history);
   
    module.exports = router;





