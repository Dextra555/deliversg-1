const fs = require('fs');
const sharp = require('sharp');
const fetch = require('node-fetch')

module.exports = function resize(path, format, width, height) {
  console.log(path)
  try {
    if (path && path.includes('http')) {
      return url_image_filter(path, format, width, height)
    } else {
      return local_file_image_filter(path, format, width, height)
    }
  } catch (error) {
    return null
  }
}


var url_image_filter =  async (path, format, width, height)=>{
  const response = await fetch(path);
  const contentType = response.headers.get("content-type");
  
  if(contentType === 'application/octet-stream' || contentType.includes("image")){
    const buffer = await response.buffer();
    let transform;

    if (format) {
      transform = await sharp(buffer).toFormat(format)
    }

    if (width || height) {
      transform = transform.resize(width, height)
    }

    return transform;
  }else{
    return null;    
  }
}

var local_file_image_filter = async (path, format, width, height)=>{
  var full_path = global.root_path + '/uploads' + path
  console.log(fs.existsSync(full_path));
  // console.log(full_path);
  if (fs.existsSync(full_path)) {
    var stats = fs.statSync(full_path);
    if (stats.isFile()) {
      const readStream = fs.createReadStream(full_path)
      let transform = sharp()

      if (format) {
        transform = transform.toFormat(format)
      }

      if (width || height) {
        transform = transform.resize(width, height)
      }

      return readStream.pipe(transform)
    } else {
      return null;
    }
  } else {
    return null
  }
}