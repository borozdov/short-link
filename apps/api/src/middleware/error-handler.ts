import type { NextFunction, Request, Response } from 'express';
import type { ApiResponse } from '@short-link/shared';
import { HttpError } from './http-error.js';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof HttpError) {
    const body: ApiResponse<never> = { error: { code: error.code, message: error.message } };
    res.status(error.status).json(body);
    return;
  }

  console.error(error);
  const body: ApiResponse<never> = {
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  };
  res.status(500).json(body);
}
