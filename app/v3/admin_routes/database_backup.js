var database_backup = require('../admin_controllers/database_backup'); // include add_details controller ////
var express = require('express');
var router = express.Router();
    
    router.post('/admin/add_database_backup', database_backup.add_database_backup);
    router.post('/admin/list_database_backup', database_backup.list_database_backup);
    router.post('/admin/restore_database_backup', database_backup.restore_database_backup);

module.exports = router;





