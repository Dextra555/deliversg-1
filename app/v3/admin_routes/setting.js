var setting = require('../admin_controllers/setting'); // include setting controller ////

var express = require('express');
var router = express.Router();


    router.post('/admin/upload_logo_images', setting.upload_logo_images);
    router.post('/admin/update_firebase_setting', setting.update_firebase_setting);
    router.post('/admin/update_google_key_setting', setting.update_google_key_setting);
    router.post('/admin/update_app_version_setting', setting.update_app_version_setting);
    router.post('/admin/update_switch_setting', setting.update_switch_setting);
    router.post('/admin/update_admin_setting', setting.update_admin_setting);
    router.post('/admin/update_ios_push_notification_setting', setting.update_ios_push_notification_setting);
    router.post('/admin/update_image_setting', setting.update_image_setting);
    router.post('/admin/get_image_setting_detail', setting.get_image_setting_detail);
    router.post('/admin/add_new_language', setting.add_new_language);
    router.get('/admin/get_languages', setting.get_languages);
    router.post('/api/admin/update_admin_setting', setting.update_admin_setting_new);
    router.post('/api/admin/update_installation_setting', setting.update_installation_setting);
    router.post('/admin/update_push_notification_setting', setting.update_push_notification_setting);
    router.get('/admin/update_base_urls', setting.update_base_urls)

    module.exports = router;





