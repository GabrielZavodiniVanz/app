const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config();

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadWelcomeVideo() {
  try {
    console.log('🎬 Iniciando upload do vídeo de boas-vindas...');
    
    const videoPath = path.join(__dirname, '../../frontend/public/videos/welcome-video.mp4');
    
    // Verificar se o arquivo existe
    const fs = require('fs');
    if (!fs.existsSync(videoPath)) {
      console.error('❌ Arquivo de vídeo não encontrado:', videoPath);
      return;
    }

    // Upload do vídeo para Cloudinary
    const result = await cloudinary.uploader.upload(videoPath, {
      resource_type: 'video',
      folder: 'ninos-deluz/videos',
      public_id: 'welcome-video',
      use_filename: true,
      unique_filename: false,
      chunk_size: 6000000, // 6MB chunks para vídeos grandes
      eager: [
        { width: 800, height: 450, crop: 'scale' }, // Versão otimizada
        { width: 1200, height: 675, crop: 'scale' } // Versão HD
      ],
      eager_async: true
    });

    console.log('✅ Vídeo enviado com sucesso!');
    console.log('📺 URL do vídeo:', result.secure_url);
    console.log('🆔 Public ID:', result.public_id);
    console.log('📊 Tamanho:', Math.round(result.bytes / 1024 / 1024), 'MB');
    console.log('⏱️ Duração:', result.duration, 'segundos');
    
    // Salvar URL em arquivo para uso no frontend
    const videoData = {
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date().toISOString()
    };
    
    const fs = require('fs');
    fs.writeFileSync(
      path.join(__dirname, '../../frontend/src/data/videoConfig.json'),
      JSON.stringify(videoData, null, 2)
    );
    
    console.log('💾 Configuração salva em frontend/src/data/videoConfig.json');
    console.log('\n🔧 Próximo passo: Atualizar o componente WelcomePopup para usar a URL do Cloudinary');
    
  } catch (error) {
    console.error('❌ Erro no upload:', error.message);
  }
}

// Executar upload
uploadWelcomeVideo();
