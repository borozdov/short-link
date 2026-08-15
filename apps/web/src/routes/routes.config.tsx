import type { ReactNode } from 'react';
import { ShortenPage } from './ShortenPage';

export interface RouteConfig {
  path: string;
  element: ReactNode;
}

export const routesConfig: RouteConfig[] = [{ path: '/', element: <ShortenPage /> }];
