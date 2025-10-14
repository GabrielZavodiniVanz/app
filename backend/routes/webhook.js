const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const emailService = require('../services/emailService');
const passwordService = require('../services/passwordService');
const accessLevelService = require('../services/accessLevelService');
const { sendNotificationWithFallback } = require('./notifications-fallback');
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
      const customer = body.Customer || body.customer;

      console.log(`🔄 Processando webhook para cliente: ${customer.email}`);

      // Verificar se o usuário já existe
      const existingUser = await User.findOne({ 
        where: { email: customer.email.toLowerCase() } 
      });

      // Extrair produtos comprados
      const products = body.Products || body.products || [];
      console.log(`📦 Produtos comprados:`, products);

      if (existingUser) {
        console.log(`ℹ️ Usuário já existe: ${customer.email} - Verificando se é upsell...`);
        
        // Verificar se algum dos produtos comprados é o PRODUTO_3 (upsell)
        const hasProduto3 = products.some(product => {
          const productId = product.product_id || product.id;
          return productId === accessLevelService.PRODUCT_IDS.PRODUTO_3;
        });

        if (hasProduto3) {
          console.log(`🎉 UPSELL detectado! Usuário ${customer.email} comprou PRODUTO_3`);
          
          // Atualizar flag de compra do produto 3
          await User.update(
            { comprou_produto_3: true },
            { where: { id: existingUser.id } }
          );
          
          // Enviar email de confirmação do upsell
          const loginUrl = process.env.FRONTEND_URL 
            ? `${process.env.FRONTEND_URL}/login`
            : 'https://www.ninosdeluz.site/login';

          const upsellEmailData = {
            name: existingUser.name,
            email: existingUser.email,
            loginUrl: loginUrl,
            productName: 'Mi Libro para Colorear con Fe'
          };

          // Enviar email de confirmação do upsell (não bloqueante)
          emailService.sendUpsellConfirmationEmail(upsellEmailData).then(() => {
            console.log(`📧 Email de confirmação do upsell enviado para: ${customer.email}`);
          }).catch((emailError) => {
            console.error(`❌ Erro ao enviar email de upsell para ${customer.email}:`, emailError);
          });

          // Enviar notificação via email
          const notificationData = {
            type: 'upsell_completed',
            message: 'Novo conteúdo disponível! Atualizando página...',
            action: 'refresh',
            productName: 'Mi Libro para Colorear con Fe',
            loginUrl: loginUrl
          };

          // Usar sistema de fallback que funciona tanto em dev quanto em produção
          sendNotificationWithFallback(existingUser.id, notificationData).then((sent) => {
            if (sent) {
              console.log(`✅ Notificação enviada com sucesso para usuário ${existingUser.id}`);
            } else {
              console.log(`❌ Falha ao enviar notificação para usuário ${existingUser.id}`);
            }
          }).catch((error) => {
            console.error(`❌ Erro ao enviar notificação:`, error);
          });

          return res.status(200).json({ 
            message: 'Upsell processed successfully',
            userId: existingUser.id,
            email: customer.email,
            upsell: 'PRODUTO_3'
          });
        } else {
          console.log(`ℹ️ Compra normal detectada para usuário existente`);
          
          // Determinar nível de acesso baseado nos produtos comprados (lógica normal)
          const accessLevel = accessLevelService.determineAccessLevel(products);
          console.log(`🎯 Nível de acesso determinado: ${accessLevel}`);
          
          // Atualizar nível de acesso do usuário existente se necessário
          if (existingUser.accessLevel !== accessLevel) {
            await User.update(
              { accessLevel: accessLevel },
              { where: { id: existingUser.id } }
            );
            console.log(`🔄 Nível de acesso atualizado para ${accessLevel}`);
          }
          
          return res.status(200).json({ 
            message: 'User access updated',
            userId: existingUser.id,
            email: customer.email,
            accessLevel: accessLevel
          });
        }
      }

      // NOVO USUÁRIO - Determinar nível de acesso baseado nos produtos comprados
      const accessLevel = accessLevelService.determineAccessLevel(products);
      console.log(`🎯 Nível de acesso determinado para novo usuário: ${accessLevel}`);

      // Gerar senha segura
      const generatedPassword = passwordService.generateSecurePassword();
      console.log(`🔐 Senha gerada para ${customer.email}`);

      // Hash da senha
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(generatedPassword, salt);

      // Criar novo usuário (comprou_produto_3 será false por padrão)
      const newUser = await User.create({
        name: customer.full_name.trim(),
        email: customer.email.toLowerCase(),
        password: hashedPassword,
        role: 'user',
        accessLevel: accessLevel,
        comprou_produto_3: false // Novo usuário sempre começa com false
      });

      console.log(`✅ Usuário criado com sucesso: ${newUser.id}`);

      // Preparar dados para o e-mail
      const loginUrl = process.env.FRONTEND_URL 
        ? `${process.env.FRONTEND_URL}/login`
        : 'https://www.ninosdeluz.site/login';

      const emailData = {
        name: customer.full_name,
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
        accessLevel: accessLevel,
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
      const customer = body.Customer || body.customer;

      console.log(`🔄 Processando webhook para cliente: ${customer.email}`);

      // Verificar se o usuário já existe
      const existingUser = await User.findOne({ 
        where: { email: customer.email.toLowerCase() } 
      });

      // Extrair produtos comprados
      const products = body.Products || body.products || [];
      console.log(`📦 Produtos comprados:`, products);

      if (existingUser) {
        console.log(`ℹ️ Usuário já existe: ${customer.email} - Verificando se é upsell...`);
        
        // Verificar se algum dos produtos comprados é o PRODUTO_3 (upsell)
        const hasProduto3 = products.some(product => {
          const productId = product.product_id || product.id;
          return productId === accessLevelService.PRODUCT_IDS.PRODUTO_3;
        });

        if (hasProduto3) {
          console.log(`🎉 UPSELL detectado! Usuário ${customer.email} comprou PRODUTO_3`);
          
          // Atualizar flag de compra do produto 3
          await User.update(
            { comprou_produto_3: true },
            { where: { id: existingUser.id } }
          );
          
          // Enviar email de confirmação do upsell
          const loginUrl = process.env.FRONTEND_URL 
            ? `${process.env.FRONTEND_URL}/login`
            : 'https://www.ninosdeluz.site/login';

          const upsellEmailData = {
            name: existingUser.name,
            email: existingUser.email,
            loginUrl: loginUrl,
            productName: 'Mi Libro para Colorear con Fe'
          };

          // Enviar email de confirmação do upsell (não bloqueante)
          emailService.sendUpsellConfirmationEmail(upsellEmailData).then(() => {
            console.log(`📧 Email de confirmação do upsell enviado para: ${customer.email}`);
          }).catch((emailError) => {
            console.error(`❌ Erro ao enviar email de upsell para ${customer.email}:`, emailError);
          });

          // Enviar notificação via email
          const notificationData = {
            type: 'upsell_completed',
            message: 'Novo conteúdo disponível! Atualizando página...',
            action: 'refresh',
            productName: 'Mi Libro para Colorear con Fe',
            loginUrl: loginUrl
          };

          // Usar sistema de fallback que funciona tanto em dev quanto em produção
          sendNotificationWithFallback(existingUser.id, notificationData).then((sent) => {
            if (sent) {
              console.log(`✅ Notificação enviada com sucesso para usuário ${existingUser.id}`);
            } else {
              console.log(`❌ Falha ao enviar notificação para usuário ${existingUser.id}`);
            }
          }).catch((error) => {
            console.error(`❌ Erro ao enviar notificação:`, error);
          });

          return res.status(200).json({ 
            message: 'Upsell processed successfully',
            userId: existingUser.id,
            email: customer.email,
            upsell: 'PRODUTO_3'
          });
        } else {
          console.log(`ℹ️ Compra normal detectada para usuário existente`);
          
          // Determinar nível de acesso baseado nos produtos comprados (lógica normal)
          const accessLevel = accessLevelService.determineAccessLevel(products);
          console.log(`🎯 Nível de acesso determinado: ${accessLevel}`);
          
          // Atualizar nível de acesso do usuário existente se necessário
          if (existingUser.accessLevel !== accessLevel) {
            await User.update(
              { accessLevel: accessLevel },
              { where: { id: existingUser.id } }
            );
            console.log(`🔄 Nível de acesso atualizado para ${accessLevel}`);
          }
          
          return res.status(200).json({ 
            message: 'User access updated',
            userId: existingUser.id,
            email: customer.email,
            accessLevel: accessLevel
          });
        }
      }

      // NOVO USUÁRIO - Determinar nível de acesso baseado nos produtos comprados
      const accessLevel = accessLevelService.determineAccessLevel(products);
      console.log(`🎯 Nível de acesso determinado para novo usuário: ${accessLevel}`);

      // Gerar senha segura
      const generatedPassword = passwordService.generateSecurePassword();
      console.log(`🔐 Senha gerada para ${customer.email}`);

      // Hash da senha
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(generatedPassword, salt);

      // Criar novo usuário (comprou_produto_3 será false por padrão)
      const newUser = await User.create({
        name: customer.full_name,
        email: customer.email.toLowerCase(),
        password: hashedPassword,
        role: 'user',
        accessLevel: accessLevel,
        comprou_produto_3: false // Novo usuário sempre começa com false
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
        accessLevel: accessLevel,
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
