import { z } from 'zod';

export const LinkStatsResponseSchema = z.object({
  uid: z.string(),
  shortUrl: z.string(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'DISABLED']),
  targetUrl: z.string(),
  createdAt: z.string(),
  expiresAt: z.string().nullable(),
  clickCount: z.number(),
  clicks: z.array(
    z.object({
      occurredAt: z.string(),
      referrer: z.string().nullable(),
    }),
  ),
});

export type LinkStatsResponse = z.infer<typeof LinkStatsResponseSchema>;
