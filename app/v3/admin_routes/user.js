var user = require('../admin_controllers/user'); // include user controller ////
var express = require('express');
var router = express.Router();

    //router.route('/admin/user_list').get(user.user_list);
    router.post('/admin/user_list_search_sort', user.user_list_search_sort);
    
    router.post('/admin/get_user_detail', user.get_user_detail);
    router.post('/admin/update_user', user.update_user);
    router.post('/admin/approve_decline_user', user.approve_decline_user);

    router.post('/admin/add_wallet', user.add_wallet);
    //router.post('/admin/send_email', user.send_email);
    router.post('/admin/send_sms', user.send_sms);
    router.post('/admin/send_notification', user.send_notification);
    router.post('/admin/get_user_referral_history', user.get_user_referral_history);
    router.post('/admin/get_user_review_history', user.get_user_review_history);
    
    router.get('/admin/export_excel_user', user.export_excel_user);
    router.post('/admin/get_user_list', user.get_user_list);

    module.exports = router;
    





