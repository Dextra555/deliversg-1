var User_File_Obj = require('../controllers/user/user');
var Provider_File_Obj = require('../controllers/provider/provider');
var Store_File_Obj = require('../controllers/store/store');
var utils = require('../utils/utils');
var User = require('mongoose').model('user');
var Store = require('mongoose').model('store');
var Provider = require('mongoose').model('provider');
var Country = require('mongoose').model('country');
var City = require('mongoose').model('city');
var Delivery = require('mongoose').model('delivery');
var Provider_vehicle = require('mongoose').model('provider_vehicle');
var Database_backup = require('mongoose').model('database_backup');
var console = require('../utils/console');
var fs = require("fs");
var Order = require('mongoose').model('order');
var Order_payment = require('mongoose').model('order_payment');
var Request = require('mongoose').model('request');
var Cart = require('mongoose').model('cart');
var config = require('../../../config/config')

exports.add_database_backup = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var start_date = new Date(request_data_body.start_date.formatted);
            start_date = start_date.setHours(0, 0, 0, 0);
            start_date = new Date(start_date);
            var end_date = new Date(request_data_body.end_date.formatted);
            end_date = end_date.setHours(23, 59, 59, 59);
            end_date = new Date(end_date);

            var now = new Date()

            var date=now.getDate();
		    var month=now.getMonth()+1;
		    var year=now.getFullYear();
		    var hour=now.getHours();
		    var minute=now.getMinutes();
		    var file_name = date + '-' + month + '-' + year + ' ' + hour + ':' + minute;

            var database_backp_detail = new Database_backup({
            	start_date : start_date,
            	end_date: end_date,
            	is_deleted_from_db: request_data_body.is_deleted_from_db,
            	file_name: file_name
            });

            database_backp_detail.save(function(){
            	var backup = require('mongodb-backup');
			    backup({
			      	uri: config.db, // mongodb://<dbuser>:<dbpassword>@<dbdomain>.mongolab.com:<dbport>/<dbdatabase>
			      	root: __dirname +'/../../uploads/db_backup',
			      	collections: ['orders', 'order_payments', 'requests', 'carts'],
			      	query: {created_at: {$gte: start_date}, created_at: {$lt: end_date}},
			      	tar: file_name+'.tar',
			      	callback: function(err) {
				        if (err) {
				          	console.error(err);
				        } else {
				          	if(setting_detail.is_use_aws_bucket){
					            var fs = require("fs");
					            var AWS = require('aws-sdk');

					            var file_new_path = 'db_backup'+file_name+'.tar';
					            AWS.config.update({accessKeyId: setting_detail.access_key_id, secretAccessKey: setting_detail.secret_key_id});
					            fs.readFile(__dirname +'/uploads/db_backup/'+file_name+'.tar', function (err, data) {
					              	var s3 = new AWS.S3();
					              	var base64data = new Buffer(data, 'binary');
					              	s3.putObject({
						                Bucket: setting_detail.aws_bucket_name,
						                Key: file_new_path,
						                Body: base64data,
						                ACL: 'public-read'
					              	}, function (resp, data) {
					                	fs.unlink(__dirname +'/uploads/db_backup/'+file_name+'.tar');
						                if(request_data_body.is_deleted_from_db){
						                	Order.remove({created_at: {$gte: start_date}, created_at: {$lt: end_date}}, function(error, order_list){

						                	})
						                }
					              	});
					            });
				          	} else {
				          		if(request_data_body.is_deleted_from_db){

				          			Order.find({created_at: {$gte: start_date}, created_at: {$lt: end_date}}, function(error, order_list){
				          				order_list.forEach(function(order_detail){
				          					Order.remove({_id: order_detail._id}, function(error, order_detail){

						                	})
						                	Cart.remove({_id: order_detail.cart_id}, function(error, cart_detail){

						                	})
						                	Order_payment.remove({_id: order_detail.order_payment_id}, function(error, order_payment_detail){

						                	})
						                	Request.remove({_id: order_detail.request_id}, function(error, request_detail){

						                	})
				          				})
				          			});
				                	
				                }
				          	}
				        }
				    }
			    });
            	response_data.json({success: true});
            })
        } else {
            response_data.json(response);
        }
    });
};


exports.list_database_backup = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;

            Database_backup.find({}, function(error, database_backup_list){
            	response_data.json({success: true, database_backup_list: database_backup_list});
            });

        } else {
            response_data.json(response);
        }
    });
};

exports.restore_database_backup = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;

            Database_backup.findOne({_id: request_data_body.id}, function(error, detail){

            	if(detail && detail.is_deleted_from_db){
	            	var restore = require('mongodb-restore');
				    var file_name = detail.file_name;
				    restore({
				      	uri: config.db, // mongodb://<dbuser>:<dbpassword>@<dbdomain>.mongolab.com:<dbport>/<dbdatabase>
				      	root: __dirname +'/../../uploads/db_backup',
				      	tar: file_name+'.tar',
				      	callback: function(err) {
				      		if (err) {
					          	console.error(err);
					        } else {
					      		Database_backup.findOneAndUpdate({_id: request_data_body.id}, {is_deleted_from_db: false}, function(error, detail){
					      			
					      		});
					      		if(setting_detail.is_use_aws_bucket){
						            AWS.config.update({accessKeyId: setting_detail.access_key_id, secretAccessKey: setting_detail.secret_key_id});
						            var s3 = new AWS.S3();
						            s3.deleteObject({
						                Bucket: setting_detail.aws_bucket_name,
						                Key: 'db_backup/'+file_name+'.tar'
						            },function (err,data){
						            	response_data.json({success: true});
						            })
						        } else {
						        	response_data.json({success: true});
						        }
						    }
				      	}
				    });
				}
            })

        } else {
            response_data.json(response);
        }
    });
};