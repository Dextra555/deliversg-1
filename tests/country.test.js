const request = require('supertest')
const { setupDatabaseForCountry, admin } = require('./fixtures/db')
const app = require('./fixtures/express')
beforeAll(setupDatabaseForCountry)

test('Add New Country', async () => {
    var response = await request(app)
        .post('/v3/admin/add_country_data')
        .send({
            country_code: "IN",
            country_code_2: "IND",
            country_id: null,
            country_name: "India",
            country_phone_code: "+91",
            country_timezone: ["Asia/Calcutta", "Asia/Kolkata"],
            currency_code: "INR",
            currency_rate: 1,
            currency_sign: "₹",
            is_ads_visible: true,
            is_auto_transfer_for_deliveryman: false,
            is_auto_transfer_for_store: false,
            is_business: true,
            is_distance_unit_mile: false,
            is_referral_user: true,
            is_referral_provider: true,
            is_referral_store: true,
            maximum_phone_number_length: 12,
            minimum_phone_number_length: 8,
            no_of_provider_use_referral: 0,
            no_of_store_use_referral: 0,
            no_of_user_use_referral: 0,
            referral_bonus_to_provider: 0,
            referral_bonus_to_provider_friend: 0,
            referral_bonus_to_store: 0,
            referral_bonus_to_store_friend: 0,
            referral_bonus_to_user: 0,
            referral_bonus_to_user_friend: 0,
            auto_transfer_day_for_deliveryman: 0,
            auto_transfer_day_for_store: 0,
            taxes: [],
            admin_id: admin._id,
            server_token: admin.server_token
        })
        .expect(200)

    expect(response.body.success).toBe(true)
})

test('Get Country List', async () => {
    var response = await request(app)
        .get('/v3/admin/country_list')
        .expect(200)

    expect(response.body.success).toBe(true)
})

test('Update Country', async () => {
    var country = await request(app)
        .get('/v3/admin/country_list')
        .expect(200);

    var country_detail = country.body.countries[0]
    var response = await request(app)
        .post('/v3/admin/update_country')
        .send({
            "country_code": "IN",
            "country_code_2": "IND",
            "country_id": country_detail._id,
            "country_name": "India",
            "country_phone_code": "+91",
            "country_timezone": [
                "[\"Asia/Calcutta\", \"Asia/Kolkata\"]"
            ],
            "currency_code": "INR",
            "currency_rate": 1,
            "currency_sign": "₹",
            "is_ads_visible": true,
            "is_auto_transfer_for_deliveryman": true,
            "is_auto_transfer_for_store": true,
            "is_business": true,
            "is_distance_unit_mile": false,
            "is_referral_user": true,
            "is_referral_provider": true,
            "is_referral_store": true,
            "maximum_phone_number_length": 12,
            "minimum_phone_number_length": 8,
            "no_of_provider_use_referral": 20,
            "no_of_store_use_referral": 20,
            "no_of_user_use_referral": 20,
            "referral_bonus_to_provider": 10,
            "referral_bonus_to_provider_friend": 10,
            "referral_bonus_to_store": 10,
            "referral_bonus_to_store_friend": 10,
            "referral_bonus_to_user": 10,
            "referral_bonus_to_user_friend": 10,
            "auto_transfer_day_for_deliveryman": 1,
            "auto_transfer_day_for_store": 1,
            "taxes": [],
            "admin_id": admin._id,
            "server_token": admin.server_token
        })
        .expect(200)

    expect(response.body.success).toBe(true)
})