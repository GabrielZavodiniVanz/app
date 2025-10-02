import React from 'react';
import { Link } from 'react-router-dom';
import { getDocuments, deleteDocument } from '../../services/contentService';
import useData from '../../hooks/useData';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import styles from './AdminPages.module.css'; // Usaremos um estilo compartilhado

function ManageDocumentsPage() {
  const [key, setKey] = React.useState(0); 
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [documentToDelete, setDocumentToDelete] = React.useState(null);
  const { data: documents, loading, error } = useData(() => getDocuments(), key);

  const handleDeleteClick = (document) => {
    setDocumentToDelete(document);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (documentToDelete) {
      try {
        await deleteDocument(documentToDelete.id);
        toast.success('¡Documento eliminado con éxito!');
        setKey(prevKey => prevKey + 1); // Força o recarregamento da lista
      } catch (err) {
        toast.error('No se pudo eliminar el documento.');
      }
    }
    setShowConfirmModal(false);
    setDocumentToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setDocumentToDelete(null);
  };

  return (
    <div className={styles.adminContainer}>
      <div className={styles.header}>
        <h1>Gestionar Documentos</h1>
        <Link to="/admin/documentos/novo" className={styles.addButton}>
          + Adicionar Novo Documento
        </Link>
      </div>
      
      {loading && <p>Carregando documentos...</p>}
      {error && <p className={styles.error}>{error}</p>}
      
      <ul className={styles.list}>
        {documents && documents.map(doc => (
          <li key={doc.id} className={styles.listItem}>
            <span>{doc.titulo}</span>
            <div className={styles.actions}>
              <Link to={`/admin/documentos/editar/${doc.id}`} className={styles.editButton}>Editar</Link>
              <button onClick={() => handleDeleteClick(doc)} className={styles.deleteButton}>Deletar</button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmModal
        isOpen={showConfirmModal}
        title="Confirmar Exclusão"
        message={`¿Estás seguro de que quieres eliminar el documento "${documentToDelete?.titulo}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="delete"
      />
    </div>
  );
}

export default ManageDocumentsPage;