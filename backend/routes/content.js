const express = require('express');
const router = express.Router();
const util = require('util');
const axios = require('axios');
const Video = require('../models/Video');
const Document = require('../models/Document');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware');
const cloudinary = require('../config/cloudinaryConfig');
const accessLevelService = require('../services/accessLevelService');

// ==========================================================
// FUNÇÕES AUXILIARES
// ==========================================================

/**
 * Extrai o Public ID da URL do Cloudinary
 * @param {string} url - URL do Cloudinary
 * @returns {string|null} - Public ID ou null se inválido
 */
const getPublicIdFromUrl = (url) => {
  try {
    if (!url || !url.includes('cloudinary')) return null;
    
    const parts = url.split('/');
    const versionIndex = parts.indexOf('upload') + 2;
    
    if (versionIndex < 2 || versionIndex >= parts.length) return null;
    
    const publicIdWithExtension = parts.slice(versionIndex).join('/');
    const publicId = publicIdWithExtension.split('.')[0];
    
    return publicId;
  } catch (error) {
    console.error("❌ Erro ao extrair Public ID:", error);
    return null;
  }
};

/**
 * Remove arquivo do Cloudinary
 * @param {string} url - URL do arquivo
 * @param {string} resourceType - Tipo do recurso ('image', 'video', 'raw')
 */
const removeFromCloudinary = async (url, resourceType = 'image') => {
  try {
    if (!url || !url.includes('cloudinary')) return;
    
    const publicId = getPublicIdFromUrl(url);
    if (!publicId) return;
    
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log(`✅ Arquivo removido do Cloudinary: ${publicId}`);
  } catch (error) {
    console.error(`❌ Erro ao remover arquivo do Cloudinary:`, error);
  }
};

// Funções de validação removidas - usando validação inline

// ==========================================================
// ROTAS PÚBLICAS
// ==========================================================

/**
 * GET /videos - Listar vídeos baseado no nível de acesso do usuário
 */
router.get('/videos', authMiddleware, async (req, res) => {
  try {
    const userAccessLevel = req.user.accessLevel;
    console.log(`🎯 Buscando vídeos para nível de acesso: ${userAccessLevel}`);

    // NOVA LÓGICA: Buscar vídeos com filtragem por categoria baseada no accessLevel
    const videos = await Video.findAll({ 
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'titulo', 'descripcion', 'urlVideo', 'urlImagen', 'createdAt', 'categoria_produto'],
      where: accessLevelService.buildCategoryFilter(userAccessLevel)
    });
    
    console.log(`✅ Listados ${videos.length} vídeos acessíveis para nível ${userAccessLevel}`);
    res.json(videos);
    
  } catch (error) {
    console.error("❌ Erro ao buscar vídeos:", error);
    res.status(500).json({ 
      message: 'Erro ao buscar vídeos',
      code: 'FETCH_VIDEOS_ERROR'
    });
  }
});

/**
 * GET /documentos - Listar documentos baseado no nível de acesso do usuário
 */
router.get('/documentos', authMiddleware, async (req, res) => {
  try {
    const userAccessLevel = req.user.accessLevel;
    console.log(`🎯 Buscando documentos para nível de acesso: ${userAccessLevel}`);

    // NOVA LÓGICA: Buscar documentos com filtragem por categoria baseada no accessLevel
    const documents = await Document.findAll({ 
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'titulo', 'descripcion', 'urlDocumento', 'urlImagen', 'createdAt', 'categoria_produto'],
      where: accessLevelService.buildCategoryFilter(userAccessLevel)
    });
    
    console.log(`✅ Listados ${documents.length} documentos acessíveis para nível ${userAccessLevel}`);
    res.json(documents);
    
  } catch (error) {
    console.error("❌ Erro ao buscar documentos:", error);
    res.status(500).json({ 
      message: 'Erro ao buscar documentos',
      code: 'FETCH_DOCUMENTS_ERROR'
    });
  }
});

/**
 * GET /documentos/:id/download - Download de documento
 */
router.get('/documentos/:id/download', authMiddleware, async (req, res) => {
  let document;
  
  try {
    const { id } = req.params;
    
    // Buscar documento
    document = await Document.findByPk(id);
    if (!document || !document.urlDocumento) {
      return res.status(404).json({ 
        message: 'Documento não encontrado',
        code: 'DOCUMENT_NOT_FOUND'
      });
    }
    
    const originalUrl = document.urlDocumento;
    
    // Extrair extensão da URL de forma mais robusta
    let extension = 'pdf'; // Extensão padrão
    try {
      // Tentar extrair da URL
      const urlParts = originalUrl.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      
      // Se o último parte tem extensão, usar ela
      if (lastPart.includes('.')) {
        const possibleExtension = lastPart.split('.').pop().split('?')[0];
        if (possibleExtension && possibleExtension.length <= 5) {
          extension = possibleExtension;
        }
      }
      
      // Se não conseguiu extrair, tentar pelo Content-Type (se disponível)
      // Isso será feito após a requisição
    } catch (error) {
      console.log('Usando extensão padrão devido a erro na extração:', error.message);
    }
    
    const filename = `${document.titulo.replace(/[\s/\\:*?"<>|]/g, '_')}.${extension}`;
    
    // Fazer download do arquivo primeiro para obter headers
    const response = await axios({
      method: 'GET',
      url: originalUrl,
      responseType: 'stream',
      timeout: 30000 // 30 segundos de timeout
    });
    
    // Tentar melhorar a extensão baseada no Content-Type
    let finalFilename = filename;
    if (response.headers['content-type']) {
      const contentType = response.headers['content-type'].toLowerCase();
      
      // Mapear Content-Types comuns para extensões
      const contentTypeMap = {
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'application/vnd.ms-powerpoint': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
        'text/plain': 'txt',
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'application/zip': 'zip',
        'application/x-rar-compressed': 'rar'
      };
      
      // Se o Content-Type mapeia para uma extensão conhecida, usar ela
      for (const [type, ext] of Object.entries(contentTypeMap)) {
        if (contentType.includes(type)) {
          const titlePart = document.titulo.replace(/[\s/\\:*?"<>|]/g, '_');
          finalFilename = `${titlePart}.${ext}`;
          break;
        }
      }
      
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    
    // Configurar headers para download com nome final
    res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
    
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    
    // Headers adicionais para melhor compatibilidade
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log(`✅ Download iniciado: ${document.titulo} por usuário ${req.user.email}`);
    response.data.pipe(res);
    
  } catch (error) {
    if (document) {
      console.error(`❌ URL com problema: ${document.urlDocumento}`);
    }
    console.error("❌ Erro no download:", error);
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(404).json({ 
        message: 'Arquivo não encontrado no servidor',
        code: 'FILE_NOT_FOUND'
      });
    }
    
    res.status(500).json({ 
      message: 'Erro ao fazer download do arquivo',
      code: 'DOWNLOAD_ERROR'
    });
  }
});

// ==========================================================
// ROTAS DE ADMINISTRAÇÃO - NÍVEIS DE ACESSO
// ==========================================================

/**
 * GET /access-levels - Obter todos os níveis de acesso disponíveis (Admin)
 */
router.get('/access-levels', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    console.log('🔄 Endpoint /access-levels chamado');
    console.log('🔍 Chamando accessLevelService.getAllAccessLevels()...');
    const accessLevels = accessLevelService.getAllAccessLevels();
    console.log('📋 Níveis de acesso retornados pelo serviço:', accessLevels);
    
    const response = {
      accessLevels: accessLevels
    };
    console.log('📤 Resposta final que será enviada:', response);
    
    res.json(response);
  } catch (error) {
    console.error("❌ Erro ao buscar níveis de acesso:", error);
    res.status(500).json({ 
      message: 'Erro ao buscar níveis de acesso',
      code: 'FETCH_ACCESS_LEVELS_ERROR'
    });
  }
});

/**
 * GET /content-categories - Obter categorias de conteúdo disponíveis (Admin) - NOVO
 */
router.get('/content-categories', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    console.log('🔄 Endpoint /content-categories chamado');
    console.log('🔍 Chamando accessLevelService.getAllContentCategories()...');
    const categories = accessLevelService.getAllContentCategories();
    console.log('📋 Categorias de conteúdo retornadas pelo serviço:', categories);
    
    const response = {
      categories: categories
    };
    console.log('📤 Resposta final que será enviada:', response);
    
    res.json(response);
  } catch (error) {
    console.error("❌ Erro ao buscar categorias de conteúdo:", error);
    res.status(500).json({ 
      message: 'Erro ao buscar categorias de conteúdo',
      code: 'FETCH_CONTENT_CATEGORIES_ERROR'
    });
  }
});

// ==========================================================
// ROTAS DE ADMINISTRAÇÃO - VÍDEOS
// ==========================================================

/**
 * POST /videos - Criar novo vídeo (Admin)
 */
router.post('/videos', [authMiddleware, adminMiddleware, upload.fields([
  { name: 'videoFile', maxCount: 1 },
  { name: 'imageFile', maxCount: 1 }
])], async (req, res) => {
  // Timeout de 5 minutos para uploads grandes
  req.setTimeout(300000);
  
  console.log(`📹 Criando vídeo: ${req.body.titulo} por ${req.user.email}`);
  
  try {
    const { titulo, descripcion, urlVideo } = req.body;
    
    // Validação básica
    if (!titulo || titulo.trim().length < 1) {
      return res.status(400).json({
        message: 'Título deve ter pelo menos 3 caracteres',
        code: 'VALIDATION_ERROR'
      });
    }
    
    if (descripcion && descripcion.trim().length < 1) {
      return res.status(400).json({
        message: 'Descrição deve ter pelo menos 10 caracteres (se fornecida)',
        code: 'VALIDATION_ERROR'
      });
    }
    
    let videoPath = '';
    let imagePath = null;
    
    // Processar arquivos enviados
    if (req.files && req.files.imageFile) {
      imagePath = req.files.imageFile[0].path;
    }
    
    if (req.files && req.files.videoFile) {
      videoPath = req.files.videoFile[0].path;
    } else if (urlVideo && urlVideo.trim() !== '') {
      videoPath = urlVideo.trim();
    } else {
      return res.status(400).json({ 
        message: 'É necessário enviar um arquivo de vídeo ou fornecer uma URL',
        code: 'NO_VIDEO_SOURCE'
      });
    }
    
    // Processar categoria do produto
    const categoria_produto = req.body.categoria_produto || 'PRINCIPAL';
    const validCategories = accessLevelService.getAllContentCategories();
    const validCategoryValues = validCategories.map(cat => cat.value);
    
    if (!validCategoryValues.includes(categoria_produto)) {
      return res.status(400).json({
        message: 'Categoria de produto inválida',
        code: 'INVALID_PRODUCT_CATEGORY'
      });
    }

    // Criar vídeo
    const novoVideo = await Video.create({
      titulo: titulo.trim(),
      descripcion: descripcion ? descripcion.trim() : null,
      urlVideo: videoPath,
      urlImagen: imagePath,
      categoria_produto: categoria_produto
    });
    
    console.log(`✅ Vídeo criado: ${titulo} com categoria ${categoria_produto} por ${req.user.email}`);
    res.status(201).json({
      message: 'Vídeo criado com sucesso',
      video: novoVideo
    });
    
  } catch (error) {
    console.error("❌ Erro ao criar vídeo:", error);
    res.status(500).json({ 
      message: 'Erro ao criar vídeo',
      code: 'CREATE_VIDEO_ERROR'
    });
  }
});

/**
 * PUT /videos/:id - Atualizar vídeo (Admin)
 */
router.put('/videos/:id', [authMiddleware, adminMiddleware, upload.fields([
  { name: 'videoFile', maxCount: 1 }, 
  { name: 'imageFile', maxCount: 1 }
])], async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion } = req.body;
    
    // Validar ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        message: 'ID do vídeo inválido',
        code: 'INVALID_VIDEO_ID'
      });
    }
    
    // Buscar vídeo
    const video = await Video.findByPk(id);
    if (!video) {
      return res.status(404).json({ 
        message: 'Vídeo não encontrado',
        code: 'VIDEO_NOT_FOUND'
      });
    }
    
    // Validação básica se fornecidos
    if (titulo && titulo.trim().length < 3) {
      return res.status(400).json({
        message: 'Título deve ter pelo menos 3 caracteres',
        code: 'VALIDATION_ERROR'
      });
    }
    
    if (descripcion && descripcion.trim().length < 10) {
      return res.status(400).json({
        message: 'Descrição deve ter pelo menos 10 caracteres',
        code: 'VALIDATION_ERROR'
      });
    }
    
    const dataToUpdate = { ...req.body };
    
    // Processar novos arquivos
    if (req.files) {
      if (req.files.videoFile) {
        // Remover vídeo antigo do Cloudinary
        await removeFromCloudinary(video.urlVideo, 'video');
        dataToUpdate.urlVideo = req.files.videoFile[0].path;
      }
      
      if (req.files.imageFile) {
        // Remover imagem antiga do Cloudinary
        await removeFromCloudinary(video.urlImagen, 'image');
        dataToUpdate.urlImagen = req.files.imageFile[0].path;
      }
    }
    
    // Processar nível de acesso se fornecido
    const accessLevel = req.body.accessLevel;
    if (accessLevel !== undefined) {
      const validLevels = accessLevelService.getAllAccessLevels();
      if (validLevels.includes(accessLevel)) {
        dataToUpdate.accessLevel = accessLevel;
      }
    }

    // Atualizar vídeo
    await Video.update(dataToUpdate, { where: { id } });
    const updatedVideo = await Video.findByPk(id);
    
    console.log(`✅ Vídeo atualizado: ${updatedVideo.titulo} com nível ${updatedVideo.accessLevel} por ${req.user.email}`);
    res.json({ 
      message: 'Vídeo atualizado com sucesso', 
      video: updatedVideo
    });
    
  } catch (error) {
    console.error("❌ Erro ao atualizar vídeo:", error);
    res.status(500).json({ 
      message: 'Erro ao atualizar vídeo',
      code: 'UPDATE_VIDEO_ERROR'
    });
  }
});

/**
 * DELETE /videos/:id - Deletar vídeo (Admin)
 */
router.delete('/videos/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        message: 'ID do vídeo inválido',
        code: 'INVALID_VIDEO_ID'
      });
    }
    
    // Buscar vídeo
    const video = await Video.findByPk(id);
    if (!video) {
      return res.status(404).json({ 
        message: 'Vídeo não encontrado',
        code: 'VIDEO_NOT_FOUND'
      });
    }
    
    // Remover arquivos do Cloudinary
    await removeFromCloudinary(video.urlVideo, 'video');
    await removeFromCloudinary(video.urlImagen, 'image');
    
    // Deletar vídeo do banco
    await Video.destroy({ where: { id } });
    
    console.log(`✅ Vídeo deletado: ${video.titulo} por ${req.user.email}`);
    res.json({ 
      message: 'Vídeo deletado com sucesso',
      deletedVideo: { id: video.id, titulo: video.titulo }
    });
    
  } catch (error) {
    console.error("❌ Erro ao deletar vídeo:", error);
    res.status(500).json({ 
      message: 'Erro ao deletar vídeo',
      code: 'DELETE_VIDEO_ERROR'
    });
  }
});

// ==========================================================
// ROTAS DE ADMINISTRAÇÃO - DOCUMENTOS
// ==========================================================

/**
 * POST /documentos - Criar novo documento (Admin)
 */
router.post('/documentos', [authMiddleware, adminMiddleware, upload.fields([
  { name: 'docFile', maxCount: 1 }, 
  { name: 'imageFile', maxCount: 1 }
])], async (req, res) => {
  // Timeout de 5 minutos para uploads grandes
  req.setTimeout(300000);
  
  console.log(`📄 Criando documento: ${req.body.titulo} por ${req.user.email}`);
  
  try {
    const { titulo, descripcion, urlDocumento } = req.body;
    
    // Validação básica
    if (!titulo || titulo.trim().length < 3) {
      return res.status(400).json({
        message: 'Título deve ter pelo menos 3 caracteres',
        code: 'VALIDATION_ERROR'
      });
    }
    
    if (descripcion && descripcion.trim().length < 10) {
      return res.status(400).json({
        message: 'Descrição deve ter pelo menos 10 caracteres (se fornecida)',
        code: 'VALIDATION_ERROR'
      });
    }
    
    let docPath = '';
    let imagePath = null;
    
    // Processar arquivos enviados
    if (req.files && req.files.imageFile) {
      imagePath = req.files.imageFile[0].path;
    }
    
    if (req.files && req.files.docFile) {
      docPath = req.files.docFile[0].path;
    } else if (urlDocumento && urlDocumento.trim() !== '') {
      docPath = urlDocumento.trim();
    } else {
      return res.status(400).json({
        message: 'É necessário enviar um arquivo de documento ou fornecer uma URL',
        code: 'NO_DOCUMENT_SOURCE'
      });
    }
    
    // Processar categoria do produto
    const categoria_produto = req.body.categoria_produto || 'PRINCIPAL';
    const validCategories = accessLevelService.getAllContentCategories();
    const validCategoryValues = validCategories.map(cat => cat.value);
    
    if (!validCategoryValues.includes(categoria_produto)) {
      return res.status(400).json({
        message: 'Categoria de produto inválida',
        code: 'INVALID_PRODUCT_CATEGORY'
      });
    }

    // Criar documento
    const novoDocumento = await Document.create({
      titulo: titulo.trim(),
      descripcion: descripcion ? descripcion.trim() : null,
      urlDocumento: docPath,
      urlImagen: imagePath,
      categoria_produto: categoria_produto
    });
    
    console.log(`✅ Documento criado: ${titulo} com categoria ${categoria_produto} por ${req.user.email}`);
    res.status(201).json({
      message: 'Documento criado com sucesso',
      document: novoDocumento
    });
    
  } catch (error) {
    console.error("❌ Erro ao criar documento:", error);
    res.status(500).json({ 
      message: 'Erro ao criar documento',
      code: 'CREATE_DOCUMENT_ERROR'
    });
  }
});

/**
 * PUT /documentos/:id - Atualizar documento (Admin)
 */
router.put('/documentos/:id', [authMiddleware, adminMiddleware, upload.fields([
  { name: 'docFile', maxCount: 1 }, 
  { name: 'imageFile', maxCount: 1 }
])], async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion } = req.body;
    
    // Validar ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        message: 'ID do documento inválido',
        code: 'INVALID_DOCUMENT_ID'
      });
    }
    
    // Buscar documento
    const document = await Document.findByPk(id);
    if (!document) {
      return res.status(404).json({ 
        message: 'Documento não encontrado',
        code: 'DOCUMENT_NOT_FOUND'
      });
    }
    
    // Validação básica se fornecidos
    if (titulo && titulo.trim().length < 3) {
      return res.status(400).json({
        message: 'Título deve ter pelo menos 3 caracteres',
        code: 'VALIDATION_ERROR'
      });
    }
    
    if (descripcion && descripcion.trim().length < 10) {
      return res.status(400).json({
        message: 'Descrição deve ter pelo menos 10 caracteres',
        code: 'VALIDATION_ERROR'
      });
    }
    
    const dataToUpdate = { ...req.body };
    
    // Processar novos arquivos
    if (req.files) {
      if (req.files.docFile) {
        // Remover documento antigo do Cloudinary
        await removeFromCloudinary(document.urlDocumento, 'raw');
        dataToUpdate.urlDocumento = req.files.docFile[0].path;
      }
      
      if (req.files.imageFile) {
        // Remover imagem antiga do Cloudinary
        await removeFromCloudinary(document.urlImagen, 'image');
        dataToUpdate.urlImagen = req.files.imageFile[0].path;
      }
    }
    
    // Processar nível de acesso se fornecido
    const accessLevel = req.body.accessLevel;
    if (accessLevel !== undefined) {
      const validLevels = accessLevelService.getAllAccessLevels();
      if (validLevels.includes(accessLevel)) {
        dataToUpdate.accessLevel = accessLevel;
      }
    }

    // Atualizar documento
    await Document.update(dataToUpdate, { where: { id } });
    const updatedDocument = await Document.findByPk(id);
    
    console.log(`✅ Documento atualizado: ${updatedDocument.titulo} com nível ${updatedDocument.accessLevel} por ${req.user.email}`);
    res.json({ 
      message: 'Documento atualizado com sucesso', 
      document: updatedDocument
    });
    
  } catch (error) {
    console.error("❌ Erro ao atualizar documento:", error);
    res.status(500).json({ 
      message: 'Erro ao atualizar documento',
      code: 'UPDATE_DOCUMENT_ERROR'
    });
  }
});

/**
 * DELETE /documentos/:id - Deletar documento (Admin)
 */
router.delete('/documentos/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        message: 'ID do documento inválido',
        code: 'INVALID_DOCUMENT_ID'
      });
    }
    
    // Buscar documento
    const document = await Document.findByPk(id);
    if (!document) {
      return res.status(404).json({ 
        message: 'Documento não encontrado',
        code: 'DOCUMENT_NOT_FOUND'
      });
    }
    
    // Remover arquivos do Cloudinary
    await removeFromCloudinary(document.urlDocumento, 'raw');
    await removeFromCloudinary(document.urlImagen, 'image');
    
    // Deletar documento do banco
    await Document.destroy({ where: { id } });
    
    console.log(`✅ Documento deletado: ${document.titulo} por ${req.user.email}`);
    res.json({ 
      message: 'Documento deletado com sucesso',
      deletedDocument: { id: document.id, titulo: document.titulo }
    });
    
  } catch (error) {
    console.error("❌ Erro ao deletar documento:", error);
    res.status(500).json({ 
      message: 'Erro ao deletar documento',
      code: 'DELETE_DOCUMENT_ERROR'
    });
  }
});


module.exports = router;