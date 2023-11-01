const request = require('supertest')
const { setupDatabaseForDocument, admin } = require('./fixtures/db')
const app = require('./fixtures/express')
beforeAll(setupDatabaseForDocument)

test('Add New Document', async () => {
    var country = await request(app)
        .get('/v3/admin/get_server_country_list')
        .expect(200)

    var country_detail = country.body.countries[0]

    var response = await request(app)
        .post('/v3/admin/add_document_data')
        .send({
            "country_id": country_detail._id,
            "document_for": 7,
            "document_name": "USER_DOCS1",
            "is_expired_date": true,
            "is_mandatory": true,
            "is_show": true,
            "is_unique_code": true,
            "admin_id": admin._id,
            "server_token": admin.server_token
        })
        .expect(200)

    expect(response.body.success).toBe(true)
})

test('Get Document List', async () => {
    var response = await request(app)
        .post('/v3/admin/document_list')
        .send({
            "page": 1,
            "search_field": "document_name",
            "search_value": "",
            "sort_document": -1,
            "sort_field": "unique_id",
            "query": {},
            "admin_id": admin._id,
            "server_token": admin.server_token
        })
        .expect(200)

    expect(response.body.success).toBe(true)
})