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
 * Determina o accessLevel atualizado baseado no accessLevel atual e no novo produto
 * @param {string} currentAccessLevel - AccessLevel atual do usuário
 * @param {string} newProductAccessLevel - AccessLevel do produto sendo comprado
 * @returns {string} - Novo accessLevel
 */
function determineUpgradedAccessLevel(currentAccessLevel, newProductAccessLevel) {
  // Hierarquia dos accessLevels
  const hierarchy = {
    'nenhum': 0,
    'BASICO': 1,
    'INTERMEDIARIO': 2,
    'AVANCADO': 3,
    'ACESSO_COMPLETO': 4
  };

  // Se o usuário não tem acesso, usar o nível do produto
  if (currentAccessLevel === 'nenhum') {
    return newProductAccessLevel;
  }

  // Se o produto não tem acesso válido, manter o atual
  if (newProductAccessLevel === 'nenhum') {
    return currentAccessLevel;
  }

  // Determinar o nível mais alto entre atual e produto
  const currentLevel = hierarchy[currentAccessLevel] || 0;
  const productLevel = hierarchy[newProductAccessLevel] || 0;
  const highestLevel = Math.max(currentLevel, productLevel);

  // Verificar se deve ser ACESSO_COMPLETO
  // ACESSO_COMPLETO = tem BASICO + INTERMEDIARIO + AVANCADO
  // Isso acontece quando o usuário já tem INTERMEDIARIO e compra AVANCADO
  // OU quando já tem AVANCADO e compra INTERMEDIARIO
  // OU quando já tem BASICO e compra AVANCADO (assumindo que já tem INTERMEDIARIO)
  if ((currentAccessLevel === 'INTERMEDIARIO' && newProductAccessLevel === 'AVANCADO') ||
      (currentAccessLevel === 'AVANCADO' && newProductAccessLevel === 'INTERMEDIARIO') ||
      (currentAccessLevel === 'BASICO' && newProductAccessLevel === 'AVANCADO')) {
    return 'ACESSO_COMPLETO';
  }

  // Retornar o nível mais alto
  const levelNames = Object.keys(hierarchy);
  return levelNames.find(level => hierarchy[level] === highestLevel) || currentAccessLevel;
}

/**
 * Determina o accessLevel baseado em todos os produtos comprados pelo usuário
 * @param {Array} allUserProducts - Array com todos os produtos que o usuário já comprou
 * @returns {string} - AccessLevel final baseado em todos os produtos
 */
function determineAccessLevelFromAllProducts(allUserProducts) {
  if (!allUserProducts || allUserProducts.length === 0) {
    return 'nenhum';
  }

  // Mapear produtos para níveis de acesso
  const productAccessMapping = {
    '89aece00-a51b-11f0-ab58-2f2096ded2ba': 'BASICO',           // Kit Niños de Luz
    '2343e890-a538-11f0-98fb-c9aca982ba72': 'INTERMEDIARIO',   // Pack Extra 1
    '44c34a50-a53e-11f0-a7e3-c3b4bfe5981f': 'AVANCADO'         // Pack Extra 2
  };

  // Extrair níveis de acesso dos produtos
  const accessLevels = allUserProducts
    .map(productId => productAccessMapping[productId])
    .filter(Boolean);

  console.log(`🎯 AccessLevels encontrados nos produtos: ${accessLevels.join(', ')}`);

  // Se tem todos os 3 produtos principais, é ACESSO_COMPLETO
  const hasBasico = accessLevels.includes('BASICO');
  const hasIntermediario = accessLevels.includes('INTERMEDIARIO');
  const hasAvancado = accessLevels.includes('AVANCADO');

  if (hasBasico && hasIntermediario && hasAvancado) {
    console.log('🏆 Usuário tem todos os produtos principais - ACESSO_COMPLETO');
    return 'ACESSO_COMPLETO';
  }

  // Caso contrário, retornar o nível mais alto
  const hierarchy = {
    'BASICO': 1,
    'INTERMEDIARIO': 2,
    'AVANCADO': 3
  };

  const highestLevel = accessLevels.reduce((highest, current) => {
    return hierarchy[current] > hierarchy[highest] ? current : highest;
  }, accessLevels[0]);

  console.log(`🏆 AccessLevel mais alto determinado: ${highestLevel}`);
  return highestLevel;
}

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
      console.log('🎉 Webhook da Kiwify recebido e validado com sucesso!');
      
      const body = req.body;
      const customer = body.Customer;
      const products = body.Product || body.Products || body.products || body.product;
      
      // Extrair produtos comprados - Kiwify envia Product (singular) ou Products (plural)
      let productsArray = [];
      if (body.Products && Array.isArray(body.Products)) {
        // Array de produtos (plural)
        productsArray = body.Products;
      } else if (body.products && Array.isArray(body.products)) {
        // Array de produtos (plural) - lowercase
        productsArray = body.products;
      } else if (body.Product && typeof body.Product === 'object') {
        // Produto único (singular) - converter para array
        productsArray = [body.Product];
      } else if (body.product && typeof body.product === 'object') {
        // Produto único (singular) - lowercase
        productsArray = [body.product];
      }
      console.log(`📦 Produtos comprados:`, productsArray);

      // Verificar se é um evento de upsell (Produto 3)
      const isUpsell = productsArray.some(product => 
        product.product_id === 'd614e9f0-a845-11f0-a8cd-a7de6dd83d71'
      );

      if (isUpsell) {
        console.log('🎁 Upsell detectado - Produto 3');
        
        // Buscar usuário existente
        const existingUser = await User.findOne({
          where: { email: customer.email.toLowerCase() }
        });

        if (existingUser) {
          // Atualizar flag de upsell
          await User.update(
            { comprou_produto_3: true },
            { where: { id: existingUser.id } }
          );
          
          console.log(`✅ Upsell ativado para usuário: ${existingUser.id}`);

          // Enviar email de confirmação do upsell
          try {
            await emailService.sendUpsellConfirmationEmail(customer.email, customer.full_name);
            console.log(`📧 Email de confirmação do upsell enviado para: ${customer.email}`);
          } catch (emailError) {
            console.error('❌ Erro ao enviar email de upsell:', emailError);
          }

          return res.status(200).json({
            message: 'Upsell processed successfully',
            userId: existingUser.id,
            email: customer.email,
            upsell: 'PRODUTO_3'
          });
        } else {
          console.log('⚠️ Usuário não encontrado para upsell, criando novo usuário');
        }
      }

      // Verificar se o usuário já existe
      const existingUser = await User.findOne({
        where: { email: customer.email.toLowerCase() }
      });

      if (existingUser) {
        console.log(`✅ Usuário existente encontrado: ${existingUser.id}`);
        console.log(`📊 AccessLevel atual: ${existingUser.accessLevel}`);
        
        // Determinar novo nível de acesso baseado no produto atual + accessLevel existente
        const currentAccessLevel = accessLevelService.determineAccessLevel(productsArray);
        console.log(`🎯 Nível de acesso do produto atual: ${currentAccessLevel}`);
        
        // Lógica para determinar o accessLevel final baseado no atual + produto novo
        const newAccessLevel = determineUpgradedAccessLevel(existingUser.accessLevel, currentAccessLevel);
        console.log(`🎯 Novo nível de acesso determinado: ${newAccessLevel}`);
        
        // Atualizar nível de acesso do usuário existente se necessário
        if (existingUser.accessLevel !== newAccessLevel) {
          await User.update(
            { accessLevel: newAccessLevel },
            { where: { id: existingUser.id } }
          );
          console.log(`🔄 Nível de acesso atualizado para ${newAccessLevel}`);
        }

        return res.status(200).json({
          message: 'User access updated',
          userId: existingUser.id,
          email: customer.email,
          accessLevel: newAccessLevel
        });
      }

      // NOVO USUÁRIO - Determinar nível de acesso baseado nos produtos comprados
      const accessLevel = accessLevelService.determineAccessLevel(productsArray);
      console.log(`🎯 Nível de acesso determinado para novo usuário: ${accessLevel}`);

      // Gerar senha segura
      const generatedPassword = passwordService.generateSecurePassword();
      console.log(`🔐 Senha gerada para ${customer.email}`);

      // Hash da senha
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(generatedPassword, salt);

      // Criar novo usuário (comprou_produto_3 será false por padrão)
      let newUser;
      try {
        newUser = await User.create({
          name: customer.full_name.trim(),
          email: customer.email.toLowerCase(),
          password: hashedPassword,
          role: 'user',
          accessLevel: accessLevel,
          comprou_produto_3: false // Novo usuário sempre começa com false
        });
      } catch (createError) {
        // Se o usuário já existe (erro de duplicação), buscar o usuário existente
        if (createError.name === 'SequelizeUniqueConstraintError' && createError.errors?.[0]?.path === 'email') {
          console.log(`⚠️ Usuário já existe durante criação, buscando usuário existente: ${customer.email}`);
          
          const existingUser = await User.findOne({ 
            where: { email: customer.email.toLowerCase() } 
          });
          
          if (existingUser) {
            console.log(`✅ Usuário existente encontrado: ${existingUser.id}`);
            console.log(`📊 AccessLevel atual: ${existingUser.accessLevel}`);
            
            // Determinar novo nível de acesso baseado no produto atual + accessLevel existente
            const currentAccessLevel = accessLevelService.determineAccessLevel(productsArray);
            console.log(`🎯 Nível de acesso do produto atual: ${currentAccessLevel}`);
            
            // Lógica para determinar o accessLevel final baseado no atual + produto novo
            const newAccessLevel = determineUpgradedAccessLevel(existingUser.accessLevel, currentAccessLevel);
            console.log(`🎯 Novo nível de acesso determinado: ${newAccessLevel}`);
            
            // Atualizar nível de acesso do usuário existente se necessário
            if (existingUser.accessLevel !== newAccessLevel) {
              await User.update(
                { accessLevel: newAccessLevel },
                { where: { id: existingUser.id } }
              );
              console.log(`🔄 Nível de acesso atualizado para ${newAccessLevel}`);
            }
            
            return res.status(200).json({ 
              message: 'User access updated (duplicate creation handled)',
              userId: existingUser.id,
              email: customer.email,
              accessLevel: newAccessLevel
            });
          }
        }
        
        // Se não é erro de duplicação ou usuário não encontrado, relançar o erro
        throw createError;
      }

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

      // Enviar e-mail de boas-vindas (assíncrono)
      emailService.sendWelcomeEmail(emailData)
        .then(() => {
          console.log(`📧 E-mail de boas-vindas enviado para: ${customer.email}`);
        })
        .catch(error => {
          console.error('❌ Erro ao enviar e-mail de boas-vindas:', error);
        });

      // Enviar notificação (assíncrono)
      sendNotificationWithFallback(
        `Novo usuário criado: ${customer.full_name} (${customer.email})`,
        `Access Level: ${accessLevel}`
      ).catch(error => {
        console.error('❌ Erro ao enviar notificação:', error);
      });

    } catch (error) {
      console.error('❌ Erro ao processar webhook da Kiwify:', error);
      
      // Enviar notificação de erro (assíncrono)
      sendNotificationWithFallback(
        'Erro no webhook da Kiwify',
        `Erro: ${error.message}`
      ).catch(notifError => {
        console.error('❌ Erro ao enviar notificação de erro:', notifError);
      });

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
 * Endpoint alternativo para webhooks da Kiwify (compatibilidade)
 * POST /api/webhook
 */
router.post('/', 
  logWebhookData,
  validateKiwifyWebhook,
  validateWebhookData,
  async (req, res) => {
    try {
      console.log('🎉 Webhook alternativo da Kiwify recebido e validado com sucesso!');
      
      const body = req.body;
      const customer = body.Customer;
      const products = body.Product || body.Products || body.products || body.product;
      
      // Extrair produtos comprados - Kiwify envia Product (singular) ou Products (plural)
      let productsArray = [];
      if (body.Products && Array.isArray(body.Products)) {
        // Array de produtos (plural)
        productsArray = body.Products;
      } else if (body.products && Array.isArray(body.products)) {
        // Array de produtos (plural) - lowercase
        productsArray = body.products;
      } else if (body.Product && typeof body.Product === 'object') {
        // Produto único (singular) - converter para array
        productsArray = [body.Product];
      } else if (body.product && typeof body.product === 'object') {
        // Produto único (singular) - lowercase
        productsArray = [body.product];
      }
      console.log(`📦 Produtos comprados:`, productsArray);

      // Verificar se é um evento de upsell (Produto 3)
      const isUpsell = productsArray.some(product => 
        product.product_id === 'd614e9f0-a845-11f0-a8cd-a7de6dd83d71'
      );

      if (isUpsell) {
        console.log('🎁 Upsell detectado - Produto 3');
        
        // Buscar usuário existente
        const existingUser = await User.findOne({
          where: { email: customer.email.toLowerCase() }
        });

        if (existingUser) {
          // Atualizar flag de upsell
          await User.update(
            { comprou_produto_3: true },
            { where: { id: existingUser.id } }
          );
          
          console.log(`✅ Upsell ativado para usuário: ${existingUser.id}`);

          // Enviar email de confirmação do upsell
          try {
            await emailService.sendUpsellConfirmationEmail(customer.email, customer.full_name);
            console.log(`📧 Email de confirmação do upsell enviado para: ${customer.email}`);
          } catch (emailError) {
            console.error('❌ Erro ao enviar email de upsell:', emailError);
          }

          return res.status(200).json({
            message: 'Upsell processed successfully',
            userId: existingUser.id,
            email: customer.email,
            upsell: 'PRODUTO_3'
          });
        } else {
          console.log('⚠️ Usuário não encontrado para upsell, criando novo usuário');
        }
      }

      // Verificar se o usuário já existe
      const existingUser = await User.findOne({
        where: { email: customer.email.toLowerCase() }
      });

      if (existingUser) {
        console.log(`✅ Usuário existente encontrado: ${existingUser.id}`);
        console.log(`📊 AccessLevel atual: ${existingUser.accessLevel}`);
        
        // Determinar novo nível de acesso baseado no produto atual + accessLevel existente
        const currentAccessLevel = accessLevelService.determineAccessLevel(productsArray);
        console.log(`🎯 Nível de acesso do produto atual: ${currentAccessLevel}`);
        
        // Lógica para determinar o accessLevel final baseado no atual + produto novo
        const newAccessLevel = determineUpgradedAccessLevel(existingUser.accessLevel, currentAccessLevel);
        console.log(`🎯 Novo nível de acesso determinado: ${newAccessLevel}`);
        
        // Atualizar nível de acesso do usuário existente se necessário
        if (existingUser.accessLevel !== newAccessLevel) {
          await User.update(
            { accessLevel: newAccessLevel },
            { where: { id: existingUser.id } }
          );
          console.log(`🔄 Nível de acesso atualizado para ${newAccessLevel}`);
        }

        return res.status(200).json({
          message: 'User access updated',
          userId: existingUser.id,
          email: customer.email,
          accessLevel: newAccessLevel
        });
      }

      // NOVO USUÁRIO - Determinar nível de acesso baseado nos produtos comprados
      const accessLevel = accessLevelService.determineAccessLevel(productsArray);
      console.log(`🎯 Nível de acesso determinado para novo usuário: ${accessLevel}`);

      // Gerar senha segura
      const generatedPassword = passwordService.generateSecurePassword();
      console.log(`🔐 Senha gerada para ${customer.email}`);

      // Hash da senha
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(generatedPassword, salt);

      // Criar novo usuário (comprou_produto_3 será false por padrão)
      let newUser;
      try {
        newUser = await User.create({
          name: customer.full_name.trim(),
          email: customer.email.toLowerCase(),
          password: hashedPassword,
          role: 'user',
          accessLevel: accessLevel,
          comprou_produto_3: false // Novo usuário sempre começa com false
        });
      } catch (createError) {
        // Se o usuário já existe (erro de duplicação), buscar o usuário existente
        if (createError.name === 'SequelizeUniqueConstraintError' && createError.errors?.[0]?.path === 'email') {
          console.log(`⚠️ Usuário já existe durante criação, buscando usuário existente: ${customer.email}`);
          
          const existingUser = await User.findOne({ 
            where: { email: customer.email.toLowerCase() } 
          });
          
          if (existingUser) {
            console.log(`✅ Usuário existente encontrado: ${existingUser.id}`);
            console.log(`📊 AccessLevel atual: ${existingUser.accessLevel}`);
            
            // Determinar novo nível de acesso baseado no produto atual + accessLevel existente
            const currentAccessLevel = accessLevelService.determineAccessLevel(productsArray);
            console.log(`🎯 Nível de acesso do produto atual: ${currentAccessLevel}`);
            
            // Lógica para determinar o accessLevel final baseado no atual + produto novo
            const newAccessLevel = determineUpgradedAccessLevel(existingUser.accessLevel, currentAccessLevel);
            console.log(`🎯 Novo nível de acesso determinado: ${newAccessLevel}`);
            
            // Atualizar nível de acesso do usuário existente se necessário
            if (existingUser.accessLevel !== newAccessLevel) {
              await User.update(
                { accessLevel: newAccessLevel },
                { where: { id: existingUser.id } }
              );
              console.log(`🔄 Nível de acesso atualizado para ${newAccessLevel}`);
            }
            
            return res.status(200).json({ 
              message: 'User access updated (duplicate creation handled)',
              userId: existingUser.id,
              email: customer.email,
              accessLevel: newAccessLevel
            });
          }
        }
        
        // Se não é erro de duplicação ou usuário não encontrado, relançar o erro
        throw createError;
      }

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

      // Enviar e-mail de boas-vindas (assíncrono)
      emailService.sendWelcomeEmail(emailData)
        .then(() => {
          console.log(`📧 E-mail de boas-vindas enviado para: ${customer.email}`);
        })
        .catch(error => {
          console.error('❌ Erro ao enviar e-mail de boas-vindas:', error);
        });

      // Enviar notificação (assíncrono)
      sendNotificationWithFallback(
        `Novo usuário criado: ${customer.full_name} (${customer.email})`,
        `Access Level: ${accessLevel}`
      ).catch(error => {
        console.error('❌ Erro ao enviar notificação:', error);
      });

    } catch (error) {
      console.error('❌ Erro ao processar webhook da Kiwify:', error);
      
      // Enviar notificação de erro (assíncrono)
      sendNotificationWithFallback(
        'Erro no webhook da Kiwify',
        `Erro: ${error.message}`
      ).catch(notifError => {
        console.error('❌ Erro ao enviar notificação de erro:', notifError);
      });

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
