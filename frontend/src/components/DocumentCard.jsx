import React, { useState } from 'react';
import styles from './Card.module.css';
import { FaDownload } from 'react-icons/fa';

/**
 * VERSÃO CORRIGIDA da função que modifica a URL do Cloudinary para forçar o download.
 * Ela encontra o segmento '/upload/' e insere 'fl_attachment/' logo depois.
 */
function getCloudinaryDownloadUrl(url) {
  if (!url || !url.includes('/upload/')) {
    return url;
  }
  
  // Encontra o índice onde '/upload/' termina
  const uploadIndex = url.indexOf('/upload/') + '/upload/'.length;
  
  // Divide a URL em duas partes: antes e depois de '/upload/'
  const baseUrl = url.substring(0, uploadIndex);
  const restOfUrl = url.substring(uploadIndex);

  // Insere o flag de download entre as duas partes
  return `${baseUrl}fl_attachment/${restOfUrl}`;
}


function DocumentCard({ document, viewMode = 'grid' }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Gera a URL de download forçado com a nova função
  const downloadUrl = getCloudinaryDownloadUrl(document.urlDocumento);

  const originalUrl = document.urlDocumento || '';
  const extension = originalUrl.split('.').pop().split('?')[0] || 'file';
  
  // 2. Cria um nome de arquivo limpo a partir do título, substituindo espaços por '_'.
  const filename = `${document.titulo.replace(/[\s/]/g, '_')}.${extension}`;
  // -----------------------------

  if (viewMode === 'list') {
    return (
      <div className={`${styles.card} ${styles.listCard}`}>
        <div className={styles.listImageContainer}>
          {document.urlImagen ? (
            <img 
              src={document.urlImagen} 
              alt={document.titulo} 
              className={`${styles.listImage} ${imageLoaded ? styles.loaded : ''}`}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className={styles.iconWrapper} style={{ width: '100%', height: '100%', fontSize: '2rem' }}>📄</div>
          )}
        </div>
        
        <div className={styles.listContent}>
          <h3 className={styles.title}>{document.titulo}</h3>
          <p className={styles.description}>{document.descripcion}</p>
          
          <div className={styles.listActions}>
            <a 
              href={downloadUrl}
              download
              rel="noopener noreferrer" 
              className={styles.downloadButton}
            >
              <FaDownload /> Descargar
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${styles.gridCard}`}>
      {document.urlImagen ? (
        <div className={styles.imageContainer}>
          <img 
            src={document.urlImagen} 
            alt={document.titulo} 
            className={`${styles.image} ${imageLoaded ? styles.loaded : ''}`}
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && <div className={styles.imageSkeleton}></div>}
        </div>
      ) : (
        <div className={styles.iconWrapper}>📄</div>
      )}
      <div className={styles.content}>
        <h3 className={styles.title}>{document.titulo}</h3>
        <p className={styles.description}>{document.descripcion}</p>
        
        {/* Voltamos a usar um link '<a>' simples, mas com a URL corrigida */}
        <a 
          href={downloadUrl}
          // O atributo 'download' ajuda, mas o 'fl_attachment' na URL é o que realmente força
          download
          rel="noopener noreferrer" 
          className={styles.downloadButton}
        >
          <span className={styles.buttonContent}>
            <FaDownload /> Descargar
          </span>
        </a>
      </div>
    </div>
  );
}

export default DocumentCard;