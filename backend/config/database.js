require('dotenv').config();
const { Sequelize } = require('sequelize');

// Cria uma nova instância do Sequelize usando a URL do PostgreSQL do Render
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',

  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },

  // Pool de conexões para melhor performance
  pool: {
    max: 10,        // Máximo de 10 conexões simultâneas
    min: 2,         // Mínimo de 2 conexões sempre ativas
    acquire: 30000, // Tempo máximo para obter conexão (30s)
    idle: 10000     // Tempo máximo que uma conexão pode ficar inativa (10s)
  },

  // Configurações de logging
  logging: process.env.NODE_ENV === 'development' ? console.log : false,

  // Configurações de performance
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true
  }
});

module.exports = sequelize;