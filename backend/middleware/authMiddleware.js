const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // 1. Pega o token do cabeçalho da requisição
    const authHeader = req.headers.authorization;

    // 2. Verifica se o cabeçalho existe e está no formato correto ('Bearer TOKEN')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Acesso negado. Token de autenticação necessário.',
        code: 'NO_TOKEN'
      });
    }

    // 3. Extrai o token do cabeçalho (remove a parte 'Bearer ')
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        message: 'Acesso negado. Token malformado.',
        code: 'MALFORMED_TOKEN'
      });
    }

    // 4. Verifica se o token é válido usando a nossa chave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Validar se o token contém as informações necessárias
    if (!decoded.id || !decoded.email) {
      return res.status(401).json({ 
        message: 'Token inválido. Dados insuficientes.',
        code: 'INVALID_TOKEN_DATA'
      });
    }

    // 6. Adiciona as informações do usuário decodificadas ao objeto 'req'
    req.user = decoded;

    // 7. Deixa a requisição continuar para a próxima etapa
    next();

  } catch (error) {
    console.error(`❌ Erro na autenticação:`, error.message);
    
    // Tratamento específico para diferentes tipos de erro JWT
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expirado. Faça login novamente.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token inválido.',
        code: 'INVALID_TOKEN'
      });
    }

    // Erro genérico
    return res.status(401).json({ 
      message: 'Falha na autenticação.',
      code: 'AUTH_FAILED'
    });
  }
};

module.exports = authMiddleware;