import React from 'react';
import styles from './VideoModal.module.css';
import { FaTimes } from 'react-icons/fa';

// A função para extrair o ID do YouTube continua a mesma
function getYouTubeEmbedUrl(url) {
  if (!url) return '';
  let videoId = '';
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  
  if (match) {
    videoId = match[1];
  }

  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
}


function VideoModal({ videoUrl, onClose }) {
  // NOVO: Verificamos se a URL é do YouTube
  const isYouTubeUrl = videoUrl && /youtube\.com|youtu\.be/.test(videoUrl);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <FaTimes />
        </button>
        <div className={styles.videoContainer}>
          {isYouTubeUrl ? (
            // Cenário 1: Se for YouTube, renderiza o iframe
            <iframe
              src={getYouTubeEmbedUrl(videoUrl)}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            // Cenário 2: Se for qualquer outra coisa (Cloudinary), renderiza a tag <video>
            <video
              src={videoUrl}
              controls // Mostra os controles de play, pause, volume
              autoPlay // Tenta iniciar o vídeo automaticamente
              className={styles.nativePlayer}
            ></video>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoModal;