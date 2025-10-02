import React from 'react';
import { Link } from 'react-router-dom';
import { getDocuments, deleteDocument } from '../../services/contentService';
import useData from '../../hooks/useData';
import toast from 'react-hot-toast';
import styles from './AdminPages.module.css'; // Usaremos um estilo compartilhado

function ManageDocumentsPage() {
  const [key, setKey] = React.useState(0); 
  const { data: documents, loading, error } = useData(() => getDocuments(), key);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este documento?')) {
      try {
        await deleteDocument(id);
        toast.success('¡Documento eliminado con éxito!');
        setKey(prevKey => prevKey + 1); // Força o recarregamento da lista
      } catch (err) {
        toast.error('No se pudo eliminar el documento.');
      }
    }
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
              {/* <Link to={`/admin/documentos/editar/${doc.id}`} className={styles.editButton}>Editar</Link> */}
              <button onClick={() => handleDelete(doc.id)} className={styles.deleteButton}>Deletar</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ManageDocumentsPage;