const User = require('../models/User');

const adminMiddleware = async (req, res, next) => {
  try {
    // O authMiddleware já nos deu o req.user a partir do token
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'Usuário não autenticado.',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userId = req.user.id;
    
    // Primeiro, verificar se o role já está no token (mais eficiente)
    if (req.user.role === 'admin') {
      return next();
    }

    // Se não estiver no token ou não for admin, buscar no banco para ter certeza
    const user = await User.findByPk(userId, {
      attributes: ['id', 'role', 'email'] // Buscar apenas os campos necessários
    });

    if (!user) {
      return res.status(404).json({ 
        message: 'Usuário não encontrado.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verificar se o papel do usuário é 'admin'
    console.log(`🔍 Verificando privilégios admin para usuário: ${user.email} (role: ${user.role})`);
    
    if (user.role === 'admin') {
      console.log(`✅ Acesso admin autorizado para: ${user.email}`);
      next(); // Permissão concedida
    } else {
      console.log(`❌ Acesso admin negado para: ${user.email} (role: ${user.role})`);
      res.status(403).json({ 
        message: 'Acesso negado. Privilégios de administrador necessários.',
        code: 'INSUFFICIENT_PRIVILEGES',
        userRole: user.role,
        requiredRole: 'admin'
      });
    }

  } catch (error) {
    console.error(`❌ Erro na verificação de admin:`, error);
    res.status(500).json({ 
      message: 'Erro interno do servidor ao verificar privilégios.',
      code: 'SERVER_ERROR'
    });
  }
};

module.exports = adminMiddleware;