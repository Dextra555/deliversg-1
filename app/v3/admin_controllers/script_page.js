require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
let utils = require('../utils/utils');
let console = require('../utils/console');
const { response } = require('express');
let ScriptPage = require('mongoose').model('script_page')

exports.addScriptPage = async (request_data, response_data) => {
    let request_data_body = request_data.body
    let scriptPage = new ScriptPage({
        title: request_data_body.title,
        htmlData: request_data_body.html_data,
        src: request_data_body.src
    })
    let script = await scriptPage.save()
    if(!script){
        return response_data.json({
            success: false,
            error_code: SCRIPT_ERROR_CODE.SCRIPT_ADD_FAILED
        })
    }
    return response_data.json({
        success: true,
        message_code: SCRIPT_MESSAGE_CODE.SCRIPT_ADDED_SUCCESSFULLY,
        script
    })
}

exports.getScriptPage = async (request_data, response_data) => {
    let scripts = await ScriptPage.find({})
    if(!scripts){
        return response_data.json({
            success: false,
            error_code: SCRIPT_ERROR_CODE.SCRIPT_LIST_FAILED
        })
    }
    return response_data.json({
        success: true,
        message_code: SCRIPT_MESSAGE_CODE.SCRIPT_LIST_SUCCESSFULLY,
        scripts
    })
}

exports.deleteScriptPage = async (request_data, response_data) => {
    let script = await ScriptPage.deleteOne({_id: request_data.body._id})
    if(!script){
        return response_data.json({success: false, error_code: SCRIPT_ERROR_CODE.SCRIPT_DELETE_FAILED})
    }
    return response_data.json({success: true, message_code: SCRIPT_MESSAGE_CODE.SCRIPT_DELETE_SUCCESSFULLY})
}   

exports.updateScriptPage = async (request_data, response_data) => {
    let script = await ScriptPage.updateOne({_id: request_data.body._id}, request_data.body)
    if(!script){
        return response_data.json({success: false, error_code: SCRIPT_ERROR_CODE.SCRIPT_UPDATE_FAILED})
    }
    return response_data.json({success: true, message_code: SCRIPT_MESSAGE_CODE.SCRIPT_UPDATED_SUCCESSFULLY})
}