const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    // host: 'smtp.hostinger.com',
    host:'smtpout.secureserver.net',
    port: 465, // Use 587 for TLS or 465 for SSL
    secure: true, // true for 465, false for other ports
    
    auth: {
    user: 'info@dextratechnologies.com', // Your email address
    pass: 'SAJJATHSHAFNA7_ARSLAAN123', // Your email password (or app-specific password)
  },
   
});

module.exports = transporter;

