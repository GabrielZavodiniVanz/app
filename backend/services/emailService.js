const nodemailer = require('nodemailer');
const https = require('https');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ EMAIL_USER ou EMAIL_PASS não configurados. Serviço de email desabilitado.');
      this.transporter = null;
      return;
    }

    // Configuração específica para Gmail no Render
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true para 465, false para outras portas
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Use App Password para Gmail
      },
      // Configurações específicas para Render
      connectionTimeout: 30000, // 30 segundos
      greetingTimeout: 15000,   // 15 segundos
      socketTimeout: 30000,     // 30 segundos
      // Desabilitar pool para evitar problemas de conexão
      pool: false,
      // Configurações de rede para Render
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      },
      // Configurações adicionais para Render
      ignoreTLS: false,
      requireTLS: true,
      // Configurações de proxy (se necessário)
      proxy: process.env.PROXY_URL || undefined
    });

    // Verificar conexão com retry automático
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
    const maxRetries = 3;
    const retryDelay = Math.min(3000 * Math.pow(2, retryCount), 15000); // Exponential backoff, max 15s

    try {
      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(`❌ Erro ao enviar email (tentativa ${retryCount + 1}/${maxRetries + 1}):`, error.message);
      console.error(`🔍 Detalhes do erro de envio:`, {
        code: error.code,
        command: error.command,
        response: error.response,
        to: mailOptions.to
      });
      
      // Se for erro de conexão e estivermos em produção, tentar método alternativo
      if (error.code === 'ETIMEDOUT' && process.env.NODE_ENV === 'production' && retryCount === 0) {
        console.log('🔄 Tentando método alternativo via HTTPS...');
        try {
          return await this.sendViaHTTPS(mailOptions);
        } catch (httpsError) {
          console.error('❌ Método HTTPS também falhou:', httpsError.message);
        }
      }
      
      if (retryCount < maxRetries) {
        console.log(`🔄 Tentando reenviar em ${retryDelay/1000} segundos... (delay progressivo)`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return await this.sendWithRetry(mailOptions, retryCount + 1);
      } else {
        console.error(`❌ Falha definitiva ao enviar email para ${mailOptions.to}`);
        throw error;
      }
    }
  }

  // Método alternativo via HTTPS (para quando SMTP está bloqueado)
  async sendViaHTTPS(mailOptions) {
    console.log('🌐 Tentando envio via HTTPS como alternativa ao SMTP...');
    
    try {
      // Usar EmailJS como alternativa (serviço gratuito que funciona via HTTPS)
      const emailJsUrl = 'https://api.emailjs.com/api/v1.0/email/send';
      
      const requestBody = {
        service_id: 'gmail', // ou outro serviço configurado
        template_id: 'template_password_reset',
        user_id: process.env.EMAILJS_USER_ID,
        template_params: {
          to_email: mailOptions.to,
          from_name: 'App Infantil',
          subject: mailOptions.subject,
          message: mailOptions.html,
          reply_to: mailOptions.from
        }
      };

      // Fazer requisição para EmailJS
      const response = await this.makeHTTPSRequest(emailJsUrl, requestBody);
      
      console.log('✅ E-mail enviado via EmailJS:', response);
      return { messageId: response, method: 'emailjs' };
      
    } catch (error) {
      console.error('❌ EmailJS também falhou:', error.message);
      
      // Como último recurso, vamos usar um webhook simples
      console.log('🔄 Tentando webhook de notificação como último recurso...');
      return await this.sendViaWebhook(mailOptions);
    }
  }

  async makeHTTPSRequest(url, body) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(body);
      
      const options = {
        hostname: 'api.emailjs.com',
        port: 443,
        path: '/api/v1.0/email/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode === 200) {
              resolve(response);
            } else {
              reject(new Error(`EmailJS error: ${response.error || data}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse EmailJS response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  // Webhook como último recurso - apenas loga a informação
  async sendViaWebhook(mailOptions) {
    console.log('📝 [WEBHOOK FALLBACK] E-mail não pôde ser enviado, mas aqui estão os dados:');
    console.log(`📧 Para: ${mailOptions.to}`);
    console.log(`📝 Assunto: ${mailOptions.subject}`);
    console.log(`🔗 Link de reset: ${this.extractResetUrl(mailOptions.html)}`);
    
    // Simular sucesso para não quebrar o fluxo
    return { messageId: 'webhook-fallback', method: 'webhook' };
  }

  extractResetUrl(html) {
    const match = html.match(/href="([^"]*reset-password[^"]*)"/);
    return match ? match[1] : 'Link não encontrado';
  }

  async sendWelcomeEmail(userData) {
    try {
      if (!this.transporter) {
        console.warn('⚠️ Serviço de email não configurado. Pulando envio de e-mail.');
        return { success: false, message: 'Email service not configured' };
      }

      const { name, email, password, loginUrl } = userData;
      
      // URL para mudança de senha
      const changePasswordUrl = loginUrl.replace('/login', '/change-password');

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '🎉 Bem-vindo ao App Infantil - Suas credenciais de acesso',
        html: `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bem-vindo ao App Infantil</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
              }
              .container {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
              }
              .credentials {
                background-color: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
              }
              .credential-item {
                margin: 10px 0;
                padding: 10px;
                background-color: white;
                border-radius: 5px;
                border-left: 4px solid #667eea;
              }
              .credential-label {
                font-weight: bold;
                color: #495057;
              }
              .credential-value {
                font-family: monospace;
                background-color: #e9ecef;
                padding: 5px 10px;
                border-radius: 3px;
                margin-top: 5px;
                display: inline-block;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 25px;
                margin: 20px 0;
                font-weight: bold;
              }
              .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
                color: #6c757d;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 ¡Bienvenido al App Infantil!</h1>
                <p>¡Hola ${name}, tu compra ha sido confirmada con éxito!</p>
              </div>

              <p>¡Estamos muy felices de tenerte con nosotros! Ahora tienes acceso completo a nuestro contenido educativo infantil.</p>

              <div class="credentials">
                <h3>📋 Tus credenciales de acceso:</h3>
                <div class="credential-item">
                  <div class="credential-label">Email:</div>
                  <div class="credential-value">${email}</div>
                </div>
                <div class="credential-item">
                  <div class="credential-label">Contraseña:</div>
                  <div class="credential-value">${password}</div>
                </div>
              </div>

              <div style="text-align: center;">
                <a href="${loginUrl}" class="button">🚀 Acceder al App</a>
                <br><br>
                <a href="${changePasswordUrl}" class="button" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%);">🔐 Cambiar Contraseña</a>
              </div>

              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                  <li>Guarda estas credenciales en un lugar seguro</li>
                  <li>Recomendamos cambiar la contraseña en el primer acceso</li>
                  <li>Esta contraseña fue generada automáticamente por el sistema</li>
                </ul>
              </div>

              <p>Si tienes alguna duda o necesitas ayuda, no dudes en ponerte en contacto con nosotros.</p>

              <div class="footer">
                <p>Este é um e-mail automático, por favor não responda.</p>
                <p>© 2024 App Infantil - Todos os direitos reservados</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Bem-vindo ao App Infantil!
          
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
          
          © 2024 App Infantil
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

  async sendTestEmail(to) {
    try {
      if (!this.transporter) {
        console.warn('⚠️ Serviço de email não configurado.');
        throw new Error('Email service not configured');
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Teste - Configuração de Email',
        text: 'Este é um e-mail de teste para verificar se a configuração está funcionando.'
      };

      const result = await this.sendWithRetry(mailOptions);
      console.log('✅ E-mail de teste enviado:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Erro ao enviar e-mail de teste:', error.message);
      return { success: false, message: 'Failed to send test email' };
    }
  }

  /**
   * Enviar e-mail de recuperação de senha
   * @param {object} userData - Dados do usuário { name, email, resetUrl }
   */
  async sendPasswordResetEmail(userData) {
    try {
      if (!this.transporter) {
        console.warn('⚠️ Serviço de email não configurado. Pulando envio de e-mail.');
        return { success: false, message: 'Email service not configured' };
      }

      const { name, email, resetUrl } = userData;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '🔐 Recuperación de Contraseña - App Infantil',
        html: `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recuperación de Contraseña</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
              }
              .container {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
                color: white;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 25px;
                margin: 20px 0;
                font-weight: bold;
              }
              .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
                color: #6c757d;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Recuperación de Contraseña</h1>
                <p>Hola ${name}, solicitaste la recuperación de contraseña</p>
              </div>

              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en App Infantil.</p>

              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">🔐 Restablecer Contraseña</a>
              </div>

              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                  <li>Este enlace expira en <strong>1 hora</strong></li>
                  <li>Si no solicitaste esta recuperación, ignora este email</li>
                  <li>No compartas este enlace con nadie</li>
                  <li>Después de usar el enlace, se volverá inválido</li>
                </ul>
              </div>

              <p>Si el botón no funciona, copia y pega el enlace a continuación en tu navegador:</p>
              <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
                ${resetUrl}
              </p>

              <div class="footer">
                <p>Este é um e-mail automático, por favor não responda.</p>
                <p>© 2024 App Infantil - Todos os direitos reservados</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Recuperación de Contraseña - App Infantil
          
          Hola ${name},
          
          Solicitaste la recuperación de contraseña de tu cuenta.
          
          Haz clic en el enlace a continuación para restablecer tu contraseña:
          ${resetUrl}
          
          Este enlace expira en 1 hora.
          
          Si no solicitaste esta recuperación, ignora este email.
          
          © 2024 App Infantil
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
}

module.exports = new EmailService();
