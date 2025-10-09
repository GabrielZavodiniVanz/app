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
      upload_preset: 'app_infantil_publico', // Continua forçando o preset público
      // Otimizações para melhor performance
      eager: resource_type === 'image' ? [{ width: 800, height: 600, crop: 'limit' }] : undefined,
      quality: resource_type === 'image' ? 'auto' : 'auto',
      fetch_format: resource_type === 'image' ? 'auto' : undefined,
      flags: resource_type === 'image' ? 'progressive' : undefined
    };
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limite
    files: 2 // máximo 2 arquivos por vez
  },
  fileFilter: (req, file, cb) => {
    // Verificar tipos de arquivo permitidos
    if (file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('video/') || 
        file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'), false);
    }
  }
});

module.exports = upload;