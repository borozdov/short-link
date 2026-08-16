import { useCallback, useEffect, useState } from 'react';
import type { ApiKey } from '@short-link/shared';
import { getApiKeys } from '../../api/client';

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getApiKeys();
      setApiKeys(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    getApiKeys()
      .then((data) => {
        if (!cancelled) setApiKeys(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { apiKeys, loading, refresh };
}
