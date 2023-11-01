var store = require('../admin_controllers/store_map'); // include store_map controller ////
var express = require('express');
var router = express.Router();

     router.post('/admin/store_list_for_map', store.store_list_for_map);

     module.exports = router;





