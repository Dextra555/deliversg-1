var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var session = require("express-session");
var path = require("path");
var compression = require('compression');
var async = require("async");
var cors = require('cors')
var app = express();
// var activity_logs = require('./activitylogs')

function parallel(middlewares) {
    return function (req, res, next) {
        async.each(middlewares, function (mw, cb) {
            mw(req, res, cb);
        }, next);
    };
}

module.exports = function () {
    
        // app.use(function(req, res, next) {
        //     res.setHeader('Access-Control-Allow-Origin', '*');
        //     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        //     res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        //     res.setHeader('Access-Control-Allow-Credentials', true);
        //     next();
        // });
    if (process.env.NODE_ENV == 'development') {
        app.use(session({ resave: true, saveUninitialized: true, secret: 'SOMERANDOMSECRETHERE', maxAge: '1h' }));
    } else if (process.env.NODE_ENV == 'production') {
        var RedisStore = require('connect-redis')(session);
        var redis = require("redis");
        var client = redis.createClient();

        ///// FOR SESSION SET /////
        app.use(session({ resave: true, saveUninitialized: true, secret: 'SOMERANDOMSECRETHERE', maxAge: '1h', store: new RedisStore({ host: 'localhost', port: 6379, client: client, ttl: 1440 }) }));
    }


    app.use(parallel([
        express.static(path.join(__dirname, '../dist')),
        express.static(path.join(__dirname, '../uploads')),
        compression(),
        bodyParser.json({ limit: '50mb' }),
        bodyParser.urlencoded({ limit: '50mb', extended: true }),
        multer({ dest: __dirname + '/uploads/' }).any(),
        // activity_logs
    ]));
    

    var whitelist = []
    var corsOptionsDelegate = function (req, callback) {
        var corsOptions;

        //if (whitelist.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
        //} else {
        //  corsOptions = { origin: false } // disable CORS for this request
        //}
        callback(null, corsOptions) // callback expects two parameters: error and options
    }

    // app.use(cors(corsOptionsDelegate))
    app.use(cors())
    var Store = require('mongoose').model('store');
    var Admin = require('mongoose').model('admin');
    var Document_uploaded_list = require('mongoose').model('document_uploaded_list');
    var User = require('mongoose').model('user');
    var Provider = require('mongoose').model('provider');

    app.all('/store_documents/*', function (request_data, response_data, next) {

        if (request_data.headers.type == "admin") {
            Admin.findOne({ server_token: request_data.headers.token }, function (error, admin) {
                if (admin) {
                    next();
                } else {
                    response_data.json();
                }
            });
        } else {
            var id = request_data.url;
            id = id.split('/');
            id = id[2].split('.')
            id = id[0].slice(0, -4);
            Document_uploaded_list.findById(id, function (error, document) {

                if (document) {
                    Store.findById(document.user_id, function (error, store) {
                        if (store) {
                            if (store.server_token == request_data.headers.token) {
                                next();
                            } else {
                                response_data.json();
                            }
                        } else {

                            response_data.json();
                        }
                    })
                } else {
                    response_data.json();
                }
            });
        }
    });

    app.all('/provider_documents/*', function (request_data, response_data, next) {

        if (request_data.headers.type == "admin") {
            Admin.findOne({ server_token: request_data.headers.token }, function (error, admin) {
                if (admin) {
                    next();
                } else {
                    response_data.json();
                }
            })
        } else {
            var id = request_data.url;
            id = id.split('/');
            id = id[2].split('.')
            id = id[0].slice(0, -4);
            Document_uploaded_list.findById(id, function (error, document) {

                if (document) {
                    Provider.findById(document.user_id, function (error, provider) {
                        if (provider) {
                            if (provider.server_token == request_data.headers.token) {
                                next();
                            } else {
                                response_data.json();
                            }
                        } else {
                            response_data.json();
                        }
                    })
                } else {
                    response_data.json();
                }
            });
        }
    });

    app.all('/user_documents/*', function (request_data, response_data, next) {

        if (request_data.headers.type == "admin") {
            Admin.findOne({ server_token: request_data.headers.token }, function (error, admin) {
                if (admin) {
                    next();
                } else {
                    response_data.json();
                }
            })
        } else {
            var id = request_data.url;
            id = id.split('/');
            id = id[2].split('.')
            id = id[0].slice(0, -4);
            Document_uploaded_list.findById(id, function (error, document) {

                if (document) {
                    User.findById(document.user_id, function (error, user) {
                        if (user) {
                            if (user.server_token == request_data.headers.token) {
                                next();
                            } else {
                                response_data.json();
                            }
                        } else {
                            response_data.json();
                        }
                    })
                } else {
                    response_data.json();
                }
            });
        }
    });
    app.use('/v3', require('../app'));
    var router = express.Router();

    // Catch all other routes and return the index file
    // app.get('*', (req, res) => {
    //     res.json({success:false})
    //     res.sendFile(path.join(__dirname, '../dist/index.html'));
    // });

    return app;
};
