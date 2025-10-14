const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validationMiddleware');

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

    console.log(`✅ Novo usuário registrado via API: ${sanitizedEmail}`);
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
      role: user.role,
      accessLevel: user.accessLevel
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
    
    // Verificar se é primeiro login ANTES de atualizar
    const isFirstLogin = user.firstLogin;
    
    // Se for primeiro login, marcar como false para próximas vezes
    if (isFirstLogin) {
      await user.update({ firstLogin: false });
      console.log(`🎉 Primeiro login detectado para: ${sanitizedEmail}`);
    }
    
    res.json({ 
      message: 'Login realizado com sucesso!', 
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessLevel: user.accessLevel,
        firstLogin: isFirstLogin
      }
    });

  } catch (error) {
    console.error(`❌ Erro no login:`, error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

/**
 * Endpoint para solicitar recuperação de senha
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Email é obrigatório' 
      });
    }

    // Buscar usuário
    const user = await User.findOne({ 
      where: { email: email.toLowerCase() } 
    });

    if (!user) {
      // Por segurança, não revelar se o email existe ou não
      return res.status(200).json({
        success: true,
        message: 'Se o email existir, você receberá instruções para recuperar sua senha'
      });
    }

    // Gerar novo token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Definir expiração (1 hora)
    const resetExpires = new Date(Date.now() + 3600000); // 1 hora

    // Salvar NOVO token no banco (isso automaticamente invalida qualquer token anterior)
    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires
    });

    console.log(`🔄 Novo token gerado para ${email}. Token anterior invalidado.`);

    // URL para resetar senha
    const resetUrl = process.env.FRONTEND_URL 
      ? `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
      : `https://www.ninosdeluz.site/reset-password?token=${resetToken}`;

    // Resposta imediata para o usuário
    res.status(200).json({
      success: true,
      message: 'Se o email existir, você receberá instruções para recuperar sua senha'
    });

    // Enviar e-mail após enviar a resposta (não bloquear)
    emailService.sendPasswordResetEmail({
      name: user.name,
      email: user.email,
      resetUrl: resetUrl
    }).then(() => {
      console.log(`✅ E-mail de recuperação enviado para: ${email}`);
    }).catch((emailError) => {
      console.error(`❌ Erro ao enviar e-mail para ${email}:`, emailError);
    });

  } catch (error) {
    console.error('❌ Erro ao solicitar recuperação de senha:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * Endpoint para redefinir senha com token
 * POST /api/auth/reset-password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Validações básicas
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Token, nova senha e confirmação são obrigatórios' 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'A nova senha e confirmação não coincidem' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'A nova senha deve ter pelo menos 6 caracteres' 
      });
    }

    // Buscar usuário com token válido
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          [Op.gt]: new Date() // Token não expirado
        }
      }
    });

    if (!user) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Token inválido ou expirado' 
      });
    }

    // Hash da nova senha
    const salt = await bcrypt.genSalt(12);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Atualizar senha e limpar token
    await user.update({
      password: hashedNewPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    console.log(`✅ Senha redefinida com sucesso para: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Senha redefinida com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao redefinir senha:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * Endpoint para teste específico do Resend
 * POST /api/auth/test-resend
 */
router.post('/test-resend', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Email é obrigatório' 
      });
    }

    // Verificar se RESEND_API_KEY está configurada
    const hasResendKey = !!process.env.RESEND_API_KEY;
    
    console.log(`🔍 Debug - RESEND_API_KEY configurado: ${hasResendKey}`);
    console.log(`🔍 Debug - NODE_ENV: ${process.env.NODE_ENV}`);

    if (!hasResendKey) {
      return res.status(500).json({
        success: false,
        error: 'RESEND_API_KEY not configured',
        message: 'RESEND_API_KEY não está configurada no Render',
        debug: {
          hasResendKey,
          nodeEnv: process.env.NODE_ENV
        }
      });
    }

    // Testar Resend diretamente
    const https = require('https');
    const testEmail = {
      from: 'App Infantil <onboarding@resend.dev>',
      to: [email],
      subject: 'Teste - Resend',
      html: '<h1>Teste do Resend</h1><p>Se você recebeu este e-mail, o Resend está funcionando!</p>'
    };

    const postData = JSON.stringify(testEmail);
    
    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req2 = https.request(options, (res2) => {
      let data = '';
      
      res2.on('data', (chunk) => {
        data += chunk;
      });
      
      res2.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res2.statusCode === 200) {
            res.status(200).json({
              success: true,
              message: 'Resend test email sent successfully',
              email: email,
              resendResponse: response,
              debug: {
                hasResendKey,
                nodeEnv: process.env.NODE_ENV,
                statusCode: res2.statusCode
              }
            });
          } else {
            res.status(500).json({
              success: false,
              error: 'Resend API error',
              message: response.message || 'Unknown error',
              resendResponse: response,
              debug: {
                hasResendKey,
                nodeEnv: process.env.NODE_ENV,
                statusCode: res2.statusCode
              }
            });
          }
        } catch (error) {
          res.status(500).json({
            success: false,
            error: 'Parse error',
            message: error.message,
            rawResponse: data,
            debug: {
              hasResendKey,
              nodeEnv: process.env.NODE_ENV,
              statusCode: res2.statusCode
            }
          });
        }
      });
    });

    req2.on('error', (error) => {
      res.status(500).json({
        success: false,
        error: 'Request error',
        message: error.message,
        debug: {
          hasResendKey,
          nodeEnv: process.env.NODE_ENV
        }
      });
    });

    req2.write(postData);
    req2.end();

  } catch (error) {
    console.error('❌ Erro geral no teste do Resend:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to test Resend',
      errorMessage: error.message,
      timestamp: new Date().toISOString()
    });
  }
});


/**
 * Endpoint para mudança de senha
 * PUT /api/auth/change-password
 */
router.put('/change-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword, confirmPassword } = req.body;

    // Validações básicas
    if (!email || !currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Todos os campos são obrigatórios' 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'A nova senha e confirmação não coincidem' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'A nova senha deve ter pelo menos 6 caracteres' 
      });
    }

    // Buscar usuário
    const user = await User.findOne({ 
      where: { email: email.toLowerCase() } 
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Usuário não encontrado' 
      });
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Senha atual incorreta' 
      });
    }

    // Hash da nova senha
    const salt = await bcrypt.genSalt(12);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Atualizar senha no banco
    await user.update({ password: hashedNewPassword });

    console.log(`✅ Senha alterada com sucesso para: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Senha alterada com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao alterar senha:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erro interno do servidor'
    });
  }
});


module.exports = router;