var legal = require('../admin_controllers/legal'); // include email controller ////
var express = require('express');
var router = express.Router();

router.post('/admin/get_legal', legal.get_legal);
router.post('/admin/update_legal', legal.update_legal);

module.exports = router;