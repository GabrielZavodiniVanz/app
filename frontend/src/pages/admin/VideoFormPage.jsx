import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createVideo } from '../../services/contentService';
import toast from 'react-hot-toast';
import styles from './AdminPages.module.css';

function VideoFormPage() {
  const [videoSourceType, setVideoSourceType] = useState('upload'); // 'upload' ou 'link'
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [urlVideo, setUrlVideo] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('descripcion', descripcion);

    // Adiciona a fonte do vídeo (arquivo ou link)
    if (videoSourceType === 'upload') {
      if (!videoFile) {
        toast.error('Por favor, selecione um arquivo de vídeo.');
        setIsSubmitting(false);
        return;
      }
      formData.append('videoFile', videoFile);
    } else {
      if (!urlVideo) {
        toast.error('Por favor, insira uma URL do YouTube.');
        setIsSubmitting(false);
        return;
      }
      formData.append('urlVideo', urlVideo);
    }
    
    // Adiciona a imagem de capa (se existir)
    if (imageFile) {
      formData.append('imageFile', imageFile);
    }

    try {
      await createVideo(formData);
      toast.success('¡Video agregado con éxito!');
      navigate('/admin/videos');
    } catch (err) {
      toast.error('Error al agregar el video.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.adminContainer}>
      <h1>Adicionar Novo Vídeo</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* CAMPOS DE TEXTO */}
        <div className={styles.formGroup}>
          <label htmlFor="titulo">Título</label>
          <input type="text" id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="descripcion">Descrição</label>
          <textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows="4" />
        </div>

        {/* SELEÇÃO DA FONTE DO VÍDEO */}
        <div className={styles.formGroup}>
          <label>Fonte do Vídeo</label>
          <div className={styles.radioGroup}>
            <label>
              <input type="radio" name="sourceType" value="upload" checked={videoSourceType === 'upload'} onChange={(e) => setVideoSourceType(e.target.value)} />
              Upload de Arquivo
            </label>
            <label>
              <input type="radio" name="sourceType" value="link" checked={videoSourceType === 'link'} onChange={(e) => setVideoSourceType(e.target.value)} />
              Link do YouTube
            </label>
          </div>
        </div>

        {/* INPUT CONDICIONAL PARA FONTE DO VÍDEO */}
        {videoSourceType === 'upload' ? (
          <div className={styles.formGroup}>
            <label htmlFor="videoFile">Arquivo de Vídeo (mp4, mov, etc.)</label>
            <input type="file" id="videoFile" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])} />
          </div>
        ) : (
          <div className={styles.formGroup}>
            <label htmlFor="urlVideo">URL do YouTube</label>
            <input type="text" id="urlVideo" placeholder="https://www.youtube.com/watch?v=..." value={urlVideo} onChange={(e) => setUrlVideo(e.target.value)} />
          </div>
        )}

        {/* INPUT PARA IMAGEM DE CAPA */}
        <div className={styles.formGroup}>
          <label htmlFor="imageFile">Imagem de Capa (Opcional)</label>
          <input type="file" id="imageFile" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
        </div>
        
        <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
          {isSubmitting ? 'Enviando...' : 'Salvar Vídeo'}
        </button>
      </form>
    </div>
  );
}

export default VideoFormPage;