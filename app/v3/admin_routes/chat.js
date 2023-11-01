var chat = require('../admin_controllers/chat'); // include ads controller ////
var express = require('express');
var router = express.Router();

    router.post('/admin/send_chat', chat.send_chat);
    router.post('/admin/read_chat', chat.read_chat);

module.exports = router;