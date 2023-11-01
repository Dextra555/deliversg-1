var franchise = require('../admin_controllers/franchise'); // include franchise controller ////
var provider = require('../admin_controllers/provider'); // include franchise controller ////
var express = require('express');
var router = express.Router();
    router.post('/admin/franchise_list_search_sort', franchise.franchise_list_search_sort);
    router.post('/franchise/add_new_provider', provider.add_new_provider);
    router.post('/admin/update_franchise', franchise.update_franchise);
    router.post('/admin/approve_decline_franchise', franchise.approve_decline_franchise);
module.exports = router;

