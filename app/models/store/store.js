var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var store = new schema({
    // STORE TYPE INFORMATION
    unique_id: Number,
    admin_type: Number,
    store_type: Number,
    customer_id: {type: String, default: ""},
    country_unique_id: Number,
    city_unique_id: Number,
    country_id: { type: schema.Types.ObjectId },
    city_id: { type: schema.Types.ObjectId },
    store_type_id: { type: schema.Types.ObjectId },
    franchise_id: { type: schema.Types.ObjectId ,default:null},
    store_delivery_id: { type: schema.Types.ObjectId },
    sub_category_id: [{type: schema.Types.ObjectId, default: []}],
    payment_intent_id: {type: String, default: ""},
    // STORE INFORMATION
    name: [{type: String,default:[]}],
    delivery_locations: {type: Array, index1: '2d', default: []},
    email: { type: String, default: "" },
    otp: { type: String, default: "" },
    country_phone_code: { type: String, default: "" },
    phone: { type: String, default: "" },
    social_ids: [{ type: String, default: "" }],
    password: { type: String, default: "" },
    address: { type: String, default: "" },
    cancellation_charge_apply_from: {type: Number,default: 5},
    cancellation_charge_apply_till: {type: Number,default: 7},
    firebase_token: {type: String, default: ''},
    uid:{type: String, default:''},
    location: {
        type: [Number],
        index: '2d'
    },
    image_url: { type: String, default: "" },
    theme_number: {type: Number, default: 1},

    // GENERAL SETTINGS FOR STORE AND ADMIN
    price_rating: { type: Number, default: 1 },
    is_store_busy: { type: Boolean, default: false },
    is_business: { type: Boolean, default: true },
    is_approved: { type: Boolean, default: false },
    is_edit_menu: { type: Boolean, default: true },
    is_edit_menu_price: { type: Boolean, default: true },
    is_edit_menu_image: { type: Boolean, default: true },

    is_email_verified: { type: Boolean, default: false },
    is_phone_number_verified: { type: Boolean, default: false },
    is_document_uploaded: { type: Boolean, default: false },

    // ORDER INFORMATION
    is_use_item_tax: { type: Boolean, default: false },
    item_tax: { type: Number, default: 0 },

    min_order_price: { type: Number, default: 0 },
    max_item_quantity_add_by_user: { type: Number, default: 0 },

    is_order_cancellation_charge_apply: { type: Boolean, default: false },
    order_cancellation_charge_for_above_order_price: { type: Number, default: 0 },
    order_cancellation_charge_type: { type: Number, default: 1 },
    order_cancellation_charge_value: { type: Number, default: 0 },

    is_taking_schedule_order: { type: Boolean, default: false },
    inform_schedule_order_before_min: { type: Number, default: 0 },
    schedule_order_create_after_minute: { type: Number, default: 0 },

    // DELIVERY INFORMATION
    is_ask_estimated_time_for_ready_order: { type: Boolean, default: false },
    is_provide_pickup_delivery: { type: Boolean, default: false },

    is_provide_delivery_anywhere: { type: Boolean, default: true },
    delivery_radius: { type: Number, default: 0 },

    is_store_pay_delivery_fees: { type: Boolean, default: false },
    free_delivery_for_above_order_price: { type: Number, default: 0 },
    free_delivery_within_radius: { type: Number, default: 0 },

    delivery_time: { type: Number, default: 30 },
    delivery_time_max: { type: Number, default: 45 },

    // RATE INFO
    user_rate: { type: Number, default: 0 },
    user_rate_count: { type: Number, default: 0 },
    provider_rate: { type: Number, default: 0 },
    provider_rate_count: { type: Number, default: 0 },

    // INFORMATION FOR ADMIN
    admin_profit_mode_on_store: { type: Number, default: 1 },
    admin_profit_value_on_store: { type: Number, default: 0 },
    is_visible: { type: Boolean, default: true },

    // PAYMENT INFO
    last_transfer_date: { type: Date },
    wallet: { type: Number, default: 0 },
    wallet_currency_code: { type: String, default: "" },
    selected_bank_id: { type: schema.Types.ObjectId },
    bank_id: { type: String, default: '' },
    account_id: { type: String, default: '' },

    is_store_can_add_provider: { type: Boolean, default: false },
    is_store_can_complete_order: { type: Boolean, default: false },

    // STORE TIMING
    store_time: {
        type: Array, default: [
            {
                "is_store_open": true,
                "is_store_open_full_time": true,
                "day": 0,
                "day_time": []
            },
            {
                "is_store_open": true,
                "is_store_open_full_time": true,
                "day": 1,
                "day_time": []
            },
            {
                "is_store_open": true,
                "is_store_open_full_time": true,
                "day": 2,
                "day_time": []
            },
            {
                "is_store_open": true,
                "is_store_open_full_time": true,
                "day": 3,
                "day_time": []
            },
            {
                "is_store_open": true,
                "is_store_open_full_time": true,
                "day": 4,
                "day_time": []
            },
            {
                "is_store_open": true,
                "is_store_open_full_time": true,
                "day": 5,
                "day_time": []
            }, {
                "is_store_open": true,
                "is_store_open_full_time": true,
                "day": 6,
                "day_time": []
            }
        ]
    },
    is_store_set_schedule_delivery_time: { type: Boolean, default: false },
    store_delivery_time: {
        type: Array, default: [
            {
                "is_store_open": true,
                "is_store_open_full_time": true,
                "day": 0,
                "day_time": []
            },
            {
                "is_store_open": true,
                "is_store_open_full_time": true,
                "day": 1,
                "day_time": []
            },
            {
                "is_store_open": true,
                "is_store_open_full_time": true,
                "day": 2,
                "day_time": []
            },
            {
                "is_store_open": true,
                "is_store_open_full_time": true,
                "day": 3,
                "day_time": []
            },
            {
                "is_store_open": true,
                "is_store_open_full_time": true,
                "day": 4,
                "day_time": []
            },
            {
                "is_store_open": true,
                "is_store_open_full_time": true,
                "day": 5,
                "day_time": []
            }, {
                "is_store_open": true,
                "is_store_open_full_time": true,
                "day": 6,
                "day_time": []
            }
        ]
    },
    // STORE OTHER DETAILS
    website_url: { type: String, default: "" },
    slogan: { type: String, default: "" },
    branchio_url: { type: String, default: '' },
    offers: [{ type: String }],
    famous_products_tags: {type: Array,default:[]},
    languages_supported: {
        type: Array,
        default: [{
            "name": "English",
            "code": "en",
            "is_visible": true,
            "string_file_path": "./uploads/i18n/en.json"
        }]
    },


    comments: { type: String, default: "New Register" },
    referral_code: { type: String, default: "" },
    referred_by: { type: schema.Types.ObjectId },
    total_referrals: { type: Number, default: 0 },
    is_referral: { type: Boolean, default: false },
    surcharge: { type: Number, default: 0},

    // STORE LOGIN AND APP INFORMATION
    device_token: { type: String, default: "" },
    device_type: { type: String, default: "" },
    server_token: { type: String, default: "" },
    login_by: { type: String, default: "" },
    app_version: { type: String, default: "" },
    taxes: [{type: schema.Types.ObjectId}],
    is_tax_included: {type: Boolean, default: false},

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

store.index({ country_id: 1 }, { background: true });
store.index({ is_business: 1, city_id: 1 }, { background: true });
store.index({ email: 1 }, { background: true });
store.index({ phone: 1 }, { background: true });
store.index({ social_ids: 1 }, { background: true });
store.index({ referral_code: 1 }, { background: true });
store.index({ referred_by: 1 }, { background: true });
store.index({ admin_type: 1 }, { background: true });
store.index({ store_type: 1, city_id: 1, last_transferred_date: 1, account_id: 1, bank_id: 1 }, { background: true });
store.index({ _id: 1, is_approved: 1 }, { background: true });
store.index({ is_approved: 1, is_business: 1, is_visible: 1, city_id: 1, store_delivery_id: 1 }, { background: true });
store.index({ country_id: 1, city_id: 1, device_type: 1, device_token: 1 }, { background: true });
store.index( { name: "text" } )
store.plugin(autoIncrement.plugin, { model: 'store', field: 'unique_id', startAt: 1, incrementBy: 1 });
module.exports = mongoose.model('store', store);


/*

 unique_id - this field is autoincrement and unique id in Number
 admin_type - it's use for identify record like  Store , User , Provider etc ...
 store_type - it use when we have to check like present store is sub part of Main Store, by default it will set ADMIN type
 country_unique_id - country unique id for get information using number unique id field
 city_unique_id - city unique id for get information using number unique id field
 country_id - country unique id that auto generated by Mongodb and unique field with 24 lentgh
 city_id - city unique id that auto generated by Mongodb and unique field with 24 lentgh
 store_type_id - it's use when we have to check like present store is sub part of Main Store, by default it will set null
 store_delivery_id - use for identify like which delivery they are provide FOOD, GROCERY etc ...


 name - Store can set name
 email - Store email adddress
 country_phone_code - Phone code of Country under store register
 phone - Store phone number
 social_ids - if any store register using social , we store all social login ids here
 password - store password
 address - Store can set his address where Deliveryman or User can come for pickup order
 location - store latitude and longitude
 image_url - store logo url

 price_rating - it's one number field, store will set price rating like 1,2,3... 1 means price can set 0 - 9 , 2 means 0 - 99
 is_store_busy - if store many orders he decide to show user to busy status, he can just change status here
 is_business - if store closed permanently, then store will change status off here.
 is_approved - without approved store will not do anything, this status changed by Admin
 is_email_verified - this field use for if we want to check email is verified or not
 is_phone_number_verified - this field use for if we want to check phone is verified or not
 is_document_uploaded - this field use for if we want to check store documents are uploaded or not


 is_use_item_tax - if this field is TRUE then calculate tax amount that set in item
 item_tax - if above field (is_use_item_tax) is FALSE then calculate tax amount using this value, value is in percentage

 min_order_price - if store want set min order price he can do here, user can't order if order price is less then this
 max_item_quantity_add_by_user - user can enter one item max this time not more then this

 is_order_cancellation_charge_apply - store want to set cancellation charge if user cancel order after ready then he can do turn on here and set below information
 order_cancellation_charge_for_above_order_price - store want to set cancellation charge if order price is more then this
 order_cancellation_charge_type - cancellation charge type percentage or fix
 order_cancellation_charge_value - cancellation charge value

 is_taking_schedule_order - if store want he can accept schedule order he can change from
 inform_schedule_order_before_min - inform schedule order to store before schedule time
 schedule_order_create_after_minute - store set min time to order complete, For Example store set 100 min then user can order before 100 min


 is_ask_estimated_time_for_ready_order - If store can set this field is TRUE, at time accept order ask you total time for order ready and send delivery to providers, so provider can reach here that time.
 is_provide_pickup_delivery - if store can allowed to user pick order from store , here he can change status

 is_provide_delivery_anywhere - if store want to provider delivery in whole area then set true , if not then he can t radius of this area
 delivery_radius - if above field (is_provide_delivery_anywhere) false at that time store have to set radius here, in that radius store can provide delivery

 is_store_pay_delivery_fees - if store want to pay delivery fees then he can change status TRUE
 free_delivery_for_above_order_price - if above field (is_store_pay_delivery_fees) TRUE store can set min price of Free delivery
 free_delivery_within_radius - if above field (is_store_pay_delivery_fees) TRUE store can set radius in that provider free delivery

 delivery_time - set minimum time for order ready
 delivery_time_max - set max time for order ready


 user_rate - if user give to rate store, user average rate store here
 user_rate_count - total user rated to store
 provider_rate: if provider give to rate store, provider average rate store here
 provider_rate_count - total provider rated to store

 admin_profit_mode_on_store - ADMIN CAN SET PROFIT MODE FROM STORE HERE, FIELD USED IN ADMIN PANEL (PROFIT MODE - percentage , aboslute , per item)
 admin_profit_value_on_store - ADMIN CAN SET PROFIT VALUE THAT DEPEND ON ABOVE MODE
 is_visible - IF ADMIN DECIDE THAT STORE DON'T WANT TO SHOW IN USER APP BUT STORE CAN TAKE ORDER DIRECTLY OF THIRD PARTY , PHONE ETC...

 last_transfer_date - used this field in admin part when auto transfer days on in country settings
 wallet - store can add wallet amount, if admin want to do business payment in wallet, admin can settlement with this field
 wallet_currency_code - wallet unique currency code set come from country
 selected_bank_id - store can also add many bank details and he can select one for transaction and that id(unique id of mongodb) stored here
 bank_id - selected bank id that generated by stripe store here
 account_id - selected account id that generated by stripe store here

 store_time -  store can add whole weekly timing here , below info store day wise
 day - day unique id store here ( 0 - 6)
 is_store_open - if this field is true then store OPEN in that day, and set below details
 is_store_open_full_time -  it's means store open 24 Hours in that day only
 day_time - is_store_open_full_time is FALSE , store can set time slot and add here


 website_url - store website url if have
 slogan - if store have any slogan he can set here
 branchio_url - not used
 offers - if any offers running on store he can add here
 famous_products_tags - store can set TAGS, so user can search by TAGS
 comments - IF ADMIN WANT TO SET ANY COMMENT FOR STORE HE CAN SET HERE
 referral_code - store referral code set here, he can share with other store only
 is_referral - is store used refferal
 referred_by - refferal friend id store here
 total_referrals - how many store used his referral code that total count store here

 device_token - used for send push notification if store login in mobile
 device_type - if store login in mobile then store which type device (android , ios , web )
 server_token -  auto generated unique string
 login_by - store login by social or manual stored here
 app_version - which app version using store

 */
