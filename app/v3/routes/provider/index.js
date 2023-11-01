var express = require('express');
var router = express.Router();
var provider = require('../../controllers/provider/provider');
var provider_earning = require('../../controllers/provider/provider_earning');
var bank_detail = require('../../controllers/provider/bank_detail');
var provider_vehicle = require('../../controllers/provider/provider_vehicle');

// provider_vehicle api
router.post('/api/provider/add_vehicle', provider_vehicle.add_vehicle);
router.post('/api/provider/update_vehicle_detail', provider_vehicle.update_vehicle_detail);
router.post('/api/provider/get_vehicle_list', provider_vehicle.get_vehicle_list);
router.post('/api/provider/select_vehicle', provider_vehicle.select_vehicle);
// provider_earning api
router.post('/api/provider/daily_earning', provider_earning.provider_daily_earning);
router.post('/api/provider/weekly_earning', provider_earning.provider_weekly_earning);
// bank detail api
router.post('/api/admin/add_bank_detail', bank_detail.add_bank_detail);
router.post('/api/admin/get_bank_detail', bank_detail.get_bank_detail);
router.post('/api/admin/delete_bank_detail', bank_detail.delete_bank_detail);
router.post('/api/admin/select_bank_detail', bank_detail.select_bank_detail);
router.post('/api/admin/get_bank_file_url', bank_detail.get_bank_file_url);
// provider api
router.post('/api/provider/register', provider.provider_register);
router.post('/api/provider/login', provider.provider_login);
router.post('/api/provider/update', provider.provider_update);
router.post('/api/provider/logout', provider.logout);
router.post('/api/provider/get_detail', provider.get_detail);
router.post('/api/provider/update_device_token', provider.update_device_token);
router.post('/api/provider/change_status', provider.change_status);
router.post('/api/provider/otp_verification', provider.provider_otp_verification);
router.post('/api/provider/rating_to_store', provider.provider_rating_to_store);
router.post('/api/provider/rating_to_user', provider.provider_rating_to_user);
router.post('/api/provider/get_order_status', provider.get_order_status);
router.post('/api/provider/update_location', provider.update_location);
router.post('/api/provider/get_requests', provider.get_requests);
router.post('/api/provider/get_active_requests', provider.get_active_requests);
router.post('/api/provider/get_request_count', provider.get_request_count);
router.post('/api/provider/request_history_detail', provider.request_history_detail);
router.post('/api/provider/request_history', provider.request_history);
router.post('/api/provider/get_request_status', provider.get_request_status);
router.post('/api/provider/get_cancellation_reasons', provider.get_provider_cancellation_reasons);



module.exports = router;
