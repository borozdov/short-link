import { createContext } from 'react';
import type { LoginRequest, RegisterRequest, User } from '@short-link/shared';

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  register: (payload: RegisterRequest) => Promise<void>;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
