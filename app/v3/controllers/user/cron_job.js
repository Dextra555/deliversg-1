'user strict';
require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/push_code');
require('../../utils/constants');
let utils = require('../../utils/utils');
let emails = require('../email_sms/emails')
let cron = require('./cron_job');
let schedule = require('node-schedule');
let moment = require('moment');
let my_request = require('../../controllers/store/request');
let Country = require('mongoose').model('country');
let Provider = require('mongoose').model('provider');
let User = require('mongoose').model('user')
let Store = require('mongoose').model('store');
let City = require('mongoose').model('city');
let Order = require('mongoose').model('order');
let Order_payment = require('mongoose').model('order_payment');
let Promo_code = require('mongoose').model('promo_code');
let Request = require('mongoose').model('request');
let Document_uploaded = require('mongoose').model('document_uploaded_list')
let Document = require('mongoose').model('document')
let console = require('../../utils/console');


let run_continue_30_sec_cron = schedule.scheduleJob('*/30 * * * * *', function () {
    Request.find({ delivery_status: ORDER_STATE.WAITING_FOR_DELIVERY_MAN }).then((requests) => {
        let end_time = new Date();
        let start_time = new Date();
        requests.forEach(function (request) {
            let index = request.date_time.findIndex((x) => x.status == ORDER_STATE.WAITING_FOR_DELIVERY_MAN);
            if (index >= 0) {
                start_time = request.date_time[index].date;
            }
            let time_diff_sec = utils.getTimeDifferenceInSecond(end_time, start_time);
            let time_left_to_responds_trip = setting_detail.provider_timeout - time_diff_sec;
            if (time_left_to_responds_trip <= -10) {
                my_request.findNearestProvider(request, null);
            }
        });
    }, (error) => {
        console.log(error)
    });
});

let run_continue_1_day_cron = schedule.scheduleJob('*/23 * * *', async () => {
    console.log('email cron')
    try {
        // let documents = []
        let document = await Document.find({})
        if(document.length > 0){
            document.forEach(async document => {
                let emailArray = []
                let uploadedDocuments = await Document_uploaded.find({ document_id: document._id })
                if (uploadedDocuments.length > 0) {
                    uploadedDocuments.forEach(async (uploadedDocument, index) => {
                        if (uploadedDocument.expired_date) {
                            let today = new Date().toISOString()
                            if (new Date(today).getDate() > uploadedDocument.expired_date.getDate()) {
                                if (uploadedDocument.expiration_notification_sent_count < 3) {
                                    let Table;
                                    switch (document.document_for) {
                                        case ADMIN_DATA_ID.USER:
                                            //User Case
                                            Table = User
                                            break;
                                        case ADMIN_DATA_ID.PROVIDER:
                                            //Provider Case
                                            Table = Provider
                                            break;
                                        case ADMIN_DATA_ID.STORE:
                                            //Store Case
                                            Table = Store
                                            break;
                                        default:
                                            Table = User
                                            break;
                                    }
                                    let user_detail = await Table.findById(uploadedDocument.user_id)
                                    let document_detail = await Document.findById(uploadedDocument.document_id)
                                    if (user_detail !== undefined && document_detail !== undefined) {
                                        uploadedDocument.expiration_notification_sent_count++;
                                        emailArray.push(user_detail.email)
                                    }
                                    if (index === uploadedDocuments.length - 1) {
                                        console.log(emailArray)
                                        emails.documentExpired(emailArray, document_detail.document_name)
                                    }
                                    await uploadedDocument.save()
                                }
                            }
                        }
                    })
                    // setTimeout(() => {
                    //     console.log(emailArray)
                    // },0)
                }
            })
        }
        // let documents = await Document_uploaded.find({})
        // let count = 0
        // if (documents.length > 0) {
        //     documents.forEach(async document => {
        //         if (document.expired_date) {
        //             let today = new Date().toISOString()
        //             // check document is weather expired or not.
        //             if(new Date(today).getDate() > document.expired_date.getDate()){
        //                 if(document.expiration_notification_sent_count < 3 && count === 1){
        //                     let Table = User
        //                     document.expiration_notification_sent_count ++;
        //                     switch(document.document_for){
        //                         case ADMIN_DATA_ID.USER:
        //                             //User Case
        //                             Table = User
        //                         case ADMIN_DATA_ID.PROVIDER:
        //                             //Provider Case
        //                             Table = Provider
        //                         case ADMIN_DATA_ID.STORE:
        //                             //Store Case
        //                             Table = Store
        //                         default:
        //                             Table = User
        //                             break;
        //                     }
        //                     let user_detail = await Table.findById(document.user_id)
        //                     let document_detail = await Document.findById(document.document_id)
        //                     if(user_detail !== undefined && document_detail !== undefined){
        //                         emails.documentExpired(user_detail, document_detail.document_name)
        //                     }
        //                     await document.save()
        //                 }                        
        //             }
        //         }
        //     })
        // }
    } catch (error) {
        console.log(error)
    }
})

let run_continue_24_hour_cron = schedule.scheduleJob('*/23 * * *', async () => {
    try{
        let cities = await City.find({})
        if(cities.length > 0){
            await cities.forEach(async city => {
                if (city.is_check_provider_wallet_amount_for_received_cash_request) {
                    let providers = await Provider.find({city_id: city._id})
                    if(providers.length>0){
                        await providers.forEach(async provider => {
                            if (provider.wallet < city.provider_min_wallet_amount_for_received_cash_request){
                                emails.providerWalletBelowMinimumAmount(provider)
                            }
                        })
                    }
                }
            })   
        }
    } catch (error) {
        console.log(error)
    }
})

exports.schedule_order_push = function () {
    Order.find({ is_schedule_order: true, is_schedule_order_informed_to_store: false, order_status: { $lt: ORDER_STATE.WAITING_FOR_DELIVERY_MAN } }).then((orders) => {
        if (orders.length > 0) {df
            orders.forEach(function (order) {
                let order_unique_id = order.unique_id;
                let now = new Date();
                Store.findOne({ _id: order.store_id }).then((store) => {
                    if (store) {
                        let device_token = store.device_token;
                        let device_type = store.device_type;
                        let inform_schedule_order_before_min = store.inform_schedule_order_before_min;
                        let schedule_order_start_at = order.schedule_order_start_at;

                        let time_diff_min = utils.getTimeDifferenceInMinute(schedule_order_start_at, now);

                        if (time_diff_min <= inform_schedule_order_before_min) {
                            utils.sendPushNotificationWithPushData(ADMIN_DATA_ID.STORE, device_type, device_token, STORE_PUSH_CODE.INFORM_SCHEDULE_ORDER, PUSH_NOTIFICATION_SOUND_FILE.PUSH_NOTIFICATION_SOUND_FILE_IN_IOS, order_unique_id, "");
                            order.is_schedule_order_informed_to_store = true;
                            order.save();
                        }
                    }
                }, (error) => {
                    console.log(error)
                });
            });
        }
    }, (error) => {
        console.log(error)
    });

};

// let run_continue_30_min_cron = schedule.scheduleJob('*/30 * * * * *', function () {
let run_continue_30_min_cron = schedule.scheduleJob('* */30 * * * *', function () {
    City.find({}).then((city_details) => {
        if (city_details) {
            city_details.forEach(function (city_detail) {
                let city_timezone = city_detail.timezone;

                let city_date_now = new Date();
                let city_date_next = city_detail.daily_cron_date;

                if (!city_date_next) {
                    city_date_next = new Date();
                    city_date_next = city_date_next.setMinutes(city_date_next.getMinutes() - 1);
                }

                let city_date_now_tag = moment.utc(utils.get_date_now_at_city(city_date_now, city_timezone)).format("DDMMYYYY");
                let city_date_next_tag = moment.utc(utils.get_date_now_at_city(city_date_next, city_timezone)).format("DDMMYYYY");
                // if (city_date_now_tag == city_date_next_tag) {
                if (city_date_now_tag != city_date_next_tag) {

                    Promo_code.find({ is_promo_expiry_date: true }).then((promo_codes) => {
                        promo_codes.forEach(function (promo_code_detail) {
                            if (promo_code_detail.promo_expire_date !== null) {
                                let expired_date = new Date(promo_code_detail.promo_expire_date);
                                let date = new Date(Date.now());

                                if (expired_date < date) {

                                    if (promo_code_detail.is_expired == false) {

                                        promo_code_detail.is_expired = true;
                                        promo_code_detail.save();

                                    }
                                }
                            }
                        });
                    }, (error) => {
                        console.log(error)
                    });

                    city_date_next = new Date();
                    city_date_next = city_date_next.setMinutes(city_date_next.getMinutes() - 1);
                    city_date_next = new Date(city_date_next);
                    cron.set_online_provider_analytics(city_detail._id, city_timezone, city_date_next);
                    provider_auto_transfer(city_detail)
                    store_auto_transfer(city_detail)
                    city_detail.daily_cron_date = new Date();
                    city_detail.save();
                }

            });
        }
    }, (error) => {
        console.log(error)
    });

    Provider.find({ $or: [{ current_request: { $ne: [] } }, { requests: { $ne: [] } }] }).then((provider_list) => {

        provider_list.forEach(function (provider_detail) {
            provider_detail.current_request.forEach(function (current_order_id) {
                remove_current_request_from_provider(provider_detail, current_order_id)
            })
            provider_detail.requests.forEach(function (current_order_id) {
                remove_request_from_provider(provider_detail, current_order_id)
            })
        });
    }, (error) => {
        console.log(error)
    })
});

function remove_request_from_provider(provider_detail, current_order_id) {
    Request.findOne({ _id: current_order_id }).then((order_detail) => {
        if (order_detail && order_detail.delivery_status_manage_id != ORDER_STATUS_ID.IDEAL && order_detail.delivery_status_manage_id != ORDER_STATUS_ID.RUNNING) {
            let index = provider_detail.requests.indexOf(current_order_id)
            if (index != -1) {
                provider_detail.requests.splice(index, 1)
                provider_detail.save();
            }
        }
    }, (error) => {
        console.log(error)
    })
}

function remove_current_request_from_provider(provider_detail, current_order_id) {
    Request.findOne({ _id: current_order_id }).then((order_detail) => {
        if (order_detail && order_detail.delivery_status_manage_id != ORDER_STATUS_ID.IDEAL && order_detail.delivery_status_manage_id != ORDER_STATUS_ID.RUNNING) {
            let index = provider_detail.current_request.indexOf(current_order_id)
            if (index != -1) {
                provider_detail.current_request.splice(index, 1)
                provider_detail.save();
            }
        }
    }, (error) => {
        console.log(error)
    })
}

function provider_auto_transfer(city_detail) {
    let today = new Date(Date.now());
    Country.findOne({ _id: city_detail.country_id }).then((country_detail) => {
        if (country_detail.is_auto_transfer_for_store) {
            // if (country_detail.is_auto_transfer) {
            let auto_transfer_day = country_detail.auto_transfer_day;
            let final_day = new Date(today.setDate(today.getDate() - auto_transfer_day));
            Provider.find({
                provider_type: ADMIN_DATA_ID.ADMIN, city_id: city_detail._id, last_transferred_date: { $lte: final_day }, account_id: { $exist: true }, account_id: { $ne: '' },
                bank_id: { $exist: true }, bank_id: { $ne: '' }
            }).then((provider_list) => {
                provider_list.forEach(function (provider_detail) {
                    transfer_payment_to_provider(provider_detail, country_detail.currencycode, country_detail._id, city_detail.payment_gateway);
                });
            }, (error) => {
                console.log(error)
            });
        }
    }, (error) => {
        console.log(error)
    });
}

function transfer_payment_to_provider(provider_detail, currencycode, country_id, payment_method) {
    let order_query = {
        $lookup:
        {
            from: "orders",
            localField: "order_id",
            foreignField: "_id",
            as: "order_detail"
        }
    };
    let array_to_json_order_query = { $unwind: "$order_detail" };
    Order_payment.aggregate([
        order_query, array_to_json_order_query,
        { $match: { 'order_detail.order_status_id': { $eq: ORDER_STATUS_ID.COMPLETED } } },
        { $match: { 'provider_id': { $eq: provider_detail._id } } },
        { $match: { 'is_provider_income_set_in_wallet': { $eq: false } } },
        { $match: { 'is_transfered_to_provider': { $eq: false } } },
        { $group: { _id: null, total: { $sum: '$pay_to_provider' } } }
    ]).then((order_payment_list) => {
        if (order_payment_list.length > 0) {
            let amount = order_payment_list[0].total.toFixed(2)
            utils.transfer_amount_to_employee(amount, provider_detail.account_id, currencycode, payment_method, function (response_data) {
                if (response_data) {
                    utils.add_transfered_history(ADMIN_DATA_ID.PROVIDER, provider_detail._id, country_id,
                        amount, currencycode, 1, response_data.transfer_id, ADMIN_DATA_ID.ADMIN, null);
                    Order_payment.update({ is_provider_income_set_in_wallet: false, is_transfered_to_provider: false, provider_id: provider_detail._id }, { is_transfered_to_provider: true }, { multi: true }, function (error, order_payment_detail) {

                    });
                    provider_detail.last_transferred_date = new Date();
                    provider_detail.save();
                } else {
                    utils.add_transfered_history(ADMIN_DATA_ID.PROVIDER, provider_detail._id, country_id,
                        amount, currencycode, 0, '', ADMIN_DATA_ID.ADMIN, response_data.error);
                }
            });
        }
    }, (error) => {
        console.log(error)
    })
}

function store_auto_transfer(city_detail) {
    let today = new Date(Date.now());
    Country.findOne({ _id: city_detail.country_id }).then((country_detail) => {
        if (country_detail.is_auto_transfer_for_store) {
            // if(country_detail.is_auto_transfer){
            let auto_transfer_day = country_detail.auto_transfer_day_for_store;
            let final_day = new Date(today.setDate(today.getDate() - auto_transfer_day));
            Store.find({
                store_type: ADMIN_DATA_ID.ADMIN, city_id: city_detail._id, last_transferred_date: { $lte: final_day }, account_id: { $exist: true }, account_id: { $ne: '' },
                bank_id: { $exist: true }, bank_id: { $ne: '' }
            }).then((store_list) => {
                store_list.forEach(function (store_detail) {
                    transfer_payment_to_store(store_detail, country_detail.currencycode, country_detail._id, city_detail.payment_gateway);
                });
            });
        }
    }, (error) => {
        console.log(error)
    });
}

function transfer_payment_to_store(store_detail, currencycode, country_id, payment_gateway) {
    let order_query = {
        $lookup:
        {
            from: "orders",
            localField: "order_id",
            foreignField: "_id",
            as: "order_detail"
        }
    };
    let array_to_json_order_query = { $unwind: "$order_detail" };
    Order_payment.aggregate([
        order_query, array_to_json_order_query,
        { $match: { 'order_detail.order_status_id': { $eq: ORDER_STATUS_ID.COMPLETED } } },
        { $match: { 'store_id': { $eq: store_detail._id } } },
        { $match: { 'is_store_income_set_in_wallet': { $eq: false } } },
        { $match: { 'is_transfered_to_store': { $eq: false } } },
        { $group: { _id: null, total: { $sum: '$pay_to_store' } } }
    ]).then((order_payment_list) => {
        if (order_payment_list.length > 0) {
            let amount = order_payment_list[0].total.toFixed(2)
            utils.transfer_amount_to_employee(amount, store_detail.account_id, currencycode, payment_gateway, function (response_data) {
                if (response_data) {
                    utils.add_transfered_history(ADMIN_DATA_ID.STORE, store_detail._id, country_id,
                        amount, currencycode, 1, response_data.transfer_id, ADMIN_DATA_ID.ADMIN, null);
                    Order_payment.update({ is_provider_income_set_in_wallet: false, is_transfered_to_provider: false, store_id: store_detail._id }, { is_transfered_to_provider: true }, { multi: true }, function (error, order_payment_detail) {

                    })
                    store_detail.last_transferred_date = new Date();
                    store_detail.save();
                } else {
                    utils.add_transfered_history(ADMIN_DATA_ID.STORE, store_detail._id, country_id,
                        amount, currencycode, 0, '', ADMIN_DATA_ID.ADMIN, response_data.error);
                }
            });
        }
    }, (error) => {
        console.log(error)
    })
}

exports.set_online_provider_analytics = function (city_id, city_timezone, last_day_time) {
    Provider.find({ is_online: true, city_id: city_id }).then((providers) => {
        providers.forEach(function (provider) {
            if (provider) {
                let is_active_time = false;
                if (provider.is_active_for_job) {
                    is_active_time = true;
                }
                utils.insert_daily_provider_analytics_with_date(last_day_time, city_timezone, provider._id, 0, true, provider.start_online_time, is_active_time, provider.start_active_job_time);

                provider.start_online_time = new Date();
                utils.insert_daily_provider_analytics(city_timezone, provider._id, 0, true, null, is_active_time, null);

                if (provider.is_active_for_job) {
                    provider.start_active_job_time = new Date();

                }
                provider.save();
            }
        });
    }, (error) => {
        console.log(error)
    });

};