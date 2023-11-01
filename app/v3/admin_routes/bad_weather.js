var bad_weather = require('../admin_controllers/bad_weather'); // include ads controller ////
var express = require('express');
var router = express.Router();

    router.post('/admin/add_subid_to_store', bad_weather.add_subid_to_store);

    router.post('/admin/add_bad_weather', bad_weather.add_bad_weather);
    router.get('/admin/get_bad_weather_status', bad_weather.get_bad_weather_status);
     
module.exports = router; 