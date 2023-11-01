const request = require('supertest')
const { admin, setupDatabaseForCity } = require('./fixtures/db')
const app = require('./fixtures/express')
beforeAll(setupDatabaseForCity)

test('Add New City', async () => {
    var country = await request(app)
        .get('/v3/admin/country_list')
        .expect(200);
    var country_id = country.body.countries[0]._id
        
    var response = await request(app)
        .post('/v3/admin/add_city_data')
        .send({
            "city_code": "GJ",
            "city_id": null,
            "city_lat": 23.022505,
            "city_lng": 72.5713621,
            "city_name": "Ahmedabad",
            "country_id": country_id,
            "is_ads_visible": false,
            "is_business": true,
            "is_cash_payment_mode": true,
            "is_check_provider_wallet_amount_for_received_cash_request": false,
            "is_other_payment_mode": true,
            "is_promo_apply": false,
            "is_provider_earning_add_in_wallet_on_cash_payment": false,
            "is_provider_earning_add_in_wallet_on_other_payment": false,
            "is_store_earning_add_in_wallet_on_cash_payment": false,
            "is_store_earning_add_in_wallet_on_other_payment": false,
            "provider_min_wallet_amount_for_received_cash_request": 0,
            "timezone": "[\"Asia/Calcutta\", \"Asia/Kolkata\"]",
            "deliveries_in_city": [
                "6174e07fd091ea27481466b9"
            ],
            "payment_gateway": [
                "586f7db95847c8704f537bd5"
            ],
            "city_zone": [],
            "city_locations": [],
            "city_radius": 0,
            "is_use_radius": false,
            "zone_business": false,
            "admin_id": admin._id,
            "server_token": admin.server_token
        })
        .expect(200)

    expect(response.body.success).toBe(true)
})

test('Get City List', async () => {
    var response = await request(app)
        .post('/v3/admin/city_list')
        .send({ "admin_id": admin._id, "server_token": admin.server_token })
        .expect(200)
    expect(response.body.success).toBe(true)
})

test('Update City', async () => {
    var response = await request(app)
        .post('/v3/admin/city_list')
        .send({ "admin_id": admin._id, "server_token": admin.server_token })
        .expect(200)
    var city_detail = response.body.cities[0];
    
    var response = await request(app)
        .post('/v3/admin/update_city')
        .send({
            "city_code": "GJ",
            "city_id": city_detail._id,
            "city_lat": 23.022505,
            "city_lng": 72.5713621,
            "city_name": "Ahmedabad",
            "country_id": city_detail.country_id,
            "is_ads_visible": false,
            "is_business": true,
            "is_cash_payment_mode": true,
            "is_check_provider_wallet_amount_for_received_cash_request": false,
            "is_other_payment_mode": true,
            "is_promo_apply": false,
            "is_provider_earning_add_in_wallet_on_cash_payment": false,
            "is_provider_earning_add_in_wallet_on_other_payment": false,
            "is_store_earning_add_in_wallet_on_cash_payment": false,
            "is_store_earning_add_in_wallet_on_other_payment": false,
            "provider_min_wallet_amount_for_received_cash_request": 0,
            "timezone": "[\"Asia/Calcutta\", \"Asia/Kolkata\"]",
            "deliveries_in_city": city_detail.deliveries_in_city,
            "payment_gateway": city_detail.payment_gateway,
            "city_zone": [],
            "city_locations": [],
            "city_radius": 0,
            "is_use_radius": false,
            "zone_business": false,
            "admin_id": admin._id,
            "server_token": admin.server_token
        })
        .expect(200)

    expect(response.body.success).toBe(true)
})