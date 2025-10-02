import React, { useState } from 'react';
import { getVideos } from '../services/contentService'; // Importa a função do serviço
import useData from '../hooks/useData'; // Importa nosso novo Hook

import VideoCard from '../components/VideoCard.jsx';
import VideoModal from '../components/VideoModal.jsx';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import styles from '../App.module.css';

function VideoPage() {
  // A MÁGICA ACONTECE AQUI!
  // Toda a lógica de busca de dados, loading e erro agora está nesta única linha.
  const { data: videos, loading, error } = useData(getVideos);

  const [selectedVideo, setSelectedVideo] = useState(null);

  const renderContent = () => {
    if (loading) return <Spinner />;
    if (error) return <p style={{ textAlign: 'center', color: '#b91c1c' }}>{error}</p>;
    if (!videos || videos.length === 0) return <EmptyState message="¡No hay videos disponibles!" />;
    
    return (
      <div className={styles.grid}>
        {videos.map(video => (
          <VideoCard 
            key={video.id} 
            video={video} 
            onPlayClick={() => setSelectedVideo(video.urlVideo)}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--primary-color)' }}>
        Nuestros Videos Educativos
      </h2>
      
      {renderContent()}

      {selectedVideo && (
        <VideoModal 
          videoUrl={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
        />
      )}
    </div>
  );
}

export default VideoPage;