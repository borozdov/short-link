import type { NextFunction, Request, Response } from 'express';

// Stub for Task 3. No route in this track requires auth (link creation is anonymous-only).
// Kept as a pass-through so Task 3 fills in real JWT verification here without touching call sites.
export function authGuard(_req: Request, _res: Response, next: NextFunction): void {
  next();
}
