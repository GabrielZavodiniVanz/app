require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs'); // Módulo 'File System'
const path = require('path'); // NOVO: Módulo 'Path' para lidar com caminhos de arquivos

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
    
    // Pool de conexões para melhor performance
    pool: {
      max: 10,        // Máximo de 10 conexões simultâneas
      min: 2,         // Mínimo de 2 conexões sempre ativas
      acquire: 30000, // Tempo máximo para obter conexão (30s)
      idle: 10000,    // Tempo máximo que uma conexão pode ficar inativa (10s)
      evict: 1000     // Intervalo para verificar conexões inativas (1s)
    },
    
    // Configurações de logging
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    
    // Configurações de performance
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    },
    
    // Configurações de timezone
    timezone: '-03:00', // Horário de Brasília
    
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Mudado para false para evitar problemas com certificados
        ca: caCertificate
      },
      // Configurações adicionais do MySQL
      charset: 'utf8mb4',
      supportBigNumbers: true,
      bigNumberStrings: true
    },
    
    // Retry automático em caso de falha
    retry: {
      max: 3
    }
  }
);

module.exports = sequelize;