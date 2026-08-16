import { useState } from 'react';
import type { RegisterRequest } from '@short-link/shared';
import { ApiError } from '../../api/client';
import { useToast } from '../../primitives/useToast';
import { useAuth } from './useAuth';

export function useRegister() {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const auth = useAuth();

  async function submit(payload: RegisterRequest): Promise<void> {
    setLoading(true);
    try {
      await auth.register(payload);
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Что-то пошло не так');
    } finally {
      setLoading(false);
    }
  }

  return { loading, submit };
}
