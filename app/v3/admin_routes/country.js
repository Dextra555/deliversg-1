var country = require('../admin_controllers/country'); // include country controller ////
var express = require('express');
var router = express.Router();

    router.get('/admin/get_country_data_list', country.get_country_data_list);
    router.get('/admin/get_country_list', country.get_country_list);
    router.get('/admin/get_timezone_list', country.get_timezone_list);
    
    router.get('/admin/get_language_list', country.get_language_list);
    
    router.post('/admin/get_country_data', country.get_country_data);
    router.post('/admin/country_detail_for_admin', country.country_detail_for_admin);

    router.post('/admin/add_country_data', country.add_country_data);

    router.post('/admin/get_country_detail', country.get_country_detail);

    router.post('/admin/get_country_timezone', country.get_country_timezone);

    router.get('/admin/country_list', country.country_list);

    router.post('/admin/update_country', country.update_country);

    router.post('/admin/country_toggle_change', country.country_toggle_change);

module.exports = router;





