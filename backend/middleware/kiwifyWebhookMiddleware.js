const crypto = require('crypto');

/**
 * Middleware para validar webhooks da Kiwify
 * A Kiwify envia um header 'X-Kiwify-Signature' com a assinatura HMAC
 */
const validateKiwifyWebhook = (req, res, next) => {
  try {
    const signature = req.headers['x-kiwify-signature'];
    const webhookSecret = process.env.KIWIFY_WEBHOOK_SECRET;

    if (!signature) {
      console.error('❌ Webhook sem assinatura da Kiwify');
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Webhook signature missing' 
      });
    }

    if (!webhookSecret) {
      console.error('❌ KIWIFY_WEBHOOK_SECRET não configurado');
      return res.status(500).json({ 
        error: 'Server Error',
        message: 'Webhook secret not configured' 
      });
    }

    // Obter o corpo da requisição como string
    const payload = JSON.stringify(req.body);
    
    // Calcular a assinatura esperada
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    // Formato da assinatura: sha256=<hash>
    const receivedSignature = signature.replace('sha256=', '');

    // Comparar as assinaturas de forma segura
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );

    if (!isValid) {
      console.error('❌ Assinatura do webhook inválida');
      console.error('Esperada:', expectedSignature);
      console.error('Recebida:', receivedSignature);
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid webhook signature' 
      });
    }

    console.log('✅ Webhook da Kiwify validado com sucesso');
    next();

  } catch (error) {
    console.error('❌ Erro na validação do webhook:', error);
    return res.status(500).json({ 
      error: 'Server Error',
      message: 'Webhook validation failed' 
    });
  }
};

/**
 * Middleware para log de webhooks (para debug)
 */
const logWebhookData = (req, res, next) => {
  console.log('📨 Webhook recebido da Kiwify:');
  console.log('Headers:', {
    'user-agent': req.headers['user-agent'],
    'content-type': req.headers['content-type'],
    'x-kiwify-signature': req.headers['x-kiwify-signature'] ? '[PRESENTE]' : '[AUSENTE]'
  });
  console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
};

/**
 * Middleware para validar dados essenciais do webhook
 */
const validateWebhookData = (req, res, next) => {
  const { event, data } = req.body;

  // Verificar se é um evento de pagamento aprovado
  if (event !== 'order.paid') {
    console.log(`ℹ️ Evento ignorado: ${event}`);
    return res.status(200).json({ 
      message: 'Event ignored',
      event: event 
    });
  }

  // Validar dados essenciais
  if (!data || !data.customer) {
    console.error('❌ Dados do cliente ausentes no webhook');
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'Customer data missing' 
    });
  }

  const { customer } = data;
  
  if (!customer.email || !customer.name) {
    console.error('❌ Email ou nome do cliente ausente');
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'Customer email or name missing' 
    });
  }

  // Validar formato do email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customer.email)) {
    console.error('❌ Email do cliente inválido:', customer.email);
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'Invalid customer email format' 
    });
  }

  console.log('✅ Dados do webhook validados:', {
    event,
    customerEmail: customer.email,
    customerName: customer.name,
    orderId: data.id
  });

  next();
};

module.exports = {
  validateKiwifyWebhook,
  logWebhookData,
  validateWebhookData
};
