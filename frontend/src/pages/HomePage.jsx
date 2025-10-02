import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';
import { FaPlayCircle, FaFileAlt, FaStar, FaHeart } from 'react-icons/fa';
import { getVideos, getDocuments } from '../services/contentService';

function HomePage() {
  const [videoCount, setVideoCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [videos, documents] = await Promise.all([
          getVideos(),
          getDocuments()
        ]);
        setVideoCount(videos?.length || 0);
        setDocumentCount(documents?.length || 0);
      } catch (error) {
        console.error('❌ Erro ao buscar dados:', error);
        console.error('❌ Detalhes do erro:', error.response?.data || error.message);
      } finally {
        setTimeout(() => setIsLoaded(true), 300); // Delay para animação
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className={styles.homeContainer}>
      <div className={styles.particles}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`${styles.particle} ${styles[`particle${i + 1}`]}`}>
            {i % 3 === 0 ? <FaStar /> : i % 3 === 1 ? <FaHeart /> : <FaPlayCircle />}
          </div>
        ))}
      </div>
      
      <div className={`${styles.hero} ${isLoaded ? styles.loaded : ''}`}>
        <h1 className={styles.title}>¡Bienvenido al Mundo Mágico!</h1>
        <p className={styles.subtitle}>¿Qué aventura quieres empezar hoy?</p>
        
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{videoCount}</span>
            <span className={styles.statLabel}>Videos</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{documentCount}</span>
            <span className={styles.statLabel}>Documentos</span>
          </div>
        </div>
      </div>

      <div className={`${styles.selectionGrid} ${isLoaded ? styles.loaded : ''}`}>
        <Link to="/videos" className={`${styles.selectionCard} ${styles.videoCard}`}>
          <div className={styles.cardBackground}></div>
          <FaPlayCircle className={styles.icon} />
          <h2>Videos Divertidos</h2>
          <p className={styles.cardDescription}>Descubre contenido educativo y entretenido</p>
          <div className={styles.cardFooter}>
            <span className={styles.count}>{videoCount} disponibles</span>
          </div>
        </Link>
        
        <Link to="/documentos" className={`${styles.selectionCard} ${styles.documentCard}`}>
          <div className={styles.cardBackground}></div>
          <FaFileAlt className={styles.icon} />
          <h2>Actividades para Imprimir</h2>
          <p className={styles.cardDescription}>Materiales educativos para descargar</p>
          <div className={styles.cardFooter}>
            <span className={styles.count}>{documentCount} disponibles</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default HomePage;