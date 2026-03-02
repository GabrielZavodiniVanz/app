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

      // Extrair produtos comprados
      let productsArray = [];
      if (body.Products && Array.isArray(body.Products)) {
        productsArray = body.Products;
      } else if (body.products && Array.isArray(body.products)) {
        productsArray = body.products;
      } else if (body.Product && typeof body.Product === 'object') {
        productsArray = [body.Product];
      } else if (body.product && typeof body.product === 'object') {
        productsArray = [body.product];
      }
      console.log(`📦 Produtos comprados:`, productsArray);

      // Determinar flags dos produtos comprados Nesta Transação
      const currentPurchaseFlags = accessLevelService.determineUserProducts(productsArray);
      console.log('🎯 Flags da compra atual:', currentPurchaseFlags);

      // Verificar se o usuário já existe
      const existingUser = await User.findOne({
        where: { email: customer.email.toLowerCase() }
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
        const currentAccessLevelLegacy = accessLevelService.determineAccessLevel(productsArray);
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

        // Se comprou produto 3 (upsell) nesta transação, enviar email específico
        if (currentPurchaseFlags.comprou_produto_3 && !existingUser.comprou_produto_3) {
          try {
            await emailService.sendUpsellConfirmationEmail(customer.email, customer.full_name);
            console.log(`📧 Email de confirmação do upsell enviado para: ${customer.email}`);
          } catch (emailError) {
            console.error('❌ Erro ao enviar email de upsell:', emailError);
          }
        }

        return res.status(200).json({
          message: 'User access updated',
          userId: existingUser.id,
          accessLevel: newAccessLevelLegacy,
          flags: updatedFlags
        });
      }

      // NOVO USUÁRIO
      console.log('🆕 Criando novo usuário...');

      // Legacy Access Level
      const accessLevelLegacy = accessLevelService.determineAccessLevel(productsArray);

      // Gerar senha
      const generatedPassword = passwordService.generateSecurePassword();
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(generatedPassword, salt);

      let newUser;
      try {
        newUser = await User.create({
          name: customer.full_name.trim(),
          email: customer.email.toLowerCase(),
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
        // Tratamento de concorrência (usuário criado por outro request simultâneo)
        if (createError.name === 'SequelizeUniqueConstraintError') {
          console.log(`⚠️ Usuário criado concorrentemente, atualizando existente: ${customer.email}`);
          const concurrentUser = await User.findOne({ where: { email: customer.email.toLowerCase() } });

          if (concurrentUser) {
            // Merge flags
            const mergedFlags = {
              tem_kit_principal: concurrentUser.tem_kit_principal || currentPurchaseFlags.tem_kit_principal,
              tem_pack_1: concurrentUser.tem_pack_1 || currentPurchaseFlags.tem_pack_1,
              tem_pack_2: concurrentUser.tem_pack_2 || currentPurchaseFlags.tem_pack_2,
              comprou_produto_3: concurrentUser.comprou_produto_3 || currentPurchaseFlags.comprou_produto_3
            };

            await User.update(mergedFlags, { where: { id: concurrentUser.id } });
            return res.status(200).json({ message: 'User updated (concurrent handling)', userId: concurrentUser.id });
          }
        }
        throw createError;
      }

      console.log(`✅ Usuário criado com sucesso: ${newUser.id}`);
      console.log(`🎯 Flags iniciais:`, currentPurchaseFlags);

      // Enviar e-mail de boas-vindas
      const loginUrl = process.env.FRONTEND_URL || 'https://www.ninosdeluz.site/login';
      emailService.sendWelcomeEmail({
        name: customer.full_name,
        email: customer.email,
        password: generatedPassword,
        loginUrl: loginUrl
      }).catch(err => console.error('❌ Erro ao enviar boas-vindas:', err));

      // Enviar e-mail de upsell se aplicável
      if (currentPurchaseFlags.comprou_produto_3) {
        emailService.sendUpsellConfirmationEmail(customer.email, customer.full_name)
          .catch(err => console.error('❌ Erro email upsell:', err));
      }

      res.status(200).json({
        success: true,
        message: 'User created successfully',
        userId: newUser.id,
        accessLevel: accessLevelLegacy
      });

    } catch (error) {
      console.error('❌ Erro ao processar webhook da Kiwify:', error);
      sendNotificationWithFallback('Erro no webhook', `Erro: ${error.message}`).catch(() => { });
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }
);

/**
 * Endpoint alternativo (Redireciona para a mesma lógica)
 */
router.post('/', (req, res) => {
  // Reutiliza a lógica do endpoint /kiwify
  // Redirecionamento interno ou chamada de função seria ideal, mas aqui vou apenas repassar para o handler principal
  // Para simplificar e evitar duplicação de código, vamos assumir que o Kiwify sempre usa ou um ou outro.
  // Mas como o router.post não permite reuso direto fácil sem extrair função, 
  // vou redirecionar a chamada 307 para /kiwify se possível ou duplicar a lógica se necessário.
  // Pela estrutura atual, o ideal é extrair o handler. 
  // Mas para manter simples neste refactor, vou deixar o /kiwify como principal e o / retornar erro ou instruir uso do /kiwify
  // OU melhor: vamos fazer o router.post('/', ... ) chamar a mesma função handler se eu a tivesse extraído.

  // Como estou substituindo o arquivo todo, vou simplificar:
  // O endpoint raiz '/' será um espelho exato do '/kiwify'
  // Mas para evitar erro de definição duplicada, vou apenas registrá-lo.
  res.redirect(307, req.baseUrl + '/kiwify');
});

module.exports = router;
