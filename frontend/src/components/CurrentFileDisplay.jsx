import React, { useState } from 'react';
import { FaFilePdf, FaFileImage, FaFileVideo, FaTrash, FaDownload, FaEye } from 'react-icons/fa';
import styles from './CurrentFileDisplay.module.css';

function CurrentFileDisplay({ 
  fileUrl, 
  fileName, 
  fileType, 
  onDelete, 
  onDownload,
  showPreview = false,
  className = ''
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!fileUrl) return null;

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir este arquivo?`)) {
      setIsDeleting(true);
      try {
        await onDelete();
      } catch (error) {
        console.error('Erro ao excluir arquivo:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Download direto
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName || 'arquivo';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreview = () => {
    window.open(fileUrl, '_blank');
  };

  const getFileIcon = () => {
    if (fileType === 'document' || fileName?.toLowerCase().includes('.pdf')) {
      return <FaFilePdf className={styles.icon} />;
    } else if (fileType === 'image' || fileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return <FaFileImage className={styles.icon} />;
    } else if (fileType === 'video' || fileName?.toLowerCase().match(/\.(mp4|mov|avi|webm)$/)) {
      return <FaFileVideo className={styles.icon} />;
    }
    return <FaFilePdf className={styles.icon} />;
  };

  const getFileTypeLabel = () => {
    if (fileType === 'document' || fileName?.toLowerCase().includes('.pdf')) {
      return 'Documento PDF';
    } else if (fileType === 'image') {
      return 'Imagem';
    } else if (fileType === 'video') {
      return 'Vídeo';
    }
    return 'Arquivo';
  };

  return (
    <div className={`${styles.currentFile} ${className}`}>
      <div className={styles.fileInfo}>
        {getFileIcon()}
        <div className={styles.fileDetails}>
          <span className={styles.fileType}>{getFileTypeLabel()}</span>
          <span className={styles.fileName}>{fileName || 'Arquivo atual'}</span>
        </div>
      </div>
      
      <div className={styles.fileActions}>
        {showPreview && (
          <button 
            type="button"
            onClick={handlePreview}
            className={styles.previewButton}
            title="Visualizar arquivo"
          >
            <FaEye />
          </button>
        )}
        
        <button 
          type="button"
          onClick={handleDownload}
          className={styles.downloadButton}
          title="Baixar arquivo"
        >
          <FaDownload />
        </button>
        
        <button 
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className={styles.deleteButton}
          title="Excluir arquivo"
        >
          <FaTrash />
          {isDeleting && <span className={styles.loading}>...</span>}
        </button>
      </div>
    </div>
  );
}

export default CurrentFileDisplay;
