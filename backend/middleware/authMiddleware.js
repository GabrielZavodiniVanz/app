const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
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

    // 6. Buscar dados atualizados do usuário no banco (incluindo todas as flags de produtos)
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'role', 'accessLevel', 'comprou_produto_3', 'tem_kit_principal', 'tem_pack_1', 'tem_pack_2']
    });

    if (!user) {
      return res.status(401).json({ 
        message: 'Usuário não encontrado.',
        code: 'USER_NOT_FOUND'
      });
    }

    // 7. Adiciona as informações atualizadas do usuário ao objeto 'req'
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessLevel: user.accessLevel,
      comprou_produto_3: user.comprou_produto_3,
      tem_kit_principal: user.tem_kit_principal,
      tem_pack_1: user.tem_pack_1,
      tem_pack_2: user.tem_pack_2
    };

    // 8. Deixa a requisição continuar para a próxima etapa
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