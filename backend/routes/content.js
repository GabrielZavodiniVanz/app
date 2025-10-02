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

// Função auxiliar para extrair o Public ID da URL do Cloudinary
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
    console.error("Erro ao extrair Public ID:", error);
    return null;
  }
};

// ==========================================================
// --- ROTAS PÚBLICAS ---
// ==========================================================
router.get('/videos', async (req, res) => {
  try {
    const videos = await Video.findAll({ order: [['createdAt', 'DESC']] });
    res.json(videos);
  } catch (error) {
    console.error("=====================================\n[ERRO EM GET /videos]:\n", util.inspect(error, false, null, true), "\n=====================================");
    res.status(500).json({ message: 'Error al buscar videos' });
  }
});

router.get('/documentos', async (req, res) => {
  try {
    const documents = await Document.findAll({ order: [['createdAt', 'DESC']] });
    res.json(documents);
  } catch (error) {
    console.error("=====================================\n[ERRO EM GET /documentos]:\n", util.inspect(error, false, null, true), "\n=====================================");
    res.status(500).json({ message: 'Error al buscar documentos' });
  }
});

// ===============================================================
// --- ROTA DE DOWNLOAD (COM DEBUG ADICIONAL) ---
// ===============================================================
router.get('/documentos/:id/download', authMiddleware, async (req, res) => {
  let document; // Declarado aqui para ser acessível no catch
  try {
    document = await Document.findByPk(req.params.id);
    if (!document || !document.urlDocumento) {
      return res.status(404).json({ message: 'Documento no encontrado.' });
    }
    const originalUrl = document.urlDocumento;
    const extension = originalUrl.split('.').pop().split('?')[0] || 'file';
    const filename = `${document.titulo.replace(/[\s/]/g, '_')}.${extension}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const response = await axios({ method: 'GET', url: originalUrl, responseType: 'stream' });
    if (response.headers['content-type']) {
        res.setHeader('Content-Type', response.headers['content-type']);
    }
    response.data.pipe(res);
  } catch (error) {
    // A LINHA DE DEBUG QUE ADICIONAMOS:
    if (document) {
      console.log('>>> URL COM PROBLEMA:', document.urlDocumento);
    }
    console.error("=====================================\n[ERRO NO DOWNLOAD]:\n", util.inspect(error, false, null, true), "\n=====================================");
    res.status(500).json({ message: 'Error al descargar el archivo.' });
  }
});

// ===============================================================
// --- ROTAS DE ADMIN ---
// ===============================================================

// --- VÍDEOS ---
router.post('/videos', [authMiddleware, adminMiddleware, upload.fields([{ name: 'videoFile', maxCount: 1 }, { name: 'imageFile', maxCount: 1 }])], async (req, res) => {
    try {
      const { titulo, descripcion, urlVideo } = req.body;
      let videoPath = ''; let imagePath = null;
      if (req.files && req.files.imageFile) { imagePath = req.files.imageFile[0].path; }
      if (req.files && req.files.videoFile) { videoPath = req.files.videoFile[0].path; } else if (urlVideo && urlVideo.trim() !== '') { videoPath = urlVideo; } else { return res.status(400).json({ message: 'É necessário enviar um arquivo de vídeo ou fornecer uma URL.' }); }
      const novoVideo = await Video.create({ titulo, descripcion, urlVideo: videoPath, urlImagen: imagePath });
      res.status(201).json(novoVideo);
    } catch (error) { console.error("=====================================\n[ERRO EM POST /videos]:\n", util.inspect(error, false, null, true), "\n====================================="); res.status(500).json({ message: 'Error al crear el video' }); }
});

router.put('/videos/:id', [authMiddleware, adminMiddleware, upload.fields([{ name: 'videoFile', maxCount: 1 }, { name: 'imageFile', maxCount: 1 }])], async (req, res) => {
    try {
      const video = await Video.findByPk(req.params.id);
      if (!video) { return res.status(404).json({ message: 'Video no encontrado.' }); }
      const dataToUpdate = { ...req.body };
      if (req.files) {
        if (req.files.videoFile) { if (video.urlVideo && video.urlVideo.includes('cloudinary')) { const publicId = getPublicIdFromUrl(video.urlVideo); if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: 'video' }); } dataToUpdate.urlVideo = req.files.videoFile[0].path; }
        if (req.files.imageFile) { if (video.urlImagen && video.urlImagen.includes('cloudinary')) { const publicId = getPublicIdFromUrl(video.urlImagen); if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }); } dataToUpdate.urlImagen = req.files.imageFile[0].path; }
      }
      await Video.update(dataToUpdate, { where: { id: req.params.id } });
      const updatedVideo = await Video.findByPk(req.params.id);
      res.json({ message: 'Video actualizado con éxito', video: updatedVideo });
    } catch (error) { console.error("=====================================\n[ERRO EM PUT /videos/:id]:\n", util.inspect(error, false, null, true), "\n====================================="); res.status(500).json({ message: 'Error al actualizar el video' }); }
});

router.delete('/videos/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);
    if (!video) { return res.status(404).json({ message: 'Video no encontrado.' }); }
    if (video.urlVideo && video.urlVideo.includes('cloudinary')) { const publicId = getPublicIdFromUrl(video.urlVideo); if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: 'video' }); }
    if (video.urlImagen && video.urlImagen.includes('cloudinary')) { const publicId = getPublicIdFromUrl(video.urlImagen); if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }); }
    await Video.destroy({ where: { id: req.params.id } });
    res.status(200).json({ message: 'Video eliminado con éxito' });
  } catch (error) { console.error("=====================================\n[ERRO EM DELETE /videos/:id]:\n", util.inspect(error, false, null, true), "\n====================================="); res.status(500).json({ message: 'Error al eliminar el video' }); }
});

// --- DOCUMENTOS ---
router.post('/documentos', [authMiddleware, adminMiddleware, upload.fields([{ name: 'docFile', maxCount: 1 }, { name: 'imageFile', maxCount: 1 }])], async (req, res) => {
    try {
      const { titulo, descripcion, urlDocumento } = req.body;
      let docPath = ''; let imagePath = null;
      if (req.files && req.files.imageFile) { imagePath = req.files.imageFile[0].path; }
      if (req.files && req.files.docFile) { docPath = req.files.docFile[0].path; } else if (urlDocumento && urlDocumento.trim() !== '') { docPath = urlDocumento; } else { return res.status(400).json({ message: 'É necessário enviar um arquivo de documento ou fornecer uma URL.' }); }
      const novoDocumento = await Document.create({ titulo, descripcion, urlDocumento: docPath, urlImagen: imagePath });
      res.status(201).json(novoDocumento);
    } catch (error) { console.error("=====================================\n[ERRO EM POST /documentos]:\n", util.inspect(error, false, null, true), "\n====================================="); res.status(500).json({ message: 'Error al agregar el documento' }); }
});

router.put('/documentos/:id', [authMiddleware, adminMiddleware, upload.fields([{ name: 'docFile', maxCount: 1 }, { name: 'imageFile', maxCount: 1 }])], async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    if (!document) { return res.status(404).json({ message: 'Documento no encontrado.' }); }
    const dataToUpdate = { ...req.body };
    if (req.files) {
      if (req.files.docFile) { if (document.urlDocumento && document.urlDocumento.includes('cloudinary')) { const publicId = getPublicIdFromUrl(document.urlDocumento); if (publicId) await cloudinary.uploader.destroy(publicId); } dataToUpdate.urlDocumento = req.files.docFile[0].path; }
      if (req.files.imageFile) { if (document.urlImagen && document.urlImagen.includes('cloudinary')) { const publicId = getPublicIdFromUrl(document.urlImagen); if (publicId) await cloudinary.uploader.destroy(publicId); } dataToUpdate.urlImagen = req.files.imageFile[0].path; }
    }
    await Document.update(dataToUpdate, { where: { id: req.params.id } });
    const updatedDocument = await Document.findByPk(req.params.id);
    res.json({ message: 'Documento actualizado con éxito', document: updatedDocument });
  } catch (error) { console.error("=====================================\n[ERRO EM PUT /documentos/:id]:\n", util.inspect(error, false, null, true), "\n====================================="); res.status(500).json({ message: 'Error al actualizar el documento' }); }
});

router.delete('/documentos/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    if (!document) { return res.status(404).json({ message: 'Documento no encontrado.' }); }
    if (document.urlDocumento && document.urlDocumento.includes('cloudinary')) { const publicId = getPublicIdFromUrl(document.urlDocumento); if (publicId) await cloudinary.uploader.destroy(publicId); }
    if (document.urlImagen && document.urlImagen.includes('cloudinary')) { const publicId = getPublicIdFromUrl(document.urlImagen); if (publicId) await cloudinary.uploader.destroy(publicId); }
    await Document.destroy({ where: { id: req.params.id } });
    res.status(200).json({ message: 'Documento eliminado con éxito' });
  } catch (error) { console.error("=====================================\n[ERRO EM DELETE /documentos/:id]:\n", util.inspect(error, false, null, true), "\n====================================="); res.status(500).json({ message: 'Error al eliminar el documento' }); }
});

module.exports = router;