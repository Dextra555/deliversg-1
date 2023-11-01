var review = require('../admin_controllers/review'); // include review controller ////
var express = require('express');
var router = express.Router();
    router.post('/admin/get_review_list', review.get_review_list);
    router.post('/admin/get_review_detail', review.get_review_detail);
    

    module.exports = router;





