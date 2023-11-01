const vendorMail = require('../regvendor/vendor_mail');

exports.cancel_mail  =(req, res) => {
    const mailOptions = {
    from: 'info@dextratechnologies.com',
    to: req.body.usermail,
    subject: "Cancel Order ",
    text: "Feedback for the Account: "+ req.body.feedback + ","+"\n"+
           "Resoan for Canceling: " +req.body.reason_for_cancelling, 
};
console.log(req.body.usermail);
vendorMail.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.log("error: ", error);
        return res.status(500).json({ success: false, msg: "Error sending email" });
    } else {
        return res.status(200).json({ success: true, msg: 'Mail Sent Successfully' });
    }
});
}