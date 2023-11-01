var pickup_offer = require('../admin_controllers/pickup_offer'); // include ads controller ////
var express = require('express');
var router = express.Router();

    router.post('/admin/add_pickup_offer', pickup_offer.add_pickup_offer);
    router.get('/admin/get_pickup_offer', pickup_offer.get_pickup_offer);

    
module.exports = router; 