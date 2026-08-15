import { useState } from 'react';
import type { CreateLinkRequest, CreateLinkResponse } from '@short-link/shared';
import { ApiError, createLink } from '../../api/client';
import { useToast } from '../../primitives/useToast';

export function useCreateLink() {
  const [result, setResult] = useState<CreateLinkResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function submit(payload: CreateLinkRequest): Promise<void> {
    setLoading(true);
    try {
      const response = await createLink(payload);
      setResult(response);
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return { result, loading, submit };
}
