var provider = require('../admin_controllers/provider_map'); // include provider_map controller ////

var express = require('express');
var router = express.Router();

    router.post('/admin/provider_list_for_map', provider.provider_list_for_map);
    module.exports = router;




