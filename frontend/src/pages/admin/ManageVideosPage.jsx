import React from 'react';
import { Link } from 'react-router-dom';
import { getVideos, deleteVideo } from '../../services/contentService';
import useData from '../../hooks/useData';
import toast from 'react-hot-toast';
import styles from './AdminPages.module.css'; // Importa nosso estilo de admin

function ManageVideosPage() {
  // O 'key' é uma forma de forçar o hook a recarregar os dados após uma deleção
  const [key, setKey] = React.useState(0); 
  const { data: videos, loading, error } = useData(() => getVideos(), key);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este video?')) {
      try {
        await deleteVideo(id);
        toast.success('¡Video eliminado con éxito!');
        setKey(prevKey => prevKey + 1); // Força o recarregamento da lista
      } catch (err) {
        toast.error('No se pudo eliminar el video.');
      }
    }
  };

  return (
    <div className={styles.adminContainer}>
      <div className={styles.header}>
        <h1>Gestionar Videos</h1>
        <Link to="/admin/videos/novo" className={styles.addButton}>
          + Adicionar Novo Vídeo
        </Link>
      </div>
      
      {loading && <p>Carregando vídeos...</p>}
      {error && <p className={styles.error}>{error}</p>}
      
      <ul className={styles.list}>
        {videos && videos.length > 0 ? videos.map(video => (
          <li key={video.id} className={styles.listItem}>
            <span>{video.titulo}</span>
            <div className={styles.actions}>
              {/* O Link de Editar está comentado para implementação futura */}
              {/* <Link to={`/admin/videos/editar/${video.id}`} className={styles.editButton}>Editar</Link> */}
              <button onClick={() => handleDelete(video.id)} className={styles.deleteButton}>Deletar</button>
            </div>
          </li>
        )) : (
          !loading && <p>Nenhum vídeo encontrado.</p>
        )}
      </ul>
    </div>
  );
}

export default ManageVideosPage;