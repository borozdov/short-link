import type { ReactNode } from 'react';
import { ShortenPage } from './ShortenPage';
import { StatsPage } from './StatsPage';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';

export interface RouteConfig {
  path: string;
  element: ReactNode;
}

export const routesConfig: RouteConfig[] = [
  { path: '/', element: <ShortenPage /> },
  { path: '/s/:secretToken', element: <StatsPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
];
