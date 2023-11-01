var add_details = require('../admin_controllers/add_details'); // include add_details controller ////
var express = require('express');
var router = express.Router();

    
    router.post('/admin/add_new_user', add_details.add_new_user);
    router.post('/admin/add_new_provider', add_details.add_new_provider);
    router.post('/admin/add_new_store', add_details.add_new_store);
    router.get('/admin/get_providers', add_details.get_providers);
    router.post('/admin/add_provider_vehicle_data', add_details.add_provider_vehicle_data);
  
module.exports = router;