smongoose = require('../../config/smongoose')
global.smongoose = smongoose()
var mongoose = require('mongoose');
mongoose = require('../../config/mongoose')
db = mongoose()

const Setting = require('mongoose').model('setting');
const Admin = require('mongoose').model('admin')
const Delivery_type = require('mongoose').model('delivery_type')
const Delivery = require('mongoose').model('delivery');
const Country = require('mongoose').model('country');
const City = require('mongoose').model('city');
const Vehicle = require('mongoose').model('vehicle');
const Service = require('mongoose').model('service');
const Document = require('mongoose').model('document');
const Document_uploaded_list = require('mongoose').model('document_uploaded_list');
const Advertise = require('mongoose').model('advertise');

Setting.findOne({}, function (error, setting) {
    setting_detail = setting
    var admin = require("firebase-admin");
    var serviceAccount = {
        "type": setting_detail.type,
        "project_id": setting_detail.project_id,
        "private_key_id": setting_detail.private_key_id,
        "private_key": setting_detail.private_key,
        "client_email": setting_detail.client_email,
        "client_id": setting_detail.client_id,
        "auth_uri": setting_detail.auth_uri,
        "token_uri": setting_detail.token_uri,
        "auth_provider_x509_cert_url": setting_detail.auth_provider_x509_cert_url,
        "client_x509_cert_url": setting_detail.client_x509_cert_url
    };
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: setting_detail.databaseURL
    });
    fireUser = admin.auth()
    fireDB = admin.database();
});

var mongoose = require('mongoose');
let delivery_type_id = new mongoose.Types.ObjectId();
let delivery_type = new Delivery_type({
    _id : delivery_type_id,
    name : "Store"
})

let admin_id = new mongoose.Types.ObjectId();
let admin = new Admin({
    _id : admin_id,
    "email" : "admin@gmail.com",
    "server_token" : "EBAvfXgQuvM6i0UniEKMX1FoaXsLuAfA",
    "password" : "e10adc3949ba59abbe56e057f20f883e",
    "username" : "admin",
    "admin_type" : 1,
    "urls" : []
})

const setupDatabaseForDelivery = async ()=>{
    await Delivery_type.deleteMany()
    await delivery_type.save()
    await Delivery.deleteMany()
}

const setupDatabaseForCountry = async ()=>{
    setting_detail = await Setting.findOne({})
    await Country.deleteMany()
    await Admin.deleteMany()
    await admin.save()
}

const setupDatabaseForCity = async ()=>{
    await City.deleteMany()
}

const setupDatabaseForVehicle = async ()=>{
    await Vehicle.deleteMany()
}

const setupDatabaseForDeliveryPrice = async ()=>{
    await Service.deleteMany()
}

const setupDatabaseForDocument = async ()=>{
    await Document.deleteMany()
    await Document_uploaded_list.deleteMany()
}

const setupDatabaseForAdvertise = async ()=>{
    await Advertise.deleteMany()
}

module.exports={
    delivery_type_id,
    delivery_type,
    admin_id,
    admin,
    setupDatabaseForCountry,
    setupDatabaseForDelivery,
    setupDatabaseForCity,
    setupDatabaseForVehicle,
    setupDatabaseForDeliveryPrice,
    setupDatabaseForDocument,
    setupDatabaseForAdvertise
}