const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Importar os modelos é importante para que o Sequelize os conheça
require('./models/Video');
require('./models/Document');
require('./models/User');

// Configuração de CORS mais segura
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', // Vite dev server
    process.env.FRONTEND_URL,
    'https://app-frontend-y1u5.onrender.com' // URL temporária do frontend
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200
};


// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Limite de tamanho para uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Middleware de logging básico
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Importar os arquivos de rotas
const contentRoutes = require('./routes/content');
const authRoutes = require('./routes/auth');
const webhookRoutes = require('./routes/webhook');

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Usar as rotas
app.use('/api/content', contentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/webhook', webhookRoutes);

// Middleware de tratamento de rotas não encontradas
app.use((req, res, next) => {
  res.status(404).json({ 
    message: 'Rota não encontrada',
    path: req.originalUrl 
  });
});

// Middleware global de tratamento de erros
app.use((error, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()}:`, error);
  
  // Não expor detalhes do erro em produção
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(error.status || 500).json({
    message: error.message || 'Erro interno do servidor',
    ...(isDevelopment && { stack: error.stack })
  });
});


// Função principal para iniciar o servidor
const startServer = async () => {
  try {
    console.log('🚀 Iniciando servidor...');
    
    // Testar conexão com o banco de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso.');

    // Sincronizar modelos com o banco (sem alterações)
    await sequelize.sync({ force: false });
    console.log('✅ Banco de dados sincronizado.');

    // Iniciar o servidor
    const server = app.listen(PORT, () => {
      console.log('**************************************************');
      console.log('🎉 SERVIDOR INICIADO E PRONTO!');
      console.log(`🌐 Servidor rodando na porta ${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`🔒 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log('**************************************************');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 Recebido SIGTERM. Encerrando servidor graciosamente...');
      server.close(() => {
        console.log('✅ Servidor encerrado.');
        sequelize.close();
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 Recebido SIGINT. Encerrando servidor graciosamente...');
      server.close(() => {
        console.log('✅ Servidor encerrado.');
        sequelize.close();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ ERRO AO INICIAR O SERVIDOR:', error);
    process.exit(1);
  }
};

// Executa a função principal
startServer();