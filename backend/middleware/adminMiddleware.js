const User = require('../models/User');

const adminMiddleware = async (req, res, next) => {
  try {
    // O authMiddleware já nos deu o req.user.id a partir do token
    const userId = req.user.id;
    
    // Buscamos o usuário no banco para ter a informação de 'role' mais atualizada
    const user = await User.findByPk(userId);

    // Verificamos se o papel do usuário é 'admin'
    if (user && user.role === 'admin') {
      next(); // Permissão concedida, pode prosseguir para a próxima função
    } else {
      // Se não for admin, retorna um erro de 'Proibido' (403 Forbidden)
      res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor al verificar el rol del usuario.' });
  }
};

module.exports = adminMiddleware;