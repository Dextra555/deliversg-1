const request = require('supertest')
const {delivery_type,setupDatabaseForDelivery,admin} = require('./fixtures/db')
const app = require('./fixtures/express')
beforeAll(setupDatabaseForDelivery)

test('Add New Delivery',async ()=>{
    var response = await request(app)
        .post('/v3/admin/add_delivery_data')
        .field("delivery_name",'["Supermarket"]')
        .field("description",'["Supermarket"]')
        .field("is_business","false")
        .field("is_store_can_create_group","false")
        .field("store_can_edit_order","false")
        .field("delivery_type","1")
        .field("famous_products_tags","[]")
        .field("deleted_product_tag_array","[]")
        .field("sequence_number","11")
        .set("Content-Type", "multipart/form-data")
        .expect(200)
    
    expect(response.body.success).toBe(true)
})

test('Get Delivery List',async ()=>{
    var response = await request(app)
        .get('/v3/admin/delivery_list')
        .expect(200)
    
    expect(response.body.success).toBe(true)
})

test('Update Delivery',async ()=>{
    var delivery = await request(app)
        .get('/v3/admin/delivery_list')
        .expect(200)
    var delivery_detail = delivery.body.deliveries[0]

    var response = await request(app)
        .post('/v3/admin/update_delivery')
        .field('delivery_name', '["Supermarket"]')
        .field('description', '["Supermarket"]')
        .field('is_business', delivery_detail.is_business)
        .field('is_store_can_create_group', delivery_detail.is_store_can_create_group)
        .field('is_store_can_edit_order', delivery_detail.is_store_can_edit_order)
        .field('delivery_type', delivery_detail.delivery_type)
        .field('famous_products_tags', delivery_detail.famous_products_tags)
        .field('deleted_product_tag_array', '[]')
        .field('sequence_number', delivery_detail.sequence_number)
        .field('delivery_id', delivery_detail._id)
        .field('is_provide_table_booking', delivery_detail.is_provide_table_booking)
        .expect(200)

    expect(response.body.success).toBe(true)
    
})