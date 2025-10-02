import React from 'react';
import styles from './Card.module.css';
import { FaPlay } from 'react-icons/fa';

// O componente agora recebe a função onPlayClick
function VideoCard({ video, onPlayClick }) {
  return (
    <div className={styles.card}>
      <img src={video.urlImagen} alt={video.titulo} className={styles.image} />
      <div className={styles.content}>
        <h3 className={styles.title}>{video.titulo}</h3>
        <p className={styles.description}>{video.descripcion}</p>
        
        {/* MUDANÇA: 'a' virou 'button', e 'href' virou 'onClick' */}
        <button onClick={onPlayClick} className={styles.button}>
          <span className={styles.buttonContent}>
            <FaPlay /> Ver Video
          </span>
        </button>
      </div>
    </div>
  );
}

export default VideoCard;