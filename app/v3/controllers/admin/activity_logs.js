require('../../utils/message_code');
require('../../utils/error_code');
require('../../utils/constants');
var ActivityLogs = require('../../../models/admin/activity_log')

exports.get_activity_logs = async function(request_data, response_data){
    var request_data_body = request_data.body
        var search_value = request_data_body.search_value;
        search_value = search_value.replace(/^\s+|\s+$/g, '');
        // search_value = search_value.replace(/ +(?= )/g, '');
        var search = { $match: {}}
        if(search_value !== ""){
            search = {
                $match: {
                    name:  {$regex: new RegExp(search_value, 'i') }
                }
            }
        }

        var user_query = {$match: {}}
        if(request_data_body.user_type !== ""){
            user_query = {
                $match: {
                    'caller_type': (request_data_body.user_type).toString()
                }
            }
        }

        var api_type_query = {$match: {}}
        if(request_data_body.api_type !== ''){
            api_type_query = {
                $match: {
                    'type': request_data_body.api_type
                }
            }
        }


        var api_weight_query = {$match: {}}
        if(request_data_body.api_weight !== ''){
            api_weight_query = {
                $match: {
                    'weight': request_data_body.api_weight
                }
            }
        }
        

        var status_query = {$match: {}}
        if(request_data_body.status !== ''){
            status_query = {
                $match: {
                    'success': request_data_body.status
                }
            }
        }

        var skip = {
            $skip: (request_data_body.page * request_data_body.number_of_record) - request_data_body.number_of_record
        }
        var limit = {
            $limit: request_data_body.number_of_record
        }
        var sort = {
            $sort: {'created_at': -1}
        }
        var count = {$group: {_id: null, total: {$sum: 1}}}
    ActivityLogs.aggregate([user_query, api_type_query, api_weight_query, status_query, search, count]).then(logs => {
        ActivityLogs.aggregate([user_query, api_type_query, api_weight_query, status_query, search, sort, skip, limit]).then(result => {
            var pages = 0
            if(logs.length){
                pages = Math.ceil(logs[0].total / request_data_body.number_of_record);
            }
            response_data.json({
                logs: result,
                pages
            })
        })
    })
    // })   
}