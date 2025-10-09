import React, { useState, useEffect } from 'react';
import { getAccessLevels } from '../services/contentService';
import styles from './AccessLevelSelector.module.css';

function AccessLevelSelector({ selectedLevel = 'BASICO', onChange, disabled = false }) {
  const [accessLevels, setAccessLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccessLevels();
  }, []);

  const loadAccessLevels = async () => {
    try {
      const response = await getAccessLevels();
      setAccessLevels(response.accessLevels || []);
    } catch (error) {
      console.error('Erro ao carregar níveis de acesso:', error);
      // Fallback com níveis padrão
      setAccessLevels([
        { value: 'BASICO', label: 'Básico', hierarchy: 1 },
        { value: 'INTERMEDIARIO', label: 'Intermediário', hierarchy: 2 },
        { value: 'AVANCADO', label: 'Avançado', hierarchy: 3 },
        { value: 'ACESSO_COMPLETO', label: 'Acesso Completo', hierarchy: 4 }
      ]);
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
        <label className={styles.label}>Níveis de Acesso</label>
        <div className={styles.loading}>Carregando níveis de acesso...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        Níveis de Acesso
        <span className={styles.helpText}>
          Selecione quais níveis de acesso poderão visualizar este conteúdo
        </span>
      </label>
      
      <div className={styles.selector}>
        <div className={styles.levelsContainer}>
          {accessLevels
            .sort((a, b) => a.hierarchy - b.hierarchy)
            .map(level => (
              <label key={level.value} className={styles.levelLabel}>
                <input
                  type="radio"
                  name="accessLevel"
                  value={level.value}
                  checked={selectedLevel === level.value}
                  onChange={() => handleLevelChange(level.value)}
                  disabled={disabled}
                  className={styles.radio}
                />
                <span className={styles.levelText}>
                  {level.label}
                  <span className={styles.hierarchy}>
                    (Nível {level.hierarchy})
                  </span>
                </span>
              </label>
            ))}
        </div>
      </div>

      <div className={styles.selectedInfo}>
        ✅ Nível selecionado: {
          accessLevels.find(l => l.value === selectedLevel)?.label || 'Básico'
        }
      </div>
    </div>
  );
}

export default AccessLevelSelector;
