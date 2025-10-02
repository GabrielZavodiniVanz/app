import React from 'react';
import { getDocuments } from '../services/contentService'; // Importa a função de buscar documentos
import useData from '../hooks/useData'; // Reutiliza o MESMO Hook

import DocumentCard from '../components/DocumentCard.jsx';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import styles from '../App.module.css';

function DocumentPage() {
  // A mesma mágica, mas agora passando a função 'getDocuments'
  const { data: documents, loading, error } = useData(getDocuments);

  const renderContent = () => {
    if (loading) return <Spinner />;
    if (error) return <p style={{ textAlign: 'center', color: '#b91c1c' }}>{error}</p>;
    if (!documents || documents.length === 0) return <EmptyState message="¡No hay documentos disponibles!" />;

    return (
      <div className={styles.grid}>
        {documents.map(documento => (
          <DocumentCard key={documento.id} document={documento} />
        ))}
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--primary-color)' }}>
        Actividades y Documentos
      </h2>
      
      {renderContent()}
    </div>
  );
}

export default DocumentPage;