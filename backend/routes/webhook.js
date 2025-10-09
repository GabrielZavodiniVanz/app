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
      const body = req.body;
      const customer = body.Customer;

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
        name: customer.full_name.trim(),
        email: customer.email.toLowerCase(),
        password: hashedPassword,
        role: 'user'
      });

      console.log(`✅ Usuário criado com sucesso: ${newUser.id}`);

      // Preparar dados para o e-mail
      const loginUrl = process.env.FRONTEND_URL 
        ? `${process.env.FRONTEND_URL}/login`
        : 'https://www.ninosdeluz.site/login';

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
 * Endpoint alternativo para webhook da Kiwify (aceita /api/webhook)
 * POST /api/webhook
 */
router.post('/', 
  logWebhookData,
  validateKiwifyWebhook,
  validateWebhookData,
  async (req, res) => {
    try {
      const body = req.body;
      const customer = body.Customer;

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
        name: customer.full_name,
        email: customer.email.toLowerCase(),
        password: hashedPassword,
        role: 'user'
      });

      console.log(`✅ Novo usuário criado via webhook: ${newUser.email}`);

      // Preparar dados para o e-mail
      const loginUrl = process.env.FRONTEND_URL || 'https://www.ninosdeluz.site/login';
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
