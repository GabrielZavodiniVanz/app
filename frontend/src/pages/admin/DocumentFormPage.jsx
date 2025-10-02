import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDocument } from '../../services/contentService';
import toast from 'react-hot-toast';
import styles from './AdminPages.module.css';

function DocumentFormPage() {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [imageFile, setImageFile] = useState(null); // NOVO
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!docFile) {
      toast.error('Por favor, selecione um arquivo de documento.');
      return;
    }
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('descripcion', descripcion);
    formData.append('docFile', docFile); // Nome do campo atualizado

    // Adiciona a imagem de capa (se existir)
    if (imageFile) {
      formData.append('imageFile', imageFile);
    }

    try {
      await createDocument(formData);
      toast.success('¡Documento agregado con éxito!');
      navigate('/admin/documentos');
    } catch (err) {
      toast.error('Error al agregar el documento.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.adminContainer}>
      <h1>Adicionar Novo Documento</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="titulo">Título</label>
          <input type="text" id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="descripcion">Descrição</label>
          <textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows="4" />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="docFile">Arquivo (PDF, etc.)</label>
          <input type="file" id="docFile" accept="application/pdf,image/*" onChange={(e) => setDocFile(e.target.files[0])} required />
        </div>
        {/* NOVO CAMPO PARA IMAGEM */}
        <div className={styles.formGroup}>
          <label htmlFor="imageFile">Imagem de Capa (Opcional)</label>
          <input type="file" id="imageFile" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
        </div>
        <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
          {isSubmitting ? 'Enviando...' : 'Salvar Documento'}
        </button>
      </form>
    </div>
  );
}

export default DocumentFormPage;