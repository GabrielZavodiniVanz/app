import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDocuments, updateDocument } from '../../services/contentService';
import toast from 'react-hot-toast';
import styles from './AdminPages.module.css';

function EditDocumentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const documents = await getDocuments();
        const document = documents.find(d => d.id === parseInt(id));
        
        if (!document) {
          toast.error('Documento não encontrado');
          navigate('/admin/documentos');
          return;
        }

        setTitulo(document.titulo || '');
        setDescripcion(document.descripcion || '');
        
      } catch (error) {
        console.error('Erro ao carregar documento:', error);
        toast.error('Erro ao carregar dados do documento');
        navigate('/admin/documentos');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('descripcion', descripcion);

    // Adiciona o arquivo do documento (se um novo foi selecionado)
    if (docFile) {
      formData.append('docFile', docFile);
    }

    // Adiciona a imagem de capa (se uma nova foi selecionada)
    if (imageFile) {
      formData.append('imageFile', imageFile);
    }

    try {
      await updateDocument(id, formData);
      toast.success('¡Documento actualizado con éxito!');
      navigate('/admin/documentos');
    } catch (err) {
      toast.error('Error al actualizar el documento.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.adminContainer}>
        <p>Carregando dados do documento...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <h1>Editar Documento</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="titulo">Título</label>
          <input 
            type="text" 
            id="titulo" 
            value={titulo} 
            onChange={(e) => setTitulo(e.target.value)} 
            required 
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="descripcion">Descrição</label>
          <textarea 
            id="descripcion" 
            value={descripcion} 
            onChange={(e) => setDescripcion(e.target.value)} 
            rows="4" 
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="docFile">Arquivo (PDF, etc.)</label>
          <input 
            type="file" 
            id="docFile" 
            accept="application/pdf,image/*" 
            onChange={(e) => setDocFile(e.target.files[0])} 
          />
          <small>Deixe em branco para manter o arquivo atual</small>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="imageFile">Imagem de Capa (Opcional)</label>
          <input 
            type="file" 
            id="imageFile" 
            accept="image/*" 
            onChange={(e) => setImageFile(e.target.files[0])} 
          />
          <small>Deixe em branco para manter a imagem atual</small>
        </div>
        
        <div className={styles.formActions}>
          <button 
            type="button" 
            onClick={() => navigate('/admin/documentos')} 
            className={styles.cancelButton}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className={styles.submitButton}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditDocumentPage;
