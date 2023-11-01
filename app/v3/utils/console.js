var is_debug_log = true;
exports.log = function (value) {
    if(is_debug_log){
        console.log(value);
    }
}

exports.error = function (value) {
    if(is_debug_log){
        console.log(value);
    }
}