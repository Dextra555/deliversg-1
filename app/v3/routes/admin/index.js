var express = require('express');
var router = express.Router();
var installation_setting = require('../../controllers/admin/installation_setting'); // include installation_setting controller ////
var admin = require('../../controllers/admin/admin'); // include admin_setting controller ////
var city = require('../../controllers/admin/city'); // include city controller ////
var country = require('../../controllers/admin/country'); // include country controller ////
var delivery = require('../../controllers/admin/delivery'); // include delivery controller ////
var service = require('../../controllers/admin/service'); // include service controller ////
var vehicle = require('../../controllers/admin/vehicle'); // include vehicle controller ////
var document = require('../../controllers/admin/document');// include document controller ////
var request = require('../../controllers/store/request'); // include request controller
let seo = require('../../controllers/admin/seo')
let script = require('../../admin_controllers/script_page')
var activity_logs = require('../../controllers/admin/activity_logs') // include activity logs controller
var sub_category = require('../../admin_controllers/sub_category')
var bad_weather = require('../../admin_controllers/bad_weather')
var pickup_offer = require('../../admin_controllers/pickup_offer')
var peak_hour = require('../../admin_controllers/peak_hour')

    router.post('/get_activity_logs', activity_logs.get_activity_logs)

    router.post('/update_store_time',admin.update_store_time);
    router.post('/update_wallet',admin.update_wallet);
    router.post('/insert_daily_weekly_data',admin.insert_daily_weekly_data);
    router.post('/updateDatabaseTable',admin.updateDatabaseTable);
    router.post('/updateItemNewTable',admin.updateItemNewTable);
    router.get('/resize_image',admin.resize_image);
    router.post('/admin/get_vehicles_lists', request.get_vehicles_list)
    router.post('/admin/get_vehicles_lists_all', request.get_vehicles_lists_all)

    router.post('/admin/get_rider_based_on_vehicle', request.get_rider_based_on_vehicle)
    
    // END AUTO UPDATE DB QUERY API.

    router.post('/admin/upload_store_data_excel',admin.upload_store_data_excel);


    // REGULAR API FOR APP.
    router.post('/api/admin/forgot_password',admin.forgot_password);
    router.post('/api/admin/forgot_password_verify',admin.forgot_password_verify);
    router.post('/api/admin/otp_verification',admin.otp_verification);
    router.post('/api/admin/check_detail',admin.check_detail);
    router.post('/api/admin/new_password',admin.new_password);
    router.post('/api/admin/check_referral',admin.check_referral);
    router.post('/api/admin/get_setting_detail',admin.get_setting_detail);
    router.post('/api/admin/get_setting_detail_for_mail_config',admin.get_setting_detail_for_mail_config);
    router.post('/api/admin/get_app_keys',installation_setting.get_app_keys);
    router.post('/api/admin/check_app_keys',installation_setting.check_app_keys);
    router.post('/api/admin/get_image_setting',installation_setting.get_image_setting);

    router.post('/api/admin/get_country_list',country.get_country_list);
    router.get('/api/admin/get_country_list',country.get_country_list);
    router.post('/api/admin/check_country_exists', country.check_country_exists);
    router.post('/api/admin/get_city_list',city.get_city_list);
    router.post('/api/admin/get_city_full_detail_list',city.get_city_full_detail_list);
    router.post('/admin/get_all_city_list',city.all_city_list);
    router.post('/admin/check_city_available', city.check_city)
    
    router.post('/api/admin/get_vehicle_list',vehicle.get_vehicle_list);
    router.post('/api/admin/get_city_lists',vehicle.get_city_lists);
    router.post('/api/admin/get_service_list',service.get_service_list);
    router.post('/api/admin/get_delivery_list',delivery.get_delivery_list);
    router.get('/api/admin/get_delivery_list',delivery.get_delivery_list);
    router.post('/api/admin/get_delivery_list_for_city',delivery.get_delivery_list_for_city);

    router.post('/api/admin/get_document_list',document.get_document_list);
    router.post('/api/admin/upload_document',document.upload_document);

    router.post('/api/admin/updateSeoTags', seo.updateSeoTags)
    router.post('/api/admin/getSeoTags', seo.getSeoTags)

    router.post('/api/admin/add_script_page', script.addScriptPage);
    router.get('/api/admin/get_script_page', script.getScriptPage);
    router.post('/api/admin/delete_script_page', script.deleteScriptPage);
    router.post('/api/admin/update_script_page', script.updateScriptPage);

    router.post('/admin/add_sub_category', sub_category.add_sub_category);
    router.post('/admin/update_sub_category', sub_category.update_sub_category);
    router.post('/admin/delete_sub_category', sub_category.delete_sub_category);
    router.post('/admin/delete_store_sub_category', sub_category.delete_store_sub_category);
    router.post('/admin/get_sub_category_details', sub_category.get_sub_category_details);
    router.post('/admin/add_bad_weather', bad_weather.add_bad_weather);
    router.post('/admin/add_peak_hour_status', peak_hour.add_peak_hour_status);
    router.post('/admin/add_pickup_offer', pickup_offer.add_pickup_offer);

    
module.exports = router;
