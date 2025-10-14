const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎬 Configuração do Vídeo no YouTube');
console.log('===================================');
console.log('Este script irá configurar o vídeo do YouTube.\n');

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function extractYouTubeId(url) {
  // Extrair ID do YouTube de diferentes formatos de URL
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

async function setupYouTube() {
  try {
    console.log('📝 Passo 1: Faça upload do vídeo no YouTube');
    console.log('1. Acesse: https://youtube.com');
    console.log('2. Clique em "Criar" → "Upload de vídeo"');
    console.log('3. Arraste o arquivo: VÍDEO BOAS VINDAS NIÑOS DE LUZ.mp4');
    console.log('4. Configure como "Não listado" ou "Privado"');
    console.log('5. Aguarde o processamento');
    console.log('6. Copie a URL do vídeo\n');
    
    console.log('💡 Exemplos de URL válidas:');
    console.log('- https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    console.log('- https://youtu.be/dQw4w9WgXcQ');
    console.log('- dQw4w9WgXcQ (apenas o ID)\n');
    
    const videoUrl = await question('🔗 Cole a URL do vídeo do YouTube (ou apenas o ID): ');
    
    if (!videoUrl || videoUrl.trim() === '') {
      console.log('❌ URL não pode estar vazia.');
      rl.close();
      return;
    }
    
    const youtubeId = extractYouTubeId(videoUrl.trim());
    
    if (!youtubeId) {
      console.log('❌ URL inválida. Deve ser uma URL do YouTube válida.');
      console.log('💡 Exemplos:');
      console.log('- https://www.youtube.com/watch?v=ID_DO_VIDEO');
      console.log('- https://youtu.be/ID_DO_VIDEO');
      console.log('- ID_DO_VIDEO');
      rl.close();
      return;
    }
    
    const videoData = {
      youtubeId: youtubeId,
      url: "", // Manter vazio para usar YouTube
      publicId: "",
      uploadedAt: new Date().toISOString(),
      uploadedVia: 'youtube'
    };
    
    const configPath = path.join(__dirname, '../../frontend/src/data/videoConfig.json');
    fs.writeFileSync(configPath, JSON.stringify(videoData, null, 2));
    
    console.log('\n✅ Configuração salva!');
    console.log('📁 Arquivo: frontend/src/data/videoConfig.json');
    console.log('🆔 YouTube ID:', youtubeId);
    console.log('🔗 URL de embed:', `https://www.youtube.com/embed/${youtubeId}`);
    
    console.log('\n🔧 Próximos passos:');
    console.log('1. git add frontend/src/data/videoConfig.json');
    console.log('2. git commit -m "Add YouTube video configuration"');
    console.log('3. git push');
    console.log('4. Teste localmente para ver se funciona');
    
    console.log('\n🎉 Pronto! O vídeo funcionará no seu app via YouTube!');
    console.log('💡 Vantagens: Sem limite de tamanho, CDN global, player otimizado');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    rl.close();
  }
}

setupYouTube();
