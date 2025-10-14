import React, { useState } from 'react';
import { FaFilePdf, FaFileImage, FaFileVideo, FaTrash, FaDownload, FaEye, FaUpload, FaPlus } from 'react-icons/fa';
import styles from './FileManager.module.css';

function FileManager({ 
  currentFileUrl,
  currentFileName,
  fileType,
  accept,
  onFileChange,
  onDelete,
  onDownload,
  showPreview = false,
  label = "Arquivo",
  placeholder = "Escolher arquivo"
}) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      console.log('📁 Arquivo selecionado via drag & drop:', file.name);
      setSelectedFile(file);
      onFileChange(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInput = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log('📁 Arquivo selecionado via input:', file.name);
      setSelectedFile(file);
      onFileChange(file);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir este arquivo?`)) {
      try {
        await onDelete();
      } catch (error) {
        console.error('Erro ao excluir arquivo:', error);
      }
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (currentFileUrl) {
      // Download direto
      const link = document.createElement('a');
      link.href = currentFileUrl;
      link.download = currentFileName || 'arquivo';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreview = () => {
    if (currentFileUrl) {
      window.open(currentFileUrl, '_blank');
    }
  };

  const getFileIcon = () => {
    if (fileType === 'document' || currentFileName?.toLowerCase().includes('.pdf')) {
      return <FaFilePdf className={styles.fileIcon} />;
    } else if (fileType === 'image' || currentFileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return <FaFileImage className={styles.fileIcon} />;
    } else if (fileType === 'video' || currentFileName?.toLowerCase().match(/\.(mp4|mov|avi|webm)$/)) {
      return <FaFileVideo className={styles.fileIcon} />;
    }
    return <FaFilePdf className={styles.fileIcon} />;
  };

  const getFileTypeLabel = () => {
    if (fileType === 'document' || currentFileName?.toLowerCase().includes('.pdf')) {
      return 'DOCUMENTO PDF';
    } else if (fileType === 'image') {
      return 'IMAGEM';
    } else if (fileType === 'video') {
      return 'VÍDEO';
    }
    return 'ARQUIVO';
  };

  return (
    <div className={styles.fileManager}>
      <label className={styles.label}>{label}</label>
      
      {/* Área de upload */}
      <div 
        className={`${styles.uploadArea} ${dragOver ? styles.dragOver : ''} ${selectedFile ? styles.hasFile : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className={styles.uploadContent}>
          <FaUpload className={styles.uploadIcon} />
          <p className={styles.uploadText}>
            Arraste um arquivo aqui ou
            <label htmlFor={`file-input-${fileType}`} className={styles.uploadButton}>
              escolha um arquivo
            </label>
          </p>
          <small className={styles.uploadHint}>
            {selectedFile 
              ? `Arquivo selecionado: ${selectedFile.name}` 
              : currentFileUrl 
                ? 'Selecione um novo arquivo para substituir o atual' 
                : 'Nenhum arquivo selecionado'
            }
          </small>
        </div>
        
        <input
          id={`file-input-${fileType}`}
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className={styles.hiddenInput}
        />
      </div>

      {/* Arquivo atual */}
      {currentFileUrl && (
        <div className={styles.currentFile}>
          <div className={styles.fileInfo}>
            {getFileIcon()}
            <div className={styles.fileDetails}>
              <span className={styles.fileType}>{getFileTypeLabel()}</span>
              <span className={styles.fileName}>{currentFileName || 'Arquivo atual'}</span>
            </div>
          </div>
          
          <div className={styles.fileActions}>
            {showPreview && (
              <button 
                type="button"
                onClick={handlePreview}
                className={styles.actionButton}
                title="Visualizar arquivo"
              >
                <FaEye />
              </button>
            )}
            
            <button 
              type="button"
              onClick={handleDownload}
              className={`${styles.actionButton} ${styles.downloadButton}`}
              title="Baixar arquivo"
            >
              <FaDownload />
            </button>
            
            <button 
              type="button"
              onClick={handleDelete}
              className={`${styles.actionButton} ${styles.deleteButton}`}
              title="Excluir arquivo"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      )}

      {/* Área de upload sempre visível quando não há arquivo atual */}
      {!currentFileUrl && (
        <div className={styles.noFileMessage}>
          <p>Nenhum arquivo carregado. Use a área acima para fazer upload de um novo arquivo.</p>
        </div>
      )}
    </div>
  );
}

export default FileManager;
