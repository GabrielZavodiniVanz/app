import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import styles from './WelcomePopup.module.css';

const WelcomePopup = ({ isVisible, onClose, userName }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);


  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
      
      // Tentar reproduzir o vídeo automaticamente quando o popup aparecer
      const video = document.querySelector(`.${styles.welcomeVideo}`);
      if (video && videoLoaded) {
        video.play().catch(error => {
          console.log('Auto-play bloqueado pelo navegador:', error);
        });
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
    
    // Auto-play do vídeo quando carregar
    const video = document.querySelector(`.${styles.welcomeVideo}`);
    if (video) {
      video.play().catch(error => {
        console.log('Auto-play bloqueado pelo navegador:', error);
      });
    }
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
            {!videoLoaded && (
              <div className={styles.videoLoader}>
                <div className={styles.spinner}></div>
                <p>Cargando video...</p>
              </div>
            )}
            
            <video
              className={`${styles.welcomeVideo} ${videoLoaded ? styles.loaded : ''}`}
              controls
              muted={isMuted}
              onLoadedData={handleVideoLoad}
            >
              <source src="/videos/welcome-video.mp4" type="video/mp4" />
              Tu navegador no soporta la reproducción de videos.
            </video>

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
