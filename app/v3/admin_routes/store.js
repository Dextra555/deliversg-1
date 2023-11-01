var store = require('../admin_controllers/store'); // include store controller ////
var express = require('express');
var router = express.Router();
 
    
    router.post('/admin/add_store_surcharge',store.add_store_surcharge);
    router.post('/admin/delete_store_surcharge',store.delete_store_surcharge);
    router.post('/admin/get_store_surcharge',store.get_store_surcharge);
    router.get('/admin/get_all_store_surcharge',store.get_all_store_surcharge);
    //router.route('/admin/store_list').get(store.store_list);
    router.post('/admin/store_list_search_sort',store.store_list_search_sort);
    router.post('/admin/filter_sub_categories',store.filter_sub_categories);
    
    router.post('/admin/get_store_data', store.get_store_data);
    router.post('/admin/get_admin_store_detail', store.get_admin_store_detail);
    router.post('/admin/update_store', store.update_store);
    router.post('/admin/approve_decline_store',store.approve_decline_store);
    router.post('/admin/get_store_list_for_city',store.get_store_list_for_city);
    router.get('/admin/get_store_list', store.get_store_list);
    router.post('/admin/get_store_list_by_delivery',store.get_store_list_by_delivery);
    
    router.post('/admin/get_store_list_for_country',store.get_store_list_for_country);
    
    router.post('/admin/product_for_city_store',store.product_for_city_store);
    router.post('/admin/item_for_city_store',store.item_for_city_store);
    router.post('/admin/get_store_review_history',store.get_store_review_history);
    
    router.get('/admin/export_excel_store', store.export_excel_store);

module.exports = router;

