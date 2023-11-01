
var view_document = require('../admin_controllers/view_document'); // include view_document controller ////
var express = require('express');
var router = express.Router();


    router.post('/admin/view_document_list', view_document.view_document_list);


    module.exports = router;





