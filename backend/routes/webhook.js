const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const emailService = require('../services/emailService');
const passwordService = require('../services/passwordService');
const { 
  validateKiwifyWebhook, 
  logWebhookData, 
  validateWebhookData 
} = require('../middleware/kiwifyWebhookMiddleware');

/**
 * Endpoint principal para receber webhooks da Kiwify
 * POST /api/webhook/kiwify
 */
router.post('/kiwify', 
  logWebhookData,
  validateKiwifyWebhook,
  validateWebhookData,
  async (req, res) => {
    try {
      const { data } = req.body;
      const { customer } = data;

      console.log(`🔄 Processando webhook para cliente: ${customer.email}`);

      // Verificar se o usuário já existe
      const existingUser = await User.findOne({ 
        where: { email: customer.email.toLowerCase() } 
      });

      if (existingUser) {
        console.log(`ℹ️ Usuário já existe: ${customer.email}`);
        return res.status(200).json({ 
          message: 'User already exists',
          userId: existingUser.id,
          email: customer.email
        });
      }

      // Gerar senha segura
      const generatedPassword = passwordService.generateSecurePassword();
      console.log(`🔐 Senha gerada para ${customer.email}`);

      // Hash da senha
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(generatedPassword, salt);

      // Criar novo usuário
      const newUser = await User.create({
        name: customer.name.trim(),
        email: customer.email.toLowerCase(),
        password: hashedPassword,
        role: 'user'
      });

      console.log(`✅ Usuário criado com sucesso: ${newUser.id}`);

      // Preparar dados para o e-mail
      const loginUrl = process.env.FRONTEND_URL 
        ? `${process.env.FRONTEND_URL}/login`
        : 'http://localhost:5173/login';

      const emailData = {
        name: customer.name,
        email: customer.email,
        password: generatedPassword,
        loginUrl: loginUrl
      };

      // Resposta de sucesso para a Kiwify
      res.status(200).json({
        success: true,
        message: 'User created successfully',
        userId: newUser.id,
        email: customer.email,
        timestamp: new Date().toISOString()
      });

      // Enviar e-mail após enviar a resposta (não bloquear)
      emailService.sendWelcomeEmail(emailData).then(() => {
        console.log(`📧 E-mail enviado com sucesso para: ${customer.email}`);
      }).catch((emailError) => {
        console.error(`❌ Erro ao enviar e-mail para ${customer.email}:`, emailError);
      });

    } catch (error) {
      console.error('❌ Erro ao processar webhook da Kiwify:', error);
      
      // Resposta de erro para a Kiwify
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to process webhook',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * Endpoint para testar o webhook (apenas em desenvolvimento)
 * POST /api/webhook/test
 */
router.post('/test', async (req, res) => {
  // Apenas permitir em ambiente de desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ 
      message: 'Test endpoint not available in production' 
    });
  }

  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Name and email are required' 
      });
    }

    // Simular dados do webhook da Kiwify
    const mockWebhookData = {
      event: 'order.paid',
      data: {
        id: 'test-order-' + Date.now(),
        customer: {
          name: name,
          email: email
        }
      }
    };

    // Processar como se fosse um webhook real
    req.body = mockWebhookData;
    
    // Chamar o middleware de validação (pulando a validação de assinatura)
    validateWebhookData(req, res, async () => {
      try {
        const { data } = req.body;
        const { customer } = data;

        // Verificar se o usuário já existe
        const existingUser = await User.findOne({ 
          where: { email: customer.email.toLowerCase() } 
        });

        if (existingUser) {
          return res.status(200).json({ 
            message: 'User already exists',
            userId: existingUser.id,
            email: customer.email
          });
        }

        // Gerar senha segura
        const generatedPassword = passwordService.generateSecurePassword();

        // Hash da senha
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(generatedPassword, salt);

        // Criar novo usuário
        const newUser = await User.create({
          name: customer.name.trim(),
          email: customer.email.toLowerCase(),
          password: hashedPassword,
          role: 'user'
        });

        // Enviar e-mail de teste
        const loginUrl = process.env.FRONTEND_URL 
          ? `${process.env.FRONTEND_URL}/login`
          : 'http://localhost:5173/login';

        const emailData = {
          name: customer.name,
          email: customer.email,
          password: generatedPassword,
          loginUrl: loginUrl
        };

        await emailService.sendWelcomeEmail(emailData);

        res.status(200).json({
          success: true,
          message: 'Test user created successfully',
          userId: newUser.id,
          email: customer.email,
          generatedPassword: generatedPassword, // Apenas para teste
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ Erro no teste do webhook:', error);
        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: error.message
        });
      }
    });

  } catch (error) {
    console.error('❌ Erro no endpoint de teste:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * Endpoint para testar envio de e-mail
 * POST /api/webhook/test-email
 */
router.post('/test-email', async (req, res) => {
  // Apenas permitir em ambiente de desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ 
      message: 'Test endpoint not available in production' 
    });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Email is required' 
      });
    }

    const emailResult = await emailService.sendTestEmail(email);

    res.status(200).json({
      success: true,
      message: emailResult.success ? 'Test email sent successfully' : 'User created but email failed',
      email: email,
      emailSent: emailResult.success
    });

  } catch (error) {
    console.error('❌ Erro ao enviar e-mail de teste:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * Endpoint alternativo para webhook da Kiwify (aceita /api/webhook)
 * POST /api/webhook
 */
router.post('/', 
  logWebhookData,
  validateKiwifyWebhook,
  validateWebhookData,
  async (req, res) => {
    try {
      const { data } = req.body;
      const { customer } = data;

      console.log(`🔄 Processando webhook para cliente: ${customer.email}`);

      // Verificar se o usuário já existe
      const existingUser = await User.findOne({ 
        where: { email: customer.email.toLowerCase() } 
      });

      if (existingUser) {
        console.log(`ℹ️ Usuário já existe: ${customer.email}`);
        return res.status(200).json({ 
          message: 'User already exists',
          userId: existingUser.id,
          email: customer.email
        });
      }

      // Gerar senha segura
      const generatedPassword = passwordService.generateSecurePassword();
      console.log(`🔐 Senha gerada para ${customer.email}`);

      // Hash da senha
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(generatedPassword, salt);

      // Criar novo usuário
      const newUser = await User.create({
        name: customer.name,
        email: customer.email.toLowerCase(),
        password: hashedPassword,
        role: 'user'
      });

      console.log(`✅ Novo usuário criado via webhook: ${newUser.email}`);

      // Preparar dados para o e-mail
      const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173/login';
      const emailData = {
        name: newUser.name,
        email: newUser.email,
        password: generatedPassword,
        loginUrl: loginUrl
      };

      // Enviar e-mail de boas-vindas
      try {
        await emailService.sendWelcomeEmail(emailData);
        console.log(`📧 E-mail enviado com sucesso para: ${customer.email}`);
      } catch (emailError) {
        console.error(`❌ Erro ao enviar e-mail para ${customer.email}:`, emailError);
      }

      // Resposta de sucesso para a Kiwify
      res.status(200).json({
        success: true,
        message: 'User created successfully',
        userId: newUser.id,
        email: customer.email,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao processar webhook da Kiwify:', error);
      
      // Resposta de erro para a Kiwify
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to process webhook',
        timestamp: new Date().toISOString()
      });
    }
  }
);

module.exports = router;
