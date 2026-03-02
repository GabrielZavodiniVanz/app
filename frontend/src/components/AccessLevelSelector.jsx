import React, { useState, useEffect } from 'react';
import { getContentCategories } from '../services/contentService';
import styles from './AccessLevelSelector.module.css';

function AccessLevelSelector({ selectedLevel = 'PRINCIPAL', onChange, disabled = false }) {
  const [accessLevels, setAccessLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccessLevels();
  }, []);

  const ensureVerticalOption = (categories = []) => {
    const hasVertical = categories.some(cat => cat.value === 'PRINCIPAL_VERTICAL');
    if (hasVertical) return categories;

    const verticalOption = {
      value: 'PRINCIPAL_VERTICAL',
      label: 'KIT NIÑOS DE LUZ - RUTINAS CON AMOR Y FE (Horizontal)'
    };

    const principalIndex = categories.findIndex(cat => cat.value === 'PRINCIPAL');
    if (principalIndex !== -1) {
      const updated = [...categories];
      updated.splice(principalIndex + 1, 0, verticalOption);
      return updated;
    }

    return [verticalOption, ...categories];
  };

  const loadAccessLevels = async () => {
    try {
      console.log('🔄 Carregando categorias de conteúdo...');
      const response = await getContentCategories();
      console.log('📡 Resposta da API:', response);
      console.log('📋 Categorias de conteúdo recebidas:', response.categories);
      setAccessLevels(ensureVerticalOption(response.categories));
    } catch (error) {
      console.error('❌ Erro ao carregar categorias de conteúdo:', error);
      console.log('🔄 Usando fallback...');
      // Fallback com categorias padrão
      console.log('🔄 Usando fallback com novas categorias');
      setAccessLevels(ensureVerticalOption([
        { value: 'PRINCIPAL', label: 'Conteúdo do Produto Principal' },
        { value: 'PRODUTO_1', label: 'Conteúdo do PACK EXPANSIÓN - MOTIVACIÓN Y JUEGO' },
        { value: 'PRODUTO_2', label: 'Conteúdo do PACK EXPANSIÓN 2 - VALORES Y FE' },
        { value: 'PRODUTO_3', label: 'Conteúdo do KIT ESENCIAL - RUTINAS SIN GRITOS' }
      ]));
    } finally {
      setLoading(false);
    }
  };

  const handleLevelChange = (levelValue) => {
    if (disabled) return;
    onChange(levelValue);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <label className={styles.label}>Categoria do Conteúdo</label>
        <div className={styles.loading}>Carregando categorias...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        Categoria do Conteúdo
        <span className={styles.helpText}>
          Selecione a qual produto este conteúdo pertence
        </span>
      </label>

      <div className={styles.selector}>
        <div className={styles.levelsContainer}>
          {accessLevels.map(level => (
            <label key={level.value} className={styles.levelLabel}>
              <input
                type="radio"
                name="categoria_produto"
                value={level.value}
                checked={selectedLevel === level.value}
                onChange={() => handleLevelChange(level.value)}
                disabled={disabled}
                className={styles.radio}
              />
              <span className={styles.levelText}>
                {level.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.selectedInfo}>
        ✅ Categoria selecionada: {
          accessLevels.find(l => l.value === selectedLevel)?.label || 'Conteúdo do Produto Principal'
        }
      </div>
    </div>
  );
}

export default AccessLevelSelector;
