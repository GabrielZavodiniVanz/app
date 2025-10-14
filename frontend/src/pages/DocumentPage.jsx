import React, { useState, useMemo } from 'react';
import { getDocuments } from '../services/contentService';
import useData from '../hooks/useData';
import useGroupedContent from '../hooks/useGroupedContent';

import DocumentCard from '../components/DocumentCard.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { FaSearch, FaFilter, FaTh, FaList, FaSortAmountDown, FaBars, FaFolder, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import styles from '../App.module.css';
import pageStyles from './DocumentPage.module.css';

function DocumentPage() {
  const { data: documents, loading, error } = useData(getDocuments);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [layout, setLayout] = useState('accordion'); // apenas accordion

  // Filtrar e ordenar documentos
  const filteredAndSortedDocuments = useMemo(() => {
    if (!documents) return [];
    
    let filtered = documents.filter(document =>
      (document.titulo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (document.descripcion?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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
  }, [documents, searchTerm, sortBy]);

  // Agrupar documentos por categoria
  const { groupedContent, sortedCategories } = useGroupedContent([], filteredAndSortedDocuments);

  // Componente de layout em acordeão

  const AccordionLayout = ({ groupedContent, sortedCategories, viewMode }) => {
    const [expandedCategories, setExpandedCategories] = useState(new Set());
    
    const toggleCategory = (index) => {
      const newExpanded = new Set(expandedCategories);
      if (newExpanded.has(index)) {
        newExpanded.delete(index);
      } else {
        newExpanded.add(index);
      }
      setExpandedCategories(newExpanded);
    };
    
    return (
      <div className={pageStyles.accordionContainer}>
        {sortedCategories.map((categoryKey, index) => {
          const category = groupedContent[categoryKey];
          const isExpanded = expandedCategories.has(index);
          
          return (
            <div key={categoryKey} className={pageStyles.accordionItem}>
              <button
                className={`${pageStyles.accordionHeader} ${isExpanded ? pageStyles.expanded : ''}`}
                onClick={() => toggleCategory(index)}
              >
                <div className={pageStyles.accordionTitle}>
                  <FaFolder className={pageStyles.accordionIcon} />
                  <span className={pageStyles.accordionName}>{category.name}</span>
                  <span className={pageStyles.accordionCount}>({category.documents.length})</span>
                </div>
                {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
              </button>
              
              {isExpanded && (
                <div className={pageStyles.accordionContent}>
                  <div className={viewMode === 'grid' ? styles.grid : pageStyles.listView}>
                    {category.documents.map(document => (
                      <DocumentCard 
                        key={document.id} 
                        document={document} 
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) return <SkeletonLoader type="card" count={6} />;
    if (error) return <p style={{ textAlign: 'center', color: '#b91c1c' }}>{error}</p>;
    if (!filteredAndSortedDocuments || filteredAndSortedDocuments.length === 0) {
      return searchTerm ? 
        <EmptyState message={`No se encontraron documentos para "${searchTerm}"`} /> :
        <EmptyState message="¡No hay documentos disponibles!" />;
    }
    
    // Sempre mostrar agrupamento, mesmo com uma categoria
    if (sortedCategories.length === 0) {
      return <EmptyState message="¡No hay documentos disponibles!" />;
    }
    
    // Sempre mostrar agrupamento em acordeão
    return (
      <div className={pageStyles.groupedContainer}>
        <AccordionLayout 
          groupedContent={groupedContent} 
          sortedCategories={sortedCategories}
          viewMode={viewMode}
        />
      </div>
    );
  };

  return (
    <div className={pageStyles.pageContainer}>
      <div className={pageStyles.pageHeader}>
        <h2 className={pageStyles.pageTitle}>
          Actividades y Documentos
        </h2>
        <p className={pageStyles.pageSubtitle}>
          {documents ? `${filteredAndSortedDocuments.length} de ${documents.length} documentos` : 'Cargando...'}
        </p>
      </div>

      <div className={pageStyles.controls}>
        <div className={pageStyles.searchContainer}>
          <FaSearch className={pageStyles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar documentos..."
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
    </div>
  );
}

export default DocumentPage;