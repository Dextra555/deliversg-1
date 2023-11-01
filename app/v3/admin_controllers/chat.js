require('../utils/message_code');
require('../utils/error_code');
require('../utils/constants');
var utils = require('../utils/utils');
var Advertise = require('mongoose').model('advertise');
var mongoose = require('mongoose');
var console = require('../utils/console');

//send_chat
exports.send_chat = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name:"order_id"}], function (response) {
        if (response.success) {
            request_data_body = request_data.body;
            var ref = fireDB.ref(request_data_body.order_id).child(request_data_body.chat_type);   
            var key = ref.push().getKey()

            // chat_type
            // 12 (admin user)
            // 13 (admin provider)
            // 14 (admin store)
            // 23 (user provider)
            // 24 (user store)
            // 34 (provider store)

            //sender_type
            // 1 - admin 
            // 2 - user 
            // 3 - provider 
            // 4 - store

            ref.child(key).set({
                "id":key,
                "message": request_data_body.message,
                "chat_type":request_data_body.chat_type,
                "sender_type": request_data_body.sender_type,
                "receiver_id": request_data_body.receiver_id,
                "time":new Date().toISOString(),
                "is_read": false,
                "is_notify": false
            }, function(error) {
                if (error) {
                    response_data.json({success: false})
                } else {
                    response_data.json({success: true})
                }
            });
        } else {
            response_data.json(response);
        }
    });
};

exports.read_chat = function (request_data, response_data) {
    utils.check_request_params(request_data.body, [{name:"order_id"}], function (response) {
        if (response.success) {
            request_data_body = request_data.body;

            var ref = fireDB.ref(request_data_body.order_id).child(request_data_body.chat_type);   

            if(!request_data_body.sender_type){
                request_data_body.sender_type = 1;
            }
            ref.once("value", function(snapshot) {
                if(snapshot){
                    var chat_object = snapshot.val()
                    if(chat_object != null){
                        var keys = Object.keys(chat_object)
                        keys.forEach((element,index) => {
                            if(chat_object[element].sender_type != request_data_body.sender_type && chat_object[element].is_read == false){
                                ref.child(element).child("is_read").set(true)
                            }
                        });
                    }
                    response_data.json({success:true, data: snapshot.val()});
                }
            });
        } else {
            response_data.json(response);
        }
    });
};