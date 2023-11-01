const { response } = require('express');

require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
require('../utils/push_code');
var Tax = require('mongoose').model('tax')
var Country = require('mongoose').model('country')

exports.add_tax = function(request_data, response_data){
    Country.findById(request_data.body.country_id).then(country => {
        var tax_name = request_data.body.tax_name.map(function(x) { return x.toUpperCase()})
        Tax.find({tax_name: tax_name[0], country_id: request_data.body.country_id}).then(res => {
            if(res.length === 0){
                var new_tax = new Tax({
                    tax_name: tax_name,
                    tax: request_data.body.tax,
                    country_id: request_data.body.country_id,
                    is_tax_visible: request_data.body.is_tax_visible
                })
                new_tax.save().then(res_data => {
                    country.taxes.push(res_data._id)
                    country.save().then(() => {
                        response_data.json({ success: true, message: TAX_MESSAGE_CODE.TAX_ADDED_SUCCESSFULLY, res_data })
                    })
                }).catch(error => {
                    response_data.json({ success: false, error_code: TAX_ERROR_CODE.ADD_TAX_FAILED })
                })
            } else {
                response_data.json({success: false, error_code: TAX_ERROR_CODE.TAX_NAME_ALREADY_EXISTS})
            }
        })
    })
}

exports.edit_tax = function(request_data, response_data){
    
    Tax.findByIdAndUpdate(request_data.body._id, request_data.body).then(res_data => {
        response_data.json({success: true, message: TAX_MESSAGE_CODE.TAX_UPDATED_SUCCESSFULLY, res_data: request_data.body})
    }).catch(error => {
        response_data.json({success: false, error_code: TAX_ERROR_CODE.UPDATE_TAX_FAILED})
    })
}