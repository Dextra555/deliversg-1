var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var sub_store = new schema({
    // STORE TYPE INFORMATION
    unique_id: Number,
    name: [{type: String,default:[]}],
    email: { type: String, default: "" },
    country_phone_code: { type: String, default: "" },
    phone: { type: String, default: "" },
    password: { type: String, default: "" },
    main_store_id: {type: schema.Types.ObjectId,default:null},
    is_approved: { type: Boolean, default: false },
	urls: {
        type: Array, default: [
                {
                    "url": "store/create_order",
                    "name": "Create Order",
                    "permission": 0
                },
                {
                    "url": "store/dispatcher",
                    "name": "Dispatcher",
                    "permission": 0
                },
                {
                    "url": "store/providers",
                    "name": "Deliverymans",
                    "permission": 0
                },
                {
                    "url": "store/service",
                    "name": "Delivery Prices",
                    "permission": 0
                },
                {
                    "url": "store/order",
                    "name": "Order",
                    "permission": 0
                },
                {
                    "url": "store/deliveries",
                    "name": "Deliveries",
                    "permission": 0
                },
                {
                    "url": "store/history",
                    "name": "History",
                    "permission": 0
                },
                {
                    "url": "store/group",
                    "name": "Group",
                    "permission": 0
                },
                {
                    "url": "store/product",
                    "name": "Product",
                    "permission": 0
                },
                {
                    "url": "store/promocode",
                    "name": "Promo Code",
                    "permission": 0
                },
                {
                    "url": "store/setting",
                    "name": "Setting",
                    "permission": 0
                },
                {
                    "url": "store/earning",
                    "name": "Earning",
                    "permission": 0
                },
                {
                    "url": "store/weekly_earning",
                    "name": "Weekly Earning",
                    "permission": 0
                }
        ]
    },
    
    // STORE LOGIN AND APP INFORMATION
    device_token: { type: String, default: "" },
    device_type: { type: String, default: "" },
    server_token: { type: String, default: "" },
  
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }

}, {
    strict: true,
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

sub_store.plugin(autoIncrement.plugin, { model: 'SubStore', field: 'unique_id', startAt: 1, incrementBy: 1 });
module.exports = mongoose.model('SubStore', sub_store);
