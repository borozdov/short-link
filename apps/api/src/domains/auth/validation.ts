import type { z } from 'zod';
import { HttpError } from '../../middleware/http-error.js';

// Shared by register and login — both schemas validate the same two fields.
export function throwForValidationError(error: z.ZodError): never {
  const field = error.issues[0]?.path[0];
  const message = error.issues[0]?.message ?? 'Некорректный запрос';

  if (field === 'email') {
    throw new HttpError(400, 'INVALID_EMAIL', message);
  }
  throw new HttpError(400, 'INVALID_PASSWORD', message);
}
