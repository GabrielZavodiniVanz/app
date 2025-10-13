const express = require('express');
const router = express.Router();
const User = require('../models/User');
const emailService = require('../services/emailService');

/**
 * SISTEMA DE NOTIFICAÇÕES VIA EMAIL
 * 
 * Sistema simplificado que usa email como método principal
 * Mais confiável para produção no Render
 */

/**
 * POST /notifications/fallback - Endpoint para notificações via email
 * Sistema principal de notificações
 */
router.post('/fallback', async (req, res) => {
  try {
    const { userId, notification } = req.body;
    
    console.log(`📧 Enviando notificação via email para usuário ${userId}`);
    
    // Buscar dados do usuário
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'accessLevel', 'comprou_produto_3']
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Preparar dados para email
    const loginUrl = process.env.FRONTEND_URL 
      ? `${process.env.FRONTEND_URL}/login`
      : 'https://www.ninosdeluz.site/login';
    
    // Enviar email baseado no tipo de notificação
    let emailSent = false;
    
    switch (notification.type) {
      case 'upsell_completed':
        emailSent = await sendUpsellNotificationEmail(user, loginUrl, notification);
        break;
        
      case 'new_content':
        emailSent = await sendNewContentEmail(user, loginUrl, notification);
        break;
        
      default:
        emailSent = await sendGenericNotificationEmail(user, loginUrl, notification);
    }
    
    if (emailSent) {
      console.log(`✅ Email de notificação enviado para ${user.email}`);
      res.json({
        success: true,
        message: 'Notificação enviada via email',
        method: 'email'
      });
    } else {
      console.log(`❌ Falha ao enviar email para ${user.email}`);
      res.status(500).json({
        success: false,
        message: 'Falha ao enviar notificação via email'
      });
    }
    
  } catch (error) {
    console.error('❌ Erro no sistema de fallback:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * Enviar email de notificação de upsell
 */
async function sendUpsellNotificationEmail(user, loginUrl, notification) {
  try {
    const emailData = {
      name: user.name,
      email: user.email,
      loginUrl: loginUrl,
      productName: notification.productName || 'Mi Libro para Colorear con Fe',
      message: notification.message || '🎉 Novo conteúdo disponível!'
    };
    
    // Usar o template de upsell existente
    const result = await emailService.sendUpsellConfirmationEmail(emailData);
    return !!result.messageId;
    
  } catch (error) {
    console.error('❌ Erro ao enviar email de upsell:', error);
    return false;
  }
}

/**
 * Enviar email de novo conteúdo
 */
async function sendNewContentEmail(user, loginUrl, notification) {
  try {
    // Criar template simples para novo conteúdo
    const subject = '🎉 Novo Conteúdo Disponível - Niños de Luz';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Novo Conteúdo Disponível</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px 0; }
          .button { 
            display: inline-block; 
            background: #007bff; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Novo Conteúdo Disponível!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${user.name}</strong>!</p>
            <p>${notification.message}</p>
            <p>Faça login para acessar o novo conteúdo:</p>
            <a href="${loginUrl}" class="button">🚀 Acessar Conteúdo</a>
            <p><small>Se você não conseguir clicar no botão, copie e cole este link no seu navegador:<br>
            ${loginUrl}</small></p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const result = await emailService.sendEmail({
      to: user.email,
      subject: subject,
      html: htmlContent
    });
    
    return !!result.messageId;
    
  } catch (error) {
    console.error('❌ Erro ao enviar email de novo conteúdo:', error);
    return false;
  }
}

/**
 * Enviar email genérico de notificação
 */
async function sendGenericNotificationEmail(user, loginUrl, notification) {
  try {
    const subject = '📢 Notificação - Niños de Luz';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Notificação</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px 0; }
          .button { 
            display: inline-block; 
            background: #007bff; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 Notificação</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${user.name}</strong>!</p>
            <p>${notification.message}</p>
            <a href="${loginUrl}" class="button">🚀 Acessar Plataforma</a>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const result = await emailService.sendEmail({
      to: user.email,
      subject: subject,
      html: htmlContent
    });
    
    return !!result.messageId;
    
  } catch (error) {
    console.error('❌ Erro ao enviar email genérico:', error);
    return false;
  }
}

/**
 * Função para enviar notificação via email (sistema simplificado)
 * Sempre usa email como método principal
 */
async function sendNotificationWithFallback(userId, notification) {
  console.log(`📤 Enviando notificação via email para usuário ${userId}`);
  
  try {
    return await sendFallbackNotification(userId, notification);
  } catch (error) {
    console.error(`❌ Erro ao enviar notificação via email:`, error);
    return false;
  }
}

/**
 * Enviar notificação via fallback (email)
 */
async function sendFallbackNotification(userId, notification) {
  try {
    const response = await fetch(`http://localhost:${process.env.PORT || 3001}/api/notifications/fallback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId,
        notification: notification
      })
    });
    
    const result = await response.json();
    return result.success;
    
  } catch (error) {
    console.error('❌ Erro ao enviar fallback:', error);
    return false;
  }
}

module.exports = {
  router,
  sendNotificationWithFallback
};
