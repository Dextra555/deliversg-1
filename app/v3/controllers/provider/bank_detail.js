require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
var console = require('../../utils/console');

var utils = require('../../utils/utils');
var Bank_detail = require('mongoose').model('bank_detail');
var Provider = require('mongoose').model('provider');
var User = require('mongoose').model('user');
var Store = require('mongoose').model('store');
var Payment_gateway = require('mongoose').model('payment_gateway');
var Country = require('mongoose').model('country');
var City = require('mongoose').model('city');
var fs = require("fs");

// add_bank_detail
exports.add_bank_detail = function (request_data, response_data) {
    console.log(request_data.body)
    utils.check_request_params(request_data.body, [], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var bank_account_holder_name = request_data_body.bank_account_holder_name;

            var bank_holder_type = Number(request_data_body.bank_holder_type);
            var social_id = request_data_body.social_id;
            var encrypted_password = request_data_body.password;
            encrypted_password = utils.encryptPassword(encrypted_password);
            var Table;

            if (request_data.files.length >= 2 || request_data.files) {
                Table = Provider;
                switch (bank_holder_type) {
                    case ADMIN_DATA_ID.USER:
                        Table = User;
                        break;
                    case ADMIN_DATA_ID.PROVIDER:
                        Table = Provider;
                        break;
                    case ADMIN_DATA_ID.STORE:
                        Table = Store;
                        break;
                    default:
                        break;
                }

                Table.findOne({ _id: request_data_body.bank_holder_id }).then((detail) => {

                    if (detail) {
                        if (social_id == undefined || social_id == null || social_id == "") {
                            social_id = null;
                        }
                        if (social_id == null && encrypted_password != "" && encrypted_password != detail.password) {
                            response_data.json({ success: false, error_code: PROVIDER_ERROR_CODE.INVALID_PASSWORD });
                        } else if (social_id != null && detail.social_ids.indexOf(social_id) < 0) {
                            response_data.json({ success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_NOT_REGISTER_WITH_SOCIAL });
                        } else {

                            var query = { $or: [{ '_id': detail.country_id }, { 'country_code': detail.country_code }] };
                            Country.findOne(query).then((country_detail) => {

                                if (!country_detail) {
                                    response_data.json({ success: false, error_code: BANK_DETAIL_ERROR_CODE.BANK_DETAIL_ADD_FAILED, stripe_error: error.message });
                                } else {
                                    City.findOne({ _id: detail.city_id }).then((city_detail) => {
                                        var city_name = "";
                                        if (city_detail) {
                                            city_name = city_detail.city_name;
                                        }
                                        state_name = request_data_body.state;
                                        var country_code = country_detail.country_code;
                                        Payment_gateway.findOne({ _id: city_detail.payment_gateway }).then((payment_gateway) => {
                                            if (payment_gateway) {
                                                if (payment_gateway.name == 'Stripe') {
                                                    var stripe_key = payment_gateway.payment_key;
                                                    var stripe = require("stripe")(stripe_key);
                                                    var pictureData_buffer1 = fs.readFileSync(request_data.files[0].path);
                                                    var pictureData_buffer2 = fs.readFileSync(request_data.files[1].path);
                                                    var pictureData_buffer3 = fs.readFileSync(request_data.files[2].path);
                                                    stripe.tokens.create({
                                                        bank_account: {
                                                            country: "US", // country_detail.alpha2
                                                            currency: "USD",
                                                            account_holder_name: request_data.body.account_holder_name,
                                                            account_holder_type: request_data.body.account_holder_type,
                                                            routing_number: request_data.body.routing_number,
                                                            account_number: request_data.body.account_number
                                                        }
                                                    }, function (err, token) {
                                                        if (err) {
                                                            var error = err;
                                                            response_data.json({ success: false, error_code: BANK_DETAIL_ERROR_CODE.BANK_DETAIL_ADD_FAILED, stripe_error: error.message });
                                                        } else {

                                                            stripe.files.create({
                                                                file: {
                                                                    data: pictureData_buffer1,
                                                                    name: "front.jpg",
                                                                    type: "application/octet-stream",
                                                                },
                                                                purpose: "identity_document",
                                                            }, (err, fileUpload) => {
                                                                stripe.files.create({
                                                                    file: {
                                                                        data: pictureData_buffer2,
                                                                        name: "back.jpg",
                                                                        type: "application/octet-stream",
                                                                    },
                                                                    purpose: "identity_document",
                                                                }, (err, fileUpload1) => {

                                                                    stripe.files.create({
                                                                        file: {
                                                                            data: pictureData_buffer3,
                                                                            name: "back.jpg",
                                                                            type: "application/octet-stream",
                                                                        },
                                                                        purpose: "identity_document",
                                                                    }, (err, fileUpload2) => {

                                                                        var dob = request_data.body.dob;
                                                                        dob = dob.split('-');
                                                                        // var phone_number = '+1' + detail.phone ;
                                                                        var phone_number = detail.country_phone_code + detail.phone;
                                                                        if (bank_holder_type != ADMIN_DATA_ID.STORE) {
                                                                            var name = detail.first_name + ' ' + detail.last_name;
                                                                        } else {
                                                                            var name = detail.name[0];
                                                                        }
                                                                        /*stripe.accounts.create({
                                                                            type: 'custom',
                                                                            country: "CH", // country_detail.alpha2
                                                                            email: detail.email,
                                                                            requested_capabilities: [
                                                                              'card_payments',
                                                                              'transfers',
                                                                            ],
                                                                            legal_entity: {
                                                                                first_name: name,
                                                                                last_name: name,
                                                                                dob: {
                                                                                    day: dob[1],
                                                                                    month: dob[0],
                                                                                    year: dob[2]
                                                                                },
                                                                                type: request_data_body.account_holder_type,
                                                                                address: {
                                                                                    city: city_name,
                                                                                    country: "CH",
                                                                                    line1: request_data.body.address,
                                                                                    line2: request_data.body.address,
                                                                                },
                                                                                verification: {
                                                                                    document: fileUpload.id
                                                                                }
                                                                            }
                                                                        }, function (err, account) {*/
                                                                        stripe.accounts.create({
                                                                            type: 'custom',
                                                                            country: "US", // country_detail.alpha2
                                                                            email: detail.email,
                                                                            requested_capabilities: [
                                                                                'card_payments',
                                                                                'transfers',
                                                                            ],
                                                                            business_type: 'individual',
                                                                            business_profile: {
                                                                                mcc: "4789",
                                                                                name: name,
                                                                                product_description: "We sell transportation services to passengers, and we charge once the job is complete",
                                                                                support_email: setting_detail.admin_email
                                                                            },
                                                                            individual: {
                                                                                first_name: name,
                                                                                last_name: name,
                                                                                email: detail.email,
                                                                                id_number: request_data.body.personal_id_number,
                                                                                phone: phone_number,
                                                                                gender: request_data.body.gender,
                                                                                dob: {
                                                                                    day: dob[0],
                                                                                    month: dob[1],
                                                                                    year: dob[2]
                                                                                },
                                                                                address: {
                                                                                    city: city_name,
                                                                                    state: state_name,
                                                                                    country: "US",
                                                                                    line1: request_data.body.address,
                                                                                    postal_code: request_data.body.postal_code
                                                                                },
                                                                                verification: {
                                                                                    document: {
                                                                                        front: fileUpload.id,
                                                                                        back: fileUpload1.id
                                                                                    },
                                                                                    additional_document: {
                                                                                        front: fileUpload2.id
                                                                                    }
                                                                                }
                                                                            }
                                                                        }, function (err, account) {
                                                                            var err = err;
                                                                            if (err || !account) {
                                                                                response_data.json({ success: false, error_code: BANK_DETAIL_ERROR_CODE.BANK_DETAIL_ADD_FAILED, stripe_error: err.message });
                                                                            } else {
                                                                                stripe.accounts.createExternalAccount(
                                                                                    account.id,
                                                                                    {
                                                                                        external_account: token.id,
                                                                                        default_for_currency: true
                                                                                    },
                                                                                    function (err, bank_account) {
                                                                                        var err = err;
                                                                                        if (err || !bank_account) {
                                                                                            response_data.json({ success: false, error_code: BANK_DETAIL_ERROR_CODE.BANK_DETAIL_ADD_FAILED, stripe_error: err.message });
                                                                                        } else {
                                                                                            detail.account_id = account.id;
                                                                                            detail.bank_id = bank_account.id;
                                                                                            detail.save();
                                                                                            stripe.accounts.update(
                                                                                                account.id,
                                                                                                {
                                                                                                    tos_acceptance: {
                                                                                                        date: Math.floor(Date.now() / 1000),
                                                                                                        ip: request_data.connection.remoteAddress // Assumes you're not using a proxy
                                                                                                    }
                                                                                                }, function (err, update_bank_account) {
                                                                                                    console.log(err)
                                                                                                    if (err || !update_bank_account) {
                                                                                                        var error = err;
                                                                                                        response_data.json({ success: false, error_code: BANK_DETAIL_ERROR_CODE.BANK_DETAIL_ADD_FAILED, stripe_error: error.message });
                                                                                                    } else {
                                                                                                        console.log('everything ok')

                                                                                                        var files_list = [
                                                                                                            { 'front': fileUpload.id },
                                                                                                            { 'back': fileUpload1.id },
                                                                                                            { 'extra': fileUpload2.id },
                                                                                                        ]

                                                                                                        Bank_detail.find({ bank_holder_id: request_data_body.bank_holder_id, bank_holder_type: bank_holder_type }).then((bank_details) => {
                                                                                                            var bank_detail = new Bank_detail({
                                                                                                                bank_holder_type: bank_holder_type,
                                                                                                                account_holder_type: request_data_body.account_holder_type,
                                                                                                                bank_holder_id: request_data_body.bank_holder_id,
                                                                                                                bank_account_holder_name: bank_account_holder_name,
                                                                                                                routing_number: request_data_body.routing_number,
                                                                                                                account_number: request_data_body.account_number,
                                                                                                                account_id: account.id,
                                                                                                                bank_id: bank_account.id,
                                                                                                                files_list: files_list
                                                                                                            });

                                                                                                            if (bank_details.length > 0) {
                                                                                                                bank_detail.is_selected = false;

                                                                                                            } else {
                                                                                                                bank_detail.is_selected = true;

                                                                                                            }

                                                                                                            bank_detail.save().then(() => {
                                                                                                                detail.selected_bank_id = bank_detail._id;
                                                                                                                detail.save();
                                                                                                                response_data.json({
                                                                                                                    success: true, message: BANK_DETAIL_MESSAGE_CODE.BANK_DETAIL_ADD_SUCCESSFULLY,
                                                                                                                    bank_detail: bank_detail
                                                                                                                });
                                                                                                            }, (error) => {
                                                                                                                console.log(error);
                                                                                                                response_data.json({
                                                                                                                    success: false,
                                                                                                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                                                                });

                                                                                                            });
                                                                                                        }, (error) => {
                                                                                                            console.log(error);
                                                                                                            response_data.json({
                                                                                                                success: false,
                                                                                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                                                            });

                                                                                                        });
                                                                                                    }
                                                                                                });
                                                                                        }
                                                                                    }
                                                                                );
                                                                            }
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        }

                                                    });
                                                } else if (payment_gateway.name == 'Paystack') {
                                                    console.log('paystack')
                                                    const https = require('https')
                                                    const options = {
                                                        hostname: 'api.paystack.co',
                                                        port: 443,
                                                        path: '/bank/resolve?account_number=' + request_data_body.account_number + '&bank_code=' + request_data_body.routing_number + '&currency=NGN',
                                                        method: 'GET',
                                                        headers: {
                                                            Authorization: 'Bearer ' + payment_gateway.payment_key
                                                        }
                                                    }
                                                    console.log(options)
                                                    var request = https.request(options, res_data => {
                                                        let data = ''
                                                        res_data.on('data', (chunk) => {
                                                            data += chunk
                                                        });
                                                        res_data.on('end', () => {
                                                            var bank_account_response = JSON.parse(data);
                                                            console.log(bank_account_response)
                                                            if (bank_account_response.status) {

                                                                Bank_detail.find({ bank_holder_id: request_data_body.bank_holder_id, bank_holder_type: bank_holder_type }).then((bank_details) => {
                                                                    var bank_detail = new Bank_detail({
                                                                        bank_holder_type: bank_holder_type,
                                                                        account_holder_type: request_data_body.account_holder_type,
                                                                        bank_holder_id: request_data_body.bank_holder_id,
                                                                        bank_account_holder_name: bank_account_holder_name,
                                                                        routing_number: request_data_body.routing_number,
                                                                        account_number: bank_account_response.data.account_number,
                                                                        account_id: bank_account_response.data.bank_id,
                                                                        bank_id: bank_account_response.data.bank_id
                                                                    });

                                                                    if (bank_details.length > 0) {
                                                                        bank_detail.is_selected = false;

                                                                    } else {
                                                                        bank_detail.is_selected = true;

                                                                    }

                                                                    bank_detail.save().then(() => {
                                                                        detail.account_id = bank_account_response.data.bank_id;
                                                                        detail.bank_id = bank_account_response.data.bank_id;
                                                                        detail.save();
                                                                        detail.selected_bank_id = bank_detail._id;
                                                                        detail.save();
                                                                        response_data.json({
                                                                            success: true, message: BANK_DETAIL_MESSAGE_CODE.BANK_DETAIL_ADD_SUCCESSFULLY,
                                                                            bank_detail: bank_detail
                                                                        });
                                                                    }, (error) => {
                                                                        console.log(error);
                                                                        response_data.json({
                                                                            success: false,
                                                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                        });

                                                                    });
                                                                }, (error) => {
                                                                    console.log(error);
                                                                    response_data.json({
                                                                        success: false,
                                                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                                    });

                                                                });
                                                            } else {
                                                                response_data.json({
                                                                    success: false,
                                                                    stripe_error: bank_account_response.message,
                                                                    // error_code: error_message.ERROR_CODE_FOR_ACCOUNT_DETAIL_NOT_VALID
                                                                });
                                                            }
                                                        })
                                                    }).on('error', error => {
                                                        console.error(error)
                                                    });
                                                    request.end()

                                                }
                                            }
                                        });
                                    }, (error) => {
                                        console.log(error);
                                        response_data.json({
                                            success: false,
                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                        });
                                    });
                                }
                            });

                        }

                    } else {
                        response_data.json({ success: false, error_code: ERROR_CODE.DETAIL_NOT_FOUND });

                    }
                });
            } else {
                console.log('--------erro----')
                response_data.json({
                    success: false,
                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                });
            }
        } else {
            response_data.json(response);
        }
    });

};

// get bank detail
exports.get_bank_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'bank_holder_type' }, { name: 'bank_holder_id', type: 'string' }], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var bank_holder_type = Number(request_data_body.bank_holder_type);
            var Table;
            switch (bank_holder_type) {
                case ADMIN_DATA_ID.USER:
                    Table = User;
                    break;
                case ADMIN_DATA_ID.PROVIDER:
                    Table = Provider;
                    break;
                case ADMIN_DATA_ID.STORE:
                    Table = Store;
                    break;
                default:
                    break;
            }

            Table.findOne({ _id: request_data_body.bank_holder_id }).then((detail) => {

                if (detail) {
                    if (request_data_body.server_token !== null && detail.server_token != request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {

                        Bank_detail.find({ bank_holder_type: bank_holder_type, bank_holder_id: request_data_body.bank_holder_id }).then((bank_detail) => {
                            if (bank_detail.length == 0) {
                                response_data.json({ success: false, error_code: BANK_DETAIL_ERROR_CODE.BANK_DETAIL_NOT_FOUND });
                            } else {
                                response_data.json({
                                    success: true, message: BANK_DETAIL_MESSAGE_CODE.BANK_DETAIL_LIST_SUCCESSFULLY,
                                    bank_detail: bank_detail
                                });
                            }
                        });

                    }

                }
            }, (error) => {
                console.log(error);
                response_data.json({
                    success: false,
                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                });
            });
        } else {
            response_data.json(response);
        }
    });
};

// Delete bank detail
exports.delete_bank_detail = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'bank_holder_id', type: 'string' }, { name: 'bank_holder_type', }, { name: 'bank_detail_id', type: 'string' }], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var bank_holder_type = Number(request_data_body.bank_holder_type);
            var social_id = request_data_body.social_id;
            var encrypted_password = request_data_body.password;
            encrypted_password = utils.encryptPassword(encrypted_password);
            var Table;
            switch (bank_holder_type) {
                case ADMIN_DATA_ID.USER:
                    Table = User;
                    break;
                case ADMIN_DATA_ID.PROVIDER:
                    Table = Provider;
                    break;
                case ADMIN_DATA_ID.STORE:
                    Table = Store;
                    break;
                default:
                    break;
            }
            Table.findOne({ _id: request_data_body.bank_holder_id }).then((detail) => {

                if (detail) {
                    if (social_id == undefined || social_id == null || social_id == "") {
                        social_id = null;
                    }
                    if (social_id == null && encrypted_password != "" && encrypted_password != detail.password) {
                        response_data.json({ success: false, error_code: PROVIDER_ERROR_CODE.INVALID_PASSWORD });
                    } else if (social_id != null && detail.social_ids.indexOf(social_id) < 0) {
                        response_data.json({ success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_NOT_REGISTER_WITH_SOCIAL });
                    } else {
                        var bank_detail_id = request_data_body.bank_detail_id;
                        // Bank_detail.findOne({bank_holder_type: bank_holder_type, bank_holder_id: request_data_body.bank_holder_id}).then((bank_detail) => {

                        Bank_detail.findById(request_data_body.bank_detail_id).then((bank_detail) => {
                            if (bank_detail) {
                                Payment_gateway.findOne({}).then((payment_gateway) => {
                                    if (payment_gateway) {
                                        if (Payment_gateway.name == 'Stripe') {
                                            var stripe_key = payment_gateway.payment_key;
                                            var stripe = require("stripe")(stripe_key);
                                            // bank_detail.account_id = 'acct_1HP6jjK0gOAcYfYD';
                                            stripe.accounts.del(bank_detail.account_id, function (error, stripe_delete) {
                                                var error = error;
                                                if (error || !stripe_delete) {
                                                    console.log(error)
                                                    response_data.json({ success: false, error_code: BANK_DETAIL_ERROR_CODE.BANK_DETAIL_DELETE_FAILED });
                                                } else {
                                                    Bank_detail.remove({ _id: bank_detail_id, bank_holder_type: bank_holder_type }).then(() => {

                                                        Bank_detail.find({ bank_holder_type: bank_holder_type, bank_holder_id: request_data_body.bank_holder_id }).then((bank_detail) => {

                                                            response_data.json({
                                                                success: true,
                                                                message: BANK_DETAIL_MESSAGE_CODE.BANK_DETAIL_DELETE_SUCCESSFULLY,
                                                                bank_detail: bank_detail
                                                            });
                                                        }, (error) => {
                                                            console.log('error');
                                                            console.log(error);
                                                            response_data.json({
                                                                success: false,
                                                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                            });
                                                        });
                                                    }, (error) => {
                                                        console.log(error);
                                                        response_data.json({
                                                            success: false,
                                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                        });
                                                    });

                                                }
                                            });
                                        } else {
                                            Bank_detail.remove({ _id: bank_detail_id, bank_holder_type: bank_holder_type }).then(() => {

                                                Bank_detail.find({ bank_holder_type: bank_holder_type, bank_holder_id: request_data_body.bank_holder_id }).then((bank_detail) => {

                                                    response_data.json({
                                                        success: true,
                                                        message: BANK_DETAIL_MESSAGE_CODE.BANK_DETAIL_DELETE_SUCCESSFULLY,
                                                        bank_detail: bank_detail
                                                    });
                                                }, (error) => {
                                                    console.log('error');
                                                    console.log(error);
                                                    response_data.json({
                                                        success: false,
                                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                    });
                                                });
                                            }, (error) => {
                                                console.log(error);
                                                response_data.json({
                                                    success: false,
                                                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                                });
                                            });

                                        }

                                    }
                                });
                            } else {
                                response_data.json({ success: false, error_code: BANK_DETAIL_ERROR_CODE.BANK_DETAIL_DELETE_FAILED });

                            }
                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }

                } else {
                    response_data.json({ success: false, error_code: ERROR_CODE.DETAIL_NOT_FOUND });
                }
            }, (error) => {
                console.log(error);
                response_data.json({
                    success: false,
                    error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                });
            });
        } else {
            response_data.json(response);
        }
    });
};

// select_bank_detail
exports.select_bank_detail = function (request_data, response_data) {

    utils.check_request_params(request_data.body, [{ name: 'bank_holder_type' }, { name: 'bank_holder_id', type: 'string' }, { name: 'bank_detail_id', type: 'string' }], function (response) {
        if (response.success) {

            var request_data_body = request_data.body;
            var bank_holder_type = Number(request_data_body.bank_holder_type);
            var Table;
            switch (bank_holder_type) {
                case ADMIN_DATA_ID.USER:
                    Table = User;
                    break;
                case ADMIN_DATA_ID.PROVIDER:
                    Table = Provider;
                    break;
                case ADMIN_DATA_ID.STORE:
                    Table = Store;
                    break;
                default:
                    break;
            }

            Table.findOne({ _id: request_data_body.bank_holder_id }).then((detail) => {
                if (detail) {
                    if (request_data_body.server_token !== null && detail.server_token !== request_data_body.server_token) {
                        response_data.json({ success: false, error_code: ERROR_CODE.INVALID_SERVER_TOKEN });
                    } else {
                        Bank_detail.findOne({ _id: request_data_body.bank_detail_id, bank_holder_type: bank_holder_type, bank_holder_id: request_data_body.bank_holder_id }).then((bank_detail) => {
                            if (!bank_detail) {
                                response_data.json({ success: false, error_code: BANK_DETAIL_ERROR_CODE.BANK_DETAIL_NOT_FOUND });
                            } else {
                                bank_detail.is_selected = true;
                                bank_detail.save().then(() => {
                                    Bank_detail.findOneAndUpdate({ _id: { $nin: request_data_body.bank_detail_id }, bank_holder_type: bank_holder_type, bank_holder_id: request_data_body.bank_holder_id, is_selected: true }, { is_selected: false }).then((bank_details) => {

                                        detail.selected_bank_id = bank_detail._id;
                                        detail.save();
                                        response_data.json({
                                            success: true, message: BANK_DETAIL_MESSAGE_CODE.BANK_DETAIL_SELECT_SUCCESSFULLY
                                        });
                                    }, (error) => {
                                        console.log(error);
                                        response_data.json({
                                            success: false,
                                            error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                        });
                                    });
                                }, (error) => {
                                    console.log(error);
                                    response_data.json({
                                        success: false,
                                        error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                                    });
                                });
                            }
                        }, (error) => {
                            console.log(error);
                            response_data.json({
                                success: false,
                                error_code: ERROR_CODE.SOMETHING_WENT_WRONG
                            });
                        });
                    }
                } else {

                    response_data.json({ success: false, error_code: ERROR_CODE.DETAIL_NOT_FOUND });
                }
            });
        } else {
            response_data.json(response);
        }
    });
};


exports.get_bank_file_url = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{ name: 'bank_holder_id', type: 'string' }, { name: 'bank_holder_type', }, { name: 'file_id', type: 'string' }], function (response) {
        if (response.success) {
            var request_data_body = request_data.body;
            var bank_holder_type = Number(request_data_body.bank_holder_type);
            var social_id = request_data_body.social_id;
            var encrypted_password = request_data_body.password;
            encrypted_password = utils.encryptPassword(encrypted_password);
            var Table;
            switch (bank_holder_type) {
                case ADMIN_DATA_ID.USER:
                    Table = User;
                    break;
                case ADMIN_DATA_ID.PROVIDER:
                    Table = Provider;
                    break;
                case ADMIN_DATA_ID.STORE:
                    Table = Store;
                    break;
                default:
                    break;
            }
            Table.findOne({ _id: request_data_body.bank_holder_id }).then((detail) => {
                if (detail) {
                    if (social_id == undefined || social_id == null || social_id == "") {
                        social_id = null;
                    }
                    if (social_id == null && encrypted_password != "" && encrypted_password != detail.password) {
                        response_data.json({ success: false, error_code: PROVIDER_ERROR_CODE.INVALID_PASSWORD });
                    } else if (social_id != null && detail.social_ids.indexOf(social_id) < 0) {
                        response_data.json({ success: false, error_code: PROVIDER_ERROR_CODE.PROVIDER_NOT_REGISTER_WITH_SOCIAL });
                    } else {

                        var file_id = request_data_body.file_id;
                        Payment_gateway.findOne({}).then((payment_gateway) => {
                            if (payment_gateway) {
                                var stripe_key = payment_gateway.payment_key;
                                var stripe = require("stripe")(stripe_key);
                                stripe.fileLinks.list().then(fileLinks => {
                                    response_data.json({ success: true, fileLinks })
                                })
                            } else {
                                response_data.json({ success: false, error_code: ERROR_CODE.SOMETHING_WENT_WRONG })
                            }
                        })
                    }
                } else {
                    response_data.json({ success: false, error_code: ERROR_CODE.DETAIL_NOT_FOUND });

                }
            })
        } else {
            response_data.json(response);

        }
    })
}