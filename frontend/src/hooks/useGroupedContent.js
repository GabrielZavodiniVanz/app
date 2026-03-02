import { useMemo } from 'react';

/**
 * Hook personalizado para agrupar conteúdo (vídeos e documentos) por categoria_produto
 * @param {Array} videos - Array de vídeos
 * @param {Array} documents - Array de documentos
 * @returns {Object} - Objeto com conteúdo agrupado por categoria
 */
export const useGroupedContent = (videos = [], documents = []) => {
  return useMemo(() => {
    // Mapeamento de categorias para nomes amigáveis
    const categoryNames = {
      PRINCIPAL: 'KIT NIÑOS DE LUZ - RUTINAS CON AMOR Y FE',
      PRINCIPAL_VERTICAL: 'KIT NIÑOS DE LUZ - RUTINAS CON AMOR Y FE (Horizontal)',
      PRODUTO_1: 'PACK EXPANSIÓN - MOTIVACIÓN Y JUEGO',
      PRODUTO_2: 'PACK EXPANSIÓN 2 - VALORES Y FE',
      PRODUTO_3: 'KIT ESENCIAL - RUTINAS SIN GRITOS'
    };

    // Função para agrupar por categoria
    const groupByCategory = (items) => {
      return items.reduce((groups, item) => {
        const category = item.categoria_produto || 'PRINCIPAL';
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(item);
        return groups;
      }, {});
    };

    // Agrupar vídeos e documentos
    const groupedVideos = groupByCategory(videos);
    const groupedDocuments = groupByCategory(documents);

    // Obter todas as categorias presentes
    const allCategories = new Set([
      ...Object.keys(groupedVideos),
      ...Object.keys(groupedDocuments)
    ]);

    // Criar estrutura final agrupada
    const groupedContent = {};

    allCategories.forEach(category => {
      groupedContent[category] = {
        name: categoryNames[category] || category,
        videos: groupedVideos[category] || [],
        documents: groupedDocuments[category] || [],
        totalItems: (groupedVideos[category]?.length || 0) + (groupedDocuments[category]?.length || 0)
      };
    });

    // Ordenar categorias por hierarquia (PRINCIPAL primeiro, depois PRODUTO_1, etc.)
    const categoryOrder = ['PRINCIPAL', 'PRINCIPAL_VERTICAL', 'PRODUTO_1', 'PRODUTO_2', 'PRODUTO_3'];
    const sortedCategories = Object.keys(groupedContent).sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);

      // Se ambos estão na ordem definida, usar a ordem
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      // Se apenas um está na ordem, priorizar ele
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      // Se nenhum está na ordem, usar ordem alfabética
      return a.localeCompare(b);
    });

    return {
      groupedContent,
      sortedCategories,
      totalCategories: sortedCategories.length,
      totalItems: videos.length + documents.length
    };
  }, [videos, documents]);
};

export default useGroupedContent;
