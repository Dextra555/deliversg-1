var admin = require('../admin_controllers/admin'); // include admin controller ////
var express = require('express');
var router = express.Router();

    router.post('/admin/add', admin.add_admin);
    router.get('/admin/lists', admin.admin_list);
    router.post('/admin/update_language_file', admin.update_language_file);
    router.post('/admin/get_detail', admin.get_admin_detail);
    router.post('/admin/update', admin.update_admin);
    router.post('/admin/delete', admin.delete_admin);
    router.post('/login', admin.login);
    router.post('/admin/check_auth', admin.check_auth);
    router.get('/admin/get_app_name', admin.get_app_name)

module.exports = router;



