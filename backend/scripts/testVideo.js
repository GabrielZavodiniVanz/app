const fs = require('fs');
const path = require('path');

console.log('🎬 Verificando configuração do vídeo...\n');

// Verificar se o arquivo local existe
const localVideoPath = path.join(__dirname, '../../frontend/public/videos/welcome-video.mp4');
const localExists = fs.existsSync(localVideoPath);

console.log('📁 Arquivo local:');
console.log(`   Path: ${localVideoPath}`);
console.log(`   Existe: ${localExists ? '✅ Sim' : '❌ Não'}`);

if (localExists) {
  const stats = fs.statSync(localVideoPath);
  const sizeMB = Math.round(stats.size / 1024 / 1024);
  console.log(`   Tamanho: ${sizeMB} MB`);
  console.log(`   Muito grande para Git: ${sizeMB > 100 ? '⚠️ Sim (>100MB)' : '✅ Não'}`);
}

// Verificar configuração do Cloudinary
const videoConfigPath = path.join(__dirname, '../../frontend/src/data/videoConfig.json');
const configExists = fs.existsSync(videoConfigPath);

console.log('\n☁️ Configuração Cloudinary:');
console.log(`   Arquivo: ${videoConfigPath}`);
console.log(`   Existe: ${configExists ? '✅ Sim' : '❌ Não'}`);

if (configExists) {
  try {
    const config = JSON.parse(fs.readFileSync(videoConfigPath, 'utf8'));
    console.log(`   URL configurada: ${config.url ? '✅ Sim' : '❌ Não'}`);
    if (config.url) {
      console.log(`   URL: ${config.url}`);
      console.log(`   Upload: ${config.uploadedAt || 'Não informado'}`);
    }
  } catch (error) {
    console.log(`   Erro ao ler: ❌ ${error.message}`);
  }
}

// Verificar variáveis de ambiente
console.log('\n🔑 Variáveis de Ambiente:');
const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
requiredVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`   ${varName}: ${value ? '✅ Configurada' : '❌ Não configurada'}`);
});

// Recomendações
console.log('\n💡 Recomendações:');

if (!localExists) {
  console.log('   ❌ Arquivo de vídeo não encontrado localmente');
  console.log('   📝 Adicione o vídeo em: frontend/public/videos/welcome-video.mp4');
}

if (localExists && !configExists) {
  console.log('   🚀 Para usar Cloudinary: node scripts/uploadVideo.js');
}

if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.log('   ☁️ Configure as variáveis do Cloudinary para hospedar o vídeo');
}

console.log('\n🎯 Status atual:');
if (configExists) {
  const config = JSON.parse(fs.readFileSync(videoConfigPath, 'utf8'));
  if (config.url) {
    console.log('   ✅ Vídeo configurado via Cloudinary - funcionará no Render!');
  } else {
    console.log('   ⚠️ Cloudinary configurado mas sem URL - execute uploadVideo.js');
  }
} else if (localExists) {
  console.log('   ⚠️ Apenas arquivo local - NÃO funcionará no Render');
} else {
  console.log('   ❌ Nenhum vídeo configurado');
}
