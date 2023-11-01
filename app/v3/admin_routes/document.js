
var document = require('../admin_controllers/document'); // include document controller ////

var express = require('express');
var router = express.Router();

    router.post('/admin/add_document_data', document.add_document_data);
    router.post('/admin/document_list', document.document_list);
    router.get('/admin/document_list', document.document_list);
    router.post('/admin/update_document', document.update_document);
    router.post('/admin/get_document_detail', document.get_document_detail);
    router.post('/admin/upload_document', document.upload_document);
    
    
    
module.exports = router;





