var sub_category = require('../admin_controllers/sub_category'); // include ads controller ////
var express = require('express');
var router = express.Router();

    router.post('/admin/add_sub_category', sub_category.add_sub_category);
    router.get('/admin/get_sub_category', sub_category.get_sub_category);
    router.post('/admin/get_sub_category_stores', sub_category.get_sub_category_stores);
    router.post('/admin/update_sub_category', sub_category.update_sub_category);
    router.post('/admin/delete_sub_category', sub_category.delete_sub_category);
    router.post('/admin/delete_store_sub_category', sub_category.delete_store_sub_category);
    router.post('/admin/get_sub_category_details', sub_category.get_sub_category_details);
    
module.exports = router;