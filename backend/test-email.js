require('dotenv').config();
const emailService = require('./services/emailService');

/**
 * Script de teste para envio de emails
 * Testa o template atualizado com texto preto no banner
 */

async function testWelcomeEmail() {
  console.log('🧪 ===== TESTE DE ENVIO DE EMAIL =====\n');

  // Dados de teste - substitua pelo seu email para receber o teste
  const testData = {
    name: 'Gabriel Teste',
    email: 'gabriel@teste.com', // ⚠️ ALTERE AQUI para seu email real
    password: 'SenhaTeste123!',
    loginUrl: 'https://www.ninosdeluz.site/login'
  };

  console.log('📋 Dados do teste:');
  console.log(`   Nome: ${testData.name}`);
  console.log(`   Email: ${testData.email}`);
  console.log(`   Senha: ${testData.password}`);
  console.log(`   URL Login: ${testData.loginUrl}\n`);

  // Verificar configuração
  console.log('🔧 Configuração atual:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'não definido'}`);
  console.log(`   EMAIL_USER: ${process.env.EMAIL_USER ? 'configurado' : 'não configurado'}`);
  console.log(`   RESEND_API_KEY: ${process.env.RESEND_API_KEY ? 'configurado' : 'não configurado'}`);
  console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'não definido'}\n`);

  try {
    console.log('📤 Enviando email de boas-vindas...');
    const result = await emailService.sendWelcomeEmail(testData);
    
    if (result.success) {
      console.log('✅ Email enviado com sucesso!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log('\n📬 Verifique sua caixa de entrada para ver:');
      console.log('   - Banner com texto preto sobre fundo violeta');
      console.log('   - Template em espanhol atualizado');
      console.log('   - Botões funcionais para acessar o app');
      console.log('   - Versículo bíblico (Proverbios 3:5)');
      console.log('   - Informações de credenciais');
    } else {
      console.log('❌ Falha no envio do email');
      console.log(`   Erro: ${result.message}`);
    }
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('   Stack:', error.stack);
  }
}

async function testPasswordResetEmail() {
  console.log('\n🧪 ===== TESTE EMAIL DE RECUPERAÇÃO =====\n');

  const testData = {
    name: 'Gabriel Teste',
    email: 'gabriel@teste.com', // ⚠️ ALTERE AQUI para seu email real
    resetUrl: 'https://www.ninosdeluz.site/reset-password?token=teste123456'
  };

  console.log('📋 Dados do teste de recuperação:');
  console.log(`   Nome: ${testData.name}`);
  console.log(`   Email: ${testData.email}`);
  console.log(`   Reset URL: ${testData.resetUrl}\n`);

  try {
    console.log('📤 Enviando email de recuperação...');
    const result = await emailService.sendPasswordResetEmail(testData);
    
    if (result.success) {
      console.log('✅ Email de recuperação enviado com sucesso!');
      console.log(`   Message ID: ${result.messageId}`);
    } else {
      console.log('❌ Falha no envio do email de recuperação');
      console.log(`   Erro: ${result.message}`);
    }
  } catch (error) {
    console.error('❌ Erro durante o teste de recuperação:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando testes de envio de email...\n');
  
  // Teste do email de boas-vindas
  await testWelcomeEmail();
  
  // Aguardar um pouco antes do próximo teste
  console.log('\n⏳ Aguardando 3 segundos antes do próximo teste...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Teste do email de recuperação
  await testPasswordResetEmail();
  
  console.log('\n🏁 Todos os testes concluídos!');
  console.log('\n💡 Dica: Para testar com seu email real, altere o campo "email" nos dados de teste acima.');
}

// Executar os testes
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testWelcomeEmail, testPasswordResetEmail, runAllTests };
