var mass_notification = require('../admin_controllers/mass_notification'); // include mass_notification controller ////
var express = require('express');
var router = express.Router();

   // app.route('/admin/get_mass_notification_list').get(mass_notification.get_mass_notification_list);
    router.post('/admin/get_mass_notification_list', mass_notification.get_mass_notification_list);
    router.post('/admin/create_mass_notifications', mass_notification.create_mass_notification);

module.exports = router;