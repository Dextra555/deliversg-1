var provider = require('../admin_controllers/provider'); // include provider controller ////

var express = require('express');
var router = express.Router();

    router.get('/admin/provider_list', provider.provider_list);
    router.post('/api/provider/provider_list_search_sort', provider.provider_list_search_sort);
    router.post('/admin/get_provider_detail', provider.get_provider_detail);
    router.post('/admin/get_admin_provider_detail', provider.get_admin_provider_detail);
    router.post('/admin/update_provider', provider.update_provider);
    router.post('/admin/provider_approve_decline', provider.provider_approve_decline);
    
    router.post('/admin/get_bank_detail', provider.get_bank_detail);
    router.post('/admin/get_provider_list_for_city', provider.get_provider_list_for_city);
    
    router.get('/admin/export_csv_provider', provider.export_csv_provider);
    router.post('/admin/get_provider_review_history', provider.get_provider_review_history);

    router.post('/store/add_new_provider', provider.add_new_provider);
   
    module.exports = router;





