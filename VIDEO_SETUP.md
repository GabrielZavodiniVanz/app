# 🎬 Configuração do Vídeo de Boas-vindas

Este guia explica como configurar o vídeo de boas-vindas para funcionar tanto localmente quanto no Render.

## 🚀 Soluções Disponíveis

### **Opção 1: Cloudinary (Recomendado)**

#### 1. Configurar Cloudinary
1. Acesse [cloudinary.com](https://cloudinary.com) e crie uma conta gratuita
2. No dashboard, copie suas credenciais:
   - Cloud Name
   - API Key
   - API Secret

#### 2. Configurar Variáveis de Ambiente
Adicione no Render (ou .env local):
```
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret
```

#### 3. Fazer Upload do Vídeo
```bash
# No diretório backend
node scripts/uploadVideo.js
```

Este script irá:
- ✅ Fazer upload do vídeo para o Cloudinary
- ✅ Criar versões otimizadas
- ✅ Salvar a URL no arquivo `frontend/src/data/videoConfig.json`

#### 4. Deploy
O vídeo funcionará automaticamente no Render!

---

### **Opção 2: YouTube/Vimeo (Alternativa)**

Se preferir usar uma plataforma de vídeo externa:

1. **YouTube:**
   - Faça upload do vídeo no YouTube
   - Use a URL de embed: `https://www.youtube.com/embed/VIDEO_ID`

2. **Vimeo:**
   - Faça upload no Vimeo
   - Use a URL de embed: `https://player.vimeo.com/video/VIDEO_ID`

3. **Atualizar o componente:**
```jsx
// Em WelcomePopup.jsx, substitua o elemento <video> por:
<iframe
  src="https://www.youtube.com/embed/SEU_VIDEO_ID"
  title="Video de boas-vindas"
  frameBorder="0"
  allowFullScreen
  className={styles.welcomeVideo}
/>
```

---

### **Opção 3: Vídeo Local Otimizado**

Se quiser manter o vídeo local:

1. **Comprimir o vídeo:**
```bash
# Usando ffmpeg (instalar primeiro)
ffmpeg -i welcome-video.mp4 -vcodec h264 -acodec mp2 -crf 28 welcome-video-compressed.mp4
```

2. **Adicionar ao Git:**
```bash
git add frontend/public/videos/welcome-video-compressed.mp4
git commit -m "Add compressed welcome video"
git push
```

---

## 🔧 Configuração Atual

O sistema está configurado para:
- ✅ **Priorizar Cloudinary** se configurado
- ✅ **Fallback para local** se Cloudinary não estiver disponível
- ✅ **Tratamento de erro** com mensagem amigável
- ✅ **Loading state** enquanto carrega

## 📁 Arquivos Modificados

- `frontend/src/components/WelcomePopup.jsx` - Componente atualizado
- `frontend/src/components/WelcomePopup.module.css` - Estilos para erro
- `frontend/src/data/videoConfig.json` - Configuração do vídeo
- `backend/scripts/uploadVideo.js` - Script de upload

## 🎯 Próximos Passos

1. **Escolha uma opção** acima
2. **Configure as variáveis** de ambiente
3. **Faça o upload** do vídeo
4. **Teste localmente** primeiro
5. **Deploy no Render**

## 💡 Dicas

- **Cloudinary** oferece 25GB gratuitos
- **YouTube** é gratuito e confiável
- **Vimeo** tem melhor qualidade, mas limite de uploads
- **Local** funciona, mas aumenta o tamanho do build

## 🆘 Problemas Comuns

### Vídeo não carrega
- Verifique se as credenciais do Cloudinary estão corretas
- Confirme se o arquivo `videoConfig.json` foi atualizado
- Verifique o console do navegador para erros

### Vídeo muito lento
- Use o Cloudinary (CDN global)
- Comprima o vídeo antes do upload
- Considere usar YouTube/Vimeo

### Erro de CORS
- Cloudinary resolve automaticamente
- Para outros CDNs, configure CORS adequadamente
