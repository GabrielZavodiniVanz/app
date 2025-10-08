const nodemailer = require('nodemailer');

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

    // Configuração para Gmail (você pode mudar para outros provedores)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Use App Password para Gmail
      }
    });

    // Verificar conexão
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Erro na configuração do email:', error);
      } else {
        console.log('✅ Servidor de email configurado com sucesso');
      }
    });
  }

  async sendWelcomeEmail(userData) {
    try {
      if (!this.transporter) {
        console.warn('⚠️ Serviço de email não configurado. Pulando envio de e-mail.');
        return { success: false, message: 'Email service not configured' };
      }

      const { name, email, password, loginUrl } = userData;

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
                <h1>🎉 Bem-vindo ao App Infantil!</h1>
                <p>Olá ${name}, sua compra foi confirmada com sucesso!</p>
              </div>

              <p>Ficamos muito felizes em tê-lo(a) conosco! Agora você tem acesso completo ao nosso conteúdo educativo infantil.</p>

              <div class="credentials">
                <h3>📋 Suas credenciais de acesso:</h3>
                <div class="credential-item">
                  <div class="credential-label">Email:</div>
                  <div class="credential-value">${email}</div>
                </div>
                <div class="credential-item">
                  <div class="credential-label">Senha:</div>
                  <div class="credential-value">${password}</div>
                </div>
              </div>

              <div style="text-align: center;">
                <a href="${loginUrl}" class="button">🚀 Acessar o App</a>
              </div>

              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                  <li>Guarde estas credenciais em local seguro</li>
                  <li>Recomendamos alterar a senha no primeiro acesso</li>
                  <li>Esta senha foi gerada automaticamente pelo sistema</li>
                </ul>
              </div>

              <p>Se você tiver alguma dúvida ou precisar de ajuda, não hesite em entrar em contato conosco.</p>

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

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ E-mail enviado com sucesso:', result.messageId);
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      console.error('❌ Erro ao enviar e-mail:', error);
      throw new Error('Falha ao enviar e-mail de boas-vindas');
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

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ E-mail de teste enviado:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Erro ao enviar e-mail de teste:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
