require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
var utils = require('../../utils/utils');
const { response } = require('express');
let console = require('../../utils/console');
let infoSeo = require('mongoose').model('infoPageSeoTags')
let homeSeo = require('mongoose').model('homePageSeoTags')
let storeSeo = require('mongoose').model('storePageSeoTags')

exports.getSeoTags = async (request_data, response_data) => {
    try {
        let request_data_body = request_data.body
        let Table;
        switch (request_data_body.type) {
            case 1:  //Home Page
                Table = homeSeo
                break;
            case 2:  //Store Page
                Table = storeSeo
                break;
            case 3:  //Infopage
                Table = infoSeo;
                break;
        }

        let seoData = await Table.find({})
        if(seoData){
            return response_data.json({
                success: true,
                data: seoData
            })
        } else {
            return response_data.json({
                success: false
            })
        }
    } catch (error) {
        console.log(error)
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        })
    }
}

exports.updateSeoTags = async (request_data, response_data) => {
    try{
        let request_data_body = request_data.body
        let Table;
        let data = {}
        switch (Number(request_data_body.type)) {
            case 3:  //Info Page
                Table = infoSeo;
                break;
            case 1:  //Home Page
                Table = homeSeo
                break;
            case 2:  //Store Page
                Table = storeSeo
                break;
        }
        let tags = await Table.findOne({})
        if(tags){
            var image_file = request_data.files;
            if (image_file != undefined && image_file.length > 0) {
                if(request_data_body.ogTitle){
                    var image_name = tags._id + utils.generateServerToken(4);
                    var url = utils.getStoreImageFolderPath(FOLDER_NAME.SEO_OG_IMAGES) + image_name + FILE_EXTENSION.SEO_OG;
                    tags.ogImage = request_data.protocol + '://' + request_data.get('host') + "/" + url;
                    utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.SEO_OG, FOLDER_NAME.SEO_OG_IMAGES);
                    request_data_body.ogImage = tags.ogImage;
                }
                if(request_data_body.twitterCard){
                    var image_name = tags._id + utils.generateServerToken(4);
                    var url = utils.getStoreImageFolderPath(FOLDER_NAME.SEO_OG_IMAGES) + image_name + FILE_EXTENSION.SEO_OG;
                    tags.twitterImage = request_data.protocol + '://' + request_data.get('host') + "/" + url;
                    utils.storeImageToFolder(image_file[0].path, image_name + FILE_EXTENSION.SEO_OG, FOLDER_NAME.SEO_OG_IMAGES);
                    request_data_body.twitterImage = tags.twitterImage;
                }
            }
            let updatedTag = await Table.findByIdAndUpdate({ _id: tags._id }, request_data_body)
            if(updatedTag){
                response_data.json({
                    success: true,
                    message: SEO_MESSAGE_CODE.SEO_TAGS_UPDATED_SUCCESSFULLY
                })
            } else {
                response_data.json({
                    success: false,
                    error_code: SEO_TAG_ERROR_CODE.SEO_TAG_UPDATE_FAILED
                })    
            }
        } else {
            response_data.json({
                success: false,
                error_code: SEO_TAG_ERROR_CODE.SEO_TAG_UPDATE_FAILED
            })
        }
    } catch (error) {
        console.log(error)
        response_data.json({
            success: false,
            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
        })
    }
}