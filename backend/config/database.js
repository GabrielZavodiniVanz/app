const { Sequelize } = require('sequelize');
const fs = require('fs'); // Módulo 'File System'
const path = require('path'); // NOVO: Módulo 'Path' para lidar com caminhos de arquivos
require('dotenv').config();

// --- CORREÇÃO AQUI ---
// O novo caminho aponta para a pasta 'backend' (um nível acima de 'config')
const caCertificatePath = path.join(__dirname, '..', 'ca.pem');
const caCertificate = fs.readFileSync(caCertificatePath);


// Cria uma nova instância do Sequelize com as credenciais do arquivo .env
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true,
        ca: caCertificate
      }
    }
  }
);

module.exports = sequelize;