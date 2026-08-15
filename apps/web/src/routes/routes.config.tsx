import type { ReactNode } from 'react';
import { ShortenPage } from './ShortenPage';
import { StatsPage } from './StatsPage';

export interface RouteConfig {
  path: string;
  element: ReactNode;
}

export const routesConfig: RouteConfig[] = [
  { path: '/', element: <ShortenPage /> },
  { path: '/s/:secretToken', element: <StatsPage /> },
];
