import { useCallback, useEffect, useState } from 'react';
import type { Link } from '@short-link/shared';
import { getUserLinks } from '../../api/client';

export function useUserLinks() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserLinks();
      setLinks(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    getUserLinks()
      .then((data) => {
        if (!cancelled) setLinks(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { links, loading, refresh };
}
