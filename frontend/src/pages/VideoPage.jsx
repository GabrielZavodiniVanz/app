import React, { useState, useMemo } from 'react';
import { getVideos } from '../services/contentService';
import useData from '../hooks/useData';

import VideoCard from '../components/VideoCard.jsx';
import VideoModal from '../components/VideoModal.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { FaSearch, FaFilter, FaTh, FaList, FaSortAmountDown } from 'react-icons/fa';
import styles from '../App.module.css';
import pageStyles from './VideoPage.module.css';

function VideoPage() {
  const { data: videos, loading, error } = useData(getVideos);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');

  // Filtrar e ordenar vídeos
  const filteredAndSortedVideos = useMemo(() => {
    if (!videos) return [];
    
    let filtered = videos.filter(video =>
      (video.titulo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (video.descripcion?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    // Ordenação
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        break;
      case 'alphabetical':
        filtered.sort((a, b) => (a.titulo || '').localeCompare(b.titulo || ''));
        break;
      default:
        break;
    }

    return filtered;
  }, [videos, searchTerm, sortBy]);

  const renderContent = () => {
    if (loading) return <SkeletonLoader type="card" count={6} />;
    if (error) return <p style={{ textAlign: 'center', color: '#b91c1c' }}>{error}</p>;
    if (!filteredAndSortedVideos || filteredAndSortedVideos.length === 0) {
      return searchTerm ? 
        <EmptyState message={`No se encontraron videos para "${searchTerm}"`} /> :
        <EmptyState message="¡No hay videos disponibles!" />;
    }
    
    return (
      <div className={viewMode === 'grid' ? styles.grid : pageStyles.listView}>
        {filteredAndSortedVideos.map(video => (
          <VideoCard 
            key={video.id} 
            video={video} 
            onPlayClick={() => setSelectedVideo(video.urlVideo)}
            viewMode={viewMode}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={pageStyles.pageContainer}>
      <div className={pageStyles.pageHeader}>
        <h2 className={pageStyles.pageTitle}>
          Nuestros Videos Educativos
        </h2>
        <p className={pageStyles.pageSubtitle}>
          {videos ? `${filteredAndSortedVideos.length} de ${videos.length} videos` : 'Cargando...'}
        </p>
      </div>

      <div className={pageStyles.controls}>
        <div className={pageStyles.searchContainer}>
          <FaSearch className={pageStyles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={pageStyles.searchInput}
          />
        </div>

        <div className={pageStyles.filterControls}>
          <div className={pageStyles.sortContainer}>
            <FaSortAmountDown className={pageStyles.sortIcon} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={pageStyles.sortSelect}
            >
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguos</option>
              <option value="alphabetical">A-Z</option>
            </select>
          </div>

          <div className={pageStyles.viewToggle}>
            <button
              className={`${pageStyles.viewButton} ${viewMode === 'grid' ? pageStyles.active : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <FaTh />
            </button>
            <button
              className={`${pageStyles.viewButton} ${viewMode === 'list' ? pageStyles.active : ''}`}
              onClick={() => setViewMode('list')}
            >
              <FaList />
            </button>
          </div>
        </div>
      </div>
      
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