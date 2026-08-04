import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';
import { FaPlayCircle, FaFileAlt, FaStar, FaHeart, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { getVideos, getDocuments } from '../services/contentService';
import useData from '../hooks/useData';

function HomePage() {
  const { data: videos, loading: videosLoading } = useData(getVideos);
  const { data: documents, loading: documentsLoading } = useData(getDocuments);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoCount = videos?.length || 0;
  const documentCount = documents?.length || 0;

  useEffect(() => {
    // Aguarda os dados carregarem para mostrar a animação
    if (!videosLoading && !documentsLoading) {
      setTimeout(() => setIsLoaded(true), 300); // Delay para animação
    }
  }, [videosLoading, documentsLoading]);

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
          <div
            className={styles.cardBackground}
            style={{
              backgroundImage: `url('/images/aventuras.jpeg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          ></div>
          <FaPlayCircle className={styles.icon} />
          <h2>Videos Divertidos</h2>
          <p className={styles.cardDescription}>Descubre contenido educativo y entretenido</p>
          <div className={styles.cardFooter}>
            <span className={styles.count}>{videoCount} disponibles</span>
          </div>
        </Link>

        <Link to="/documentos" className={`${styles.selectionCard} ${styles.documentCard}`}>
          <div
            className={styles.cardBackground}
            style={{
              backgroundImage: `url('/images/atividades.jpeg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          ></div>
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