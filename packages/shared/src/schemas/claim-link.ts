import { z } from 'zod';

export const ClaimLinkRequestSchema = z.object({
  secretToken: z.string().min(1, 'Secret token is required'),
});

export type ClaimLinkRequest = z.infer<typeof ClaimLinkRequestSchema>;
