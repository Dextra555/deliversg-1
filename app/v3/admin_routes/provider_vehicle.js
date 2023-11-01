var provider_vehicle = require('../admin_controllers/provider_vehicle'); // include provider_vehicle controller ////

var express = require('express');
var router = express.Router();
    router.post('/admin/provider_vehicle_list', provider_vehicle.provider_vehicle_list);
    router.post('/admin/provider_vehicle_approve_decline', provider_vehicle.provider_vehicle_approve_decline);
    router.post('/admin/provider_vehicle_update', provider_vehicle.provider_vehicle_update);
    router.post('/admin/get_provider_vehicle_detail', provider_vehicle.get_provider_vehicle_detail);
    router.post('/admin/add_vehicle', provider_vehicle.add_vehicle);
    module.exports = router;





