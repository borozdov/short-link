import type { Request, Response } from 'express';
import { clearAuthCookies } from './tokens.js';

export function logout(_req: Request, res: Response): void {
  clearAuthCookies(res);
  res.status(200).json({ data: null });
}
