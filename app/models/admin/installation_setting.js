var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var installation_setting = new schema({
    android_user_app_gcm_key: {type: String, default: ""},
    android_provider_app_gcm_key: {type: String, default: ""},
    android_store_app_gcm_key: {type: String, default: ""},
    provider_bundle_id: {type: String, default: ""},
    user_bundle_id: {type: String, default: ""},
    store_bundle_id: {type: String, default: ""},
    key_id: {type: String, default: ""},
    team_id: {type: String, default: ""},
    user_certificate_mode: {type: String, default: ""},
    provider_certificate_mode: {type: String, default: ""},
    store_certificate_mode: {type: String, default: ""},
    ios_push_certificate_path: {type: String, default: ""},     
    android_user_app_google_key: {type: String, default: ""},
    android_provider_app_google_key: {type: String, default: ""},
    android_store_app_google_key: {type: String, default: ""},
    ios_user_app_google_key: {type: String, default: ""},
    ios_provider_app_google_key: {type: String, default: ""},
    ios_store_app_google_key: {type: String, default: ""},
    admin_panel_google_key: {type: String, default: ""},
    store_panel_google_key: {type: String, default: ""},
    branch_io_key: {type: String, default: ""},  
    android_user_app_version_code: {type: String, default: ""},
    is_android_user_app_open_update_dialog: {type: Boolean, default: false},
    is_android_user_app_force_update: {type: Boolean, default: false},
    android_provider_app_version_code: {type: String, default: ""},
    is_android_provider_app_open_update_dialog: {type: Boolean, default: false},
    is_android_provider_app_force_update: {type: Boolean, default: false},
    android_store_app_version_code: {type: String, default: ""},
    is_android_store_app_open_update_dialog: {type: Boolean, default: false},
    is_android_store_app_force_update: {type: Boolean, default: false},
    ios_user_app_version_code: {type: String, default: ""},
    is_ios_user_app_open_update_dialog: {type: Boolean, default: false},
    is_ios_user_app_force_update: {type: Boolean, default: false},
    ios_provider_app_version_code: {type: String, default: ""},
    is_ios_provider_app_open_update_dialog: {type: Boolean, default: false},
    is_ios_provider_app_force_update: {type: Boolean, default: false},
    ios_store_app_version_code: {type: String, default: ""},
    is_ios_store_app_open_update_dialog: {type: Boolean, default: false},
    is_ios_store_app_force_update: {type: Boolean, default: false},

    


});
installation_setting.plugin(autoIncrement.plugin, {model: 'installation_setting', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('installation_setting', installation_setting);