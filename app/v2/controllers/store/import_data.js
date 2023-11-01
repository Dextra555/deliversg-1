require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
const utils = require('../../utils/utils');
const xlsx = require('node-xlsx');
const path = require('path');
const Product = require('mongoose').model('product');
const Item = require('mongoose').model('item');
const Specification_group = require('mongoose').model('specification_group');
const Specification = require('mongoose').model('specification');
var Store = require('mongoose').model('store');
var SubStore = require('mongoose').model('SubStore');
const fs = require('fs');
const Excel = require("exceljs");
var mongoose = require('mongoose');

exports.import_item_image = async function (request_data, response_data) {
	try {
		utils.check_unique_details(request_data, [], async function (response) {
			if (response.success) {
				let db_items = await Item.find({store_id :response.store._id},{image_url:1});
				let array = [];
				for (let i = 0; i < db_items.length; i++) {
					var image_length = db_items[i].image_url.length;
					var item = db_items[i];
					if(image_length){
						for (let j = 0; j < image_length; j++) {
							array.push(item.image_url[j].split("/")[3]);
						}
					}
				}
				let index = -1;
				request_data.files.forEach(function(file){
					index = array.indexOf(file.originalname)
					if(index != -1){
						var path = 'store_image/'+response.store.unique_id+'/';
						// var url =  path + utils.getImageFolderName(FOLDER_NAME.STORE_ITEMS) + file.originalname;
						utils.storeImageForStoreFolder(file.path, file.originalname, FOLDER_NAME.STORE_ITEMS, path);
					}else{
						fs.unlinkSync(file.path);
					}
				});
				response_data.json({success: true})
			}else{
				response_data.json(response);
			}
		});
	} catch (error) {
		console.log(error)
	}
};

exports.export_modifier_product = async function (request_data, response_data) {
	let store_detail = null;
	let store_id = null;
	if(request_data.query.type == 0){
		store_detail = await Store.findOne({_id:request_data.query.store_id});
		if(!store_detail){
			return response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND});
		}else{
			store_id = store_detail._id;
			if (request_data.query.token !== null && store_detail.server_token !== request_data.query.token) {
                return response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
            }
		}
	}else{
		sub_store_detail = await SubStore.findOne({_id:request_data.query.store_id});
		if(!sub_store_detail){
			return response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND});
		}else{
			if (request_data.query.token !== null && sub_store_detail.server_token !== request_data.query.token) {
                return response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
            }
		}
		store_detail = await Store.findOne({_id:sub_store_detail.main_store_id});
		if(!store_detail){
			return response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND});
		}else{
			store_id = store_detail._id;
		}
	}
	/*utils.check_request_params(request_data.body, [], async function (response) {
		if (response.success) {*/
			try{
				var Schema = mongoose.Types.ObjectId;
				var lookup = {
	                $lookup:
	                {
	                    from: "specifications",
	                    localField: "_id",
	                    foreignField: "specification_group_id",
	                    as: "specifications"
	                }
	            };
	            var condition = { "$match": { 'store_id': { $eq: Schema(store_id) } } };
				let specification_group = await Specification_group.aggregate([condition,lookup]);
				exceptionData = [];
				for (let i = 0; i < specification_group.length; i++) {
					if(specification_group[i].specifications.length == 0){
						exceptionData.push({
							spg_command:'',
							spg_id:specification_group[i].unique_id,
							spg_name:specification_group[i].name.join(","),
							sp_command:'',
							sp_id:'',
							sp_name:'',
							sp_sequence_number:'',
							sp_price:''
						})
					}else{
						for (let j = 0; j < specification_group[i].specifications.length; j++) {
							if(j == 0){
								exceptionData.push({
									spg_command:'',
									spg_id:specification_group[i].unique_id,
									spg_name:specification_group[i].name.join(","),
									sp_command:'',
									sp_id:specification_group[i].specifications[j].unique_id,
									sp_name:specification_group[i].specifications[j].name.join(","),
									sp_sequence_number:specification_group[i].specifications[j].sequence_number,
									sp_price:specification_group[i].specifications[j].price
								})
							}else{
								exceptionData.push({
									spg_command:'',
									spg_id:'',
									spg_name:'',
									sp_command:'',
									sp_id:specification_group[i].specifications[j].unique_id,
									sp_name:specification_group[i].specifications[j].name.join(","),
									sp_sequence_number:specification_group[i].specifications[j].sequence_number,
									sp_price:specification_group[i].specifications[j].price
								})
							}
			            }
		            }
	            }
	            let fileName = 'modifier.xlsx';
	            let languages = [];
	            store_detail.languages_supported.forEach(function(data){
	            	languages.push(data.code.toUpperCase());
	            })
	            languages = '('+languages.join(',')+')'
				let workbook = await createModifierExcelFile(exceptionData,fileName,'modifier',languages);

				response_data.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
	            response_data.setHeader("Content-Disposition", "attachment; filename=" + fileName);
	            workbook.xlsx.write(response_data)
	                .then(function (data) {
	                    response_data.end();
	                    // console.log('File write done........');
	                });
	            return;
            } catch (error) {
		        response_data.json({success: false,error_code: ERROR_CODE.SOMETHING_WENT_WRONG, error_message: error.message})
		    }  
		/*}else{
			response_data.json(response);
		}
	})*/
}
async function createModifierExcelFile(data, fileName, caption,languages) {
    var workbook = new Excel.Workbook();
    var worksheet = workbook.addWorksheet(caption);
    worksheet.mergeCells('A1:C1');
    worksheet.getCell('A1').value = 'Modifier Group';
    worksheet.getCell('A1:C1').alignment = { horizontal:'center'} ;
    worksheet.mergeCells('D1:H1');
    worksheet.getCell('D1').value = 'Modifier';
    worksheet.getCell('D1:H1').alignment = { horizontal:'center'} ;
    worksheet.getRow(1).font = {
        bold: true
    }
    worksheet.getRow(2).values = ['command', 'id', 'name '+languages, 'command', 'id', 'name '+languages, 'sequence no', 'price'];
    worksheet.getRow(2).font = {
        bold: true
    }
    worksheet.columns = [
        { key: "spg_command", width: 10 },
        { key: "spg_id", width: 10 },
        { key: "spg_name", width: 20 },
        { key: "sp_command", width: 10 },
        { key: "sp_id", width: 10 },
        { key: "sp_name", width: 20 },
        { key: "sp_sequence_number", width: 10 },
        { key: "sp_price", width: 10 }
    ];
    for (let i = 0; i < data.length; i++) {
        worksheet.addRow({
            spg_command: data[i].spg_command,
            spg_id: data[i].spg_id,
            spg_name: data[i].spg_name,
            sp_command: data[i].sp_command,
            sp_id: data[i].sp_id,
            sp_name: data[i].sp_name,
            sp_sequence_number: data[i].sp_sequence_number,
            sp_price: data[i].sp_price
        });
    }

    return workbook;
}
exports.export_item_product = async function (request_data, response_data) {
	let store_detail = null;
	let store_id = null;
	if(request_data.query.type == 0){
		store_detail = await Store.findOne({_id:request_data.query.store_id});
		if(!store_detail){
			return response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND});
		}else{
			store_id = store_detail._id;
			if (request_data.query.token !== null && store_detail.server_token !== request_data.query.token) {
                return response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
            }
		}
	}else{
		sub_store_detail = await SubStore.findOne({_id:request_data.query.store_id});
		if(!sub_store_detail){
			return response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND});
		}else{
			if (request_data.query.token !== null && sub_store_detail.server_token !== request_data.query.token) {
                return response_data.json({success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN});
            }
		}
		store_detail = await Store.findOne({_id:sub_store_detail.main_store_id});
		if(!store_detail){
			return response_data.json({success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND});
		}else{
			store_id = store_detail._id;
		}
	}
	/*utils.check_request_params(request_data.query, [], async function (response) {
		if (response.success) {*/
			try{
				var Schema = mongoose.Types.ObjectId;
				var lookup = {
	                $lookup:
	                {
	                    from: "items",
	                    localField: "_id",
	                    foreignField: "product_id",
	                    as: "items"
	                }
	            };
	            var condition = { "$match": { 'store_id': { $eq: Schema(store_id) } } };
				let products = await Product.aggregate([condition,lookup]);
				exceptionData = [];
				let product_id = '';
				let product_name = '';
				let product_sequence_number = '';
				let item_id = '';
				let item_name = '';
				let item_detail = '';
				let item_price = '';
				let item_tax = '';
				let item_sequence_number = '';
				let item_images = '';
				let spg_command = '';
				let spg_id = '';
				let sp_price = '';
				let sp_is_default_selected = '';

				for (let i = 0; i < products.length; i++) {
					product_id = products[i].unique_id;
					product_name = products[i].name.join(',');
					product_sequence_number = products[i].sequence_number;
					if(products[i].items.length == 0){
						exceptionData.push({
							product_command:'',
							product_id:product_id,
							product_name:product_name,
							product_sequence_number:product_sequence_number,
							item_command:'',
							item_id:'',
							item_name:'',
							item_detail:'',
							item_price:'',
							item_tax:'',
							item_sequence_number:'',
							item_images:'',
							spg_command:'',
							spg_id:'',
							spg_sequence_number:'',
							spg_range:'',
							spg_max_range:'',
							sp_command:'',
							sp_id:'',
							sp_price:'',
							sp_is_default_selected:'',
						})
					}else{
						for (let j = 0; j < products[i].items.length; j++) {
							if(j == 1){
								product_id = '';
								product_name = '';
								product_sequence_number = '';
							}
							item_id = products[i].items[j].unique_id;
							item_name = products[i].items[j].name.join(',');
							item_detail = products[i].items[j].details.join(',');
							item_price = products[i].items[j].price;
							item_tax = products[i].items[j].tax;
							item_sequence_number = products[i].items[j].sequence_number;
							for (let img_idx = 0; img_idx < products[i].items[j].image_url.length; img_idx++) {
								if(products[i].items[j].image_url[img_idx]){
									products[i].items[j].image_url[img_idx] = products[i].items[j].image_url[img_idx].split("/")[3];
								}
								/*if(products[i].items[j].image_url.length > 0){
									products[i].items[j].image_url = products[i].items[j].image_url.join(',');
								}*/
							}
							item_images = products[i].items[j].image_url.join(',');
							
							if(products[i].items[j].specifications.length == 0){
								exceptionData.push({
									product_command:'',
									product_id:product_id,
									product_name:product_name,
									product_sequence_number:product_sequence_number,
									item_command:'',
									item_id:item_id,
									item_name:item_name,
									item_detail:item_detail,
									item_price:item_price,
									item_tax:item_tax,
									item_sequence_number:item_sequence_number,
									item_images:item_images,
									spg_command:'',
									spg_id:'',
									spg_sequence_number:'',
									spg_range:'',
									spg_max_range:'',
									sp_command:'',
									sp_id:'',
									sp_price:'',
									sp_is_default_selected:'',
								})
							}else{
								for (let k = 0; k < products[i].items[j].specifications.length; k++) {
									if(k == 1){
										product_id = '';
										product_name = '';
										product_sequence_number = '';
										item_id = '';
										item_name = '';
										item_detail = '';
										item_price = '';
										item_tax = '';
										item_sequence_number = '';
										item_images = '';
									}
									spg_id = products[i].items[j].specifications[k].unique_id;
									spg_sequence_number = products[i].items[j].specifications[k].sequence_number;
									spg_range = products[i].items[j].specifications[k].range;
									spg_max_range = products[i].items[j].specifications[k].max_range;
									if(products[i].items[j].specifications[k].list.length == 0){
										exceptionData.push({
											product_command:'',
											product_id:product_id,
											product_name:product_name,
											product_sequence_number:product_sequence_number,
											item_command:'',
											item_id:item_id,
											item_name:item_name,
											item_detail:item_detail,
											item_price:item_price,
											item_tax:item_tax,
											item_sequence_number:item_sequence_number,
											item_images:item_images,
											spg_command:'',
											spg_id:spg_id,
											spg_sequence_number:spg_sequence_number,
											spg_range:spg_range,
											spg_max_range:spg_max_range,
											sp_command:'',
											sp_id:'',
											sp_price:'',
											sp_is_default_selected:'',
										})
								    }else{
								    	for (let l = 0; l < products[i].items[j].specifications[k].list.length; l++) {
								    		if(l == 1){
								    			product_id = '';
												product_name = '';
												product_sequence_number = '';
												item_id = '';
												item_name = '';
												item_detail = '';
												item_price = '';
												item_tax = '';
												item_sequence_number = '';
												item_images = '';
								    			spg_id = '';
												spg_sequence_number = '';
												spg_range = '';
												spg_max_range = '';
								    		}
											exceptionData.push({
												product_command:'',
												product_id:product_id,
												product_name:product_name,
												product_sequence_number:product_sequence_number,
												item_command:'',
												item_id:item_id,
												item_name:item_name,
												item_detail:item_detail,
												item_price:item_price,
												item_tax:item_tax,
												item_sequence_number:item_sequence_number,
												item_images:item_images,
												spg_command:'',
												spg_id:spg_id,
												spg_sequence_number:spg_sequence_number,
												spg_range:spg_range,
												spg_max_range:spg_max_range,
												sp_command:'',
												sp_id:products[i].items[j].specifications[k].list[l].unique_id,
												sp_price:products[i].items[j].specifications[k].list[l].price,
												sp_is_default_selected:products[i].items[j].specifications[k].list[l].is_default_selected,
											})	
								        }
								    }
						        }
					        }
				        }
				    }
	            }
				//return response_data.json({success: exceptionData})
	            let fileName = 'items.xlsx';
	            let languages = [];
	            store_detail.languages_supported.forEach(function(data){
	            	languages.push(data.code.toUpperCase());
	            })
	            languages = '('+languages.join(',')+')'
				let workbook = await createItemExcelFile(exceptionData,fileName,'items',languages);
				response_data.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
	            response_data.setHeader("Content-Disposition", "attachment; filename=" + fileName);
	            workbook.xlsx.write(response_data)
	                .then(function (data) {
	                    response_data.end();
	                    // console.log('File write done........');
	                });
	            return;
            } catch (error) {
		        response_data.json({success: false,error_code: ERROR_CODE.SOMETHING_WENT_WRONG, error_message: error.message})
		    }  
		/*}else{
			response_data.json(response);
		}
	})*/
}
async function createItemExcelFile(data, fileName, caption,languages) {
    var workbook = new Excel.Workbook();
    var worksheet = workbook.addWorksheet(caption);
    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = 'Subcategory';
    worksheet.getCell('A1:D1').alignment = { horizontal:'center'} ;
    worksheet.mergeCells('E1:L1');
    worksheet.getCell('E1').value = 'Item';
    worksheet.getCell('E1:L1').alignment = { horizontal:'center'} ;
    worksheet.mergeCells('M1:Q1');
    worksheet.getCell('M1').value = 'Modifier Group';
    worksheet.getCell('M1:Q1').alignment = { horizontal:'center'} ;
    worksheet.mergeCells('R1:U1');
    worksheet.getCell('R1').value = 'Modifier';
    worksheet.getCell('R1:U1').alignment = { horizontal:'center'} ;
    worksheet.getRow(1).font = {
        bold: true
    }
    worksheet.getRow(2).values = ['command', 'id', 'name '+languages,'sequence no', 'command', 'id', 'name '+languages,'details '+languages, 'price', 'tax', 'sequence no', 'images', 'command', 'id', 'sequence no', 'range', 'max range', 'command', 'id', 'price', 'default selected'];
    worksheet.getRow(2).font = {
        bold: true
    }
    worksheet.columns = [
        { key: "product_command", width: 10 },
        { key: "product_id", width: 10 },
        { key: "product_name", width: 20 },
        { key: "product_sequence_number", width: 10 },
        { key: "item_command", width: 10 },
        { key: "item_id", width: 10 },
        { key: "item_name", width: 20 },
        { key: "item_detail", width: 20 },
        { key: "item_price", width: 10 },
        { key: "item_tax", width: 10 },
        { key: "item_sequence_number", width: 10 },
        { key: "item_images", width: 20 },
        { key: "spg_command", width: 10 },
        { key: "spg_id", width: 10 },
        { key: "spg_sequence_number", width: 10 },
        { key: "spg_range", width: 10 },
        { key: "spg_max_range", width: 10 },
        { key: "sp_command", width: 10 },
        { key: "sp_id", width: 10 },
        { key: "sp_price", width: 10 },
        { key: "sp_is_default_selected", width: 10 }
    ];
    for (let i = 0; i < data.length; i++) {
        worksheet.addRow({
            product_command: data[i].product_command,
            product_id: data[i].product_id,
            product_name: data[i].product_name,
            product_sequence_number: data[i].product_sequence_number,
            item_command: data[i].item_command,
            item_id: data[i].item_id,
            item_name: data[i].item_name,
            item_detail: data[i].item_detail,
            item_price: data[i].item_price,
            item_tax: data[i].item_tax,
            item_sequence_number: data[i].item_sequence_number,
            item_images: data[i].item_images,
            spg_command: data[i].spg_command,
            spg_id: data[i].spg_id,
            spg_sequence_number: data[i].spg_sequence_number,
            spg_range: data[i].spg_range,
            spg_max_range: data[i].spg_max_range,
            sp_command: data[i].sp_command,
            sp_id: data[i].sp_id,
            sp_price: data[i].sp_price,
            sp_is_default_selected: data[i].sp_is_default_selected
        });
    }

    return workbook;
}
exports.import_modifier_product = async function (request_data, response_data) {
	utils.check_unique_details(request_data, [], async function (response) {
		if (response.success) {
			try{
				let obj = xlsx.parse(fs.readFileSync(request_data.files[0].path));
				
				let array_of_data = obj[0].data;
				let store_id = response.store?response.store._id:"5f3d022f6201e90bb0ef0aa7";
				let MODIFIER_GROUP_COMMAND = 0;
				let MODIFIER_GROUP_ID = 1;
				let MODIFIER_GROUP_NAME = 2;
				let MODIFIER_COMMAND = 3;
				let MODIFIER_ID = 4;
				let MODIFIER_NAME = 5;
				let MODIFIER_SEQUENCE_NUMBER = 6;
				let MODIFIER_PRICE = 7;
				let addCommand = "ADD";
			    let updateCommand = "UPDATE";
			    let blankCommand = "";
			    let spg = [];
			    let errors = [];
			    let spg_index = -1;
			    let sp_index = -1;
			    let db_spg = await Specification_group.find({store_id :store_id});
			    let db_sp = await Specification.find({store_id :store_id});
			    fs.unlinkSync(request_data.files[0].path);
			    for(let i= 2; i< array_of_data.length; i++){
			        if(array_of_data[i][MODIFIER_GROUP_NAME]){	
						
			        	spg.push({
			        		spg_command:array_of_data[i][MODIFIER_GROUP_COMMAND],
			                unique_id:array_of_data[i][MODIFIER_GROUP_ID],
							error:false,
			                name:array_of_data[i][MODIFIER_GROUP_NAME].split(','),			                
			                store_id:store_id,
			                list:[]
			            })
				    	if(array_of_data[i][MODIFIER_GROUP_COMMAND] == blankCommand){
				        	spg[spg.length -1].error = true;
				        }
			            spg_index = -1;		    	
				    	if(array_of_data[i][MODIFIER_GROUP_COMMAND] == updateCommand){
				    		spg_index = db_spg.findIndex(x=> String(x.unique_id) == String(array_of_data[i][MODIFIER_GROUP_ID]))
				    		if(spg_index == -1){
				    			//return response_data.json({success: false, error_message : "Modifier Group  Not found in line number " + (i+1) });
				    			errors.push("Modifier Group  Not found in line number " + (i+1));
				    			spg.splice(-1,1);
				    		}else{
								spg[spg.length -1].specification_group_id = db_spg[spg_index]._id;
				    			spg[spg.length -1].unique_id = db_spg[spg_index].unique_id;
				    		}
				    	}
				    	if(array_of_data[i][MODIFIER_NAME]){
					    	if(spg[spg.length -1].spg_command == addCommand){
			            		array_of_data[i][MODIFIER_COMMAND] = addCommand;
			            	}
			            	if(spg[spg.length -1].spg_command == updateCommand && array_of_data[i][MODIFIER_GROUP_COMMAND] == blankCommand){
				            	continue;
				           	}
				           	spg[spg.length -1].list.push({
				           		sp_command:array_of_data[i][MODIFIER_COMMAND],
				           		unique_id:array_of_data[i][MODIFIER_ID],
								error:false,
				           		name:array_of_data[i][MODIFIER_NAME].split(','),
				           		sequence_number:array_of_data[i][MODIFIER_SEQUENCE_NUMBER],
				           		price:array_of_data[i][MODIFIER_PRICE],
				           		store_id:store_id
				           	});
							if(array_of_data[i][MODIFIER_GROUP_COMMAND] == blankCommand){
								spg[spg.length -1].list[0].error = true;
							}
				           	sp_index = -1;		    	
					    	if(array_of_data[i][MODIFIER_COMMAND] == updateCommand){
					    		sp_index = db_sp.findIndex(x=> String(x.unique_id) == String(array_of_data[i][MODIFIER_ID]))
					    		if(sp_index == -1){
					    			//return response_data.json({success: false, error_message : "Modifier Not found in line number " + (i+1) });
					    			errors.push("Modifier Not found in line number " + (i+1));
					    			spg[spg.length -1].list.splice(-1,1);
					    		}else{
					    			spg[spg.length -1].list[0].specification_id = db_sp[sp_index]._id;
					    			spg[spg.length -1].list[0].unique_id = db_sp[sp_index].unique_id;
					    			//spg[spg.length -1].list[0].price = db_sp[sp_index].price;
					    		}
					    	}
				    	}
			        }else if(array_of_data[i][MODIFIER_NAME]){

			        	if(spg[spg.length -1].spg_command == addCommand){
			            	array_of_data[i][MODIFIER_COMMAND] = addCommand;
			           	}
				        spg[spg.length -1].list.push({
				         	sp_command:array_of_data[i][MODIFIER_COMMAND],
				         	unique_id:array_of_data[i][MODIFIER_ID],
							error:false,
				         	name:array_of_data[i][MODIFIER_NAME].split(','),
				         	sequence_number:array_of_data[i][MODIFIER_SEQUENCE_NUMBER],
				         	price:array_of_data[i][MODIFIER_PRICE],
				         	store_id:store_id
				        });
			           	if(spg[spg.length -1].spg_command == updateCommand && array_of_data[i][MODIFIER_GROUP_COMMAND] == blankCommand){
				           	spg[spg.length -1].list[spg[spg.length -1].list.length -1].error = true;
				        }
				        sp_index = -1;	
				        if(array_of_data[i][MODIFIER_COMMAND] == updateCommand){
				        	sp_index = db_sp.findIndex(x=> String(x.unique_id) == String(array_of_data[i][MODIFIER_ID]))
				        	if(sp_index == -1){
					    		//return response_data.json({success: false, error_message : "Modifier Not found in line number " + (i+1) });
				        		errors.push("Modifier Not found in line number " + (i+1));
				        		spg[spg.length -1].list.splice(-1,1);
					    	}else{
					    		spg[spg.length -1].list[spg[spg.length -1].list.length -1].specification_id = db_sp[sp_index]._id;
					    		spg[spg.length -1].list[spg[spg.length -1].list.length -1].unique_id = db_sp[sp_index].unique_id;
					    		//spg[spg.length -1].list[spg[spg.length -1].list.length -1].price = db_sp[sp_index].price;
					    	}
				        }
			        }
			    }
				//return response_data.json({success: false, spg : spg });
			    for(let i= 0; i< spg.length; i++){
					if(spg[i].error == false){
						if(spg[i].spg_command == addCommand){
							var spg_detail = await Specification_group.create({
								name:spg[i].name,
								//unique_id:spg[i].unique_id,
								store_id:store_id,
								is_visible_in_store:true
							});
							db_spg.push(spg_detail);
							spg_index = db_spg.length -1;
							spg[i].specification_group_id = db_spg[spg_index]._id;
						}else{
							Specification_group.findOneAndUpdate({_id: spg[i].specification_group_id}, {
								name: spg[i].name
							}, {new: true}).then((product_data) => {});
						}
						for(let j= 0; j< spg[i].list.length; j++){
							if(spg[i].list[j].error == false){
								sp_index = -1;
								if(spg[i].list[j].sp_command == addCommand){
									var sp_detail = await Specification.create({
										name:spg[i].list[j].name,
										//unique_id:spg[i].list[j].unique_id,
										price:spg[i].list[j].price,
										sequence_number:spg[i].list[j].sequence_number,
										specification_group_id:spg[i].specification_group_id,
										store_id:store_id,
										is_visible_in_store:true
									});
								}else{
									Specification.findOneAndUpdate({_id: spg[i].list[j].specification_id}, {
										name: spg[i].list[j].name,
										price: spg[i].list[j].price,
										sequence_number: spg[i].list[j].sequence_number,
									}, {new: true}).then((product_data) => {});
								}
							}
						}
			    	}
			    }
			    return response_data.json({success: true,errors:errors });
			} catch (error) {
		        response_data.json({success: false,error_code: ERROR_CODE.SOMETHING_WENT_WRONG, error_message: error.message})
		    }  
		}else{
			response_data.json(response);
		}
	});
}
exports.import_item_product = async function (request_data, response_data) {
	utils.check_unique_details(request_data, [], async function (response) {
		if (response.success) {
			try{
				let obj = xlsx.parse(fs.readFileSync(request_data.files[0].path));
				let array_of_data = obj[0].data;
			    let products = [];
			    let store_id = response.store?response.store._id:"5f3d022f6201e90bb0ef0aa7";
			    let unique_id = response.store?response.store.unique_id:"0";
			    let PRODUCT_COMMAND = 0;
			    let PRODUCT_ID = 1;
			    let PRODUCT_NAME = 2;
			    let PRODUCT_SEQUENCE_NUMBER = 3;
			    let ITEM_COMMAND = 4;
			    let ITEM_ID = 5;
			    let ITEM_NAME = 6;
			    let ITEM_DETAILS = 7;
			    let ITEM_PRICE = 8;
			    let ITEM_TAX = 9;
			    let ITEM_SEQUENCE_NUMBER = 10;
			    let ITEM_IMAGE = 11;
			    let SPECIFICATION_GROUP_COMMAND = 12;
			    let SPECIFICATION_GROUP_ID = 13;
			    let SPECIFICATION_GROUP_SEQUENCE_NUMBER = 14;
			    let SPECIFICATION_GROUP_RANGE = 15;
			    let SPECIFICATION_GROIP_MAX_RANGE = 16;
			    let SPECIFICATION_COMMAND = 17;
			    let SPECIFICATION_ID = 18;
			    let SPECIFICATION_PRICE = 19;
			    let SPECIFICATION_IS_DEFAULT = 20;
			    let is_required = true;
			    let type = 1;
			    let addCommand = "ADD";
			    let updateCommand = "UPDATE";
			    let blankCommand = "";
			    let splitCommand = ",";
			    let product_index = -1;
			    let item_index = -1;
			    let spg_index = -1;
			    let sp_index = -1;
			    let db_products = await Product.find({store_id :store_id});
			    let db_items = await Item.find({store_id :store_id});
			    let db_spg = await Specification_group.find({store_id :store_id});
			    let db_sp = await Specification.find({store_id :store_id});
			    let spec_id = null;
			    let spec_name = null;
			    let item_specifications = [];
			    let item_image_array = [];
			    let temp_image_array = [];
			    let errors = [];
			    
			    fs.unlinkSync(request_data.files[0].path);
			    for(let i= 2; i< array_of_data.length; i++){
			    	array_of_data[i][SPECIFICATION_IS_DEFAULT] = array_of_data[i][SPECIFICATION_IS_DEFAULT]?true:false
					item_image_array = [];
			    	if(array_of_data[i][ITEM_IMAGE] && array_of_data[i][ITEM_IMAGE] != ''){
			    		temp_image_array = array_of_data[i][ITEM_IMAGE].split(',');
			    		for(let j= 0; j< temp_image_array.length; j++){
			    			item_image_array.push('store_image/'+unique_id+'/store_items/'+temp_image_array[j]);
			    		}
			    	}

			        is_required = (array_of_data[i][SPECIFICATION_GROUP_RANGE] != 0)?true:false;
			        type = (array_of_data[i][SPECIFICATION_GROUP_RANGE] == 1 && array_of_data[i][SPECIFICATION_GROIP_MAX_RANGE] == 0)?1:2;
			        if(array_of_data[i][PRODUCT_NAME]){	
			            products.push({
			                unique_id:array_of_data[i][PRODUCT_ID],
			                product_command:array_of_data[i][PRODUCT_COMMAND],
			                error:false,
			                product_name:array_of_data[i][PRODUCT_NAME].split(','),
			                sequence_number:array_of_data[i][PRODUCT_SEQUENCE_NUMBER],
			                items:[]
			            })

			        	if(array_of_data[i][PRODUCT_COMMAND] == blankCommand){
			        		products[products.length -1].error = true;
			        	}
			        	product_index = -1;		    	
				    	if(array_of_data[i][PRODUCT_COMMAND] == updateCommand){
				    		product_index = db_products.findIndex(x=> String(x.unique_id) == String(array_of_data[i][PRODUCT_ID]))
				    		if(product_index == -1){
				    			//return response_data.json({success: false, error_message : "Subcategory  Not found in line number " + (i+1) });
				    			errors.push("Subcategory Not found in line number " + (i+1));
				    			products[products.length -1].error = true;
				    		}else{
				    			products[products.length -1].product_id = db_products[product_index]._id;
				    			Product.findOneAndUpdate({_id: db_products[product_index]._id}, {
				    			 	name: array_of_data[i][PRODUCT_NAME].split(','),
				    			 	sequence_number: array_of_data[i][PRODUCT_SEQUENCE_NUMBER]
				    			}, {new: true}).then((product_data) => {});
				    		}
				    	}
			            if(array_of_data[i][ITEM_NAME]){
			            	if(products[products.length -1].product_command == addCommand){
			            		array_of_data[i][ITEM_COMMAND] = addCommand;
			            	}
				            products[products.length -1].items.push({
				                item_name: array_of_data[i][ITEM_NAME].split(','),
				                unique_id: array_of_data[i][ITEM_ID],
				                item_command: array_of_data[i][ITEM_COMMAND],
				                item_details: array_of_data[i][ITEM_DETAILS].split(','),
				                item_price: array_of_data[i][ITEM_PRICE],
				                item_tax: array_of_data[i][ITEM_TAX],
				                sequence_number: array_of_data[i][ITEM_SEQUENCE_NUMBER],
				                item_image: item_image_array,
				                error:false,
				                specifications:[]
				            })
			            	if(products[products.length -1].product_command == updateCommand && array_of_data[i][ITEM_COMMAND] == blankCommand){
				            	products[products.length -1].items[0].error = true;
				           	}
				           	item_index = -1;		    	
					    	if(array_of_data[i][ITEM_COMMAND] == updateCommand){
					    		item_index = db_items.findIndex(x=> String(x.unique_id) == String(array_of_data[i][ITEM_ID]))
					    		if(item_index == -1){
					    			//return response_data.json({success: false, error_message : "Item Not found in line number " + (i+1) });
					    			errors.push("Item Not found in line number " + (i+1));
					    			products[products.length -1].items[0].error = true;
					    		}else{
					    			products[products.length -1].items[0].item_id = db_items[item_index]._id;
					    		}
					    	}
			            	//return response_data.json({success: true,products:products });
				        }
				        if(array_of_data[i][SPECIFICATION_GROUP_ID]){
				        	if(products[products.length -1].items[0].item_command == addCommand){
				            	array_of_data[i][SPECIFICATION_GROUP_COMMAND] = addCommand;
				           	}
				            products[products.length -1].items[0].specifications.push({
				                unique_id: array_of_data[i][SPECIFICATION_GROUP_ID],
				                specification_group_command: array_of_data[i][SPECIFICATION_GROUP_COMMAND],
				                sequence_number: array_of_data[i][SPECIFICATION_GROUP_SEQUENCE_NUMBER],
				                range: array_of_data[i][SPECIFICATION_GROUP_RANGE],
				                max_range: array_of_data[i][SPECIFICATION_GROIP_MAX_RANGE],
				                is_required: is_required,
				                error:false,
				                type: type,
				                list:[]
				            })
				           	if(products[products.length -1].items[0].item_command == updateCommand && array_of_data[i][SPECIFICATION_GROUP_COMMAND] == blankCommand){
				            	products[products.length -1].items[0].error = true;
				           	}
				           	spg_index = -1;		    	
					    	//if(array_of_data[i][SPECIFICATION_GROUP_COMMAND] == updateCommand){
					    		spg_index = db_spg.findIndex(x=> String(x.unique_id) == String(array_of_data[i][SPECIFICATION_GROUP_ID]))
					    		if(spg_index == -1){
					    			//return response_data.json({success: false, error_message : "Modifier group Not found in line number " + (i+1) });
					    			errors.push("Modifier group Not found in line number " + (i+1));
					    			products[products.length -1].items[0].error = true;
					    			products[products.length -1].items[0].specifications[0].error = true;
					    		}else{
					    			products[products.length -1].items[0].specifications[0].specification_group_id = db_spg[spg_index]._id;
					    			products[products.length -1].items[0].specifications[0].name = db_spg[spg_index].name;
					    		}
					    	//}
				        }
				        if(array_of_data[i][SPECIFICATION_ID]){

				        	if(products[products.length -1].items[0].specifications[0].specification_group_command == addCommand){
				            	array_of_data[i][SPECIFICATION_COMMAND] = addCommand;
				           	}
				            products[products.length -1].items[0].specifications[0].list.push({
				                unique_id: array_of_data[i][SPECIFICATION_ID],
				                specification_command: array_of_data[i][SPECIFICATION_COMMAND],
				                is_default_selected: array_of_data[i][SPECIFICATION_IS_DEFAULT],
				                specification_price: array_of_data[i][SPECIFICATION_PRICE]
				            })
				           	if(products[products.length -1].items[0].specifications[0].specification_group_command == updateCommand && array_of_data[i][SPECIFICATION_COMMAND] == blankCommand){
				            	products[products.length -1].items[0].error = true;
				           	}
				           	sp_index = -1;		    	
					    	//if(array_of_data[i][SPECIFICATION_COMMAND] == updateCommand){
					    		sp_index = db_sp.findIndex(x=> String(x.unique_id) == String(array_of_data[i][SPECIFICATION_ID]))
					    		if(sp_index == -1){
					    			//return response_data.json({success: false, error_message : "Modifier Not found in line number " + (i+1) });
					    			errors.push("Modifier Not found in line number " + (i+1));
					    			products[products.length -1].items[0].error = true;
					    		}else{
					    			products[products.length -1].items[0].specifications[0].list[0].specification_id =  db_sp[sp_index]._id;
					    			products[products.length -1].items[0].specifications[0].list[0].name = db_sp[sp_index].name;
					    		}
					    	//}
				        }
			        }else if(array_of_data[i][ITEM_NAME]){
			        	/*if(array_of_data[i][ITEM_COMMAND] == addCommand || array_of_data[i][ITEM_COMMAND] == updateCommand){
			        		continue;
			        	}*/
			        	if(array_of_data[i][ITEM_NAME]){
				        	if(products[products.length -1].product_command == addCommand){
				            	array_of_data[i][ITEM_COMMAND] = addCommand;
				           	}
				            products[products.length -1].items.push({
				                item_name: array_of_data[i][ITEM_NAME].split(','),
				                unique_id: array_of_data[i][ITEM_ID],
				                item_command: array_of_data[i][ITEM_COMMAND],
				                item_details: array_of_data[i][ITEM_DETAILS].split(','),
				                item_price: array_of_data[i][ITEM_PRICE],
				                item_tax: array_of_data[i][ITEM_TAX],
				                error:false,
				                sequence_number: array_of_data[i][ITEM_SEQUENCE_NUMBER],
				                item_image: item_image_array,
				                specifications:[]
				            })
				           	if(products[products.length -1].product_command == updateCommand && array_of_data[i][ITEM_COMMAND] == blankCommand){
				            	products[products.length -1].items[products[products.length -1].items.length -1].error = true;
				           	}
				           	item_index = -1;		    	
					    	if(array_of_data[i][ITEM_COMMAND] == updateCommand){
					    		item_index = db_items.findIndex(x=> String(x.unique_id) == String(array_of_data[i][ITEM_ID]))
					    		if(item_index == -1){
					    			//return response_data.json({success: false, error_message : "Item Not found in line number " + (i+1) });
					    			errors.push("Item Not found in line number " + (i+1));
					    			products[products.length -1].items[products[products.length -1].items.length -1].error = true;
					    		}else{
					    			products[products.length -1].items[products[products.length -1].items.length -1].item_id = db_items[item_index]._id;
					    		}
					    	}
				        }
				        if(array_of_data[i][SPECIFICATION_GROUP_ID]){
				        	if(products[products.length -1].items[products[products.length -1].items.length -1].item_command == addCommand){
				            	array_of_data[i][SPECIFICATION_GROUP_COMMAND] = addCommand;
				           	}
				            products[products.length -1].items[products[products.length -1].items.length -1].specifications.push({
				                unique_id: array_of_data[i][SPECIFICATION_GROUP_ID],
				                sequence_number: array_of_data[i][SPECIFICATION_GROUP_SEQUENCE_NUMBER],
				                specification_group_command: array_of_data[i][SPECIFICATION_GROUP_COMMAND],
				                range: array_of_data[i][SPECIFICATION_GROUP_RANGE],
				                max_range: array_of_data[i][SPECIFICATION_GROIP_MAX_RANGE],
				                is_required: is_required,
				                error:false,
				                type: type,
				                list:[]
				            })
				           	if(products[products.length -1].items[0].item_command == updateCommand && array_of_data[i][SPECIFICATION_GROUP_COMMAND] == blankCommand){
				            	products[products.length -1].items[products[products.length -1].items.length -1].error = true;
				            	products[products.length -1].items[products[products.length -1].items.length -1].specifications[0].error = true;
				           	}
				           	spg_index = -1;		    	
					    	//if(array_of_data[i][SPECIFICATION_GROUP_COMMAND] == updateCommand){
					    		spg_index = db_spg.findIndex(x=> String(x.unique_id) == String(array_of_data[i][SPECIFICATION_GROUP_ID]))
								if(spg_index == -1){
					    			//return response_data.json({success: false, error_message : "Modifier group Not found in line number " + (i+1) });
					    			errors.push("Modifier group Not found in line number " + (i+1));
					    			products[products.length -1].items[products[products.length -1].items.length -1].error = true;
					    		}else{
					    			products[products.length -1].items[products[products.length -1].items.length -1].specifications[0].specification_group_id = db_spg[spg_index]._id;
					    			products[products.length -1].items[products[products.length -1].items.length -1].specifications[0].name = db_spg[spg_index].name;
					    		}
					    	//}
				        }
				        if(array_of_data[i][SPECIFICATION_ID]){
				        	if(products[products.length -1].items[products[products.length -1].items.length -1].specifications[0].specification_group_command == addCommand){
				            	array_of_data[i][SPECIFICATION_COMMAND] = addCommand;
				           	}
				            products[products.length -1].items[products[products.length -1].items.length -1].specifications[0].list.push({
				                unique_id: array_of_data[i][SPECIFICATION_ID],
				                specification_command: array_of_data[i][SPECIFICATION_COMMAND],
				                is_default_selected: array_of_data[i][SPECIFICATION_IS_DEFAULT],
				                specification_price: array_of_data[i][SPECIFICATION_PRICE],
				            })
				           	if(products[products.length -1].items[products[products.length -1].items.length -1].specifications[0].specification_group_command == updateCommand && array_of_data[i][SPECIFICATION_COMMAND] == blankCommand){
				            	products[products.length -1].items[products[products.length -1].items.length -1].error = true;
				           	}
				           	sp_index = -1;		    	
					    	//if(array_of_data[i][SPECIFICATION_COMMAND] == updateCommand){
					    		sp_index = db_sp.findIndex(x=> String(x.unique_id) == String(array_of_data[i][SPECIFICATION_ID]))
					    		if(sp_index == -1){
					    			//return response_data.json({success: false, error_message : "Modifier Not found in line number " + (i+1) });
					    			errors.push("Modifier Not found in line number " + (i+1));
					    			products[products.length -1].items[products[products.length -1].items.length -1].error = true;
					    		}else{
					    			products[products.length -1].items[products[products.length -1].items.length -1].specifications[0].list[0].specification_id =  db_sp[sp_index]._id;
					    			products[products.length -1].items[products[products.length -1].items.length -1].specifications[0].list[0].name = db_sp[sp_index].name;
					    		}
					    	//}
				        }
			        }else if(array_of_data[i][SPECIFICATION_GROUP_ID]){
			        	/*if(array_of_data[i][SPECIFICATION_GROUP_COMMAND] == addCommand || array_of_data[i][SPECIFICATION_GROUP_COMMAND] == updateCommand){
			        		continue;
			        	}*/
			            if(array_of_data[i][SPECIFICATION_GROUP_ID]){
			            	if(products[products.length -1].items[products[products.length -1].items.length -1].item_command == addCommand){
				            	array_of_data[i][SPECIFICATION_GROUP_COMMAND] = addCommand;
				           	}
				            products[products.length -1].items[products[products.length -1].items.length -1].specifications.push({
				                unique_id: array_of_data[i][SPECIFICATION_GROUP_ID],
				                sequence_number: array_of_data[i][SPECIFICATION_GROUP_SEQUENCE_NUMBER],
				                range: array_of_data[i][SPECIFICATION_GROUP_RANGE],
				                specification_group_command: array_of_data[i][SPECIFICATION_GROUP_COMMAND],
				                max_range: array_of_data[i][SPECIFICATION_GROIP_MAX_RANGE],
				                is_required: is_required,
				                error:false,
				                type: type,
				                list:[]
				            })
				           	if(products[products.length -1].items[0].item_command == updateCommand && array_of_data[i][SPECIFICATION_GROUP_COMMAND] == blankCommand){
				            	products[products.length -1].items[products[products.length -1].items.length -1].error = true;
				            	products[products.length -1].items[products[products.length -1].items.length -1].specifications[products[products.length -1].items[products[products.length -1].items.length -1].specifications.length -1].error = true;
				           	}
				           	spg_index = -1;		    	
					    	//if(array_of_data[i][SPECIFICATION_GROUP_COMMAND] == updateCommand){
					    		spg_index = db_spg.findIndex(x=> String(x.unique_id) == String(array_of_data[i][SPECIFICATION_GROUP_ID]))
					    		if(spg_index == -1){
					    			//return response_data.json({success: false, error_message : "Modifier group Not found in line number " + (i+1) });
					    			errors.push("Modifier group Not found in line number " + (i+1));
					    			products[products.length -1].items[products[products.length -1].items.length -1].error = true;
					    		}else{
					    			products[products.length -1].items[products[products.length -1].items.length -1].specifications[products[products.length -1].items[products[products.length -1].items.length -1].specifications.length -1].specification_group_id = db_spg[spg_index]._id;
					    			products[products.length -1].items[products[products.length -1].items.length -1].specifications[products[products.length -1].items[products[products.length -1].items.length -1].specifications.length -1].name = db_spg[spg_index].name;
					    		}
					    	//}
				        }
				        if(array_of_data[i][SPECIFICATION_ID]){
				        	if(products[products.length -1].items[products[products.length -1].items.length -1].specifications[products[products.length -1].items[products[products.length -1].items.length -1].specifications.length -1].specification_group_command == addCommand){
				            	array_of_data[i][SPECIFICATION_COMMAND] = addCommand;
				           	}
			            	products[products.length -1].items[products[products.length -1].items.length -1].specifications[products[products.length -1].items[products[products.length -1].items.length -1].specifications.length -1].list.push({
			                 	unique_id: array_of_data[i][SPECIFICATION_ID],
			                 	specification_command: array_of_data[i][SPECIFICATION_COMMAND],
			                    is_default_selected: array_of_data[i][SPECIFICATION_IS_DEFAULT],
			                    specification_price: array_of_data[i][SPECIFICATION_PRICE],		               
			            	})
				           	if(products[products.length -1].items[products[products.length -1].items.length -1].specifications[products[products.length -1].items[products[products.length -1].items.length -1].specifications.length -1].specification_group_command == updateCommand && array_of_data[i][SPECIFICATION_COMMAND] == blankCommand){
				            	products[products.length -1].items[products[products.length -1].items.length -1].error = true;
				           	}
				           	sp_index = -1;		    	
					    	//if(array_of_data[i][SPECIFICATION_COMMAND] == updateCommand){
					    		sp_index = db_sp.findIndex(x=> String(x.unique_id) == String(array_of_data[i][SPECIFICATION_ID]))
					    		if(sp_index == -1){
					    			//return response_data.json({success: false, error_message : "Modifier Not found in line number " + (i+1) });
					    			errors.push("Modifier Not found in line number " + (i+1));
					    			products[products.length -1].items[products[products.length -1].items.length -1].error = true;
					    		}else{
					    			products[products.length -1].items[products[products.length -1].items.length -1].specifications[products[products.length -1].items[products[products.length -1].items.length -1].specifications.length -1].list[0].specification_id =  db_sp[sp_index]._id;
					    			products[products.length -1].items[products[products.length -1].items.length -1].specifications[products[products.length -1].items[products[products.length -1].items.length -1].specifications.length -1].list[0].name = db_sp[sp_index].name;
					    		}
					    	//}
			            }
			        }else if(array_of_data[i][SPECIFICATION_ID]){
			        	/*if(array_of_data[i][SPECIFICATION_COMMAND] == addCommand || array_of_data[i][SPECIFICATION_COMMAND] == updateCommand){
			        		continue;
			        	}*/
			        	spec_id = null;
			        	spec_name = null;
			        	sequence_number = null;
			        	if(products[products.length -1].items[products[products.length -1].items.length -1].specifications[products[products.length -1].items[products[products.length -1].items.length -1].specifications.length -1].specification_group_command == addCommand){
				            array_of_data[i][SPECIFICATION_COMMAND] = addCommand;
				        }
				        if(products[products.length -1].items[products[products.length -1].items.length -1].specifications[products[products.length -1].items[products[products.length -1].items.length -1].specifications.length -1].specification_group_command == updateCommand && array_of_data[i][SPECIFICATION_COMMAND] == blankCommand){
				            continue;
				        }
					   	//if(array_of_data[i][SPECIFICATION_COMMAND] == updateCommand){
					    	sp_index = db_sp.findIndex(x=> String(x.unique_id) == String(array_of_data[i][SPECIFICATION_ID]))
							if(sp_index == -1){
					    		//return response_data.json({success: false, error_message : "Modifier Not found in line number " + (i+1) });
					    		errors.push("Modifier Not found in line number " + (i+1));
					    		products[products.length -1].items[products[products.length -1].items.length -1].error = true;
					    	}else{
					    		spec_id =  db_sp[sp_index]._id;
					    		spec_name =  db_sp[sp_index].name;
					    	}
					   	//}
			            products[products.length -1].items[products[products.length -1].items.length -1].specifications[products[products.length -1].items[products[products.length -1].items.length -1].specifications.length -1].list.push({
			                specification_id: spec_id,
			                name: spec_name,
			                unique_id: array_of_data[i][SPECIFICATION_ID],
			                specification_command: array_of_data[i][SPECIFICATION_COMMAND],
			                is_default_selected: array_of_data[i][SPECIFICATION_IS_DEFAULT],
			                specification_price: array_of_data[i][SPECIFICATION_PRICE],
			            })
				       	sp_index = -1;		    	
			        }
			    }
			    /*let x = {};
			    x.products = products;
			    let rules = {
			    	"products": "required|array",
			    	"products.*.product_name": "required",
			    	"products.*.sequence_number": "required",
			    	"products.*.items": "array",
			    	"products.*.items.*.item_name": "required",
			    	//"products.*.items.*.item_details": "required",
			    	"products.*.items.*.item_price": "required|numeric",
			    	"products.*.items.*.item_tax": "required|numeric",
			    	"products.*.items.*.sequence_number": "required|numeric",
			    	"products.*.items.*.item_image": "required|array",
			    	"products.*.items.*.specifications": "array",
			    	"products.*.items.*.specifications.*.range": "required|numeric",
			    	"products.*.items.*.specifications.*.max_range": "required|numeric",
			    	"products.*.items.*.specifications.*.is_required": "required",
			    	"products.*.items.*.specifications.*.type": "required|numeric",
			    	"products.*.items.*.specifications.*.list": "required|array",
			    	"products.*.items.*.specifications.*.list.*.name": "required",
			    	"products.*.items.*.specifications.*.list.*.is_default_selected": "required",
			    	"products.*.items.*.specifications.*.list.*.specification_price": "required|numeric",
			    }
			    let validation = new Validator(x, rules);
			    if(validation.fails()){
			    	Object.keys(validation.errors.errors).forEach(function(error_string){
			    		error_string.split('.').forEach(function(keys){		    			
			    		})
			    	})
			        return response_data.json({success: false, error_code:  ERROR_CODE.PARAMETER_MISSING , error_description: validation.errors});
			    }*/
			    //return response_data.json({success: false, error_code:  ERROR_CODE.PARAMETER_MISSING , products: products});
			    let delete_image = true;
			    for(let i= 0; i< products.length; i++){
			    	if(products[i].error == false){
				    	if(products[i].product_command == addCommand){
				    		var product_detail = await Product.create({
				    			sequence_number:products[i].sequence_number,
				    			//unique_id:products[i].unique_id,
				    			name:products[i].product_name,
				    			store_id:store_id,
				    			is_visible_in_store:true
				    		});
				    		db_products.push(product_detail);
				    		product_index = db_products.length -1;
				    		products[i].product_id = db_products[product_index]._id;
				    	}
				    	for(let j= 0; j< products[i].items.length; j++){
				    		if(products[i].items[j].error == false && products[i].items[j].item_command !== undefined){
					    		item_index = -1;
					    		if(products[i].items[j].item_command == addCommand){
					    			item_specifications = [];
					    		}else{
					    			item_index = db_items.findIndex(x=> String(x._id) == String(products[i].items[j].item_id))
									item_specifications = db_items[item_index].specifications;
					    			db_items[item_index].image_url.forEach(function(image){
					    				delete_image = true;
						    			products[i].items[j].item_image.forEach(function(image1){
						    				if(image.includes(image1)){
						    					delete_image = false;;
						    				}
						    			})
						    			if(delete_image == true){
						    				utils.deleteStoreImageFromFolder(image, FOLDER_NAME.STORE_ITEMS);
						    			}
					    			})
					    			
					    		}
					    		for(let k= 0; k < products[i].items[j].specifications.length; k++){
					    			spg_index = -1;
					    			if(products[i].items[j].specifications[k].error == false){
						    			if(products[i].items[j].specifications[k].specification_group_command == addCommand){
							    			item_specifications.push({
									    		"_id" : products[i].items[j].specifications[k].specification_group_id,
									            "unique_id" : products[i].items[j].specifications[k].unique_id,
									            "sequence_number" : products[i].items[j].specifications[k].sequence_number,
									            "is_required" : products[i].items[j].specifications[k].is_required,
									            "range" : products[i].items[j].specifications[k].range,
									            "max_range" : products[i].items[j].specifications[k].max_range,
									            "name" : products[i].items[j].specifications[k].name,
									            "type" : products[i].items[j].specifications[k].type,
									            "list":[]
									    	});
									    	spg_index = item_specifications.length -1;
							    		}else{
							    			spg_index = item_specifications.findIndex(x=> String(x._id) == String(products[i].items[j].specifications[k].specification_group_id))
							    			item_specifications[spg_index] = {
									    		"_id" : products[i].items[j].specifications[k].specification_group_id,
									            "unique_id" : products[i].items[j].specifications[k].unique_id,
									            "sequence_number" : products[i].items[j].specifications[k].sequence_number,
									            "is_required" : products[i].items[j].specifications[k].is_required,
									            "range" : products[i].items[j].specifications[k].range,
									            "max_range" : products[i].items[j].specifications[k].max_range,
									            "name" : products[i].items[j].specifications[k].name,
									            "type" : products[i].items[j].specifications[k].type,
									            "list":[]
									    	};
							    		}
										for(let l= 0; l < products[i].items[j].specifications[k].list.length; l++){
								    		if(!products[i].items[j].specifications[k].list[l].error || products[i].items[j].specifications[k].list[l].error == false){
									    		sp_index = -1;
									    		if(products[i].items[j].specifications[k].list[l].specification_command == addCommand){
										    		item_specifications[k].list.push({
									                    "_id" : products[i].items[j].specifications[k].list[l].specification_id,
									                    "name" : products[i].items[j].specifications[k].list[l].name,
									                    "unique_id" : products[i].items[j].specifications[k].list[l].unique_id,
									                    "sequence_number" : products[i].items[j].specifications[k].list[l].sequence_number,
									                    "price" :  products[i].items[j].specifications[k].list[l].specification_price,
									                    "is_default_selected" : products[i].items[j].specifications[k].list[l].is_default_selected?products[i].items[j].specifications[k].list[l].is_default_selected:false,
									                    "is_user_selected" : false
									                });
										    	}else if(products[i].items[j].specifications[k].list[l].specification_command == updateCommand){
													// sp_index = item_specifications[spg_index].list.findIndex(x=> String(x._id) == String(products[i].items[j].specifications[k].list[l].specification_id))
													// if(sp_index != -1){
														item_specifications[spg_index].list[l] = {
															"_id" : products[i].items[j].specifications[k].list[l].specification_id,
															"name" : products[i].items[j].specifications[k].list[l].name,
															"unique_id" : products[i].items[j].specifications[k].list[l].unique_id,
															"sequence_number" : products[i].items[j].specifications[k].list[l].sequence_number || 0,
															"price" :  products[i].items[j].specifications[k].list[l].specification_price,
															"is_default_selected" : products[i].items[j].specifications[k].list[l].is_default_selected?products[i].items[j].specifications[k].list[l].is_default_selected:false,
															"is_user_selected" : false
														};		
													// }
										    	}
									    	}
								    	}
								    }
					    		}
					    		if(products[i].items[j].item_command == addCommand){
					    			var item_detail = await Item.create({
					    				product_id:products[i].product_id,
					    				//unique_id:products[i].items[j].unique_id,
					    				sequence_number:products[i].items[j].sequence_number,
					    				name:products[i].items[j].item_name,
					    				details:products[i].items[j].item_details,
					    				price:products[i].items[j].item_price,
					    				tax:products[i].items[j].item_tax,
					    				image_url:products[i].items[j].item_image,
					    				store_id:store_id,
					    				is_visible_in_store:true,
					    				specifications:item_specifications
					    			});
					    		}else{
					    			Item.findOneAndUpdate({_id: products[i].items[j].item_id}, {
					    				product_id:products[i].product_id,
					    				//unique_id:products[i].items[j].unique_id,
					    				sequence_number:products[i].items[j].sequence_number,
					    				name:products[i].items[j].item_name,
					    				details:products[i].items[j].item_details,
					    				price:products[i].items[j].item_price,
					    				tax:products[i].items[j].item_tax,
					    				image_url:products[i].items[j].item_image,
					    				store_id:store_id,
					    				is_visible_in_store:true,
					    				specifications:item_specifications
					    			}, {new: true}).then((item_data) => {});
					    		}
					    	}
				    	}
			    	}
			    }
			    return response_data.json({success: true ,errors:errors});
			} catch (error) {
				console.log(error)
		        response_data.json({success: false,error_code: ERROR_CODE.SOMETHING_WENT_WRONG, error_message: error.message})
		    } 
		}else{
			response_data.json(response);
		}
	});
}

/*exports.import_item_product = async function (request_data, response_data) {
	utils.check_request_params(request_data.body, [], async function (response) {
		if (response.success) {
			let obj = xlsx.parse(fs.readFileSync(path.join( __dirname ,'item.xlsx')));
		    let array_of_data = obj[0].data;
		    let products = [];
		    let store_id = "60406414e6a26b23bc4d4c5a";
		    let PRODUCT_ID = 1;
		    let PRODUCT_NAME = 0;
		    let PRODUCT_SEQUENCE_NUMBER = 2;
		    let ITEM_NAME = 3;
		    let ITEM_ID = 4;
		    let ITEM_DETAILS = 5;
		    let ITEM_PRICE = 6;
		    let ITEM_TAX = 7;
		    let ITEM_SEQUENCE_NUMBER = 8;
		    let ITEM_IMAGE = 9;
		    let SPECIFICATION_GROUP_ID = 14;
		    let SPECIFICATION_GROUP_SEQUENCE_NUMBER = 11;
		    let SPECIFICATION_GROUP_RANGE = 12;
		    let SPECIFICATION_GROIP_MAX_RANGE = 13;
		    let SPECIFICATION_GROUP_NAME = 10;
		    let SPECIFICATION_ID = 17;
		    let SPECIFICATION_IS_DEFAULT = 16;
		    let SPECIFICATION_NAME = 15;
		    let SPECIFICATION_PRICE = 18;
		    let SPECIFICATION_SEQUENCE_NUMBER = 19;
		    let is_required = true;
		    let type = 1;
		    
		    
		    for(let i= 1; i< array_of_data.length; i++){
		        is_required = (array_of_data[i][SPECIFICATION_GROUP_RANGE] != 0)?true:false;
		        type = (array_of_data[i][SPECIFICATION_GROUP_RANGE] == 1 && array_of_data[i][SPECIFICATION_GROIP_MAX_RANGE] == 0)?1:2;
		        if(array_of_data[i][PRODUCT_NAME]){		    
		        	
		            products.push({
		                product_id:array_of_data[i][PRODUCT_ID],
		                product_name:array_of_data[i][PRODUCT_NAME].split(','),
		                sequence_number:array_of_data[i][PRODUCT_SEQUENCE_NUMBER],
		                items:[{
		                    item_name: array_of_data[i][ITEM_NAME].split(','),
		                    item_id: array_of_data[i][ITEM_ID],
		                    item_details: array_of_data[i][ITEM_DETAILS].split(','),
		                    item_price: array_of_data[i][ITEM_PRICE],
		                    item_tax: array_of_data[i][ITEM_TAX],
		                    sequence_number: array_of_data[i][ITEM_SEQUENCE_NUMBER],
		                    item_image: array_of_data[i][ITEM_IMAGE].split(','),
		                    specifications:[{
		                        specification_group_id: array_of_data[i][SPECIFICATION_GROUP_ID],
		                        sequence_number: array_of_data[i][SPECIFICATION_GROUP_SEQUENCE_NUMBER],
		                        range: array_of_data[i][SPECIFICATION_GROUP_RANGE],
		                        max_range: array_of_data[i][SPECIFICATION_GROIP_MAX_RANGE],
		                        specification_group_name: array_of_data[i][SPECIFICATION_GROUP_NAME].split(','),
		                        is_required: is_required,
		                        type: type,
		                        list:[{
		                            specification_id: array_of_data[i][SPECIFICATION_ID],
		                            is_default_selected: array_of_data[i][SPECIFICATION_IS_DEFAULT],
		                            specification_name: array_of_data[i][SPECIFICATION_NAME].split(','),
		                            specification_price: array_of_data[i][SPECIFICATION_PRICE],
		                            sequence_number: array_of_data[i][SPECIFICATION_SEQUENCE_NUMBER],
		                        }]
		                    }]
		                }]
		            })
		        }else if(array_of_data[i][ITEM_NAME]){
		        	
		            products[products.length -1].items.push({
		                item_name: array_of_data[i][ITEM_NAME].split(','),
		                item_id: array_of_data[i][ITEM_ID],
		                item_details: array_of_data[i][ITEM_DETAILS],
		                item_price: array_of_data[i][ITEM_PRICE],
		                item_tax: array_of_data[i][ITEM_TAX],
		                sequence_number: array_of_data[i][ITEM_SEQUENCE_NUMBER],
		                item_image: array_of_data[i][ITEM_IMAGE].split(','),
		                specifications:[{
		                        specification_group_id: array_of_data[i][SPECIFICATION_GROUP_ID],
		                        sequence_number: array_of_data[i][SPECIFICATION_GROUP_SEQUENCE_NUMBER],
		                        range: array_of_data[i][SPECIFICATION_GROUP_RANGE],
		                        max_range: array_of_data[i][SPECIFICATION_GROIP_MAX_RANGE],
		                        specification_group_name: array_of_data[i][SPECIFICATION_GROUP_NAME].split(','),
		                        is_required: is_required,
		                        type: type,
		                        list:[{
		                            specification_id: array_of_data[i][SPECIFICATION_ID],
		                            is_default_selected: array_of_data[i][SPECIFICATION_IS_DEFAULT],
		                            specification_name: array_of_data[i][SPECIFICATION_NAME].split(','),
		                            specification_price: array_of_data[i][SPECIFICATION_PRICE],
		                            sequence_number: array_of_data[i][SPECIFICATION_SEQUENCE_NUMBER],
		                        }]
		                }]
		            })
		        }else if(array_of_data[i][SPECIFICATION_GROUP_ID]){
		            
		            products[products.length -1].items[products[products.length -1].items.length -1].specifications.push({
		                specification_group_id: array_of_data[i][SPECIFICATION_GROUP_ID],
		                sequence_number: array_of_data[i][SPECIFICATION_GROUP_SEQUENCE_NUMBER],
		                range: array_of_data[i][SPECIFICATION_GROUP_RANGE],
		                max_range: array_of_data[i][SPECIFICATION_GROIP_MAX_RANGE],
		                specification_group_name: array_of_data[i][SPECIFICATION_GROUP_NAME].split(','),
		                is_required: is_required,
		                type: type,
		                list:[{
		                    specification_id: array_of_data[i][SPECIFICATION_ID],
		                    is_default_selected: array_of_data[i][SPECIFICATION_IS_DEFAULT],
		                    specification_name: array_of_data[i][SPECIFICATION_NAME].split(','),
		                    specification_price: array_of_data[i][SPECIFICATION_PRICE],
		                    sequence_number: array_of_data[i][SPECIFICATION_SEQUENCE_NUMBER],
		                }]
		            })
		        }else if(array_of_data[i][SPECIFICATION_NAME]){
		            products[products.length -1].items[products[products.length -1].items.length -1].specifications[products[products.length -1].items[products[products.length -1].items.length -1].specifications.length -1].list.push({
		                specification_id: array_of_data[i][SPECIFICATION_ID],
		                is_default_selected: array_of_data[i][SPECIFICATION_IS_DEFAULT],
		                specification_name: array_of_data[i][SPECIFICATION_NAME].split(','),
		                specification_price: array_of_data[i][SPECIFICATION_PRICE],
		                sequence_number: array_of_data[i][SPECIFICATION_SEQUENCE_NUMBER],
		            })
		        }

		    }
		    let db_products = await Product.find({store_id :store_id});
		    let db_items = await Item.find({store_id :store_id});
		    let db_spg = await Specification_group.find({store_id :store_id});
		    let db_sp = await Specification.find({store_id :store_id});
		    let product_index = -1;
		    let spg_index = -1;
		    let sp_index = -1;
		    let item_index = -1;
		    let item_specifications = [];
		    for(let i= 0; i< products.length; i++){
		    	product_index = -1;		    	
		    	if(products[i].product_id && products[i].product_id != '' && products[i].product_id != null){
		    		product_index = db_products.findIndex(x=> String(x.unique_id) == String(products[i].product_id))
		    	}
		    	if(product_index == -1){
		    		var product_detail = await Product.create({sequence_number:products[i].sequence_number,name:products[i].name,store_id:store_id,is_visible_in_store:true});
		    		db_products.push(product_detail);
		    		product_index = db_products.length -1;
		    	}
		    	products[i]._id = db_products[product_index]._id;
		    	products[i].product_id = db_products[product_index].unique_id;
		    	for(let j= 0; j< products[i].items.length; j++){
		    		item_index = -1;
		    		item_specifications = [];

			    	for(let k= 0; k < products[i].items[j].specifications.length; k++){
			    		spg_index = -1;
			    		if(products[i].items[j].specifications[k].specification_group_id && products[i].items[j].specifications[k].specification_group_id != '' && products[i].items[j].specifications[k].specification_group_id != null){
				    		spg_index = db_spg.findIndex(x=> String(x.unique_id) == String(products[i].items[j].specifications[k].specification_group_id));
				    	}
				    	if(spg_index == -1){
				    		spg_index = db_spg.findIndex(x=> String(x.name[0]) == String(products[i].items[j].specifications[k].specification_group_name[0]));
				    	}
				    	if(spg_index == -1){
				    		var spg_detail = await Specification_group.create({
				    			sequence_number:products[i].items[j].specifications[k].sequence_number,
				    			name:products[i].items[j].specifications[k].specification_group_id,
				    			store_id:store_id
				    		});
				    		db_spg.push(spg_detail);
				    		spg_index = db_spg.length -1;
				    	}
				    	products[i].items[j].specifications[k]._id = db_spg[spg_index]._id;
				    	products[i].items[j].specifications[k].specification_group_name = db_spg[spg_index].unique_id;
				    	item_specifications.push({
				    		"_id" : products[i].items[j].specifications[k]._id,
				            "unique_id" : products[i].items[j].specifications[k].specification_group_id,
				            "sequence_number" : products[i].items[j].specifications[k].sequence_number,
				            "is_required" : products[i].items[j].specifications[k].is_required,
				            "range" : products[i].items[j].specifications[k].range,
				            "max_range" : products[i].items[j].specifications[k].max_range,
				            "name" : products[i].items[j].specifications[k].specification_group_name,
				            "type" : products[i].items[j].specifications[k].type,
				            "list":[]
				    	});
				    	for(let l= 0; l < products[i].items[j].specifications[k].list.length; l++){
				    		sp_index = -1;
				    		if(products[i].items[j].specifications[k].list[l].specification_id && products[i].items[j].specifications[k].list[l].specification_id != '' && products[i].items[j].specifications[k].list[l].specification_id != null){
					    		sp_index = db_sp.findIndex(x=> (String(x.unique_id) == String(products[i].items[j].specifications[k].list[l].specification_id)) || (String(x.specification_group_id) == String(products[i].items[j].specifications[k]._id)));
					    	}
					    	if(sp_index == -1){
					    		var sp_detail = await Specification.create({
					    			sequence_number:products[i].items[j].specifications[k].list[l].sequence_number,
					    			name:products[i].items[j].specifications[k].list[l].specification_group_name,
					    			price:products[i].items[j].specifications[k].list[l].price,
					    			specification_group_id:products[i].items[j].specifications[k]._id,
					    			store_id:store_id
					    		});
					    		db_sp.push(sp_detail);
					    		sp_index = db_sp.length -1;
					    	}
					    	products[i].items[j].specifications[k].list[l]._id = db_sp[sp_index]._id;
					    	products[i].items[j].specifications[k].list[l].specification_id = db_sp[sp_index].unique_id;
					    	item_specifications[k].list.push({
			                    "_id" : products[i].items[j].specifications[k].list[l]._id,
			                    "name" : products[i].items[j].specifications[k].list[l].specification_name,
			                    "unique_id" : products[i].items[j].specifications[k].list[l].specification_id,
			                    "sequence_number" : products[i].items[j].specifications[k].list[l].sequence_number,
			                    "price" :  products[i].items[j].specifications[k].list[l].specification_price,
			                    "is_default_selected" : products[i].items[j].specifications[k].list[l].is_default_selected,
			                    "is_user_selected" : false
			                });
			    		}
			    	}
			    	if(products[i].items[j].item_id && products[i].items[j].item_id != '' && products[i].items[j].item_id != null){
			    		item_index = db_items.findIndex(x=> String(x.unique_id) == String(products[i].items[j].item_id));
			    	}
			    	if(item_index == -1){
				    	var item_detail = await Item.create({
				    		sequence_number:products[i].items[j].sequence_number,
				    		name:products[i].items[j].item_name,
				    		details:products[i].items[j].item_details,
				    		product_id:products[i].items[j].product_id,
				    		price:products[i].items[j].item_price,
				    		tax:products[i].items[j].item_tax,
				    		item_image:products[i].items[j].item_image,
				    		specifications:item_specifications,
				    		store_id:store_id,
				    		is_visible_in_store:true
				    	});
				    	db_items.push(item_detail);
				    	item_index = db_items.length -1;
				    	products[i].items[j]._id = db_items[item_index]._id;
					    products[i].items[j].item_id = db_items[item_index].unique_id;
				   	}
		    	}
		    }
		    //var product_details = await Product.collection.insertMany(create_remaining_products, {multi: true});
		    //var spg_details = await Specification_group.collection.insertMany(create_remaining_spg, {multi: true});
		    response_data.json({success: true,products:products });
		}else{

		}
	});
}*/