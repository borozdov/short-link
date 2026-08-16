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
      showToast('API-ключ отозван');
      onRevoked();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Что-то пошло не так');
    } finally {
      setLoading(false);
    }
  }

  return { loading, submit };
}
