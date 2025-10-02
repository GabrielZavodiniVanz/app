const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Importar os modelos é importante para que o Sequelize os conheça
require('./models/Video');
require('./models/Document');
require('./models/User');

// Middleware
app.use(cors());
app.use(express.json());

// Importar os arquivos de rotas
const contentRoutes = require('./routes/content');
const authRoutes = require('./routes/auth');

// Usar as rotas
app.use('/api/content', contentRoutes);
app.use('/api/auth', authRoutes);


// Função principal para iniciar o servidor
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');

    // VERSÃO FINAL: 'alter: true' garante que a estrutura está correta SEM apagar dados.
    await sequelize.sync({ alter: true });
    console.log('Banco de dados sincronizado.');

    // A LÓGICA DE SEEDING FOI COMPLETAMENTE REMOVIDA.

    // Inicia o servidor para ouvir por requisições
    app.listen(PORT, () => {
      console.log(`**************************************************`);
      console.log(`SERVIDOR INICIADO E PRONTO! OS DADOS SÃO PERMANENTES.`);
      console.log(`Servidor escuchando en el puerto ${PORT}`);
      console.log(`**************************************************`);
    });

  } catch (error) {
    console.error('ERRO AO INICIAR O SERVIDOR:', error);
  }
};

// Executa a função principal
startServer();