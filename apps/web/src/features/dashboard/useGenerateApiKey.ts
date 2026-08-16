import { useState } from 'react';
import type { ApiKeyGenerateResponse } from '@short-link/shared';
import { ApiError, generateApiKey } from '../../api/client';
import { useToast } from '../../primitives/useToast';

export function useGenerateApiKey(onGenerated: () => void) {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<ApiKeyGenerateResponse | null>(null);
  const { showToast } = useToast();

  async function submit(): Promise<void> {
    setLoading(true);
    try {
      const result = await generateApiKey();
      setGenerated(result);
      onGenerated();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Что-то пошло не так');
    } finally {
      setLoading(false);
    }
  }

  return { loading, generated, submit };
}
