const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const emailService = require('../services/emailService');
const passwordService = require('../services/passwordService');
const accessLevelService = require('../services/accessLevelService');
const { sendNotificationWithFallback } = require('./notifications-fallback');

// Kiwify Middleware
const {
  validateKiwifyWebhook,
  logWebhookData,
  validateWebhookData
} = require('../middleware/kiwifyWebhookMiddleware');

// Hotmart Middleware
const {
  validateHotmartWebhook,
  logHotmartWebhookData,
  validateHotmartWebhookData
} = require('../middleware/hotmartWebhookMiddleware');

/**
 * Determina o accessLevel atualizado (LEGACY - Mantido para compatibilidade)
 */
function determineUpgradedAccessLevel(currentAccessLevel, newProductAccessLevel) {
  const hierarchy = {
    'nenhum': 0,
    'BASICO': 1,
    'INTERMEDIARIO': 2,
    'AVANCADO': 3,
    'ACESSO_COMPLETO': 4
  };

  if (currentAccessLevel === 'nenhum') return newProductAccessLevel;
  if (newProductAccessLevel === 'nenhum') return currentAccessLevel;

  const currentLevel = hierarchy[currentAccessLevel] || 0;
  const productLevel = hierarchy[newProductAccessLevel] || 0;
  const highestLevel = Math.max(currentLevel, productLevel);

  // Lógica legacy de upgrade
  if ((currentAccessLevel === 'INTERMEDIARIO' && newProductAccessLevel === 'AVANCADO') ||
    (currentAccessLevel === 'AVANCADO' && newProductAccessLevel === 'INTERMEDIARIO') ||
    (currentAccessLevel === 'BASICO' && newProductAccessLevel === 'AVANCADO')) {
    return 'ACESSO_COMPLETO';
  }

  const levelNames = Object.keys(hierarchy);
  return levelNames.find(level => hierarchy[level] === highestLevel) || currentAccessLevel;
}

/**
 * Lógica Central de Processamento de Compra
 * Gerencia criação de usuários, atualização de acesso e envio de e-mails
 */
async function handlePurchase({ email, name, products, source }) {
  console.log(`🚀 Processando compra via ${source} para: ${email}`);

  // Determinar flags dos produtos comprados Nesta Transação
  const currentPurchaseFlags = accessLevelService.determineUserProducts(products);
  console.log('🎯 Flags da compra atual:', currentPurchaseFlags);

  // Verificar se o usuário já existe
  const existingUser = await User.findOne({
    where: { email: email.toLowerCase() }
  });

  if (existingUser) {
    console.log(`✅ Usuário existente encontrado: ${existingUser.id}`);

    // Merge das flags (Manter o que o usuário já tinha + o que comprou agora)
    const updatedFlags = {
      tem_kit_principal: existingUser.tem_kit_principal || currentPurchaseFlags.tem_kit_principal,
      tem_pack_1: existingUser.tem_pack_1 || currentPurchaseFlags.tem_pack_1,
      tem_pack_2: existingUser.tem_pack_2 || currentPurchaseFlags.tem_pack_2,
      comprou_produto_3: existingUser.comprou_produto_3 || currentPurchaseFlags.comprou_produto_3
    };

    // Lógica Legacy para AccessLevel (apenas para não quebrar compatibilidade)
    const currentAccessLevelLegacy = accessLevelService.determineAccessLevel(Array.isArray(products) ? products : [products]);
    const newAccessLevelLegacy = determineUpgradedAccessLevel(existingUser.accessLevel, currentAccessLevelLegacy);

    // Atualizar usuário
    await User.update(
      {
        ...updatedFlags,
        accessLevel: newAccessLevelLegacy
      },
      { where: { id: existingUser.id } }
    );
    console.log(`🔄 Usuário atualizado com flags:`, updatedFlags);

    // Se comprou produto 3 (upsell) nesta transação, e não tinha antes, enviar email específico
    if (currentPurchaseFlags.comprou_produto_3 && !existingUser.comprou_produto_3) {
      try {
        await emailService.sendUpsellConfirmationEmail({
          name: name,
          email: email,
          loginUrl: process.env.FRONTEND_URL || 'https://www.ninosdeluz.site/login',
          productName: 'Kit Esencial - Rutinas sin Gritos'
        });
        console.log(`📧 Email de confirmação do upsell enviado para: ${email}`);
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de upsell:', emailError);
      }
    }

    return {
      userId: existingUser.id,
      status: 'updated',
      accessLevel: newAccessLevelLegacy,
      flags: updatedFlags
    };
  }

  // NOVO USUÁRIO
  console.log('🆕 Criando novo usuário...');

  // Legacy Access Level
  const accessLevelLegacy = accessLevelService.determineAccessLevel(Array.isArray(products) ? products : [products]);

  // Gerar senha
  const generatedPassword = passwordService.generateSecurePassword();
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(generatedPassword, salt);

  let newUser;
  try {
    newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user',
      accessLevel: accessLevelLegacy,
      // Novas Flags
      tem_kit_principal: currentPurchaseFlags.tem_kit_principal,
      tem_pack_1: currentPurchaseFlags.tem_pack_1,
      tem_pack_2: currentPurchaseFlags.tem_pack_2,
      comprou_produto_3: currentPurchaseFlags.comprou_produto_3
    });
  } catch (createError) {
    // Tratamento de concorrência
    if (createError.name === 'SequelizeUniqueConstraintError') {
      console.log(`⚠️ Usuário criado concorrentemente, tentando atualizar: ${email}`);
      // Recursão simples para tentar novamente como atualização
      return handlePurchase({ email, name, products, source });
    }
    throw createError;
  }

  console.log(`✅ Usuário criado com sucesso: ${newUser.id}`);

  // Enviar e-mail de boas-vindas
  const loginUrl = process.env.FRONTEND_URL || 'https://www.ninosdeluz.site/login';
  emailService.sendWelcomeEmail({
    name: name,
    email: email,
    password: generatedPassword,
    loginUrl: loginUrl
  }).catch(err => console.error('❌ Erro ao enviar boas-vindas:', err));

  // Enviar e-mail de upsell se aplicável
  if (currentPurchaseFlags.comprou_produto_3) {
    emailService.sendUpsellConfirmationEmail({
      name: name,
      email: email,
      loginUrl: loginUrl,
      productName: 'Kit Esencial - Rutinas sin Gritos'
    }).catch(err => console.error('❌ Erro email upsell:', err));
  }

  return {
    userId: newUser.id,
    status: 'created',
    accessLevel: accessLevelLegacy,
    flags: currentPurchaseFlags
  };
}

/**
 * Webhook Kiwify
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

      // Extrair produtos (Formato Kiwify pode variar)
      let products = body.Products || body.products || body.Product || body.product || [];
      
      const result = await handlePurchase({
        email: customer.email,
        name: customer.full_name,
        products: products,
        source: 'Kiwify'
      });

      res.status(200).json({
        success: true,
        message: result.status === 'created' ? 'User created successfully' : 'User access updated',
        ...result
      });

    } catch (error) {
      console.error('❌ Erro no webhook Kiwify:', error);
      sendNotificationWithFallback('Erro no webhook Kiwify', `Erro: ${error.message}`).catch(() => { });
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }
);

/**
 * Webhook Hotmart
 * POST /api/webhook/hotmart
 */
router.post('/hotmart',
  logHotmartWebhookData,
  validateHotmartWebhook,
  validateHotmartWebhookData,
  async (req, res) => {
    try {
      const body = req.body;
      // Hotmart Webhook V2 costuma vir com os dados em body.data ou direto no body dependendo da configuração
      const data = body.data || body;
      const buyer = data.buyer;
      const product = data.product;

      const result = await handlePurchase({
        email: buyer.email,
        name: buyer.name,
        products: product.id, // Hotmart envia um ID de produto por webhook de compra
        source: 'Hotmart'
      });

      res.status(200).json({
        success: true,
        message: result.status === 'created' ? 'User created successfully' : 'User access updated',
        ...result
      });

    } catch (error) {
      console.error('❌ Erro no webhook Hotmart:', error);
      sendNotificationWithFallback('Erro no webhook Hotmart', `Erro: ${error.message}`).catch(() => { });
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }
);

/**
 * Endpoint raiz (LEGACY)
 */
router.post('/', (req, res) => {
  res.redirect(307, req.baseUrl + '/kiwify');
});

module.exports = router;
