import { useEffect, useState } from 'react';
import { modelService } from '@/lib/database';

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

export function useActiveModels() {
  const [models, setModels] = useState<ModelOption[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await modelService.getAllModels();
        if (isMounted) {
          // modelService 이미 name, provider 필드 포함
          setModels(data.map(({ id, name, provider }) => ({ id, name, provider })));
        }
      } catch (err) {
        console.error('Failed to load models', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return models;
} 