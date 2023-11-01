const request = require('supertest')
const { admin, setupDatabaseForAdvertise } = require('./fixtures/db')
const app = require('./fixtures/express')
beforeAll(setupDatabaseForAdvertise)

test('Add New Advertise', async () => {
    var country = await request(app)
        .get('/v3/admin/country_list')
        .expect(200);
    var country_id = country.body.countries[0]._id

    var city_id = "000000000000000000000000"
        
    var response = await request(app)
        .post('/v3/admin/add_advertise')
        .send({
            "country_id": country_id,
            "city_id": city_id,
            "ads_detail": "free",
            "ads_for": 1,
            "is_ads_visible": true,
            "is_ads_approve_by_admin": true,
            "is_ads_have_expire_date": false,
            "expiry_date": null,
            "is_ads_redirect_to_store": false,
            "store_id": null
        })
        .expect(200)
    
    expect(response.body.success).toBe(true)
})

test('Get Advertise List', async () => {
    var response = await request(app)
        .get('/v3/admin/advertise_list')
        .expect(200)
    
    expect(response.body.success).toBe(true)
})

test('Update Advertise', async () => {
    var advertise = await request(app)
        .get('/v3/admin/advertise_list')
        .expect(200)

    var advertise_detail = advertise.body.advertise[0]

    var response = await request(app)
        .post('/v3/admin/add_advertise')
        .send({
            "advertise_id": advertise_detail[0]._id,
            "country_id": advertise_detail[0].country_id,
            "city_id": advertise_detail[0].city_id,
            "ads_detail": "free",
            "ads_for": 1,
            "is_ads_visible": true,
            "is_ads_approve_by_admin": true,
            "is_ads_have_expire_date": false,
            "expiry_date": null,
            "is_ads_redirect_to_store": false,
            "store_id": null
        })
        .expect(200)

    expect(response.body.success).toBe(true)
})

test('Get Visible Advertise List', async () => {
    var response = await request(app)
        .post('/v3/admin/get_visible_advertise')
        .send({})
        .expect(200)
    
    expect(response.body.success).toBe(true)
})

test('Change Advertise Visibility', async () => {
    var advertise = await request(app)
        .get('/v3/admin/advertise_list')
        .expect(200)

    var advertise_detail = advertise.body.advertise[0]

    var response = await request(app)
        .post('/v3/admin/add_advertise')
        .send({
            "advertise_id": advertise_detail[0]._id,
            "is_ads_visible": true
        })
        .expect(200)

    expect(response.body.success).toBe(true)
})

test('Delete Advertise Visibility', async () => {
    var advertise = await request(app)
        .get('/v3/admin/advertise_list')
        .expect(200)

    var advertise_detail = advertise.body.advertise[0]

    var response = await request(app)
        .post('/v3/admin/delete_advertise')
        .send({ "advertise_id": advertise_detail[0]._id })
        .expect(200)

    expect(response.body.success).toBe(true)
})