require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
const { response } = require('express');
var mongoose = require('mongoose')
var fs = require("fs");
var TableSettings = require('mongoose').model('table_settings');
var TableBooking = require('mongoose').model('table_booking');
var Table = require('mongoose').model('table');
var Store = require('mongoose').model('store');
var utils = require('../../utils/utils');


exports.fetch_table_booking_basic_setting = function (request_data, response_data) {
    var store_id = request_data.body.store_id || "";

    if(store_id === "" && store_id === null){
        response_data.json({
            success: false,
            error_code: STORE_ERROR_CODE.SETTING_DETAILS_NOT_FOUND
        })
    }else{
        var aggreagate = [
            {
                $match: {
                    store_id: {$eq: mongoose.Types.ObjectId(store_id)}
                }
            },
            {
                $lookup: {
                    from: "tables",
                    localField: "store_id",
                    foreignField: "store_id",
                    as: "table_list"
                },
            }
            // {
            //     $match: {
            //         "table_list.is_bussiness": {$eq: true}
            //     }
            // }
        ]
        TableSettings.aggregate(aggreagate).then((table_settings_data)=>{
            // TableSettings.findOne({ store_id: store_id }).then((table_settings_data) => {
                console.log(table_settings_data.length)
                if (table_settings_data.length > 0) {
                    response_data.json({
                        success: true,
                        data: table_settings_data[0]
                    })
                } else {
                    new TableSettings({ store_id: mongoose.Types.ObjectId(store_id) }).save((err, data) => {
                        if(!err){
                            response_data.json({ success: true, data })
                        } else {
                            console.log(err)
                            response_data.json({
                                success: false,
                                error_code: STORE_ERROR_CODE.SETTING_DETAILS_NOT_FOUND
                            })
                        }
                    }, error => {
                        if (error) {
                            response_data.json({
                                success: false,
                                error_code: STORE_ERROR_CODE.SETTING_DETAILS_ALREADY_ADDED
                            })
                        }
                        response_data.json({
                            success: false,
                            error_code: STORE_ERROR_CODE.SETTING_DETAILS_NOT_FOUND
                        })
                    })
                }
            // }).catch(error => {
            //     response_data.json({
            //         success: false,
            //         error_code: STORE_ERROR_CODE.SETTING_DETAILS_NOT_FOUND
            //     })
            // })
        },error=>{
            console.log(error)
            response_data.json({
                success: false,
                error_code: STORE_ERROR_CODE.SETTING_DETAILS_NOT_FOUND
            })
        })
    }
    
}


exports.update_table_booking_basic_setting = function (request_data, response_data) {
    TableSettings.findOneAndUpdate({_id:request_data.body._id},request_data.body).then((table_settings_data)=>{
        response_data.json({
            success: true,
            message: STORE_ERROR_CODE.SETTING_DETAILS_ALREADY_ADDED
        })
    })
}


exports.update_table_booking_time_setting = function (request_data, response_data) {
    utils.check_unique_details(request_data, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var store_id = request_data_body.store_id;
            var old_password = request_data_body.old_password;
            var social_id = request_data_body.social_id;

            if (social_id == undefined || social_id == null || social_id == "") {
                social_id = null;
            }

            if (old_password == undefined || old_password == null || old_password == "") {
                old_password = "";
            } else {
                old_password = utils.encryptPassword(old_password);
            }

            var store = response.store;
            if (social_id == null && old_password != "" && old_password != store.password) {

                response_data.json({success: false, error_code: STORE_ERROR_CODE.INVALID_PASSWORD});

            } else if (social_id != null && store.social_ids.indexOf(social_id) < 0) {

                response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_NOT_REGISTER_WITH_SOCIAL});

            } else
            {
                TableSettings.findOne({store_id:store_id}).then((table_settings_data)=>{
                    if(table_settings_data){
                        TableSettings.findOneAndUpdate({store_id: store_id}, {$set:{booking_time:request_data.body.booking_time}}).then((res_data) => {
                            if (res_data)
                            {
                                response_data.json({
                                    success: true,
                                    message: STORE_MESSAGE_CODE.UPDATE_SUCCESSFULLY,
                                    res_data: res_data
        
                                });
                            } else
                            {
                                response_data.json({success: false, error_code: STORE_ERROR_CODE.UPDATE_FAILED});
                            }
        
                        }, (error) => {
                            console.log(error)
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }else{

                    }
                })
                

            }
                
        } else {
            response_data.json(response);
        }
    });
};


exports.list_table = function (request_data, response_data) {
    var store_id = request_data.body.store_id || "";

    if(store_id === "" && store_id === null){
        response_data.json({
            success: false,
            error_code: STORE_ERROR_CODE.SETTING_DETAILS_NOT_FOUND
        })
    }else{
        Table.find({store_id:store_id}).then((tables)=>{
            if(tables){
                response_data.json({
                    success: true,
                    data:tables
                })                
            }else{
                response_data.json({
                    success: true,
                    data:[]
                })     
            }
        },error=>{
            response_data.json({
                success: false,
                error_code: STORE_ERROR_CODE.SETTING_DETAILS_NOT_FOUND
            })
        })
    }
}


exports.add_table = async function (request_data, response_data) {
    let store_id = request_data.body.store_id || "";
    if(store_id === "" && store_id === null){
        response_data.json({
            success: false,
            error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND
        })
    }else{
        await Table.findOne({$and:[{table_no:request_data.body.table_no},{store_id:mongoose.Types.ObjectId(store_id)}]}).then(async (data) =>{
            if(data == null){
                await Store.findById(store_id).then(async (res_data)=>{
                    let table = new Table(request_data.body);
                    table.store_id = mongoose.Types.ObjectId(store_id);
                    // let image_file = request_data.files;
                    
                    // if (image_file != undefined && image_file.length > 0) {
                    //     let image_name = table._id + utils.generateServerToken(4);
                    //     let url = utils.getStoreImageFolderPath(FOLDER_NAME.TABLE_IMAGES) + image_name + FILE_EXTENSION.PRODUCT;
                    //     table.table_qrcode = url;
                    //     utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.PRODUCT, FOLDER_NAME.TABLE_IMAGES);
        
                    // }
                    table.save().then(table => {
                        let image_url = ''
                        utils.generateQRCode(request_data.body, table._id, (data) => {
                            if(data){
                                console.log(data)
                                image_url = data.image_url
                                table.table_qrcode = image_url
                                table.table_token = data.token
                                table.save(() => {
                                    response_data.json({
                                        success: true,
                                        message: STORE_MESSAGE_CODE.TABLE_ADDED_SUCCESSFULLY,
                                        data: table
                                    })
                                })
                            } else {
                                response_data({
                                    success: false,
                                    error_code: STORE_ERROR_CODE.TABLE_ADD_FAILED
                                })
                            }
                        })
                    }).catch(error => {
                        console.log(error)
                        response_data.json({
                            success: false,
                            error_code: STORE_ERROR_CODE.TABLE_ADD_FAILED
                        })
                    });
                },error=>{
                    response_data.json({
                        success: false,
                        error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND
                    })
                })
            }else{
                response_data.json({
                    success: false,
                    error_code: STORE_ERROR_CODE.TABLE_ALREADY_EXISTS
                })
            }
        })
    }
}


exports.update_table = function (request_data, response_data) {
    var store_id = request_data.body.store_id || "";
    if (store_id === "" && store_id === null) {
        response_data.json({
            success: false,
            error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND
        })
    } else {
        Table.findOne({ $and: [{ table_no: request_data.body.table_no }, { store_id: mongoose.Types.ObjectId(store_id) }] }).then(data => {
            var image_file = request_data.files;
            // if(data === null || request_data.body.table_no.toString() !== data.table_no.toString() || (image_file != undefined && image_file.length > 0)){
            Table.findByIdAndUpdate(request_data.body._id, request_data.body).then(table => {
                if (table) {
                    // var image_name = table._id + utils.generateServerToken(4);
                    // var url = utils.getStoreImageFolderPath(FOLDER_NAME.TABLE_IMAGES) + image_name + FILE_EXTENSION.PRODUCT;

                    // table.table_qrcode = url;
                    // utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.PRODUCT, FOLDER_NAME.TABLE_IMAGES);
                    table.save().then(() => {
                        response_data.json({
                            success: true,
                            message: STORE_MESSAGE_CODE.TABLE_ADDED_SUCCESSFULLY,
                            data: table
                        }).catch(error => {
                            console.log(error)
                            response_data.json({
                                success: true,
                                data: table,
                                message: STORE_MESSAGE_CODE.TABLE_ADDED_SUCCESSFULLY
                            })
                        })
                        // })
                    }).catch((error) => {
                        response_data({
                            success: false,
                            error_code: STORE_ERROR_CODE.TABLE_EDIT_FAILED
                        })
                    });
                } else {
                    response_data.json({
                        success: false,
                        error_code: STORE_ERROR_CODE.TABLE_NOT_FOUND
                    })
                }
            }, error => {
                console.log(error)
                response_data.json({
                    success: false,
                    error_code: STORE_ERROR_CODE.TABLE_ALREADY_EXISTS
                })
            })
            // }else{
            //     response_data.json({
            //         success: false,
            //         error_code: STORE_ERROR_CODE.TABLE_ALREADY_EXISTS
            //     })
            // }
        })

    }
}

exports.change_qrcode = async function(request_data, response_data){
    await utils.generateQRCode(request_data.body, request_data.body._id, async (data) => {
        console.log(data)
        console.log(request_data.body._id)
        if(data){
            let table = await Table.findById(request_data.body._id)
            if(table){
                if (table.table_qrcode && fs.existsSync('./uploads/' + table.table_qrcode)) {
                    fs.unlinkSync('./uploads/' + table.table_qrcode);
                }
                console.log(data)
                table.table_token = data.token
                image_url = data
                table.table_qrcode = data.image_url
                table.save().then(table_data => {
                    response_data.json({
                        success: true,
                        table_data,
                        message: STORE_MESSAGE_CODE.QRCODE_UPDATED_SUCCESSFULLY
                    })
                })
            } else {
                console.log('error 1')
                response_data.json({
                    success: false,
                    error_code: STORE_ERROR_CODE.QRCODE_UPDATE_FAILED
                })
            }
        } else {
            console.log('error 2')
            response_data.json({
                success: false,
                error_code: STORE_ERROR_CODE.QRCODE_UPDATE_FAILED
            })
        }
        // table.table_qrcode = image_url
        // table.save(() => {
        //     response_data.json({
        //         success: true,
        //         message: STORE_MESSAGE_CODE.TABLE_ADDED_SUCCESSFULLY,
        //         data: table
        //     })
        // })
    })
}

exports.fetchTableDetails = async function(request_data, response_data){
    let request_data_body = request_data.body
    let table = await Table.findById(request_data_body.table_id)
    if(table){
        response_data.json({
            success: true,
            message: STORE_MESSAGE_CODE.TABLE_GET_SUCCESSFULLY,
            table
        })
    } else {
        response_data.json({
            success: false,
            error_code: STORE_ERROR_CODE.TABLE_NOT_FOUND
        })
    }
}