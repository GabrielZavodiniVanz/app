import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDocuments, updateDocument, deleteDocument } from '../../services/contentService';
import FileManager from '../../components/FileManager';
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
  const [currentDocument, setCurrentDocument] = useState(null);

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
        setCurrentDocument(document);
        
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

  const handleDeleteDocument = async () => {
    try {
      // Atualizar o documento removendo apenas o arquivo
      const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('descripcion', descripcion);
      formData.append('removeDocument', 'true');
      
      await updateDocument(id, formData);
      
      // Atualizar o estado local
      setCurrentDocument(prev => ({ ...prev, urlDocumento: null }));
      toast.success('Arquivo removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
      toast.error('Erro ao remover arquivo');
    }
  };

  const handleDeleteImage = async () => {
    try {
      // Atualizar o documento removendo a imagem
      const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('descripcion', descripcion);
      formData.append('removeImage', 'true');
      
      await updateDocument(id, formData);
      
      // Atualizar o estado local
      setCurrentDocument(prev => ({ ...prev, urlImagen: null }));
      toast.success('Imagem removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      toast.error('Erro ao remover imagem');
    }
  };

  const handleDownloadDocument = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/content/documentos/${id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao baixar documento');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${titulo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Erro no download:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    console.log('🔄 Iniciando atualização do documento:', { docFile, imageFile });

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('descripcion', descripcion);

    // Adiciona o arquivo do documento (se um novo foi selecionado)
    if (docFile) {
      console.log('📄 Adicionando novo documento:', docFile.name);
      formData.append('docFile', docFile);
    }

    // Adiciona a imagem de capa (se uma nova foi selecionada)
    if (imageFile) {
      console.log('🖼️ Adicionando nova imagem:', imageFile.name);
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

        {/* Gerenciador de Arquivo do Documento */}
        <FileManager
          currentFileUrl={currentDocument?.urlDocumento}
          currentFileName={`${currentDocument?.titulo || 'documento'}.pdf`}
          fileType="document"
          accept="application/pdf,image/*"
          onFileChange={(file) => setDocFile(file)}
          onDelete={handleDeleteDocument}
          onDownload={handleDownloadDocument}
          showPreview={false}
          label="Arquivo (PDF, etc.)"
          placeholder="Escolher arquivo"
        />

        {/* Gerenciador de Imagem de Capa */}
        <FileManager
          currentFileUrl={currentDocument?.urlImagen}
          currentFileName="Imagem de capa"
          fileType="image"
          accept="image/*"
          onFileChange={(file) => setImageFile(file)}
          onDelete={handleDeleteImage}
          showPreview={true}
          label="Imagem de Capa (Opcional)"
          placeholder="Escolher imagem"
        />
        
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
