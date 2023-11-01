var myUtils = require('./utils');
require('../utils/constants');
var moment = require('moment');
var nodemailer = require('nodemailer');
var twilio = require('twilio');
var fs = require("fs");
const mkdirp = require('mkdirp');
var Item = require('mongoose').model('item');
var Store = require('mongoose').model('store');
var Bank_detail = require('mongoose').model('bank_detail')
var Franchise = require('mongoose').model('franchise');
var SubStore = require('mongoose').model('SubStore');
var Product = require('mongoose').model('product');
var ProductGroup = require('mongoose').model('ProductGroup');
var Specification_group = require('mongoose').model('specification_group');
var Specification = require('mongoose').model('specification');
var Document = require('mongoose').model('document');
var Payment_gateway = require('mongoose').model('payment_gateway');
var Card = require('mongoose').model('card');
var Document_uploaded_list = require('mongoose').model('document_uploaded_list');
var moment_timezone = require('moment-timezone');
var swap = require('node-currency-swap');
var Sms_gateway = require('mongoose').model('sms_gateway');
var Admin = require('mongoose').model('admin');
var Installation_setting = require('mongoose').model('installation_setting');
var Setting = require('mongoose').model('setting');
var fs = require('fs');
var Email = require('mongoose').model('email_detail');
var SMS_Detail = require('mongoose').model('sms_detail');
var Store_analytic_daily = require('mongoose').model('store_analytic_daily');
var Provider_analytic_daily = require('mongoose').model('provider_analytic_daily');
var Transfer_History = require('mongoose').model('transfer_history');
var CityZone = require('mongoose').model('cityzone');
var ZoneValue = require('mongoose').model('zonevalue');
var SubCategory = require('mongoose').model('sub_category');
var geolib = require('geolib');
var console = require('./console');
var paystack_refund = require('../controllers/user/card')
require('./error_code');
var mongoose = require('mongoose');
var path = require('path');
var apn = require("apn")
var request = require('request')
var QR = require('qrcode')

exports.check_request_params = function (request_data_body, params_array, response) {
    var missing_param = '';
    var is_missing = false;
    var invalid_param = '';
    var is_invalid_param = false;
    
    
    params_array.forEach(function (param) {
        if (request_data_body[param.name] == undefined) {
            missing_param = param.name;
            is_missing = true;
        } else {
            if (param.type && typeof request_data_body[param.name] !== param.type) {
                is_invalid_param = true;
                invalid_param = param.name;
            }
        }
    });

    if (is_missing) {
        console.log("missing_param: " + missing_param)
        response({ success: false, error_code: ERROR_CODE.PARAMETER_MISSING, error_description: missing_param + ' parameter missing' });
    } else if (is_invalid_param) {
        console.log("invalid_param: " + invalid_param)
        response({ success: false, error_code: ERROR_CODE.PARAMETER_INVALID, error_description: invalid_param + ' parameter invalid' });
    }
    else {
        response({ success: true });
    }
}
exports.check_unique_details = function (request_data, params_array, response) {
    var request_data_body = request_data.body
    var missing_param = '';
    var is_missing = false;
    var invalid_paarm = '';
    var is_invalid_param = false;
    params_array.forEach(function (param) {
        

        if (request_data_body[param.name] == undefined) {
            missing_param = param.name;
            is_missing = true;
            

        } else {
            if (param.type && typeof request_data_body[param.name] !== param.type) {
                is_invalid_param = true;
                invalid_param = param.name;
                
            }
        }
    });
    if (is_missing) {
        console.log("missing_param: " + missing_param)
        response({ success: false, error_code: ERROR_CODE.PARAMETER_MISSING, error_description: missing_param + ' parameter missing' });
    } else if (is_invalid_param) {
        console.log("invalid_param: " + invalid_param)
        response({ success: false, error_code: ERROR_CODE.PARAMETER_INVALID, error_description: invalid_param + ' parameter invalid' });
    }
    else {
        if (request_data.headers) {
            if (request_data.headers.type != undefined) {
                if (request_data.headers.type == 0 || request_data.headers.type == 1 || request_data.headers.type == 2) {
                    Store.findOne({ _id: request_data.headers.storeid }, function (err, store_detail) {

                        if (store_detail) {
                            if (request_data.headers.type == 0) {
                                if (request_data.headers.token !== null && store_detail.server_token !== request_data.headers.token) {
                                    response({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                                } else {
                                    response({ success: true, store: store_detail });
                                }
                            } if (request_data.headers.type == 1) {
                                SubStore.findOne({ _id: request_data.headers.id }, function (err, sub_store_detail) {
                                    if (request_data.headers.token !== null && sub_store_detail.server_token !== request_data.headers.token) {
                                        response({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                                    } else {
                                        response({ success: true, store: store_detail, sub_store: sub_store_detail });
                                    }
                                })
                            } if (request_data.headers.type == 2) {
                                Admin.findOne({ _id: request_data.headers.id }, function (err, admin_detail) {
                                    if (request_data.headers.token !== null && admin_detail.server_token !== request_data.headers.token) {
                                        response({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                                    } else {
                                        response({ success: true, store: store_detail });
                                    }
                                })
                            }
                        } else {
                            response({ success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND });
                        }
                    });
                } else if (request_data.headers.type == 10) {
                    Franchise.findOne({ _id: request_data.headers.franchiseid }, function (err, franchise_detail) {

                        if (franchise_detail) {

                            if (request_data.headers.token !== null && franchise_detail.server_token !== request_data.headers.token) {
                                response({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                            } else {
                                response({ success: true, franchise: franchise_detail });
                            }
                        } else {
                            response({ success: false, error_code: STORE_ERROR_CODE.STORE_DATA_NOT_FOUND });
                        }
                    });
                }
                else if (request_data.headers.type == 7) {
                    response({ success: true });
                }
            } else {
                Store.findOne({ _id: request_data.body.store_id }, function (err, store_detail) {
                    response({ success: true, store: store_detail });
                })
            }
        } else {
            if (request_data.body.type == 2) {
                Admin.findOne({ _id: request_data.body.id }, function (err, admin_detail) {
                    if (request_data.body.server_token !== null && admin_detail.server_token !== request_data.body.server_token) {
                        response({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {
                        Store.findOne({ _id: request_data.body.store_id }, function (err, store_detail) {
                            response({ success: true, store: store_detail });
                        })
                    }
                })
            } else {
                console.log()
                response({ success: false });
            }

        }
    }
}

exports.updateWallet = function (request_data, response_data) {
    Email.find({}, function (error, stores) {
        stores.forEach(function (data) {
            data.is_send = true;
            data.save();
        });
    });

    SMS_Detail.find({}, function (error, stores) {
        stores.forEach(function (data) {
            data.is_send = true;
            data.save();
        });
    });
}


exports.updateStoreTime = function (request_data, response_data) {

};

exports.copyImage = function (file_path, file_name, id) {
    var local_path = 'uploads/' + file_path;

    myUtils.storeImageToFolderCopyStore(local_path, file_name, id);
}

exports.getSaveImageFolderPathCopyStore = function (id) {
    return './uploads/' + myUtils.getImageFolderName(id);
};

exports.storeImageToFolderCopyStore = function (local_image_path, image_name, id) {
    var bf = new Buffer(100000);
    var file_new_path = myUtils.getSaveImageFolderPathCopyStore(id) + image_name;

    fs.readFile(local_image_path, function (error, data) {
        if (!error) {
            fs.writeFile(file_new_path, data, 'binary', function (error) {
                if (error) {
                    console.log("Save file : " + error);
                } else {
                    // fs.unlink(local_image_path);
                    console.log("File uploaded successfully");
                }
            });
            if (id == FOLDER_NAME.STORE_PRODUCTS || id == FOLDER_NAME.STORE_ITEMS || id == FOLDER_NAME.STORE_PROFILES || id == FOLDER_NAME.DELIVERY_TYPE_IMAGES) {
                const sharp = require('sharp');
                sharp(local_image_path).resize({ width: 500, height: 400 }).toFile(file_new_path)
                    .then(function (newFileInfo) {
                        console.log("Success Max");
                    })
                    .catch(function (err) {
                        console.log("Error occured");
                    });
                sharp(local_image_path).resize({ width: 250, height: 200 }).toFile(file_new_path.replace(".jpg", "_md.jpg").replace(".jpeg", "_md.jpeg").replace(".png", "_md.png"))
                    .then(function (newFileInfo) {
                        console.log("Success Medium");
                    })
                    .catch(function (err) {
                        console.log("Error occured");
                    });
                sharp(local_image_path).resize({ width: 100, height: 80 }).toFile(file_new_path.replace(".jpg", "_sm.jpg").replace(".jpeg", "_md.jpeg").replace(".png", "_md.png"))
                    .then(function (newFileInfo) {
                        console.log("Success");
                    })
                    .catch(function (err) {
                        console.log("Error occured small");
                    });
            }
        }
    });
}


/* Start Auto Update Query */
exports.updateNewTable = function (request_data, response_data) {
    console.log("Add specification updateNewTable");
    var request_data_body = request_data.body;
    var present_store_id = request_data_body.present_store_id;
    var new_store_id = request_data_body.new_store_id;

    var type = 2;

    if (new_store_id != present_store_id) {
        Store.findOne({ _id: present_store_id }, function (error, present_store_data) {

            if (present_store_data) {
                Store.findOne({ _id: new_store_id }, function (error, new_store_data) {

                    if (new_store_data) {
                        if (present_store_data.image_url != "" || present_store_data.image_url != null) {
                            var url = myUtils.getStoreImageFolderPath(FOLDER_NAME.STORE_PROFILES) + new_store_data._id + FILE_EXTENSION.STORE;

                            new_store_data.image_url = url;

                            myUtils.copyImage(present_store_data.image_url, new_store_data._id + FILE_EXTENSION.STORE, FOLDER_NAME.STORE_PROFILES);
                        }
                        Product.find({ store_id: present_store_data._id }, function (error, products) {

                            if (products.length > 0) {
                                console.log("products.length : " + products.length);

                                products.forEach(function (product) {

                                    myUtils.copy_products(present_store_data._id, new_store_data._id, product);

                                });
                            }
                        });

                        Specification_group.find({ store_id: present_store_data._id }, function (error, specification_groups) {

                            if (specification_groups.length > 0) {
                                console.log("specification_groups.length : " + specification_groups.length);

                                specification_groups.forEach(function (specification_group) {

                                    myUtils.copy_specification_groups(new_store_data._id, specification_group);

                                });
                            }
                        });

                        ProductGroup.find({ store_id: present_store_data._id }, function (error, product_groups) {

                            console.log("product_groups.length : " + product_groups.length);

                            if (product_groups.length > 0) {

                                product_groups.forEach(function (product_group) {

                                    myUtils.copy_product_groups(new_store_data._id, product_group);

                                });
                            }
                        });

                        new_store_data.is_approved = true;
                        new_store_data.save();
                    }
                });
            }
        });
    }
};
exports.copy_specification_group_franchise = function (franchises_id, new_store_id, group) {
    //console.log('copy_specification_group_franchise');

    Specification_group.findOne({ main_specification_group_id: group._id, store_id: new_store_id }, function (error, specification_groups) {
        if (specification_groups) {
            specification_groups.main_specification_group_id = group._id;
            specification_groups.sequence_number = group.sequence_number;
            specification_groups.unique_id_for_store_data = group.unique_id_for_store_data;
            specification_groups.store_id = new_store_id;
            specification_groups.franchise_id = null;
            specification_groups.name = group.name;
            specification_groups.save(function (error) {
            });
        } else {
            var specification_groups = new Specification_group({
                main_specification_group_id: group._id,
                sequence_number: group.sequence_number,
                unique_id_for_store_data: group.unique_id_for_store_data,
                store_id: new_store_id,
                franchise_id: null,
                name: group.name
            });
            specification_groups.save(function (error) {
            });
        }
    });

};

exports.copy_specification_franchise = function (franchises_id, new_store_id, spec) {
    Specification_group.findOne({ main_specification_group_id: spec.specification_group_id, store_id: new_store_id }, function (error, specification_group) {

        if (specification_group) {
            Specification.findOne({ main_specification_id: spec._id, store_id: new_store_id }, function (error, specification) {
                if (specification) {
                    specification.main_specification_id = spec._id;
                    specification.franchise_id = null;
                    specification.specification_group_id = specification_group._id;
                    specification.store_id = new_store_id;
                    specification.is_user_selected = spec.is_user_selected;
                    specification.sequence_number = spec.sequence_number;
                    specification.unique_id_for_store_data = spec.unique_id_for_store_data;
                    specification.is_default_selected = spec.is_default_selected;
                    specification.sequence_number = spec.sequence_number;
                    specification.name = spec.name;
                    specification.price = spec.price;
                    specification.save();
                } else {
                    var specification = new Specification({
                        main_specification_id: spec._id,
                        franchise_id: null,
                        specification_group_id: specification_group._id,
                        store_id: new_store_id,
                        is_user_selected: spec.is_user_selected,
                        sequence_number: spec.sequence_number,
                        unique_id_for_store_data: spec.unique_id_for_store_data,
                        is_default_selected: spec.is_default_selected,
                        sequence_number: spec.sequence_number,
                        price: spec.price,
                        name: spec.name
                    });
                    specification.save();
                }
            });
        }
    });
};

exports.copy_product_group_franchise = function (franchises_id, new_store_id, product_group) {

    ProductGroup.findOne({ main_product_group_id: product_group._id, store_id: new_store_id }, function (error, product_group_data) {

        if (product_group_data) {
            product_group_data.main_product_group_id = product_group._id,
                product_group_data.store_id = new_store_id,
                product_group_data.franchise_id = null,
                product_group_data.sequence_number = product_group.sequence_number,
                product_group_data.name = product_group.name;
            product_group_data.save(function (error) {
                var product_ids = [];
                var other_product_ids = [];
                if (product_group.product_ids.length > 0) {
                    Product.find({ main_product_id: { $in: product_group.product_ids } }, function (err, product_data) {
                        product_data.forEach(function (data) {
                            product_ids.push(data._id);
                        });
                        product_group.product_ids.forEach(function (product_id) {
                            var index = product_data.findIndex(x => x.main_product_id == product_id);
                            if (index == -1) {
                                other_product_ids.push(product_id);
                            }
                        })
                        product_group_data.product_ids = product_ids;
                        product_group_data.save(function (err, product_group_data) {
                            if (other_product_ids.length > 0) {
                                Product.find({ store_id: null, franchises_id: franchises_id, _id: { $in: other_product_ids } }).then((products) => {
                                    for (var i = 0; i < products.length; i++) {
                                        myUtils.copy_product_franchise(franchises_id, new_store_id, products[i], 1, product_group_data);
                                    }
                                })
                            }
                        });
                    })
                }
            });
        } else {
            var product_group_data = new ProductGroup({
                main_product_group_id: product_group._id,
                store_id: new_store_id,
                franchise_id: null,
                sequence_number: product_group.sequence_number,
                name: product_group.name
            });
            if (product_group_data.image_url != "" || product_group_data.image_url != null) {
                var url = myUtils.getStoreImageFolderPath(FOLDER_NAME.STORE_PRODUCTS_GROUP) + product_group_data._id + FILE_EXTENSION.PROVIDERGROUP;
                product_group_data.image_url = url;
                myUtils.copyImage(product_group_data.image_url, product_group_data._id + FILE_EXTENSION.PROVIDERGROUP, FOLDER_NAME.STORE_PRODUCTS_GROUP);
            }
            product_group_data.save(function (error) {
                var product_ids = [];
                var other_product_ids = [];
                if (product_group.product_ids.length > 0) {
                    Product.find({ main_product_id: { $in: product_group.product_ids } }, function (err, product_data) {
                        product_data.forEach(function (data) {
                            product_ids.push(data._id);
                        });
                        product_group.product_ids.forEach(function (product_id) {
                            var index = product_data.findIndex(x => x.main_product_id == product_id);
                            if (index == -1) {
                                other_product_ids.push(product_id);
                            }
                        })
                        product_group_data.product_ids = product_ids;
                        product_group_data.save(function (err, product_group_data) {
                            if (other_product_ids.length > 0) {
                                Product.find({ store_id: null, franchises_id: franchises_id, _id: { $in: other_product_ids } }).then((products) => {
                                    for (var i = 0; i < products.length; i++) {
                                        myUtils.copy_product_franchise(franchise_id, new_store_id, products[i], 1, product_group_data);
                                    }
                                })
                            }
                        });
                    })
                }
            });
        }

    });

};
exports.copy_product_franchise = function (franchises_id, new_store_id, product, bool, response) {

    Product.findOne({ main_product_id: product._id, store_id: new_store_id }, function (error, product_data) {

        if (product_data) {
            product_data.main_product_id = product._id;
            product_data.store_id = new_store_id;
            product_data.franchise_id = null;
            product_data.sequence_number = product.sequence_number;
            product_data.is_visible_in_store = product.is_visible_in_store;
            product_data.name = product.name;
            product_data.save(function (error) {
                if (bool == 2) {
                    if (response) {
                        response(product_data);
                    }
                } else if (bool == 1) {
                    ProductGroup.findByIdAndUpdate({ _id: response._id }, { $push: { product_ids: product_data._id } }, function (err, doc) {
                    });
                }
            });
        } else {
            var new_product_data = new Product({
                main_product_id: product._id,
                store_id: new_store_id,
                franchise_id: null,
                sequence_number: product.sequence_number,
                is_visible_in_store: true,
                name: product.name
            });
            new_product_data.save(function (error) {
                if (bool == 2) {
                    if (response) {
                        response(product_data);
                    }
                } else if (bool == 1) {
                    ProductGroup.findByIdAndUpdate({ _id: response._id }, { $push: { product_ids: new_product_data._id } }, function (err, doc) {
                    });
                }
            });
        }

    });

};
exports.copy_item_franchise = function (franchises_id, new_store_id, main_item) {
    Item.findOne({ main_item_id: main_item._id, store_id: new_store_id }, function (error, item_data1) {
        Product.findOne({ main_product_id: main_item.product_id, store_id: new_store_id }, function (error, product_data) {

            if (product_data) {
                if (item_data1) {
                    Item.findOne({ main_item_id: main_item._id, store_id: new_store_id }, function (error, item_data) {
                        item_data.sequence_number = main_item.sequence_number;
                        item_data.name = main_item.name;
                        item_data.details = main_item.details;
                        item_data.price = main_item.price;
                        item_data.offer_message_or_percentage = main_item.offer_message_or_percentage;
                        item_data.item_price_without_offer = main_item.item_price_without_offer;
                        item_data.total_quantity = main_item.total_quantity;
                        item_data.in_cart_quantity = main_item.in_cart_quantity;
                        item_data.total_added_quantity = main_item.total_added_quantity;
                        item_data.total_used_quantity = main_item.total_used_quantity;
                        item_data.note_for_item = main_item.note_for_item;
                        item_data.unique_id_for_store_data = main_item.unique_id_for_store_data;
                        item_data.is_item_in_stock = main_item.is_item_in_stock;
                        item_data.is_most_popular = main_item.is_most_popular;
                        item_data.is_visible_in_store = main_item.is_visible_in_store;
                        item_data.tax = main_item.tax;
                        item_data.product_id = product_data._id;
                        item_data.specifications_unique_id_count = main_item.specifications_unique_id_count;
                        item_data.store_id = new_store_id;
                        item_data.save(function (error) {
                            //console.log(error);
                            if (!error) {
                                myUtils.get_specifaction_franchise(main_item.specifications, item_data);
                            }
                        });
                    });
                } else {
                    var item_data = new Item({
                        main_item_id: main_item._id,
                        product_id: product_data._id,
                        sequence_number: main_item.sequence_number,
                        name: main_item.name,
                        details: main_item.details,
                        price: main_item.price,
                        offer_message_or_percentage: main_item.offer_message_or_percentage,
                        item_price_without_offer: main_item.item_price_without_offer,
                        total_quantity: main_item.total_quantity,
                        in_cart_quantity: main_item.in_cart_quantity,
                        total_added_quantity: main_item.total_added_quantity,
                        total_used_quantity: main_item.total_used_quantity,
                        note_for_item: main_item.note_for_item,
                        unique_id_for_store_data: main_item.unique_id_for_store_data,
                        is_item_in_stock: main_item.is_item_in_stock,
                        is_most_popular: main_item.is_most_popular,
                        is_visible_in_store: main_item.is_visible_in_store,
                        tax: main_item.tax,
                        specifications_unique_id_count: main_item.specifications_unique_id_count,
                        store_id: new_store_id
                    });
                    var urls = main_item.image_url;
                    var new_urls = [];

                    if (urls != null && urls.length > 0) {
                        var len = urls.length;
                        var new_item_id = item_data._id;

                        for (var i = 0; i < len; i++) {
                            var img_path = new_item_id + myUtils.generatorRandomChar(4) + FILE_EXTENSION.ITEM;
                            var url = myUtils.getStoreImageFolderPath(FOLDER_NAME.STORE_ITEMS) + img_path;
                            new_urls.push(url);
                            myUtils.copyImage(urls[i], img_path, FOLDER_NAME.STORE_ITEMS);
                        }
                    }

                    item_data.image_url = new_urls;
                    item_data.save(function (error) {
                        //console.log(error);
                        if (!error) {
                            myUtils.get_specifaction_franchise(main_item.specifications, item_data);
                        }

                    });
                }
            } else {
                Product.findOne({ _id: main_item.product_id, store_id: null }, function (error, product) {
                    myUtils.copy_product_franchise(franchise_id, new_store_id, product, 2, function (response) {
                        myUtils.copy_item_franchise(franchise_id, new_store_id, main_item, function (response) {

                        });
                    });
                });
            }

        })
    })

}
exports.get_specifaction_franchise = function (specifications, item_data) {

    Item.findById(item_data._id, function (error, items) {
        items.specifications = [];
        Specification.find({ store_id: items.store_id }, function (error, specifications_list) {
            Specification_group.find({ store_id: items.store_id }, function (error, specification_groups) {
                var new_specification_group = [];
                var sspecifications = specifications;

                for (var i = 0; i < sspecifications.length;) {

                    var checked_groups = specification_groups.findIndex(x => x.main_specification_group_id == sspecifications[i]._id);
                    var exist_item = items.specifications.findIndex(x => x.unique_id == sspecifications[i].unique_id);

                    var selected_spec = sspecifications[i].list;
                    var specification_array = [];
                    for (var j = 0; j < selected_spec.length;) {
                        var checked_specifications = specifications_list.findIndex(x => x.main_specification_id == selected_spec[j]._id);
                        if (checked_specifications != -1) {
                            var y = {
                                _id: specifications_list[checked_specifications]._id,
                                unique_id: selected_spec[j].unique_id,
                                is_user_selected: selected_spec[j].is_user_selected,
                                is_default_selected: selected_spec[j].is_default_selected,
                                sequence_number: selected_spec[j].sequence_number,
                                price: selected_spec[j].price,
                                name: selected_spec[j].name,

                            };
                            specification_array.push(y);
                        } else {
                            var y = {
                                _id: selected_spec[j]._id,
                                unique_id: selected_spec[j].unique_id,
                                is_user_selected: selected_spec[j].is_user_selected,
                                is_default_selected: selected_spec[j].is_default_selected,
                                sequence_number: selected_spec[j].sequence_number,
                                price: selected_spec[j].price,
                                name: selected_spec[j].name,
                            };
                            specification_array.push(y);
                        }
                        j++;

                        if (j == selected_spec.length) {

                            if (checked_groups != -1) {

                                var z = {
                                    _id: specification_groups[checked_groups]._id,
                                    unique_id: sspecifications[i].unique_id,
                                    is_required: sspecifications[i].is_required,
                                    name: sspecifications[i].name,
                                    sequence_number: sspecifications[i].sequence_number,
                                    type: sspecifications[i].type,
                                    max_range: sspecifications[i].max_range,
                                    range: sspecifications[i].range,
                                    list: specification_array
                                };
                                if (exist_item != -1) {

                                    items.specifications[exist_item] = z;
                                } else {
                                    items.specifications.push(z);
                                }
                            } else {
                                var z = {
                                    _id: sspecifications[i]._id,
                                    unique_id: sspecifications[i].unique_id,
                                    is_required: sspecifications[i].is_required,
                                    name: sspecifications[i].name,
                                    languages: sspecifications[i].languages,
                                    sequence_number: sspecifications[i].sequence_number,
                                    type: sspecifications[i].type,
                                    max_range: sspecifications[i].max_range,
                                    range: sspecifications[i].range,
                                    list: specification_array
                                };
                                if (exist_item != -1) {

                                    items.specifications[exist_item] = z;
                                } else {
                                    items.specifications.push(z);
                                }
                            }
                            i++;
                            if (i == sspecifications.length) {

                                items.save();
                            }
                        }
                    }

                }
            })
        })
    });
}


exports.copy_products = function (present_store_id, new_store_id, product) {


    var new_product_data = new Product({
        store_id: new_store_id,
        image_url: "",
        is_visible_in_store: true,
        details: product.details,
        sequence_number: product.sequence_number,
        name: product.name
    });
    var new_product_id = new_product_data._id;
    if (product.image_url != "" || product.image_url != null) {
        var url = myUtils.getStoreImageFolderPath(FOLDER_NAME.STORE_PRODUCTS) + new_product_id + FILE_EXTENSION.PRODUCT;

        new_product_data.image_url = url;

        myUtils.copyImage(product.image_url, new_product_id + FILE_EXTENSION.PRODUCT, FOLDER_NAME.STORE_PRODUCTS);
    }
    new_product_data.save(function (error) {
        console.log(error);
        if (!error) {

            // Add Specification groups


            // Add Items
            Item.find({ store_id: product.store_id, product_id: product._id }, function (error, items) {

                if (items.length > 0) {
                    console.log("items.length : " + items.length);

                    items.forEach(function (item) {

                        myUtils.copy_items(new_store_id, new_product_id, item, []);

                    });
                }
            });

        }
    });

}


exports.copy_specification_groups = function (new_store_id, specification_group) {

    var new_specification_group_data = new Specification_group({
        store_id: new_store_id,
        name: specification_group.name
    });
    var new_specification_group_id = new_specification_group_data._id;

    new_specification_group_data.save(function (error) {
        if (!error) {

            Specification.find({ store_id: specification_group.store_id, specification_group_id: specification_group._id }, function (error, specifications) {

                if (specifications.length > 0) {

                    specifications.forEach(function (specification) {

                        var new_specification_data = new Specification({
                            store_id: new_store_id,
                            specification_group_id: new_specification_group_id,
                            is_user_selected: false,
                            is_default_selected: false,
                            price: specification.price,
                            sequence_number: specification.sequence_number,
                            name: specification.name
                        });
                        new_specification_data.save();

                        console.log("save new_specification_data");

                    });
                }
            });

        }
    });

}


exports.copy_items = function (new_store_id, new_product_id, item, specifications) {

    var new_item_data = new Item({
        store_id: new_store_id,
        product_id: new_product_id,
        instruction: "",
        image_url: [],
        specifications: specifications,
        specifications_unique_id_count: item.specifications_unique_id_count,
        total_price: item.total_price,
        total_specification_price: item.total_specification_price,
        total_item_price: item.total_item_price,
        no_of_order: item.no_of_order,
        price: item.price,
        sequence_number: item.sequence_number,
        tax: item.tax,
        is_visible_in_store: item.is_visible_in_store,
        is_most_popular: item.is_most_popular,
        is_item_in_stock: item.is_item_in_stock,
        is_default: item.is_default,
        details: item.details,
        name: item.name
    });



    var urls = item.image_url;
    var new_urls = [];

    if (urls != null && urls.length > 0) {
        var len = urls.length;
        var new_item_id = new_item_data._id;

        for (var i = 0; i < len; i++) {
            var img_path = new_item_id + myUtils.generatorRandomChar(4) + FILE_EXTENSION.ITEM;
            var url = myUtils.getStoreImageFolderPath(FOLDER_NAME.STORE_ITEMS) + img_path;
            new_urls.push(url);
            myUtils.copyImage(urls[i], img_path, FOLDER_NAME.STORE_ITEMS);
        }
    }

    new_item_data.image_url = new_urls;
    new_item_data.save(function (error) {
        console.log(error);
    });


}


exports.copy_product_groups = function (new_store_id, product_group) {

    console.log("copy_product_groups");

    var new_product_group_data = new ProductGroup({
        store_id: new_store_id,
        image_url: "",
        sequence_number: product_group.sequence_number,
        name: product_group.name,
        product_ids: []
    });
    var new_product_group_id = new_product_group_data._id;

    if (product_group.image_url != "" || product_group.image_url != null) {
        var url = myUtils.getStoreImageFolderPath(FOLDER_NAME.STORE_PRODUCTS_GROUP) + new_product_group_id + FILE_EXTENSION.PROVIDERGROUP;
        new_product_group_data.image_url = url;
        myUtils.copyImage(product_group.image_url, new_product_group_id + FILE_EXTENSION.PROVIDERGROUP, FOLDER_NAME.STORE_PRODUCTS_GROUP);
    }

    new_product_group_data.save();
}



exports.updateItemNewTable = function (request_data, response_data) {
    console.log("updateItemNewTable");
    var request_data_body = request_data.body;
    var present_store_id = request_data_body.present_store_id;
    var new_store_id = request_data_body.new_store_id;
    var type = 1;

    if (new_store_id != present_store_id) {
        Store.findOne({ _id: present_store_id }, function (error, present_store_data) {

            if (present_store_data) {
                Store.findOne({ _id: new_store_id }, function (error, new_store_data) {

                    if (new_store_data) {

                        // Add Items
                        Item.find({ store_id: new_store_data._id }, function (error, items) {

                            if (items.length > 0) {

                                items.forEach(function (new_item) {

                                    Item.findOne({ store_id: present_store_data._id, name: new_item.name }, function (error, item) {
                                        if (item) {
                                            myUtils.copy_specifications_for_group(item, new_item);
                                        }
                                    });

                                });
                            }
                        });

                        ProductGroup.find({ store_id: new_store_data._id }, function (error, product_groups) {

                            console.log("product_groups.length : " + product_groups.length);

                            if (product_groups.length > 0) {

                                product_groups.forEach(function (new_product_group) {

                                    ProductGroup.findOne({ store_id: present_store_data._id, name: new_product_group.name, product_ids: { $exists: true, $ne: [] } }, function (error, product_group) {
                                        if (product_group) {
                                            myUtils.copy_products_in_product_groups(product_group, new_product_group);
                                        }
                                    });

                                });
                            }
                        });

                    }
                });
            }
        });
    }
};
//

exports.copy_products_in_product_groups = function (product_group, new_product_group) {

    Product.find({ _id: { $in: product_group.product_ids } }, function (error, products) {
        var product_query = [];
        var q = {};
        products.forEach(function (product) {
            q = { name: product.name };
            product_query.push(q);
        });

        var product_ids = [];
        var qry = { $or: product_query, "store_id": new_product_group.store_id };
        Product.find(qry, function (error, new_products) {
            new_products.forEach(function (new_product) {
                product_ids.push(new_product._id);
            });
            new_product_group.product_ids = product_ids;
            new_product_group.save();
        });
    });
}


exports.copy_specifications_in_items = function (item_id, new_item_id) {
    console.log("copy_specifications_in_items");
    Item.findOne({ _id: item_id }, function (error, item) {
        if (item) {
            Item.findOne({ _id: new_item_id }, function (error, new_item) {
                if (new_item) {
                    myUtils.copy_specifications_for_group(item, new_item);
                }
            });
        }
    });
}

exports.copy_specifications_for_group = function (item, new_item) {
    specifications = item.specifications;
    var l = specifications.length;
    for (var i = 0; i < l; i++) {
        var specification_group_in_item = specifications[i];
        myUtils.copy_specifications(specification_group_in_item, specification_group_in_item.list, new_item);
    }
}

exports.copy_specifications = function (specification_group_in_item, specification_list, new_item) {

    Specification_group.findOne({ name: specification_group_in_item.name, store_id: new_item.store_id }, function (error, new_specification_group) {
        if (new_specification_group) {
            Specification.find({ specification_group_id: new_specification_group._id }, function (error, new_specification_list) {
                if (new_specification_list.length > 0) {
                    var create_new_specification_group_for_item = {
                        'unique_id': specification_group_in_item.unique_id,
                        'range': specification_group_in_item.range, 'max_range': specification_group_in_item.max_range,
                        'type': specification_group_in_item.type, 'name': new_specification_group.name, 'sequence_number': specification_group_in_item.sequence_number,
                        'is_required': specification_group_in_item.is_required, '_id': new_specification_group._id.toString(), 'list': []
                    };
                    myUtils.add_new_specifications_and_group_into_item(specification_list, new_specification_list, create_new_specification_group_for_item, new_item);
                }
            });
        }
    });
}


exports.add_new_specifications_and_group_into_item = function (specification_list, new_specification_list, create_new_specification_group_for_item, new_item) {
    var list = [];
    var l = specification_list.length;
    var n_l = new_specification_list.length;

    for (var i = 0; i < n_l; i++) {
        var new_sep = new_specification_list[i];

        for (var j = 0; j < l; j++) {
            var sep = specification_list[j];

            if (new_sep.name[0] == sep.name[0]) {
                var new_list = { specification_group_id: create_new_specification_group_for_item._id.toString(), _id: new_sep._id.toString(), is_user_selected: sep.is_user_selected, is_default_selected: sep.is_default_selected, price: sep.price, name: new_sep.name, unique_id: new_sep.unique_id };
                list.push(new_list);
                break;
            }
        }
    }
    create_new_specification_group_for_item.list = list;
    Item.findOne({ _id: new_item._id }, function (error, item) {
        item.specifications.push(create_new_specification_group_for_item);
        item.save();
    });

}





// mail_notification main 

exports.mail_notification = function (to, sub, text, html) {
    Setting.findOne({}, function (error, setting) {
        var email = setting.email;
        var password = setting.password;
        try {
            if (email != "" && password != "") {
                u_name = email;
                psw = password;

                if (setting && setting.domain == 'gmail') {
                    smtp_configuration = {
                        service: 'gmail',
                        auth: {
                            user: u_name, // Your email id
                            pass: password // Your password
                        }
                    }
                } else {
                    var secure = false;
                    if (setting.smtp_port == 465) {
                        secure = true;
                    }

                    smtp_configuration = {
                        host: setting.smtp_host,
                        port: setting.smtp_port,
                        secure: secure,
                        auth: {
                            user: u_name,
                            pass: password
                        }
                    }
                }

                console.log(smtp_configuration)

                var transporter = nodemailer.createTransport(smtp_configuration);

                var mailOptions = {
                    from: u_name, // sender address
                    to: to, // list of receivers
                    subject: sub, // Subject line
                    text: text, //, /// plaintext body
                    html: html
                }
                console.log("PART")
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log("-------ERROR------");
                        console.log(error);
                    } else {
                        console.log("------INFO------");
                        console.log(info);
                    }
                });
            }

        } catch (error) {
            console.error(error);

        }

    });

};


// sms_notification main 
exports.sendSMS = function (to, msg) {
    Setting.findOne({}, function (error, setting_detail) {
        console.log("-------inside sms-------");
        var sms_gateway_id = setting_detail.sms_gateway_id;

        Sms_gateway.findOne({ _id: sms_gateway_id }, function (err, sms_gateway_detail) {
            if (sms_gateway_detail) {

                var sms_auth_id = sms_gateway_detail.sms_auth_id;
                var sms_auth_token = sms_gateway_detail.sms_auth_token;
                var sms_number = sms_gateway_detail.sms_number;

                if (sms_auth_id != "" && sms_auth_token != "" && sms_number != "") {3
                    const client = require('twilio')(
                        sms_auth_id,
                        sms_auth_token
                    );

                    try {
                        client.messages.create({
                            to: to,
                            from: sms_number,
                            body: msg
                        }).then((messsage) => {
                            console.log(message);
                        }, (error) => {
                            console.log(error)
                        });
                    } catch (error) {
                        console.error(error);
                    }

                }
            }
        });
    });
};


exports.getDistanceFromTwoLocation = function (fromLocation, toLocation) {
    try {
        var lat1 = fromLocation[0];
        var lat2 = toLocation[0];
        var lon1 = fromLocation[1];
        var lon2 = toLocation[1];

        var R = 6371; // km (change this constant to get miles)
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;

    } catch (error) {
        console.error(error);
    }
};


exports.getIosCertiFolderName = function (id) {
    switch (id) {
        case 1:// ios_push
            return 'ios_push/';

        default:
            break;
    }
};

exports.saveIosCertiFolderPath = function (id) {
    return './app/' + myUtils.getIosCertiFolderName(id);
};

exports.saveIosCertiFromBrowser = function (local_image_path, image_name, id) {
    var bf = new Buffer(100000);
    var file_new_path = myUtils.saveIosCertiFolderPath(id) + image_name;
    fs.readFile(local_image_path, function (error, data) {
        fs.writeFile(file_new_path, data, 'binary', function (error) {
            if (error) {
                console.log("Save file : " + error);
            } else {
                if (fs.existsSync(local_image_path)) {
                    fs.unlink(local_image_path, function (error, file) {
                        if (error) {
                            console.error(error);
                        } else {
                            console.log('successfully remove image');
                        }
                        console.log("certi uploaded successfully");
                    })
                }
            }
        });
    });




};

exports.generateReferralCode = function (user_type, country_code = 'IN', first_name, last_name) {
    var referral_code = "";
    try {
        var length = 8;
        var possible = (new Date()).getTime() + first_name.toUpperCase() + last_name.toUpperCase();

        for (var i = 0; i < length; i++)
            referral_code += possible.charAt(Math.floor(Math.random() * possible.length));

    } catch (error) {
        referral_code = "" + (new Date()).getTime();
        referral_code = referral_code.substring(referral_code.length - 8, referral_code.length);
    }
    referral_code = country_code.toUpperCase() + referral_code;
    referral_code = referral_code.replace(/\s+/g, '');
    return referral_code;
};




exports.encryptPassword = function (password) {
    var crypto = require('crypto');
    try {
        return crypto.createHash('md5').update(password).digest('hex');
    } catch (error) {
        console.error(error);
    }
};

////////////// TOKEN GENERATE ////////
exports.generateServerToken = function (length) {
    try {
        if (typeof length == "undefined")
            length = 32
        var token = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < length; i++)
            token += possible.charAt(Math.floor(Math.random() * possible.length));
        return token;
    } catch (error) {
        console.error(error);
    }

};

exports.generateQRCode = async function (store_data, table_id, callback) {
    // new Promise((resolve, reject) => {
        try {
            let token = myUtils.generatorRandomChar(16)
            console.log(token)
            let image_url = 'qr/' + token + '.svg'
            let image_path = './uploads/' + image_url
            QR.toFile(image_path, "https://user.blackwinglogistics.com/store?store_id=" + store_data.store_id + '&table_id=' + table_id + '&token=' + token, {}, function (err) {
                if (err) {
                    console.log(err)
                    callback(null)
                } else {
                    callback({image_url, token})
                }
            })
        } catch (error) {
            console.log(error)
            callback(null)
        }
    // })
}

exports.generatorRandomChar = function (length) {
    try {
        if (typeof length === "undefined")
            length = 2;
        var token = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (var i = 0; i < length; i++)
            token += possible.charAt(Math.floor(Math.random() * possible.length));
        return token;
    } catch (error) {
        console.error(error);
    }
};

exports.generatePassword = function (length) {
    try {
        if (typeof length === "undefined")
            length = 6;
        var password = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < length; i++)
            password += possible.charAt(Math.floor(Math.random() * possible.length));
        return password;
    } catch (error) {
        console.error("error" + error);
    }
};

exports.generateOtp = function (length) {
    try {
        if (typeof length === "undefined")
            length = 32;
        var otpCode = "";
        var possible = "0123456789";
        for (var i = 0; i < length; i++)
            otpCode += possible.charAt(Math.floor(Math.random() * possible.length));
        return otpCode;
    } catch (error) {
        console.error(error);
    }

};

exports.generateUniqueCode = function (length) {
    try {
        if (typeof length === "undefined")
            length = 6;
        var UniqueCode = "";
        var possible = "123456789";
        for (var i = 0; i < length; i++)
            UniqueCode += possible.charAt(Math.floor(Math.random() * possible.length));
        return UniqueCode;
    } catch (error) {
        console.error(error);
    }

};

exports.getTimeDifferenceInSecond = function (endDate, startDate) {
    var difference = 0;
    var startDateFormat = moment(startDate, DATE_FORMATE.YYYY_MM_DD_HH_MM_SS);
    var endDateFormat = moment(endDate, DATE_FORMATE.YYYY_MM_DD_HH_MM_SS);
    difference = endDateFormat.diff(startDateFormat, 'seconds');
    difference = (difference.toFixed(2));
    return difference;
};

exports.getTimeDifferenceInMinute = function (endDate, startDate) {

    var difference = 0;
    var startDateFormat = moment(startDate, DATE_FORMATE.YYYY_MM_DD_HH_MM_SS);
    var endDateFormat = moment(endDate, DATE_FORMATE.YYYY_MM_DD_HH_MM_SS);
    difference = endDateFormat.diff(startDateFormat, 'minutes')
    difference = (difference.toFixed(2));
    return difference;
};





exports.getImageFolderName = function (id) {
    switch (id) {
        case FOLDER_NAME.USER_PROFILES:
            return 'user_profiles/';
        case FOLDER_NAME.USER_DOCUMENTS:
            return 'user_documents/';
        case FOLDER_NAME.PROVIDER_PROFILES:
            return 'provider_profiles/';
        case FOLDER_NAME.PROVIDER_DOCUMENTS:
            return 'provider_documents/';
        case FOLDER_NAME.STORE_PROFILES:
            return 'store_profiles/';
        case FOLDER_NAME.STORE_DOCUMENTS:
            return 'store_documents/';
        case FOLDER_NAME.STORE_PRODUCTS:
            return 'store_products/';
        case FOLDER_NAME.STORE_PRODUCTS_GROUP:
            return 'store_products_group/';
        case FOLDER_NAME.PICKUP_ORDER_IMAGES:
            return 'pickup_order_images/';
        case FOLDER_NAME.ARRIVED_ORDER_IMAGES:
            return 'arrived_order_images/';
        case FOLDER_NAME.STORE_ITEMS:
            return 'store_items/';
        case FOLDER_NAME.CART_ITEMS:
            return 'cart_items/';
        case FOLDER_NAME.DELIVERY_TYPE_IMAGES:
            return 'delivery_type_images/';
        case FOLDER_NAME.DELIVERY_ICON_IMAGES:
            return 'delivery_icon_images/';
        case FOLDER_NAME.DELIVERY_MAP_PIN_IMAGES:
            return 'delivery_map_pin_images/';
        case FOLDER_NAME.SERVICE_TYPE_IMAGES:
            return 'service_type_images/';
        case FOLDER_NAME.SERVICE_TYPE_MAP_PIN_IMAGES:
            return 'service_type_map_pin_images/';

        case FOLDER_NAME.PAYMENT_IMAGES:
            return 'payment_images/';
        case FOLDER_NAME.PAYMENT_SELECTED_IMAGES:
            return 'payment_selected_images/';

        case FOLDER_NAME.MAP_PIN_IMAGES:
            return 'map_pin_images/';
        case FOLDER_NAME.EMAIL_IMAGES:
            return 'email_images/';
        case FOLDER_NAME.WEB_IMAGES:
            return 'web_images/';

        case FOLDER_NAME.ADS_MOBILE_IMAGES:
            return 'ads_mobile_images/';
        case FOLDER_NAME.ADS_WEB_IMAGES:
            return 'ads_web_images/';

        case FOLDER_NAME.PROVIDER_VEHICLE_DOCUMENTS:
            return 'provider_vehicle_documents/';
        case FOLDER_NAME.PROMO_IMAGES:
            return 'promo_images/'
        case FOLDER_NAME.TABLE_IMAGES:
            return 'table_images/'
        
        case FOLDER_NAME.SEO_OG_IMAGES:
            return 'seo_og_images/' 

        case FOLDER_NAME.SUB_CATEGORY_IMAGES:
            return 'sub_category_images/'
            
        default:
            break;
    }
};

exports.getStoreImageFolderPath = function (id) {
    return myUtils.getImageFolderName(id);
};



exports.getSaveImageFolderPathForLogo = function (id) {
    return './uploads/' + myUtils.getImageFolderName(id);
};

exports.storeImageToFolderForLogo = function (local_image_path, image_name, id) {
    var bf = new Buffer(100000);
    var file_new_path = myUtils.getSaveImageFolderPathForLogo(id) + image_name;

    fs.readFile(local_image_path, function (error, data) {
        console.log(data);
        console.log("Read file : " + error);
        fs.writeFile(file_new_path, data, 'binary', function (error) {
            if (error) {
                console.log("Save file : " + error);
            } else {
                fs.unlink(local_image_path, function (err) {
                    console.log(err)
                });
                console.log("File uploaded successfully");
            }
        });
    });
}




exports.getSaveImageFolderPath = function (id) {
    if (setting_detail.is_use_aws_bucket) {
        return myUtils.getImageFolderName(id);
    } else {
        return './uploads/' + myUtils.getImageFolderName(id);
    }
};

var AWS = require('aws-sdk')
exports.storeImageToFolder = function (local_image_path, image_name, id) {
    var file_new_path = myUtils.getSaveImageFolderPath(id) + image_name;
    if (setting_detail.is_use_aws_bucket) {
        AWS.config.update({ accessKeyId: setting_detail.access_key_id, secretAccessKey: setting_detail.secret_key_id });
        fs.readFile(local_image_path, function (err, data) {
            var s3 = new AWS.S3();
            var base64data = new Buffer(data, 'binary');
            s3.putObject({
                Bucket: setting_detail.aws_bucket_name,
                Key: file_new_path,
                Body: base64data,
                ACL: 'public-read'
            }, function (resp, data) {
                console.log(data)
            });
            if (fs.existsSync(local_image_path)) {
                fs.unlinkSync(local_image_path);
            }
        });
    } else {
        if (id == FOLDER_NAME.STORE_PRODUCTS || id == FOLDER_NAME.STORE_ITEMS || id == FOLDER_NAME.STORE_PROFILES || id == FOLDER_NAME.DELIVERY_TYPE_IMAGES) {
            const sharp = require('sharp');
            sharp(local_image_path).resize({ width: 500, height: 400 }).toFile(file_new_path)
                .then(function (newFileInfo) {
                    console.log("Success Max");
                })
                .catch(function (err) {
                    console.log("Error occured");
                });
            sharp(local_image_path).resize({ width: 250, height: 200 }).toFile(file_new_path.replace(".jpg", "_md.jpg").replace(".jpeg", "_md.jpeg").replace(".png", "_md.png"))
                .then(function (newFileInfo) {
                    console.log("Success Medium");
                })
                .catch(function (err) {
                    console.log("Error occured");
                });
            sharp(local_image_path).resize({ width: 100, height: 80 }).toFile(file_new_path.replace(".jpg", "_sm.jpg").replace(".jpeg", "_md.jpeg").replace(".png", "_md.png"))
                .then(function (newFileInfo) {
                    console.log("Success");
                })
                .catch(function (err) {
                    console.log("Error occured small");
                });
        } else {

            fs.readFile(local_image_path, function (error, data) {
                fs.writeFile(file_new_path, data, 'binary', function (error) {
                    if (error) {
                        console.log("Save file : " + error);
                    } else {
                        if (fs.existsSync(local_image_path)) {
                            fs.unlinkSync(local_image_path);
                        }

                        /*INPUT_path_to_your_images = './temp/' + myUtils.getImageFolderName(id) + image_name;
                        OUTPUT_path = 'uploads/' + myUtils.getImageFolderName(id);
                        var compress_images = require('compress-images'), INPUT_path_to_your_images, OUTPUT_path;
                        compress_images(INPUT_path_to_your_images, OUTPUT_path, {compress_force: false, statistic: true, autoupdate: true}, false,
                            {jpg: {engine: 'mozjpeg', command: ['-quality', '60']}},
                            {png: {engine: 'pngquant', command: ['--quality=20-50']}},
                            {svg: {engine: 'svgo', command: '--multipass'}},
                            {gif: {engine: 'gifsicle', command: ['--colors', '64', '--use-col=web']}}, function (error, data) {
                                if (error)
                                {
                                    console.log(error);
                                } else
                                {
                                    
                                }
                            });*/
                    }
                });
            });
        }
    }


}


exports.deleteImageFromFolder = function (old_img_path, id) {

    if (old_img_path != "" || old_img_path != null) {

        var old_file_name = old_img_path.split('/');

        var fs = require('fs');
        var bf = new Buffer(100000);
        var http = require('http');

        var old_file_path = myUtils.getSaveImageFolderPath(id) + old_file_name[1];

        if (setting_detail.is_use_aws_bucket) {
            AWS.config.update({ accessKeyId: setting_detail.access_key_id, secretAccessKey: setting_detail.secret_key_id });
            var s3 = new AWS.S3();
            s3.deleteObject({
                Bucket: setting_detail.aws_bucket_name,
                Key: old_file_path
            }, function (err, data) { })
        } else {
            if (fs.existsSync(old_file_path)) {
                fs.unlink(old_file_path, function (error, file) {
                    if (error) {
                        console.error(error);
                    } else {
                        console.log('successfully remove image');
                    }
                });
            }
            if (id == FOLDER_NAME.STORE_PRODUCTS || id == FOLDER_NAME.STORE_ITEMS || id == FOLDER_NAME.STORE_PROFILES || id == FOLDER_NAME.DELIVERY_TYPE_IMAGES) {
                if (fs.existsSync(old_file_path)) {
                    fs.unlink(old_file_path.replace(".jpg", "_md.jpg").replace(".jpeg", "_md.jpeg").replace(".png", "_md.png"), function (error, file) {
                        if (error) {
                            console.error(error);
                        } else {
                            console.log('successfully remove image');
                        }
                    });
                    fs.unlink(old_file_path.replace(".jpg", "_sm.jpg").replace(".jpeg", "_sm.jpeg").replace(".png", "_sm.png"), function (error, file) {
                        if (error) {
                            console.error(error);
                        } else {
                            console.log('successfully remove image');
                        }
                    });
                }
            }
        }
    }

}



exports.sendPushNotification = function (app_type, device_type, device_token, messageCode, soundFileName) {

    console.log('sendPushNotification = ' + device_token)

    if (device_type == DEVICE_TYPE.ANDROID) {
        Installation_setting.findOne({}, function (err, installation_setting) {
            var android_provider_app_gcm_key = installation_setting.android_provider_app_gcm_key;
            var android_user_app_gcm_key = installation_setting.android_user_app_gcm_key;
            var android_store_app_gcm_key = installation_setting.android_store_app_gcm_key;

            var gcm = require('node-gcm');
            var message = new gcm.Message();
            message.addData('message', messageCode);
            //message.addData('message1', extra_param);
            var regTokens = [device_token];
            var sender_key;

            if (app_type == ADMIN_DATA_ID.PROVIDER) {
                sender_key = android_provider_app_gcm_key;
            } else if (app_type == ADMIN_DATA_ID.USER) {
                sender_key = android_user_app_gcm_key;
            } else if (app_type == ADMIN_DATA_ID.STORE) {
                sender_key = android_store_app_gcm_key;
            }

            /// Set up the sender with you API key
            var sender = new gcm.Sender(sender_key);
            /// Now the sender can be used to send messages
            try {
                sender.send(message, { registrationTokens: regTokens }, function (error, response) {
                    if (error) {
                        console.error(error);
                    } else {
                        console.log(response);
                    }
                });
                sender.sendNoRetry(message, { topic: '/topics/global' }, function (error, response) {
                    if (err) {
                        console.error(error);
                    } else {
                        console.log(response);
                    }
                });
            } catch (error) {
                console.error(error);
            }

        });

    }

    if (device_type == DEVICE_TYPE.WEB) {
        if (app_type == ADMIN_DATA_ID.USER) {
            io.emit('push' + device_token, {
                messageCode: messageCode,
                messageData: null,
                messageData2: null
            });
        } else if (app_type == ADMIN_DATA_ID.STORE) {
            io.emit('store' + device_token, {
                messageCode: messageCode,
                messageData: null,
                messageData2: null
            })
        }
    }

    /////////////// IOS PUSH NOTIFICATION ///////////
    if (device_type == DEVICE_TYPE.IOS) {
        if (device_token == "" || device_token == null) {
            console.log("IOS PUSH NOTIFICATION NOT SENT");
        } else {
            console.log("IOS PUSH NOTIFICATION");
            // var path = require('path');
            // var apnError = function (error) {
            //     console.log("APN Error:", error);
            // }

            // var cert_file_name;
            // var ios_key_name;
            var ios_passphrase;


            Installation_setting.findOne({}, function (error, installation_setting) {

                // var provider_passphrase = installation_setting.provider_passphrase;
                // var user_passphrase = installation_setting.user_passphrase;
                // var store_passphrase = installation_setting.store_passphrase;

                var user_certificate_mode = installation_setting.user_certificate_mode;
                var provider_certificate_mode = installation_setting.provider_certificate_mode;
                var store_certificate_mode = installation_setting.store_certificate_mode;
                var ios_push_certificate_path = installation_setting.ios_push_certificate_path;

                var teamId = installation_setting.team_id;
                var keyId = installation_setting.key_id;
                var bundle_id;


                var cert_file_name = IOS_PUSH_FILE_NAME.IOS_CERT_FILE_NAME;
                cert_file_name = path.join(ios_push_certificate_path, cert_file_name)
                if (app_type == ADMIN_DATA_ID.PROVIDER) {
                    // cert_file_name = IOS_PUSH_FILE_NAME.IOS_PROVIDER_CERT_FILE_NAME;
                    // ios_key_name = IOS_PUSH_FILE_NAME.IOS_PROVIDER_KEY_FILE_NAME;
                    // ios_passphrase = provider_passphrase;
                    ios_certificate_mode = provider_certificate_mode;
                    bundle_id = installation_setting.provider_bundle_id;
                } else if (app_type == ADMIN_DATA_ID.USER) {
                    // cert_file_name = IOS_PUSH_FILE_NAME.IOS_USER_CERT_FILE_NAME;
                    // ios_key_name = IOS_PUSH_FILE_NAME.IOS_USER_KEY_FILE_NAME;
                    // ios_passphrase = user_passphrase;
                    ios_certificate_mode = user_certificate_mode;
                    bundle_id = installation_setting.user_bundle_id;
                } else if (app_type == ADMIN_DATA_ID.STORE) {
                    // cert_file_name = IOS_PUSH_FILE_NAME.IOS_STORE_CERT_FILE_NAME;
                    // ios_key_name = IOS_PUSH_FILE_NAME.IOS_STORE_KEY_FILE_NAME;
                    // ios_passphrase = store_passphrase;
                    ios_certificate_mode = store_certificate_mode;
                    bundle_id = installation_setting.store_bundle_id;
                }


                // cert_file_name = path.join(ios_push_certificate_path, cert_file_name);
                // ios_key_name = path.join(ios_push_certificate_path, ios_key_name);




                try {

                    var is_production = false
                    if (ios_certificate_mode == "production") {
                        // gateway = "gateway.push.apple.com";
                        is_production = true;
                    } else {
                        // gateway = "gateway.sandbox.push.apple.com";
                        is_production = false;
                    }

                    var options = {
                        token: {
                            key: cert_file_name,
                            keyId: keyId,
                            teamId: teamId
                        },
                        production: is_production
                    };

                    var apnProvider = new apn.Provider(options);
                    var note = new apn.Notification();
                    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                    note.badge = 1;
                    note.sound = 'default';
                    note.alert = { "loc-key": messageCode, "id": messageCode };
                    note.payload = { 'messageFrom': 'Caroline' };
                    note.topic = bundle_id;
                    apnProvider.send(note, device_token).then((result) => {
                        console.log(result);
                    });

                    // var options = {
                    //     cert: cert_file_name,
                    //     key: ios_key_name,
                    //     "passphrase": ios_passphrase,
                    //     "gateway": gateway,
                    //     "port": 2195,
                    //     "enhanced": true,
                    //     "cacheLength": 5
                    // };
                    // options.errorCallback = apnError;
                    // var apnConnection = new apn.Connection(options);
                    // var myDevice = new apn.Device(device_token);
                    // var note = new apn.Notification();
                    // note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                    // note.badge = 3;
                    // note.sound = "default";
                    // note.alert = {"loc-key": messageCode, "id": messageCode};
                    // //note.alert = {"loc-key": messageCode, "id": messageCode , "extra":extra_param};
                    // note.payload = {'messageFrom': 'Caroline'};
                    // apnConnection.pushNotification(note, myDevice);
                    //});
                } catch (err) {
                    console.log(err);
                }

            });

        }
    }


};

// sendPushNotificationWithPushData
exports.sendPushNotificationWithPushData = function (app_type, device_type, device_token, messageCode, soundFileName, push_data1, push_data2) {

    console.log('sendPushNotificationWithPushData = ' + device_token)

    if (device_type == DEVICE_TYPE.ANDROID) {
        Installation_setting.findOne({}, function (err, installation_setting) {
            var android_provider_app_gcm_key = installation_setting.android_provider_app_gcm_key;
            var android_user_app_gcm_key = installation_setting.android_user_app_gcm_key;
            var android_store_app_gcm_key = installation_setting.android_store_app_gcm_key;
            console.log("ANDROID PUSH NOTIFICATION");
            var gcm = require('node-gcm');
            var message = new gcm.Message();
            message.addData('message', messageCode);
            message.addData('push_data1', push_data1);
            message.addData('push_data2', push_data2);
            var regTokens = [device_token];
            var sender_key;

            if (app_type == ADMIN_DATA_ID.PROVIDER) {
                sender_key = android_provider_app_gcm_key;
            } else if (app_type == ADMIN_DATA_ID.USER) {
                sender_key = android_user_app_gcm_key;
            } else if (app_type == ADMIN_DATA_ID.STORE) {
                sender_key = android_store_app_gcm_key;
            }

            if (STORE_PUSH_CODE.NEW_ORDER == messageCode) {
                message.addData('sound', 'request_sound');
                message.addNotification('body_loc_key', 'push_' + messageCode);
                message.addNotification('android_channel_id', 'newOrder');
                message.addNotification('sound', 'request_sound');
              }

              if(PROVIDER_PUSH_CODE.NEW_ORDER == messageCode){
                message.addData('sound', 'request_sound');
                message.addNotification('body_loc_key', 'push_message_' + messageCode);
                message.addNotification('android_channel_id', 'newOrder');
                message.addNotification('sound', 'request_sound');
              }

            /// Set up the sender with you API key
            var sender = new gcm.Sender(sender_key);
            /// Now the sender can be used to send messages
            try {
                sender.send(message, { registrationTokens: regTokens }, function (error, response) {
                    if (error) {
                        console.error(error);
                    } else {
                        console.log(response);
                    }
                });
                sender.sendNoRetry(message, { topic: '/topics/global' }, function (error, response) {
                    if (err) {
                        console.error(error);
                    }
                });
            } catch (error) {
                console.error(error);
            }

        });

    }

    if (device_type == DEVICE_TYPE.WEB) {
        if (app_type == ADMIN_DATA_ID.USER) {
            io.emit('push' + device_token, {
                messageCode: messageCode,
                messageData: push_data1,
                messageData2: push_data2
            });
        } else if (app_type == ADMIN_DATA_ID.STORE) {
            io.emit('store' + device_token, {
                messageCode: messageCode,
                messageData: push_data1,
                messageData2: push_data2
            })
        }
    }

    if (device_type == DEVICE_TYPE.IOS) {
        if (device_token == "" || device_token == null) {
            console.log("IOS PUSH NOTIFICATION NOT SENT");
        } else {
            console.log("IOS PUSH NOTIFICATION");
            var ios_passphrase;

            Installation_setting.findOne({}, function (error, installation_setting) {

                // var provider_passphrase = installation_setting.provider_passphrase;
                // var user_passphrase = installation_setting.user_passphrase;
                // var store_passphrase = installation_setting.store_passphrase;

                var user_certificate_mode = installation_setting.user_certificate_mode;
                var provider_certificate_mode = installation_setting.provider_certificate_mode;
                var store_certificate_mode = installation_setting.store_certificate_mode;
                var ios_push_certificate_path = installation_setting.ios_push_certificate_path;

                var teamId = installation_setting.team_id;
                var keyId = installation_setting.key_id;
                var bundle_id;


                var cert_file_name = IOS_PUSH_FILE_NAME.IOS_CERT_FILE_NAME;
                cert_file_name = path.join(ios_push_certificate_path, cert_file_name)
                if (app_type == ADMIN_DATA_ID.PROVIDER) {
                    ios_certificate_mode = provider_certificate_mode;
                    bundle_id = installation_setting.provider_bundle_id;
                } else if (app_type == ADMIN_DATA_ID.USER) {
                    ios_certificate_mode = user_certificate_mode;
                    bundle_id = installation_setting.user_bundle_id;
                } else if (app_type == ADMIN_DATA_ID.STORE) {
                    ios_certificate_mode = store_certificate_mode;
                    bundle_id = installation_setting.store_bundle_id;
                }

                try {

                    var is_production = false
                    if (ios_certificate_mode == "production") {
                        is_production = true;
                    } else {
                        is_production = false;
                    }

                    var options = {
                        token: {
                            key: cert_file_name,
                            keyId: keyId,
                            teamId: teamId
                        },
                        production: is_production
                    };

                    var apnProvider = new apn.Provider(options);
                    var note = new apn.Notification();
                    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                    note.badge = 1;
                    note.sound = 'default';
                    note.alert = { "loc-key": messageCode, "id": messageCode, "push_data1": push_data1, "push_data2": push_data2 };
                    note.payload = { 'messageFrom': 'Caroline' };
                    note.topic = bundle_id;
                    apnProvider.send(note, device_token).then((result) => {
                        console.log(result)
                    });
                } catch (err) {
                    console.log(err);
                }

            });

        }
    }

    /////////////// IOS PUSH NOTIFICATION ///////////
    // if (device_type == DEVICE_TYPE.IOS) {
    //     if (device_token == "" || device_token == null) {
    //         console.log("IOS PUSH NOTIFICATION NOT SENT");
    //     } else {
    //         console.log("IOS PUSH NOTIFICATION");
    //         var apn = require("apn")
    //         var path = require('path');
    //         var apnError = function (error) {
    //             console.log("APN Error:", error);
    //         }

    //         var cert_file_name;
    //         var ios_key_name;
    //         var ios_passphrase;

    //         Installation_setting.findOne({}, function (error, installation_setting) {

    //             var provider_passphrase = installation_setting.provider_passphrase;
    //             var user_passphrase = installation_setting.user_passphrase;
    //             var store_passphrase = installation_setting.store_passphrase;

    //             var user_certificate_mode = installation_setting.user_certificate_mode;
    //             var provider_certificate_mode = installation_setting.provider_certificate_mode;
    //             var store_certificate_mode = installation_setting.store_certificate_mode;
    //             var ios_push_certificate_path = installation_setting.ios_push_certificate_path;



    //             if (app_type == ADMIN_DATA_ID.PROVIDER) {
    //                 cert_file_name = IOS_PUSH_FILE_NAME.IOS_PROVIDER_CERT_FILE_NAME;
    //                 ios_key_name = IOS_PUSH_FILE_NAME.IOS_PROVIDER_KEY_FILE_NAME;
    //                 ios_passphrase = provider_passphrase;
    //                 ios_certificate_mode = provider_certificate_mode;
    //             } else if (app_type == ADMIN_DATA_ID.USER) {
    //                 cert_file_name = IOS_PUSH_FILE_NAME.IOS_USER_CERT_FILE_NAME;
    //                 ios_key_name = IOS_PUSH_FILE_NAME.IOS_USER_KEY_FILE_NAME;
    //                 ios_passphrase = user_passphrase;
    //                 ios_certificate_mode = user_certificate_mode;
    //             } else if (app_type == ADMIN_DATA_ID.STORE) {
    //                 cert_file_name = IOS_PUSH_FILE_NAME.IOS_STORE_CERT_FILE_NAME;
    //                 ios_key_name = IOS_PUSH_FILE_NAME.IOS_STORE_KEY_FILE_NAME;
    //                 ios_passphrase = store_passphrase;
    //                 ios_certificate_mode = store_certificate_mode;
    //             }


    //             cert_file_name = path.join(ios_push_certificate_path, cert_file_name);
    //             ios_key_name = path.join(ios_push_certificate_path, ios_key_name);


    //             try
    //             {


    //                 if (ios_certificate_mode == "production")
    //                 {
    //                     gateway = "gateway.push.apple.com";
    //                     console.log("gateway : " + gateway);

    //                 } else
    //                 {
    //                     gateway = "gateway.sandbox.push.apple.com";
    //                     console.log("gateway : " + gateway);
    //                 }
    //                 var options = {
    //                     cert: cert_file_name,
    //                     key: ios_key_name,
    //                     "passphrase": ios_passphrase,
    //                     "gateway": gateway,
    //                     "port": 2195,
    //                     "enhanced": true,
    //                     "cacheLength": 5
    //                 };
    //                 options.errorCallback = apnError;
    //                 var apnConnection = new apn.Connection(options);
    //                 var myDevice = new apn.Device(device_token);
    //                 var note = new apn.Notification();
    //                 note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    //                 note.badge = 3;
    //                 note.sound = "default";
    //                 note.alert = {"loc-key": messageCode, "id": messageCode, "push_data1": push_data1, "push_data2": push_data2};
    //                 //note.alert = {"loc-key": messageCode, "id": messageCode , "extra":extra_param};
    //                 note.payload = {'messageFrom': 'Caroline'};
    //                 apnConnection.pushNotification(note, myDevice);
    //                 //});
    //             } catch (err)
    //             {
    //                 console.log(err);
    //             }

    //         });

    //     }
    // }


};



//var DELIVERY_TYPES = [
//    {id: DELIVERY_TYPE.STORE, name: DELIVERY_TYPE_STRING.STORE_STRING},
//    {id: DELIVERY_TYPE.COURIER, name: DELIVERY_TYPE_STRING.COURIER_STRING}
//];
//
//
//exports.DELIVERY_TYPES = function () {
//    return DELIVERY_TYPES;
//};

exports.get_date_in_citytimezone = function (date, timezone) {
    var convert_date = new Date(date);
    var zone_time_diff = moment_timezone.tz.zone(timezone).utcOffset(moment_timezone.utc());
    convert_date.setMinutes(convert_date.getMinutes() + zone_time_diff);
    convert_date = new Date(convert_date);
    return convert_date;
};

exports.get_date_in_city_timezone = function (date, timezone) {
    var convert_date = new Date(date);
    var zone_time_diff = -1 * moment_timezone.tz.zone(timezone).utcOffset(moment_timezone.utc());
    convert_date.setMinutes(convert_date.getMinutes() + zone_time_diff);
    convert_date = new Date(convert_date);
    return convert_date;
};

exports.get_next_date_in_city_timezone = function (date, timezone) {
    //    console.log("*   *   *   *   *   *");    
    //    console.log("Date                        : " + date);  
    //    console.log("Timezone                    : " + timezone);  

    var convert_date = new Date(date);
    var zone_time_diff = moment_timezone.tz.zone(timezone).utcOffset(moment_timezone.utc());

    //start_date = start_date.setHours(0, zone_time_diff, 0, 0);
    convert_date.setMinutes(convert_date.getMinutes() + zone_time_diff);
    convert_date = new Date(convert_date);
    return convert_date;
};

exports.get_date_in_utc_from_city_date = function (date, timezone) { // use when you convert date to UTC time zone
    var convert_date = new Date(date);
    var zone_time_diff = moment_timezone.tz.zone(timezone).utcOffset(moment_timezone.utc());
    convert_date.setMinutes(convert_date.getMinutes() + zone_time_diff);
    convert_date = new Date(convert_date);
    return convert_date;
};

exports.get_date_now_at_city = function (date, timezone) { // use when you convert date now to city timezone
    var convert_date = new Date(date);
    var zone_time_diff = moment_timezone.tz.zone(timezone).utcOffset(moment_timezone.utc());
    zone_time_diff = -1 * zone_time_diff;
    convert_date.setMinutes(convert_date.getMinutes() + zone_time_diff);
    convert_date = new Date(convert_date);
    return convert_date;
};

exports.getNewPhoneNumberFromOldNumber = function (phone) {
    var phone_length = phone.length;
    var new_phone = "";
    var max = 4;

    if (phone_length < max) {
        max = phone_length;
    }

    for (var i = 0; i < max; i++) {
        new_phone = new_phone + "0";
    }

    if (phone_length > max) {
        new_phone = new_phone + phone.substr(max);
    }

    return new_phone;
}

// Make Email Token from id (id length should be >9 and <=99) and Token(length = 300)
exports.getEmailTokenUsingID = function (id) {

    id = id.toString();
    var server_token = "";
    var milli_length = 15;
    var milli_seconds = "" + (new Date).getTime();
    var id_length = id.length;
    var token_size = id_length + milli_length // 13 for milli seconds
    server_token = myUtils.generateServerToken(token_size);

    milli_seconds = milli_seconds.split("").reverse().join("");

    // ADD MILLI IN TOKEN
    var email_token = "";
    var l = milli_seconds.length;
    for (var i = 0; i < milli_length; i++) {
        if (i < l) {
            email_token = email_token + milli_seconds.charAt(i) + server_token.charAt(i);
        } else {
            email_token = email_token + '0' + server_token.charAt(i);
        }
    }

    for (var i = 0; i < id_length; i++) {
        email_token = email_token + id.charAt(i) + server_token.charAt(i + milli_length);
    }

    return { server_token: server_token, email_token: email_token };
}

// Get id from Email Token (length = 300)
exports.getIDFromEmailToken = function (token) {

    var token_size = parseInt(token.substr(token.length - 2));
    var count = 1;
    var id = "";
    for (i = 0; i < token_size; i++) {
        count = count + i;
        id = id + token[count];
    }
    return id;
}

exports.getCurrencyConvertRate = function (from_amount, from_currency, to_currency, return_data) {

    var request = require('request');
    if (from_currency == to_currency) {
        return_data({ success: true, current_rate: 1 });
        return;
    }
    var base_url = "http://free.currencyconverterapi.com/api/v5/convert?";
    var tag = from_currency + "_" + to_currency;
    var url = base_url + "q=" + tag + "&compact=y";

    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            try {
                var json_obj = JSON.parse(body);
                var value = json_obj[tag]["val"];
                if (from_amount != 1) {
                    value = value * from_amount;
                }
                return_data({ success: true, current_rate: myUtils.precisionRound(Number(value), 4) });
            } catch (err) {
                return_data({ success: true, current_rate: 1 });
            }

        } else {
            return_data({ success: false });

        }
    });
};

// getCurrencyConvertRate
exports.getCurrencyConvertRate_old = function (from_amount, from_currency, to_currency, return_data) {
    var cheerio = require('cheerio');
    var request = require('request');
    if (from_currency == to_currency) {
        return_data({ success: true, current_rate: 1 });
        return;
    }
    var base_url = "https://finance.google.com/finance/converter?";
    var url = base_url + "a=" + from_amount + "&from=" + from_currency + "&to=" + to_currency;
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            try {
                $ = cheerio.load(body);
                var value = $('span[class=bld]').html();
                var parts = value.split(' ');
                return_data({ success: true, current_rate: myUtils.precisionRound(Number(parts[0]), 4) });

            } catch (err) {
                return_data({ success: true, current_rate: 1 });
            }
        } else {
            return_data({ success: false });
            console.log("ERROR");
        }
    });
};


// getCurrencyConvertRate
exports.getCurrencyConvertRate_old = function (from_currency, to_currency) {
    const converter = require('google-currency')
    var current_rate = 1;
    console.log("from_currency : " + from_currency);
    console.log("to_currency : " + to_currency);
    const options = {
        from: from_currency,
        to: to_currency,
        amount: 1
    }
    converter(options).then(value => {
        current_rate = value.converted;
        return current_rate;
    });



}

exports.insert_documets_for_new_users = function (new_user_data, user_type_id, document_for, country_id, response) {
    if (country_id) {
        Document.find({ country_id: country_id, document_for: document_for }, async function (error, documents) {

            var is_document_uploaded = true;

            if (documents.length == 0) {
                is_document_uploaded = true;
                new_user_data.is_document_uploaded = is_document_uploaded;

                if (response) {
                    response({ is_document_uploaded: is_document_uploaded })
                }
            } else {
                // documentCount
                let documentCount = 1;
                let document_count = await Document_uploaded_list.findOne({}).lean().select({ unique_id: 1 }).sort({ unique_id: -1 });
                if (document_count) {
                    documentCount = document_count.unique_id + 1;
                }
                // end documentCount
                documents.forEach((document, index) => {
                    console.log(document);
                    if (document.is_mandatory && is_document_uploaded && document.is_show) {
                        is_document_uploaded = false;
                        new_user_data.is_document_uploaded = is_document_uploaded;

                    }
                    var document_uploaded_list = new Document_uploaded_list({
                        unique_id: documentCount + index,
                        user_id: new_user_data._id,
                        user_type_id: user_type_id,
                        document_id: document._id,
                        document_for: document.document_for,
                        unique_code: "",
                        expired_date: null,
                        image_url: ""
                    });
                    document_uploaded_list.save(function (error) {

                    });
                });
                if (response) {
                    console.log(response);
                    response({ is_document_uploaded: is_document_uploaded })
                }

            }
        });
    } else {
        response({ is_document_uploaded: true })
    }
};


exports.refund_payment_for_selected_payment_gateway = function (order_payment, return_data) {
    Payment_gateway.findOne({ _id: order_payment.payment_id }, function (error, payment_gateway) {
        if (payment_gateway) {
            if (payment_gateway.name == 'Stripe') {
                var stripe_key = payment_gateway.payment_key;
                var stripe = require("stripe")(stripe_key);

                const refund = stripe.refunds.create({
                    payment_intent: order_payment.payment_intent_id,
                }, function (error, refund) {
                    console.log('--------stripe-refund-------')
                    console.log(error)
                    console.log(refund)
                    if (error) {
                        return_data(null);
                    } else {
                        return_data(refund);
                    }
                });
            } else if (payment_gateway.name == 'Paystack') {
                console.log('------refund-using paystack----')
                console.log(order_payment.payment_intent_id, payment_gateway.payment_key)
                paystack_refund.refund_payment(order_payment.payment_intent_id, payment_gateway.payment_key)

            }
        } else {
            return_data(null);
        }
    });
}

exports.cancel_payment_for_selected_payment_gateway = function (order_payment, return_data) {
    Payment_gateway.findOne({ _id: order_payment.payment_id }, function (error, payment_gateway) {
        console.log('Payment ID:', order_payment.payment_id);
        if (payment_gateway) {
            if (payment_gateway.name == 'Stripe') {
                var stripe_key = payment_gateway.payment_key;
                var stripe = require("stripe")(stripe_key);

                console.log('Payment Intent ID:', order_payment.payment_intent_id);
                const paymentIntent = stripe.paymentIntents.cancel(
                    order_payment.payment_intent_id
                , function (error, canceledPaymentIntent) {
                    console.log('--------stripe-cancel-------')
                    console.log(error)
                    console.log('Payment Intent ID:', order_payment.payment_intent_id);
                    console.log(canceledPaymentIntent)
                    if (error) {
                        return_data(null);
                    } else {
                        return_data(canceledPaymentIntent);
                    }
                });
            }
        } else {
            return_data(null);
        }
    });
}

exports.pay_payment_for_selected_payment_gateway = function (user_type, user_id, payment_id, pay_amount, currency_code, return_data) {

    Payment_gateway.findOne({ _id: payment_id }, function (error, payment_gateway) {
        if (payment_gateway) {
            var payment_gateway_name = payment_gateway.name;
            // if (payment_gateway_name === 'Stripe')
            // {
            Card.findOne({ payment_id: payment_id, user_id: user_id, is_default: true }, function (error, card) {
                if (card) {
                    var stripe_key = payment_gateway.payment_key;
                    var stripe = require("stripe")(stripe_key);
                    var customer_id = card.customer_id;
                    var charge_amount = Math.ceil(pay_amount * 100);

                    stripe.charges.create({
                        amount: charge_amount,
                        currency: currency_code,
                        customer: customer_id
                    }, function (error, charge) {
                        console.log(error);
                        if (charge) {
                            var payment_response = { card_number: card.last_four };
                            return_data(payment_response);
                        } else {
                            return_data(null);
                        }
                    });
                } else {
                    return_data(null);
                }
            });
            // } else {
            //     return_data(null);
            // }
        } else {
            return_data(null);
        }
    });
};


exports.add_transfered_history = function (type, type_id, country_id, amount, currency_code, transfer_status, transfer_id, transfered_by, error) {
    var transfer_history = new Transfer_History({
        user_type: type,
        user_id: type_id,
        country_id: country_id,
        amount: amount,
        currency_code: currency_code,
        transfer_status: transfer_status,
        transfer_id: transfer_id,
        transfered_by: transfered_by,
        error: error
    });
    transfer_history.save();
};


exports.transfer_amount_to_employee = function (amount, account_id, currencycode, payment_gateway, return_data) {
    console.log("------------transfer amount to employe --------")
    Payment_gateway.findOne({ _id: payment_gateway }).then(payment_detials => {
        if (payment_detials.name == 'Stripe') {

            var stripe_secret_key = setting_detail.stripe_secret_key;
            var stripe = require("stripe")(stripe_secret_key);
            stripe.transfers.create({
                amount: Math.round(amount * 100),
                currency: currencycode,
                destination: account_id
            },
                function (err, transfer) {
                    if (err) {
                        return_data({ success: false, error: err });
                    } else {
                        return_data({ success: true, transfer_id: transfer.id })
                    }
                });
        } else if (payment_detials.name == 'Paystack') {
            Bank_detail.findOne({ account_id: account_id }).then(bank_detail => {
                console.log(bank_detail)
                if (bank_detail) {

                    const https = require('https')
                    const params = JSON.stringify({
                        "type": "nuban",
                        "name": bank_detail.bank_account_holder_name,
                        "description": "Transfer",
                        "account_number": bank_detail.account_number,
                        "bank_code": bank_detail.routing_number,
                        "currency": currencycode
                    })
                    const options = {
                        hostname: 'api.paystack.co',
                        port: 443,
                        path: '/transferrecipient',
                        method: 'POST',
                        headers: {
                            Authorization: 'Bearer ' + payment_detials.payment_key,
                            'Content-Type': 'application/json'
                        }
                    }
                    const req = https.request(options, res => {
                        let data = ''
                        res.on('data', (chunk) => {
                            data += chunk
                        });
                        res.on('end', () => {
                            console.log(JSON.parse(data))
                            if (JSON.parse(data).status) {
                                const params = JSON.stringify({
                                    "source": "balance",
                                    "reason": "Transfer",
                                    "amount": Math.round(amount * 100),
                                    "recipient": JSON.parse(data).data.recipient_code
                                })
                                const options = {
                                    hostname: 'api.paystack.co',
                                    port: 443,
                                    path: '/transfer',
                                    method: 'POST',
                                    headers: {
                                        Authorization: 'Bearer ' + payment_detials.payment_key,
                                        'Content-Type': 'application/json'
                                    }
                                }
                                const req = https.request(options, res => {
                                    let data = ''
                                    res.on('data', (chunk) => {
                                        data += chunk
                                    });
                                    res.on('end', () => {
                                        if (JSON.parse(data).status) {
                                            return_data({ success: true, transfer_id: JSON.parse(data).data.transfer_code });
                                        } else {
                                            return_data({ success: false, error: JSON.parse(data).message });
                                        }
                                    })
                                }).on('error', error => {
                                    console.error(error)
                                })
                                req.write(params)
                                req.end()
                            } else {
                                return_data({ success: false, error: JSON.parse(data).message });
                            }
                        })
                    }).on('error', error => {
                        console.error(error)
                    })
                    req.write(params)
                    req.end()
                } else {
                    return_data({ success: false })
                }
            })
        }
    })
}



exports.add_bank_detail = function (request_data, response_data) {

    var request_data_body = request_data.body;
    var type = Number(request_data_body.type); // 7 = User , 8 = Provider , 2 = Store
    switch (type) {
        case ADMIN_DATA_ID.STORE:
            Table = Store;
            string = "store";
            break;
        case ADMIN_DATA_ID.PROVIDER:
            Table = Provider;
            string = "provider";
            break;
        default:
            break;
    }

    Table.findOne({ _id: request_data_body.id }, function (error, detail) {
        if (detail) {

            Country.findOne({ _id: detail.country_id }, function (error, country_detail) {
                if (country_detail) {
                    Payment_gateway.findOne({ name: "Stripe" }, function (error, payment_gateway) {
                        if (payment_gateway) {

                            var stripe_key = payment_gateway.payment_key;
                            var stripe = require("stripe")(stripe_key);

                            stripe.tokens.create({
                                bank_account: {
                                    country: country_detail.country_code,
                                    currency: country_detail.currency_code,
                                    account_holder_name: request_data_body.account_holder_name,
                                    account_holder_type: request_data_body.account_holder_type,
                                    routing_number: request_data_body.routing_number,
                                    account_number: request_data_body.account_number
                                }
                            }, function (stripe_token_error, token) {
                                if (stripe_token_error) {

                                } else {
                                    var pictureData = request_data_body.document;
                                    var pictureData_buffer = new Buffer(pictureData, 'base64');

                                    stripe.fileUploads.create({
                                        file: {
                                            data: pictureData_buffer,
                                            name: "document.jpg",
                                            type: "application/octet-stream",
                                        },
                                        purpose: "identity_document",
                                    }, function (stripe_document_error, fileUpload) {
                                        if (stripe_document_error) {

                                        } else {
                                            var dob = request_data.body.dob
                                            dob = dob.split('-');
                                            stripe.accounts.create({
                                                type: 'custom',
                                                country: country_detail.country_code,
                                                email: detail.email,
                                                legal_entity: {
                                                    first_name: detail.first_name,
                                                    last_name: detail.last_name,
                                                    personal_id_number: request_data_body.personal_id_number,
                                                    business_name: request_data_body.business_name,
                                                    business_tax_id: detail.tax_id,
                                                    dob: {
                                                        day: dob[0],
                                                        month: dob[1],
                                                        year: dob[2]
                                                    },
                                                    type: request_data_body.account_holder_type,
                                                    address: {
                                                        city: detail.city,
                                                        country: country_detail.country_name,
                                                        line1: detail.address,
                                                        line2: detail.address
                                                    },
                                                    verification: {
                                                        document: fileUpload.id
                                                    },
                                                    tos_acceptance: {
                                                        date: Math.floor(Date.now() / 1000),
                                                        ip: req.connection.remoteAddress // Assumes you're not using a proxy
                                                    }
                                                }
                                            }, function (stripe_account_error, account) {
                                                if (stripe_account_error) {

                                                } else {
                                                    stripe.accounts.createExternalAccount(account.id,
                                                        {
                                                            external_account: token.id,
                                                            default_for_currency: true
                                                        },
                                                        function (bank_account_error, bank_account) {
                                                            if (bank_account_error) {

                                                            } else {
                                                                detail.account_id = account.id;
                                                                detail.bank_id = bank_account.id;
                                                                detail.save();
                                                                response_data.json({ success: true });
                                                            }
                                                        });

                                                }
                                            });
                                        }
                                    });
                                }

                            });

                        } else {

                        }
                    });
                } else {

                }
            })

        } else {

        }
    })



}


exports.get_bank_detail = function (request_data, response_data) {

    var request_data_body = request_data.body;
    var type = Number(request_data_body.type); // 7 = User , 8 = Provider , 2 = Store
    switch (type) {
        case ADMIN_DATA_ID.STORE:
            Table = Store;
            string = "store";
            break;
        case ADMIN_DATA_ID.PROVIDER:
            Table = Provider;
            string = "provider";
            break;
        default:
            break;
    }


    Table.findOne({ _id: request_data_body.id }, function (error, detail) {
        if (detail) {

            Payment_gateway.findOne({ name: "Stripe" }, function (error, payment_gateway) {
                if (payment_gateway) {

                    var stripe_key = payment_gateway.payment_key;
                    var stripe = require("stripe")(stripe_key);
                    stripe.accounts.retrieveExternalAccount(
                        detail.account_id,
                        detail.bank_id,
                        function (error, external_account) {
                            if (error || !external_account) {
                                response_data.json({ success: false });
                            } else {
                                response_data.json({
                                    success: true,
                                    account_holder_name: external_account.account_holder_name,
                                    account_holder_type: external_account.account_holder_type,
                                    routing_number: external_account.routing_number,
                                    account_number: external_account.last4
                                });
                            }
                        }
                    );
                } else {

                }
            });
        } else {

        }
    });
};

exports.delete_bank_detail = function (request_data, response_data) {

    var request_data_body = request_data.body;
    var type = Number(request_data_body.type); // 7 = User , 8 = Provider , 2 = Store
    switch (type) {
        case ADMIN_DATA_ID.STORE:
            Table = Store;
            string = "store";
            break;
        case ADMIN_DATA_ID.PROVIDER:
            Table = Provider;
            string = "provider";
            break;
        default:
            break;
    }


    Table.findOne({ _id: request_data_body.id }, function (error, detail) {
        if (detail) {

            Payment_gateway.findOne({ name: "Stripe" }, function (error, payment_gateway) {
                if (payment_gateway) {

                    var stripe_key = payment_gateway.payment_key;
                    var stripe = require("stripe")(stripe_key);
                    stripe.accounts.del(detail.account_id, function (error, external_account) {

                        if (error) {
                            response_data.json({ success: false });
                        } else {
                            detail.account_id = "";
                            detail.bank_id = "";
                            detail.save();
                            response_data.json({ success: true });
                        }

                    });
                } else {

                }
            });
        } else {

        }
    });
};



exports.check_promo_for = function (promo_code, cart, store, return_data) {

    if (promo_code.promo_for == PROMO_FOR.DELIVERIES) {

        var index = promo_code.promo_apply_on.indexOf(store.store_delivery_id);
        if (index != -1) {
            return_data({ success: true });
        } else {
            return_data({ success: false });
        }

    } else if (promo_code.promo_for == PROMO_FOR.STORE) {

        var index = promo_code.promo_apply_on.indexOf(store._id);
        if (index != -1) {
            return_data({ success: true });
        } else {
            return_data({ success: false });
        }

    } else if (promo_code.promo_for == PROMO_FOR.PRODUCT) {
        var bool = false;
        var price_for_promo = 0;
        cart.order_details.forEach(function (product) {
            var index = promo_code.promo_apply_on.indexOf(product.product_id);
            if (index != -1) {
                bool = true;
                price_for_promo = price_for_promo + product.total_item_price;
            }
        });
        return_data({ success: bool, price_for_promo: price_for_promo });

    } else if (promo_code.promo_for == PROMO_FOR.ITEM) {
        var bool = false;
        var price_for_promo = 0;
        cart.order_details.forEach(function (product) {
            product.items.forEach(function (item) {
                var index = promo_code.promo_apply_on.indexOf(item.item_id);
                if (index != -1) {
                    bool = true;
                    price_for_promo = price_for_promo + item.total_item_price;
                }
            })
        });
        return_data({ success: bool, price_for_promo: price_for_promo });
    } else if (promo_code.promo_for == PROMO_FOR.USER) {
        var index = promo_code.promo_apply_on.indexOf(cart.user_id);
        if (index != -1) {
            return_data({ success: true });
        } else {
            return_data({ success: false });
        }
    }else {
        return_data({ success: true })
    }
};

exports.check_promo_recursion = function (promo_code, timezone, return_data) {
    console.log('check_promo_recursion')

    var date = new Date();
    date = new Date(date).toLocaleString("en-US", { timeZone: timezone })
    date = new Date(date);
    var weekday = date.getDay();
    var current_time = date.getTime();
    var current_date = date.getDate();

    var current_month = date.getMonth();
    var current_year = date.getFullYear();
    if (promo_code.promo_recursion_type >= PROMO_RECURSION_ID.DAILY_RECURSION) {

        var start_time = promo_code.promo_start_time;
        start_time = start_time.split(':')
        var promo_start_time = date.setHours(start_time[0], start_time[1], 0, 0)
        promo_start_time = new Date(promo_start_time);
        promo_start_time = promo_start_time.getTime();

        var end_time = promo_code.promo_end_time;
        end_time = end_time.split(':')
        var promo_end_time = date.setHours(end_time[0], end_time[1], 0, 0)
        promo_end_time = new Date(promo_end_time);
        promo_end_time = promo_end_time.getTime();


        if (current_time > promo_start_time && current_time < promo_end_time) {
            if (promo_code.promo_recursion_type >= PROMO_RECURSION_ID.WEEKLY_RECURSION) {

                var day_string = DAY[weekday];
                var day_index = promo_code.days.indexOf(day_string);
                if (day_index != -1) {

                    if (promo_code.promo_recursion_type >= PROMO_RECURSION_ID.MONTHLY_RECURSION) {

                        var firstOfMonth = new Date(current_year, current_month - 1, 1);
                        var lastOfMonth = new Date(current_year, current_month, 0);
                        var used = firstOfMonth.getDay() + lastOfMonth.getDate();

                        var week_number = Math.ceil(current_date / 7);
                        var week_string = WEEK[week_number];
                        var week_index = promo_code.weeks.indexOf(week_string);

                        if (week_index != -1) {
                            if (promo_code.promo_recursion_type >= PROMO_RECURSION_ID.ANNUALLY_RECURSION) {

                                var month_string = MONTH[current_month];
                                var month_index = promo_code.months.indexOf(month_string);
                                if (month_index != -1) {
                                    return_data(true);
                                } else {
                                    return_data(false);
                                }

                            } else {
                                return_data(true);
                            }

                        } else {
                            return_data(false);
                        }

                    } else {
                        return_data(true);
                    }

                } else {
                    return_data(false);
                }

            } else {
                return_data(true);
            }
        } else {
            return_data(false)
        }
    } else {
        return_data(true)
    }
};

exports.precisionRoundTwo = function (number) {
    return myUtils.precisionRound(number, 2);
}

exports.precisionRound = function (number, precision) {
    var factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
}


exports.check_zone = function (city_id, delivery_type, type_id, vehicle_id, zone_business, store_location, destination_location, return_data) {
    if (zone_business) {
        CityZone.find({ city_id: city_id }, function (error, cityzone) {
            if (cityzone.length == 0) {
                return_data({ success: false });
            } else {
                var bool = false;
                var i = 1;
                var store_zone_id = null;
                var destination_zone_id = null;

                cityzone.forEach(function (zone_data) {
                    var store_zone = false;
                    if (zone_data.kmlzone.length > 0) {
                        store_zone = geolib.isPointInPolygon(
                            { latitude: store_location[0], longitude: store_location[1] },
                            zone_data.kmlzone
                        );
                    }
                    if (store_zone) {
                        store_zone_id = zone_data._id;
                    }
                    var destination_zone = false;
                    if (zone_data.kmlzone.length > 0) {
                        destination_zone = geolib.isPointInPolygon(
                            { latitude: destination_location[0], longitude: destination_location[1] },
                            zone_data.kmlzone);
                    }
                    if (destination_zone) {
                        destination_zone_id = zone_data._id;
                    }

                    if (destination_zone_id && store_zone_id && !bool) {
                        console.log("zonevalue")

                        bool = true;
                        ZoneValue.findOne({ $or: [{ from_zone_id: store_zone_id, to_zone_id: destination_zone_id }, { from_zone_id: destination_zone_id, to_zone_id: store_zone_id }], type_id: type_id, vehicle_id: vehicle_id, delivery_type: delivery_type }, function (err, zonevalue) {
                            if (zonevalue && zonevalue.price > 0) {
                                return_data({ success: true, zone_price: zonevalue.price });
                            } else {
                                return_data({ success: false });
                            }
                        });
                    } else {
                        if (i == cityzone.length && !bool) {
                            return_data({ success: false });
                        } else {
                            i++;
                        }
                    }

                });
            }
        })
    } else {
        return_data({ success: false });
    }
}

exports.insert_daily_store_analytics = function (tag_date, store_id, order_status, item_count, is_store_cancelled) {

    Store_analytic_daily.findOne({ store_id: store_id, date_tag: tag_date }, function (error, store_analytic_daily) {
        var completed_ratio = 0, cancellation_ratio = 0, rejection_ratio = 0, acception_ratio = 0, order_ready_ratio = 0;
        var order_ready = 0, accepted = 0, received = 0, total_orders = 0, completed = 0, cancelled = 0, total_items = 0, total_cancelled_items = 0, rejected = 0;

        if (store_analytic_daily) {
            received = store_analytic_daily.received;
            total_orders = store_analytic_daily.received;
            accepted = store_analytic_daily.accepted;
            rejected = store_analytic_daily.rejected;
            cancelled = store_analytic_daily.cancelled;
            completed = store_analytic_daily.completed;
            order_ready = store_analytic_daily.order_ready;
            total_items = store_analytic_daily.total_items;
            total_cancelled_items = store_analytic_daily.total_cancelled_items;
        }

        if (Number(order_status) > 0) {

            switch (order_status) {
                case ORDER_STATE.WAITING_FOR_ACCEPT_STORE:
                    received++;
                    total_orders++;
                    break;

                case ORDER_STATE.STORE_ACCEPTED:
                    accepted++;
                    total_items = +total_items + +item_count;
                    break;

                case ORDER_STATE.STORE_REJECTED:
                    rejected++;
                    break;

                case ORDER_STATE.STORE_CANCELLED:
                    if (is_store_cancelled) {
                        cancelled++;
                    }
                    total_cancelled_items = +total_cancelled_items + +item_count;
                    break;

                case ORDER_STATE.ORDER_READY:
                    order_ready++;
                    break;
                case ORDER_STATE.ORDER_COMPLETED:
                    completed++;
                    break;
                case ORDER_STATE.STORE_CREATE_ORDER:
                    received++;
                    total_orders++;
                    accepted++;
                    total_items = +total_items + +item_count;
                    break;

            }
        }

        if ((Number(received)) > 0) {
            acception_ratio = (accepted * 100) / received;
            completed_ratio = (completed * 100) / received;
            cancellation_ratio = (cancelled * 100) / received;
            rejection_ratio = (rejected * 100) / received;
            order_ready_ratio = (order_ready * 100) / received;
        }

        if (store_analytic_daily) {
            store_analytic_daily.received = received;
            store_analytic_daily.total_orders = total_orders;
            store_analytic_daily.accepted = accepted;
            store_analytic_daily.rejected = rejected;
            store_analytic_daily.cancelled = cancelled;
            store_analytic_daily.completed = completed;
            store_analytic_daily.order_ready = order_ready;
            store_analytic_daily.acception_ratio = acception_ratio;
            store_analytic_daily.cancellation_ratio = cancellation_ratio;
            store_analytic_daily.rejection_ratio = rejection_ratio;
            store_analytic_daily.completed_ratio = completed_ratio;
            store_analytic_daily.order_ready_ratio = order_ready_ratio;
            store_analytic_daily.total_items = total_items;
            store_analytic_daily.total_cancelled_items = total_cancelled_items;
            store_analytic_daily.save();
        } else {
            var store_analytic_daily = new Store_analytic_daily({
                store_id: store_id,
                date_tag: tag_date,
                received: received,
                total_orders: received,
                accepted: accepted,
                rejected: rejected,
                cancelled: cancelled,
                completed: completed,
                order_ready: order_ready,
                acception_ratio: acception_ratio,
                cancellation_ratio: cancellation_ratio,
                rejection_ratio: rejection_ratio,
                completed_ratio: completed_ratio,
                order_ready_ratio: order_ready_ratio,
                total_items: total_items,
                total_cancelled_items: total_cancelled_items
            });
            store_analytic_daily.save();
        }
    });
};

exports.insert_daily_provider_analytics_with_date_old = function (date_now, city_timezone, provider_id, delivery_status, is_online_time, start_time, is_active_time, start_active_time) {
    var city_date_now = myUtils.get_date_now_at_city(date_now, city_timezone);
    var today = moment(city_date_now).startOf('day');
    var tag_date = moment(new Date(today)).format(DATE_FORMATE.DDMMYYYY);


    Provider_analytic_daily.findOne({ provider_id: provider_id, date_tag: tag_date }, function (error, provider_analytic_daily) {
        var received = 0, accepted = 0, rejected = 0, not_answered = 0, cancelled = 0, completed = 0;
        var acception_ratio = 0, cancellation_ratio = 0, rejection_ratio = 0, completed_ratio = 0;
        var total_active_job_time = 0, total_online_time = 0;
        var online_times = [], active_job_times = [];

        if (provider_analytic_daily) {
            received = provider_analytic_daily.received;
            accepted = provider_analytic_daily.accepted;
            rejected = provider_analytic_daily.rejected;
            not_answered = provider_analytic_daily.not_answered;
            cancelled = provider_analytic_daily.cancelled;
            completed = provider_analytic_daily.completed;
            acception_ratio = provider_analytic_daily.acception_ratio;
            cancellation_ratio = provider_analytic_daily.cancellation_ratio;
            rejection_ratio = provider_analytic_daily.rejection_ratio;
            completed_ratio = provider_analytic_daily.completed_ratio;
            total_active_job_time = provider_analytic_daily.total_active_job_time;
            total_online_time = provider_analytic_daily.total_online_time;
            online_times = provider_analytic_daily.online_times;
            active_job_times = provider_analytic_daily.active_job_times;
        }

        if (Number(delivery_status) > 0) {
            console.log("delivery_status" + delivery_status);

            switch (Number(delivery_status)) {
                case ORDER_STATE.WAITING_FOR_DELIVERY_MAN:
                    received++;
                    break;

                case ORDER_STATE.DELIVERY_MAN_ACCEPTED:
                    accepted++;
                    break;

                case ORDER_STATE.DELIVERY_MAN_REJECTED:
                    rejected++;
                    break;

                case ORDER_STATE.DELIVERY_MAN_CANCELLED:
                    cancelled++;
                    break;

                case ORDER_STATE.ORDER_COMPLETED:
                    completed++;
                    break;
                case ORDER_STATE.NOT_ANSWERED:
                    not_answered++;
                    break;
                default:
                    break;
            }

            if ((Number(received)) > 0) {
                acception_ratio = myUtils.precisionRoundTwo(Number((accepted * 100) / received));
                cancellation_ratio = myUtils.precisionRoundTwo(Number((cancelled * 100) / received));
                completed_ratio = myUtils.precisionRoundTwo(Number((completed * 100) / received));
                rejection_ratio = myUtils.precisionRoundTwo(Number((rejected * 100) / received));
            }
        } else {
            console.log("is_online_time :" + is_online_time);
            if (is_online_time) {
                var time = { is_start_time: true, time: date_now };
                if (start_time != null) {
                    time.is_start_time = false;
                    time_diff_in_sec = myUtils.getTimeDifferenceInSecond(date_now, start_time);
                    total_online_time = +total_online_time + +time_diff_in_sec;
                }

                online_times.push(time);
            }

            if (is_active_time) {
                var time = { is_start_time: true, time: date_now };
                if (start_active_time != null) {
                    time.is_start_time = false;
                    time_diff_in_sec = myUtils.getTimeDifferenceInSecond(date_now, start_active_time);
                    total_active_job_time = +total_active_job_time + +time_diff_in_sec;
                }
                active_job_times.push(time);
            }

        }

        if (total_online_time < 0) {
            total_online_time = 0;
        }

        if (total_active_job_time < 0) {
            total_active_job_time = 0;
        }


        if (provider_analytic_daily) {
            if (delivery_status > 0) {
                provider_analytic_daily.received = received;
                provider_analytic_daily.accepted = accepted;
                provider_analytic_daily.rejected = rejected;
                provider_analytic_daily.not_answered = not_answered;
                provider_analytic_daily.cancelled = cancelled;
                provider_analytic_daily.completed = completed;
                provider_analytic_daily.acception_ratio = acception_ratio;
                provider_analytic_daily.cancellation_ratio = cancellation_ratio;
                provider_analytic_daily.rejection_ratio = rejection_ratio;
                provider_analytic_daily.completed_ratio = completed_ratio;
            } else {
                provider_analytic_daily.total_active_job_time = total_active_job_time;
                provider_analytic_daily.total_online_time = total_online_time;
                provider_analytic_daily.online_times = online_times;
                provider_analytic_daily.active_job_times = active_job_times;

            }
            provider_analytic_daily.save(function (error) {
                if (error) {
                    myUtils.insert_daily_provider_analytics_with_date(date_now, city_timezone, provider_id, delivery_status, is_online_time, start_time, is_active_time, start_active_time)
                } else {
                    console.log("provider_analytic_daily saved.");
                }

            });

        } else {
            var provider_analytic_daily = new Provider_analytic_daily({
                provider_id: provider_id,
                date_tag: tag_date,
                received: received,
                accepted: accepted,
                rejected: rejected,
                not_answered: not_answered,
                cancelled: cancelled,
                completed: completed,
                acception_ratio: acception_ratio,
                cancellation_ratio: cancellation_ratio,
                rejection_ratio: rejection_ratio,
                completed_ratio: completed_ratio,
                total_active_job_time: total_active_job_time,
                total_online_time: total_online_time
            });
            provider_analytic_daily.save(function (error) {
                if (error) {
                    myUtils.insert_daily_provider_analytics_with_date(date_now, city_timezone, provider_id, delivery_status, is_online_time, start_time, is_active_time, start_active_time)
                } else {

                    console.log("provider_analytic_daily saved.");

                }

            });
        }
    });
};

exports.insert_daily_provider_analytics_with_date = function (date_now, city_timezone, provider_id, delivery_status, is_online_time, start_time, is_active_time, start_active_time) {
    var city_date_now = myUtils.get_date_now_at_city(date_now, city_timezone);
    var today = moment(city_date_now).startOf('day');

    var tag_date = moment(new Date(today)).format(DATE_FORMATE.DDMMYYYY);

    Provider_analytic_daily.findOne({ provider_id: provider_id, date_tag: tag_date }, function (error, provider_analytic_daily) {
        var received = 0, accepted = 0, rejected = 0, not_answered = 0, cancelled = 0, completed = 0;
        var acception_ratio = 0, cancellation_ratio = 0, rejection_ratio = 0, completed_ratio = 0;
        var total_active_job_time = 0, total_online_time = 0;
        var online_times = [], active_job_times = [];

        if (provider_analytic_daily) {
            received = provider_analytic_daily.received;
            accepted = provider_analytic_daily.accepted;
            rejected = provider_analytic_daily.rejected;
            not_answered = provider_analytic_daily.not_answered;
            cancelled = provider_analytic_daily.cancelled;
            completed = provider_analytic_daily.completed;
            acception_ratio = provider_analytic_daily.acception_ratio;
            cancellation_ratio = provider_analytic_daily.cancellation_ratio;
            rejection_ratio = provider_analytic_daily.rejection_ratio;
            completed_ratio = provider_analytic_daily.completed_ratio;
            total_active_job_time = provider_analytic_daily.total_active_job_time;
            total_online_time = provider_analytic_daily.total_online_time;
            online_times = provider_analytic_daily.online_times;
            active_job_times = provider_analytic_daily.active_job_times;
        }

        if (Number(delivery_status) > 0) {

            switch (Number(delivery_status)) {
                case ORDER_STATE.WAITING_FOR_DELIVERY_MAN:
                    received++;
                    break;

                case ORDER_STATE.DELIVERY_MAN_ACCEPTED:
                    accepted++;
                    break;

                case ORDER_STATE.DELIVERY_MAN_REJECTED:
                    rejected++;
                    break;

                case ORDER_STATE.DELIVERY_MAN_CANCELLED:
                    cancelled++;
                    break;

                case ORDER_STATE.ORDER_COMPLETED:
                    completed++;
                    break;
                case ORDER_STATE.NOT_ANSWERED:
                    not_answered++;
                    break;
                default:
                    break;
            }

            if ((Number(received)) > 0) {
                acception_ratio = myUtils.precisionRoundTwo(Number((accepted * 100) / received));
                cancellation_ratio = myUtils.precisionRoundTwo(Number((cancelled * 100) / received));
                completed_ratio = myUtils.precisionRoundTwo(Number((completed * 100) / received));
                rejection_ratio = myUtils.precisionRoundTwo(Number((rejected * 100) / received));
            }
        } else {

            var date_now_start_of_date = new Date(date_now);

            var time_diff = city_date_now.getTime() - today;
            date_now_start_of_date = new Date(date_now_start_of_date.setTime(date_now_start_of_date.getTime() - time_diff));

            if (is_online_time) {


                var time = { is_start_time: true, time: date_now };
                if (start_time != null) {
                    if (start_time.getTime() < date_now_start_of_date.getTime()) {
                        time = { is_start_time: true, time: date_now_start_of_date };
                        online_times.push(time);

                        time = { is_start_time: false, time: date_now };
                        time_diff_in_sec = myUtils.getTimeDifferenceInSecond(date_now, date_now_start_of_date);
                        total_online_time = +total_online_time + +time_diff_in_sec;
                    } else {
                        time.is_start_time = false;
                        time_diff_in_sec = myUtils.getTimeDifferenceInSecond(date_now, start_time);
                        total_online_time = +total_online_time + +time_diff_in_sec;
                    }
                }
                online_times.push(time);
            }


            if (is_active_time) {

                var time = { is_start_time: true, time: date_now };
                if (start_active_time != null) {
                    if (start_active_time.getTime() < date_now_start_of_date.getTime()) {
                        time = { is_start_time: true, time: date_now_start_of_date };
                        active_job_times.push(time);

                        time = { is_start_time: false, time: date_now };

                        time_diff_in_sec = myUtils.getTimeDifferenceInSecond(date_now, date_now_start_of_date);
                        total_active_job_time = +total_active_job_time + +time_diff_in_sec;
                    } else {
                        time.is_start_time = false;
                        time_diff_in_sec = myUtils.getTimeDifferenceInSecond(date_now, start_active_time);
                        total_active_job_time = +total_active_job_time + +time_diff_in_sec;
                    }
                }
                active_job_times.push(time);
            }

        }

        if (total_online_time < 0) {
            total_online_time = 0;
        }

        if (total_active_job_time < 0) {
            total_active_job_time = 0;
        }


        if (provider_analytic_daily) {
            if (delivery_status > 0) {
                provider_analytic_daily.received = received;
                provider_analytic_daily.accepted = accepted;
                provider_analytic_daily.rejected = rejected;
                provider_analytic_daily.not_answered = not_answered;
                provider_analytic_daily.cancelled = cancelled;
                provider_analytic_daily.completed = completed;
                provider_analytic_daily.acception_ratio = acception_ratio;
                provider_analytic_daily.cancellation_ratio = cancellation_ratio;
                provider_analytic_daily.rejection_ratio = rejection_ratio;
                provider_analytic_daily.completed_ratio = completed_ratio;
            } else {
                provider_analytic_daily.total_active_job_time = total_active_job_time;
                provider_analytic_daily.total_online_time = total_online_time;
                provider_analytic_daily.online_times = online_times;
                provider_analytic_daily.active_job_times = active_job_times;

            }
            provider_analytic_daily.save(function (error) {
                if (error) {
                    myUtils.insert_daily_provider_analytics_with_date(date_now, city_timezone, provider_id, delivery_status, is_online_time, start_time, is_active_time, start_active_time)
                }
            });

        } else {
            var provider_analytic_daily = new Provider_analytic_daily({
                provider_id: provider_id,
                date_tag: tag_date,
                received: received,
                accepted: accepted,
                rejected: rejected,
                not_answered: not_answered,
                cancelled: cancelled,
                completed: completed,
                acception_ratio: acception_ratio,
                cancellation_ratio: cancellation_ratio,
                rejection_ratio: rejection_ratio,
                completed_ratio: completed_ratio,
                total_active_job_time: total_active_job_time,
                total_online_time: total_online_time,
                online_times: online_times,
                active_job_times: active_job_times
            });
            provider_analytic_daily.save(function (error) {
                console.log(error)
                if (error) {
                    myUtils.insert_daily_provider_analytics_with_date(date_now, city_timezone, provider_id, delivery_status, is_online_time, start_time, is_active_time, start_active_time)
                }
            });
        }
    });
};

exports.insert_daily_provider_analytics = function (city_timezone, provider_id, delivery_status, is_online_time, start_time, is_active_time, start_active_time) {
    var date_now = new Date();
    myUtils.insert_daily_provider_analytics_with_date(date_now, city_timezone, provider_id, delivery_status, is_online_time, start_time, is_active_time, start_active_time);
};


//sendMassNotification
exports.sendMassNotification = function (push_data) {
    Installation_setting.findOne({}, function (error, installation_setting) {
        if (push_data.device_type == DEVICE_TYPE.ANDROID) {
            var android_provider_app_gcm_key = installation_setting.android_provider_app_gcm_key;
            var android_user_app_gcm_key = installation_setting.android_user_app_gcm_key;
            var android_store_app_gcm_key = installation_setting.android_store_app_gcm_key;
            var gcm = require('node-gcm');
            var message = new gcm.Message();
            var regTokens = push_data.device_token;
            message.addData('message', push_data.message);
            var sender_key;

            sender_key = android_user_app_gcm_key;
            if (push_data.type == ADMIN_DATA_ID.USER) {
                sender_key = android_user_app_gcm_key;
            } else if (push_data.type == ADMIN_DATA_ID.PROVIDER) {
                sender_key = android_provider_app_gcm_key;
            } else if (push_data.type == ADMIN_DATA_ID.STORE) {
                sender_key = android_store_app_gcm_key;
            }
            /// Set up the sender with you API key
            var sender = new gcm.Sender(sender_key);

            try {
                sender.send(message, { registrationTokens: regTokens }, function (error, response) {
                    if (error) {
                        console.error(error);

                    } else {

                        console.log(response);
                    }
                });
                sender.sendNoRetry(message, { topic: '/topics/global' }, function (error, response) {
                    if (error) {
                        console.error(error);

                    } else {

                        console.log(response);
                    }

                });
            } catch (error) {
                console.error(error);
            }
        }

        if (push_data.device_type == DEVICE_TYPE.IOS) {
            if (push_data.device_token == "" || push_data.device_token == null) {
                console.log("IOS PUSH NOTIFICATION NOT SENT");
            } else {
                console.log("IOS PUSH NOTIFICATION");
                var ios_passphrase;

                Installation_setting.findOne({}, function (error, installation_setting) {

                    // var provider_passphrase = installation_setting.provider_passphrase;
                    // var user_passphrase = installation_setting.user_passphrase;
                    // var store_passphrase = installation_setting.store_passphrase;

                    var user_certificate_mode = installation_setting.user_certificate_mode;
                    var provider_certificate_mode = installation_setting.provider_certificate_mode;
                    var store_certificate_mode = installation_setting.store_certificate_mode;
                    var ios_push_certificate_path = installation_setting.ios_push_certificate_path;

                    var teamId = installation_setting.team_id;
                    var keyId = installation_setting.key_id;
                    var bundle_id;


                    var cert_file_name = IOS_PUSH_FILE_NAME.IOS_CERT_FILE_NAME;
                    cert_file_name = path.join(ios_push_certificate_path, cert_file_name)
                    if (push_data.type == ADMIN_DATA_ID.PROVIDER) {
                        ios_certificate_mode = provider_certificate_mode;
                        bundle_id = installation_setting.provider_bundle_id;
                    } else if (push_data.type == ADMIN_DATA_ID.USER) {
                        ios_certificate_mode = user_certificate_mode;
                        bundle_id = installation_setting.user_bundle_id;
                    } else if (push_data.type == ADMIN_DATA_ID.STORE) {
                        ios_certificate_mode = store_certificate_mode;
                        bundle_id = installation_setting.store_bundle_id;
                    }

                    try {

                        var is_production = false
                        if (ios_certificate_mode == "production") {
                            is_production = true;
                        } else {
                            is_production = false;
                        }

                        var options = {
                            token: {
                                key: cert_file_name,
                                keyId: keyId,
                                teamId: teamId
                            },
                            production: is_production
                        };
                        var apnProvider = new apn.Provider(options);
                        var note = new apn.Notification();
                        note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                        note.badge = 1;
                        note.sound = 'default';
                        note.alert = { "loc-key": push_data.message, "id": push_data.message };
                        note.payload = { 'messageFrom': 'Caroline' };
                        note.topic = bundle_id;
                        apnProvider.send(note, push_data.device_token).then((result) => {
                            console.log(result)
                        });
                    } catch (err) {
                        console.log(err);
                    }

                });

            }
        }


    });
};


exports.get_valid_string = function (in_put_string) {
    var string = in_put_string;
    try {
        if (string != "" && string != undefined && string != null) {
            string = in_put_string.trim();
        } else {
            string = "";
        }
        return string;
    } catch (error) {
        string = "";
        return string;
    }
};

exports.get_string_with_first_letter_upper_case = function (in_put_string) {
    var string = in_put_string;
    try {
        if (string != "" && string != undefined && string != null) {
            string = in_put_string.trim();
            string = string.charAt(0).toUpperCase() + string.slice(1);
        } else {
            string = "";
        }
        return string;
    } catch (error) {
        string = "";
        return string;
    }
};


var AWS = require('aws-sdk');
const { response } = require('express');
const { resolve } = require('dns');
exports.storeImageForStoreFolder = async function (local_image_path, image_name, id, sub_path) {
    var file_new_path = './uploads/' + sub_path + myUtils.getImageFolderName(id) + image_name;
    var unique_id = sub_path.split('/')[1];

    if (!fs.existsSync('./uploads/store_image/' + unique_id)) {
        await mkdirp('./uploads/store_image/' + unique_id + '/');
        await mkdirp('./uploads/store_image/' + unique_id + '/store_products_group/');
        await mkdirp('./uploads/store_image/' + unique_id + '/store_products/');
        await mkdirp('./uploads/store_image/' + unique_id + '/store_items/');
        await mkdirp('./uploads/store_image/' + unique_id + '/store_profiles/');
    }
    if (setting_detail.is_use_aws_bucket) {
        file_new_path = sub_path + myUtils.getImageFolderName(id) + image_name;
        AWS.config.update({ accessKeyId: setting_detail.access_key_id, secretAccessKey: setting_detail.secret_key_id });
        fs.readFile(local_image_path, function (err, data) {
            var s3 = new AWS.S3();
            var base64data = new Buffer(data, 'binary');

            s3.putObject({
                Bucket: setting_detail.aws_bucket_name,
                Key: file_new_path,
                Body: base64data,
                ACL: 'public-read'
            }, function (err, data) {
                console.log("upload")
                console.log(err)
            });
            if (fs.existsSync(local_image_path)) {
                fs.unlinkSync(local_image_path);
            }
            // s3.deleteObject({
            //     Bucket: setting_detail.aws_bucket_name,
            //     Key: file_new_path
            // }, function (err, data) {
            //     console.log("delete")
            //     console.log(err)
            // });
            //fs.unlink(local_image_path);
        });
    } else {
        file_new_path = './uploads/' + sub_path + myUtils.getImageFolderName(id) + image_name;
        const sharp = require('sharp');
        /*if(id == FOLDER_NAME.STORE_PRODUCTS || id == FOLDER_NAME.STORE_PRODUCTS_GROUP || id == FOLDER_NAME.STORE_ITEMS|| id == FOLDER_NAME.DELIVERY_TYPE_IMAGES){
            sharp(local_image_path).resize({ width: 500,height: 400 }).toFile(file_new_path)
            .then(function(newFileInfo) {
                console.log("Success Max");
            })
            .catch(function(err) {
                console.log("Error occured");
            });
        }else{*/
        if (id == FOLDER_NAME.STORE_FAVICON) {
            sharp(local_image_path).resize({ width: 100, height: 100 }).toFile(file_new_path)
                .then(function (newFileInfo) {
                    console.log("Success Max");
                })
                .catch(function (err) {
                    console.log("Error occured");
                });
        } else if (id == FOLDER_NAME.STORE_PROFILES) {
            sharp(local_image_path).resize({ width: 500, height: 400 }).toFile(file_new_path)
                .then(function (newFileInfo) {
                    console.log("Success Max");
                })
                .catch(function (err) {
                    console.log("Error occured");
                });
        } else if (id == FOLDER_NAME.STORE_LARGE_BANNER) {
            sharp(local_image_path).resize({ width: 1920, height: 480 }).toFile(file_new_path)
                .then(function (newFileInfo) {
                    console.log("Success Max");
                })
                .catch(function (err) {
                    console.log("Error occured");
                });
        } else {
            fs.readFile(local_image_path, function (error, data) {
                fs.writeFile(file_new_path, data, 'binary', function (error) {
                    if (error) {
                        console.log("Save file : " + error);
                    } else {
                        fs.unlinkSync(local_image_path);
                    }
                });
            });
        }
        //}
    }
}

exports.deleteStoreImageFromFolder = function (old_img_path, id) {

    if (old_img_path != "" || old_img_path != null) {

        var old_file_name = old_img_path.split('/');

        var fs = require('fs');
        var bf = new Buffer(100000);
        var http = require('http');
        var old_file_path = './uploads/' + old_img_path;
        //var old_file_path = myUtils.getSaveImageFolderPath(id) + old_file_name[1];

        if (setting_detail.is_use_aws_bucket) {
            AWS.config.update({ accessKeyId: setting_detail.access_key_id, secretAccessKey: setting_detail.secret_key_id });
            var s3 = new AWS.S3();
            s3.deleteObject({
                Bucket: setting_detail.aws_bucket_name,
                Key: old_file_path
            }, function (err, data) { })
        } else {
            if (fs.existsSync(old_file_path)) {
                fs.unlink(old_file_path, function (error, file) {
                    if (error) {
                        console.error(error);
                    } else {
                        console.log('successfully remove image');
                    }
                });
            }
        }
    }

}

exports.verify_captcha = function (token, device_type, recaptcha_type, response) {

    Setting.findOne({}).then((setting_data) => {
        console.log(setting_data.is_use_captcha)
        if (setting_data.is_use_captcha) {
            if (device_type === 'web') {
                var secret_key = '';
                if (recaptcha_type === 3) {
                    var secret_key = '6Lf0m_cfAAAAANc-bv0VWve0iJk8y3gqUZ2FeqS2' //v3    
                } else if (recaptcha_type === 2) {
                    var secret_key = '6LcpnvcfAAAAAJSQ1q_evPtkgZ5WTGY-hQ1buYD_' //v2
                }
                request
                    .post({
                        url: 'https://www.google.com/recaptcha/api/siteverify',
                        form: {
                            secret: secret_key,
                            response: token
                        }
                    }, function (err, httpResponse, body) {
                        // 
                        var response_data = JSON.parse(body)
                        if (response_data.success) {
                            response({ success: true })
                        } else {
                            response({ success: false })

                        }
                        // console.log(err)
                        // response_data.json({
                        //     success: body.success,
                        //     body
                        // })
                    })
            } else if (device_type === "android") {
                var secret_key = '6LdYeuAcAAAAAFnF07oGT_2bujEVQv7Xp0XRIVjU'
                request
                    .post({
                        url: 'https://www.google.com/recaptcha/api/siteverify',
                        form: {
                            secret: secret_key,
                            response: token
                        }
                    }, function (err, httpResponse, body) {
                        var response_data = JSON.parse(body)
                        if (response_data.success) {
                            console.log(true)
                            response({ success: true })
                        } else {
                            response({ success: false })

                        }
                    })
                // response({success: true})
            } else if (device_type === 'ios') {
                response({ success: true })
            } else {
                response({ success: true })
            }
        } else {
            response({ success: true })
        }
    })

}

exports.create_user = function (user, user_type, response) {
    let email = '';
    let product_type = '';
    if(SETTINGS_DETAILS === 1){
        product_type = 'live'
    } else if (SETTINGS_DETAILS === 2){
        product_type = 'demo'
    } else {
        product_type = 'development'
    }
    switch (user_type) {
        case ADMIN_DATA_ID.STORE:
            email = product_type + '_store_' + user.email
            break;
        case ADMIN_DATA_ID.USER:
            email = product_type + '_user_' + user.email
            break;
        case ADMIN_DATA_ID.PROVIDER:
            email = product_type + '_provider_' + user.email
            break;
        default:
            email = product_type + '_default_' + user.email
            break;
    }

    email = email.toString().trim()

    fireUser.createUser({ email: email }).then(user => {
        response({ success: true, user })
    }).catch(error => {
        console.log(error)
        response({ success: false })
    })
}

exports.create_user_token = function (user, user_type, response) {
    console.log('inside create user token')
    if (user.uid) {
        fireUser.createCustomToken(user.uid).then(user_token => {
            response({ success: true, user_token })
        }).catch(error => {
            console.log('error thrown create custom token')
            response({success: true, user_token: ''})
        })
    } else {
        console.log('else portion')
        exports.create_user(user, user_type, response_data => {
            if (response_data.success) {
                user.uid = response_data.user.uid
                // console.log(user.uid);

                user.save().then(() => {
                    fireUser.createCustomToken(user.uid).then(user_token => {
                        console.log("success");
                        response({ success: true, user_token })
                    }).catch(error => {
                        console.log.log('error thrown by create user')
                        response({ success: true, user_token: '' })
                    })
                })
            } else {
                response({success: true, user_token: ''})
            }
        })
    }
}