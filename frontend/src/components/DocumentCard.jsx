import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Card.module.css';
import { FaDownload, FaEdit } from 'react-icons/fa';

function DocumentCard({ document, viewMode = 'grid' }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // Função para lidar com o download usando a API do backend
  const handleDownload = async (e) => {
    e.preventDefault();
    
    if (isDownloading) return;
    
    try {
      setIsDownloading(true);
      
      const token = localStorage.getItem('token');
      
      // Verificar se o usuário está logado
      if (!token) {
        alert('Você precisa fazer login para baixar documentos.');
        window.location.href = '/login';
        return;
      }
      
      // Usar fetch diretamente (mesmo código que funcionou no teste)
      const response = await fetch(`http://localhost:3001/api/content/documentos/${document.id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Criar URL temporária para o blob
      const url = window.URL.createObjectURL(blob);
      
      // Verificar se o DOM está disponível
      if (typeof window === 'undefined' || !window.document) {
        throw new Error('DOM não está disponível');
      }
      
      // Criar elemento <a> temporário para download
      const link = window.document.createElement('a');
      link.href = url;
      
      // O backend já define o nome correto no Content-Disposition
      // Vamos usar um nome padrão baseado no título do documento
      const filename = `${document.titulo.replace(/[\s/\\:*?"<>|]/g, '_')}.pdf`;
      
      link.download = filename;
      link.style.display = 'none';
      window.document.body.appendChild(link);
      link.click();
      
      // Limpar após um pequeno delay
      setTimeout(() => {
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      
      let errorMessage = 'Erro ao baixar o documento. Tente novamente.';
      
      if (error.message.includes('Token de autenticação não encontrado')) {
        errorMessage = 'Você precisa fazer login para baixar documentos.';
        // Redirecionar para login
        window.location.href = '/login';
        return;
      } else if (error.message.includes('401')) {
        errorMessage = 'Sua sessão expirou. Faça login novamente.';
        // Limpar token e redirecionar
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      } else if (error.message.includes('404')) {
        errorMessage = 'Documento não encontrado.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

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
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className={styles.downloadButton}
            >
              <FaDownload /> {isDownloading ? 'Descargando...' : 'Descargar'}
            </button>
            {isAdmin && (
              <Link to={`/admin/documentos/editar/${document.id}`} className={styles.editButton}>
                <FaEdit /> Editar
              </Link>
            )}
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
        
        <div className={styles.cardActions}>
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className={styles.downloadButton}
          >
            <span className={styles.buttonContent}>
              <FaDownload /> {isDownloading ? 'Descargando...' : 'Descargar'}
            </span>
          </button>
          {isAdmin && (
            <Link to={`/admin/documentos/editar/${document.id}`} className={styles.editButton}>
              <FaEdit /> Editar
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentCard;