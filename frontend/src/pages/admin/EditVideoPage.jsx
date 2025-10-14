import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getVideos, updateVideo, deleteVideo } from '../../services/contentService';
import FileManager from '../../components/FileManager';
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
  const [currentVideo, setCurrentVideo] = useState(null);

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
        setCurrentVideo(video);
        
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

  const handleDeleteVideo = async () => {
    try {
      // Atualizar o vídeo removendo apenas o arquivo
      const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('descripcion', descripcion);
      formData.append('urlVideo', urlVideo);
      formData.append('removeVideo', 'true');
      
      await updateVideo(id, formData);
      
      // Atualizar o estado local
      setCurrentVideo(prev => ({ ...prev, urlVideo: null }));
      toast.success('Arquivo de vídeo removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover vídeo:', error);
      toast.error('Erro ao remover vídeo');
    }
  };

  const handleDeleteImage = async () => {
    try {
      // Atualizar o vídeo removendo a imagem
      const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('descripcion', descripcion);
      formData.append('urlVideo', urlVideo);
      formData.append('removeImage', 'true');
      
      await updateVideo(id, formData);
      
      // Atualizar o estado local
      setCurrentVideo(prev => ({ ...prev, urlImagen: null }));
      toast.success('Imagem removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      toast.error('Erro ao remover imagem');
    }
  };

  const handlePreviewVideo = () => {
    if (currentVideo?.urlVideo) {
      window.open(currentVideo.urlVideo, '_blank');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    console.log('🔄 Iniciando atualização do vídeo:', { videoFile, imageFile, urlVideo });

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('descripcion', descripcion);

    // Adiciona a fonte do vídeo (arquivo ou link)
    if (videoSourceType === 'upload') {
      if (videoFile) {
        console.log('🎥 Adicionando novo vídeo:', videoFile.name);
        formData.append('videoFile', videoFile);
      }
    } else {
      if (urlVideo) {
        console.log('🔗 Adicionando URL do vídeo:', urlVideo);
        formData.append('urlVideo', urlVideo);
      }
    }
    
    // Adiciona a imagem de capa (se existir)
    if (imageFile) {
      console.log('🖼️ Adicionando nova imagem:', imageFile.name);
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

        {/* Gerenciador de Vídeo */}
        {videoSourceType === 'upload' ? (
          <FileManager
            currentFileUrl={currentVideo?.urlVideo}
            currentFileName={currentVideo?.titulo || 'Vídeo atual'}
            fileType="video"
            accept="video/*"
            onFileChange={(file) => setVideoFile(file)}
            onDelete={handleDeleteVideo}
            onDownload={handlePreviewVideo}
            showPreview={true}
            label="Arquivo de Vídeo (mp4, mov, etc.)"
            placeholder="Escolher vídeo"
          />
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

        {/* Gerenciador de Imagem de Capa */}
        <FileManager
          currentFileUrl={currentVideo?.urlImagen}
          currentFileName="Imagem de capa"
          fileType="image"
          accept="image/*"
          onFileChange={(file) => setImageFile(file)}
          onDelete={handleDeleteImage}
          showPreview={true}
          label="Imagem de Capa (Opcional)"
          placeholder="Escolher imagem"
        />
        
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
