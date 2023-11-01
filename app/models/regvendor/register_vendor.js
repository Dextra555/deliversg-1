var mongoose = require('mongoose');
// const validator = require('validator');

var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
const { v4: uuidv4 } = require('uuid');

var register_vendor = new schema({

    company_name:    {type: String, default: "",required: true},
    uen:             {type: String, default: "",required: true},
    company_website: {type: String, default: "",required: true},
    industry_type:   {type: String, default: "",required: true},
    company_representative:{type: String, default: "",required: true},
    mobile_no:       {type: Number,default:0,required: true},

    email_address:   {type: String, default: "",required: true,lowercase: true,unique:true,
                        // validate: {
                        //     validator: (value) => validator.isEmail(value), // Use validator to check if it's a valid email
                        //     message: 'Invalid email format',
                        // },
                    },
    mailing_address: {type: String, default: "",required: true,lowercase: true,unique:true,
                        // validate: {
                        //     validator: (value) => validator.isEmail(value), // Use validator to check if it's a valid email  unique:true,
                        //     message: 'Invalid email format',
                        // },
                    },


    
    acra_pro_file:   {type: String, default: ""},
    any_entity_in_overseas:{type: String, default: "",required: true},
    is_pdpa_consent_verified:{type: Boolean, default: "false"},      //
    is_bankcrupty_consent_verified:{type: Boolean, default: "false"},//
    unique_id:{type: Number,unique: true},                           //
    status:{type:Number,default:0},                                  //
    vendor_token:{type: String,default: uuidv4,unique: true},        //
    approve:{type: Boolean, default: "false"},                       //
    user_id:{type:String, default: ""},                              //
    // server_token:{type:String, default: ""},                         //
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
})

register_vendor.plugin(autoIncrement.plugin, {
    model: 'register_vendor',     // The name of the model
    field: 'unique_id', // The name of the auto-incrementing field
    startAt: 1,        // The initial value of the auto-incrementing field
    incrementBy: 1,    // The increment step
  });
module.exports = mongoose.model('register_vendor', register_vendor);