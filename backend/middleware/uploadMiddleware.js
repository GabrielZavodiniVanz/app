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
  }
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

// Middleware personalizado para garantir que as URLs do Cloudinary sejam retornadas corretamente
const uploadWithCloudinaryUrl = (fields) => {
  return (req, res, next) => {
    upload.fields(fields)(req, res, (err) => {
      if (err) {
        console.error('❌ Erro no upload:', err);
        return res.status(400).json({ 
          message: 'Erro no upload de arquivos',
          error: err.message 
        });
      }

      // Processar arquivos e garantir que as URLs do Cloudinary sejam usadas
      if (req.files) {
        console.log(`📁 Arquivos recebidos: ${Object.keys(req.files).length} campos`);
        for (const fieldName in req.files) {
          req.files[fieldName].forEach(file => {
            console.log(`📄 Arquivo ${fieldName}:`, {
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
              path: file.path,
              isCloudinaryUrl: file.path && file.path.includes('cloudinary.com')
            });
            
            // Se o path não é uma URL do Cloudinary, tentar obter a URL correta
            if (file.path && !file.path.includes('cloudinary.com')) {
              console.log(`⚠️ Arquivo ${fieldName} não tem URL do Cloudinary: ${file.path}`);
              console.log(`🔧 Verifique se as credenciais do Cloudinary estão configuradas no .env`);
            } else if (file.path) {
              console.log(`✅ Arquivo ${fieldName} tem URL do Cloudinary: ${file.path}`);
            }
          });
        }
      } else {
        console.log(`📁 Nenhum arquivo foi enviado`);
      }

      next();
    });
  };
};

module.exports = { upload, uploadWithCloudinaryUrl };