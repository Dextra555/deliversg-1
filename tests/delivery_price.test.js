const request = require('supertest')
const {setupDatabaseForDeliveryPrice,admin} = require('./fixtures/db')
const app = require('./fixtures/express')
beforeAll(setupDatabaseForDeliveryPrice)

test('Add New Delivery Price',async ()=>{
    var country = await request(app)
        .get('/v3/admin/get_server_country_list')
        .expect(200)

    var country_detail = country.body.countries[0]

    var city = await request(app)
        .post('/v3/api/admin/get_city_lists')
        .send({
            "admin_id": admin._id,
            "server_token": admin.server_token,
            "country_id": country_detail._id
        })
        .expect(200)

    var city_detail = city.body.cities[0]

    var vehicle = await request(app)
        .post('/v3/api/admin/get_vehicle_list')
        .send({
            "city_id": city_detail._id,
            "is_business": 1,
            "admin_id": admin._id,
            "server_token": admin.server_token
        })
        .expect(200)

    var vehicle_detail = vehicle.body.vehicles[0]
    
    var response = await request(app)
        .post('/v3/admin/add_service_data')
        .send({
            "is_business": true,
            "is_default": false,
            "is_use_distance_calculation": false,
            "admin_profit_mode_on_delivery": 1,
            "admin_profit_value_on_delivery": "10",
            "base_price_distance": "10",
            "base_price": "10",
            "price_per_unit_distance": "10",
            "price_per_unit_time": "10",
            "service_tax": "10",
            "min_fare": "10",
            "country_id": country_detail._id,
            "city_id": city_detail._id,
            "delivery_type": 1,
            "vehicle_id": vehicle_detail._id,
            "delivery_price_setting": [],
            "admin_id": admin._id,
            "server_token": admin.server_token
        })
        .expect(200)
    
    expect(response.body.success).toBe(true)
})

test('Get Delivery Price List',async ()=>{
    var response = await request(app)
        .post('/v3/admin/service_list')
        .send({
            "page": 1,
            "search_field": "country_details.country_name",
            "search_value": "",
            "sort_field": "unique_id",
            "sort_service": -1,
            "admin_id": admin._id,
            "server_token": admin.server_token
        })
        .expect(200)
    
    expect(response.body.success).toBe(true)
})

test('Update Delivery Price',async ()=>{
    var delivery_price = await request(app)
        .post('/v3/admin/service_list')
        .send({
            "page": 1,
            "search_field": "country_details.country_name",
            "search_value": "",
            "sort_field": "unique_id",
            "sort_service": -1,
            "admin_id": admin._id,
            "server_token": admin.server_token
        })
        .expect(200)

    var delivery_price_details = delivery_price.body.service[0]

    var service_price = await request(app)
        .post('/v3/admin/get_service_detail')
        .send({
            "service_id": delivery_price_details._id,
            "admin_id": admin._id,
            "server_token": admin.server_token
        })
        .expect(200)

    var service_price_details = service_price.body.service

    var response = await request(app)
        .post('/v3/admin/update_service')
        .send({
            "is_business": service_price_details.is_business,
            "is_default": service_price_details.is_default,
            "is_use_distance_calculation": service_price_details.is_use_distance_calculation,
            "admin_profit_mode_on_delivery": service_price_details.admin_profit_mode_on_delivery,
            "admin_profit_value_on_delivery": service_price_details.admin_profit_value_on_delivery,
            "base_price_distance": service_price_details.base_price_distance,
            "base_price": service_price_details.base_price,
            "price_per_unit_distance": service_price_details.price_per_unit_distance,
            "price_per_unit_time": service_price_details.price_per_unit_time,
            "service_tax": service_price_details.service_tax,
            "min_fare": service_price_details.min_fare,
            "delivery_price_setting": service_price_details.delivery_price_setting,
            "service_id": service_price_details._id,
            "admin_id": admin._id,
            "server_token": admin.server_token
        })
        .expect(200)

    expect(response.body.success).toBe(true)
    
})