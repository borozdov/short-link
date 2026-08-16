import { useState } from 'react';
import { ApiError, revokeApiKey } from '../../api/client';
import { useToast } from '../../primitives/useToast';

export function useRevokeApiKey(onRevoked: () => void) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function submit(id: string): Promise<void> {
    setLoading(true);
    try {
      await revokeApiKey(id);
      showToast('API key revoked');
      onRevoked();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return { loading, submit };
}
