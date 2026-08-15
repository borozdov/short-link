import { useEffect, useState } from 'react';
import { ApiError, getUserLinkStats, type UserLinkStats } from '../../api/client';

export function useUserLinkStats(id: string) {
  const [data, setData] = useState<UserLinkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getUserLinkStats(id)
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
  }, [id]);

  return { data, loading, notFound };
}
