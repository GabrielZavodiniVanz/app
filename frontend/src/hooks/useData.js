import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Um Hook customizado para buscar dados de qualquer função de serviço da API.
 * @param {Function} apiFunc - A função do serviço que busca os dados (ex: getVideos).
 * @param {any} key - Uma "chave" opcional. Se a chave mudar, o hook buscará os dados novamente.
 * @returns {object} - Um objeto contendo { data, loading, error }.
 */
function useData(apiFunc, key = 0) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    // Só busca dados se houver token (usuário logado)
    if (!token) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunc();
        setData(result);
      } catch (err) {
        setError('Ocurrió un error al cargar los datos.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [key, token]); // Adiciona token como dependência

  return { data, loading, error };
}

export default useData;