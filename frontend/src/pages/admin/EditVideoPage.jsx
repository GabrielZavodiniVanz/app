import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getVideos, updateVideo } from '../../services/contentService';
import toast from 'react-hot-toast';
import styles from './AdminPages.module.css';

function EditVideoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [videoSourceType, setVideoSourceType] = useState('upload');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [urlVideo, setUrlVideo] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        const videos = await getVideos();
        const video = videos.find(v => v.id === parseInt(id));
        
        if (!video) {
          toast.error('Vídeo não encontrado');
          navigate('/admin/videos');
          return;
        }

        setTitulo(video.titulo || '');
        setDescripcion(video.descripcion || '');
        setUrlVideo(video.urlVideo || '');
        
        // Determinar se é upload ou link baseado na URL
        if (video.urlVideo && (video.urlVideo.includes('youtube.com') || video.urlVideo.includes('youtu.be'))) {
          setVideoSourceType('link');
        } else {
          setVideoSourceType('upload');
        }
        
      } catch (error) {
        console.error('Erro ao carregar vídeo:', error);
        toast.error('Erro ao carregar dados do vídeo');
        navigate('/admin/videos');
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('descripcion', descripcion);

    // Adiciona a fonte do vídeo (arquivo ou link)
    if (videoSourceType === 'upload') {
      if (videoFile) {
        formData.append('videoFile', videoFile);
      }
    } else {
      if (urlVideo) {
        formData.append('urlVideo', urlVideo);
      }
    }
    
    // Adiciona a imagem de capa (se existir)
    if (imageFile) {
      formData.append('imageFile', imageFile);
    }

    try {
      await updateVideo(id, formData);
      toast.success('¡Video actualizado con éxito!');
      navigate('/admin/videos');
    } catch (err) {
      toast.error('Error al actualizar el video.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.adminContainer}>
        <p>Carregando dados do vídeo...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <h1>Editar Vídeo</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* CAMPOS DE TEXTO */}
        <div className={styles.formGroup}>
          <label htmlFor="titulo">Título</label>
          <input 
            type="text" 
            id="titulo" 
            value={titulo} 
            onChange={(e) => setTitulo(e.target.value)} 
            required 
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="descripcion">Descrição</label>
          <textarea 
            id="descripcion" 
            value={descripcion} 
            onChange={(e) => setDescripcion(e.target.value)} 
            rows="4" 
          />
        </div>

        {/* SELEÇÃO DA FONTE DO VÍDEO */}
        <div className={styles.formGroup}>
          <label>Fonte do Vídeo</label>
          <div className={styles.radioGroup}>
            <label>
              <input 
                type="radio" 
                name="sourceType" 
                value="upload" 
                checked={videoSourceType === 'upload'} 
                onChange={(e) => setVideoSourceType(e.target.value)} 
              />
              Upload de Arquivo
            </label>
            <label>
              <input 
                type="radio" 
                name="sourceType" 
                value="link" 
                checked={videoSourceType === 'link'} 
                onChange={(e) => setVideoSourceType(e.target.value)} 
              />
              Link do YouTube
            </label>
          </div>
        </div>

        {/* INPUT CONDICIONAL PARA FONTE DO VÍDEO */}
        {videoSourceType === 'upload' ? (
          <div className={styles.formGroup}>
            <label htmlFor="videoFile">Arquivo de Vídeo (mp4, mov, etc.)</label>
            <input 
              type="file" 
              id="videoFile" 
              accept="video/*" 
              onChange={(e) => setVideoFile(e.target.files[0])} 
            />
            <small>Deixe em branco para manter o arquivo atual</small>
          </div>
        ) : (
          <div className={styles.formGroup}>
            <label htmlFor="urlVideo">URL do YouTube</label>
            <input 
              type="text" 
              id="urlVideo" 
              placeholder="https://www.youtube.com/watch?v=..." 
              value={urlVideo} 
              onChange={(e) => setUrlVideo(e.target.value)} 
            />
          </div>
        )}

        {/* INPUT PARA IMAGEM DE CAPA */}
        <div className={styles.formGroup}>
          <label htmlFor="imageFile">Imagem de Capa (Opcional)</label>
          <input 
            type="file" 
            id="imageFile" 
            accept="image/*" 
            onChange={(e) => setImageFile(e.target.files[0])} 
          />
          <small>Deixe em branco para manter a imagem atual</small>
        </div>
        
        <div className={styles.formActions}>
          <button 
            type="button" 
            onClick={() => navigate('/admin/videos')} 
            className={styles.cancelButton}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className={styles.submitButton}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditVideoPage;
