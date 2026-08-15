import { useEffect, useState } from 'react';
import type { LinkStatsResponse } from '@short-link/shared';
import { ApiError, getLinkStats } from '../../api/client';

export function useLinkStats(secretToken: string) {
  const [data, setData] = useState<LinkStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getLinkStats(secretToken)
      .then((response) => {
        if (!cancelled) {
          setData(response);
        }
      })
      .catch((error) => {
        if (!cancelled && error instanceof ApiError && error.code === 'NOT_FOUND') {
          setNotFound(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [secretToken]);

  return { data, loading, notFound };
}
