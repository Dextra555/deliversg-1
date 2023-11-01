var city = require('../admin_controllers/city'); // include city controller ////
var express = require('express');
var router = express.Router();

    router.post('/admin/get_bad_weather_status', city.get_bad_weather_status);
    router.post('/admin/update_bad_weather_status', city.update_bad_weather_status);

    router.get('/admin/get_server_country_list', city.get_server_country_list);
    router.post('/admin/add_city_data', city.add_city_data);
    router.post('/admin/get_city_detail', city.get_city_detail);
    router.post('/admin/city_list', city.city_list);

    router.post('/admin/city_list_search_sort', city.city_list_search_sort);
    router.post('/admin/city_list', city.city_list);
    router.post('/admin/update_city', city.update_city);

    router.post('/admin/update_city_zone', city.update_city_zone);
    router.post('/admin/add_city_zone', city.add_city_zone);

    router.post('/admin/check_city', city.check_city);
    router.post('/admin/toggle_change', city.toggle_change);

module.exports = router;

