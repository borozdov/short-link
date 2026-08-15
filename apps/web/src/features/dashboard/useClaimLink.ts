import { useState } from 'react';
import type { ClaimLinkRequest } from '@short-link/shared';
import { ApiError, claimLink } from '../../api/client';
import { useToast } from '../../primitives/useToast';

export function useClaimLink(onClaimed: () => void) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function submit(payload: ClaimLinkRequest): Promise<void> {
    setLoading(true);
    try {
      await claimLink(payload);
      showToast('Link claimed');
      onClaimed();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return { loading, submit };
}
