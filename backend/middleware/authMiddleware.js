const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  // 1. Pega o token do cabeçalho da requisição
  const authHeader = req.headers.authorization;

  // 2. Verifica se o cabeçalho existe e está no formato correto ('Bearer TOKEN')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
  }

  try {
    // 3. Extrai o token do cabeçalho (remove a parte 'Bearer ')
    const token = authHeader.split(' ')[1];

    // 4. Verifica se o token é válido usando a nossa chave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Adiciona as informações do usuário decodificadas ao objeto 'req'
    // Assim, as rotas futuras saberão qual usuário fez a requisição
    req.user = decoded;

    // 6. Deixa a requisição continuar para a próxima etapa (a lógica da rota)
    next();
  } catch (error) {
    // Se o token for inválido (expirado, etc.), retorna um erro
    res.status(401).json({ message: 'Token inválido.' });
  }
};

module.exports = authMiddleware;