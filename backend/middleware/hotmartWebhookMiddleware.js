/**
 * Middleware para validar webhooks da Hotmart
 * A Hotmart envia um header 'h-hotmart-hottoken' para validação
 */
const validateHotmartWebhook = (req, res, next) => {
  try {
    const hottoken = req.headers['h-hotmart-hottoken'];
    const expectedToken = process.env.HOTMART_WEBHOOK_TOKEN;

    // Se não há token configurado no .env, permitir (modo sem token)
    if (!expectedToken) {
      console.warn('⚠️ HOTMART_WEBHOOK_TOKEN não configurado no .env - permitindo requisição');
      return next();
    }

    // Se o token está configurado mas não foi enviado, apenas avisar e continuar
    // (O painel atual da Hotmart não expõe o campo de Hottoken na interface)
    if (!hottoken) {
      console.warn('⚠️ Webhook Hotmart sem token de autenticação - aceitando sem validação de token');
      return next();
    }

    // Se o token foi enviado, validar
    if (hottoken !== expectedToken) {
      console.error('❌ Token do webhook Hotmart inválido');
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid Hottoken' 
      });
    }

    console.log('✅ Webhook da Hotmart validado com sucesso (token OK)');
    next();

  } catch (error) {
    console.error('❌ Erro na validação do webhook Hotmart:', error);
    return res.status(500).json({ 
      error: 'Server Error',
      message: 'Webhook validation failed' 
    });
  }
};

/**
 * Middleware para log de webhooks (para debug)
 */
const logHotmartWebhookData = (req, res, next) => {
  console.log('📨 Webhook recebido da Hotmart:');
  console.log('Headers:', {
    'user-agent': req.headers['user-agent'],
    'content-type': req.headers['content-type'],
    'h-hotmart-hottoken': req.headers['h-hotmart-hottoken'] ? '[PRESENTE]' : '[AUSENTE]'
  });
  console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
};

/**
 * Middleware para validar dados essenciais do webhook Hotmart
 */
const validateHotmartWebhookData = (req, res, next) => {
  const body = req.body;

  // Verificar se é um evento de pagamento aprovado (formatos possíveis)
  const allowedEvents = [
    'PURCHASE_APPROVED', 
    'purchase_approved', 
    'APPROVED', 
    'approved',
    'compra_aprovada',
    'Compra aprovada',
    'COMPRA_APROVADA'
  ];
  const currentEvent = body.event || body.event_type || (body.data && body.data.status);

  if (!allowedEvents.includes(currentEvent)) {
    console.log(`ℹ️ Evento Hotmart ignorado: ${currentEvent || 'unknown'}`);
    return res.status(200).json({ 
      message: 'Event ignored',
      event: currentEvent || 'unknown'
    });
  }

  // Validar dados essenciais (Formato V2 Recomendado)
  const data = body.data || body;
  const buyer = data.buyer;
  const product = data.product;

  // IMPORTANTE: Hotmart envia id: 0 em eventos de teste. 
  // Precisamos verificar se ele é undefined/null em vez de apenas !product.id
  const hasProductId = product && (product.id !== undefined && product.id !== null);
  const hasBuyerInfo = buyer && buyer.email && buyer.name;

  if (!hasBuyerInfo || !hasProductId) {
    console.error('❌ Dados essenciais ausentes no webhook Hotmart (buyer ou product)');
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'Essential data missing (buyer email/name or product id)' 
    });
  }

  console.log('✅ Dados do webhook Hotmart validados:', {
    event: currentEvent,
    customerEmail: buyer.email,
    customerName: buyer.name,
    productId: product.id
  });

  next();
};

module.exports = {
  validateHotmartWebhook,
  logHotmartWebhookData,
  validateHotmartWebhookData
};
