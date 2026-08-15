import { useCallback, useState, type ReactNode } from 'react';
import type { Theme } from '@short-link/shared';
import { ThemeContext } from './ThemeContext';

function readInitialTheme(): Theme {
  const attr = document.documentElement.dataset.theme;
  return attr === 'titan' ? 'titan' : 'obsidian';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'obsidian' ? 'titan' : 'obsidian';
      document.documentElement.dataset.theme = next;
      localStorage.setItem('theme', next);
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
