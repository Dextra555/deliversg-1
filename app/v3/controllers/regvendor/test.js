
//add form
exports.vendor_registration= async(req,res) => {

  const data=new model({
    company_name:          req.body.company_name,
    uen:                   req.body.uen,
    company_website:       req.body.company_website,
    industry_type:         req.body.industry_type,
    company_representative:req.body.company_representative,
    mobile_no:             req.body.mobile_no,    
    email_address:         req.body.email_address,
    mailing_address:       req.body.mailing_address,
    acra_pro_file:         req.body.acra_pro_file,
    any_entity_in_overseas:req.body.any_entity_in_overseas,
    pdpa_consent:          req.body.pdpa_consent,
    bankcrupty_consent:    req.body.bankcrupty_consent,
    approve:               req.body.approve
    
  });

  try{
    const dataToSave=await data.save();
    res.status(201).json("Vendor Registered Successfully!");
  }catch(err){
    res.status(400).json({ success: false,error:err.message });
  }
};



//  add vendor_registration with image
exports.vendor_registration=((req, res) => {
  const {
    company_name,
    uen,
    company_website,
    industry_type,
    company_representative,
    mobile_no,
    email_address,
    mailing_address,
    any_entity_in_overseas,
    pdpa_consent,
    bankcrupty_consent,
    approve
  } = req.body;

  
  if (!req.files|| !req.files[0].path) {
    return res.status(400).send('No image data received.');
  }
  const fieldName = req.files[0].path;
  const imagePath = path.join(__dirname, 'uploads',Date.now()+'_'+'vendor_image.png');
  const fileBuffer = fieldName;
  
  fs.writeFile(imagePath, fileBuffer, (err) => {
    if (err) {
      return res.status(500).send('Error saving the image.');
    }

    const data = new model({
      company_name,
      uen,
      company_website,
      industry_type,
      company_representative,
      mobile_no,
      email_address,
      mailing_address,
      any_entity_in_overseas,
      pdpa_consent,
      bankcrupty_consent,
      approve,
      acra_pro_file: imagePath, 
    });

    data.save().then(() => {
        res.send('File uploaded successfully.');
      })
      .catch((err) => {
        res.status(500).json({ error: err.message });
      });
  });
});

//send email

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


exports.sendmail =async(req,res)=>{

    const data = await model.findById(req.params.id);
   
    const mailOptions = {
      from: 'info@dextratechnologies.com',
      to:"selvadextra@gmail.com",
      subject:"hai "+data.company_name,
      text:"venderToken - "+data.vendor_token,
    };
  
    vendorMail.sendMail(mailOptions,(error,info)=>{
      if(error){
        console.log("error; ",error);
        return res.status(500).json({ error: 'Error sending email' });
      }else{
        res.status(200).json({ message: 'Email sent successfully' });
      }
    })
  }
  

  // exports.updateone = async (req, res) => {
//   try {
//     console.log(req.body);
//     const id = req.body._id; // Assuming email is sent in the form
//     const newData = req.body;
//     // const updatedUser = await model.updateOne({ _id: id }, { $set: newData });

//     // const updatedUser = await model.findOneAndUpdate(
//     //   { _id: id },
//     //   { $set: { newData } },
//     //   { new: true } 
//     // );

//     if (!updatedUser) {
//       return res.status(404).send('User not found');
//     }

//     res.redirect('/success');
//   } catch (error) {
//     console.error('Error updating user:', error);
//     res.status(500).send('Error updating user');
//   }
// };

//approve form
exports.approve = async (req, res) => {
  try {
    const document = await model.findById(req.params.id);

    if (!document) {
      return res.status(404).json({success: false, msg:"Vendor Id not given"});
    }

    if (document.approve === true) {
      const data = await model.findById(req.params.id);
 
  const mailOptions = {
    from: 'info@dextratechnologies.com',
    to:data.email_address,
    subject:"hai "+data.company_name,
    text:"venderToken - "+data.vendor_token,
  };

  vendorMail.sendMail(mailOptions,(error,info)=>{
    if(error){
      console.log("error; ",error);
      return res.status(500).json({ error: 'Error sending email' });
    }else{
      res.status(200).json({ message: 'Token Sent Successfully, Vendor got Approved!'});
    }
  })
    } else {
      const result = await model.findByIdAndUpdate(
        req.params.id,
        { status:0},
        { new: true }
      );
     return res.status(201).json({success: true, msg:"Vendor got disapproved!"});

    }
  } catch (err) {
    return res.status(500).json({success: false, msg:err.message});
  }
};



///////////////////////////////////////////////////////////////////////////////////
// working 16/9/23
// exports.vendor_registration = (req, res) => {
//   const {
//     company_name,
//     uen,
//     company_website,
//     industry_type,
//     company_representative,
//     mobile_no,
//     email_address,
//     mailing_address,
//     any_entity_in_overseas,
//     pdpa_consent,
//     bankcrupty_consent,
//     approve,
//   } = req.body;
// // console.log("body: ", req.body);
//   if (!req.files || !req.files[0].path) {
//     return res.status(400).json({success: false, msg:'No image data received.'});
//   }

//   const fieldName = req.files[0].path;
//    const extname = path.extname(req.files[0].originalname);
//   const imagePath = path.join(__dirname, 'uploads','vendor_image_'+Date.now() +extname);

//   // Read the file from the local path
//   fs.readFile(fieldName, (err, fileBuffer) => {
//     if (err) {
//       return res.status(500).json({success: false, msg:'Error reading the uploaded file.'});
//     }

//     const params = {
//       Bucket: 'deliversgbucket', // Replace with your S3 bucket name
//       Key: `vendor/vendor_image_${Date.now()}`+extname, // Specify the desired key (file name) in your S3 bucket
//       Body: fileBuffer,
//     };

//     // Upload the file to S3
//     s3.upload(params, (s3Err, s3Data) => {
//       if (s3Err) {
//         console.error('Error uploading to S3:', s3Err);
//         return res.status(500).json({success: false, msg:'Error uploading the image to S3.'});
//       }

//       // Assuming "model" is your Mongoose model for storing data
//       const data = new model({
//         company_name,
//         uen,
//         company_website,
//         industry_type,
//         company_representative,
//         mobile_no,
//         email_address,
//         mailing_address,
//         any_entity_in_overseas,
//         pdpa_consent,
//         bankcrupty_consent,
//         approve,
//         acra_pro_file: s3Data.Location, // Save the S3 file URL
//       });

//       // Save the data to your database
//       data.save()
//         .then(() => {
//           return res.json({success: true, msg:'File uploaded successfully.'});

//         })
//         .catch((err) => {
//           return res.json({success: false, msg:err.message});
//         });
//     });
//   });
// };
///////////////////////////////////////////////////////////////////


// country and cityname get latitude longotude
// ---------------------------------------------
// exports.lat_long=((req,res)=>{
// const googleMapsClient = require('@google/maps').createClient({
//         key: 'AIzaSyBViKhoMt_4-rQ92byigbEanQEAmVJS1aA', // Replace with your Google Maps API key
//         Promise: Promise // Use Promises for asynchronous operations
//       });
      
//       const con = 'india'; // Replace with your desired country
//       const city = 'chennai';   // Replace with your desired city
      
//       googleMapsClient.geocode({ address: `${city}, ${con}` })
//         .asPromise()
//         .then((response) => {
//           const result = response.json.results[0];
//           if (result) {
//             const location = result.geometry.location;
//             console.log(`Latitude: ${location.lat}`);
//             console.log(`Longitude: ${location.lng}`);
//           } else {
//             console.error('Wrong Details: No results found');
//           }
//         })
//         .catch((err) => {
//           console.error('Error:', err);
//         });
