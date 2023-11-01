
var promo_code = require('../admin_controllers/promo_code'); // include promo_code controller ////
var express = require('express');
var router = express.Router();

    router.post('/admin/add_promo_code_data', promo_code.add_promo_code_data);
    router.get('/admin/promo_code_list', promo_code.promo_code_list);
    router.post('/admin/promo_code_list', promo_code.promo_code_list);
    router.post('/admin/promocode_active_deactive', promo_code.promocode_active_deactive);

    router.post('/admin/update_promo_code', promo_code.update_promo_code);
    router.post('/admin/get_promo_detail', promo_code.get_promo_detail);
    router.post('/admin/get_promo_uses_detail', promo_code.get_promo_uses_detail);
    router.post('/admin/check_promo_code', promo_code.check_promo_code);
    
    router.post('/admin/get_promo_code_list', promo_code.get_promo_code_list);
    

    module.exports = router;





