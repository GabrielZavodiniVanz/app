const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinaryConfig');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'app-infantil/outros';
    let resource_type = 'raw';
    let allowed_formats = ['pdf', 'doc', 'docx'];

    if (file.mimetype.startsWith('image/')) {
      folder = 'app-infantil/imagens';
      resource_type = 'image';
      allowed_formats = ['jpeg', 'png', 'jpg'];
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'app-infantil/videos';
      resource_type = 'video';
      allowed_formats = ['mp4', 'mov'];
    }

    return {
      folder: folder,
      resource_type: resource_type,
      allowed_formats: allowed_formats,
      upload_preset: 'app_infantil_publico' // Continua forçando o preset público
    };
  },
});

const upload = multer({ storage: storage });

module.exports = upload;