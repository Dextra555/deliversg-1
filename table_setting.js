var mongoose = require('mongoose');
mongoose = require('./config/mongoose')
db = mongoose()

var TableSettings = require('mongoose').model('table_settings');
var Store = require('mongoose').model('store');


Store.find({}).then(stores => {
    stores.forEach(store => {
        TableSettings.find({store_id: store._id}).then(table_settings => {
            if (table_settings.length === 0){
                new TableSettings({
                    store_id: store._id
                }).save().then(table_setting => {
                    console.log(table_setting.store_id)
                }).catch(error => {
                    console.log(error)
                })
            }
        })
    })
})