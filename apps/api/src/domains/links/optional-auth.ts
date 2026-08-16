import type { NextFunction, Request, Response } from 'express';
import { resolveApiKeyUser } from '../../middleware/api-key-guard.js';
import { ACCESS_COOKIE_NAME, verifyAccessToken } from '../auth/tokens.js';

const BEARER_PREFIX = 'Bearer ';

// Optional dual auth for POST /api/links: a stale/invalid cookie falls back to anonymous
// (ambient browser state, not a deliberate credential); a present-but-bad Authorization
// header is a hard failure — the caller explicitly asserted a credential and got it wrong.
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const cookieToken = req.cookies?.[ACCESS_COOKIE_NAME] as string | undefined;
  if (cookieToken) {
    try {
      const payload = verifyAccessToken(cookieToken);
      req.user = { id: payload.sub, role: payload.role };
      next();
      return;
    } catch {
      // Fall through to the Bearer/anonymous checks below.
    }
  }

  const authHeader = req.get('authorization');
  if (authHeader?.startsWith(BEARER_PREFIX)) {
    const rawKey = authHeader.slice(BEARER_PREFIX.length);
    req.user = await resolveApiKeyUser(rawKey);
    next();
    return;
  }

  next();
}
