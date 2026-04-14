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

    // Enviar emails específicos se adicionou algum destes produtos à conta existente
    const upgrades = [
      { flag: 'tem_pack_1', name: 'Pack Expansión - Motivación y Juego' },
      { flag: 'tem_pack_2', name: 'Pack Expansión 2 - Valores y Fe' },
      { flag: 'comprou_produto_3', name: 'Kit Esencial - Rutinas sin Gritos' }
    ];

    for (const upgrade of upgrades) {
      if (currentPurchaseFlags[upgrade.flag] && !existingUser[upgrade.flag]) {
        try {
          await emailService.sendUpsellConfirmationEmail({
            name: name,
            email: email,
            loginUrl: process.env.FRONTEND_URL || 'https://www.ninosdeluz.site/login',
            productName: upgrade.name
          });
          console.log(`📧 Email de confirmação do upsell (${upgrade.name}) enviado para: ${email}`);
        } catch (emailError) {
          console.error(`❌ Erro ao enviar email de upsell (${upgrade.name}):`, emailError);
        }
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

  // Enviar e-mail de upsell se aplicável (para compras iniciais simultâneas)
  const initialUpgrades = [
    { flag: 'tem_pack_1', name: 'Pack Expansión - Motivación y Juego' },
    { flag: 'tem_pack_2', name: 'Pack Expansión 2 - Valores y Fe' },
    { flag: 'comprou_produto_3', name: 'Kit Esencial - Rutinas sin Gritos' }
  ];

  for (const upgrade of initialUpgrades) {
    if (currentPurchaseFlags[upgrade.flag]) {
      emailService.sendUpsellConfirmationEmail({
        name: name,
        email: email,
        loginUrl: loginUrl,
        productName: upgrade.name
      }).catch(err => console.error(`❌ Erro email upsell (${upgrade.name}):`, err));
    }
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
      const data = body.data || body;
      
      // Extrair status da compra
      const status = (data.purchase && data.purchase.status) || data.status;
      console.log(`📡 Webhook Hotmart recebido com status: ${status}`);

      // 👉 Regra: Só liberar acesso se status for 'approved' (case-insensitive)
      if (!status || status.toString().toLowerCase() !== 'approved') {
        console.log(`⏳ Pagamento Hotmart com status "${status}". Acesso NÃO liberado ainda.`);
        return res.status(200).json({
          success: true,
          message: `Webhook received. Status is ${status}. Access will be released when status is approved.`
        });
      }

      const buyer = data.buyer;
      const product = data.product;

      const result = await handlePurchase({
        email: buyer.email,
        name: buyer.name,
        products: product.id,
        source: 'Hotmart'
      });

      res.status(200).json({
        success: true,
        message: result.status === 'created' ? 'User created and access released' : 'User access updated',
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
