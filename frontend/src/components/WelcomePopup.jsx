import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import styles from './WelcomePopup.module.css';
import videoConfig from '../data/videoConfig.json';

const WelcomePopup = ({ isVisible, onClose, userName }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // URL do vídeo - focar no YouTube
  const getVideoUrl = () => {
    if (videoConfig.youtubeEmbedUrl) {
      return videoConfig.youtubeEmbedUrl;
    }
    
    if (videoConfig.youtubeId) {
      return `https://www.youtube.com/embed/${videoConfig.youtubeId}`;
    }
    
    // Fallback para Cloudinary se YouTube não funcionar
    if (videoConfig.cloudinaryUrl) {
      return videoConfig.cloudinaryUrl;
    }
    
    return '/videos/welcome-video.mp4';
  };

  const isYouTube = () => {
    return videoConfig.youtubeId || videoConfig.youtubeEmbedUrl;
  };

  const isCloudinary = () => {
    return videoConfig.cloudinaryUrl;
  };


  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
      
      // Para vídeos HTML5, tentar reproduzir automaticamente
      if (!isYouTube() && videoLoaded) {
        const video = document.querySelector(`.${styles.welcomeVideo}`);
        if (video && typeof video.play === 'function') {
          video.play().catch(error => {
            console.log('Auto-play bloqueado pelo navegador:', error);
          });
        }
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isVisible, videoLoaded]);


  const handleVideoLoad = () => {
    setVideoLoaded(true);
    setVideoError(false);
    
    // Para vídeos HTML5, tentar auto-play quando carregar
    if (!isYouTube()) {
      const video = document.querySelector(`.${styles.welcomeVideo}`);
      if (video && typeof video.play === 'function') {
        video.play().catch(error => {
          console.log('Auto-play bloqueado pelo navegador:', error);
        });
      }
    }
  };

  const handleVideoError = () => {
    console.error('Erro ao carregar vídeo:', getVideoUrl());
    setVideoError(true);
    setVideoLoaded(false);
  };


  if (!isVisible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <button 
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Fechar popup de boas-vindas"
        >
          <FaTimes />
        </button>

        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.welcomeIcon}>
              <span>🎉</span>
            </div>
            <h2>¡Bienvenido, {userName}!</h2>
            <p className={styles.subtitle}>
              Estamos emocionados de tenerte aquí. 
              Mira este video de bienvenida para conocer mejor nuestra plataforma.
            </p>
          </div>

          <div className={styles.videoContainer}>
            {!videoLoaded && !videoError && (
              <div className={styles.videoLoader}>
                <div className={styles.spinner}></div>
                <p>Cargando video...</p>
              </div>
            )}
            
            {videoError ? (
              <div className={styles.videoError}>
                <div className={styles.errorIcon}>📹</div>
                <p>Video no disponible temporalmente</p>
                <p className={styles.errorSubtext}>
                  El video de bienvenida no está disponible en este momento.
                </p>
                {isYouTube() && (
                  <a 
                    href={`https://www.youtube.com/watch?v=${videoConfig.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#ff6b35', textDecoration: 'underline' }}
                  >
                    Ver en YouTube
                  </a>
                )}
              </div>
            ) : isYouTube() ? (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <iframe
                  className={`${styles.welcomeVideo} ${styles.youtubeVideo}`}
                  src={`https://www.youtube.com/embed/${videoConfig.youtubeId}?rel=0&modestbranding=1&showinfo=0&controls=1&autoplay=0&mute=0`}
                  title="Video de bienvenida"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  onLoad={() => {
                    setVideoLoaded(true);
                  }}
                  onError={() => {
                    setVideoError(true);
                  }}
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    border: 'none',
                    borderRadius: '10px'
                  }}
                />
                {/* Link alternativo caso o iframe falhe */}
                <div style={{ 
                  position: 'absolute', 
                  bottom: '10px', 
                  right: '10px',
                  zIndex: 10
                }}>
                  <a 
                    href={`https://www.youtube.com/watch?v=${videoConfig.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      color: '#fff', 
                      textDecoration: 'none',
                      fontSize: '12px',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      padding: '5px 10px',
                      borderRadius: '5px'
                    }}
                  >
                    Abrir no YouTube
                  </a>
                </div>
              </div>
            ) : (
              <video
                className={`${styles.welcomeVideo} ${videoLoaded ? styles.loaded : ''}`}
                controls
                muted={isMuted}
                onLoadedData={handleVideoLoad}
                onError={handleVideoError}
              >
                <source src={getVideoUrl()} type="video/mp4" />
                Tu navegador no soporta la reproducción de videos.
              </video>
            )}

          </div>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              ¡Explora todos los recursos disponibles y disfruta de tu experiencia de aprendizaje!
            </p>
            <button 
              className={styles.continueButton}
              onClick={onClose}
            >
              ¡Empezar a explorar!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;
