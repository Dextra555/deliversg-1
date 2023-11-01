const request = require('supertest')
const {setupDatabaseForVehicle,admin} = require('./fixtures/db')
const app = require('./fixtures/express')
beforeAll(setupDatabaseForVehicle)

test('Add New Vehicle',async ()=>{
    var response = await request(app)
        .post('/v3/admin/add_vehicle_data')
        .field("vehicle_name", 'Scooter')
        .field("description", 'Scooter')
        .field("is_business", true)
        .set("Content-Type", "multipart/form-data")
        .expect(200)
    
    expect(response.body.success).toBe(true)
})

test('Get Vehicle List',async ()=>{
    var response = await request(app)
        .get('/v3/admin/vehicle_list')
        .expect(200)
    
    expect(response.body.success).toBe(true)
})

test('Update Delivery',async ()=>{
    var delivery = await request(app)
        .get('/v3/admin/vehicle_list')
        .expect(200)
    var vehicle_detail = delivery.body.vehicles[0]

    var response = await request(app)
        .post('/v3/admin/update_vehicle')
        .field("vehicle_id", vehicle_detail._id)
        .field("vehicle_name", vehicle_detail.vehicle_name)
        .field("description", vehicle_detail.description)
        .field("is_business", true)
        .expect(200)

    expect(response.body.success).toBe(true)
    
})