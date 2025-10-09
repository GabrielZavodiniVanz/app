# Configuração de E-mail para Produção

## Problema Resolvido
- **Timeout de conexão SMTP** em produção
- **Falhas de envio de e-mail** que afetavam o webhook

## Soluções Implementadas

### 1. Configuração SMTP Otimizada
```javascript
// Timeouts aumentados para produção
connectionTimeout: 60000, // 60 segundos
greetingTimeout: 30000,   // 30 segundos
socketTimeout: 60000,     // 60 segundos

// Pool de conexões para melhor performance
pool: true,
maxConnections: 5,
maxMessages: 100,

// TLS configurado para produção
tls: {
  rejectUnauthorized: false
}
```

### 2. Sistema de Retry Automático
- **Verificação de conexão** com retry (3 tentativas)
- **Envio de e-mails** com retry (2 tentativas)
- **Delays progressivos** entre tentativas

### 3. Tratamento de Erros Resiliente
- **Webhook não falha** se e-mail não for enviado
- **Usuário é criado** mesmo com falha de e-mail
- **Logs detalhados** para debugging

## Configurações Necessárias

### Variáveis de Ambiente
```env
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-app-password
```

### Gmail App Password
1. Ative **2FA** na sua conta Google
2. Gere uma **App Password** específica
3. Use a App Password (não a senha normal)

## Monitoramento
- Logs de tentativas de conexão
- Logs de tentativas de envio
- Status de sucesso/falha dos e-mails

## Fallback
Se o serviço de e-mail falhar completamente:
- ✅ Webhook continua funcionando
- ✅ Usuário é criado no banco
- ❌ E-mail não é enviado (logado como erro)
