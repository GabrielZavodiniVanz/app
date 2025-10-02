const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validationMiddleware');

// Função auxiliar para validar email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Função auxiliar para validar senha
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Função auxiliar para sanitizar entrada
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim();
};

// --- ROTA DE REGISTRO (POST /api/auth/register) ---
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Os dados já foram validados pelo middleware validateUserRegistration
    const sanitizedName = name.trim();
    const sanitizedEmail = email.toLowerCase();

    // Verificar se usuário já existe
    const existingUser = await User.findOne({ where: { email: sanitizedEmail } });
    if (existingUser) {
      return res.status(409).json({ message: 'Este email já está em uso.' });
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(12); // Aumentado para maior segurança
    const hashedPassword = await bcrypt.hash(password, salt);

    // Criar usuário
    const newUser = await User.create({
      name: sanitizedName,
      email: sanitizedEmail,
      password: hashedPassword
      // O 'role' usará o valor padrão 'user'
    });

    console.log(`✅ Novo usuário registrado: ${sanitizedEmail}`);
    res.status(201).json({ 
      message: 'Usuário registrado com sucesso!', 
      userId: newUser.id 
    });

  } catch (error) {
    console.error(`❌ Erro no registro:`, error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// --- ROTA DE LOGIN (POST /api/auth/login) ---
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Os dados já foram validados pelo middleware validateUserLogin
    const sanitizedEmail = email.toLowerCase();

    // Buscar usuário
    const user = await User.findOne({ where: { email: sanitizedEmail } });
    if (!user) {
      return res.status(401).json({ message: 'Email ou senha incorretos.' });
    }

    // Verificar senha
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou senha incorretos.' });
    }

    // Gerar token JWT
    const payload = { 
      id: user.id, 
      name: user.name, 
      email: user.email,
      role: user.role 
    };
    
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { 
        expiresIn: '24h', // Aumentado para melhor UX
        issuer: 'app-infantil',
        audience: 'app-infantil-users'
      }
    );

    console.log(`✅ Login realizado: ${sanitizedEmail}`);
    res.json({ 
      message: 'Login realizado com sucesso!', 
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error(`❌ Erro no login:`, error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});


module.exports = router;