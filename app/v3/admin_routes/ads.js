var ads = require('../admin_controllers/ads'); // include ads controller ////
var express = require('express');
var router = express.Router();


    router.post('/admin/add_advertise', ads.add_advertise);
    router.post('/admin/delete_advertise', ads.delete_advertise);
    router.post('/admin/change_advertise_visibility', ads.change_advertise_visibility);
    router.post('/admin/update_advertise', ads.update_advertise);
    router.post('/admin/advertise_list', ads.advertise_list);
    router.get('/admin/advertise_list', ads.advertise_list);
    router.post('/admin/get_advertise_detail', ads.get_advertise_detail);
    
    router.post('/admin/get_visible_advertise', ads.get_visible_advertise);

module.exports = router;



