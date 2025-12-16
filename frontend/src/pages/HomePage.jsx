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
  const [currentSlide, setCurrentSlide] = useState(0);

  const videoCount = videos?.length || 0;
  const documentCount = documents?.length || 0;

  useEffect(() => {
    // Aguarda os dados carregarem para mostrar a animação
    if (!videosLoading && !documentsLoading) {
      setTimeout(() => setIsLoaded(true), 300); // Delay para animação
    }
  }, [videosLoading, documentsLoading]);

  // Auto-play do carrossel
  useEffect(() => {
    if (isLoaded) {
      const interval = setInterval(() => {
        setCurrentSlide((prevSlide) => (prevSlide + 1) % 2);
      }, 8000); // Muda slide a cada 6 segundos

      return () => clearInterval(interval);
    }
  }, [isLoaded]);

  const goToSlide = (slideIndex) => {
    setCurrentSlide(slideIndex);
  };

  const goToPrevious = () => {
    setCurrentSlide((prevSlide) => (prevSlide - 1 + 2) % 2);
  };

  const goToNext = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % 2);
  };

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

      {/* Carrossel de Banners */}
      <div className={`${styles.carouselContainer} ${isLoaded ? styles.loaded : ''}`}>
        <div className={styles.carouselWrapper}>
          <div 
            className={styles.carouselTrack}
            style={{ transform: `translateX(-${currentSlide * 50}%)` }}
          >
            {/* Slide 1 - Banner Colorea con Fe + Granja Didáctica */}
            <div className={styles.carouselSlide}>
              <div className={`${styles.banner} ${styles.banner1}`}>
                <div className={styles.banner1Stars}></div>
                <div className={styles.banner1StarRight}>⭐</div>
                <div className={styles.banner1Content}>
                  <div className={styles.banner1Left}>
                    <div className={styles.banner1Header}>
                      <div className={styles.banner1Title}>Nuevo complemento del KIT NIÑOS DE LUZ</div>
                      <div className={styles.banner1ProductName}>
                        <span>Colorea con Fe</span>
                        <span className={styles.doveIcon}>🕊️</span>
                        <span>+</span>
                        <span>Granja Didáctica</span>
                        <span className={styles.lambIcon}>🐑</span>
                      </div>
                      <div className={styles.banner1TopRight}>
                        Creatividad, aprendizaje y valores cristianos para tus hijos.
                      </div>
                    </div>
                    
                    <div className={styles.banner1Includes}>
                      <div className={styles.includesTitle}>Incluye:</div>
                      <ul className={styles.includesList}>
                        <li>• 20 dibujos con versículos</li>
                        <li>• Mini Granja Didáctica: aprende sobre los animales, juega y coloréalos</li>
                        <li>• Material imprimible para niños de 3 a 10 años.</li>
                      </ul>
                    </div>

                    <div className={styles.banner1FarmAnimals}>
                      <div className={styles.grassMound}>
                        <div className={styles.rooster}>🐓</div>
                        <div className={styles.pig}>🐷</div>
                      </div>
                    </div>

                    <button 
                      className={styles.banner1CTA}
                      onClick={() => window.open('https://pay.kiwify.com/4V0ZI49', '_blank')}
                    >
                      ¡LO QUIERO AHORA!
                    </button>

                    <div className={styles.banner1BottomText}>
                      Disponible ahora - agrégalo a tu colección con un solo clic
                    </div>
                  </div>

                  <div className={styles.banner1Right}>
                    <div className={styles.productBoxContainer}>
                      <div className={styles.productBox}>
                        <div className={styles.productBoxRibbon}></div>
                        <div className={styles.productBoxTitle}>COLOREA CON FE + GRANJA DIDÁCTICA</div>
                        <div className={styles.productBoxCards}>
                          <div className={styles.productCard}>👦</div>
                          <div className={styles.productCard}>📖</div>
                          <div className={styles.productCard}>🏠</div>
                        </div>
                        <div className={styles.productBoxStar}>⭐</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 2 - Banner App Assinatura Mensal */}
            <div className={styles.carouselSlide}>
              <div className={`${styles.banner} ${styles.banner2}`}>
                <div className={styles.banner2Content}>
                  <div className={styles.banner2Text}>
                    <div className={styles.banner2Badge}>✨ ¡Muy pronto... la gran novedad del año!</div>
                    <div className={styles.banner2Title}>🌟 App Niños de Luz – Fe, juegos y aprendizaje cada mes</div>
                    <div className={styles.banner2Subtitle}>La revolución educativa está llegando</div>
                    <div className={styles.banner2Description}>
                      Imprimibles, juegos interactivos, dibujos animados,<br/>
                      desafíos bíblicos y actividades nuevas cada semana.
                    </div>
                    <div className={styles.banner2Features}>
                      💡 Diseñado para educar, divertir y fortalecer la fe en familia.<br/>
                      📱 Sé parte de la primera comunidad de familias con propósito.<br/>
                      🕊️ Suscríbete para recibir las primeras noticias.
                    </div>
                    <div className={styles.banner2Quote}>
                      ➡️ "Pronto abrirán las puertas… ¿te unes?"
                    </div>
                    <button className={styles.banner2CTA}>
                      Quiero saber más
                    </button>
                  </div>
                  <div className={styles.banner2Visual}>
                    <div className={styles.tablet}></div>
                    <div className={styles.iconsGrid}>
                      <div className={styles.iconItem}>✏️</div>
                      <div className={styles.iconItem}>📖</div>
                      <div className={styles.iconItem}>🎮</div>
                      <div className={styles.iconItem}>❤️</div>
                    </div>
                    <div className={styles.childrenAround}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controles do carrossel */}
          <button 
            className={`${styles.carouselControls} ${styles.prev}`}
            onClick={goToPrevious}
            aria-label="Slide anterior"
          >
            <FaChevronLeft />
          </button>
          <button 
            className={`${styles.carouselControls} ${styles.next}`}
            onClick={goToNext}
            aria-label="Próximo slide"
          >
            <FaChevronRight />
          </button>
        </div>

        {/* Indicadores */}
        <div className={styles.carouselIndicators}>
          {[0, 1].map((index) => (
            <button
              key={index}
              className={`${styles.carouselIndicator} ${currentSlide === index ? styles.active : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Ir para o slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div className={`${styles.selectionGrid} ${isLoaded ? styles.loaded : ''}`}>
        <Link to="/videos" className={`${styles.selectionCard} ${styles.videoCard}`}>
          <div 
            className={styles.cardBackground}
            style={{
              backgroundImage: `url('/images/FundoCard.jpeg')`,
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
              backgroundImage: `url('/images/FundoCard.jpeg')`,
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