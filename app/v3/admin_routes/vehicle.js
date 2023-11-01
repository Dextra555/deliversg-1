
var vehicle = require('../admin_controllers/vehicle'); // include vehicle controller ////

var express = require('express');
var router = express.Router();

    router.post('/admin/add_vehicle_data', vehicle.add_vehicle_data);
    router.get('/admin/vehicle_list', vehicle.vehicle_list);
    router.post('/admin/update_vehicle', vehicle.update_vehicle);
    router.post('/admin/vehicle_toggle_change', vehicle.vehicle_toggle_change);
    router.post('/admin/get_vehicle_detail', vehicle.get_vehicle_detail);
    router.get('/admin/vehicle_list_for_provider', vehicle.vehicle_list_for_provider);


    module.exports = router;





