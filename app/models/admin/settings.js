var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var setting = new schema({
    default_search_radius: {type: Number, default: 0},
    provider_timeout: {type: Number, default: 0},
    store_timeout: {type: Number, default: 0},
    app_name: {type: String, default: ""},
    scheduled_request_pre_start_minute: {type: Number, default: 30},
    number_of_try_for_scheduled_request: {type: Number, default: 0},
    admin_name: {type: String, default: ""},
    is_apply_image_settings:{type: Boolean, default: true},
    is_allow_contactless_delivery:{type: Boolean, default: false},
    is_allow_pickup_order_verification:{type: Boolean, default: false},
    no_of_loop_for_send_request:{type: Number, default: 0},
    is_ask_time_when_accept_order:{type: Boolean, default: false},
    is_use_captcha: {type: Boolean, default: false},

    admin_base_url: {type: String, default: ""},
    user_base_url: {type: String, default: ""},
    store_base_url: {type: String, default: ""},

    access_key_id: {type: String, default: ""},
    secret_key_id: {type: String, default: ""},
    aws_bucket_name: {type: String, default: ""},
    is_use_aws_bucket: {type: Boolean, default: false},

    is_provider_earning_add_in_wallet_on_cash_payment: {type: Boolean, default: true},
    is_store_earning_add_in_wallet_on_cash_payment: {type: Boolean, default: true},
    is_provider_earning_add_in_wallet_on_other_payment: {type: Boolean, default: true},
    is_store_earning_add_in_wallet_on_other_payment: {type: Boolean, default: true},

    is_email_id_field_required_in_user_register: {type: Boolean, default: true},
    is_phone_field_required_in_user_register: {type: Boolean, default: true},
    is_email_id_field_required_in_provider_register: {type: Boolean, default: true},
    is_phone_field_required_in_provider_register: {type: Boolean, default: true},
    is_email_id_field_required_in_store_register: {type: Boolean, default: true},
    is_phone_field_required_in_store_register: {type: Boolean, default: true},

    is_confirmation_code_required_at_pickup_delivery: {type: Boolean, default: false},
    is_confirmation_code_required_at_complete_delivery: {type: Boolean, default: false},
    is_busy: {type: Boolean, default: false},
        
    activity_log_priority: {type: Array, default: []},

    admin_email: {type: String, default: ""},
    admin_phone_number: {type: String, default: ""},
    admin_contact_email: {type: String, default: ""},
    admin_contact_phone_number: {type: String, default: ""},
    admin_country: {type: String, default: ""},
    admin_currency_code: {type: String, default: ""},
    admin_currency: {type: String, default: ""},
    admin_time_zone: {type: String, default: ""},
    admin_panel_timezone: {type: String, default: ""},
    lang : {type: Array , default : [{
            "name" : "English",
            "code" : "en",
            "string_file_path" : "./uploads/i18n/en.json"
        }]},
    email: {type: String, default: ""},
    password: {type: String, default: ""},
    domain: {type: String, default: "gmail"},
    smtp_port: {type: String, default: ""},
    smtp_host: {type: String, default: ""},

    sms_gateway_id: {type: schema.Types.ObjectId},
    is_referral_to_user: {type: Boolean, default: false},
    is_referral_to_provider: {type: Boolean, default: false},
    is_referral_to_store: {type: Boolean, default: false},
    is_allow_user_to_give_tip: {type: Boolean, default: false},
    tip_type: {type: Number, default: 0},
    is_show_optional_field_in_user_register: {type: Boolean, default: false},
    is_show_optional_field_in_provider_register: {type: Boolean, default: false},
    is_show_optional_field_in_store_register: {type: Boolean, default: false},
    is_upload_user_documents: {type: Boolean, default: false},
    is_upload_provider_documents: {type: Boolean, default: false},
    is_upload_store_documents: {type: Boolean, default: false},
    is_sms_notification: {type: Boolean, default: false},
    is_mail_notification: {type: Boolean, default: false},
    is_push_notification: {type: Boolean, default: false},
    is_user_mail_verification: {type: Boolean, default: false},
    is_user_sms_verification: {type: Boolean, default: false},
    is_provider_mail_verification: {type: Boolean, default: false},
    is_provider_sms_verification: {type: Boolean, default: false},
    is_store_mail_verification: {type: Boolean, default: false},
    is_store_sms_verification: {type: Boolean, default: false},
    is_user_profile_picture_required: {type: Boolean, default: false},
    is_provider_profile_picture_required: {type: Boolean, default: false},
    is_store_profile_picture_required: {type: Boolean, default: false},
    is_user_login_by_email: {type: Boolean, default: false},
    is_user_login_by_phone: {type: Boolean, default: false},
    is_user_login_by_social: {type: Boolean, default: false},
    is_provider_login_by_email: {type: Boolean, default: false},
    is_provider_login_by_phone: {type: Boolean, default: false},
    is_provider_login_by_social: {type: Boolean, default: false},
    is_store_login_by_email: {type: Boolean, default: false},
    is_store_login_by_phone: {type: Boolean, default: false},
    is_store_login_by_social: {type: Boolean, default: false},
    is_allow_bring_change_option: {type: Boolean, default: false},
    type: {type: String, default: ""},
    project_id: {type: String, default: ""},
    private_key_id: {type: String, default: ""},
    private_key: {type: String, default: ""},
    client_email: {type: String, default: ""},
    client_id: {type: String, default: ""},
    auth_uri: {type: String, default: ""},
    token_uri: {type: String, default: ""},
    auth_provider_x509_cert_url: {type: String, default: ""},
    client_x509_cert_url: {type: String, default: ""},
    databaseURL: {type: String, default: ""},
    minimum_phone_number_length: { type: Number, default: 8},
    maximum_phone_number_length: { type: Number, default: 12},
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
setting.plugin(autoIncrement.plugin, {model: 'setting', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('setting', setting);