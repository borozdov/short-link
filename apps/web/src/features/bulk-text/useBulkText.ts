import { useState } from 'react';
import type { BulkTextRequest, BulkTextResponse } from '@short-link/shared';
import { ApiError, shortenBulkText } from '../../api/client';
import { useToast } from '../../primitives/useToast';

export function useBulkText() {
  const [result, setResult] = useState<BulkTextResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function submit(payload: BulkTextRequest): Promise<void> {
    setLoading(true);
    try {
      const response = await shortenBulkText(payload);
      setResult(response);
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return { result, loading, submit };
}
