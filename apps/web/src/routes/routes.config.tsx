import type { ReactNode } from 'react';
import { ShortenPage } from './ShortenPage';
import { StatsPage } from './StatsPage';
import { BulkTextPage } from './BulkTextPage';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { LinkStatsPage } from '../features/dashboard/LinkStatsPage';

export interface RouteConfig {
  path: string;
  element: ReactNode;
  protected?: boolean;
}

export const routesConfig: RouteConfig[] = [
  { path: '/', element: <ShortenPage /> },
  { path: '/bulk-text', element: <BulkTextPage /> },
  { path: '/s/:secretToken', element: <StatsPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/dashboard', element: <DashboardPage />, protected: true },
  { path: '/dashboard/links/:id', element: <LinkStatsPage />, protected: true },
];
