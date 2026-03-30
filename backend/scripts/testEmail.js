/**
 * Script para testar envio de emails sem precisar fazer uma compra.
 * 
 * Uso: node scripts/testEmail.js <email_destino> [tipo]
 * 
 * Tipos disponíveis:
 *   welcome  - Email de boas-vindas (padrão)
 *   upsell   - Email de confirmação de upsell
 *   reset    - Email de recuperação de senha
 * 
 * Exemplos:
 *   node scripts/testEmail.js meuemail@gmail.com
 *   node scripts/testEmail.js meuemail@gmail.com upsell
 *   node scripts/testEmail.js meuemail@gmail.com reset
 */

require('dotenv').config();

// Forçar modo produção para usar Resend
process.env.NODE_ENV = 'production';

const emailService = require('../services/emailService');

const email = process.argv[2];
const tipo = process.argv[3] || 'welcome';

if (!email) {
  console.log('❌ Uso: node scripts/testEmail.js <email_destino> [welcome|upsell|reset]');
  process.exit(1);
}

async function testEmail() {
  console.log(`\n📧 Enviando email de teste (${tipo}) para: ${email}\n`);

  try {
    let result;

    switch (tipo) {
      case 'welcome':
        result = await emailService.sendWelcomeEmail({
          name: 'Usuário Teste',
          email: email,
          password: 'SenhaTest123!',
          loginUrl: process.env.FRONTEND_URL || 'https://www.ninosdeluz.site/login'
        });
        break;

      case 'upsell':
        result = await emailService.sendUpsellConfirmationEmail({
          name: 'Usuário Teste',
          email: email,
          loginUrl: process.env.FRONTEND_URL || 'https://www.ninosdeluz.site/login',
          productName: 'Kit Esencial - Rutinas sin Gritos'
        });
        break;

      case 'reset':
        result = await emailService.sendPasswordResetEmail({
          name: 'Usuário Teste',
          email: email,
          resetUrl: (process.env.FRONTEND_URL || 'https://www.ninosdeluz.site') + '/reset-password?token=TOKEN_DE_TESTE'
        });
        break;

      default:
        console.log('❌ Tipo inválido. Use: welcome, upsell ou reset');
        process.exit(1);
    }

    console.log('✅ Resultado:', result);
    console.log('\n🎉 Email enviado com sucesso! Verifique a caixa de entrada (e spam).\n');
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message);
  }

  process.exit(0);
}

testEmail();
