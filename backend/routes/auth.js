const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- ROTA DE REGISTRO (POST /api/auth/register) ---
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Este email ya está en uso.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword
      // O 'role' usará o valor padrão 'user'
    });

    res.status(201).json({ message: 'Usuario registrado con éxito!', userId: newUser.id });

  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
});

// --- ROTA DE LOGIN (POST /api/auth/login) ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Email o contraseña incorrectos.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email o contraseña incorrectos.' });
    }

    // ALTERAÇÃO AQUI: Incluímos o 'role' no token
    const payload = { id: user.id, name: user.name, role: user.role };
    
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login exitoso!', token });

  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
});

module.exports = router;