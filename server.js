var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var http = require("http");
setting_detail = {};

process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Promise rejection:', reason);
	// Handle or log the rejection appropriately
  });
  
global.root_path = __dirname

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || 8000;
// if (process.env.NODE_ENV == 'production') {
//     var cluster = require('cluster');
//     if (cluster.isMaster) {
//         // Count the machine's CPUs
//         var cpuCount = require('os').cpus().length;

//         // Create a worker for each CPU
//         for (var i = 0; i < cpuCount; i += 1) {
//             cluster.fork();
//         }

// // Code to run if we're in a worker process
//     } else {
//         init();
//     }
// } else {
//     init();
// }

init();

function init() {
	var pkg = require('./package.json');
	
	/*var Greenlock = require("greenlock");
	greenlock = Greenlock.create({
	    configDir: './greenlock.d/config.json',
	    staging: true,	 
	    packageRoot: __dirname,
	    maintainerEmail: 'jon@example.com',
	    packageAgent: pkg.name + '/' +pkg.version,
	    notify: function(event, details) {
	        if ('error' === event) {
	            // `details` is an error object in this case
	            console.error(details);
	        }
	    }
	});*/
	
 
	
	var config = require('./config/config')
	smongoose = require('./config/smongoose')
	global.smongoose = smongoose()
	express = require('./config/express')
	mongoose = require('./config/mongoose')
	db = mongoose()
	app = express();
	const port = process.env.PORT;
	// const port = '8080';
	require('./app/models/admin/activity_log')

	// app.listen(port);

	var http = require('http').createServer(app);

  http.listen(port, function(){
    global.io = require('socket.io')(http, {
      cors: {
        origin: '*',
      }
    });
    //var redis = require('socket.io-redis');
    //io.adapter(redis({ host: 'localhost', port: 6379 }));
    /*const redisAdapter = require('socket.io-redis');
    const redis = require('redis');
    const pubClient = redis.createClient(6379, 'localhost', {});
    const subClient = pubClient.duplicate();
    io.adapter(redisAdapter({ pubClient, subClient }));*/
    //io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));
    
    io.on('connection', function(socket){
      socket.on('room', function (room) {
      console.log('Joining:', room);
          socket.join(room);        
      });
      //leave room
      socket.on('removeRoom', function (data) {
          console.log('Leaving:', data);
          socket.leave(data);
      });
      
    });
  });

	
	var Setting = require('mongoose').model('setting');
	Setting.findOne({}, function (error, setting) {
	    setting_detail = setting
		try {
			var admin = require("firebase-admin");
	    	//var serviceAccount = require("./app/utils/service_account.json");
			var serviceAccount = {
		    	"type": setting_detail.type,
		    	"project_id": setting_detail.project_id,
		    	"private_key_id": setting_detail.private_key_id,
		    	"private_key": setting_detail.private_key.replace(/\\n/g, '\n'),
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

			// admin.auth().createUser({email: 'xyz123@gmail.com'}).then((user) => {
			// 	console.log('user created')
			// 	console.log(user)
			// })

			fireUser = admin.auth()

			fireDB = admin.database();
		} catch(error) {
			console.log('firebase security config remains');
		}

		console.log('Magic happens on port ' + port); 
	});		
	exports = module.exports = app;
}
