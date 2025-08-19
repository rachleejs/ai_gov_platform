import { useEffect, useState } from 'react';
import { modelService } from '@/lib/database';

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

export function useActiveModels() {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const data = await modelService.getAllModels();
        if (isMounted) {
          // modelService 이미 name, provider 필드 포함
          setModels(data.map(({ id, name, provider }) => ({ id, name, provider })));
        }
      } catch (err) {
        console.error('Failed to load models', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return { models, isLoading };
} 