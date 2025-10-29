import { useState, useEffect, useCallback, useRef } from 'react';

// Hook customizado para encapsular a lógica de chamada de API, agora com verificação de montagem.
export function useMockApi<T,>(apiCall: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Ref para rastrear se o componente está montado
  const isMountedRef = useRef(true);
  useEffect(() => {
    // Define como montado na montagem inicial
    isMountedRef.current = true;
    // Retorna uma função de limpeza que define como desmontado
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    // Garante que o estado de loading só seja alterado em um componente montado
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }
    
    try {
      const result = await apiCall();
      // Apenas atualiza o estado se o componente ainda estiver montado
      if (isMountedRef.current) {
        setData(result);
      }
    } catch (e) {
      if (isMountedRef.current) {
        setError(e as Error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiCall]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}