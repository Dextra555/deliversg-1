let smongoose = global.smongoose
let ActivityLogs = require('../app/models/admin/activity_log')

let public_image_route = [
    "/provider_documents/",
    "/store_documents/",
    "/user_documents/",
    "/provider_vehicle_documents/",
    "/user_profiles/",
    "/provider_profiles/",
    "/store_profiles/",
    "/store_products/",
    "/store_products_group/",
    "/pickup_order_images/",
    "/arrived_order_images/",
    "/store_items/",
    "/cart_items/",
    "/delivery_type_images/",
    "/sub_category_images/",
    "/delivery_icon_images/",
    "/delivery_map_pin_images/",
    "/service_type_images/",
    "/service_type_map_pin_images/",
    "/payment_images/",
    "/payment_selected_images/",
    "/map_pin_images/",
    "/email_images/",
    "/web_images/",
    "/ads_mobile_images/",
    "/ads_web_images/",
    "/promo_images/"
]

const high_priority = [
    { url: "api/user/update_device_token", type: 'POST' },
    { url: "api/user/check_delivery_available", type: 'POST' },
    { url: "api/user/login", type: 'POST' },
    { url: "api/user/register", type: 'POST' },
    { url: "api/user/get_store_list", type: 'POST' },
    { url: "api/user/get_delivery_store_list", type: 'POST' },
    { url: "api/user/get_subcategory_store_list", type: 'POST' },
    { url: "api/user/get_subcategory_store_list_web", type: 'POST' },
    { url: "api/user/get_delivery_list_for_nearest_city", type: 'POST' },

    { url: "api/admin/check_app_keys", type: 'POST' },
    { url: "api/admin/get_country_list", type: 'POST' },
    { url: "api/admin/get_city_list", type: 'POST' },
    { url: "api/user/user_get_store_product_item_list", type: 'POST' },
    { url: "api/user/get_product_group_list", type: 'POST' },
    { url: "api/user/user_get_specification_list", type: 'POST' },
    { url: "api/user/add_item_in_cart", type: 'POST' },
    { url: "api/user/get_cart", type: 'POST' },
    { url: "api/user/replace_order", type: 'POST' },
    { url: "api/user/get_order_cart_invoice", type: 'POST' },
    { url: "api/user/check_user_pickup", type: 'POST' },
    { url: "api/user/get_courier_order_invoice", type: 'POST' },
    { url: "api/user/get_detail", type: 'POST' },
    { url: "api/user/add_card", type: 'POST' },
    { url: "api/user/get_card_list", type: 'POST' },
    { url: "api/user/select_card", type: 'POST' },

    { url: "api/user/add_wallet_amount", type: 'POST' },
    { url: "api/user/get_payment_gateway", type: 'POST' },
    { url: "api/user/create_order", type: 'POST' },
    { url: "api/user/pay_order_payment", type: 'POST' },
    { url: "api/user/user_update_order", type: 'POST' },
    { url: "api/user/get_stripe_add_card_intent", type: 'POST' },
    { url: "api/user/get_stripe_payment_intent_wallet", type: 'POST' },
    { url: "api/user/get_provider_location", type: 'POST' },
    { url: "/admin/payment_gateway_list", type: "GET" },
    { url: "/api/admin/update_payment_gateway_keys", type: "POST" },
    { url: "/api/store/register", type: "POST" },
    { url: "/api/store/update", type: "POST" },
    { url: "/api/admin/forgot_password_verify", type: "POST" },
    { url: "/api/admin/new_password", type: "POST" },
    { url: "/admin/delete", type: "POST" },
    { url: "/login", type: "POST" },
    { url: "/admin/add_wallet", type: "POST" },
    { url: "/admin/provider_approve_decline", type: "POST" },
    { url: "/admin/get_admin_provider_detail", type: "POST" },
    { url: "/admin/update_provider", type: "POST" },
    { url: "/admin/approve_decline_store", type: "POST" },
    { url: "/admin/get_admin_store_detail", type: "POST" },
    { url: "/admin/update_store", type: "POST" },
    { url: "/api/store/update_specification_name", type: "POST" },
    { url: "/api/admin/update_sp_name", type: "POST" },
    { url: "/api/admin/forgot_password", type: "POST" },
    { url: "/admin/add_country_data", type: "POST" },
    { url: "/admin/update_country", type: "POST" },
    { url: "/admin/add_city_data", type: "POST" },
    { url: "/admin/update_city", type: "POST" },
    { url: "/api/admin/get_setting_detail", type: "POST" },
    { url: "/api/admin/get_app_keys", type: "POST" },
    { url: "/api/admin/update_admin_setting", type: "POST" },
    { url: "/api/admin/update_installation_setting", type: "POST" },
    { url: "/admin/update_sms", type: "POST" },
    { url: "/admin/update_email", type: "POST" },
    { url: "/admin/update_email_configuration", type: "POST" },
    { url: "/admin/add_advertise", type: "POST" },
    { url: "/admin/update_advertise", type: "POST" },
    { url: "/api/store/add_item", type: "POST" },
    { url: "/api/store/cancel_request", type: "POST" },
    { url: "/api/store/create_request", type: "POST" },
    { url: "/api/store/update_item", type: "POST" },
    { url: "/api/store/update_item_image", type: "POST" },
    { url: "/api/store/delete_item_image", type: "POST" },
    { url: "/api/store/add_product_group_data", type: "POST" },
    { url: "/api/store/update_product_group", type: "POST" },
    { url: "/api/store/delete_product_group", type: "POST" },
    { url: "/api/store/update_product", type: "POST" },
    { url: "/api/store/set_order_status", type: "POST" },
    { url: "/api/store/add_product", type: "POST" },
    { url: "/api/store/add_specification_group", type: "POST" },
    { url: "/api/store/add_specification", type: "POST" },
    { url: "/api/store/complete_order", type: "POST" },
    { url: "/admin/provider_vehicle_update", type: "POST" },
    { url: "/api/store/update_cash_payment_gateways", type: "POST" },
    { url: "/api/store/update_payment_gateways", type: "POST" },
    { url: "/admin/add_service_data", type: "POST" },
    { url: "/admin/add_zone_price", type: "POST" },
    { url: "/admin/update_service", type: "POST" },
    { url: "/admin/update_vehicle", type: "POST" },
    { url: "/admin/add_vehicle_data", type: "POST" },
    { url: "/admin/get_wallet_request_list_search_sort", type: "POST" },
    { url: "/admin/get_wallet_request_bank_detail", type: "POST" },
    { url: "/admin/complete_wallet_request_amount", type: "POST" },
    { url: "/admin/approve_wallet_request_amount", type: "POST" },
    { url: "/admin/cancel_wallet_request", type: "POST" },
    { url: "/admin/transfer_wallet_request_amount", type: "POST" },
    { url: "/admin/update_document", type: "POST" },
    { url: "/admin/add", type: "POST" },
    { url: "/admin/update", type: "POST" },
    { url: "/api/user/user_cancel_order", type: "POST" },
    { url: "/admin/add_new_language", type: "POST" },
    { url: "/admin/add_new_store", type: "POST" },
    { url: "/admin/add_new_user", type: "POST" },
    { url: "/admin/add_new_provider", type: "POST" },
    { url: "/updateDatabaseTable", type: "POST" },
    { url: "/admin/add_provider_vehicle_data", type: "POST" },
    { url: "/updateItemNewTable", type: "POST" },
    { url: "/admin/update_zone_price", type: "POST" },
    { url: "/admin/add_tax", type: "POST" },
    { url: "/admin/edit_tax", type: "POST" }
]

const medium_priority = [
    { url: "api/store/get_vehicles_list", type: 'POST' },

    { url: "api/user/approve_edit_order", type: 'POST' },
    { url: "api/admin/check_referral", type: 'POST' },
    { url: "api/user/update", type: 'POST' },
    { url: "api/user/clear_cart", type: 'POST' },
    { url: "api/admin/otp_verification", type: 'POST' },
    { url: "api/user/otp_verification", type: 'POST' },
    { url: "api/user/apply_promo_code", type: 'POST' },
    { url: "api/admin/forgot_password", type: 'POST' },
    { url: "api/admin/forgot_password_verify", type: 'POST' },
    { url: "api/admin/new_password", type: 'POST' },
    { url: "api/user/change_delivery_address", type: 'POST' },
    { url: "api/user/change_user_wallet_status", type: 'POST' },
    { url: "api/user/get_orders", type: 'POST' },
    { url: "api/user/get_order_status", type: 'POST' },
    { url: "api/user/user_cancel_order", type: 'POST' },
    { url: "api/user/get_invoice", type: 'POST' },
    { url: "api/admin/upload_document", type: 'POST' },
    { url: "api/user/order_history", type: 'POST' },
    { url: "api/user/get_order_detail", type: 'POST' },
    { url: "api/user/delete_card", type: 'POST' },

    { url: "admin/add_sub_category", type: "POST" },
    { url: "admin/add_bad_weather", type: "POST" },
    { url: "admin/lists", type: "GET" },
    { url: "api/store/sub_store_login", type: "POST" },
    { url: "api/store/login", type: "POST" },
    { url: "api/store/logout", type: "POST" },
    { url: "api/store/get_store_data", type: "POST" },
    { url: "admin/admin_review_list", type: "POST" },
    { url: "admin/user_list_search_sort", type: "POST" },
    { url: "admin/approve_decline_user", type: "POST" },
    { url: "admin/get_user_detail", type: "POST" },
    { url: "admin/update_user", type: "POST" },
    { url: "admin/send_sms", type: "POST" },
    { url: "admin/send_notification", type: "POST" },
    { url: "admin/get_user_referral_history", type: "POST" },
    { url: "admin/get_user_review_history", type: "POST" },
    { url: "admin/upload_document", type: "POST" },
    { url: "admin/get_provider_review_history", type: "POST" },
    { url: "admin/get_store_review_history", type: "POST" },
    { url: "admin/promo_code_list", type: "POST" },
    { url: "admin/update_promo_code", type: "POST" },
    { url: "admin/get_store_list_by_delivery", type: "POST" },
    { url: "api/store/get_dispatcher_order_list", type: "POST" },
    { url: "admin/get_country_data", type: "POST" },
    { url: "admin/get_country_timezone", type: "POST" },
    { url: "admin/check_city", type: "POST" },
    { url: "admin/get_wallet_detail", type: "POST" },
    { url: "admin/country_detail_for_admin", type: "POST" },
    { url: "admin/upload_logo_images", type: "POST" },
    { url: "admin/update_push_notification_setting", type: "POST" },
    { url: "admin/store_list_for_map", type: "POST" },
    { url: "admin/provider_list_for_map", type: "POST" },
    { url: "admin/get_mass_notification_list", type: "POST" },
    { url: "admin/create_mass_notifications", type: "POST" },
    { url: "admin/sms_list", type: "POST" },
    { url: "admin/email_list", type: "POST" },
    { url: "admin/get_sms_gateway_detail", type: "POST" },
    { url: "admin/update_sms_configuration", type: "POST" },
    { url: "admin/get_transaction_history", type: "POST" },
    { url: "admin/get_advertise_detail", type: "POST" },
    { url: "api/admin/get_setting_detail_for_mail_config", type: "POST" },
    { url: "admin/deliveryman_track", type: "POST" },
    // { url: "get_activity_logs", type: "POST" },
    { url: "api/store/get_product_data", type: "POST" },
    { url: "api/store/get_product_group_list", type: "POST" },
    { url: "api/store/get_group_list_of_group", type: "POST" },
    { url: "api/store/get_product_group_data", type: "POST" },
    { url: "api/store/get_store_product_item_list", type: "POST" },
    { url: "api/store/get_specification_group", type: "POST" },
    { url: "api/store/weekly_earning", type: "POST" },
    { url: "api/store/get_payment_gateways", type: "POST" },
    { url: "admin/payment_gateway_list", type: "GET" },
    { url: "api/admin/history", type: "POST" },
    { url: "admin/get_earning", type: "POST" },
    { url: "admin/fetch_earning_detail", type: "POST" },
    { url: "admin/admin_list_orders", type: "POST" },
    { url: "admin/admin_fetch_order_detail", type: "POST" },
    { url: "admin/admin_list_deliveries", type: "POST" },
    { url: "admin/store_weekly_earning", type: "POST" },
    { url: "admin/provider_weekly_earning", type: "POST" },
    { url: "api/provider/weekly_earning", type: "POST" },
    { url: "admin/get_zone_detail", type: "POST" },
    { url: "admin/get_service_detail", type: "POST" },
    { url: "api/admin/get_image_setting", type: "POST" },
    { url: "admin/update_delivery", type: "POST" },
    { url: "admin/add_delivery_data", type: "POST" },
    { url: "admin/add_document_data", type: "POST" },
    { url: "admin/dashboard/order_detail", type: "POST" },
    { url: "api/store/find_nearest_provider_list", type: "POST" },
    { url: "admin/get_admin_dispatcher_order_list", type: "POST" },
    { url: "api/admin/delivery_list_search_sort", type: "POST" },
    { url: "api/admin/admin_requests_detail", type: "POST" },
    { url: "api/admin/get_delivery_list", type: "GET" },
]

const low_priority = [
    {url: "api/user/user_get_store_review_list", type: 'POST'},
    {url: "api/user/add_favourite_store", type: 'POST'},
    {url: "api/user/remove_favourite_store", type: 'POST'},
    {url: "api/user/show_invoice", type: 'POST'},
    {url: "api/user/user_like_dislike_store_review", type: 'POST'},
    {url: "api/admin/get_document_list", type: 'POST'},
    {url: "api/user/order_history_detail", type: 'POST'},
    {url: "api/admin/get_wallet_history", type: 'POST'},
    {url: "api/user/rating_to_provider", type: 'POST'},
    {url: "api/user/rating_to_store", type: 'POST'},
    {url: "api/user/get_favourite_store_list", type: 'POST'},
    {url: "admin/get_promo_code_list", type: 'POST'},
    {url: "api/store/get_store_promo", type: 'POST'},
    {url: "admin/get_promo_detail", type: 'POST'},
    {url: "api/user/logout", type: 'POST'}
]

module.exports = activity_logs = (request_data, response_data, next) => {
    "use strict";
    let test = public_image_route.some(substring=>request_data.url.includes(substring))
    if(!test){
        let priority_urls = []
        let weight = 0

        setting_detail.activity_log_priority.forEach(priority => {
            if(priority === 1){
                priority_urls = priority_urls.concat(high_priority)
                // weight = 1
                let url = request_data.url.split('/v3/')
                // console.log(url)
                let index = high_priority.findIndex(x => x.url === url[1])
                if (index !== -1) {
                    add_to_activity_logs(request_data, response_data, 1, high_priority[index])
                }
            }
             else if(priority === 2){
                priority_urls = priority_urls.concat(medium_priority)
                // weight = 1
                let url = request_data.url.split('/v3/')
                // console.log(url)
                let index = medium_priority.findIndex(x => x.url === url[1])
                if (index !== -1) {
                    add_to_activity_logs(request_data, response_data, 2, medium_priority[index])
                }
            } else if(priority === 3){
                priority_urls = priority_urls.concat(low_priority)
                // weight = 1
                let url = request_data.url.split('/v3/')
                // console.log(url)
                let index = low_priority.findIndex(x => x.url === url[1])
                if (index !== -1) {
                    add_to_activity_logs(request_data, response_data, 3, low_priority[index])
                }
            }
        });
        
        next()
    } else {
        next()
    }
}

const add_to_activity_logs = ((request_data, response_data, weight, url) => {
    let type = [];
    // console.log(weight) 
            if(request_data.headers['access-control-request-method']){
                type.push(request_data.headers['access-control-request-method'])
                // console.log(type)
                // console.log(weight)
                // console.log(typeof type)
            }
            const requestStart = Date.now();
            let oldJson = response_data.json;
            let request_body = request_data.body
            let success;
            let error_code = 0
            let test = "test"
            response_data.json = function (data) {
                if (data.success) {
                    success = true
                } else {
                    success = false
                    error_code = data.error_code
                }
                let caller_info = {
                    app_version: request_data.headers.app_version || '',
                    user: request_data.headers.storeid || request_data.headers.userid || request_data.headers.providerid,
                    os_orirentation: request_data.headers.os_orirentation || '',
                    model: request_data.headers.model || '',
                    os_version: request_data.headers.os_version || '',
                    app_code: request_data.headers.app_code || '',
                }
                const logData = new ActivityLogs({
                    timestamp: new Date().toUTCString(),
                    processingTime: Date.now() - requestStart,
                    name: url.url,
                    // rawHeaders,
                    // device,
                    caller_info,
                    type: url.type,
                    weight,
                    success,
                    error_code,
                    caller_type: request_data.headers.caller_type || request_data.headers.type,
                    param: JSON.parse(JSON.stringify(request_data.body)),
                    response_code: JSON.parse(JSON.stringify(data))
                });
                logData.save()
                oldJson.apply(response_data, arguments);
            }
        // }
})


