import { z } from 'zod';

export const ClaimLinkRequestSchema = z.object({
  secretToken: z.string().min(1, 'Введите секретный токен'),
});

export type ClaimLinkRequest = z.infer<typeof ClaimLinkRequestSchema>;
