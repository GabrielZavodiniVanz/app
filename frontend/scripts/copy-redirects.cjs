const fs = require('fs');
const path = require('path');

// Função para copiar arquivo
function copyFile(source, destination) {
  try {
    const sourcePath = path.join(__dirname, '..', source);
    const destPath = path.join(__dirname, '..', destination);
    
    // Criar diretório de destino se não existir
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Copiar arquivo
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✓ Copied ${source} to ${destination}`);
  } catch (error) {
    console.error(`✗ Failed to copy ${source}:`, error.message);
  }
}

// Copiar arquivos de redirecionamento
copyFile('public/_redirects', 'dist/_redirects');
copyFile('public/.htaccess', 'dist/.htaccess');
copyFile('public/_headers', 'dist/_headers');

console.log('Redirect files copied successfully!');
