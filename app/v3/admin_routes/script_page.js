var scriptPage = require('../admin_controllers/script_page')
var express = require('express');
var router = express.Router();

router.post('/api/addScriptPage', scriptPage.addScriptPage)
router.post('/api/getScriptPage', scriptPage.getScriptPage)
module.exports = router;