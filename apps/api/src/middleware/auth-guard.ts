import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './http-error.js';
import { ACCESS_COOKIE_NAME, verifyAccessToken } from '../domains/auth/tokens.js';

export function authGuard(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[ACCESS_COOKIE_NAME] as string | undefined;
  if (!token) {
    next(new HttpError(401, 'UNAUTHORIZED', 'Требуется авторизация'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new HttpError(401, 'UNAUTHORIZED', 'Токен недействителен или истёк'));
  }
}
