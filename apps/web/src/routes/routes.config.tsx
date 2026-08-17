import type { ReactNode } from 'react';
import { ShortenPage } from './ShortenPage';
import { StatsPage } from './StatsPage';
import { BulkTextPage } from './BulkTextPage';

export interface RouteConfig {
  path: string;
  element: ReactNode;
}

export const routesConfig: RouteConfig[] = [
  { path: '/', element: <ShortenPage /> },
  { path: '/bulk-text', element: <BulkTextPage /> },
  { path: '/s/:secretToken', element: <StatsPage /> },
];
