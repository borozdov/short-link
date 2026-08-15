import { createContext } from 'react';
import type { Theme } from '@short-link/shared';

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
