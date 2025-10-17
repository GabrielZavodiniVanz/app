const nodemailer = require('nodemailer');
const https = require('https');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Em produção, usar apenas Resend - não precisa de SMTP
    if (process.env.NODE_ENV === 'production') {
      console.log('✅ Modo de produção: Usando apenas Resend (HTTPS). SMTP desabilitado.');
      this.transporter = null;
      
      // Verificar se a chave do Resend está configurada
      if (!process.env.RESEND_API_KEY) {
        console.warn('⚠️ RESEND_API_KEY não configurada em produção. E-mails não serão enviados.');
      } else {
        console.log('✅ RESEND_API_KEY configurada. E-mails serão enviados via Resend.');
      }
      return;
    }

    // Verificar se as variáveis de ambiente estão configuradas (apenas para desenvolvimento)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️  Credenciais de e-mail não configuradas. Serviço de email desabilitado.');
      this.transporter = null;
      return;
    }

    console.log('✅ Modo de desenvolvimento: Usando SMTP do Gmail para testes locais.');

    // Configuração do Gmail (apenas para desenvolvimento)
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Usar SSL/TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Sua "Senha de app"
      },
      connectionTimeout: 20000, // 20 segundos
      socketTimeout: 20000,
      pool: false // Desabilitar pool para testes mais diretos
    });

    // Verificar conexão com retry automático (apenas em desenvolvimento)
    this.verifyConnection();
  }

  async verifyConnection(retryCount = 0) {
    const maxRetries = 5;
    const retryDelay = Math.min(5000 * Math.pow(2, retryCount), 30000); // Exponential backoff, max 30s

    try {
      await this.transporter.verify();
      console.log('✅ Serviço de email configurado com sucesso');
    } catch (error) {
      console.error(`❌ Erro na configuração do email (tentativa ${retryCount + 1}/${maxRetries + 1}):`, error.message);
      console.error(`🔍 Detalhes do erro:`, {
        code: error.code,
        command: error.command,
        response: error.response
      });
      
      if (retryCount < maxRetries) {
        console.log(`🔄 Tentando novamente em ${retryDelay/1000} segundos... (delay progressivo)`);
        setTimeout(() => {
          this.verifyConnection(retryCount + 1);
        }, retryDelay);
      } else {
        console.error('❌ Falha ao configurar email após todas as tentativas. E-mails serão ignorados.');
        console.log('💡 Sugestões: Verifique se o Render permite conexões SMTP ou configure um proxy.');
      }
    }
  }

  async sendWithRetry(mailOptions, retryCount = 0) {
    // Em produção, pula o SMTP e vai direto para o Resend
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Produção: Pulando SMTP e enviando diretamente via Resend...');
      try {
        // Verifica se a chave do Resend existe antes de tentar
        if (!process.env.RESEND_API_KEY) {
          console.error('❌ ERRO CRÍTICO: RESEND_API_KEY não está configurada em produção!');
          throw new Error('A variável de ambiente RESEND_API_KEY não está configurada.');
        }
        return await this.sendViaResend(mailOptions);
      } catch (resendError) {
        console.error(`❌ Falha no envio via Resend: ${resendError.message}`);
        await this.sendViaWebhook(mailOptions); // Log final como backup
        throw resendError;
      }
    }

    // Lógica de retry do SMTP apenas para ambiente de desenvolvimento
    const maxRetries = 3;
    const retryDelay = 1000 * Math.pow(2, retryCount); // 1s, 2s, 4s

    try {
      console.log(`📨 (Dev) Tentando enviar via SMTP... (tentativa ${retryCount + 1})`);
      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(`❌ (Dev) Erro ao enviar email via SMTP:`, error.message);
      
      if (retryCount < maxRetries) {
        console.log(`🔄 (Dev) Tentando reenviar SMTP em ${retryDelay/1000} segundos...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return await this.sendWithRetry(mailOptions, retryCount + 1);
      } else {
        console.error(`❌ (Dev) Falha definitiva ao enviar email para ${mailOptions.to} via SMTP.`);
        await this.sendViaWebhook(mailOptions); // Log de backup
        throw error;
      }
    }
  }

  // Método de envio principal via Resend (para produção)
  async sendViaResend(mailOptions) {
    console.log('🌐 Tentando envio via Resend...');

    if (!process.env.RESEND_API_KEY) {
      console.error('❌ ERRO CRÍTICO: RESEND_API_KEY não está configurada em produção!');
      throw new Error('A variável de ambiente RESEND_API_KEY não está configurada.');
    }

    // Usando apenas o módulo HTTPS nativo do Node.js (sem dependências externas)

    const requestBody = {
      from: 'Niños de Luz <contacto@ninosdeluz.site>', // Email com nome personalizado
      to: [mailOptions.to],
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text || '¡Hola! Tu acceso a Niños de Luz está listo. Visita nuestro sitio web para más información.',
      reply_to: 'contactoninosdeluz@gmail.com', // Seu email pessoal para respostas
      headers: {
        'X-Mailer': 'Niños de Luz Web App',
        'X-Priority': '3',
        'Importance': 'normal',
        'List-Unsubscribe': '<https://ninosdeluz.site/unsubscribe?email=' + mailOptions.to + '>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Entity-Ref-ID': 'ninosdeluz-' + Date.now(),
        'Return-Path': 'contato@ninosdeluz.site',
        'Message-ID': '<' + Date.now() + '.' + Math.random().toString(36).substr(2, 9) + '@ninosdeluz.site>'
      }
    };

    const postData = JSON.stringify(requestBody);

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

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log('✅ E-mail enviado com sucesso via Resend:', response.id);
              resolve({ messageId: response.id, method: 'resend' });
      } else {
              console.error('❌ Erro da API Resend:', response);
              reject(new Error(`Erro do Resend: ${response.message || 'Erro desconhecido'}`));
            }
          } catch (e) {
            reject(new Error(`Falha ao processar resposta do Resend: ${e.message}`));
          }
        });
      });

      req.on('error', (e) => {
        console.error('❌ Erro na requisição para o Resend:', e);
        reject(new Error(`Erro de rede ao contatar o Resend: ${e.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  // Webhook como último recurso - apenas loga a informação
  async sendViaWebhook(mailOptions) {
    console.log('📝 [BACKUP] SMTP falhou. O link de recuperação está abaixo:');
    console.log(`🔗 Link de reset para ${mailOptions.to}: ${this.extractResetUrl(mailOptions.html)}`);
    return { messageId: 'webhook-fallback', method: 'webhook' };
  }

  extractResetUrl(html) {
    const match = html.match(/href="([^"]*reset-password[^"]*)"/);
    return match ? match[1] : 'Link não encontrado';
  }

  async sendWelcomeEmail(userData) {
    try {
      // Em produção, não verificar transporter - usar Resend diretamente
      if (process.env.NODE_ENV === 'production') {
        console.log('🔄 Produção: Enviando e-mail de boas-vindas via Resend...');
      } else if (!this.transporter) {
        console.warn('⚠️ Serviço de email não configurado. Pulando envio de e-mail.');
        return { success: false, message: 'Email service not configured' };
      }

      const { name, email, password, loginUrl } = userData;
      
      // URL para mudança de senha
      const changePasswordUrl = loginUrl.replace('/login', '/change-password');

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Hola ${name}, aquí tienes tus datos de acceso`,
        html: `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="x-apple-disable-message-reformatting">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bienvenida • Niños de Luz</title>
<!--[if mso]>
<style>
* {font-family: Arial, sans-serif !important;}
</style>
<![endif]-->
<link href="https://fonts.googleapis.com/css2?family=Mochiy+Pop+One&family=Poppins:wght@400;600&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#FAF6EB;
    --pink:#FF0988;
    --gold:#F0983C;
    --vio1:#7A64F2;
    --vio2:#9A89F7;
    --mint:#52D1A5;
    --ink:#2B2B2B;
    --muted:#6B6B6B;
    --card:#FFFFFF;
  }
  html,body{margin:0;padding:0;background:var(--bg);}
  .wrapper{width:100%;background:var(--bg);padding:0;}
  .container{max-width:640px;margin:0 auto;background:var(--card);}
  .p-24{padding:24px;}
  .p-32{padding:32px;}
  .hero{
    background:linear-gradient(135deg,var(--vio1),var(--vio2));
    color:#000;text-align:center;border-radius:14px;
    font-family:'Mochiy Pop One', Arial, sans-serif;
  }
  h1{margin:0;font-size:28px;line-height:1.25;}
  h2{font-family:'Mochiy Pop One', Arial, sans-serif;margin:0 0 8px 0;color:var(--ink);font-size:20px;}
  p{margin:0 0 12px 0;color:var(--ink);font-family:'Poppins', Arial, sans-serif;font-size:16px;line-height:1.6;}
  .muted{color:var(--muted);}
  .card{border:1px solid #EFE7D8;border-radius:12px;background:#FFFCF3;}
  .btn{
    display:inline-block;padding:14px 22px;border-radius:999px;
    font-family:'Mochiy Pop One', Arial, sans-serif;font-size:16px;text-decoration:none;
  }
  .btn-primary{background:#EFE7D8;color:#000;}
  .btn-secondary{background:#EFE7D8;color:#000;}
  .chip{display:inline-block;background:#FFEED8;color:#A05A00;border-radius:999px;padding:6px 10px;font-family:'Poppins',Arial,sans-serif;font-size:13px;margin-top:6px;}
  .verse{font-family:'Mochiy Pop One', Arial, sans-serif;color:var(--pink);text-align:center;}
  .footer{color:#5B6770;font-size:12px;text-align:center;}
  @media (max-width:480px){
    .p-32{padding:20px;}
    h1{font-size:24px;}
  }
</style>
</head>
<body>
  <table class="wrapper" role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <table class="container" role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <!-- HERO -->
          <tr>
            <td class="p-24">
              <div class="hero p-24">
                <h1>🎉 ¡Bienvenido(a) al Mundo Mágico de <br>Niños de Luz!</h1>
                <p style="margin-top:8px;font-family:'Poppins',Arial,sans-serif;">Hola ${name}, tu compra fue confirmada con éxito ✨</p>
              </div>
            </td>
          </tr>

          <!-- INTRO -->
          <tr>
            <td class="p-32">
              <p>Ahora tienes acceso inmediato a nuestro <strong>Web App exclusivo</strong>, con actividades imprimibles, cuentos con valores y materiales llenos de fe y amor. Cada día será una nueva oportunidad para aprender, sonreír y crecer junto a tus hijos 🌿</p>
            </td>
          </tr>

          <!-- CREDENTIALS -->
          <tr>
            <td class="p-32">
              <div class="card p-24">
                <h2>🔐 Tus credenciales de acceso</h2>
                <p>📧 <strong>Correo electrónico:</strong> ${email}</p>
                <p>🔑 <strong>Contraseña:</strong> ${password}</p>
                <p class="muted">📎 Guarda estas credenciales en un lugar seguro.</p>
                <p class="muted">🛠️ Te recomendamos cambiar tu contraseña en tu primer acceso.</p>
                <p class="muted" style="margin-bottom:0;">⚙️ Esta contraseña fue generada automáticamente por el sistema.</p>
              </div>
            </td>
          </tr>

          <!-- CTA BUTTONS -->
          <tr>
            <td align="center" class="p-24">
              <a class="btn btn-primary" href="${loginUrl}" target="_blank" rel="noopener">🎨 Entrar al Web App</a>
            </td>
          </tr>
          <tr>
            <td align="center" class="p-24" style="padding-top:0;">
              <a class="btn btn-secondary" href="${changePasswordUrl}" target="_blank" rel="noopener">🔒 Cambiar Contraseña</a>
            </td>
          </tr>
          <tr>
            <td align="center" class="p-24" style="padding-top:0;">
              <div class="chip">Acceso inmediato • Multi-dispositivo</div>
            </td>
          </tr>

          <!-- VERSE -->
          <tr>
            <td class="p-32">
              <div class="verse">
                <p style="margin:0;">"Confía en el Señor con todo tu corazón</p>
                <p style="margin:0;">y no te apoyes en tu propia prudencia."</p>
                <p style="margin-top:6px;">— Proverbios 3:5 🙏</p>
              </div>
            </td>
          </tr>

          <!-- SUPPORT -->
          <tr>
            <td class="p-32">
              <h2>📬 ¿Necesitas ayuda?</h2>
              <p>Escríbenos a <strong>contactoninosdeluz@gmail.com</strong>. Estamos felices de acompañarte en esta hermosa aventura de fe y aprendizaje familiar </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td class="p-24">
              <p class="footer">Este es un correo automático. Si tienes alguna pregunta, responde a este email.</p>
              <p class="footer">© 2025 Niños de Luz — Creando un mundo mágico de aprendizaje y diversión para los más pequeños.</p>
              <p class="footer" style="margin-top: 12px;">
                <a href="https://ninosdeluz.site/unsubscribe?email=${email}" style="color: #5B6770; text-decoration: underline;">Desuscribirse</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        text: `
          Bem-vindo ao Niños de Luz!
          
          Olá ${name}, sua compra foi confirmada com sucesso!
          
          Suas credenciais de acesso:
          Email: ${email}
          Senha: ${password}
          
          Acesse: ${loginUrl}
          
          Importante:
          - Guarde estas credenciais em local seguro
          - Recomendamos alterar a senha no primeiro acesso
          - Esta senha foi gerada automaticamente pelo sistema
          
          Se você tiver alguma dúvida, entre em contato conosco.
          
          © 2024 Niños de Luz
        `
      };

      const result = await this.sendWithRetry(mailOptions);
      console.log('✅ E-mail de boas-vindas enviado:', result.messageId);
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      console.error('❌ Erro ao enviar e-mail de boas-vindas:', error.message);
      // Não falhar o processo principal por erro de email
      return { success: false, message: 'Failed to send welcome email' };
    }
  }


  /**
   * Enviar e-mail de recuperação de senha
   * @param {object} userData - Dados do usuário { name, email, resetUrl }
   */
  async sendPasswordResetEmail(userData) {
    try {
      // Em produção, não verificar transporter - usar Resend diretamente
      if (process.env.NODE_ENV === 'production') {
        console.log('🔄 Produção: Enviando e-mail de recuperação via Resend...');
      } else if (!this.transporter) {
        console.warn('⚠️ Serviço de email não configurado. Pulando envio de e-mail.');
        return { success: false, message: 'Email service not configured' };
      }

      const { name, email, resetUrl } = userData;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Recuperación de Contraseña - Niños de Luz',
        html: `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="x-apple-disable-message-reformatting">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Recuperación de Contraseña • Niños de Luz</title>
<!--[if mso]>
<style>
* {font-family: Arial, sans-serif !important;}
</style>
<![endif]-->
<link href="https://fonts.googleapis.com/css2?family=Mochiy+Pop+One&family=Poppins:wght@400;600&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#FAF6EB;
    --pink:#FF0988;
    --gold:#F0983C;
    --vio1:#7A64F2;
    --vio2:#9A89F7;
    --mint:#52D1A5;
    --ink:#2B2B2B;
    --muted:#6B6B6B;
    --card:#FFFFFF;
  }
  html,body{margin:0;padding:0;background:var(--bg);}
  .wrapper{width:100%;background:var(--bg);padding:0;}
  .container{max-width:640px;margin:0 auto;background:var(--card);}
  .p-24{padding:24px;}
  .p-32{padding:32px;}
  .hero{
    background:linear-gradient(135deg,var(--vio1),var(--vio2));
    color:#000;text-align:center;border-radius:14px;
    font-family:'Mochiy Pop One', Arial, sans-serif;
  }
  h1{margin:0;font-size:28px;line-height:1.25;}
  h2{font-family:'Mochiy Pop One', Arial, sans-serif;margin:0 0 8px 0;color:var(--ink);font-size:20px;}
  p{margin:0 0 12px 0;color:var(--ink);font-family:'Poppins', Arial, sans-serif;font-size:16px;line-height:1.6;}
  .muted{color:var(--muted);}
  .card{border:1px solid #EFE7D8;border-radius:12px;background:#FFFCF3;}
  .btn{
    display:inline-block;padding:14px 22px;border-radius:999px;
    font-family:'Mochiy Pop One', Arial, sans-serif;font-size:16px;text-decoration:none;
  }
  .btn-primary{background:#EFE7D8;color:#000;}
  .chip{display:inline-block;background:#FFEED8;color:#A05A00;border-radius:999px;padding:6px 10px;font-family:'Poppins',Arial,sans-serif;font-size:13px;margin-top:6px;}
  .verse{font-family:'Mochiy Pop One', Arial, sans-serif;color:var(--pink);text-align:center;}
  .footer{color:#5B6770;font-size:12px;text-align:center;}
  @media (max-width:480px){
    .p-32{padding:20px;}
    h1{font-size:24px;}
  }
</style>
</head>
<body>
  <table class="wrapper" role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <table class="container" role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <!-- HERO -->
          <tr>
            <td class="p-24">
              <div class="hero p-24">
                <h1>🔐 Recuperación de Contraseña</h1>
                <p style="margin-top:8px;font-family:'Poppins',Arial,sans-serif;">Hola ${name}, solicitaste la recuperación de contraseña</p>
              </div>
            </td>
          </tr>

          <!-- INTRO -->
          <tr>
            <td class="p-32">
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Niños de Luz</strong>. Haz clic en el botón de abajo para crear una nueva contraseña segura 🔒</p>
            </td>
          </tr>

          <!-- CTA BUTTON -->
          <tr>
            <td align="center" class="p-24">
              <a class="btn btn-primary" href="${resetUrl}" target="_blank" rel="noopener">🔐 Restablecer Contraseña</a>
            </td>
          </tr>
          <tr>
            <td align="center" class="p-24" style="padding-top:0;">
              <div class="chip">Enlace seguro • Expira en 1 hora</div>
            </td>
          </tr>

          <!-- WARNING -->
          <tr>
            <td class="p-32">
              <div class="card p-24">
                <h2>⚠️ Información importante</h2>
                <p>🔒 Este enlace expira en <strong>1 hora</strong> por seguridad</p>
                <p>🚫 Si no solicitaste esta recuperación, ignora este email</p>
                <p>🔐 No compartas este enlace con nadie</p>
                <p>⏰ Después de usar el enlace, se volverá inválido automáticamente</p>
              </div>
            </td>
          </tr>

          <!-- LINK BACKUP -->
          <tr>
            <td class="p-32">
              <p class="muted">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; color: var(--muted);">
                ${resetUrl}
              </p>
            </td>
          </tr>

          <!-- VERSE -->
          <tr>
            <td class="p-32">
              <div class="verse">
                <p style="margin:0;">"Confía en el Señor con todo tu corazón</p>
                <p style="margin:0;">y no te apoyes en tu propia prudencia."</p>
                <p style="margin-top:6px;">— Proverbios 3:5 🙏</p>
              </div>
            </td>
          </tr>

          <!-- SUPPORT -->
          <tr>
            <td class="p-32">
              <h2>📬 ¿Necesitas ayuda?</h2>
              <p>Escríbenos a <strong>contactoninosdeluz@gmail.com</strong>. Estamos felices de acompañarte en esta hermosa aventura de fe y aprendizaje familiar 🌈</p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td class="p-24">
              <p class="footer">Este es un correo automático. Si tienes alguna pregunta, responde a este email.</p>
              <p class="footer">© 2025 Niños de Luz — Creando un mundo mágico de aprendizaje y diversión para los más pequeños.</p>
              <p class="footer" style="margin-top: 12px;">
                <a href="https://ninosdeluz.site/unsubscribe?email=${email}" style="color: #5B6770; text-decoration: underline;">Desuscribirse</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        text: `
          Recuperación de Contraseña - Niños de Luz
          
          Hola ${name},
          
          Solicitaste la recuperación de contraseña de tu cuenta.
          
          Haz clic en el enlace a continuación para restablecer tu contraseña:
          ${resetUrl}
          
          Este enlace expira en 1 hora.
          
          Si no solicitaste esta recuperación, ignora este email.
          
          © 2024 Niños de Luz
        `
      };

      const result = await this.sendWithRetry(mailOptions);
      console.log('✅ E-mail de recuperação de senha enviado:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Erro ao enviar e-mail de recuperação de senha:', error.message);
      return { success: false, message: 'Failed to send password reset email' };
    }
  }

  /**
   * Enviar e-mail de confirmação de upsell
   * @param {object} userData - Dados do usuário { name, email, loginUrl, productName }
   */
  async sendUpsellConfirmationEmail(userData) {
    try {
      // Em produção, não verificar transporter - usar Resend diretamente
      if (process.env.NODE_ENV === 'production') {
        console.log('🔄 Produção: Enviando e-mail de confirmação de upsell via Resend...');
      } else if (!this.transporter) {
        console.warn('⚠️ Serviço de email não configurado. Pulando envio de e-mail.');
        return { success: false, message: 'Email service not configured' };
      }

      const { name, email, loginUrl, productName } = userData;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Mi Libro para Colorear con Fe - Nuevo Contenido Disponible',
        html: `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="x-apple-disable-message-reformatting">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mi Libro para Colorear con Fe • Niños de Luz</title>
<!--[if mso]>
<style>
* {font-family: Arial, sans-serif !important;}
</style>
<![endif]-->
<link href="https://fonts.googleapis.com/css2?family=Mochiy+Pop+One&family=Poppins:wght@400;600&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#FAF6EB;
    --pink:#FF0988;
    --gold:#F0983C;
    --vio1:#7A64F2;
    --vio2:#9A89F7;
    --mint:#52D1A5;
    --ink:#2B2B2B;
    --muted:#6B6B6B;
    --card:#FFFFFF;
  }
  html,body{margin:0;padding:0;background:var(--bg);}
  .wrapper{width:100%;background:var(--bg);padding:0;}
  .container{max-width:640px;margin:0 auto;background:var(--card);}
  .p-24{padding:24px;}
  .p-32{padding:32px;}
  .hero{
    background:linear-gradient(135deg,var(--mint),var(--vio2));
    color:#000;text-align:center;border-radius:14px;
    font-family:'Mochiy Pop One', Arial, sans-serif;
  }
  h1{margin:0;font-size:28px;line-height:1.25;}
  h2{font-family:'Mochiy Pop One', Arial, sans-serif;margin:0 0 8px 0;color:var(--ink);font-size:20px;}
  p{margin:0 0 12px 0;color:var(--ink);font-family:'Poppins', Arial, sans-serif;font-size:16px;line-height:1.6;}
  .muted{color:var(--muted);}
  .card{border:1px solid #EFE7D8;border-radius:12px;background:#FFFCF3;}
  .btn{
    display:inline-block;padding:14px 22px;border-radius:999px;
    font-family:'Mochiy Pop One', Arial, sans-serif;font-size:16px;text-decoration:none;
  }
  .btn-primary{background:#EFE7D8;color:#000;}
  .chip{display:inline-block;background:#E8F5E8;color:#2D5A2D;border-radius:999px;padding:6px 10px;font-family:'Poppins',Arial,sans-serif;font-size:13px;margin-top:6px;}
  .verse{font-family:'Mochiy Pop One', Arial, sans-serif;color:var(--pink);text-align:center;}
  .footer{color:#5B6770;font-size:12px;text-align:center;}
  @media (max-width:480px){
    .p-32{padding:20px;}
    h1{font-size:24px;}
  }
</style>
</head>
<body>
  <table class="wrapper" role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <table class="container" role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <!-- HERO -->
          <tr>
            <td class="p-24">
              <div class="hero p-24">
                <h1>🎉 ¡Nuevo Contenido Liberado!</h1>
                <p style="margin-top:8px;font-family:'Poppins',Arial,sans-serif;">Hola ${name}, tu compra adicional fue confirmada ✨</p>
              </div>
            </td>
          </tr>

          <!-- INTRO -->
          <tr>
            <td class="p-32">
              <p>¡Excelente decisión! Has adquirido el <strong>Mi Libro para Colorear con Fe</strong> y ahora tienes acceso inmediato a contenido adicional exclusivo en tu <strong>Web App de Niños de Luz</strong> 🌟</p>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td class="p-32">
              <div class="card p-24">
                <h2>🎁 Lo que tienes ahora</h2>
                <p>✨ <strong>Contenido adicional liberado</strong> - Nuevas actividades y materiales</p>
                <p>📚 <strong>Materiales exclusivos</strong> - Solo para quienes compraron el Libro para Colorear</p>
                <p>🎨 <strong>Actividades premium</strong> - Experiencias de aprendizaje únicas</p>
                <p class="muted">🔓 El contenido ya está disponible en tu cuenta</p>
              </div>
            </td>
          </tr>

          <!-- CTA BUTTON -->
          <tr>
            <td align="center" class="p-24">
              <a class="btn btn-primary" href="${loginUrl}" target="_blank" rel="noopener">🎨 Ver Nuevo Contenido</a>
            </td>
          </tr>
          <tr>
            <td align="center" class="p-24" style="padding-top:0;">
              <a class="btn btn-secondary" href="${loginUrl}?refresh=true&upsell=success" target="_blank" rel="noopener">🔄 Actualizar Página Automáticamente</a>
            </td>
          </tr>
          <tr>
            <td align="center" class="p-24" style="padding-top:0;">
              <div class="chip">Acceso inmediato • Contenido premium</div>
            </td>
          </tr>

          <!-- VERSE -->
          <tr>
            <td class="p-32">
              <div class="verse">
                <p style="margin:0;">"Dios nos ha dado todo lo que necesitamos</p>
                <p style="margin:0;">para vivir una vida piadosa."</p>
                <p style="margin-top:6px;">— 2 Pedro 1:3 🙏</p>
              </div>
            </td>
          </tr>

          <!-- SUPPORT -->
          <tr>
            <td class="p-32">
              <h2>📬 ¿Necesitas ayuda?</h2>
              <p>Escríbenos a <strong>contactoninosdeluz@gmail.com</strong>. Estamos felices de acompañarte en esta hermosa aventura de fe y aprendizaje familiar 🌈</p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td class="p-24">
              <p class="footer">Este es un correo automático. Si tienes alguna pregunta, responde a este email.</p>
              <p class="footer">© 2025 Niños de Luz — Creando un mundo mágico de aprendizaje y diversión para los más pequeños.</p>
              <p class="footer" style="margin-top: 12px;">
                <a href="https://ninosdeluz.site/unsubscribe?email=${email}" style="color: #5B6770; text-decoration: underline;">Desuscribirse</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        text: `
          Nuevo Contenido Liberado - Niños de Luz
          
          Hola ${name},
          
          ¡Excelente decisión! Has adquirido el ${productName} y ahora tienes acceso inmediato a contenido adicional exclusivo.
          
          Lo que tienes ahora:
          - Contenido adicional liberado
          - Materiales exclusivos
          - Actividades premium
          
          Accede a tu cuenta: ${loginUrl}
          
          El contenido ya está disponible en tu cuenta.
          
          © 2025 Niños de Luz
        `
      };

      const result = await this.sendWithRetry(mailOptions);
      console.log('✅ E-mail de confirmação de upsell enviado:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Erro ao enviar e-mail de confirmação de upsell:', error.message);
      return { success: false, message: 'Failed to send upsell confirmation email' };
    }
  }
}

module.exports = new EmailService();
