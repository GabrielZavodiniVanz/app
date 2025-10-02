import React, { useState } from 'react';
import styles from './Card.module.css';
import { FaPlay, FaHeart, FaRegHeart, FaClock } from 'react-icons/fa';

function VideoCard({ video, onPlayClick, viewMode = 'grid' }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  if (viewMode === 'list') {
    return (
      <div className={`${styles.card} ${styles.listCard}`}>
        <div className={styles.listImageContainer}>
          <img 
            src={video.urlImagen} 
            alt={video.titulo} 
            className={`${styles.listImage} ${imageLoaded ? styles.loaded : ''}`}
            onLoad={() => setImageLoaded(true)}
          />
          <div className={styles.playOverlay}>
            <FaPlay />
          </div>
        </div>
        
        <div className={styles.listContent}>
          <h3 className={styles.title}>{video.titulo}</h3>
          <p className={styles.description}>{video.descripcion}</p>
          
          <div className={styles.listActions}>
            <button onClick={onPlayClick} className={styles.playButton}>
              <FaPlay /> Ver Video
            </button>
            <button 
              onClick={handleFavoriteClick} 
              className={`${styles.favoriteButton} ${isFavorite ? styles.favorited : ''}`}
            >
              {isFavorite ? <FaHeart /> : <FaRegHeart />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${styles.gridCard}`}>
      <div className={styles.imageContainer}>
        <img 
          src={video.urlImagen} 
          alt={video.titulo} 
          className={`${styles.image} ${imageLoaded ? styles.loaded : ''}`}
          onLoad={() => setImageLoaded(true)}
        />
        
        {!imageLoaded && <div className={styles.imageSkeleton}></div>}
        
        <div className={styles.imageOverlay}>
          <button onClick={onPlayClick} className={styles.playButtonOverlay}>
            <FaPlay />
          </button>
          <button 
            onClick={handleFavoriteClick} 
            className={`${styles.favoriteButtonOverlay} ${isFavorite ? styles.favorited : ''}`}
          >
            {isFavorite ? <FaHeart /> : <FaRegHeart />}
          </button>
        </div>
        
        <div className={styles.duration}>
          <FaClock /> 5:30
        </div>
      </div>
      
      <div className={styles.content}>
        <h3 className={styles.title}>{video.titulo}</h3>
        <p className={styles.description}>{video.descripcion}</p>
        
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