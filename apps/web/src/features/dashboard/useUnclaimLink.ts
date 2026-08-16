import { useState } from 'react';
import { ApiError, unclaimLink } from '../../api/client';
import { useToast } from '../../primitives/useToast';

export function useUnclaimLink(onUnclaimed: () => void) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function submit(id: string): Promise<void> {
    setLoading(true);
    try {
      await unclaimLink(id);
      showToast('Ссылка убрана из личного кабинета');
      onUnclaimed();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Что-то пошло не так');
    } finally {
      setLoading(false);
    }
  }

  return { loading, submit };
}
